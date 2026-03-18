import { HardDrive } from "lucide-react";
import { useState, useEffect } from "react";

interface Disk {
  id:           string;
  name:         string;
  location:     string;
  size_gb:      number;
  status:       string;
  monthly_cost: number;
  waste_type:   string;
}

export default function DisksStorage() {
  const [disks,   setDisks]   = useState<Disk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchDisks() {
      try {
        const res  = await fetch("http://localhost:3001/api/resources");
        const data = await res.json();
        setDisks(data.filter((r: Disk) => r.type === "Managed Disk"));
      } catch (err) {
        setError("erreur to connect backend");
      } finally {
        setLoading(false);
      }
    }
    fetchDisks();
  }, []);

  const unattached = disks.filter(d => d.waste_type === "unattached");
  const totalWaste = unattached.reduce((s, d) => s + (d.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Disks & Storage
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading..." : `${disks.length} disks · ${unattached.length} unattached · ~$${totalWaste}/mo potential savings`}
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
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Location</th>
              <th className="p-3 font-medium">Size</th>
              <th className="p-3 font-medium">Attached</th>
              <th className="p-3 font-medium">Cost/mo</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : disks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No disks found — run a scan first
                </td>
              </tr>
            ) : (
              disks.map((disk) => (
                <tr key={disk.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="p-3 font-medium text-foreground font-mono text-xs">{disk.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{disk.location}</td>
                  <td className="p-3 text-muted-foreground text-xs">{disk.size_gb} GB</td>
                  <td className="p-3">
                    {disk.status === "attached" ? (
                      <span className="text-green-400 text-xs">Yes</span>
                    ) : (
                      <span className="text-red-400 text-xs font-medium">No</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-xs">${disk.monthly_cost}/mo</td>
                  <td className="p-3">
                    {disk.waste_type === "unattached" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-red-400">
                        Unattached
                      </span>
                    ) : (
                      <span className="text-xs text-green-400">Active</span>
                    )}
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