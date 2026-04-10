import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";

export function SpendingByCategory() {
  const { categorySpending } = useData();
  const top5 = categorySpending.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Radar</p>
          <h3 className="text-lg font-display font-bold">Onde seu dinheiro esta indo neste mes</h3>
          <p className="text-sm text-muted-foreground">Adicione transacoes para visualizar a distribuicao por categoria.</p>
        </div>
      </div>
    );
  }

  const maxValue = top5[0]?.value ?? 1;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Radar</p>
        <h3 className="text-lg font-display font-bold">Onde seu dinheiro esta indo neste mes</h3>
        <p className="text-sm text-muted-foreground">As categorias abaixo sao inferidas automaticamente a partir de descricao, estabelecimento e tipo de movimentacao.</p>
      </div>

      <div className="space-y-3">
        {top5.map((cat) => {
          const pct = (cat.value / maxValue) * 100;
          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-sm">{cat.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-sm">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                </div>
              </div>
              <Progress
                value={pct}
                className="h-1.5"
                style={{
                  // @ts-ignore
                  '--progress-color': cat.color,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
