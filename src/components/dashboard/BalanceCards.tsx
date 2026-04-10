import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Landmark, TrendingUp, CreditCard, BarChart3 } from "lucide-react";

export function BalanceCards() {
  const { accounts, invoices, monthlyData } = useData();
  const checkingTotal = accounts
    .filter((a) => a.type === 'CHECKING')
    .reduce((s, a) => s + a.balance, 0);

  const investmentBalance = accounts
    .filter((a) => a.type === 'SAVINGS')
    .reduce((s, a) => s + a.balance, 0);

  const openInvoices = invoices
    .filter((i) => i.status === 'OPEN')
    .reduce((s, i) => s + i.totalAmount, 0);

  const lastMonth = monthlyData[monthlyData.length - 1];
  const monthIncome = lastMonth?.income ?? 0;
  const monthExpenses = lastMonth?.expenses ?? 0;
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome * 100) : 0;

  const cards = [
    {
      label: 'Caixa disponível',
      value: formatCurrency(checkingTotal),
      description: 'Saldo combinado das contas correntes',
      icon: <Landmark className="h-5 w-5 text-primary" />,
      iconBg: 'bg-primary/10',
    },
    {
      label: 'Investimentos',
      value: formatCurrency(investmentBalance),
      description: 'Conta de investimento principal no BTG',
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      iconBg: 'bg-success/10',
    },
    {
      label: 'Faturas em aberto',
      value: formatCurrency(openInvoices),
      description: 'Somatório de cartões que vencem em abril',
      icon: <CreditCard className="h-5 w-5 text-destructive" />,
      iconBg: 'bg-destructive/10',
    },
    {
      label: 'Taxa de poupança',
      value: `${savingsRate.toFixed(0)}%`,
      description: 'Receita menos despesas recorrentes',
      icon: <BarChart3 className="h-5 w-5 text-accent-foreground" />,
      iconBg: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
            </div>
            <div className={`h-10 w-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
