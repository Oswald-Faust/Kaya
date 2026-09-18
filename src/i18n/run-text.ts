import type { Locale } from "./config";
import { translateDomainText } from "./domain-text";

/**
 * Run steps (analysis, strategy, agent runs) are recorded in English on the
 * server. This translates the known phrasings at display time; anything
 * unrecognized (names, LLM output) is shown as recorded.
 */
const FR: [RegExp, string][] = [
  [/^Reading your description$/, "Lecture de votre description"],
  [/^Read homepage$/, "Page d'accueil lue"],
  [/^Reading homepage$/, "Lecture de la page d'accueil"],
  [/^Discovering product pages$/, "Découverte des pages produit"],
  [/^Reading pricing$/, "Lecture des tarifs"],
  [/^Looking for a pricing page$/, "Recherche d'une page de tarifs"],
  [/^Reading (\d+) more pages?$/, "Lecture de $1 page(s) supplémentaire(s)"],
  [/^Reading (.+)$/, "Lecture de $1"],
  [/^Studying the category with (?:Claude|AI)$/, "Étude de la catégorie avec l'IA"],
  [/^Researching pricing with (?:Claude|AI)$/, "Recherche des tarifs avec l'IA"],
  [/^Not linked on the site; (?:Claude|AI) will look for it$/, "Non lié sur le site ; l'IA va la chercher"],
  [/^Building product model$/, "Construction du modèle produit"],
  [/^Analysis stopped$/, "Analyse interrompue"],
  [/^Detecting features$/, "Détection des fonctionnalités"],
  [/^Understanding positioning$/, "Compréhension du positionnement"],
  [/^Finding audience signals$/, "Recherche des signaux d'audience"],
  [/^Finding competitors$/, "Recherche des concurrents"],
  [/^Looking at acquisition surfaces$/, "Analyse des canaux d'acquisition"],
  [/^No clear feature list found$/, "Aucune liste de fonctionnalités claire"],
  [/^Positioning isn't stated clearly on the site$/, "Le positionnement n'est pas clairement indiqué sur le site"],
  [/^No explicit audience found$/, "Aucune audience explicite trouvée"],
  [/^None named on the site$/, "Aucun cité sur le site"],
  [/^No existing channels detected$/, "Aucun canal existant détecté"],
  [/^(\d+) features: (.+)$/, "$1 fonctionnalités : $2"],
  [/^Retrieved business context$/, "Contexte business récupéré"],
  [/^Planned: (.+)$/, "Plan : $1"],
  [/^Run stopped$/, "Exécution interrompue"],
  [/^Identified the main driver$/, "Principal facteur identifié"],
  [/^No paid campaign is clearly beating its target$/, "Aucune campagne payante ne dépasse clairement son objectif"],
  [/^(.+) is (\d+)% under its CAC target$/, "$1 est $2 % sous son objectif de CAC"],
  [/^Increase “(.+)” to \$(\d+)\/day$/, "Passer « $1 » à $2 $/jour"],
  [/^Read channel fit from the current strategy$/, "Lecture de l'adéquation des canaux dans la stratégie actuelle"],
  [/^Split (.+) across (\d+) channels$/, "Répartition de $1 sur $2 canaux"],
  [/^Publish the page for (.+)$/, "Publier la page de $1"],
  [/^Launch (\S+) on (.+)$/, "Lancer $1 sur $2"],
  [/^(\S+) needs founder time rather than an automated launch$/, "$1 demande du temps du fondateur plutôt qu'un lancement automatique"],
  [/^Requested approval$/, "Approbation demandée"],
  [/^Reading confirmed business memory$/, "Lecture de la mémoire business confirmée"],
  [/^Scoring channel fit$/, "Notation de l'adéquation des canaux"],
  [/^Allocating the budget$/, "Répartition du budget"],
  [/^Choosing positioning and messaging$/, "Choix du positionnement et du message"],
  [/^Identifying the growth bottleneck$/, "Identification du frein à la croissance"],
  [/^Designing first experiments$/, "Conception des premières expériences"],
  [/^No experiment fits the constraints yet$/, "Aucune expérience ne respecte encore les contraintes"],
  [/^Saving the strategy$/, "Enregistrement de la stratégie"],
  [/^Saved strategy v(\d+)$/, "Stratégie v$1 enregistrée"],
  [/^(\d+) experiments queued, nothing launched without your approval$/, "$1 expériences en file, rien n'est lancé sans votre approbation"],
  [/^Strategy generation stopped$/, "Génération de la stratégie interrompue"],
  [/^Founder rejected the action$/, "Le fondateur a refusé l'action"],
  [/^Executed after approval: (.+)$/, "Exécuté après approbation : $1"],
  [/^Could not execute the approved action$/, "Impossible d'exécuter l'action approuvée"],
  [/^Compare this week with last week$/, "Comparer cette semaine à la précédente"],
  [/^Attribute the change to channels$/, "Attribuer l'évolution aux canaux"],
  [/^Check what to do next$/, "Déterminer la prochaine action"],
  [/^Find paid campaigns beating their CAC target$/, "Trouver les campagnes payantes sous leur objectif de CAC"],
  [/^Propose a bounded budget increase$/, "Proposer une hausse de budget encadrée"],
  [/^Apply learnings from past experiments$/, "Appliquer les apprentissages des expériences passées"],
  [/^Split the budget and explain each line$/, "Répartir le budget et justifier chaque ligne"],
  [/^Rank the experiment queue$/, "Classer la file d'expériences"],
  [/^Prepare the top experiment for launch$/, "Préparer la meilleure expérience pour le lancement"],
  // Plan step rationales (src/server/agent/runtime.ts)
  [/^Establish what actually changed, with numbers$/, "Établir ce qui a réellement changé, avec des chiffres"],
  [/^Find the source of the movement$/, "Trouver la source de l'évolution"],
  [/^Turn the diagnosis into an action$/, "Transformer le diagnostic en action"],
  [/^Only scale what evidence supports$/, "N'amplifier que ce que les preuves soutiennent"],
  [/^Grow spend without breaking guardrails$/, "Augmenter la dépense sans casser les garde-fous"],
  [/^Allocate by evidence, not habit$/, "Répartir selon les preuves, pas par habitude"],
  [/^Avoid funding channels that already failed$/, "Éviter de financer des canaux qui ont déjà échoué"],
  [/^Make the trade-offs visible$/, "Rendre les arbitrages visibles"],
  [/^Pick the highest expected value per dollar and day$/, "Choisir la meilleure valeur attendue par dollar et par jour"],
  [/^Move from recommendation to execution$/, "Passer de la recommandation à l'exécution"],
  [/^Break down the last two weeks by channel$/, "Détailler les deux dernières semaines par canal"],
  [/^Break down the last week by channel$/, "Détailler la dernière semaine par canal"],
  [/^Measure paid channel efficiency over 14 days$/, "Mesurer l'efficacité des canaux payants sur 14 jours"],
  [/^Rank what to do next$/, "Classer la prochaine action"],
  [/^Draft the content this experiment needs$/, "Rédaction du contenu nécessaire à cette expérience"],
  [/^Draft the content$/, "Rédiger le contenu"],
  [/^Draft the content for an experiment$/, "Rédiger le contenu d'une expérience"],
  [/^Publish the post for (.+)$/, "Publier le post de $1"],
  [/^Ground the plan in confirmed facts$/, "Ancrer le plan dans les faits confirmés"],
  [/^Know where the business stands$/, "Savoir où en est l'entreprise"],

  // Tool calls and approvals (src/server/agent/tools.ts)
  [/^Compared the last (\d+) days with the \1 before$/, "Comparaison des $1 derniers jours avec les $1 précédents"],
  [/^Broke down the last (\d+) days by channel$/, "Détail des $1 derniers jours par canal"],
  [/^Read confirmed facts, ICPs and competitors$/, "Lecture des faits confirmés, ICP et concurrents"],
  [/^Ranked the experiment queue against past learnings$/, "File d'expériences classée au regard des apprentissages passés"],
  [/^Evaluated experiment results$/, "Résultats de l'expérience évalués"],
  [/^Proposed “(.+)”$/, "« $1 » proposée"],
  [/^Recorded the experiment result and learning$/, "Résultat et apprentissage de l'expérience enregistrés"],
  [/^Publish landing page$/, "Publier la landing page"],
  [/^Publish post$/, "Publier le post"],
  [/^Send “(.+)”$/, "Envoyer « $1 »"],
  [/^Change daily budget$/, "Modifier le budget quotidien"],
  [/^Pause campaign$/, "Mettre la campagne en pause"],
  [/^Launch “(.+)”$/, "Lancer « $1 »"],
  [/^Draft → live at (.+)$/, "Brouillon → en ligne sur $1"],
  [/^Active → paused$/, "Active → en pause"],
  [/^To (\d+) recipient\(s\)$/, "À $1 destinataire(s)"],
  [/^Query business metrics$/, "Interroger les métriques business"],
  [/^Break down results by channel$/, "Détailler les résultats par canal"],
  [/^Read business memory$/, "Lire la mémoire business"],
  [/^Rank the experiment queue$/, "Classer la file d'expériences"],
  [/^Evaluate an experiment$/, "Évaluer une expérience"],
  [/^Propose an experiment$/, "Proposer une expérience"],
  [/^Record result and learning$/, "Enregistrer le résultat et l'apprentissage"],
  [/^Read live data from a connected tool$/, "Lire des données en direct depuis un outil connecté"],
  [/^Publish a landing page$/, "Publier une landing page"],
  [/^Publish a social post$/, "Publier un post social"],
  [/^Send an email$/, "Envoyer un e-mail"],
  [/^Change a campaign's daily budget$/, "Modifier le budget quotidien d'une campagne"],
  [/^Pause a campaign$/, "Mettre une campagne en pause"],
  [/^Launch a paid campaign$/, "Lancer une campagne payante"],
];

export function translateRunText(text: string, locale: Locale): string;
export function translateRunText(text: string | null, locale: Locale): string | null;
export function translateRunText(text: string | null, locale: Locale): string | null {
  if (!text) return text;
  // Runs recorded before the rename still say "Claude"; the product speaks of AI.
  if (locale === "en") return text.replace(/ with Claude$/, " with AI").replace(/; Claude will look for it$/, "; AI will look for it");
  for (const [pattern, replacement] of FR) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  // Plan details are step titles joined with an arrow; translate each part.
  if (text.includes(" → ")) {
    const parts = text.split(" → ");
    const translated = parts.map((part) => translateRunText(part, locale));
    if (translated.some((part, i) => part !== parts[i])) return translated.join(" → ");
  }
  // Step details often carry a policy or evaluation sentence.
  return translateDomainText(text, locale);
}
