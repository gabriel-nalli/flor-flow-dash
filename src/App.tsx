import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfileSelector, ProfileSelectorProvider } from "@/contexts/ProfileSelectorContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";

// Páginas carregadas sob demanda (code-splitting por rota): evita baixar/parsear
// o app inteiro (incluindo gráficos do funil) antes da primeira tela aparecer.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leads = lazy(() => import("@/pages/Leads"));
const LeadsAlicia = lazy(() => import("@/pages/LeadsAlicia"));
const Routine = lazy(() => import("@/pages/Routine"));
const SalesGoal = lazy(() => import("@/pages/SalesGoal"));
const WebinarFunnel = lazy(() => import("@/pages/WebinarFunnel"));
const Commissions = lazy(() => import("@/pages/Commissions"));
const Login = lazy(() => import("@/pages/Login"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados ficam "frescos" por 5min: voltar a uma aba já visitada é servido
      // do cache (sem rebaixar ~1MB nem re-renderizar a tabela inteira).
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // Não refazer todas as queries só por trocar de janela (ex.: WhatsApp -> navegador no celular).
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useProfileSelector();
  if (!isAdmin) return <Navigate to="/leads" replace />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <LanguageProvider>
      <ProfileSelectorProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads-alicia" element={<LeadsAlicia />} />
            <Route path="/routine" element={<Routine />} />
            <Route path="/meta" element={<AdminRoute><SalesGoal /></AdminRoute>} />
            <Route path="/funil-webinar" element={<AdminRoute><WebinarFunnel /></AdminRoute>} />
            <Route path="/comissoes" element={<AdminRoute><Commissions /></AdminRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProfileSelectorProvider>
    </LanguageProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
