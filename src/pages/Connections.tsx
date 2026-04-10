import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/DataContext";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ImportLogEntry {
  fileName: string;
  source: "ofx" | "xlsx";
  accountsImported?: number;
  transactionsImported: number;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ConnectionsPage() {
  const { accounts, importOfx, importXlsx, loading } = useData();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<ImportLogEntry[]>([]);

  // OFX
  const ofxInputRef = useRef<HTMLInputElement>(null);

  // XLSX form state
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const [xlsxInstitution, setXlsxInstitution] = useState("BTG Pactual");
  const [xlsxAccountName, setXlsxAccountName] = useState("");
  const [xlsxAccountType, setXlsxAccountType] = useState<
    "CHECKING" | "SAVINGS" | "CREDIT"
  >("CHECKING");

  const handleOfxFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const entries: ImportLogEntry[] = [];
      for (const file of files) {
        const r = await importOfx(file);
        entries.push({
          fileName: file.name,
          source: "ofx",
          accountsImported: r.accountsImported,
          transactionsImported: r.transactionsImported,
        });
      }
      setLog((prev) => [...entries, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
      if (ofxInputRef.current) ofxInputRef.current.value = "";
    }
  };

  const handleXlsxFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!xlsxInstitution.trim() || !xlsxAccountName.trim()) {
      setError("Preencha instituicao e nome da conta antes de escolher o arquivo.");
      if (xlsxInputRef.current) xlsxInputRef.current.value = "";
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const identifier = `${slugify(xlsxInstitution)}-${slugify(xlsxAccountName)}`;
      const r = await importXlsx(file, {
        institution: xlsxInstitution.trim(),
        accountName: xlsxAccountName.trim(),
        accountType: xlsxAccountType,
        accountIdentifier: identifier,
      });
      setLog((prev) =>
        [
          {
            fileName: file.name,
            source: "xlsx" as const,
            transactionsImported: r.transactionsImported,
          },
          ...prev,
        ].slice(0, 20),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
      if (xlsxInputRef.current) xlsxInputRef.current.value = "";
    }
  };

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
            OFX e o formato padrao da maioria dos bancos. Pra bancos que so
            exportam Excel (como BTG Pactual), use a opcao XLSX abaixo.
          </p>
        </div>

        {/* OFX upload */}
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {importing ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <FileText className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-display font-bold">
                  Importar OFX (conta + cartao)
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Nubank, Itau, BB, Inter, Bradesco. Aceita varios arquivos de
                  uma vez. Duplicatas sao ignoradas automaticamente.
                </p>
              </div>
              <input
                ref={ofxInputRef}
                type="file"
                accept=".ofx,.OFX,.qfx,.QFX"
                multiple
                onChange={handleOfxFiles}
                className="hidden"
              />
              <Button
                onClick={() => ofxInputRef.current?.click()}
                disabled={importing || loading}
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Escolher arquivos OFX
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* XLSX upload */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="font-display text-base">
                  Importar XLSX (Excel)
                </CardTitle>
                <CardDescription>
                  Pra bancos que nao exportam OFX — como BTG Pactual. Preencha
                  os dados da conta, depois escolha o arquivo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="xlsx-institution">Instituicao</Label>
                <Input
                  id="xlsx-institution"
                  value={xlsxInstitution}
                  onChange={(e) => setXlsxInstitution(e.target.value)}
                  placeholder="BTG Pactual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xlsx-name">Nome da conta</Label>
                <Input
                  id="xlsx-name"
                  value={xlsxAccountName}
                  onChange={(e) => setXlsxAccountName(e.target.value)}
                  placeholder="Conta Digital ou Cartao Black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-2">
                {(["CHECKING", "SAVINGS", "CREDIT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setXlsxAccountType(t)}
                    className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                      xlsxAccountType === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {t === "CHECKING"
                      ? "Corrente"
                      : t === "SAVINGS"
                      ? "Investimento"
                      : "Cartao de credito"}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <input
                ref={xlsxInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleXlsxFile}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => xlsxInputRef.current?.click()}
                disabled={importing || loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Escolher arquivo XLSX
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                O parser detecta automaticamente colunas de Data, Descricao e
                Valor (ou Debito/Credito).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Como baixar */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Como baixar do seu banco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Nubank (OFX):</strong> App →
              Extrato → ⋯ → Exportar → OFX. Cartao: App → Cartao de credito →
              Faturas → fatura → Exportar → OFX.
            </p>
            <p>
              <strong className="text-foreground">Banco do Brasil (OFX):</strong>{" "}
              Internet Banking → Conta → Extrato → Exportar → OFX. Cartao: Menu
              Cartoes → Fatura → Exportar.
            </p>
            <p>
              <strong className="text-foreground">BTG Pactual (XLSX):</strong>{" "}
              App → Extrato → Exportar → Excel. Nao exporta OFX — use o upload
              XLSX acima.
            </p>
            <p>
              <strong className="text-foreground">Itau / Bradesco / Inter (OFX):</strong>{" "}
              Internet Banking ou App → Extrato → Exportar → OFX.
            </p>
          </CardContent>
        </Card>

        {/* Recent imports */}
        {log.length > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Historico
              </p>
              <h3 className="text-lg font-display font-bold">
                Importacoes desta sessao
              </h3>
            </div>
            <div className="space-y-2">
              {log.map((imp, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm flex items-center gap-2">
                          {imp.source === "ofx" ? (
                            <FileText className="h-3 w-3" />
                          ) : (
                            <FileSpreadsheet className="h-3 w-3" />
                          )}
                          {imp.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {imp.source === "ofx" && imp.accountsImported != null
                            ? `${imp.accountsImported} conta(s), `
                            : ""}
                          {imp.transactionsImported} transacao(oes)
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {imp.source.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Imported accounts */}
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
                        ? "Investimento"
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
