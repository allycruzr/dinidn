import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { Database, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ConnectionsPage() {
  const { accounts, openFinanceConnections, connectInstitution, syncTransactions } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async (connectionId: string) => {
    await connectInstitution(connectionId);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncTransactions();
    setIsSyncing(false);
  };

  const connectedCount = openFinanceConnections.filter((connection) => connection.status === "CONNECTED").length;
  const totalConnections = openFinanceConnections.length;
  const connectedCardCount = openFinanceConnections.filter((connection) => connection.type === "CREDIT" && connection.status === "CONNECTED").length;

  return (
    <DashboardLayout title="Open Finance">
      <div className="space-y-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Conexão</p>
                  <h3 className="text-lg font-display font-bold">Open Finance ativo</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Conecte suas contas e cartões para importar transações em tempo real.</p>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Conexões ativas</span>
                  <span>{connectedCount}/{totalConnections}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Cartões sincronizados</span>
                  <span>{connectedCardCount}/3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <CardTitle className="font-display text-base">Importação automática</CardTitle>
              <p className="text-sm text-muted-foreground">Depois de conectar, as transações são sincronizadas com o dashboard e aparecem nas páginas de contas, cartões e relatórios.</p>
              <Button variant="secondary" onClick={handleSync} disabled={isSyncing || connectedCount === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isSyncing ? "Sincronizando..." : "Sincronizar agora"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <CardTitle className="font-display text-base">Mapa de contas</CardTitle>
              <p className="text-sm text-muted-foreground">Suporte para 3 contas bancárias e 3 cartões de crédito em um mesmo painel.</p>
              <div className="space-y-2">
                {accounts.filter((account) => account.type !== "CREDIT").map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{account.institution}</span>
                    <Badge variant="secondary" className="text-xs">{formatCurrency(account.balance)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {openFinanceConnections.map((connection) => {
            const account = accounts.find((item) => item.id === connection.accountId);
            return (
              <Card key={connection.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-sm">{connection.institution} · {connection.accountName}</p>
                      <p className="text-xs text-muted-foreground">{connection.connectionType === "OPEN_BANKING" ? "Conta bancária" : "Cartão de crédito"}</p>
                    </div>
                    <Badge variant={connection.status === "CONNECTED" ? "success" : "outline"} className="text-xs">
                      {connection.status === "CONNECTED" ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Saldo atual</p>
                    <p className="font-display font-bold text-lg">{account ? formatCurrency(account.balance) : "-"}</p>
                    <p className="text-xs text-muted-foreground">Última sincronização: {connection.lastSyncedAt ?? "Nunca"}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      onClick={() => handleConnect(connection.id)}
                      disabled={connection.status === "CONNECTED"}
                    >
                      {connection.status === "CONNECTED" ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Conectado</> : <><AlertCircle className="mr-2 h-4 w-4" /> Conectar</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
