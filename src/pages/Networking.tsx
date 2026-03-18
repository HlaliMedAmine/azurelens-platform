import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface NetworkResource {
  id:           string;
  name:         string;
  type:         string;
  location:     string;
  status:       string;
  monthly_cost: number;
  waste_type:   string;
}

export default function Networking() {
  const [resources, setResources] = useState<NetworkResource[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    async function fetchNetworking() {
      try {
        const res  = await fetch("http://localhost:3001/api/resources");
        const data = await res.json();
        setResources(data.filter((r: NetworkResource) => r.type === "Public IP"));
      } catch (err) {
        setError("تعذّر الاتصال بالـ Backend");
      } finally {
        setLoading(false);
      }
    }
    fetchNetworking();
  }, []);

  const unused     = resources.filter(r => r.waste_type === "unused_ip");
  const totalWaste = unused.reduce((s, r) => s + (r.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Networking
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading..." : `${resources.length} resources · ${unused.length} unused · ~$${totalWaste.toFixed(2)}/mo potential savings`}
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
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Location</th>
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
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No network resources found — run a scan first
                </td>
              </tr>
            ) : (
              resources.map((r) => {
                const isAttached = r.waste_type === "associated";
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium text-foreground font-mono text-xs">{r.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{r.type}</td>
                    <td className="p-3 text-muted-foreground text-xs">{r.location}</td>
                    <td className="p-3">
                      {isAttached ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-red-400 text-xs font-medium">No</span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-xs">${r.monthly_cost}/mo</td>
                    <td className="p-3">
                      {isAttached ? (
                        <span className="text-xs text-green-400">In Use</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-red-400">
                          Unused
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}