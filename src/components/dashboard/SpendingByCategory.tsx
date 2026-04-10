import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

const categoryGoals: Record<string, number> = {
  'Moradia': 4500, 'Alimentação': 3200, 'Assinaturas': 500, 'Transporte': 1100,
  'Lazer': 2200, 'Saúde': 1500, 'Vestuário': 1500, 'Outros': 900,
};

export function SpendingByCategory() {
  const { categorySpending } = useData();
  const top5 = categorySpending.slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Radar</p>
        <h3 className="text-lg font-display font-bold">Onde seu dinheiro está indo neste mês</h3>
        <p className="text-sm text-muted-foreground">As categorias abaixo já são inferidas automaticamente a partir de descrição, estabelecimento e tipo de movimentação.</p>
      </div>

      <div className="space-y-3">
        {top5.map((cat) => {
          const goal = categoryGoals[cat.name] ?? 0;
          const pct = goal > 0 ? (cat.value / goal) * 100 : 50;
          const overBudget = pct > 100;
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">Meta {formatCurrency(goal)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-sm">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                </div>
              </div>
              <Progress
                value={Math.min(pct, 100)}
                className="h-1.5"
                style={{
                  // @ts-ignore
                  '--progress-color': overBudget ? 'hsl(var(--destructive))' : cat.color,
                }}
              />
            </div>
          );
        })}
      </div>

      <Card className="border-l-4 border-l-[hsl(var(--chart-income))] border-border/50 bg-success/5">
        <CardContent className="p-4">
          <p className="font-display font-bold text-sm text-success">Pulso do mês</p>
          <p className="text-sm text-muted-foreground mt-1">
            Moradia segue como maior bloco do orçamento, então o ganho marginal está nas despesas variáveis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
