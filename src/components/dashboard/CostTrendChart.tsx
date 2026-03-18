import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";

interface ScanRecord {
  scanned_at:       string;
  total_waste_cost: number;
  items_found:      number;
}

interface ChartPoint {
  month:  string;
  total:  number;
  waste:  number;
}

export function CostTrendChart() {
  const [data,    setData]    = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const [historyRes, summaryRes] = await Promise.all([
          fetch("http://localhost:3001/api/history"),
          fetch("http://localhost:3001/api/summary"),
        ]);
        const history: ScanRecord[] = await historyRes.json();
        const summary               = await summaryRes.json();
        const totalCost             = summary.totalMonthlyCost || 0;

        if (history.length === 0) {
          setData([]);
          return;
        }

        // تجميع الـ scans حسب الشهر
        const byMonth: Record<string, { waste: number; count: number }> = {};
        history.forEach(scan => {
          const date  = new Date(scan.scanned_at);
          const key   = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          if (!byMonth[key]) byMonth[key] = { waste: 0, count: 0 };
          byMonth[key].waste += scan.total_waste_cost || 0;
          byMonth[key].count += 1;
        });

        // تحويل لنقاط الـ chart
        const points: ChartPoint[] = Object.entries(byMonth)
          .slice(-7)
          .map(([month, val]) => ({
            month,
            total: Math.round(totalCost),
            waste: Math.round(val.waste / val.count),
          }));

        // إذا عندنا نقطة واحدة فقط — نكررها لتعرض خط
        if (points.length === 1) {
          setData([
            { ...points[0], month: "Before" },
            points[0],
          ]);
        } else {
          setData(points);
        }

      } catch (_) {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Cost & Waste Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Loading..." : data.length === 0 ? "No scan history yet" : `Last ${data.length} scans`}
          </p>
        </div>
        {!loading && data.length === 0 && (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            Run more scans to see trend
          </span>
        )}
      </div>

      <div className="h-[240px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            No data yet — trend will appear after multiple scans
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(207 90% 54%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(207 90% 54%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 44% 9%)",
                  border: "1px solid hsl(222 30% 16%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210 40% 96%)",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(207 90% 54%)"
                fill="url(#totalGrad)"
                strokeWidth={2}
                name="Total Spend"
              />
              <Area
                type="monotone"
                dataKey="waste"
                stroke="hsl(0 72% 51%)"
                fill="url(#wasteGrad)"
                strokeWidth={2}
                name="Detected Waste"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex gap-5 mt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full stat-gradient-blue" /> Total Spend
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full stat-gradient-red" /> Detected Waste
        </div>
      </div>
    </div>
  );
}
