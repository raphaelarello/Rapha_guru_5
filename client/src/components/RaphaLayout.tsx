"use client";

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Radio,
  Wallet,
  Sparkles,
  Bot,
  Trophy,
  Users,
  BarChart3,
  Settings,
  BellRing,
  Wifi,
  WifiOff,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/sofa/CommandPalette";
import { PageHeader } from "@/components/sofa/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useSSE } from "@/hooks/useSSE";

const navItems = [
  { path: "/painel", label: "Painel", icon: LayoutDashboard },
  { path: "/ao-vivo", label: "Ao Vivo", icon: Radio, badge: "AO VIVO" },
  { path: "/jogos-hoje", label: "Jogos", icon: CalendarDays },
  { path: "/destaques", label: "Destaques", icon: Sparkles, badge: "HOT", accent: "hot" },
  { path: "/apostas", label: "Apostas", icon: Wallet, badge: "FAST" },
  { path: "/pitacos", label: "Pitacos", icon: Sparkles, badge: "IA" },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/ligas", label: "Ligas", icon: Trophy },
  { path: "/times", label: "Times", icon: Users },
  { path: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

interface RaphaLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function faixaCor(prioridade?: string) {
  if (prioridade === "critica") return "text-red-200 border-red-500/25 bg-red-500/10";
  if (prioridade === "alta") return "text-amber-200 border-amber-500/25 bg-amber-500/10";
  return "text-cyan-100 border-cyan-500/20 bg-cyan-500/10";
}

export default function RaphaLayout({ children, title, subtitle }: RaphaLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { connected, naoLidas } = useSSE({ enabled: isAuthenticated });
  // const { data: apiUsage } = trpc.football.apiUsage.useQuery(undefined, { enabled: isAuthenticated });
  const { data: alertas = [] } = trpc.football.centralAlertas.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  const ticker = useMemo(() => alertas.slice(0, 10), [alertas]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0d1d3b_0%,#08101c_32%,#060b14_100%)] pb-12 text-foreground" >
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 md:px-5">
            <a href="/painel" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card text-foreground border border-border">
              <Radio className="h-5 w-5" />
            </a>

            <div className="flex flex-1 items-center gap-2">
              <CommandPalette className="max-w-[520px] flex-1" />
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
              {ticker.length > 0 ? (
                <div className="alerta-marquee relative min-w-0 flex-1 overflow-hidden rounded-full border border-border bg-card px-4 py-2">
                  <div className="alerta-marquee-track flex items-center gap-3 whitespace-nowrap text-[12px] text-slate-200">
                    {ticker.concat(ticker).map((alerta: any, idx: number) => (
                      <a
                        key={`${alerta.fixtureId}-${idx}`}
                        href={alerta.fixtureId ? `/ao-vivo?jogo=${alerta.fixtureId}` : "/ao-vivo"}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${faixaCor(alerta.prioridade)}`}
                      >
                        <span className="font-semibold">{alerta.titulo}</span>
                        <span className="text-slate-300">{alerta.resumo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-[12px] text-slate-400">
                  Central de Alertas aguardando eventos relevantes...
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-slate-300">
                {connected ? <Wifi className="mr-1 inline h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="mr-1 inline h-3.5 w-3.5 text-red-400" />}
                {connected ? "Tempo real ativo" : "Conexão em espera"}
              </div>
              <div className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-slate-300">
                <BellRing className="mr-1 inline h-3.5 w-3.5 text-cyan-300" />
                {naoLidas} notificações
              </div>
              <div className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-slate-300">
                API 0% usada
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-right md:block">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Usuário</div>
                <div className="text-sm font-semibold text-foreground">{user?.name || "Usuário"}</div>
              </div>
              <Avatar className="h-10 w-10 bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <AvatarFallback className="bg-transparent font-bold text-emerald-300">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={logout} className="rounded-full border border-border bg-card text-slate-300 hover:bg-white/8 hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} className="rounded-full border border-border bg-card text-slate-300 md:hidden">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-2 py-2 md:px-4">
          <nav className="hidden gap-2 overflow-x-auto md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const ativo = location === item.path;
              const hot = item.accent === "hot";
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                    ativo
                      ? hot
                        ? "border-amber-300/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.95),rgba(249,115,22,0.95))] text-slate-950 shadow-[0_14px_34px_rgba(249,115,22,0.28)]"
                        : "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                      : hot
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/16"
                        : "border-border bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${hot ? "bg-slate-950/12 text-slate-900" : "bg-red-500/15 text-red-200"}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>

          {mobileOpen ? (
            <nav className="grid grid-cols-2 gap-2 md:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const ativo = location === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                      ativo
                        ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                        : "border-border bg-white/[0.03] text-slate-200",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-5 md:py-5">
        {(title || subtitle) ? (
          <PageHeader
            title={title ?? ""}
            subtitle={subtitle}
            right={
              <a
                href="/destaques"
                className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent lg:inline-flex"
              >
                Abrir Destaques
                <ChevronRight className="h-4 w-4" />
              </a>
            }
          />
        ) : null}
        {children}
      </main>

      {ticker.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07101b]/96 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 overflow-hidden px-3 py-2 md:px-5">
            <div className="hidden shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-200 md:block">
              Alertas
            </div>
            <div className="alerta-marquee relative min-w-0 flex-1 overflow-hidden">
              <div className="alerta-marquee-track flex items-center gap-3 whitespace-nowrap text-[12px] text-slate-200">
                {ticker.concat(ticker).map((alerta: any, idx: number) => (
                  <a
                    key={`bottom-${alerta.fixtureId}-${idx}`}
                    href={alerta.fixtureId ? `/ao-vivo?jogo=${alerta.fixtureId}` : "/ao-vivo"}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${faixaCor(alerta.prioridade)}`}
                  >
                    <span className="font-semibold">{alerta.titulo}</span>
                    <span className="text-slate-300">{alerta.resumo}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
