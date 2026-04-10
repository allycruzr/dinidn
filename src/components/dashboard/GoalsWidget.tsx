import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Link } from "react-router-dom";

export function GoalsWidget() {
  const { goals } = useData();
  const activeGoals = goals.filter((g) => g.type === 'SAVINGS').slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Metas</p>
          <h3 className="text-lg font-display font-bold">Objetivos em andamento</h3>
          <p className="text-sm text-muted-foreground">Cada meta acompanha progresso, valor faltante e o ritmo de aporte mensal.</p>
        </div>
        <Link to="/goals" className="text-xs text-primary hover:underline whitespace-nowrap">Ver metas</Link>
      </div>

      <div className="space-y-3">
        {activeGoals.map((goal) => {
          const pct = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          // Estimate months to target date
          const monthsLeft = goal.targetDate
            ? Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
            : 12;
          const suggestedMonthly = remaining / monthsLeft;

          return (
            <Card key={goal.id} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm">{goal.icon} {goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Meta {formatCurrency(goal.targetAmount)} · faltam {formatCurrency(remaining)}
                    </p>
                  </div>
                  <Badge className="bg-primary/15 text-primary border-0 text-xs">{pct.toFixed(0)}%</Badge>
                </div>
                <Progress value={pct} className="h-2" style={{ '--progress-color': goal.color } as any} />
                <p className="text-xs text-muted-foreground">
                  Aporte sugerido {formatCurrency(suggestedMonthly)} por mês.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
