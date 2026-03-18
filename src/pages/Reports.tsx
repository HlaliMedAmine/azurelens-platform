import { FileText, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ScanHistory {
  id:               number;
  scanned_at:       string;
  total_waste_cost: number;
  items_found:      number;
  vms_scanned:      number;
  disks_scanned:    number;
}

export default function Reports() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res  = await fetch("http://localhost:3001/api/history");
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError("تعذّر الاتصال بالـ Backend");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const totalSaved = history.reduce((s, h) => s + (h.total_waste_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Reports
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading..." : `${history.length} scans completed · $${totalSaved.toFixed(2)} total waste identified`}
        </p>
      </div>

      {error && (
        <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-lg border border-red-800">
          ⚠️ {error}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Scan</th>
              <th className="p-3 font-medium">Date & Time</th>
              <th className="p-3 font-medium">Resources</th>
              <th className="p-3 font-medium">Waste Found</th>
              <th className="p-3 font-medium">Waste Cost</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No scans yet — run your first scan
                </td>
              </tr>
            ) : (
              history.map((h, i) => (
                <tr key={h.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="p-3 font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    Scan #{history.length - i}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(h.scanned_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {h.vms_scanned} VMs · {h.disks_scanned} Disks
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-red-400">
                      {h.items_found} items
                    </span>
                  </td>
                  <td className="p-3 font-medium text-xs text-green-400">
                    ${h.total_waste_cost?.toFixed(2)}/mo
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}