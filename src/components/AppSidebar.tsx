import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Landmark,
  Tags, Target, TrendingUp, PieChart, FileBarChart, Database, Settings, LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transações", url: "/transactions", icon: ArrowLeftRight },
  { title: "Cartões", url: "/cards", icon: CreditCard },
  { title: "Contas", url: "/accounts", icon: Landmark },
  { title: "Categorias", url: "/categories", icon: Tags },
];

const planItems = [
  { title: "Metas", url: "/goals", icon: Target },
  { title: "Projeções", url: "/projections", icon: TrendingUp },
  { title: "Patrimônio", url: "/patrimony", icon: PieChart },
  { title: "Relatórios", url: "/reports", icon: FileBarChart },
  { title: "Open Finance", url: "/connections", icon: Database },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="hover:bg-sidebar-accent/50 transition-colors"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-4 py-5">
          {!collapsed ? (
            <h1 className="font-display text-xl font-bold text-gradient">FinanceFlow</h1>
          ) : (
            <h1 className="font-display text-xl font-bold text-primary text-center">F</h1>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
            {!collapsed && "Visão Geral"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
            {!collapsed && "Planejamento"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(planItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
              <Settings className="mr-2 h-4 w-4" />
              {!collapsed && <span>Configurações</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
