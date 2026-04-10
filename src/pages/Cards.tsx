import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { CreditCard, Layers, ShieldCheck, Receipt } from "lucide-react";

export default function CardsPage() {
  const { accounts, invoices } = useData();
  const creditAccounts = accounts.filter((a) => a.type === "CREDIT");

  const totalLimit = creditAccounts.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
  const totalUsed = creditAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);
  const totalFree = totalLimit - totalUsed;
  const totalInvoice = invoices
    .filter(i => i.status === 'OPEN')
    .reduce((s, i) => s + i.totalAmount, 0);

  return (
    <DashboardLayout title="Cartões">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Cartões</p>
          <h2 className="text-2xl font-display font-bold">Gestão de limite, uso e faturas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe exposição de crédito, próximo vencimento e sinais de risco.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Limite total</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalLimit)}</p>
                <p className="text-xs text-muted-foreground mt-1">Capacidade somada entre os {creditAccounts.length} cartões</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Limite livre</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalFree)}</p>
                <p className="text-xs text-muted-foreground mt-1">Espaço disponível para o resto do ciclo</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fatura acumulada</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalInvoice)}</p>
                <p className="text-xs text-muted-foreground mt-1">Valor que já está comprometido</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: Card summary + Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Summary */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Resumo por cartão</p>
              <h3 className="text-lg font-display font-bold">Uso do crédito agora</h3>
              <p className="text-sm text-muted-foreground">Cada bloco combina limite, consumo no ciclo, próxima fatura e programa de benefícios.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {creditAccounts.map((card) => {
                const used = Math.abs(card.balance);
                const limit = card.creditLimit ?? 1;
                const pct = (used / limit) * 100;
                const free = limit - used;
                const currentInvoice = invoices.find(i => i.accountId === card.id && i.status === 'OPEN');
                const nextInvoice = invoices.find(i => i.accountId === card.id && i.status === 'PAID');

                return (
                  <Card key={card.id} className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-sm">{card.institution}</p>
                          <p className="text-xs text-muted-foreground">{card.name}</p>
                        </div>
                        <Badge
                          variant={pct > 50 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {pct.toFixed(0)}%
                        </Badge>
                      </div>

                      <p className="text-xl font-display font-bold">{formatCurrency(used)}</p>

                      {currentInvoice && (
                        <p className="text-xs text-muted-foreground">
                          Fecha dia {currentInvoice.closingDate.split('-')[2]} · vence dia {currentInvoice.dueDate.split('-')[2]}
                        </p>
                      )}

                      <Progress value={pct} className="h-1.5" />

                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p>Limite: {formatCurrency(limit)}</p>
                        <p>Livre: {formatCurrency(free)}</p>
                        {nextInvoice && (
                          <p>Próx. fatura: {formatCurrency(nextInvoice.totalAmount)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Invoices */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Faturas</p>
              <h3 className="text-lg font-display font-bold">Agenda de vencimentos</h3>
              <p className="text-sm text-muted-foreground">Acompanhamento de vencimento e valor já consolidado.</p>
            </div>

            <div className="space-y-3">
              {invoices
                .filter(i => i.status === 'OPEN')
                .map((invoice) => {
                  const account = accounts.find(a => a.id === invoice.accountId);
                  return (
                    <Card key={invoice.id} className="border-border/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-display font-bold text-sm">{account?.institution}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invoice.referenceMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <Badge className="bg-success/15 text-success border-0 text-xs">Aberta</Badge>
                        </div>

                        <p className="text-xl font-display font-bold">{formatCurrency(invoice.totalAmount)}</p>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Fecha em {invoice.closingDate}</p>
                          <p>Vence em {invoice.dueDate}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {invoices
                .filter(i => i.status === 'PAID')
                .map((invoice) => {
                  const account = accounts.find(a => a.id === invoice.accountId);
                  return (
                    <Card key={invoice.id} className="border-border/50 opacity-60">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-display font-bold text-sm">{account?.institution}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invoice.referenceMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">Paga</Badge>
                        </div>

                        <p className="text-xl font-display font-bold">{formatCurrency(invoice.totalAmount)}</p>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Fechou em {invoice.closingDate}</p>
                          <p>Venceu em {invoice.dueDate}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
