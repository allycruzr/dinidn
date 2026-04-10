import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Link } from "react-router-dom";

export function CardsWidget() {
  const { accounts, invoices } = useData();
  const creditAccounts = accounts.filter((a) => a.type === 'CREDIT');
  const openInvoices = invoices.filter((i) => i.status === 'OPEN');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Operação</p>
          <h3 className="text-lg font-display font-bold">Cartões, faturas e próximos vencimentos</h3>
          <p className="text-sm text-muted-foreground">Visibilidade do crédito para manter limite, vencimento e projeção sob controle.</p>
        </div>
        <Link to="/cards" className="text-xs text-primary hover:underline whitespace-nowrap">Abrir área de cartões</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {creditAccounts.map((card) => {
          const used = Math.abs(card.balance);
          const limit = card.creditLimit ?? 1;
          const pct = (used / limit) * 100;
          const invoice = openInvoices.find(i => i.accountId === card.id);
          return (
            <Card key={card.id} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-sm">{card.institution}</p>
                    <p className="text-xs text-muted-foreground">{card.name}</p>
                  </div>
                  <Badge variant={pct > 50 ? "destructive" : "secondary"} className="text-xs">{pct.toFixed(0)}% usado</Badge>
                </div>
                <p className="text-xl font-display font-bold">{formatCurrency(used)}</p>
                {invoice && (
                  <p className="text-xs text-muted-foreground">
                    Vence dia {invoice.dueDate.split('-')[2]} · fecha dia {invoice.closingDate.split('-')[2]}
                  </p>
                )}
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Limite livre: {formatCurrency(limit - used)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        {openInvoices.map((inv) => {
          const account = accounts.find(a => a.id === inv.accountId);
          return (
            <Card key={inv.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-sm">{account?.institution} · {inv.referenceMonth}</p>
                  <p className="text-xs text-muted-foreground">{account?.institution} · vence {inv.dueDate.split('-')[2]} de abr.</p>
                </div>
                <p className="font-display font-bold text-sm">{formatCurrency(inv.totalAmount)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
