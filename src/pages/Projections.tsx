import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";

// Generate projection data
function generateProjection(months: number, avgIncome: number, avgExpense: number) {
  const data = [];
  let balance = 36493;
  for (let i = 0; i <= months; i++) {
    data.push({
      month: i === 0 ? 'Hoje' : `Mês ${i}`,
      optimistic: balance + i * (avgIncome * 1.2 - avgExpense * 0.8),
      realistic: balance + i * (avgIncome - avgExpense),
      pessimistic: balance + i * (avgIncome * 0.8 - avgExpense * 1.2),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
      <p className="font-display font-semibold text-sm mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name === 'optimistic' ? 'Otimista' : entry.name === 'realistic' ? 'Realista' : 'Pessimista'}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ProjectionsPage() {
  const [monthlySavings, setMonthlySavings] = useState(2000);
  const [goalAmount, setGoalAmount] = useState(100000);

  const projectionData = generateProjection(6, 15900, 11000);

  const monthsToGoal = goalAmount > 0 && monthlySavings > 0
    ? Math.ceil((goalAmount - 36493) / monthlySavings)
    : 0;

  return (
    <DashboardLayout title="Projeções">
      <div className="space-y-6 max-w-5xl">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Projeção de Saldo — Próximos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="optimistic" stroke="hsl(var(--chart-income))" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                <Line type="monotone" dataKey="realistic" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pessimistic" stroke="hsl(var(--chart-expense))" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-0.5 bg-success rounded" />
                <span className="text-muted-foreground">Otimista</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-0.5 bg-primary rounded" />
                <span className="text-muted-foreground">Realista</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-0.5 bg-destructive rounded" />
                <span className="text-muted-foreground">Pessimista</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Simulador de Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Economia mensal (R$)</Label>
                <Input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Meta total (R$)</Label>
                <Input type="number" value={goalAmount} onChange={(e) => setGoalAmount(Number(e.target.value))} />
              </div>
            </div>

            {monthsToGoal > 0 && (
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Economizando {formatCurrency(monthlySavings)}/mês, você atinge</p>
                <p className="text-xl font-display font-bold text-primary mt-1">{formatCurrency(goalAmount)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  em <span className="font-bold text-foreground">{monthsToGoal} meses</span>
                  {monthsToGoal > 12 && ` (~${(monthsToGoal / 12).toFixed(1)} anos)`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
