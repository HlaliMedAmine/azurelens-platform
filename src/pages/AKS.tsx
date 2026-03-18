// src/pages/AKS.tsx
import { useState, useEffect } from "react";
import { Layers, Server, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface NodePool {
  name:       string;
  count:      number;
  vmSize:     string;
  mode:       string;
  powerState: string;
}

interface Cluster {
  id:                string;
  name:              string;
  location:          string;
  resourceGroup:     string;
  kubernetesVersion: string;
  nodeCount:         number;
  nodePools:         NodePool[];
  powerState:        string;
}

interface Recommendation {
  clusterId:   string;
  clusterName: string;
  type:        string;
  severity:    string;
  title:       string;
  description: string;
  action:      string;
  monthlyCost: number;
}

interface Score {
  total:       number;
  efficiency:  number;
  utilization: number;
  rightsizing: number;
}

const severityStyle: Record<string, string> = {
  high:   "bg-destructive/15 text-red-400 border-red-800/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-800/30",
  low:    "bg-muted text-muted-foreground border-border",
};

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r   = 28;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(222 30% 16%)" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

export default function AKS() {
  const [clusters,        setClusters]        = useState<Cluster[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [score,           setScore]           = useState<Score | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [expanded,        setExpanded]        = useState<string | null>(null);

  useEffect(() => {
    async function fetchAKS() {
      try {
        const res  = await fetch("http://localhost:3001/api/aks");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setClusters(data.clusters);
        setRecommendations(data.recommendations);
        setScore(data.score);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAKS();
  }, []);

  const totalCost  = recommendations.reduce((s, r) => s + (r.monthlyCost || 0), 0);
  const highCount  = recommendations.filter(r => r.severity === "high").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          AKS Cost Optimization
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading..." : `${clusters.length} clusters scanned · ${recommendations.length} recommendations · ~$${Math.round(totalCost)}/mo potential savings`}
        </p>
      </div>

      {error && (
        <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-lg border border-red-800">
          ⚠️ {error}
        </div>
      )}

      {!loading && clusters.length === 0 && !error && (
        <div className="glass-card p-12 text-center text-muted-foreground text-sm">
          No AKS clusters found in this subscription
        </div>
      )}

      {/* Scores */}
      {score && !loading && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">AKS Efficiency Scores</h3>
          <div className="flex items-center justify-around">
            <ScoreRing value={score.total}       label="Overall Score" />
            <ScoreRing value={score.efficiency}  label="Cluster Efficiency" />
            <ScoreRing value={score.utilization} label="Node Utilization" />
            <ScoreRing value={score.rightsizing} label="Workload Rightsizing" />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">AKS Recommendations</h3>
            <div className="flex items-center gap-2">
              {highCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/15 text-red-400">
                  {highCount} high priority
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-border">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${severityStyle[rec.severity]}`}>
                        {rec.severity}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{rec.clusterName}</span>
                    </div>
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                    <p className="text-xs text-primary mt-1.5 font-medium">→ {rec.action}</p>
                  </div>
                  {rec.monthlyCost > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-amber-400">${rec.monthlyCost}/mo</p>
                      <p className="text-[10px] text-muted-foreground">potential saving</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clusters detail */}
      {clusters.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold">Cluster Details</h3>
          </div>
          <div className="divide-y divide-border">
            {clusters.map(cluster => (
              <div key={cluster.id}>
                {/* Cluster row */}
                <button
                  onClick={() => setExpanded(expanded === cluster.id ? null : cluster.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-accent/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cluster.powerState === "Running" ? "bg-green-400" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm font-medium font-mono">{cluster.name}</p>
                      <p className="text-xs text-muted-foreground">{cluster.location} · k8s {cluster.kubernetesVersion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium">{cluster.nodeCount} nodes</p>
                      <p className="text-[10px] text-muted-foreground">{cluster.nodePools.length} pools</p>
                    </div>
                    {expanded === cluster.id
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Node pools */}
                {expanded === cluster.id && (
                  <div className="bg-background/30 border-t border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="p-3 text-left font-medium">Pool Name</th>
                          <th className="p-3 text-left font-medium">VM Size</th>
                          <th className="p-3 text-left font-medium">Mode</th>
                          <th className="p-3 text-left font-medium">Nodes</th>
                          <th className="p-3 text-left font-medium">State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cluster.nodePools.map(pool => (
                          <tr key={pool.name} className="border-b border-border/50">
                            <td className="p-3 font-mono font-medium">{pool.name}</td>
                            <td className="p-3 text-muted-foreground font-mono">{pool.vmSize}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${pool.mode === "System" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {pool.mode}
                              </span>
                            </td>
                            <td className="p-3">{pool.count}</td>
                            <td className="p-3">
                              {pool.powerState === "Running"
                                ? <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-3 w-3" />Running</span>
                                : <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" />{pool.powerState}</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
