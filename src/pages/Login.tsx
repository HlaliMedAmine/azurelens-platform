import { useState } from "react";
import { Search, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLogin: (user: { name: string; email: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    // تحقق بسيط — يمكن ربطه بـ backend لاحقاً
    await new Promise(r => setTimeout(r, 800));

    if (password.length < 4) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const name = email.split("@")[0]
      .split(".")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    onLogin({ name, email });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl stat-gradient-blue flex items-center justify-center">
            <Search className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">AzureLens</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Azure Cost Optimization Platform
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-lg border border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Read-only access · No changes made to Azure resources
        </p>
      </div>
    </div>
  );
}
