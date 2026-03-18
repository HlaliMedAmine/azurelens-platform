import { useAzureData } from "@/hooks/useAzureData";

function ScoreItem({ label, status, color }: { label: string; status: string; color: string }) {
  const dotColors: Record<string, string> = {
    destructive: "bg-destructive",
    warning:     "bg-warning",
    success:     "bg-success",
  };
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
        <span className="font-medium">{status}</span>
      </div>
    </div>
  );
}

export function OptimizationScore() {
  const { summary, wasteItems, loading } = useAzureData();

  // حساب الـ score بناءً على البيانات الحقيقية
  // كلما قل الـ waste كلما ارتفع الـ score
  const totalItems  = summary?.totalItems ?? 0;
  const score = totalItems === 0 ? 100 : Math.max(10, 100 - totalItems * 8);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  // حساب كل فئة من البيانات الحقيقية
  const idleCount     = wasteItems.filter(i => i.waste_type === "idle").length;
  const oversizeCount = wasteItems.filter(i => i.waste_type === "oversized").length;
  const storageCount  = wasteItems.filter(i => i.waste_type === "abandoned").length;
  const networkCount  = wasteItems.filter(i => i.waste_type === "unused_ip").length;

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Optimization Score</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Overall health of your Azure spend</p>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <svg width="120" height="120" className="-rotate-90">
            <circle cx="60" cy="60" r="45" fill="none" stroke="hsl(222 30% 16%)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="45"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={loading ? circumference : offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" />
                <stop offset="100%" stopColor="hsl(207 90% 54%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{loading ? "..." : score}</p>
              <p className="text-[10px] text-muted-foreground">/ 100</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        <ScoreItem
          label="Idle resources"
          status={loading ? "..." : idleCount > 0 ? `${idleCount} found` : "Good"}
          color={idleCount > 0 ? "destructive" : "success"}
        />
        <ScoreItem
          label="Oversized VMs"
          status={loading ? "..." : oversizeCount > 0 ? `${oversizeCount} found` : "Good"}
          color={oversizeCount > 0 ? "warning" : "success"}
        />
        <ScoreItem
          label="Storage hygiene"
          status={loading ? "..." : storageCount > 0 ? "Needs review" : "Good"}
          color={storageCount > 0 ? "warning" : "success"}
        />
        <ScoreItem
          label="Network cleanup"
          status={loading ? "..." : networkCount > 0 ? `${networkCount} found` : "Good"}
          color={networkCount > 0 ? "warning" : "success"}
        />
      </div>
    </div>
  );
}