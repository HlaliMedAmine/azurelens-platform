import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: "blue" | "green" | "red" | "warning";
  trend?: { value: string; positive: boolean };
}

const gradientMap = {
  blue: "stat-gradient-blue",
  green: "stat-gradient-green",
  red: "stat-gradient-red",
  warning: "stat-gradient-warning",
};

export function StatCard({ title, value, subtitle, icon: Icon, gradient, trend }: StatCardProps) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group hover:glow-border transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`${gradientMap[gradient]} p-2.5 rounded-lg`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend.positive ? "text-success" : "text-destructive"}`}>
            {trend.positive ? "↓" : "↑"} {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
      <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-5 ${gradientMap[gradient]}`} />
    </div>
  );
}
