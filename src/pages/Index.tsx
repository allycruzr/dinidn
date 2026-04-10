import { DashboardLayout } from "@/components/DashboardLayout";
import { BalanceCards } from "@/components/dashboard/BalanceCards";
import { SpendingByCategory } from "@/components/dashboard/SpendingByCategory";
import { PatrimonyWidget } from "@/components/dashboard/PatrimonyWidget";
import { CardsWidget } from "@/components/dashboard/CardsWidget";
import { AccountsSummary } from "@/components/dashboard/AccountsSummary";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CashflowProjection } from "@/components/dashboard/CashflowProjection";

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 max-w-6xl">
        {/* KPI Cards */}
        <BalanceCards />

        {/* Radar + Patrimony */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingByCategory />
          <PatrimonyWidget />
        </div>

        {/* Cards + Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardsWidget />
          <div className="space-y-6">
            <AccountsSummary />
            <GoalsWidget />
          </div>
        </div>

        {/* Transactions + Cashflow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions />
          <CashflowProjection />
        </div>
      </div>
    </DashboardLayout>
  );
}
