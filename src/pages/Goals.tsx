import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { motion } from "framer-motion";

export default function GoalsPage() {
  const { goals } = useData();

  return (
    <DashboardLayout title="Metas Financeiras">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
        {goals.map((goal, i) => {
          const pct = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;

          // Simple projection
          let projectionText = '';
          if (goal.targetDate && goal.type === 'SAVINGS') {
            const monthsLeft = Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
            const perMonth = remaining / monthsLeft;
            projectionText = `${formatCurrency(perMonth)}/mês necessário`;
          }

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 hover:border-border transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <span className="text-xl">{goal.icon}</span>
                      {goal.name}
                    </CardTitle>
                    <Badge variant={pct >= 100 ? "default" : "secondary"} className="text-xs">
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={Math.min(pct, 100)} className="h-2.5" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(goal.currentAmount)}</span>
                    <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  {goal.targetDate && (
                    <p className="text-xs text-muted-foreground">Meta: {goal.targetDate}</p>
                  )}
                  {projectionText && (
                    <p className="text-xs text-primary font-medium">{projectionText}</p>
                  )}
                  {goal.type === 'EXPENSE_LIMIT' && (
                    <p className={`text-xs font-medium ${pct > 90 ? 'text-destructive' : 'text-success'}`}>
                      Restante: {formatCurrency(remaining)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
