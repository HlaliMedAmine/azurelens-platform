import { Badge } from "@/components/ui/badge";
import { useAzureData } from "@/hooks/useAzureData";

const severityStyles: Record<string, string> = {
  high:   "bg-destructive/15 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  low:    "bg-muted text-muted-foreground border-border",
};

const wasteTypeLabel: Record<string, string> = {
  idle:        "Idle VM",
  unattached:  "Unattached Disk",
  unused_ip:   "Unused IP",
  oversized:   "Oversized",
  abandoned:   "Abandoned Storage",
};

const recommendationLabel: Record<string, string> = {
  idle:       "Stop or delete",
  unattached: "Delete if unused",
  unused_ip:  "Release IP",
  oversized:  "Resize down",
  abandoned:  "Archive or delete",
};

export function WasteTable() {
  const { wasteItems, loading } = useAzureData();

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Top Waste Recommendations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${wasteItems.length} resources detected`}
          </p>
        </div>
        <button className="text-xs text-primary font-medium hover:underline">View all →</button>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 px-5 font-medium text-xs uppercase tracking-wider">Resource</th>
              <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">Severity</th>
              <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider">Monthly Cost</th>
              <th className="text-left py-3 px-5 font-medium text-xs uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                  Loading...
                </td>
              </tr>
            ) : wasteItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                  No waste detected — run a scan first
                </td>
              </tr>
            ) : (
              wasteItems.map((item, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{item.type}</td>
                  <td className="py-3 px-4 text-xs">
                    {item.idle_days > 0 ? `Idle for ${item.idle_days} days` : item.status}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={`text-[10px] capitalize ${severityStyles[item.severity] ?? severityStyles.low}`}>
                      {item.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-xs">
                    {item.monthly_cost > 0 ? `$${item.monthly_cost}/mo` : "—"}
                  </td>
                  <td className="py-3 px-5">
                    <button className="text-xs text-primary hover:underline font-medium">
                      {recommendationLabel[item.waste_type] ?? "Review"}
                    </button>
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