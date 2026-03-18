// routes/api.js — كل الـ API Endpoints
const express = require('express');
const router  = express.Router();
const { getDB, save } = require('../db');
const {
  getVirtualMachines,
  getManagedDisks,
  getPublicIPs,
  analyzeWaste,
} = require('../services/azure');

const {
  getAKSClusters,
  analyzeAKSWaste,
  calculateAKSScore,
  estimateClusterCost,
} = require('../services/aks');
// ─────────────────────────────────────────
// GET /api/summary
// ─────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const db = await getDB();

    const totalResult = db.exec(`
      SELECT ROUND(SUM(monthly_cost), 2) AS total_monthly_cost, COUNT(*) AS total_items
      FROM resources
    `);

    const wasteResult = db.exec(`
      SELECT ROUND(SUM(monthly_cost), 2) AS waste_cost, COUNT(*) AS waste_items
      FROM resources
      WHERE waste_type IN ('idle', 'unattached', 'unused_ip')
    `);

    const byTypeResult = db.exec(`
      SELECT waste_type, COUNT(*) AS count, ROUND(SUM(monthly_cost), 2) AS cost
      FROM resources
      WHERE waste_type IN ('idle', 'unattached', 'unused_ip')
      GROUP BY waste_type
      ORDER BY cost DESC
    `);

    const lastScanResult = db.exec(`
      SELECT scanned_at FROM scan_history ORDER BY id DESC LIMIT 1
    `);

    const totalRow  = totalResult[0]?.values[0];
    const wasteRow  = wasteResult[0]?.values[0];
    const breakdown = byTypeResult[0]?.values?.map(row => ({
      waste_type: row[0], count: row[1], cost: row[2],
    })) || [];

    res.json({
      totalMonthlyCost: totalRow?.[0] || 0,
      wasteMonthlyCost: wasteRow?.[0] || 0,
      totalYearlyCost:  Math.round((wasteRow?.[0] || 0) * 12),
      totalItems:       wasteRow?.[1] || 0,
      totalResources:   totalRow?.[1] || 0,
      breakdown,
      lastScannedAt: lastScanResult[0]?.values[0]?.[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/waste
// ─────────────────────────────────────────
router.get('/waste', async (req, res) => {
  try {
    const db = await getDB();
    const { type, severity } = req.query;

    let query = `SELECT * FROM resources WHERE waste_type IN ('idle', 'unattached', 'unused_ip')`;
    if (type)     query += ` AND waste_type = '${type}'`;
    if (severity) query += ` AND severity = '${severity}'`;
    query += ' ORDER BY monthly_cost DESC';

    const result  = db.exec(query);
    const columns = result[0]?.columns || [];
    const rows    = result[0]?.values?.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) || [];

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/resources
// ─────────────────────────────────────────
router.get('/resources', async (req, res) => {
  try {
    const db      = await getDB();
    const result  = db.exec('SELECT * FROM resources ORDER BY monthly_cost DESC');
    const columns = result[0]?.columns || [];
    const rows    = result[0]?.values?.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) || [];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/history
// ─────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const db      = await getDB();
    const result  = db.exec('SELECT * FROM scan_history ORDER BY id DESC LIMIT 30');
    const columns = result[0]?.columns || [];
    const rows    = result[0]?.values?.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    }) || [];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/scan
// ─────────────────────────────────────────
router.post('/scan', async (req, res) => {
  res.json({ message: '🔍 Scan started — check /api/waste in 30 seconds' });
  console.log('\n🔍 Starting Azure scan...');

  try {
    const db = await getDB();

    const [vms, disks, ips] = await Promise.all([
      getVirtualMachines(),
      getManagedDisks(),
      getPublicIPs(),
    ]);

    const allItems = analyzeWaste(vms, disks, ips);
    const now      = new Date().toISOString();

    for (const item of allItems) {
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

    const wasteItems = allItems.filter(i => ['idle','unattached','unused_ip'].includes(i.waste_type));
    const totalCost  = wasteItems.reduce((s, i) => s + (i.monthly_cost || 0), 0);

    db.run(
      'INSERT INTO scan_history (scanned_at, total_waste_cost, items_found, vms_scanned, disks_scanned) VALUES (?, ?, ?, ?, ?)',
      [now, totalCost, wasteItems.length, vms.length, disks.length]
    );

    save();
    console.log(`✅ Scan complete — ${allItems.length} total, ${wasteItems.length} waste items\n`);

  } catch (err) {
    console.error('❌ Scan failed:', err.message);
  }
});

// ─────────────────────────────────────────
// GET /api/settings
// ─────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const db     = await getDB();
    const result = db.exec('SELECT key, value FROM settings');
    const rows   = result[0]?.values ?? [];
    const settings = {};
    rows.forEach(([key, value]) => settings[key] = value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/settings
// ─────────────────────────────────────────
router.post('/settings', async (req, res) => {
  try {
    const db = await getDB();
    const { tenantId, clientId, clientSecret, subscriptionId, scanInterval } = req.body;

    const upsert = (key, value) => {
      if (value !== undefined && value !== '') {
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
      }
    };

    upsert('tenantId',       tenantId);
    upsert('clientId',       clientId);
    upsert('clientSecret',   clientSecret);
    upsert('subscriptionId', subscriptionId);
    upsert('scanInterval',   scanInterval);

    // تحديث متغيرات البيئة مباشرة بدون إعادة تشغيل السيرفر
    if (tenantId)       process.env.AZURE_TENANT_ID       = tenantId;
    if (clientId)       process.env.AZURE_CLIENT_ID       = clientId;
    if (clientSecret)   process.env.AZURE_CLIENT_SECRET   = clientSecret;
    if (subscriptionId) process.env.AZURE_SUBSCRIPTION_ID = subscriptionId;

    save();
    console.log('✅ Settings updated from dashboard');
    res.json({ message: '✅ Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// أضف هذا في أول api.js بعد الـ requires الموجودة:
// const { getAKSClusters, analyzeAKSWaste, calculateAKSScore, estimateClusterCost } = require('../services/aks');
// ─────────────────────────────────────────

// GET /api/aks
// ملخص AKS للداشبورد الرئيسي والصفحة المنفصلة
router.get('/aks', async (req, res) => {
  try {
    const clusters        = await getAKSClusters();
    const recommendations = analyzeAKSWaste(clusters);
    const score           = calculateAKSScore(clusters, recommendations);

    const totalCost = clusters.reduce((s, c) => {
      return s + c.nodePools.reduce((ps, p) => {
        const prices = {
          'Standard_D2s_v3': 70,  'Standard_D4s_v3': 140,
          'Standard_D8s_v3': 280, 'Standard_B2s':     35,
          'Standard_B4ms':   75,  'Standard_DS2_v2':  70,
          'Standard_DS3_v2': 140,
        };
        return ps + (prices[p.vmSize] || 80) * p.count;
      }, 0);
    }, 0);

    const idlePools = clusters.reduce((s, c) =>
      s + c.nodePools.filter(p => p.powerState === 'Stopped').length, 0);

    const wasteCost = recommendations.reduce((s, r) => s + (r.monthlyCost || 0), 0);

    res.json({
      // ملخص للداشبورد الرئيسي
      summary: {
        clustersCount:    clusters.length,
        totalNodes:       clusters.reduce((s, c) => s + c.nodeCount, 0),
        idleNodePools:    idlePools,
        totalMonthlyCost: Math.round(totalCost),
        wasteEstimate:    Math.round(wasteCost),
        recommendationsCount: recommendations.length,
      },
      // تفاصيل للصفحة المنفصلة
      clusters,
      recommendations,
      score,
    });
  } catch (err) {
    console.error('AKS scan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/alerts
// يولّد التنبيهات تلقائياً من البيانات الحالية
// ─────────────────────────────────────────
router.get('/alerts', async (req, res) => {
  try {
    const db      = await getDB();
    const alerts  = [];

    // 1. VM idle جديد مكتشف
    const idleVMs = db.exec(`
      SELECT name, monthly_cost, last_scanned
      FROM resources
      WHERE waste_type = 'idle' AND type = 'Virtual Machine'
      ORDER BY last_scanned DESC
    `);
    const idleCols = idleVMs[0]?.columns || [];
    const idleRows = idleVMs[0]?.values  || [];
    idleRows.forEach(row => {
      const obj = {};
      idleCols.forEach((col, i) => obj[col] = row[i]);
      alerts.push({
        id:        `idle-${obj.name}`,
        type:      'idle_vm',
        severity:  'high',
        title:     `Idle VM detected: ${obj.name}`,
        message:   `This VM has been idle and is costing $${obj.monthly_cost}/mo`,
        resource:  obj.name,
        cost:      obj.monthly_cost,
        time:      obj.last_scanned,
        read:      false,
      });
    });

    // 2. Disk غير مرتبط
    const unattachedDisks = db.exec(`
      SELECT name, monthly_cost, last_scanned
      FROM resources
      WHERE waste_type = 'unattached' AND type = 'Managed Disk'
      ORDER BY last_scanned DESC
    `);
    const diskCols = unattachedDisks[0]?.columns || [];
    const diskRows = unattachedDisks[0]?.values  || [];
    diskRows.forEach(row => {
      const obj = {};
      diskCols.forEach((col, i) => obj[col] = row[i]);
      alerts.push({
        id:        `disk-${obj.name}`,
        type:      'unattached_disk',
        severity:  'medium',
        title:     `Unattached disk: ${obj.name}`,
        message:   `Disk is not attached to any VM — costing $${obj.monthly_cost}/mo`,
        resource:  obj.name,
        cost:      obj.monthly_cost,
        time:      obj.last_scanned,
        read:      false,
      });
    });

    // 3. تجاوز حد التكلفة ($100/mo للـ waste)
    const wasteTotal = db.exec(`
      SELECT ROUND(SUM(monthly_cost), 2) AS total
      FROM resources
      WHERE waste_type IN ('idle', 'unattached', 'unused_ip')
    `);
    const wasteAmount = wasteTotal[0]?.values[0]?.[0] || 0;
    if (wasteAmount > 100) {
      alerts.push({
        id:        'cost-threshold',
        type:      'cost_threshold',
        severity:  'high',
        title:     `Waste exceeds $100/mo threshold`,
        message:   `Current waste is $${wasteAmount}/mo — action required`,
        resource:  null,
        cost:      wasteAmount,
        time:      new Date().toISOString(),
        read:      false,
      });
    }

    // 4. AKS cluster متوقف (من الـ resources إذا موجود)
    const aksIdle = db.exec(`
      SELECT name, monthly_cost, last_scanned
      FROM resources
      WHERE type = 'AKS Cluster' AND status = 'Stopped'
    `);
    const aksCols = aksIdle[0]?.columns || [];
    const aksRows = aksIdle[0]?.values  || [];
    aksRows.forEach(row => {
      const obj = {};
      aksCols.forEach((col, i) => obj[col] = row[i]);
      alerts.push({
        id:        `aks-${obj.name}`,
        type:      'aks_stopped',
        severity:  'high',
        title:     `AKS cluster stopped: ${obj.name}`,
        message:   `Stopped cluster still incurring costs — $${obj.monthly_cost}/mo`,
        resource:  obj.name,
        cost:      obj.monthly_cost,
        time:      obj.last_scanned,
        read:      false,
      });
    });

    // ترتيب حسب الأولوية
    const order = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
