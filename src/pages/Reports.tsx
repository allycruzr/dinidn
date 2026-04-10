import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatPercent } from "@/lib/currency";
import { ArrowUpRight, Crosshair, BarChart3, CalendarDays } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ReportsPage() {
  const { patrimony, monthlyData, categorySpending } = useData();
  const latest = patrimony[patrimony.length - 1];
  const monthlyAvgIncome = monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length;
  const monthlyAvgExpense = monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length;
  const monthlyAvgBalance = monthlyData.reduce((s, m) => s + m.balance, 0) / monthlyData.length;
  const lastMonth = monthlyData[monthlyData.length - 1];
  const savingsRate = lastMonth.income > 0 ? ((lastMonth.balance / lastMonth.income) * 100) : 0;

  // Future projections (next 4 months)
  const projections = [
    { month: 'Abr', income: 28200, expenses: 10150, investments: 12000, free: 6050 },
    { month: 'Mai', income: 28200, expenses: 9800, investments: 12500, free: 5900 },
    { month: 'Jun', income: 30000, expenses: 11100, investments: 12800, free: 6100 },
    { month: 'Jul', income: 28200, expenses: 9700, investments: 12000, free: 6500 },
  ];
  const projectedTotal = projections.reduce((s, p) => s + p.free, 0) + latest.netWorth;

  // Category spending with goals
  const categoryGoals: Record<string, number> = {
    'Moradia': 4500, 'Alimentação': 3200, 'Assinaturas': 500, 'Transporte': 1100,
    'Lazer': 2200, 'Saúde': 1500, 'Vestuário': 1500, 'Outros': 900,
  };

  const totalExpenses = categorySpending.reduce((s, c) => s + c.value, 0);

  // Patrimony history with growth %
  const patrimonyWithGrowth = patrimony.map((p, i) => {
    const prev = i > 0 ? patrimony[i - 1].netWorth : p.netWorth;
    const growth = prev > 0 ? ((p.netWorth - prev) / prev) * 100 : 0;
    return { ...p, growth };
  });

  return (
    <DashboardLayout title="Relatórios">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Relatórios</p>
          <h2 className="text-2xl font-display font-bold">Patrimônio, fluxo de caixa e concentração</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Base de leitura gerencial para entender crescimento de patrimônio e o quanto sobra todo mês.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Patrimônio atual</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(latest.netWorth)}</p>
                <p className="text-xs text-muted-foreground mt-1">Snapshot mais recente</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projeção futura</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(projectedTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">Cenário consolidado dos próximos 4 meses</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Crosshair className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo do mês</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(lastMonth.balance)}</p>
                <p className="text-xs text-muted-foreground mt-1">Receita menos despesas e aportes</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Taxa de poupança</p>
                <p className="text-2xl font-display font-bold mt-1">{savingsRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Ritmo atual de geração de caixa</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: History + Projections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patrimony evolution */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Histórico</p>
              <h3 className="text-lg font-display font-bold">Evolução do patrimônio</h3>
              <p className="text-sm text-muted-foreground">Série mensal inicial para validar o desenho de patrimônio líquido do app.</p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={patrimony}>
                      <defs>
                        <linearGradient id="patriGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="referenceMonth" hide />
                      <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        formatter={(v: number) => [formatCurrency(v), 'Patrimônio']}
                      />
                      <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" fill="url(#patriGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {patrimonyWithGrowth.slice(-6).map((p) => (
                <Card key={p.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm">{p.referenceMonth}</p>
                      <p className="text-xs text-muted-foreground">Referência mensal</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm">{formatCurrency(p.netWorth)}</p>
                      <p className={`text-xs ${p.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercent(p.growth)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Projected cashflow */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Fluxo Previsto</p>
              <h3 className="text-lg font-display font-bold">Cenário dos próximos meses</h3>
              <p className="text-sm text-muted-foreground">Entradas, saídas e investimentos esperados para antecipar apertos de caixa.</p>
            </div>

            <div className="space-y-3">
              {projections.map((p) => (
                <Card key={p.month} className="border-border/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-bold text-sm">{p.month}</p>
                        <p className="text-xs text-muted-foreground">Caixa livre projetado</p>
                      </div>
                      <p className="text-lg font-display font-bold text-success">{formatCurrency(p.free)}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Receitas {formatCurrency(p.income)}</span>
                      <span>Despesas {formatCurrency(p.expenses)}</span>
                      <span>Aportes {formatCurrency(p.investments)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category spending */}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Categorias</p>
              <h3 className="text-lg font-display font-bold">Concentração de gastos</h3>
              <p className="text-sm text-muted-foreground">Leitura das categorias mais relevantes do mês em relação ao total de despesas.</p>
            </div>

            <div className="space-y-2">
              {categorySpending.map((cat) => (
                <Card key={cat.name} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">Meta {formatCurrency(categoryGoals[cat.name] ?? 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-sm">{formatCurrency(cat.value)}</p>
                      <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Reference card */}
            <Card className="border-border/50 mt-4">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Referência</p>
                <h4 className="font-display font-bold">Ciclo atual</h4>
                <p className="text-sm text-muted-foreground">Janela usada pelo dataset demo para o MVP.</p>
                <Card className="border-border/50 mt-2">
                  <CardContent className="p-3">
                    <p className="font-display font-bold text-sm">Março de 2025</p>
                    <p className="text-xs text-muted-foreground mt-1">As transações atuais cobrem do início do mês até 28 de mar., o suficiente para testar indicadores, previsão e gestão de cartões.</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
