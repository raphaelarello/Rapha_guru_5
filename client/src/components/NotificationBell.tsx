import { useState, useRef, useEffect } from "react";
import { Bell, BellOff, BellRing, Check, X } from "lucide-react";

type NotifPrefs = {
  enabled: boolean;
  gols: boolean;
  cartaoVermelho: boolean;
  oportunidades: boolean;
};

type Props = {
  prefs: NotifPrefs;
  permissionGranted: boolean;
  notificationsSupported: boolean;
  toggleEnabled: () => void;
  updatePref: (key: "gols" | "cartaoVermelho" | "oportunidades", value: boolean) => void;
};

export default function NotificationBell({ prefs, permissionGranted, notificationsSupported, toggleEnabled, updatePref }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!notificationsSupported) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition ${
          prefs.enabled
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
        }`}
        title="Notificações"
      >
        {prefs.enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {prefs.enabled && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-[#0d1520] shadow-2xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Notificações Push</span>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Receba alertas em tempo real no seu navegador
            </p>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Toggle principal */}
            <button
              type="button"
              onClick={toggleEnabled}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold transition ${
                prefs.enabled
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                  : "bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              <span className="flex items-center gap-2">
                {prefs.enabled ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {prefs.enabled ? "Notificações Ativas" : "Ativar Notificações"}
              </span>
              <div className={`h-5 w-9 rounded-full transition ${prefs.enabled ? "bg-emerald-500" : "bg-slate-600"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.enabled ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>

            {!permissionGranted && !prefs.enabled && (
              <p className="text-[10px] text-amber-400/80">
                Clique em "Ativar" e permita as notificações no seu navegador.
              </p>
            )}

            {prefs.enabled && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tipos de alerta</p>
                
                {([
                  { key: "gols" as const, label: "Gols", emoji: "⚽", desc: "Alerta quando um gol é marcado" },
                  { key: "cartaoVermelho" as const, label: "Cartão Vermelho", emoji: "🟥", desc: "Alerta de expulsões" },
                  { key: "oportunidades" as const, label: "Oportunidades", emoji: "🎯", desc: "Sinais de aposta detectados" },
                ]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updatePref(item.key, !prefs[item.key])}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                      prefs[item.key]
                        ? "bg-white/[0.04] border border-emerald-400/15"
                        : "bg-white/[0.02] border border-white/[0.06] opacity-60"
                    }`}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-200">{item.label}</span>
                      <p className="text-[9px] text-slate-500">{item.desc}</p>
                    </div>
                    {prefs[item.key] ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded border border-slate-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
