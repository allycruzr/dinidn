import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";

export function CashflowProjection() {
  const { monthlyData } = useData();

  const avgIncome = monthlyData.length > 0
    ? monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length
    : 0;
  const avgExpenses = monthlyData.length > 0
    ? monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length
    : 0;

  const now = new Date();
  const projections = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const month = d.toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .replace(/^\w/, (c) => c.toUpperCase());
    const income = Math.round(avgIncome);
    const expenses = Math.round(avgExpenses);
    const investments = 0;
    const free = income - expenses - investments;
    return { month, income, expenses, investments, free };
  });

  if (monthlyData.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Proximos meses</p>
          <h3 className="text-lg font-display font-bold">Fluxo de caixa esperado</h3>
          <p className="text-sm text-muted-foreground">Adicione transacoes para gerar projecoes de fluxo de caixa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Proximos meses</p>
        <h3 className="text-lg font-display font-bold">Fluxo de caixa esperado</h3>
        <p className="text-sm text-muted-foreground">Um primeiro cenario de previsao para apoiar decisoes de aporte, metas e uso do credito.</p>
      </div>

      <div className="space-y-3">
        {projections.map((p) => (
          <Card key={p.month} className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-sm">{p.month}</p>
                  <p className="text-xs text-muted-foreground">Receita prevista {formatCurrency(p.income)}</p>
                </div>
                <p className="text-lg font-display font-bold text-success">{formatCurrency(p.free)}</p>
              </div>
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>Despesas: {formatCurrency(p.expenses)}</span>
                <span>Investimentos: {formatCurrency(p.investments)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
