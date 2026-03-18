import { Settings as SettingsIcon, Save, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const [form, setForm] = useState({
    tenantId:       "",
    clientId:       "",
    clientSecret:   "",
    subscriptionId: "",
    scanInterval:   "24",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [scanning,   setScanning]   = useState(false);
  const [message,    setMessage]    = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res  = await fetch("http://localhost:3001/api/settings");
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          tenantId:       data.tenantId       || "",
          clientId:       data.clientId       || "",
          clientSecret:   data.clientSecret   || "",
          subscriptionId: data.subscriptionId || "",
          scanInterval:   data.scanInterval   || "24",
        }));
      } catch (_) {}
      finally { setLoading(false); }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      setMessage({ text: data.message || "Saved!", ok: true });
    } catch (_) {
      setMessage({ text: "Failed to save settings", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setMessage(null);
    try {
      await fetch("http://localhost:3001/api/scan", { method: "POST" });
      setMessage({ text: "Scan started — check dashboard in 30 seconds", ok: true });
    } catch (_) {
      setMessage({ text: "Failed to start scan", ok: false });
    } finally {
      setScanning(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Azure connection and scan configuration
        </p>
      </div>

      {message && (
        <div className={[
          "text-sm p-3 rounded-lg border",
          message.ok
            ? "text-green-400 bg-green-950/30 border-green-800"
            : "text-red-400 bg-red-950/30 border-red-800"
        ].join(" ")}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Azure Connection */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Azure Connection</h3>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tenant ID
                </label>
                <input
                  type="text"
                  value={form.tenantId}
                  onChange={e => setForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client ID
                </label>
                <input
                  type="text"
                  value={form.clientId}
                  onChange={e => setForm(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={form.clientSecret}
                    onChange={e => setForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                    placeholder="your-secret-here"
                    className={inputClass}
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subscription ID
                </label>
                <input
                  type="text"
                  value={form.subscriptionId}
                  onChange={e => setForm(prev => ({ ...prev, subscriptionId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Scan Interval
                </label>
                <select
                  value={form.scanInterval}
                  onChange={e => setForm(prev => ({ ...prev, scanInterval: e.target.value }))}
                  className={inputClass}
                >
                  <option value="6">Every 6 hours</option>
                  <option value="12">Every 12 hours</option>
                  <option value="24">Every 24 hours</option>
                  <option value="48">Every 48 hours</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* Actions */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Actions</h3>
          <div className="space-y-3">

            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Access Level</p>
                <p className="text-xs text-muted-foreground">Read-only — no changes to Azure</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                Read-Only
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="text-sm font-medium">Auto Scan</p>
                <p className="text-xs text-muted-foreground">
                  Runs every {form.scanInterval}h automatically
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                Active
              </span>
            </div>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-lg py-2 text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={["h-4 w-4", scanning ? "animate-spin" : ""].join(" ")} />
              {scanning ? "Scanning..." : "Run Manual Scan Now"}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
