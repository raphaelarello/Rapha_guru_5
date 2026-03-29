import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, Filter, Search, X } from "lucide-react";

export type SortKey = "NEAREST_TIME" | "EDGE" | "EV" | "SCORE" | "MOMENTUM";
export type StatusKey = "LIVE" | "UPCOMING" | "FINISHED";

export type DestaquesFilters = {
  date: string; // YYYY-MM-DD
  statusFilter: StatusKey[];
  leagueIds: number[];
  sort: SortKey;
  finishedWindowHours: number;
};

export function DestaquesTopBar(props: {
  value: DestaquesFilters;
  onChange: (next: DestaquesFilters) => void;
  counts?: { live: number; upcoming: number; finished: number; total: number };
  updatedAtISO?: string;
  availableLeagues: Array<{ id: number; name: string; country?: string }>;
}) {
  const { value, onChange, counts, updatedAtISO, availableLeagues } = props;

  const setDate = (iso: string) => onChange({ ...value, date: iso });
  const setSort = (sort: SortKey) => onChange({ ...value, sort });

  const setStatusOnly = (s: StatusKey | "ALL") => {
    if (s === "ALL") onChange({ ...value, statusFilter: ["LIVE", "UPCOMING", "FINISHED"] });
    else onChange({ ...value, statusFilter: [s] });
  };

  const isOnly = (s: StatusKey | "ALL") => {
    if (s === "ALL") return value.statusFilter.length === 3;
    return value.statusFilter.length === 1 && value.statusFilter[0] === s;
  };

  // MultiSelect ligas
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedSet = useMemo(() => new Set(value.leagueIds), [value.leagueIds]);

  const filteredLeagues = useMemo(() => {
    if (!q) return availableLeagues;
    const qq = q.toLowerCase();
    return availableLeagues.filter((l) => l.name.toLowerCase().includes(qq));
  }, [availableLeagues, q]);

  const toggleLeague = (id: number) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...value, leagueIds: Array.from(next) });
  };

  const selectAll = () => onChange({ ...value, leagueIds: availableLeagues.map((l) => l.id) });
  const clearAll = () => onChange({ ...value, leagueIds: [] });

  const dateQuick = (deltaDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + deltaDays);
    setDate(d.toISOString().slice(0, 10));
  };

  const updatedText = useMemo(() => {
    if (!updatedAtISO) return "";
    try {
      return `Atualizado ${new Date(updatedAtISO).toLocaleTimeString()}`;
    } catch {
      return "";
    }
  }, [updatedAtISO]);

  return (
    <div className="sticky top-[56px] z-30 rounded-xl border border-white/10 bg-black/40 backdrop-blur p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date quick + input */}
        <button className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]" onClick={() => dateQuick(0)}>
          Hoje
        </button>
        <button className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]" onClick={() => dateQuick(-1)}>
          Ontem
        </button>
        <button className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]" onClick={() => dateQuick(1)}>
          Amanhã
        </button>

        <div className="ml-1 flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={value.date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 outline-none"
          />
        </div>

        {/* Status tabs */}
        <div className="ml-2 flex items-center overflow-hidden rounded-lg border border-white/10">
          <button className={`h-8 px-3 text-xs font-semibold ${isOnly("ALL") ? "bg-emerald-500/15 text-emerald-200" : "text-slate-200 hover:bg-white/[0.06]"}`} onClick={() => setStatusOnly("ALL")}>
            Todos{counts ? ` (${counts.total})` : ""}
          </button>
          <button className={`h-8 px-3 text-xs font-semibold ${isOnly("LIVE") ? "bg-emerald-500/15 text-emerald-200" : "text-slate-200 hover:bg-white/[0.06]"}`} onClick={() => setStatusOnly("LIVE")}>
            Ao vivo{counts ? ` (${counts.live})` : ""}
          </button>
          <button className={`h-8 px-3 text-xs font-semibold ${isOnly("UPCOMING") ? "bg-emerald-500/15 text-emerald-200" : "text-slate-200 hover:bg-white/[0.06]"}`} onClick={() => setStatusOnly("UPCOMING")}>
            Próximos{counts ? ` (${counts.upcoming})` : ""}
          </button>
          <button className={`h-8 px-3 text-xs font-semibold ${isOnly("FINISHED") ? "bg-emerald-500/15 text-emerald-200" : "text-slate-200 hover:bg-white/[0.06]"}`} onClick={() => setStatusOnly("FINISHED")}>
            Encerrados{counts ? ` (${counts.finished})` : ""}
          </button>
        </div>

        {/* Encerrados window */}
        <div className="ml-2 flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Enc:</span>
          {[6, 12, 24].map((h) => (
            <button
              key={h}
              className={`h-8 rounded-lg border px-3 text-xs font-semibold ${
                value.finishedWindowHours === h
                  ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
              }`}
              onClick={() => onChange({ ...value, finishedWindowHours: h })}
            >
              {h}h
            </button>
          ))}
        </div>

        {/* Multi-liga */}
        <div ref={popRef} className="relative ml-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
              value.leagueIds.length
                ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
            }`}
          >
            <Filter className="h-4 w-4" />
            {value.leagueIds.length ? `${value.leagueIds.length} liga(s)` : "Todas as ligas"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            {value.leagueIds.length > 0 ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                  setOpen(false);
                }}
                className="ml-1 rounded-full bg-white/10 p-0.5 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </span>
            ) : null}
          </button>

          {open ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#0f1923] shadow-2xl shadow-black/40">
              <div className="border-b border-white/[0.06] p-2">
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar liga..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                    autoFocus
                  />
                  {q ? (
                    <button onClick={() => setQ("")} className="rounded-full bg-white/10 p-1 hover:bg-white/20">
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button onClick={selectAll} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 hover:bg-white/[0.06]">
                    Selecionar todas
                  </button>
                  <button onClick={clearAll} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 hover:bg-white/[0.06]">
                    Limpar
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {filteredLeagues.map((l) => {
                  const checked = selectedSet.has(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLeague(l.id)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-white/[0.04] ${
                        checked ? "bg-emerald-500/5 text-emerald-200" : "text-slate-200"
                      }`}
                    >
                      <span className="truncate">{l.name}</span>
                      <span className={`h-4 w-4 rounded border ${checked ? "border-emerald-400 bg-emerald-400/30" : "border-white/10 bg-transparent"}`} />
                    </button>
                  );
                })}
                {filteredLeagues.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">Nenhuma liga encontrada.</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Ordenar:</span>
          <select
            value={value.sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs font-semibold text-slate-200 outline-none"
          >
            <option value="NEAREST_TIME">Horário mais próximo</option>
            <option value="EDGE">Edge</option>
            <option value="EV">EV</option>
            <option value="SCORE">Score</option>
            <option value="MOMENTUM">Momentum (live)</option>
          </select>

          <span className="text-[11px] text-slate-400">{updatedText}</span>
        </div>
      </div>
    </div>
  );
}
