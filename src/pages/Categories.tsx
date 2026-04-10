import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const { categories } = useData();
  const expenses = categories.filter((c) => c.type === 'EXPENSE');
  const income = categories.filter((c) => c.type === 'INCOME');
  const transfers = categories.filter((c) => c.type === 'TRANSFER');

  const renderGroup = (title: string, cats: Category[]) => (
    <div>
      <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {cats.map((cat) => (
          <Card key={cat.id} className="border-border/50 hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: cat.color + '20' }}>
                {cat.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{cat.name}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5">{cat.isSystem ? 'Sistema' : 'Personalizada'}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Categorias">
      <div className="space-y-8 max-w-4xl">
        {renderGroup('Despesas', expenses)}
        {renderGroup('Receitas', income)}
        {renderGroup('Transferências', transfers)}
      </div>
    </DashboardLayout>
  );
}
