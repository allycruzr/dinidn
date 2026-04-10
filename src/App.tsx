import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Cards from "./pages/Cards";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Goals from "./pages/Goals";
import Projections from "./pages/Projections";
import Patrimony from "./pages/Patrimony";
import Reports from "./pages/Reports";
import Connections from "./pages/Connections";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/projections" element={<Projections />} />
            <Route path="/patrimony" element={<Patrimony />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
