import type { Locale } from "@/i18n/config";
import type { KaiSource, KaiSuggestedAction } from "@/server/db/schema";
import type { WorkspaceMemory } from "./kai";

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const intents = {
  pricing: /\b(prix|tarifs?|pricing|price|prices|cost|cout|abonnement|subscription)\b/,
  audience: /\b(icp|persona|personas|cible|clients?|customers?|audience|pains?|douleurs?|objections?|triggers?|declencheurs?)\b/,
  competitors: /\b(concurrents?|concurrence|competitors?|competition|versus|vs|differenciation|wedge)\b/,
  learnings: /\b(appris|apprentissages?|enseignements?|learnings?|learned|learnt|resultats?|results?)\b/,
  experiments: /\b(experiences?|experiments?|tests?|tester|testing)\b/,
  strategy: /\b(strategie|strategy|positionnement|positioning|priorites?|priorities|plan|pillars?|piliers?)\b/,
  goals: /\b(objectifs?|goals?|mrr|revenue|revenus?|croissance|growth|metrics?|metriques?|signups?|inscriptions?|conversion|churn)\b/,
  brand: /\b(marque|brand|voice|voix|ton|tone)\b/,
  overview: /\b(resume|resumer|summary|summarize|overview|produit|product|business|entreprise)\b/,
} as const;
type Intent = keyof typeof intents;
function detect(query: string): Intent[] {
  const q = normalize(query);
  return (Object.keys(intents) as Intent[]).filter((intent) => intents[intent].test(q));
}

/** Internal, extractive dialogue engine. No model/API call; stored evidence remains verbatim. */
export function replyFromMemory(memory: WorkspaceMemory, query: string, history: Array<{ role: string; content: string }> = [], locale: Locale = "en"): { reply: string; sources: KaiSource[]; suggestedAction: KaiSuggestedAction | null } {
  const fr = locale === "fr";
  const say = (a: string, b: string) => fr ? a : b;
  const sources: KaiSource[] = [];
  const sections: string[] = [];
  const q = normalize(query);
  let topics = detect(query);
  const followup = /\b(et|and|why|pourquoi|details?|continue|developpe|more|them|their|eux|leur|cela|ca)\b/.test(q);
  if (!topics.length && followup) {
    const previous = [...history].reverse().find((message) => message.role === "user" && detect(message.content).length);
    if (previous) topics = detect(previous.content);
  }
  const namedCompetitors = memory.competitors.filter((c) => q.includes(normalize(c.name)));
  if (namedCompetitors.length && !topics.includes("competitors")) topics.push("competitors");
  const add = (title: string, lines: string[]) => sections.push(`${title}\n${lines.length ? lines.map(line => `• ${line}`).join("\n") : say("Cette information n’est pas encore enregistrée dans votre mémoire produit.", "This information is not recorded in your product memory yet.")}`);
  const factLine = (f: WorkspaceMemory["facts"][number]) => {
    const uncertain = f.status !== "confirmed" || f.confidence < 0.7;
    const text = `${uncertain ? say("À vérifier : ", "Unverified: ") : ""}${f.statement}`;
    sources.push({ type: "fact", label: f.key, detail: text, confidence: f.confidence });
    return text;
  };
  for (const topic of topics) {
    switch (topic) {
      case "pricing":
        add(say("Vos tarifs", "Your pricing"), memory.facts.filter(f => /pricing|price|tarif|prix/.test(normalize(`${f.category} ${f.key}`))).slice(0, 6).map(factLine));
        break;
      case "audience":
        add(say("Vos clients cibles", "Your target customers"), memory.icps.slice(0, 4).map(i => {
          const detail = `${i.description}${i.pains.length ? `\n${say("Besoins", "Pain points")} : ${i.pains.join("; ")}` : ""}${i.triggers.length ? `\n${say("Déclencheurs", "Triggers")} : ${i.triggers.join("; ")}` : ""}${i.objections.length ? `\nObjections : ${i.objections.join("; ")}` : ""}`;
          sources.push({ type: "icp", label: i.name, detail });
          return `${i.name} — ${detail}`;
        }));
        break;
      case "competitors":
        add(say("Votre paysage concurrentiel", "Your competitor landscape"), (namedCompetitors.length ? namedCompetitors : memory.competitors).slice(0, 5).map(c => {
          const detail = [c.positioning, c.pricingSummary, c.wedge].filter(Boolean).join(" · ");
          sources.push({ type: "competitor", label: c.name, detail, confidence: c.confidence });
          return `${c.name} — ${c.confidence < 0.7 ? say("À vérifier : ", "Unverified: ") : ""}${detail || say("Analyse à compléter", "Analysis incomplete")}`;
        }));
        break;
      case "learnings":
        add(say("Les enseignements enregistrés", "Recorded learnings"), memory.learnings.slice(0, 5).map(l => {
          sources.push({ type: "learning", label: l.kind, detail: l.statement, confidence: l.confidence });
          return `${l.confidence < 0.7 ? say("À vérifier : ", "Unverified: ") : ""}${l.statement}`;
        }));
        break;
      case "experiments":
        add(say("Les expériences récentes", "Recent experiments"), memory.experiments.slice(0, 5).map(e => `#${e.number} ${e.name} (${e.status}) — ${say("Hypothèse", "Hypothesis")}: ${e.hypothesis}`));
        break;
      case "strategy":
        if (memory.strategy) sources.push({ type: "strategy", label: `v${memory.strategy.version}`, detail: memory.strategy.summary });
        add(say("Votre stratégie actuelle", "Your current strategy"), memory.strategy ? [memory.strategy.summary, ...memory.strategy.pillars] : []);
        break;
      case "goals":
        if (memory.goal) sources.push({ type: "metric", label: memory.goal.title, detail: `${memory.goal.baselineValue ?? "—"} → ${memory.goal.targetValue ?? "—"} ${memory.goal.unit}` });
        add(say("Votre objectif", "Your goal"), memory.goal ? [`${memory.goal.title} — ${say("Départ", "Baseline")}: ${memory.goal.baselineValue ?? "—"}; ${say("cible", "target")}: ${memory.goal.targetValue ?? "—"} ${memory.goal.unit}`] : []);
        sections.push(say("Je n’ai pas de série de mesures datées dans ce contexte. Je ne peux donc pas expliquer une variation ni confirmer le niveau actuel. Quelle période et quelles valeurs souhaitez-vous comparer ?", "I do not have a dated measurement series in this context, so I cannot explain a change or confirm the current value. Which period and values would you like to compare?"));
        break;
      case "brand":
        if (memory.brand) sources.push({ type: "brand", label: say("Voix de marque", "Brand voice"), detail: memory.brand.voiceSummary });
        add(say("Votre voix de marque", "Your brand voice"), memory.brand ? [memory.brand.voiceSummary, ...memory.brand.traits] : []);
        break;
      case "overview":
        add(memory.product?.name ?? say("Votre produit", "Your product"), [memory.product?.oneLiner, ...memory.facts.slice(0, 4).map(factLine)].filter((v): v is string => Boolean(v)));
        break;
    }
  }
  if (!topics.length) {
    const terms = q.split(/\W+/).filter(word => word.length > 3 && !/^(what|does|have|with|pour|dans|notre|votre|quel|quelle|comment)$/.test(word));
    const matches = memory.facts.map(f => ({ f, score: terms.filter(word => normalize(`${f.key} ${f.statement}`).includes(word)).length })).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    if (matches.length) add(say("Informations retrouvées", "Matching information"), matches.map(x => factLine(x.f)));
    else if (/^(bonjour|salut|hello|hi|hey|bonsoir)[ !.?]*$/.test(q)) sections.push(say(`Bonjour ! Parlons de ${memory.product?.name ?? "votre produit"}. Souhaitez-vous travailler sur vos clients, vos tarifs ou votre stratégie ?`, `Hello! Let’s talk about ${memory.product?.name ?? "your product"}. Would you like to work on customers, pricing, or strategy?`));
    else sections.push(say("Je n’ai pas assez d’informations pour répondre précisément. Parlez-vous de vos tarifs, de vos clients, de vos concurrents ou de votre stratégie ? Précisez le sujet et je retrouverai les éléments disponibles.", "I do not have enough information to answer precisely. Do you mean pricing, customers, competitors, or strategy? Clarify the topic and I will retrieve the available information."));
  } else if (!topics.includes("goals")) {
    sections.push(say("Quel point souhaitez-vous approfondir ? Les extraits de votre mémoire sont conservés dans leur langue d’origine.", "What would you like to explore further? Memory excerpts are preserved in their original language."));
  }
  return { reply: sections.join("\n\n"), sources, suggestedAction: null };
}
