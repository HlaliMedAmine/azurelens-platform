import { DollarSign, AlertTriangle, Server, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { WasteTable } from "@/components/dashboard/WasteTable";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { WasteCategoryBreakdown } from "@/components/dashboard/WasteCategoryBreakdown";
import { OptimizationScore } from "@/components/dashboard/OptimizationScore";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AKSSummaryCard } from "@/components/dashboard/AKSSummaryCard";
import { useAzureData } from "@/hooks/useAzureData";

const Index = () => {
  const { summary, wasteItems, loading, error } = useAzureData();

  // حساب الـ savings الحقيقي = مجموع كل الـ waste المكتشف عبر التاريخ
  const totalSavingsOpportunity = summary?.totalYearlyCost ?? 0;

  return (
    <>
      {error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mb-4 border border-red-200">
          ⚠️ {error} — Make sure the backend is running on localhost:3001
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monthly Spend"
          value={loading ? "..." : `$${summary?.totalMonthlyCost?.toLocaleString() ?? "0"}`}
          subtitle={loading ? "Loading..." : `${summary?.totalResources ?? 0} resources running`}
          icon={DollarSign}
          gradient="blue"
          trend={{ value: "5.1%", positive: true }}
        />
        <StatCard
          title="Detected Waste"
          value={loading ? "..." : `$${summary?.wasteMonthlyCost?.toLocaleString() ?? "0"}`}
          subtitle={loading ? "Loading..." : `${summary?.totalItems ?? 0} resources flagged`}
          icon={AlertTriangle}
          gradient="red"
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          title="Resources Scanned"
          value={loading ? "..." : `${summary?.totalResources ?? 0}`}
          subtitle={
            summary?.lastScannedAt
              ? `Last scan: ${new Date(summary.lastScannedAt).toLocaleTimeString()}`
              : "Run first scan"
          }
          icon={Server}
          gradient="warning"
        />
        <StatCard
          title="Potential Yearly Savings"
          value={loading ? "..." : `$${totalSavingsOpportunity.toLocaleString()}`}
          subtitle={loading ? "Loading..." : `If all waste is resolved`}
          icon={TrendingDown}
          gradient="green"
          trend={{ value: `$${summary?.wasteMonthlyCost ?? 0}/mo`, positive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CostTrendChart />
        </div>
        <WasteCategoryBreakdown />
      </div>

      {/* Waste Table */}
      <WasteTable />

      {/* AKS Summary */}
      <AKSSummaryCard />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OptimizationScore />
        <RecentActivity />
      </div>
    </>
  );
};

export default Index;
