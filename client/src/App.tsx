import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import EleitusHome from "./pages/EleitusHome";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Eleitus from "./pages/Eleitus";
import EleitusPainel from "./pages/EleitusPainel";
import EleitusInteracoes from "./pages/EleitusInteracoes";
import { useEffect } from "react";

// Guard para rotas protegidas
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="text-center">
          <div className="w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl">✨</span>
          </div>
          <p className="text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  return <Component />
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={EleitusHome} />
      <Route path="/login" component={Login} />
      <Route path="/chat">
        {() => <ProtectedRoute component={Chat} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={Admin} />}
      </Route>
      <Route path="/perfil">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      {/* ELEITUS — público: demo do avatar do candidato */}
      <Route path="/eleitus" component={Eleitus} />
      <Route path="/eleitus/painel" component={EleitusPainel} />
      <Route path="/eleitus/interacoes" component={EleitusInteracoes} />
      <Route path="/eleitus/:candidatoId" component={Eleitus} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
