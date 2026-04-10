import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
      <p className="font-display font-semibold text-sm mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name === 'totalAssets' ? 'Ativos' : entry.name === 'totalLiabilities' ? 'Passivos' : 'Patrimônio Líquido'}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PatrimonyPage() {
  const { patrimony } = useData();
  const latest = patrimony[patrimony.length - 1];
  const prev = patrimony[patrimony.length - 2];
  const change = ((latest.netWorth - prev.netWorth) / prev.netWorth) * 100;

  return (
    <DashboardLayout title="Patrimônio">
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-display font-bold">{formatCurrency(latest.totalAssets)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Passivos</p>
              <p className="text-2xl font-display font-bold">{formatCurrency(latest.totalLiabilities)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
              <p className="text-2xl font-display font-bold">{formatCurrency(latest.netWorth)}</p>
              <p className={`text-xs font-medium mt-1 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Evolução do Patrimônio — 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={patrimony}>
                <defs>
                  <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="liabGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="referenceMonth" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalAssets" stroke="hsl(var(--chart-income))" strokeWidth={2} fill="url(#assetsGrad)" name="totalAssets" />
                <Area type="monotone" dataKey="totalLiabilities" stroke="hsl(var(--chart-expense))" strokeWidth={2} fill="url(#liabGrad)" name="totalLiabilities" />
                <Line type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} name="netWorth" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
