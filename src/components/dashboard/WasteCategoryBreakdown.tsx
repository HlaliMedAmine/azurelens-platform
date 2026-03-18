import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAzureData } from "@/hooks/useAzureData";

const COLORS: Record<string, string> = {
  idle:       "hsl(0 72% 51%)",
  unattached: "hsl(38 92% 50%)",
  unused_ip:  "hsl(207 90% 54%)",
  oversized:  "hsl(270 70% 60%)",
  abandoned:  "hsl(215 20% 55%)",
};

const LABELS: Record<string, string> = {
  idle:       "Idle Resources",
  unattached: "Unattached Disks",
  unused_ip:  "Unused Network",
  oversized:  "Oversized",
  abandoned:  "Abandoned Storage",
};

export function WasteCategoryBreakdown() {
  const { summary, loading } = useAzureData();

  const data = (summary?.breakdown ?? []).map(item => ({
    name:  LABELS[item.waste_type] ?? item.waste_type,
    value: item.cost,
    color: COLORS[item.waste_type] ?? "hsl(215 20% 55%)",
  }));

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">Waste by Category</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Current month breakdown</p>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
          No data — run a scan first
        </div>
      ) : (
        <>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 44% 9%)",
                    border: "1px solid hsl(222 30% 16%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(210 40% 96%)",
                  }}
                  formatter={(value: number) => [`$${value}/mo`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-bold">${total.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">total waste/mo</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5 mt-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">${item.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}