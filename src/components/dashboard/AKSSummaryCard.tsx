// src/components/dashboard/AKSSummaryCard.tsx
// أضف هذا الملف الجديد في src/components/dashboard/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, AlertTriangle, ArrowRight, Server } from "lucide-react";

interface AKSSummary {
  clustersCount:        number;
  totalNodes:           number;
  idleNodePools:        number;
  totalMonthlyCost:     number;
  wasteEstimate:        number;
  recommendationsCount: number;
}

export function AKSSummaryCard() {
  const [summary,  setSummary]  = useState<AKSSummary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAKS() {
      try {
        const res  = await fetch("http://localhost:3001/api/aks");
        const data = await res.json();
        setSummary(data.summary);
      } catch (_) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAKS();
  }, []);

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">AKS Overview</h3>
        </div>
        <button
          onClick={() => navigate("/aks")}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          View details <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error || !summary ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          No AKS clusters found in this subscription
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Server className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Clusters</span>
              </div>
              <p className="text-xl font-bold">{summary.clustersCount}</p>
              <p className="text-[10px] text-muted-foreground">{summary.totalNodes} total nodes</p>
            </div>

            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Idle Pools</span>
              </div>
              <p className="text-xl font-bold text-destructive">{summary.idleNodePools}</p>
              <p className="text-[10px] text-muted-foreground">{summary.recommendationsCount} recommendations</p>
            </div>

            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Cost</span>
              </div>
              <p className="text-xl font-bold">${summary.totalMonthlyCost.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">AKS spend</p>
            </div>

            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Waste Est.</span>
              </div>
              <p className="text-xl font-bold text-amber-400">${summary.wasteEstimate.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">potential savings</p>
            </div>
          </div>

          {/* Quick recommendations */}
          {summary.recommendationsCount > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
                Top issues
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.idleNodePools > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/15 text-red-400">
                    {summary.idleNodePools} idle pool{summary.idleNodePools > 1 ? "s" : ""}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400">
                  {summary.recommendationsCount} recommendation{summary.recommendationsCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
