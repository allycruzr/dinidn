import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Landmark, TrendingUp, RefreshCw, Database } from "lucide-react";


export default function AccountsPage() {
  const { accounts, belvoLinks } = useData();
  const checkingAccounts = accounts.filter((a) => a.type !== "CREDIT");
  const totalChecking = checkingAccounts.reduce((s, a) => s + a.balance, 0);
  const totalAll = totalChecking;

  // Group by institution
  const institutions = [...new Set(accounts.map((a) => a.institution))];
  const institutionStatus = institutions.reduce<Record<string, "Conectado" | "Atenção">>((acc, institution) => {
    const instLinks = belvoLinks.filter((link) => link.institution === institution);
    acc[institution] = instLinks.length > 0 && instLinks.every((link) => link.status === "valid")
      ? "Conectado"
      : "Atenção";
    return acc;
  }, {});
  const healthyConnectors = Object.values(institutionStatus).filter((status) => status === "Conectado").length;

  const institutionMeta = institutions.reduce<
    Record<string, { products: string; description: string; lastSync: string; status: "Conectado" | "Atenção" }>
  >((acc, institution) => {
    const instAccounts = accounts.filter((a) => a.institution === institution);
    const instLinks = belvoLinks.filter((link) => link.institution === institution);

    const accountTypes = instAccounts.map((a) =>
      a.type === "CREDIT" ? "Cartão de crédito" : a.type === "SAVINGS" ? "Poupança" : "Conta",
    );
    const products = [...new Set(accountTypes)].join(", ") || "—";

    const lastSyncDates = instLinks
      .map((link) => link.lastSyncedAt)
      .filter(Boolean) as string[];
    const latestSync =
      lastSyncDates.length > 0
        ? new Date(lastSyncDates.sort().reverse()[0]).toLocaleString("pt-BR")
        : "Nunca";

    acc[institution] = {
      products,
      description: `${instLinks.length} conexão(ões) via Open Finance.`,
      lastSync: latestSync,
      status: institutionStatus[institution],
    };
    return acc;
  }, {});

  return (
    <DashboardLayout title="Contas">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Contas e Conectores</p>
          <h2 className="text-2xl font-display font-bold">Mapa operacional das instituições</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão das contas financeiras, da distribuição de saldo e do estado das integrações.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Caixa</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalChecking)}</p>
                <p className="text-xs text-muted-foreground mt-1">Soma das contas correntes</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Investimentos</p>
                <p className="text-2xl font-display font-bold mt-1">{formatCurrency(accounts.filter((a) => a.type === 'SAVINGS').reduce((s, a) => s + a.balance, 0))}</p>
                <p className="text-xs text-muted-foreground mt-1">Saldo de longo prazo</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conectores saudáveis</p>
                <p className="text-2xl font-display font-bold mt-1">{healthyConnectors}/{institutions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Instituições com leitura pronta</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Backend</p>
                <p className="text-2xl font-display font-bold mt-1">Demo</p>
                <p className="text-xs text-muted-foreground mt-1">Estrutura pronta aguardando credenciais</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balances */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Saldos</p>
              <h3 className="text-lg font-display font-bold">Distribuição por conta</h3>
              <p className="text-sm text-muted-foreground">Boa para enxergar concentração de caixa, folga de operação e peso do patrimônio financeiro.</p>
            </div>

            <div className="space-y-3">
              {checkingAccounts.map((account) => {
                const pct = (account.balance / totalAll) * 100;
                const isTop = pct > 50;
                return (
                  <Card key={account.id} className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-sm">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.institution} · {account.type === 'SAVINGS' ? 'poupança' : account.type === 'CHECKING' ? 'corrente' : 'investimento'}</p>
                        </div>
                        <Badge className={`text-xs border-0 ${isTop ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>
                          Sincronizada
                        </Badge>
                      </div>

                      <p className="text-xl font-display font-bold">{formatCurrency(account.balance)}</p>
                      <p className="text-xs text-muted-foreground">Participação {pct.toFixed(1)}%</p>

                      <Progress value={pct} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Connectivity */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Conectividade</p>
              <h3 className="text-lg font-display font-bold">Estado das integrações</h3>
              <p className="text-sm text-muted-foreground">Primeiro bloco para monitorar consentimento, cobertura e data do último sync por instituição.</p>
            </div>

            <div className="space-y-3">
              {institutions.map((inst) => {
                const meta = institutionMeta[inst];
                const isOk = meta?.status === 'Conectado';
                return (
                  <Card key={inst} className="border-border/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-sm">{inst}</p>
                          <p className="text-xs text-muted-foreground">{meta?.products}</p>
                        </div>
                        <Badge className={`text-xs border-0 ${isOk ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                          {meta?.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{meta?.description}</p>

                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Último import {meta?.lastSync}
                      </p>
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
