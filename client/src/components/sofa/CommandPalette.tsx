import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Radio,
  CalendarDays,
  Sparkles,
  Wallet,
  BarChart3,
  Trophy,
  Users,
  Bot,
  Settings,
  LayoutDashboard,
  Target,
  Search,
} from "lucide-react";

type QuickLink = { label: string; path: string; icon: any; hint?: string; badge?: string };

const links: QuickLink[] = [
  { label: "Painel", path: "/painel", icon: LayoutDashboard },
  { label: "Ao Vivo", path: "/ao-vivo", icon: Radio, badge: "LIVE" },
  { label: "Jogos (Hoje)", path: "/jogos-hoje", icon: CalendarDays },
  { label: "Destaques", path: "/destaques", icon: Sparkles, badge: "HOT" },
  { label: "Apostas", path: "/apostas", icon: Wallet },
  { label: "Estatísticas", path: "/estatisticas", icon: BarChart3 },
  { label: "Ligas", path: "/ligas", icon: Trophy },
  { label: "Times", path: "/times", icon: Users },
  { label: "Bots", path: "/bots", icon: Bot },
  { label: "Match Center", path: "/match-center", icon: Target },
  { label: "Configurações", path: "/configuracoes", icon: Settings },
];

export function CommandPalette({ className }: { className?: string }) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar times
  const teamsQuery = trpc.football.searchTeams.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 1 }
  );

  // Buscar ligas
  const leaguesQuery = trpc.football.searchLeagues.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 1 }
  );

  // Buscar jogos
  const fixturesQuery = trpc.football.searchFixtures.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 1 }
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(() => {
    const result = [{ title: "Navegação", items: links }];

    // Adicionar resultados de busca se houver query
    if (searchQuery.length > 1) {
      const teams = teamsQuery.data?.response || [];
      const leagues = leaguesQuery.data?.response || [];
      const fixtures = fixturesQuery.data?.response || [];

      if (teams.length > 0) {
        result.push({
          title: "Times",
          items: teams.slice(0, 5).map((team: any) => ({
            label: team.name,
            path: `/times?id=${team.id}`,
            icon: Users,
            hint: team.country,
          })),
        });
      }

      if (leagues.length > 0) {
        result.push({
          title: "Ligas",
          items: leagues.slice(0, 5).map((league: any) => ({
            label: league.name,
            path: `/jogos-hoje?liga=${league.id}`,
            icon: Trophy,
            hint: league.country,
          })),
        });
      }

      if (fixtures.length > 0) {
        result.push({
          title: "Jogos",
          items: fixtures.slice(0, 5).map((fixture: any) => ({
            label: `${fixture.teams?.home?.name || "?"} vs ${fixture.teams?.away?.name || "?"}`,
            path: `/match-center?id=${fixture.id}`,
            icon: Radio,
            hint: fixture.league?.name,
          })),
        });
      }
    }

    return result;
  }, [searchQuery, teamsQuery.data, leaguesQuery.data, fixturesQuery.data]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground",
          "hover:text-foreground md:inline-flex",
          className,
        )}
        aria-label="Abrir busca (Ctrl+K)"
      >
        <span className="text-muted-foreground">Buscar…</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="rounded border border-border px-1.5 py-0.5">Ctrl</span>
          <span className="rounded border border-border px-1.5 py-0.5">K</span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 sm:max-w-[640px]">
          <Command>
            <CommandInput
              placeholder="Buscar páginas, times, ligas, jogos…"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[420px]">
              <CommandEmpty>
                {searchQuery.length > 1 ? "Nenhum resultado encontrado." : "Digite para buscar..."}
              </CommandEmpty>
              {groups.map((g) => (
                <CommandGroup key={g.title} heading={g.title}>
                  {g.items.map((it: any) => {
                    const Icon = it.icon;
                    return (
                      <CommandItem
                        key={it.path}
                        value={it.label}
                        onSelect={() => {
                          setOpen(false);
                          setSearchQuery("");
                          setLocation(it.path);
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="flex-1">{it.label}</span>
                        {it.hint && (
                          <span className="text-xs text-muted-foreground ml-2">{it.hint}</span>
                        )}
                        {it.badge ? <Badge variant="secondary">{it.badge}</Badge> : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
