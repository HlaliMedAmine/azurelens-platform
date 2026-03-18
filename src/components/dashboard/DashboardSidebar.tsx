import {
  LayoutDashboard,
  Server,
  HardDrive,
  Globe,
  Database,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Layers,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/" },
  { label: "Virtual Machines", icon: Server,          path: "/virtual-machines" },
  { label: "Disks & Storage",  icon: HardDrive,       path: "/disks-storage" },
  { label: "Networking",       icon: Globe,           path: "/networking" },
  { label: "Databases",        icon: Database,        path: "/databases" },
  { label: "AKS",              icon: Layers,          path: "/aks" },
  { label: "Reports",          icon: FileText,        path: "/reports" },
  { label: "Settings",         icon: Settings,        path: "/settings" },
];

interface SidebarProps {
  user:     { name: string; email: string };
  onLogout: () => void;
}

export function DashboardSidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen border-r border-border bg-[hsl(var(--sidebar-background))] flex flex-col shrink-0">
      <div className="p-5 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg stat-gradient-blue flex items-center justify-center">
            <Search className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">AzureLens</span>
        </NavLink>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            activeClassName="bg-accent text-foreground font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="glass-card p-3 space-y-2">
          <p className="text-xs font-medium">Pro Plan</p>
          <p className="text-[10px] text-muted-foreground">3 subscriptions connected</p>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-[65%] stat-gradient-blue rounded-full" />
          </div>
          <p className="text-[10px] text-muted-foreground">65% scan quota used</p>
        </div>
      </div>
    </aside>
  );
}

interface Alert {
  id:       string;
  type:     string;
  severity: string;
  title:    string;
  message:  string;
  resource: string | null;
  cost:     number;
  time:     string;
  read:     boolean;
}

const severityIcon = (severity: string) => {
  if (severity === "high")   return <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />;
  if (severity === "medium") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
  return <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />;
};

const timeAgo = (iso: string) => {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return "Just now";
};

interface HeaderProps {
  user:     { name: string; email: string };
  onLogout: () => void;
}

export function DashboardHeader({ user, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [alerts,   setAlerts]   = useState<Alert[]>([]);
  const [readIds,  setReadIds]  = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(false);

  // وقت آخر scan حقيقي
  const [lastScanText, setLastScanText] = useState("Loading...");

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:3001/api/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  // جلب وقت آخر scan حقيقي
  const fetchLastScan = async () => {
    try {
      const res     = await fetch("http://localhost:3001/api/summary");
      const data    = await res.json();
      const lastAt  = data.lastScannedAt;
      if (!lastAt) {
        setLastScanText("No scans yet");
        return;
      }
      const diff  = Date.now() - new Date(lastAt).getTime();
      const mins  = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days  = Math.floor(hours / 24);
      let ago = "Just now";
      if (days  > 0) ago = `${days}d ago`;
      else if (hours > 0) ago = `${hours}h ago`;
      else if (mins  > 0) ago = `${mins}m ago`;

      // حساب وقت الـ scan القادم (24h - الوقت المنقضي)
      const nextInMins  = 1440 - mins;
      const nextInHours = Math.ceil(nextInMins / 60);
      const nextText    = nextInHours > 0 ? `Next scan in ${nextInHours}h` : "Scanning soon";

      setLastScanText(`Last scan: ${ago} · ${nextText}`);
    } catch (_) {
      setLastScanText("Backend not connected");
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchLastScan();
    const alertInterval = setInterval(fetchAlerts,    5 * 60 * 1000);
    const scanInterval  = setInterval(fetchLastScan,  60 * 1000); // تحديث كل دقيقة
    return () => {
      clearInterval(alertInterval);
      clearInterval(scanInterval);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread     = alerts.filter(a => !readIds.has(a.id)).length;
  const markAllRead = () => setReadIds(new Set(alerts.map(a => a.id)));
  const initials   = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold">Cost Optimization Dashboard</h1>
        <p className="text-xs text-muted-foreground">{lastScanText}</p>
      </div>

      <div className="flex items-center gap-3">

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(!bellOpen); setMenuOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 w-80 glass-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <p className="text-sm font-semibold">Alerts</p>
                  {unread > 0 && <p className="text-[10px] text-muted-foreground">{unread} unread</p>}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">No alerts — everything looks good!</p>
                  </div>
                ) : (
                  alerts.map(alert => {
                    const isRead = readIds.has(alert.id);
                    return (
                      <div
                        key={alert.id}
                        onClick={() => setReadIds(prev => new Set([...prev, alert.id]))}
                        className={["flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/20", isRead ? "opacity-60" : "bg-accent/5"].join(" ")}
                      >
                        {severityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <p className={["text-xs font-medium leading-tight", isRead ? "" : "text-foreground"].join(" ")}>
                            {alert.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{timeAgo(alert.time)}</span>
                            {alert.cost > 0 && <span className="text-[10px] font-medium text-amber-400">${alert.cost}/mo</span>}
                          </div>
                        </div>
                        {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                    );
                  })
                )}
              </div>
              {alerts.length > 0 && (
                <div className="px-4 py-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {alerts.filter(a => a.severity === "high").length} high priority · {alerts.filter(a => a.severity === "medium").length} medium
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setBellOpen(false); }}
            className="flex items-center gap-2 pl-3 border-l border-border hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full stat-gradient-blue flex items-center justify-center text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <span className="text-sm font-medium">{user.name}</span>
            <ChevronDown className={["h-3 w-3 text-muted-foreground transition-transform", menuOpen ? "rotate-180" : ""].join(" ")} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-52 glass-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="p-1">
                <NavLink
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
                >
                  <User className="h-4 w-4" />
                  Profile & Settings
                </NavLink>
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
