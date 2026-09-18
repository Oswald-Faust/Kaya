import type { Locale } from "./config";

/**
 * Experiment evaluations, ranking factors and policy checks are computed in
 * English on the server (and some are stored). This translates the known
 * phrasings at display time; anything unrecognized is shown as recorded.
 */

const METRIC_NOUN: Record<string, string> = {
  "signup rate": "le taux d'inscription",
  "activation rate": "le taux d'activation",
  "trial → paid conversion": "la conversion essai → payant",
  "click-through rate": "le taux de clic",
};

const noun = (n: string) => METRIC_NOUN[n] ?? n;

/** "$1,200" / "$12.50" → "1 200 $" / "12,50 $". */
const usd = (s: string) => s.replace(/\$([\d,]+(?:\.\d+)?)/g, (_, n: string) => `${n.replace(/,/g, " ").replace(".", ",")} $`);
/** "12.5%" → "12,5 %" */
const pct = (s: string) => s.replace(/(\d+)\.(\d+)(?=\s*%)/g, "$1,$2").replace(/(\d)%/g, "$1 %");
const num = (s: string) => pct(usd(s));

type Rule = [RegExp, (...m: string[]) => string];

const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** One Channel Fit reason, as produced by `explain()`. */
const FIT_REASONS: [RegExp, (...m: string[]) => string][] = [
  [/^People arrive here already looking for a solution$/, () => "Les gens y arrivent en cherchant déjà une solution"],
  [/^Attention is passive, so intent has to be created from scratch$/, () => "L'attention y est passive : l'intention doit être créée de zéro"],
  [/^Your audience is concentrated here$/, () => "Votre audience y est concentrée"],
  [/^Your audience is thinly represented on (.+)$/, (ch) => `Votre audience est peu présente sur ${ch}`],
  [/^Expected CAC \(~\$(\d+)\) fits a \$(\d+)\/mo price point$/, (cac, price) => `Le CAC attendu (~${cac} $) correspond à un prix de ${price} $/mois`],
  [/^Expected CAC \(~\$(\d+)\) is too high for a \$(\d+)\/mo price point$/, (cac, price) => `Le CAC attendu (~${cac} $) est trop élevé pour un prix de ${price} $/mois`],
  [/^Needs ~\$(\d+)\/mo to learn anything; the budget is \$(\d+)\/mo$/, (need, budget) => `Nécessite ~${need} $/mois pour apprendre quoi que ce soit ; le budget est de ${budget} $/mois`],
  [/^Compounds without ongoing spend$/, () => "Produit des effets cumulés sans dépense continue"],
  [/^Requires a steady stream of video creative$/, () => "Exige un flux continu de créations vidéo"],
  [/^Already drives a meaningful share of signups$/, () => "Génère déjà une part significative des inscriptions"],
  [/^Validated by experiment: (.+)$/, (statement) => `Validé par une expérience : ${statement}`],
  [/^Disproved by experiment: (.+)$/, (statement) => `Réfuté par une expérience : ${statement}`],
];

function fitReason(text: string): string {
  const trimmed = text.trim();
  for (const [re, render] of FIT_REASONS) {
    const m = trimmed.match(re);
    if (m) return render(...m.slice(1));
  }
  return trimmed;
}

const FR: Rule[] = [
  // Evaluation summaries (src/server/domain/experiments/evaluation.ts)
  [/^Rate experiments need a control and a treatment variant\.$/, () => "Les expériences sur un taux nécessitent une variante témoin et une variante test."],
  [/^Ended without enough traffic: each variant needed (\d+) visitors\.$/, (n) => `Terminée sans assez de trafic : chaque variante nécessitait ${n} visiteurs.`],
  [/^Collecting data: ~(\d+) more visitors per variant before a decision\.$/, (n) => `Collecte en cours : encore ~${n} visiteurs par variante avant une décision.`],
  [/^(.+) lifted (.+?) (\S+) \((.+) vs (.+)\), above the (\S+) threshold\.$/, (name, n, lift, a, b, th) => `${name} a amélioré ${noun(n)} de ${num(lift)} (${num(a)} contre ${num(b)}), au-dessus du seuil de ${num(th)}.`],
  [/^(.+) reduced (.+?) (\S+) \((.+) vs (.+)\)\.$/, (name, n, lift, a, b) => `${name} a fait baisser ${noun(n)} de ${num(lift)} (${num(a)} contre ${num(b)}).`],
  [/^Trending (\S+) \((.+) vs (.+)\); not yet significant\.$/, (lift, a, b) => `Tendance ${num(lift)} (${num(a)} contre ${num(b)}) ; pas encore significatif.`],
  [/^Real but small effect: (\S+) is below the (\S+) threshold\.$/, (lift, th) => `Effet réel mais faible : ${num(lift)} est sous le seuil de ${num(th)}.`],
  [/^No reliable difference in (.+) \((.+) vs (.+)\)\.$/, (n, a, b) => `Aucune différence fiable sur ${noun(n)} (${num(a)} contre ${num(b)}).`],
  [/^(.+) on (\$\S+) spend beats the (\$\S+) target \((\d+) customers\)\.$/, (obs, s, th, c) => `${cac(obs)} pour ${usd(s)} dépensés bat l'objectif de ${usd(th)} (${c} clients).`],
  [/^(\$\S+) spent with no paying customers against a (\$\S+) CAC target\.$/, (s, th) => `${usd(s)} dépensés sans client payant, pour un objectif de CAC de ${usd(th)}.`],
  [/^(.+) is ([\d.]+)× the (\$\S+) target after (\$\S+) spend\.$/, (obs, m, th, s) => `${cac(obs)} représente ${m.replace(".", ",")}× l'objectif de ${usd(th)} après ${usd(s)} dépensés.`],
  [/^(.+) after (\$\S+); not enough customers to separate it from the (\$\S+) target\.$/, (obs, s, th) => `${cac(obs)} après ${usd(s)} ; pas assez de clients pour le distinguer de l'objectif de ${usd(th)}.`],
  [/^(.+) so far on (\$\S+) of (\$\S+) budget\.$/, (obs, s, b) => `${cac(obs)} jusqu'ici, pour ${usd(s)} sur un budget de ${usd(b)}.`],

  // Ranking factors (src/server/domain/experiments/ranking.ts)
  [/^Impact$/, () => "Impact"],
  [/^Confidence$/, () => "Confiance"],
  [/^Information gain$/, () => "Gain d'information"],
  [/^Channel fit$/, () => "Adéquation du canal"],
  [/^Effort$/, () => "Effort"],
  [/^Cost$/, () => "Coût"],
  [/^Time to signal$/, () => "Délai avant signal"],
  [/^Organic$/, () => "Organique"],
  [/^(\d+)d$/, (n) => `${n} j`],

  // Channel Fit rationales (src/server/domain/strategy/channel-fit.ts)
  [/^Don't use (.+) right now\. (.+)\.$/, (ch, reasons) => `N'utilisez pas ${ch} pour l'instant. ${reasons.split(". ").map(fitReason).join(". ")}.`],
  [/^Worth a bounded test\. (.+?), but (.+)\.$/, (a2, b2) => `Mérite un test encadré. ${fitReason(a2)}, mais ${lower(fitReason(b2))}.`],
  [/^Worth a bounded test\. (.+)\.$/, (a2) => `Mérite un test encadré. ${fitReason(a2)}.`],
  [/^(.+)\.$/, (all) => {
    const parts = all.split(". ").map(fitReason);
    return parts.some((part, i) => part !== all.split(". ")[i]) ? `${parts.join(". ")}.` : all + ".";
  }],

  // Budget allocation (src/server/domain/strategy/allocation.ts)
  [/^Fit score (\d+) is below the test threshold$/, (n) => `Score d'adéquation ${n} sous le seuil de test`],
  [/^Needs ~\$(\d+)\/mo to produce a readable signal$/, (n) => `Nécessite ~${n} $/mois pour produire un signal lisible`],
  [/^Runs on founder time rather than budget$/, () => "Repose sur le temps du fondateur plutôt que sur un budget"],
  [/^A \$(\d+)\/mo share is too small to learn from; needs ~\$(\d+)\/mo$/, (a2, b2) => `Une part de ${a2} $/mois est trop faible pour en tirer un apprentissage ; il faut ~${b2} $/mois`],
  [/^Fit (\d+): paid test budget$/, (n) => `Adéquation ${n} : budget de test payant`],
  [/^Fit (\d+): production budget \(writing, design\)$/, (n) => `Adéquation ${n} : budget de production (rédaction, design)`],

  // Policy checks (src/server/domain/governance/policy.ts)
  [/^Allowed channels$/, () => "Canaux autorisés"],
  [/^Max daily spend$/, () => "Dépense quotidienne max."],
  [/^Monthly budget$/, () => "Budget mensuel"],
  [/^Automatic increase limit$/, () => "Limite d'augmentation automatique"],
  [/^Max experiment budget$/, () => "Budget max. par expérience"],
  [/^Autonomy mode$/, () => "Mode d'autonomie"],
  [/^Always requires approval$/, () => "Approbation toujours requise"],
  [/^(\S+) is allowed$/, (c) => `${c} est autorisé`],
  [/^(\S+) is not in this workspace's allowed channels$/, (c) => `${c} ne fait pas partie des canaux autorisés de cet espace`],
  [/^(\$\S+)\/day against a (\$\S+)\/day cap$/, (a, b) => `${usd(a)}/jour pour un plafond de ${usd(b)}/jour`],
  [/^Projected month spend (\$\S+) against (\$\S+)$/, (a, b) => `Dépense mensuelle projetée de ${usd(a)} pour ${usd(b)}`],
  [/^([+-]?\d+)% change; automatic limit is \+(\d+)%$/, (a, b) => `Variation de ${a} % ; la limite automatique est de +${b} %`],
  [/^New spend has no baseline to compare against$/, () => "Nouvelle dépense sans référence de comparaison"],
  [/^(\$\S+) against a (\$\S+) per-experiment cap$/, (a, b) => `${usd(a)} pour un plafond de ${usd(b)} par expérience`],
  [/^(\S+) always needs a human decision$/, (c) => `${c} nécessite toujours une décision humaine`],
  [/^Read-only actions run in every mode$/, () => "Les actions en lecture seule s'exécutent dans tous les modes"],
  [/^Reducing exposure is permitted automatically$/, () => "Réduire l'exposition est autorisé automatiquement"],
  [/^Observe mode only allows read-only analysis$/, () => "Le mode Observation n'autorise que l'analyse en lecture seule"],
  [/^Suggest mode can prepare drafts$/, () => "Le mode Suggestion peut préparer des brouillons"],
  [/^Suggest mode never executes external actions without approval$/, () => "Le mode Suggestion n'exécute jamais d'action externe sans approbation"],
  [/^Copilot prepares drafts automatically$/, () => "Le copilote prépare les brouillons automatiquement"],
  [/^Copilot mode requires approval for (\w+) actions$/, (r) => `Le mode Copilote exige une approbation pour les actions de type ${RISK[r] ?? r}`],
  [/^Sensitive actions always require approval$/, () => "Les actions sensibles exigent toujours une approbation"],
  [/^Launching new paid campaigns automatically is turned off$/, () => "Le lancement automatique de nouvelles campagnes payantes est désactivé"],
  [/^Autopilot may act within guardrails$/, () => "Le pilote automatique peut agir dans les garde-fous"],
];

const RISK: Record<string, string> = { read: "lecture", draft: "brouillon", publish: "publication", spend: "dépense", sensitive: "sensible" };

function cac(observed: string): string {
  return observed === "no customers yet" ? "aucun client pour l'instant" : usd(observed);
}

export function translateDomainText(text: string, locale: Locale): string {
  if (locale === "en" || !text) return text;
  for (const [re, render] of FR) {
    const m = text.match(re);
    if (m) return render(...m.slice(1));
  }
  return text;
}

export function translatePolicyText(text: string, locale: Locale): string {
  return translateDomainText(text, locale);
}
