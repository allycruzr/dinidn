import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

const projections = [
  { month: 'Abr', income: 28200, expenses: 10150, investments: 12000, free: 6050 },
  { month: 'Mai', income: 28200, expenses: 9800, investments: 12500, free: 5900 },
  { month: 'Jun', income: 30000, expenses: 11100, investments: 12800, free: 6100 },
  { month: 'Jul', income: 28200, expenses: 9700, investments: 12000, free: 6500 },
];

export function CashflowProjection() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Próximos meses</p>
        <h3 className="text-lg font-display font-bold">Fluxo de caixa esperado</h3>
        <p className="text-sm text-muted-foreground">Um primeiro cenário de previsão para apoiar decisões de aporte, metas e uso do crédito.</p>
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
