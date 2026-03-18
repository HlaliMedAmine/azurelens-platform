// ============================================
// AzureLens Backend — نقطة البداية
// شغّل المشروع بـ: node index.js
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// السماح للـ Frontend (Lovable) بالاتصال
app.use(cors());
app.use(express.json());

// كل الـ routes تبدأ بـ /api
app.use('/api', apiRoutes);

// صفحة بسيطة للتأكد أن الـ server يعمل
app.get('/', (req, res) => {
  res.json({
    status: '✅ AzureLens Backend is running',
    version: '1.0.0',
    endpoints: {
      summary:  'GET  /api/summary',
      waste:    'GET  /api/waste',
      resources:'GET  /api/resources',
      scan:     'POST /api/scan',
      history:  'GET  /api/history',
    }
  });
});
// ─────────────────────────────────────────
// Scan تلقائي كل 24 ساعة
// ─────────────────────────────────────────
const { getVirtualMachines, getManagedDisks, getPublicIPs, analyzeWaste } = require('./services/azure');
const { getDB, save } = require('./db');

async function runAutoScan() {
  console.log('\n⏰ Auto scan started...');
  try {
    const db = await getDB();

    const [vms, disks, ips] = await Promise.all([
      getVirtualMachines(),
      getManagedDisks(),
      getPublicIPs(),
    ]);

    const wasteItems = analyzeWaste(vms, disks, ips);
    const now = new Date().toISOString();

    for (const item of wasteItems) {
      db.run(`
        INSERT OR REPLACE INTO resources
          (id, name, type, location, status, size, size_gb, idle_days, monthly_cost, waste_type, severity, last_scanned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id, item.name, item.type, item.location || null,
        item.status || null, item.size || null, item.size_gb || null,
        item.idle_days || 0, item.monthly_cost || 0,
        item.waste_type, item.severity, now,
      ]);
    }

    const totalCost = wasteItems.reduce((s, i) => s + (i.monthly_cost || 0), 0);
    db.run(
      'INSERT INTO scan_history (scanned_at, total_waste_cost, items_found, vms_scanned, disks_scanned) VALUES (?, ?, ?, ?, ?)',
      [now, totalCost, wasteItems.length, vms.length, disks.length]
    );

    save();
    console.log(`✅ Auto scan complete — ${wasteItems.length} waste items, $${totalCost.toFixed(2)}/month\n`);

  } catch (err) {
    console.error('❌ Auto scan failed:', err.message);
  }
}

// شغّل scan فور بدء السيرفر
runAutoScan();

// ثم كل 24 ساعة
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(runAutoScan, TWENTY_FOUR_HOURS);
app.listen(PORT, () => {
  console.log(`\n🚀 AzureLens Backend running on http://localhost:${PORT}\n`);
});
