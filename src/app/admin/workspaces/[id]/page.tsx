import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FlaskConical,
  Globe,
  Lightbulb,
  Radio,
  RefreshCw,
  Target,
  Trash2,
  UserMinus,
  XCircle,
} from "lucide-react";
import {
  cancelSubscriptionAction,
  deleteWorkspaceAction,
  extendTrialAction,
  overridePlanAction,
  removeMemberAction,
  resyncSubscriptionAction,
  setAutonomyAction,
} from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/action-button";
import { CollapsibleAuditLog } from "@/components/admin/collapsible-audit-log";
import { CopyButton } from "@/components/admin/copy-button";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { PlanOverrideForm } from "@/components/admin/plan-override-form";
import { Card, CardHeader, Dl, Pill, PlanPill, RunStatusPill, Table, Td, When } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/guard";
import { listPrice, monthlyRevenue } from "@/server/admin/metrics";
import { getWorkspaceDetail } from "@/server/services/admin";
import { env } from "@/server/env";
import { formatDate, formatUsd } from "@/lib/format";

export const metadata = { title: "Détail Workspace" };

const stripeBase = () => `https://dashboard.stripe.com${env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "/test" : ""}`;

export default async function AdminWorkspacePage({ params }: PageProps<"/admin/workspaces/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const d = await getWorkspaceDetail(id);
  if (!d) notFound();
  const { ws, org, products, members, runs, activity, factsList, experimentsList, goal, integrationsList } = d;
  const liveStripe = Boolean(org.stripeSubscriptionId) && ["trialing", "active", "past_due"].includes(org.planStatus);

  return (
    <div className="space-y-6 min-w-0">
      {/* Navigation & Breadcrumb */}
      <div>
        <Link
          href="/admin/workspaces"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          <span>Retour à tous les espaces de travail</span>
        </Link>
      </div>

      {/* Hero Workspace Header */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex size-12 sm:size-15 shrink-0 items-center justify-center rounded-2xl border border-line bg-raised text-ink shadow-2xs">
              <Building2 className="size-6 sm:size-7 text-ink" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {ws.name}
                </h1>
                <PlanPill plan={org.plan} status={org.planStatus} />
                <span className="inline-flex items-center gap-1 rounded-md bg-agent-soft px-2 py-0.5 font-medium text-agent text-2xs uppercase tracking-wide shrink-0">
                  <Bot className="size-3" /> Mode {ws.autonomyMode}
                </span>
                {ws.isDemo && (
                  <span className="rounded-md border border-dashed border-subtle/50 px-2 py-0.5 text-2xs text-muted shrink-0">
                    Données de démo
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1 font-mono text-2xs text-ink shrink-0">
                  /{ws.slug}
                  <CopyButton text={ws.slug} label="Copier le slug" />
                </span>
                <span className="hidden text-subtle sm:inline">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-2xs text-subtle shrink-0">
                  ID: {ws.id}
                  <CopyButton text={ws.id} label="Copier l'ID" />
                </span>
                <span className="hidden text-subtle sm:inline">·</span>
                <span className="text-subtle truncate max-w-xs">
                  Org : <strong className="font-medium text-ink">{org.name}</strong>
                </span>
                <span className="hidden text-subtle sm:inline">·</span>
                <span className="inline-flex items-center gap-1 text-subtle shrink-0">
                  <Calendar className="size-3" /> Créé le {formatDate(ws.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            <Link
              href={`/w/${ws.slug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink bg-ink px-3 text-xs font-medium text-white transition-colors hover:bg-ink-hover shadow-2xs whitespace-nowrap"
            >
              <span>Ouvrir l&apos;espace client</span>
              <ArrowUpRight className="size-3.5" />
            </Link>

            {!ws.isDemo && (
              <ActionButton
                action={deleteWorkspaceAction.bind(null, ws.id)}
                variant="danger"
                icon={<Trash2 className="size-3.5" />}
                confirm="Supprimer définitivement cet espace de travail et toutes ses données associées ?"
                typeToConfirm={ws.slug}
              >
                Supprimer
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4.5 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Formule & Revenus</span>
            <CreditCard className="size-4 text-subtle shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular">
              {formatUsd(monthlyRevenue(org))}
            </span>
            <span className="text-xs text-muted">/mois</span>
          </div>
          <p className="mt-1 text-2xs text-subtle truncate">
            Prix catalogue : {formatUsd(listPrice(org))}/mois
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Objectif principal</span>
            <Target className="size-4 text-subtle shrink-0" />
          </div>
          <div className="mt-2 text-base font-semibold tracking-tight text-ink truncate">
            {goal ? goal.title : <span className="text-muted text-xs">Aucun objectif défini</span>}
          </div>
          <p className="mt-1 text-2xs text-subtle truncate">
            {goal ? `Budget : $${goal.monthlyBudget}/mois · ${goal.metric}` : "En attente de configuration"}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Mémoire & Faits IA</span>
            <Lightbulb className="size-4 text-subtle shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular">
              {factsList.length}
            </span>
            <span className="text-xs text-muted">faits identifiés</span>
          </div>
          <p className="mt-1 text-2xs text-subtle truncate">
            {factsList.filter((f) => f.userConfirmed).length} confirmé(s) par l&apos;utilisateur
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4.5 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Expériences marketing</span>
            <FlaskConical className="size-4 text-subtle shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-ink tabular">
              {experimentsList.length}
            </span>
            <span className="text-xs text-muted">campagnes / tests</span>
          </div>
          <p className="mt-1 text-2xs text-subtle truncate">
            {experimentsList.filter((e) => e.status === "running").length} en cours d&apos;exécution
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Products, Strategy, Memory, Experiments, Runs, Collapsible Audit */}
        <div className="space-y-6 min-w-0">
          {/* Products Card */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Produits analysés"
              description={`${products.length} produit${products.length > 1 ? "s" : ""} géré${products.length > 1 ? "s" : ""} dans cet espace`}
            />
            <Table head={["Produit", "Statut", "Étape d'onboarding", "Dernière mise à jour"]} empty={products.length === 0}>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-raised transition-colors">
                  <Td>
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Globe className="size-3 text-subtle" />
                      <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                        {p.domain}
                      </a>
                      <ExternalLink className="size-2.5 text-subtle" />
                    </div>
                    {p.oneLiner && <p className="mt-1 text-2xs text-subtle italic truncate max-w-sm">« {p.oneLiner} »</p>}
                  </Td>
                  <Td>
                    <Pill tone={p.status === "active" ? "positive" : p.status === "failed" ? "negative" : "neutral"}>
                      {p.status.replace("_", " ")}
                    </Pill>
                  </Td>
                  <Td>
                    <span className="capitalize rounded bg-sunken px-1.5 py-0.5 text-2xs font-medium">
                      {p.onboardingStep}
                    </span>
                  </Td>
                  <Td className="text-xs">
                    <When date={p.updatedAt} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          {/* Goal & Strategy Card */}
          {goal && (
            <Card className="overflow-hidden">
              <CardHeader
                title="Objectif de croissance & Stratégie"
                description="Cible fixée pour l'agent de croissance Kaya"
              />
              <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-3 border-b border-line bg-raised/30">
                <div>
                  <span className="text-2xs text-subtle uppercase tracking-wider">Objectif</span>
                  <p className="mt-1 text-sm font-semibold text-ink">{goal.title}</p>
                  <p className="text-2xs text-muted mt-0.5">Template : {goal.template}</p>
                </div>
                <div>
                  <span className="text-2xs text-subtle uppercase tracking-wider">Cible & Baseline</span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {goal.targetValue ? `${goal.targetValue} ${goal.unit}` : "Non spécifié"}
                  </p>
                  <p className="text-2xs text-muted mt-0.5">
                    Départ : {goal.baselineValue ? `${goal.baselineValue} ${goal.unit}` : "0"}
                  </p>
                </div>
                <div>
                  <span className="text-2xs text-subtle uppercase tracking-wider">Budget mensuel</span>
                  <p className="mt-1 text-sm font-semibold text-ink">${goal.monthlyBudget}/mois</p>
                  <p className="text-2xs text-muted mt-0.5">Tranche : {goal.budgetBand}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Business Memory / Facts */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Mémoire d'entreprise & Faits extraits"
              description={`${factsList.length} faits identifiés pour guider les décisions marketing`}
            />
            {factsList.length > 0 ? (
              <div className="divide-y divide-line max-h-[360px] overflow-y-auto">
                {factsList.map((f) => (
                  <div key={f.id} className="p-4 hover:bg-raised transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-2xs text-white uppercase tracking-wider">
                            {f.category}
                          </span>
                          <span className="rounded bg-sunken px-1.5 py-0.5 text-2xs font-medium text-muted">
                            {f.kind}
                          </span>
                          {f.userConfirmed && (
                            <span className="inline-flex items-center gap-1 text-2xs font-medium text-positive">
                              <CheckCircle2 className="size-3" /> Confirmé
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-ink leading-relaxed break-words">{f.statement}</p>
                        {f.evidence && (
                          <p className="mt-1 text-2xs text-subtle break-words">
                            Preuve : {f.evidence}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {Math.round(f.confidence * 100)}%
                        </span>
                        <p className="text-2xs text-subtle">confiance</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-muted">
                Aucun fait d&apos;entreprise n&apos;a encore été extrait pour cet espace.
              </p>
            )}
          </Card>

          {/* Experiments & Campaigns */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Expériences marketing générées"
              description={`${experimentsList.length} tests et campagnes créés par l'agent`}
            />
            {experimentsList.length > 0 ? (
              <Table head={["#", "Expérience", "Canal", "Métrique", "Budget / Dépenses", "Statut"]} empty={false}>
                {experimentsList.map((e) => (
                  <tr key={e.id} className="hover:bg-raised transition-colors">
                    <Td className="font-mono text-xs text-subtle">#{e.number}</Td>
                    <Td>
                      <span className="font-medium text-ink">{e.name}</span>
                      <p className="text-2xs text-muted truncate max-w-xs">{e.hypothesis}</p>
                    </Td>
                    <Td>
                      <span className="rounded bg-sunken px-1.5 py-0.5 text-2xs font-medium capitalize">
                        {e.channel}
                      </span>
                    </Td>
                    <Td className="text-xs font-mono">{e.primaryMetric}</Td>
                    <Td className="text-xs">
                      <span className="font-medium text-ink">${e.spend}</span>
                      <span className="text-subtle"> / ${e.budget}</span>
                    </Td>
                    <Td>
                      <Pill tone={e.status === "completed" ? "positive" : e.status === "running" ? "agent" : "neutral"}>
                        {e.status}
                      </Pill>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-muted">
                Aucune expérience marketing n&apos;a encore été proposée.
              </p>
            )}
          </Card>

          {/* Agent Runs */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Exécutions de l'agent (Runs)"
              description="Historique des tâches autonomes de l'agent"
            />
            <Table head={["Tâche", "Moteur", "Statut", "Lancé le"]} empty={runs.length === 0}>
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-raised transition-colors">
                  <Td>
                    <span className="block font-medium text-ink">{r.kind.replace(/_/g, " ")}</span>
                    {r.goal && <span className="block text-2xs text-muted truncate max-w-sm">{r.goal}</span>}
                    {r.error && <span className="block max-w-md truncate text-xs text-negative">{r.error}</span>}
                  </Td>
                  <Td className="text-xs text-muted">{r.planner === "llm" ? (r.model ?? "Claude") : "deterministic"}</Td>
                  <Td>
                    <RunStatusPill status={r.status} />
                  </Td>
                  <Td className="text-xs">
                    <When date={r.createdAt} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          {/* Collapsible Audit Trail */}
          <CollapsibleAuditLog activity={activity} defaultOpen={false} />
        </div>

        {/* Right Column: Members, Integrations, Billing, Autonomy, IDs */}
        <div className="space-y-6 min-w-0">
          {/* Members Card with Impersonation & Remove */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Membres de l'espace"
              description={`${members.length} utilisateur${members.length > 1 ? "s" : ""} dans l'organisation`}
            />
            <div className="divide-y divide-line">
              {members.map((m) => (
                <div key={m.id} className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/users/${m.userId}`}
                        className="font-semibold text-xs text-ink hover:underline truncate block"
                      >
                        {m.name}
                      </Link>
                      <p className="text-2xs text-muted truncate">{m.isGuest ? "Visiteur invité" : m.email}</p>
                    </div>
                    <span className="rounded bg-sunken px-1.5 py-0.5 text-2xs font-medium capitalize text-ink shrink-0">
                      {m.role === "owner" ? "Propriétaire" : m.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 text-2xs text-subtle border-t border-line/60">
                    <span className="shrink-0"><When date={m.joinedAt} /></span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!m.isGuest && (
                        <ImpersonateButton
                          userId={m.userId}
                          userName={m.name}
                          userEmail={m.email}
                          compact
                        />
                      )}
                      <ActionButton
                        action={removeMemberAction.bind(null, m.id)}
                        variant="ghost"
                        icon={<UserMinus className="size-3" />}
                        confirm="Retirer ce membre de l'organisation ?"
                      >
                        Retirer
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Integrations Card */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Intégrations connectées"
              description={`${integrationsList.length} service${integrationsList.length > 1 ? "s" : ""} externe${integrationsList.length > 1 ? "s" : ""}`}
            />
            {integrationsList.length > 0 ? (
              <div className="divide-y divide-line text-xs">
                {integrationsList.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="font-medium text-ink capitalize">{i.provider}</p>
                      <p className="text-2xs text-subtle">Mode : {i.mode}</p>
                    </div>
                    <Pill tone={i.status === "connected" ? "positive" : i.status === "error" ? "negative" : "neutral"}>
                      {i.status}
                    </Pill>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-5 text-center text-xs text-muted">
                Aucune intégration connectée (Google, Stripe, etc.)
              </p>
            )}
          </Card>

          {/* Billing Card */}
          <Card className="overflow-hidden">
            <CardHeader title="Facturation & Stripe" />
            <Dl
              items={[
                ["Organisation", <code key="o" className="font-mono text-2xs truncate max-w-[140px] block">{org.id}</code>],
                ["Prix formule", `${formatUsd(listPrice(org))}/mois${org.planInterval === "year" ? " (annuel)" : ""}`],
                ["Actions IA", org.planActions?.toLocaleString("en-US") ?? "—"],
                ["Fin essai", <When key="t" date={org.trialEndsAt} />],
                [
                  "Client Stripe",
                  org.stripeCustomerId ? (
                    <a key="c" href={`${stripeBase()}/customers/${org.stripeCustomerId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hover:underline truncate max-w-[140px]">
                      {org.stripeCustomerId} <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ) : (
                    "—"
                  ),
                ],
                [
                  "Abonnement",
                  org.stripeSubscriptionId ? (
                    <a key="s" href={`${stripeBase()}/subscriptions/${org.stripeSubscriptionId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hover:underline truncate max-w-[140px]">
                      {org.stripeSubscriptionId} <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ) : (
                    "—"
                  ),
                ],
              ]}
            />
            <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
              <ActionButton action={extendTrialAction.bind(null, org.id, 14)} icon={<CalendarPlus className="size-3.5" />} confirm="Prolonger l'essai de 14 jours ?">
                +14j essai
              </ActionButton>
              {org.stripeSubscriptionId && (
                <ActionButton action={resyncSubscriptionAction.bind(null, org.id)} icon={<RefreshCw className="size-3.5" />}>
                  Resync Stripe
                </ActionButton>
              )}
              {liveStripe && (
                <>
                  <ActionButton action={cancelSubscriptionAction.bind(null, org.id, false)} icon={<XCircle className="size-3.5" />} confirm="Résilier à la fin de la période en cours ?">
                    Résilier fin période
                  </ActionButton>
                  <ActionButton action={cancelSubscriptionAction.bind(null, org.id, true)} variant="danger" icon={<XCircle className="size-3.5" />} confirm="Résilier immédiatement. L'accès sera coupé sur le champ." typeToConfirm="CANCEL">
                    Résilier de suite
                  </ActionButton>
                </>
              )}
            </div>
          </Card>

          {/* Override plan */}
          <Card className="overflow-hidden">
            <CardHeader title="Modifier la formule manuellement" description="Définir un plan par exception" />
            <div className="p-1">
              <PlanOverrideForm org={org} action={overridePlanAction.bind(null, org.id)} />
            </div>
          </Card>

          {/* Autonomy Mode */}
          <Card className="overflow-hidden">
            <CardHeader title="Autonomie de l'agent" description={`Actuellement : ${ws.autonomyMode}`} />
            <div className="grid grid-cols-2 gap-1.5 p-3">
              {(["observe", "suggest", "copilot", "autopilot"] as const).map((mode) => (
                <ActionButton key={mode} action={setAutonomyAction.bind(null, ws.id, mode)} variant={ws.autonomyMode === mode ? "primary" : "secondary"}>
                  {mode}
                </ActionButton>
              ))}
            </div>
          </Card>

          {/* Metadata Card */}
          <Card className="overflow-hidden">
            <Dl
              items={[
                ["ID Workspace", <code key="w" className="font-mono text-2xs truncate max-w-[140px] block">{ws.id}</code>],
                ["Slug", `/${ws.slug}`],
                ["Date création", <When key="c" date={ws.createdAt} />],
                ["Démo", ws.isDemo ? "Oui" : "Non"],
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
