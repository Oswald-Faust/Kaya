import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  KeyRound,
  Layers,
  LogOut,
  Radio,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCheck,
} from "lucide-react";
import { deleteUserAction, revokeSessionsAction, setAdminAction, setSuspendedAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { CopyButton } from "@/components/admin/copy-button";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { Avatar, Card, CardHeader, Pill, PlanPill, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { getUserDetail } from "@/server/services/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Détail Utilisateur" };

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user, memberships, sessions, activity } = detail;
  const self = user.id === admin.userId;
  const liveSessions = sessions.filter((s) => s.expiresAt > new Date());
  const allWorkspaces = memberships.flatMap((m) => m.workspaces);

  return (
    <div className="space-y-6">
      {/* Navigation & Breadcrumbs */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          <span>Retour à la liste des utilisateurs</span>
        </Link>
      </div>

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            <div className="relative">
              <span
                aria-hidden
                className="grid size-16 shrink-0 place-items-center rounded-2xl text-lg font-bold text-ink shadow-xs sm:size-18 sm:text-xl"
                style={{
                  background: `linear-gradient(135deg, hsl(${[...user.email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 15)} 85% 90%), hsl(${[...user.email].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 15)} 70% 80%))`,
                }}
              >
                {(user.name || user.email)
                  .split(/[\s@.]/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]!.toUpperCase())
                  .join("")}
              </span>
              {liveSessions.length > 0 && !user.suspendedAt && (
                <span
                  title="Session active en ligne"
                  className="absolute -bottom-1 -right-1 flex size-4.5 items-center justify-center rounded-full border-2 border-surface bg-positive"
                >
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {user.name || "Utilisateur sans nom"}
                </h1>
                {user.isPlatformAdmin && <Pill tone="ink">Admin Kaya</Pill>}
                {user.isGuest && <Pill>Invité</Pill>}
                {user.suspendedAt ? (
                  <Pill tone="negative">Compte suspendu</Pill>
                ) : (
                  <Pill tone="positive">Actif</Pill>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1 font-medium text-ink">
                  {user.email}
                  <CopyButton text={user.email} label="Copier l'email" />
                </span>
                <span className="hidden text-subtle sm:inline">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-2xs text-subtle">
                  ID: {user.id}
                  <CopyButton text={user.id} label="Copier l'identifiant" />
                </span>
                <span className="hidden text-subtle sm:inline">·</span>
                <span className="inline-flex items-center gap-1 text-subtle">
                  <Calendar className="size-3" /> Inscrit le {formatDate(user.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {!self && !user.suspendedAt && (
              <ImpersonateButton
                userId={user.id}
                userName={user.name}
                userEmail={user.email}
              />
            )}

            {user.isPlatformAdmin ? (
              <ActionButton
                action={setAdminAction.bind(null, user.id, false)}
                icon={<ShieldOff className="size-3.5" />}
                confirm="Retirer les droits administrateur de la plateforme ?"
              >
                Retirer admin
              </ActionButton>
            ) : (
              !user.isGuest && (
                <ActionButton
                  action={setAdminAction.bind(null, user.id, true)}
                  icon={<ShieldCheck className="size-3.5" />}
                  confirm={`Donner les droits d'administrateur complets à ${user.email} ?`}
                >
                  Rendre admin
                </ActionButton>
              )
            )}

            <ActionButton
              action={revokeSessionsAction.bind(null, user.id)}
              icon={<LogOut className="size-3.5" />}
              confirm="Déconnecter cet utilisateur de toutes ses sessions actives ?"
            >
              Déconnecter partout
            </ActionButton>

            {!self && (
              user.suspendedAt ? (
                <ActionButton
                  action={setSuspendedAction.bind(null, user.id, false)}
                  icon={<UserCheck className="size-3.5" />}
                >
                  Réactiver
                </ActionButton>
              ) : (
                <ActionButton
                  action={setSuspendedAction.bind(null, user.id, true)}
                  variant="danger"
                  icon={<Ban className="size-3.5" />}
                  confirm="Suspendre immédiatement le compte et forcer la déconnexion ?"
                >
                  Suspendre
                </ActionButton>
              )
            )}

            {!self && (
              <ActionButton
                action={deleteUserAction.bind(null, user.id)}
                variant="danger"
                icon={<Trash2 className="size-3.5" />}
                confirm="Supprimer ce compte et toutes ses données associées définitivement."
                typeToConfirm="DELETE"
              >
                Supprimer
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Espaces de travail</span>
            <Building2 className="size-4 text-subtle" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular">
              {allWorkspaces.length}
            </span>
            <span className="text-xs text-muted">
              dans {memberships.length} organisation{memberships.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Sessions en direct</span>
            <Radio className="size-4 text-subtle" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular">
              {liveSessions.length}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              {liveSessions.length > 0 ? (
                <span className="flex items-center gap-1 text-positive">
                  <span className="size-1.5 rounded-full bg-positive animate-pulse" /> Actif
                </span>
              ) : (
                "Aucune session active"
              )}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Dernière activité</span>
            <Clock className="size-4 text-subtle" />
          </div>
          <div className="mt-2 text-base font-semibold tracking-tight text-ink">
            {sessions[0]?.createdAt ? <When date={sessions[0].createdAt} /> : <span className="text-muted text-xs">Aucune connexion</span>}
          </div>
          <p className="mt-0.5 text-2xs text-subtle">
            {sessions[0]?.createdAt ? formatDate(sessions[0].createdAt, { hour: "2-digit", minute: "2-digit" }) : "Jamais connecté"}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Méthode d&apos;accès</span>
            <KeyRound className="size-4 text-subtle" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
            {[user.hasPassword && "Mot de passe", user.googleSub && "Google OAuth"].filter(Boolean).join(" + ") || "Non configuré"}
          </div>
          <p className="mt-0.5 text-2xs text-subtle">
            {user.hasPassword ? "Hashé avec scrypt (sécurisé)" : "Sans mot de passe direct"}
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Left Column: Account Details & Sessions */}
        <div className="space-y-6">
          {/* Identity Card */}
          <Card>
            <CardHeader
              title="Informations du compte"
              description="Détails du profil et sécurité"
            />
            <div className="divide-y divide-line text-xs">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Nom complet</span>
                <span className="font-medium text-ink">{user.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Adresse email</span>
                <span className="font-medium text-ink">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Identifiant unique</span>
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-2xs text-ink">{user.id}</code>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Type d&apos;accès</span>
                <div className="flex items-center gap-1.5">
                  {user.isPlatformAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 font-medium text-white text-2xs">
                      <ShieldCheck className="size-3" /> Administrateur
                    </span>
                  ) : (
                    <span className="text-ink">Utilisateur standard</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Authentification</span>
                <div className="flex items-center gap-1">
                  {user.hasPassword && <span className="rounded bg-sunken px-1.5 py-0.5 text-2xs font-medium">Mot de passe</span>}
                  {user.googleSub && <span className="rounded bg-blue-soft px-1.5 py-0.5 text-2xs font-medium text-blue-deep">Google</span>}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">Date d&apos;inscription</span>
                <div className="text-right">
                  <p className="font-medium text-ink">{formatDate(user.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="text-2xs text-subtle"><When date={user.createdAt} /></p>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted">État du compte</span>
                {user.suspendedAt ? (
                  <span className="text-negative font-medium">Suspendu depuis <When date={user.suspendedAt} /></span>
                ) : (
                  <span className="text-positive font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Compte actif
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-line bg-raised/50 px-5 py-3 text-2xs text-muted">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                <span>
                  Les mots de passe sont hachés avec scrypt et ne peuvent être révélés. Pour une modification, invitez l&apos;utilisateur à réinitialiser le sien.
                </span>
              </div>
            </div>
          </Card>

          {/* Sessions List Card */}
          <Card>
            <CardHeader
              title="Sessions récentes"
              description={`${sessions.length} session${sessions.length > 1 ? "s" : ""} enregistrée${sessions.length > 1 ? "s" : ""}`}
              actions={
                liveSessions.length > 0 ? (
                  <ActionButton
                    action={revokeSessionsAction.bind(null, user.id)}
                    variant="ghost"
                    confirm="Déconnecter toutes les sessions ?"
                  >
                    Révoquer tout
                  </ActionButton>
                ) : null
              }
            />
            {sessions.length > 0 ? (
              <ul className="divide-y divide-line text-xs">
                {sessions.map((s) => {
                  const isLive = s.expiresAt > new Date();
                  return (
                    <li key={s.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${isLive ? "bg-positive" : "bg-subtle"}`}
                            title={isLive ? "Session en cours" : "Session expirée"}
                          />
                          <span className="font-mono text-2xs text-ink">{s.id.slice(0, 16)}...</span>
                        </div>
                        <p className="mt-0.5 text-2xs text-muted">
                          Créée <When date={s.createdAt} />
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-2xs font-medium ${isLive ? "bg-positive-soft text-positive" : "bg-sunken text-muted"}`}>
                          {isLive ? "Active" : "Expirée"}
                        </span>
                        <p className="mt-0.5 text-2xs text-subtle">
                          Expire <When date={s.expiresAt} />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-6 text-center text-xs text-muted">
                Aucune session enregistrée pour cet utilisateur.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column: Workspaces & Audit Timeline */}
        <div className="space-y-6">
          {/* Workspaces Card */}
          <Card>
            <CardHeader
              title="Espaces de travail & Organisations"
              description={`Membre de ${memberships.length} organisation${memberships.length > 1 ? "s" : ""} possédant ${allWorkspaces.length} espace${allWorkspaces.length > 1 ? "s" : ""}`}
            />
            <Table
              head={["Espace & Organisation", "Rôle", "Plan", "Mode", "Créé le", "Actions"]}
              empty={memberships.length === 0}
            >
              {memberships.flatMap((m) =>
                m.workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-raised transition-colors">
                    <Td>
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-sunken text-ink">
                          <Building2 className="size-3.5" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/workspaces/${w.id}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {w.name}
                          </Link>
                          <span className="block font-mono text-2xs text-subtle">
                            /{w.slug} · <span className="text-muted">{m.org.name}</span>
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="capitalize font-medium text-xs text-ink">
                        {m.role === "owner" ? "Propriétaire" : m.role}
                      </span>
                    </Td>
                    <Td>
                      <PlanPill plan={m.org.plan} status={m.org.planStatus} />
                    </Td>
                    <Td>
                      <span className="capitalize text-xs text-muted">
                        {w.autonomyMode}
                      </span>
                    </Td>
                    <Td className="text-xs">
                      <When date={w.createdAt} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/w/${w.slug}`}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink shadow-2xs hover:bg-sunken"
                        >
                          <span>Ouvrir</span>
                          <ArrowUpRight className="size-3" />
                        </Link>
                        <Link
                          href={`/admin/workspaces/${w.id}`}
                          className="inline-flex h-7 items-center rounded-md px-2 text-xs text-muted hover:text-ink hover:bg-sunken"
                        >
                          Détails
                        </Link>
                      </div>
                    </Td>
                  </tr>
                )),
              )}
            </Table>
          </Card>

          {/* Activity / Audit Log Timeline */}
          <Card>
            <CardHeader
              title="Journal d'activité récent"
              description="Dernières actions enregistrées pour cet utilisateur"
            />
            <ul className="divide-y divide-line">
              {activity.map((a) => {
                const isPlan = a.action.startsWith("plan.");
                const isAdmin = a.action.startsWith("admin.");
                const isWorkspace = a.action.startsWith("workspace.");
                const isGoal = a.action.startsWith("goal.");

                return (
                  <li key={a.id} className="flex items-start gap-3.5 px-5 py-3 transition-colors hover:bg-raised/40">
                    <span
                      className={`mt-1 grid size-7 shrink-0 place-items-center rounded-lg ${
                        isAdmin
                          ? "bg-negative-soft text-negative"
                          : isPlan
                            ? "bg-grass-soft text-grass-deep"
                            : isWorkspace
                              ? "bg-blue-soft text-blue-deep"
                              : isGoal
                                ? "bg-sun-soft text-sun-deep"
                                : "bg-sunken text-muted"
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldAlert className="size-3.5" />
                      ) : isPlan ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : isWorkspace ? (
                        <Building2 className="size-3.5" />
                      ) : (
                        <Activity className="size-3.5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-mono text-xs font-medium text-ink">
                          {a.action}
                        </p>
                        <span className="shrink-0 text-2xs text-subtle">
                          <When date={a.createdAt} />
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-2xs text-muted">
                        Type: <span className="font-medium text-ink">{a.targetType}</span>
                        {a.targetId ? ` · Cible: ${a.targetId}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
              {activity.length === 0 && (
                <li className="px-5 py-10 text-center text-xs text-muted">
                  Aucune activité enregistrée pour le moment.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
