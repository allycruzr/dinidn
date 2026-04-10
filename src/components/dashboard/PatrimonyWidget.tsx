import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatCompact } from "@/lib/currency";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function PatrimonyWidget() {
  const { patrimony } = useData();
  const history = patrimony.slice(-6);
  // simple projection
  const lastNW = patrimony[patrimony.length - 1].netWorth;
  const avgGrowth = (lastNW - patrimony[patrimony.length - 4].netWorth) / 3;
  const projectionData = Array.from({ length: 4 }, (_, i) => ({
    referenceMonth: `Proj ${i + 1}`,
    netWorth: lastNW + avgGrowth * (i + 1),
  }));
  const projectedTotal = projectionData[projectionData.length - 1].netWorth;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Patrimônio</p>
        <h3 className="text-lg font-display font-bold">Evolução e projeção</h3>
        <p className="text-sm text-muted-foreground">A linha principal acompanha sua evolução mensal e a secundária representa o caixa livre esperado nos próximos quatro meses.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Histórico</p>
            <p className="text-xl font-display font-bold mt-1">{formatCurrency(lastNW)}</p>
            <div className="h-16 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="referenceMonth" hide />
                  <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" fill="url(#histGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Projeção</p>
            <p className="text-xl font-display font-bold mt-1">{formatCurrency(projectedTotal)}</p>
            <div className="h-16 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="referenceMonth" hide />
                  <YAxis hide domain={['dataMin - 500', 'dataMax + 500']} />
                  <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--chart-income))" fill="url(#projGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {history.map((p) => (
          <Card key={p.id} className="border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{p.referenceMonth}</p>
              <p className="text-sm font-display font-bold">{formatCompact(p.netWorth)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
