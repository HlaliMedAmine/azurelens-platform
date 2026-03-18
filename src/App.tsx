import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Login from "./pages/Login";
import Index from "./pages/Index.tsx";
import VirtualMachines from "./pages/VirtualMachines.tsx";
import DisksStorage from "./pages/DisksStorage.tsx";
import Networking from "./pages/Networking.tsx";
import Databases from "./pages/Databases.tsx";
import Reports from "./pages/Reports.tsx";
import Settings from "./pages/Settings.tsx";
import AKS from "./pages/AKS.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

export interface User {
  name:  string;
  email: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("azurelens_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    localStorage.setItem("azurelens_user", JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("azurelens_user");
    setUser(null);
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout user={user} onLogout={handleLogout} />}>
              <Route path="/" element={<Index />} />
              <Route path="/virtual-machines" element={<VirtualMachines />} />
              <Route path="/disks-storage" element={<DisksStorage />} />
              <Route path="/networking" element={<Networking />} />
              <Route path="/databases" element={<Databases />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/aks" element={<AKS />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
