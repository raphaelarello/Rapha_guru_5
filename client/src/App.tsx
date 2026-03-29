import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AoVivo from "./pages/AoVivo";
import Apostas from "./pages/Apostas";
import Artilheiros from "./pages/Artilheiros";
import Auditoria from "./pages/Auditoria";
import Bots from "./pages/Bots";
import Configuracoes from "./pages/Configuracoes";
import DashboardFinanceiro from "./pages/DashboardFinanceiro";
import DestaquesScannerV2 from "./pages/DestaquesScannerV2";
import Estatisticas from "./pages/Estatisticas";
import Ligas from "./pages/Ligas";
import Painel from "./pages/Painel";
import Pitacos from "./pages/Pitacos";
import Times from "./pages/Times";
import JogosHoje from "./pages/JogosHoje";
import Jogos from "./pages/Jogos";
import MatchCenter from "./pages/MatchCenter";
import KellyTracker from "./pages/KellyTracker";
import StatsBoard from "./pages/StatsBoard";
import HistoricoApostas from "./pages/HistoricoApostas";
import DashboardAcuracia from "./pages/DashboardAcuracia";
import DashboardAcuraciaRealtime from "./pages/DashboardAcuraciaRealtime";
import DashboardBacktesting from "./pages/DashboardBacktesting";
import DashboardPerformance from "./pages/DashboardPerformance";
import { HistoricoPicks } from "./pages/HistoricoPicks";
import { JogosAgendados } from "./pages/JogosAgendados";
import { AlertasTempoReal } from "./components/AlertasTempoReal";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/painel"} component={Painel} />
      <Route path={"/ao-vivo"} component={AoVivo} />
      <Route path={"/destaques"} component={DestaquesScannerV2} />
      <Route path={"/apostas"} component={Apostas} />
      <Route path={"/pitacos"} component={Pitacos} />
      <Route path={"/estatisticas"} component={Estatisticas} />
      <Route path={"/times"} component={Times} />
      <Route path={"/ligas"} component={Ligas} />
      <Route path={"/jogos"} component={Jogos} />
      <Route path={"/jogos-hoje"} component={JogosHoje} />
      <Route path="/match-center" component={MatchCenter} />
      <Route path="/kelly-tracker" component={KellyTracker} />
      <Route path="/stats" component={StatsBoard} />
      <Route path="/historico" component={HistoricoApostas} />
      <Route path="/acuracia" component={DashboardAcuracia} />
      <Route path="/acuracia-realtime" component={DashboardAcuraciaRealtime} />
      <Route path="/backtesting" component={DashboardBacktesting} />
      <Route path="/performance" component={DashboardPerformance} />
      <Route path="/historico-picks" component={HistoricoPicks} />
      <Route path="/jogos-agendados" component={JogosAgendados} />
      <Route path="/artilheiros" component={Artilheiros} />
      <Route path={"/bots"} component={Bots} />
      <Route path={"/dashboard-financeiro"} component={DashboardFinanceiro} />
      <Route path={"/auditoria"} component={Auditoria} />
      <Route path={"/configuracoes"} component={Configuracoes} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <AlertasTempoReal />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
