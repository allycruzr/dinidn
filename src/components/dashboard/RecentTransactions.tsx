import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Link } from "react-router-dom";

export function RecentTransactions() {
  const { transactions, accounts } = useData();
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Movimentações</p>
          <h3 className="text-lg font-display font-bold">Lançamentos mais recentes</h3>
          <p className="text-sm text-muted-foreground">Transações confirmadas, pendentes e projetadas ficam no mesmo fluxo para facilitar leitura do caixa.</p>
        </div>
        <Link to="/transactions" className="text-xs text-primary hover:underline whitespace-nowrap">Abrir lista completa</Link>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_auto_auto] gap-4 px-5 py-2.5 border-b border-border text-xs text-muted-foreground">
            <span>Data</span>
            <span>Descrição</span>
            <span>Categoria</span>
            <span className="text-right">Valor</span>
          </div>

          <div className="divide-y divide-border">
            {recentTransactions.map((t) => {
              const account = getAccount(t.accountId);
              return (
                <div key={t.id} className="grid grid-cols-[80px_1fr_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground">{formatDate(t.date)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{account?.institution}</p>
                  </div>
                  {t.category && (
                    <Badge variant="secondary" className="text-xs font-normal">{t.category.name}</Badge>
                  )}
                  <p className={`text-sm font-semibold text-right ${t.amount >= 0 ? 'text-success' : ''}`}>
                    {t.amount >= 0 ? '' : '-'}{formatCurrency(Math.abs(t.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
