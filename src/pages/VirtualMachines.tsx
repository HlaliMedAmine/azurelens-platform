import { Server, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface VM {
  id:           string;
  name:         string;
  type:         string;
  location:     string;
  status:       string;
  size:         string;
  monthly_cost: number;
  waste_type:   string;
  severity:     string;
  idle_days:    number;
}

const statusColors: Record<string, string> = {
  running:     "text-green-400",
  stopped:     "text-red-400",
  deallocated: "text-yellow-400",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "running")     return <CheckCircle className="h-4 w-4 text-green-400" />;
  if (status === "stopped")     return <XCircle className="h-4 w-4 text-red-400" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
};

const getIssue = (vm: VM) => {
  if (vm.waste_type === "idle")    return `Idle ${vm.idle_days} days`;
  if (vm.waste_type === "running") return null;
  return vm.waste_type;
};

export default function VirtualMachines() {
  const [vms,     setVms]     = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchVMs() {
      try {
        const res  = await fetch("http://localhost:3001/api/resources");
        const data = await res.json();
        // فلترة الـ VMs فقط
        setVms(data.filter((r: VM) => r.type === "Virtual Machine"));
      } catch (err) {
        setError("تعذّر الاتصال بالـ Backend");
      } finally {
        setLoading(false);
      }
    }
    fetchVMs();
  }, []);

  const wasteVMs   = vms.filter(v => v.waste_type === "idle");
  const totalWaste = wasteVMs.reduce((sum, v) => sum + (v.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Virtual Machines
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading..." : `${vms.length} VMs scanned · ${wasteVMs.length} flagged · ~$${totalWaste}/mo potential savings`}
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
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Cost/mo</th>
              <th className="p-3 font-medium">Issue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : vms.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No VMs found — run a scan first
                </td>
              </tr>
            ) : (
              vms.map((vm) => {
                const issue = getIssue(vm);
                return (
                  <tr key={vm.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium text-foreground font-mono text-xs">{vm.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{vm.location}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{vm.size}</td>
                    <td className="p-3">
                      <span className={`flex items-center gap-1.5 text-xs ${statusColors[vm.status] ?? "text-muted-foreground"}`}>
                        <StatusIcon status={vm.status} />
                        {vm.status}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-xs">${vm.monthly_cost}/mo</td>
                    <td className="p-3">
                      {issue ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-red-400">
                          {issue}
                        </span>
                      ) : (
                        <span className="text-xs text-green-400">OK</span>
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