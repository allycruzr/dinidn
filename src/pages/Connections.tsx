import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ImportResult {
  fileName: string;
  accountsImported: number;
  transactionsImported: number;
}

export default function ConnectionsPage() {
  const { accounts, importOfx, loading } = useData();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentImports, setRecentImports] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      const results: ImportResult[] = [];
      for (const file of files) {
        const result = await importOfx(file);
        results.push({
          fileName: file.name,
          accountsImported: result.accountsImported,
          transactionsImported: result.transactionsImported,
        });
      }
      setRecentImports((prev) => [...results, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const pickFiles = () => fileInputRef.current?.click();

  return (
    <DashboardLayout title="Importar extrato">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Importacao
          </p>
          <h2 className="text-2xl font-display font-bold">
            Suba os extratos dos seus bancos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Baixe o arquivo OFX do internet banking e faca upload aqui. Contas e
            transacoes sao importadas automaticamente no dashboard.
          </p>
        </div>

        {/* Upload card */}
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {importing ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-display font-bold">
                  {importing ? "Importando..." : "Selecione arquivos OFX"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aceita multiplos arquivos. Transacoes duplicadas sao ignoradas
                  automaticamente.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.OFX,.qfx,.QFX"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={pickFiles}
                disabled={importing || loading}
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Escolher arquivos
              </Button>
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive max-w-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Como baixar */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Como baixar o OFX do seu banco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Nubank:</strong> App → Extrato
              → ⋯ → Exportar extrato → OFX
            </p>
            <p>
              <strong className="text-foreground">Itau:</strong> Internet
              Banking → Extrato → Exportar → Money/OFX
            </p>
            <p>
              <strong className="text-foreground">Bradesco:</strong> Internet
              Banking → Conta Corrente → Extrato → Exportar → OFX
            </p>
            <p>
              <strong className="text-foreground">Banco do Brasil:</strong>{" "}
              Internet Banking → Conta Corrente → Extrato → OFX
            </p>
            <p>
              <strong className="text-foreground">BTG Pactual:</strong> App →
              Extrato → Exportar → OFX
            </p>
            <p>
              <strong className="text-foreground">Inter:</strong> App → Extrato
              → Exportar → OFX
            </p>
          </CardContent>
        </Card>

        {/* Recent imports */}
        {recentImports.length > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Historico
              </p>
              <h3 className="text-lg font-display font-bold">
                Importacoes recentes (esta sessao)
              </h3>
            </div>
            <div className="space-y-2">
              {recentImports.map((imp, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {imp.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {imp.accountsImported} conta(s),{" "}
                          {imp.transactionsImported} transacao(oes)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Imported accounts summary */}
        {accounts.length > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Contas
              </p>
              <h3 className="text-lg font-display font-bold">
                Contas importadas ({accounts.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accounts.map((a) => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm">
                        {a.institution}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {a.type === "CREDIT"
                        ? "Cartao"
                        : a.type === "SAVINGS"
                        ? "Poupanca"
                        : "Corrente"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
