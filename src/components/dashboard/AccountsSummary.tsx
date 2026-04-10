import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";

const institutionColors: Record<string, string> = {
  'BTG Pactual': '#F59E0B',
  'Banco do Brasil': '#3B82F6',
  'Nubank': '#8B5CF6',
};

export function AccountsSummary() {
  const { accounts } = useData();
  const checkingAccounts = accounts.filter((a) => a.type !== 'CREDIT');
  const total = checkingAccounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Contas</p>
        <h3 className="text-lg font-display font-bold">Distribuição por instituição</h3>
        <p className="text-sm text-muted-foreground">A composição abaixo ajuda a enxergar concentração de saldo e dependências operacionais.</p>
      </div>

      <div className="space-y-3">
        {checkingAccounts.map((account) => {
          const pct = (account.balance / total) * 100;
          const color = institutionColors[account.institution] ?? 'hsl(var(--primary))';
          return (
            <Card key={account.id} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.institution}</p>
                  </div>
                  <p className="font-display font-bold text-sm">{formatCurrency(account.balance)}</p>
                </div>
                <Progress value={pct} className="h-1.5" style={{ '--progress-color': color } as any} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
