import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/lib/currency";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

export default function TransactionsPage() {
  const { transactions, accounts, categories } = useData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || t.category?.id === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  return (
    <DashboardLayout title="Transações">
      <div className="space-y-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((t) => {
                const account = getAccount(t.accountId);
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{t.category?.icon ?? '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{account?.institution}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{t.date}</span>
                          {t.isRecurring && <Badge variant="outline" className="text-[10px] h-4">Recorrente</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-semibold tabular-nums ${t.amount >= 0 ? 'text-success' : ''}`}>
                        {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                      </p>
                      {t.category && (
                        <Badge variant="secondary" className="text-[10px] mt-0.5 font-normal">{t.category.name}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Nenhuma transação encontrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
