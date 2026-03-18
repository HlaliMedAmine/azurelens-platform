import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useAzureData } from "@/hooks/useAzureData";

export function RecentActivity() {
  const { wasteItems, summary, loading } = useAzureData();

  // بناء الأنشطة من البيانات الحقيقية
  const activities = [];

  // إضافة الـ waste items كأنشطة
  wasteItems.slice(0, 3).forEach(item => {
    activities.push({
      icon: AlertTriangle,
      color: "text-destructive",
      text: `${item.type} detected: ${item.name} — $${item.monthly_cost}/mo`,
      time: summary?.lastScannedAt
        ? new Date(summary.lastScannedAt).toLocaleTimeString()
        : "recently",
    });
  });

  // إضافة آخر scan كنشاط
  if (summary?.lastScannedAt) {
    activities.push({
      icon: Clock,
      color: "text-warning",
      text: `Scan completed: ${summary.totalItems} waste items found`,
      time: new Date(summary.lastScannedAt).toLocaleString(),
    });
  }

  // إضافة نشاط إذا في savings
  if (summary?.totalMonthlyCost > 0) {
    activities.push({
      icon: CheckCircle,
      color: "text-success",
      text: `Potential savings identified: $${summary.totalMonthlyCost}/mo`,
      time: "current scan",
    });
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest events and actions</p>
        </div>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet — run a scan first</p>
        ) : (
          activities.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">{item.text}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}