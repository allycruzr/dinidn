import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { supabase } from "@/lib/supabase";
import { openBelvoWidget } from "@/lib/belvoWidget";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function ConnectionsPage() {
  const { belvoLinks, accounts, registerBelvoLink, syncLink, loading } = useData();
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { data, error: tokenError } = await supabase.functions.invoke(
        "belvo-widget-token",
        { body: {} },
      );
      if (tokenError) throw tokenError;
      const accessToken = (data as { access?: string })?.access;
      if (!accessToken) throw new Error("Token nao retornado");

      await openBelvoWidget({
        accessToken,
        onSuccess: async (linkId, institution) => {
          try {
            await registerBelvoLink(linkId, institution);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setConnecting(false);
          }
        },
        onExit: () => {
          setConnecting(false);
        },
        onError: (err) => {
          setError(
            typeof err === "object" && err && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Erro desconhecido no widget",
          );
          setConnecting(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setConnecting(false);
    }
  };

  const handleSync = async (belvoLinkId: string) => {
    setSyncingId(belvoLinkId);
    setError(null);
    try {
      await syncLink(belvoLinkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncingId(null);
    }
  };

  const connectedCount = belvoLinks.filter((l) => l.status === "valid").length;
  const totalConnections = belvoLinks.length;

  return (
    <DashboardLayout title="Open Finance">
      <div className="space-y-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Conexao</p>
                  <h3 className="text-lg font-display font-bold">Open Finance ativo</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Conecte suas contas e cartoes via Belvo para importar transacoes automaticamente.
              </p>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Conexoes validas</span>
                  <span>{connectedCount}/{totalConnections}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Contas sincronizadas</span>
                  <span>{accounts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <CardTitle className="font-display text-base">Conectar nova instituicao</CardTitle>
              <p className="text-sm text-muted-foreground">
                Abre o widget Belvo para escolher um banco e autorizar o compartilhamento.
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting || loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {connecting ? "Abrindo widget..." : "Conectar conta"}
              </Button>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <CardTitle className="font-display text-base">Ambiente</CardTitle>
              <p className="text-sm text-muted-foreground">
                Rodando em Sandbox Belvo com bancos simulados. Credenciais de teste estao na doc Belvo.
              </p>
              <Badge variant="secondary" className="text-xs">Sandbox</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Conexoes</p>
            <h3 className="text-lg font-display font-bold">Links ativos</h3>
          </div>

          {loading && belvoLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">Carregando conexoes...</p>
          )}

          {!loading && belvoLinks.length === 0 && (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma conexao ainda. Clique em "Conectar conta" para comecar.
                </p>
              </CardContent>
            </Card>
          )}

          {belvoLinks.map((link) => {
            const linkAccounts = accounts.filter(
              (a) => a.institution === link.institution,
            );
            const isValid = link.status === "valid";
            const isSyncing = syncingId === link.belvoLinkId;
            return (
              <Card key={link.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-sm">{link.institution}</p>
                      <p className="text-xs text-muted-foreground">
                        {linkAccounts.length} conta(s) vinculada(s)
                      </p>
                    </div>
                    <Badge
                      variant={isValid ? "default" : "outline"}
                      className="text-xs"
                    >
                      {isValid ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valido
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {link.status}
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Ultima sincronizacao:{" "}
                      {link.lastSyncedAt
                        ? new Date(link.lastSyncedAt).toLocaleString("pt-BR")
                        : "Nunca"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Belvo Link ID: {link.belvoLinkId.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => handleSync(link.belvoLinkId)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Sincronizando..." : "Sincronizar"}
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
