
import { useEffect, useMemo, useState } from "react";
import { Shield, Lock, KeyRound, LogOut, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function formatDate(value?: number) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default function AdminPanel() {
  const utils = trpc.useUtils();
  const sessionQuery = trpc.superAdmin.session.useQuery(undefined, { retry: false });
  const logsQuery = trpc.superAdmin.auditLogs.useQuery(
    { limit: 25 },
    { enabled: sessionQuery.data?.authenticated === true, retry: false }
  );
  const loginMutation = trpc.superAdmin.login.useMutation();
  const changePasswordMutation = trpc.superAdmin.changePassword.useMutation();
  const logoutMutation = trpc.superAdmin.logout.useMutation();

  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const authenticated = Boolean(sessionQuery.data?.authenticated);
  const requiresPasswordChange = Boolean(sessionQuery.data?.session?.requiresPasswordChange);

  useEffect(() => {
    if (sessionQuery.data?.session?.username) {
      setUsername(sessionQuery.data.session.username);
    }
  }, [sessionQuery.data?.session?.username]);

  const stats = sessionQuery.data?.stats;
  const lastEvents = logsQuery.data || [];

  async function handleLogin() {
    try {
      const result = await loginMutation.mutateAsync({ username, password, code: code || undefined });
      if (!result.success) {
        toast.error(result.message || "Falha no login");
        return;
      }
      toast.success(result.requiresPasswordChange ? "Login liberado. Troque a senha agora." : "Login administrativo confirmado");
      setPassword("");
      setCode("");
      await utils.superAdmin.session.invalidate();
      await utils.superAdmin.auditLogs.invalidate();
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível entrar");
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword: password,
        newPassword,
      });
      if (!result.success) {
        toast.error(result.message || "Não foi possível alterar a senha");
        return;
      }
      toast.success("Senha trocada com sucesso");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await utils.superAdmin.session.invalidate();
      await utils.superAdmin.auditLogs.invalidate();
    } catch (error: any) {
      toast.error(error?.message || "Falha ao trocar senha");
    }
  }

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    await utils.superAdmin.session.invalidate();
    toast.success("Sessão encerrada");
  }

  const headline = useMemo(() => {
    if (!authenticated) return "Acesso restrito do superadmin";
    if (requiresPasswordChange) return "Troca de senha obrigatória";
    return "Cockpit administrativo protegido";
  }, [authenticated, requiresPasswordChange]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#11203f_0%,#0a1223_36%,#050814_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200">
              <Shield className="h-4 w-4" />
              Superadmin
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{headline}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Login real no backend, sessão por cookie, trilha de auditoria e senha provisória com troca obrigatória.
            </p>
          </div>

          {authenticated ? (
            <Button onClick={handleLogout} variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-cyan-300" />
                {authenticated ? "Sessão ativa" : "Entrar agora"}
              </CardTitle>
              <CardDescription className="text-slate-300">
                Usuário, senha provisória e código. Troque a senha assim que entrar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!authenticated ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Usuário</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="border-white/10 bg-white/5 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Senha</label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-white/10 bg-white/5 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Código provisório</label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} className="border-white/10 bg-white/5 text-white" placeholder="246810" />
                  </div>
                  <Button onClick={handleLogin} disabled={loginMutation.isPending} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                    <KeyRound className="mr-2 h-4 w-4" />
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </>
              ) : (
                <div className="space-y-3 rounded-3xl border border-emerald-400/15 bg-emerald-500/8 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <div className="font-semibold text-white">{sessionQuery.data?.session?.username}</div>
                      <div className="text-sm text-slate-300">Criada em {formatDate(sessionQuery.data?.session?.createdAt)}</div>
                      <div className="text-sm text-slate-300">Expira em {formatDate(sessionQuery.data?.session?.expiresAt)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Sessões</div>
                      <div className="mt-1 text-xl font-black text-white">{stats?.activeSessions ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Falhas</div>
                      <div className="mt-1 text-xl font-black text-white">{stats?.failedLogins ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Auditoria</div>
                      <div className="mt-1 text-xl font-black text-white">{stats?.auditLogs ?? 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {authenticated ? (
                <div className="space-y-3 rounded-3xl border border-amber-400/15 bg-amber-500/8 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    {requiresPasswordChange ? "Troca obrigatória" : "Atualizar credencial"}
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                    placeholder={requiresPasswordChange ? "Senha atual provisória" : "Senha atual"}
                  />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                    placeholder="Nova senha forte"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                    placeholder="Confirmar nova senha"
                  />
                  <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300">
                    {changePasswordMutation.isPending ? "Atualizando..." : "Salvar nova senha"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-cyan-300" />
                  Auditoria operacional
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Últimos eventos sensíveis do cockpit administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lastEvents.length ? lastEvents.map((log) => (
                  <div key={log.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{log.acao}</div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${log.status === "sucesso" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{log.descricao}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {formatDate(log.timestamp)} • {log.ipAddress}
                      {log.motivoFalha ? ` • ${log.motivoFalha}` : ""}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                    Nenhum log ainda. Assim que houver login, troca de senha ou logout, tudo aparece aqui.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
