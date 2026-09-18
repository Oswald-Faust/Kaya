import {
  Bot,
  Briefcase,
  Building2,
  Code,
  Rocket,
  Smartphone,
  Sprout,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/marketing/nav-data";

export interface SolutionItem {
  id: string;
  slug: string;
  category: "byStage" | "byProduct" | "byTeam";
  tone: Tone;
  spot: "understand" | "decide" | "experiment" | "control" | "learn";
  icon: LucideIcon;
  title: string;
  titleEn: string;
  eyebrow: string;
  eyebrowEn: string;
  kicker: string;
  kickerEn: string;
  lead: string;
  leadEn: string;
  badge: string;
  badgeEn: string;
  stat: { value: string; label: string; labelEn: string };
  pains: {
    title: string;
    titleEn: string;
    description?: string;
    descriptionEn?: string;
    items: string[];
    itemsEn: string[];
  };
  playbook: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    steps: {
      step: "understand" | "decide" | "experiment" | "control" | "learn" | "measure";
      label: string;
      labelEn: string;
      detail: string;
      detailEn: string;
    }[];
  };
  recommendedIntegrations: string[];
  mockData: {
    title: string;
    tag: string;
    status: string;
    items: { label: string; value: string; hint?: string }[];
    actionLabel: string;
  };
  faqs: {
    q: string;
    qEn: string;
    a: string;
    aEn: string;
  }[];
}

export const SOLUTIONS: SolutionItem[] = [
  // --- PAR ÉTAPE (byStage) ---
  {
    id: "preLaunch",
    slug: "pre-launch",
    category: "byStage",
    tone: "grass",
    spot: "understand",
    icon: Sprout,
    title: "Valider l'adéquation marché avant d'écrire 10 000 lignes de code",
    titleEn: "Validate market demand before writing 10,000 lines of code",
    eyebrow: "Solution · Pré-lancement",
    eyebrowEn: "Solution · Pre-Launch",
    kicker: "Phase de validation",
    kickerEn: "Validation Stage",
    lead: "Transformez vos hypothèses produit en signaux de marché concrets. Kaya analyse le paysage concurrentiel, formule vos personas et teste la demande avec des pages d'attente à fort taux de conversion.",
    leadEn: "Turn product hypotheses into concrete market signals. Kaya crawls the competitive landscape, sharpens your ICP, and validates real demand.",
    badge: "Idéal pour les projets en création",
    badgeEn: "Ideal for pre-launch founders",
    stat: {
      value: "48h",
      label: "pour valider si votre wedge produit intéresse de vrais utilisateurs",
      labelEn: "to test whether your product wedge resonates with buyers",
    },
    pains: {
      title: "Construire un produit parfait dont personne ne veut",
      titleEn: "Building the perfect tool that nobody actually buys",
      items: [
        "Des mois passés à coder sans confrontation au marché",
        "Difficulté à formuler la proposition de valeur en 1 phrase percutante",
        "Aucune liste d'attente qualifiée au moment du lancement",
      ],
      itemsEn: [
        "Months spent coding without market feedback",
        "Struggling to summarize your value proposition in one sentence",
        "Zero qualified waitlist signups on launch day",
      ],
    },
    playbook: {
      title: "La boucle de validation pré-lancement",
      titleEn: "The Pre-Launch Validation Loop",
      description: "Comment Kaya vous aide à valider l'intérêt avant de dépenser des milliers d'euros.",
      descriptionEn: "How Kaya tests demand before you commit months of engineering runway.",
      steps: [
        {
          step: "understand",
          label: "Détection des alternatives existantes",
          labelEn: "Competitor Alternative Scan",
          detail: "Kaya analyse ce que vos futurs utilisateurs utilisent aujourd'hui (outils manuels, Notion, concurrents).",
          detailEn: "Maps what prospective users use right now: spreadsheets, brittle scripts, or legacy tools.",
        },
        {
          step: "decide",
          label: "Choix de l'angle différenciant (Wedge)",
          labelEn: "Unique Wedge Selection",
          detail: "Isolement de la douleur précise mal adressée par les acteurs en place.",
          detailEn: "Isolates the acute pain point ignored by bulky legacy alternatives.",
        },
        {
          step: "experiment",
          label: "Déploiement de la page de capture",
          labelEn: "Waitlist Page Deployment",
          detail: "Page d'attente claire avec promesse concrète et collecte des besoins prioritaires.",
          detailEn: "Deploys a crisp landing page that captures emails and ranks specific feature requests.",
        },
        {
          step: "learn",
          label: "Score de désirabilité",
          labelEn: "Desirability Scoring",
          detail: "Analyse du ratio visiteur/lead pour décider si le produit doit être développé tel quel.",
          detailEn: "Calculates conversion ratio to provide an objective go/no-go building signal.",
        },
      ],
    },
    recommendedIntegrations: ["Google Search Console", "Hacker News", "Product Hunt"],
    mockData: {
      title: "Rapport de pré-lancement · Test de désirabilité",
      tag: "Validation · R0",
      status: "Signal validé",
      items: [
        { label: "Concept testé", value: "Moniteur de tâches cron avec alerte de non-démarrage" },
        { label: "Taux d'inscription waitlist", value: "14.2 % (seuil cible > 10 %)" },
        { label: "Objection n°1", value: "“Est-ce que ça fonctionne avec AWS ECS ?”" },
        { label: "Décision recommandée", value: "Lancer le MVP avec intégration AWS native" },
      ],
      actionLabel: "Démarrer la validation pré-lancement",
    },
    faqs: [
      {
        q: "Kaya peut-il créer une page d'attente pour mon projet ?",
        qEn: "Can Kaya generate a waitlist page for my project?",
        a: "Oui, Kaya génère la structure, les textes et les arguments clés pour votre page de capture d'inscriptions.",
        aEn: "Yes, Kaya drafts the high-converting copy, value proposition, and structure for your waitlist page.",
      },
    ],
  },
  {
    id: "firstRevenue",
    slug: "first-revenue",
    category: "byStage",
    tone: "tangerine",
    spot: "decide",
    icon: Rocket,
    title: "Passer des utilisateurs gratuits aux premiers clients payants",
    titleEn: "Convert early free users into your first paying customers",
    eyebrow: "Solution · Premier Revenu",
    eyebrowEn: "Solution · First Revenue",
    kicker: "Monétisation",
    kickerEn: "Monetization Stage",
    lead: "Vous avez des inscriptions mais personne ne passe sa carte bancaire ? Kaya analyse l'élasticité de vos tarifs, restructure votre grille et active les déclencheurs de conversion payante.",
    leadEn: "Lots of trial signups but zero paid upgrades? Kaya optimizes your pricing tiers and triggers high-converting paywall interventions.",
    badge: "Objectif : vos premiers 1 000 € de MRR",
    badgeEn: "Goal: your first $1,000 MRR",
    stat: {
      value: "+41 %",
      label: "de conversions après clarification des limites de plans d'usage",
      labelEn: "increase in upgrades after clarifying usage limits",
    },
    pains: {
      title: "Des utilisateurs satisfaits qui restent indéfiniment sur l'offre gratuite",
      titleEn: "Happy users who stay on the free tier forever",
      items: [
        "Plan gratuit trop généreux qui n'incite pas à l'achat",
        "Tarifs mal calibrés qui effraient les petites équipes",
        "Aucune proposition de valeur premium expliquée au bon moment",
      ],
      itemsEn: [
        "Free tier too generous, disincentivizing upgrades",
        "Pricing misaligned with perceived value for early teams",
        "Zero contextual prompt when user hits natural usage thresholds",
      ],
    },
    playbook: {
      title: "La feuille de route vers vos premiers abonnements",
      titleEn: "The Roadmap to First Paid Subscriptions",
      description: "Comment Kaya transforme l'usage produit en transactions Stripe régulières.",
      descriptionEn: "How Kaya turns active usage into dependable monthly recurring revenue.",
      steps: [
        {
          step: "understand",
          label: "Audit des limites d'usage",
          labelEn: "Usage Limit Analysis",
          detail: "Kaya identifie la fonctionnalité que les utilisateurs actifs utilisent le plus.",
          detailEn: "Identifies the single feature power users rely on daily.",
        },
        {
          step: "decide",
          label: "Repositionnement des paliers tarifaires",
          labelEn: "Tier Repositioning",
          detail: "Proposition d'un forfait d'entrée clair et attractif (ex. 29 $/mois).",
          detailEn: "Establishes a low-friction entry tier (e.g. $29/mo flat) with team-wide peace of mind.",
        },
        {
          step: "experiment",
          label: "Déploiement de notifications in-app",
          labelEn: "Contextual Paywall Nudges",
          detail: "Messages ciblés lorsque l'utilisateur s'approche de son quota d'essai.",
          detailEn: "Triggers respectful upgrade prompts right as value thresholds are reached.",
        },
        {
          step: "measure",
          label: "Réconciliation Stripe immédiate",
          labelEn: "Stripe Revenue Tracking",
          detail: "Chaque paiement est attribué à la modification tarifaire qui l'a déclenché.",
          detailEn: "Every payment is tied back to the exact pricing test that triggered it.",
        },
      ],
    },
    recommendedIntegrations: ["Stripe", "PostHog", "Customer.io"],
    mockData: {
      title: "Simulation Monétisation · Forfait Team",
      tag: "Tarifs & Limites · R1",
      status: "Recommandation prête",
      items: [
        { label: "Plan actuel", value: "Gratuit illimité (0 €) · 120 utilisateurs actifs" },
        { label: "Nouveau palier proposé", value: "Gratuit 20 moniteurs · Équipe 29 €/mois" },
        { label: "Comptes éligibles", value: "34 équipes dépassent déjà les 20 moniteurs" },
        { label: "Projection MRR", value: "+ 986 €/mois sous 30 jours" },
      ],
      actionLabel: "Appliquer la nouvelle grille tarifaire",
    },
    faqs: [
      {
        q: "Mes utilisateurs actuels vont-ils mal réagir au changement de prix ?",
        qEn: "Will existing users churn if I introduce paid limits?",
        a: "Kaya permet d'appliquer une politique de 'grandfathering' : vos premiers testeurs conservent leurs avantages pendant que les nouveaux souscrivent à la nouvelle offre.",
        aEn: "Kaya supports grandfathering policies: early adopters keep their legacy access while new accounts enter the paid model.",
      },
    ],
  },
  {
    id: "scaling",
    slug: "scaling",
    category: "byStage",
    tone: "pink",
    spot: "control",
    icon: TrendingUp,
    title: "Accélérer la croissance sans explosion des coûts d'acquisition",
    titleEn: "Scale predictable growth without exploding CAC",
    eyebrow: "Solution · Croissance",
    eyebrowEn: "Solution · Scaling",
    kicker: "Phase de scale",
    kickerEn: "Scaling Stage",
    lead: "Vous avez trouvé votre Product-Market Fit ? Kaya automatise le déploiement de dizaines de micro-expériences par mois et pilote vos budgets publicitaires sous contraintes strictes de rentabilité.",
    leadEn: "Found product-market fit? Kaya orchestrates dozens of concurrent growth experiments per month, scaling only proven profitable channels.",
    badge: "Pour les SaaS > 10k€ MRR",
    badgeEn: "For SaaS > $10k MRR",
    stat: {
      value: "3.4×",
      label: "d'expériences testées chaque mois sans recruter d'équipe marketing dédiée",
      labelEn: "more experiments shipped monthly without hiring an internal marketing army",
    },
    pains: {
      title: "Le plafond de verre du fondateur devenu goulot d'étranglement",
      titleEn: "The founder bottleneck halting marketing velocity",
      description: "À mesure que le produit grossit, le fondateur n'a plus le temps d'écrire des articles, de gérer les ads et d'analyser les retours, ralentissant la croissance.",
      descriptionEn: "As product scale increases, founders lose time to manage ad bids, write SEO content, and analyze cohorts—stalling momentum.",
      items: [
        "Incapacité à tester plus d'une idée marketing par mois",
        "Augmentation sournoise du coût par acquisition (CAC)",
        "Absence de processus documenté et d'historique d'apprentissage",
      ],
      itemsEn: [
        "Stuck testing at most 1 marketing idea per month",
        "Creeping customer acquisition costs (CAC)",
        "Zero institutional memory on what worked and why",
      ],
    },
    playbook: {
      title: "Le moteur d'expérimentation continu",
      titleEn: "The Continuous Experiment Engine",
      description: "Une machine autonome qui teste, mesure et archive chaque hypothèse de croissance.",
      descriptionEn: "An autonomous loop that ranks, runs, and learns from dozens of experiments.",
      steps: [
        {
          step: "understand",
          label: "Détection des opportunités d'expansion",
          labelEn: "Expansion Opportunity Mining",
          detail: "Kaya analyse les nouvelles requêtes de recherche et les secteurs connexes réceptifs.",
          detailEn: "Discovers emerging search trends and adjacent industry verticals.",
        },
        {
          step: "decide",
          label: "File d'attente d'expériences classées",
          labelEn: "Ranked Experiment Backlog",
          detail: "Score RICE automatique pondéré par les apprentissages des semaines passées.",
          detailEn: "Impact × Confidence × Ease scoring weighted by historical empirical evidence.",
        },
        {
          step: "experiment",
          label: "Lancement parallèle de 5 à 10 tests",
          labelEn: "Concurrent Multi-Variant Testing",
          detail: "Campagnes payantes, pages d'atterrissage et séquences email déclenchées ensemble.",
          detailEn: "Simultaneously orchestrates paid search variants, landing pages, and email plays.",
        },
        {
          step: "learn",
          label: "Capitalisation & règles d'interdiction",
          labelEn: "Suppression & Scaling Rules",
          detail: "Les tactiques inefficaces sont bannies définitivement ; les gagnantes reçoivent plus de budget.",
          detailEn: "Inefficient tactics are blocked from future backlogs; verified winners receive expanded budget.",
        },
      ],
    },
    recommendedIntegrations: ["Google Ads", "Meta Ads", "Stripe", "PostHog", "GitHub"],
    mockData: {
      title: "File d'expériences · Pilote automatique",
      tag: "Autonomie R3 · Guardrails stricts",
      status: "8 expériences en cours",
      items: [
        { label: "Expérience n°1", value: "Page SEO comparative “Alternative à Datadog” (+24% essais)" },
        { label: "Expérience n°2", value: "Google Ads sur requêtes haute intention (CAC 52 €)" },
        { label: "Campagne coupée", value: "Retargeting Meta (CAC 210 € > seuil 100 €)" },
        { label: "Apprentissage enregistré", value: "Les ingénieurs ne cliquent pas sur les bannières display" },
      ],
      actionLabel: "Voir la file d'expérimentation",
    },
    faqs: [
      {
        q: "Kaya peut-il remplacer une agence marketing ?",
        qEn: "Can Kaya replace a traditional marketing agency?",
        a: "Pour les logiciels techniques et SaaS, Kaya exécute avec une rigueur statistique et une rapidité incomparables, sans frais fixes d'agence à 5 000 €/mois.",
        aEn: "For technical software and SaaS, Kaya executes with unmatched statistical discipline at a fraction of agency retainers.",
      },
    ],
  },

  // --- PAR PRODUIT (byProduct) ---
  {
    id: "b2bSaas",
    slug: "b2b-saas",
    category: "byProduct",
    tone: "blue",
    spot: "understand",
    icon: Building2,
    title: "Le système de croissance conçu sur-mesure pour le SaaS B2B",
    titleEn: "The growth engine purpose-built for B2B SaaS",
    eyebrow: "Solution · SaaS B2B",
    eyebrowEn: "Solution · B2B SaaS",
    kicker: "Logiciels B2B",
    kickerEn: "B2B Software",
    lead: "Cycles de vente, comités d'achat, intégrations et sécurité : Kaya comprend la complexité du B2B et crée des messages orientés ROI pour convaincre les décideurs.",
    leadEn: "Buying committees, integrations, and SOC2 compliance: Kaya speaks the language of B2B decision makers, proving business value at every touchpoint.",
    badge: "Positionnement B2B à haute conversion",
    badgeEn: "High-converting B2B positioning",
    stat: {
      value: "4.2×",
      label: "plus de demandes de démo qualifiées issues de comptes entreprises",
      labelEn: "more qualified demo requests from verified company domains",
    },
    pains: {
      title: "Le marketing grand public ne fonctionne pas en B2B",
      titleEn: "Consumer marketing tactics fail in B2B enterprise sales",
      items: [
        "Inscriptions d'adresses Gmail personnelles au lieu d'emails professionnels",
        "Incapacité à rassurer sur la conformité (RGPD, SOC2, hébergement)",
        "Manque de documentation orientée équipe pour faciliter la validation interne",
      ],
      itemsEn: [
        "Signups from personal Gmails instead of verified work accounts",
        "Inability to proactively answer security and compliance questions",
        "Absence of team-oriented collateral for internal champion buying buy-in",
      ],
    },
    playbook: {
      title: "L'acquisition B2B structurée",
      titleEn: "Structured B2B Acquisition",
      description: "Comment capter des comptes d'équipe avec un pouvoir d'achat élevé.",
      descriptionEn: "How to attract buying teams with genuine purchase intent.",
      steps: [
        {
          step: "understand",
          label: "Enrichissement des signaux d'entreprise",
          labelEn: "Firmographic Signal Enrichment",
          detail: "Kaya analyse la taille des entreprises et les stacks logicielles compatibles.",
          detailEn: "Evaluates company employee bands and tech-stack compatibilities.",
        },
        {
          step: "decide",
          label: "Création des fiches solutions par métier",
          labelEn: "Role-Specific Solution Guides",
          detail: "Arguments sur-mesure pour le CTO, le responsable sécurité et le chef de projet.",
          detailEn: "Distinct proof points for the CTO, Head of Security, and Team Leads.",
        },
        {
          step: "experiment",
          label: "Contenus d'architecture & calculateurs de ROI",
          labelEn: "ROI Calculators & Architecture Whitepapers",
          detail: "Pages transparentes avec calculateurs de gain de temps et comparatifs stricts.",
          detailEn: "Auditable ROI calculators and technical security architecture whitepapers.",
        },
        {
          step: "measure",
          label: "Suivi des comptes actifs et de l'ARR",
          labelEn: "Account-Level ARR Tracking",
          detail: "Mesure de la progression des comptes dans l'entonnoir d'achat.",
          detailEn: "Measures pipeline velocity and pipeline dollar volume directly.",
        },
      ],
    },
    recommendedIntegrations: ["Stripe", "PostHog", "Google Ads", "Slack"],
    mockData: {
      title: "Audit B2B · Pipeline d'acquisition",
      tag: "Segment Entreprise · 5-100 salariés",
      status: "Pipeline actif",
      items: [
        { label: "Domaines professionnels vérifiés", value: "78 % des inscriptions d'essai" },
        { label: "Page la plus visitée avant achat", value: "“Sécurité, Chiffrement & Conformité RGPD”" },
        { label: "Panier moyen (ACV)", value: "1 240 €/an par équipe" },
        { label: "Recommandation Kaya", value: "Ajouter le SSO SAML sur le forfait Business" },
      ],
      actionLabel: "Optimiser le tunnel B2B",
    },
    faqs: [
      {
        q: "Kaya gère-t-il les flux de vente assistée (sales-led) ?",
        qEn: "Does Kaya support sales-led demo scheduling?",
        a: "Oui, Kaya peut router les comptes à fort potentiel vers la prise de rendez-vous Cal.com tout en laissant les petites équipes s'inscrire en self-service.",
        aEn: "Yes, Kaya routes high-potential company domains directly into calendar bookings while self-serve accounts onboard smoothly.",
      },
    ],
  },
  {
    id: "developerTools",
    slug: "developer-tools",
    category: "byProduct",
    tone: "lilac",
    spot: "experiment",
    icon: Code,
    title: "Le marketing sans bullshit pour les outils développeurs",
    titleEn: "Bullshit-free marketing engineered for developer tools",
    eyebrow: "Solution · DevTools",
    eyebrowEn: "Solution · Developer Tools",
    kicker: "Outils Développeurs",
    kickerEn: "Developer Tools",
    lead: "Les développeurs détestent le marketing. Kaya analyse votre CLI, vos SDKs et vos docs techniques pour créer du contenu utile, précis et directement testable dans le terminal.",
    leadEn: "Engineers hate marketing. Kaya reads your SDKs, CLI syntax, and documentation to build crisp, reproducible examples that earn developer respect.",
    badge: "100 % orienté code & documentation",
    badgeEn: "100% Code & Docs First",
    stat: {
      value: "68 %",
      label: "de taux d'activation grâce à des exemples de code copiables en 1 clic",
      labelEn: "activation rate via 1-click terminal copy-paste snippets",
    },
    pains: {
      title: "Pourquoi les campagnes traditionnelles échouent face aux ingénieurs",
      titleEn: "Why traditional marketing repels software engineers",
      description: "Demander à un ingénieur de 'demander une démo' avant de voir le code ou masquer la documentation technique détruit immédiatement la confiance.",
      descriptionEn: "Hiding documentation behind forms or demanding a sales call before showing the API kills dev adoption instantly.",
      items: [
        "Jargon marketing qui décrédibilise le projet auprès de la communauté tech",
        "Documentation introuvable sur Google sur les requêtes d'erreurs fréquentes",
        "Absence de démo interactive ou de bac à sable directement accessible",
      ],
      itemsEn: [
        "Fluffy copy destroying developer credibility",
        "Docs failing to rank for high-frequency CLI error queries",
        "No frictionless sandbox or interactive live playground",
      ],
    },
    playbook: {
      title: "La méthode DevTools : Preuve d'abord, parole ensuite",
      titleEn: "The DevTools Playbook: Proof Over Promises",
      description: "Comment gagner l'adoption des équipes d'ingénierie.",
      descriptionEn: "How to earn developer trust and organic bottom-up adoption.",
      steps: [
        {
          step: "understand",
          label: "Indexation de la documentation technique",
          labelEn: "Doc & API Spec Indexing",
          detail: "Kaya analyse vos schémas OpenAPI, vos commandes CLI et vos fichiers README.",
          detailEn: "Crawls OpenAPI schemas, CLI commands, and repository readmes.",
        },
        {
          step: "decide",
          label: "Identification des requêtes de dépannage",
          labelEn: "Troubleshooting Query Mining",
          detail: "Repérage des messages d'erreur et des cas d'usage fréquents recherchés par les devs.",
          detailEn: "Targets specific stack overflow queries, error logs, and framework setup guides.",
        },
        {
          step: "experiment",
          label: "Guides d'intégration pas-à-pas",
          labelEn: "Interactive Integration Cookbooks",
          detail: "Publication de tutoriels vérifiés avec blocs de code exacts et captures de terminal.",
          detailEn: "Publishes tested cookbooks with copyable terminal snippets and verified outputs.",
        },
        {
          step: "learn",
          label: "Suivi des clones GitHub et des tokens API créés",
          labelEn: "API Key Activation Tracking",
          detail: "Mesure de la conversion jusqu'à la première requête API réussie.",
          detailEn: "Tracks the critical metric: time to first successful API request (TTFHW).",
        },
      ],
    },
    recommendedIntegrations: ["GitHub", "Hacker News", "PostHog", "Stripe"],
    mockData: {
      title: "Performances DevTools · Tickwarden CLI",
      tag: "Acquisition Ingénieurs · R0",
      status: "Excellente adoption",
      items: [
        { label: "Top source de trafic", value: "Show HN + Guide “Cron monitoring in Go”" },
        { label: "Temps jusqu'à la 1ère commande", value: "1 min 42s (médiane)" },
        { label: "Taux de rétention 30 jours", value: "74 % des comptes ayant créé un job" },
        { label: "Action recommandée", value: "Publier le plugin officiel OpenTelemetry" },
      ],
      actionLabel: "Voir les métriques développeurs",
    },
    faqs: [
      {
        q: "Kaya peut-il écrire des tutoriels de code corrects ?",
        qEn: "Can Kaya produce technically accurate code tutorials?",
        a: "Kaya s'appuie directement sur vos fichiers de documentation et vos schémas d'API existants pour garantir que chaque extrait de code est syntaxiquement exact et à jour.",
        aEn: "Kaya pulls directly from your live API definitions and docs, ensuring syntax matches your current runtime.",
      },
    ],
  },
  {
    id: "aiApps",
    slug: "ai-apps",
    category: "byProduct",
    tone: "sun",
    spot: "understand",
    icon: Bot,
    title: "Se démarquer du bruit ambiant pour les applications et agents IA",
    titleEn: "Cut through the noise for AI apps, workflows, and agents",
    eyebrow: "Solution · Applications IA",
    eyebrowEn: "Solution · AI Applications",
    kicker: "Produits IA",
    kickerEn: "AI Products",
    lead: "Le marché est saturé de 'wrappers GPT' génériques. Kaya positionne votre produit sur ses capacités d'intégration uniques, sa précision d'exécution et ses garanties de gouvernance.",
    leadEn: "The web is flooded with generic AI wrappers. Kaya articulates your deep domain workflows, governance guardrails, and deterministic execution.",
    badge: "Défense de valeur face aux wrappers",
    badgeEn: "Defensible AI value proposition",
    stat: {
      value: "5.1×",
      label: "plus de conversion lorsque la fiabilité et les garde-fous sont prouvés",
      labelEn: "conversion lift when deterministic guardrails and security are highlighted",
    },
    pains: {
      title: "La défiance des acheteurs face aux promesses d'IA démesurées",
      titleEn: "Buyer cynicism toward exaggerated AI marketing promises",
      description: "Les prospects craignent les hallucinations, la fuite de données et le manque de contrôle. Promettre une 'IA magique qui fait tout' fait fuir les entreprises sérieuses.",
      descriptionEn: "Buyers fear hallucinations, data leakage, and runaway automated spend. Claiming 'magical AI' repels serious software buyers.",
      items: [
        "Assimilation rapide à un simple wrapper LLM sans valeur ajoutée durable",
        "Inquiétudes sur la confidentialité des données et l'entraînement des modèles",
        "Difficulté à expliquer comment l'agent est contrôlé et vérifié",
      ],
      itemsEn: [
        "Dismissed as a thin API wrapper without moat",
        "Customer fears around data retention and private model training",
        "Struggling to demonstrate governance, auditability, and human-in-the-loop",
      ],
    },
    playbook: {
      title: "La charte de crédibilité pour les produits IA",
      titleEn: "The AI Product Credibility Playbook",
      description: "Mettre en avant le déterminisme, les contrôles et les données réelles.",
      descriptionEn: "Championing governance, math outside LLMs, and verifiable outcomes.",
      steps: [
        {
          step: "understand",
          label: "Définition de la valeur non-LLM",
          labelEn: "Non-LLM Moat Articulation",
          detail: "Mise en lumière des moteurs déterministes : base de données, gouvernance, règles d'accès.",
          detailEn: "Highlights deterministic engines: policy engines, database triggers, and immutable logs.",
        },
        {
          step: "decide",
          label: "Positionnement : 'Autonomie sous garde-fous'",
          labelEn: "Bounded Autonomy Framing",
          detail: "Explication claire des 4 niveaux d'autonomie (Observer, Suggérer, Copilote, Pilote auto).",
          detailEn: "Clearly articulates the 4 autonomy tiers: Observe, Suggest, Copilot, Autopilot.",
        },
        {
          step: "experiment",
          label: "Démonstration interactive des règles de sécurité",
          labelEn: "Interactive Governance Sandbox",
          detail: "Pages produit montrant exactement comment les actions sensibles sont bloquées.",
          detailEn: "Interactive UI mocks showing how mutations and financial actions are reviewed.",
        },
        {
          step: "learn",
          label: "Preuve par les métriques de fiabilité",
          labelEn: "Reliability & Accuracy Metrics",
          detail: "Publication des taux de réussite réels et de non-hallucination.",
          detailEn: "Surfaces verified execution success rates and grounding metrics.",
        },
      ],
    },
    recommendedIntegrations: ["Stripe", "PostHog", "Slack", "OpenAI / Claude"],
    mockData: {
      title: "Positionnement IA · Audit de différenciation",
      tag: "Gouvernance IA · R4",
      status: "Différenciation forte",
      items: [
        { label: "Positionnement recommandé", value: "“L'agent marketing qui applique vos plafonds financiers”" },
        { label: "Wedge principal", value: "Mathématiques déterministes hors du modèle LLM" },
        { label: "Élément rassurant #1", value: "Log d'audit immuable avec trigger PostgreSQL" },
        { label: "Impact conversion", value: "+ 52 % d'essais sur les comptes de plus de 10 personnes" },
      ],
      actionLabel: "Déployer la charte de crédibilité IA",
    },
    faqs: [
      {
        q: "Pourquoi insister sur les garde-fous plutôt que sur l'intelligence du modèle ?",
        qEn: "Why emphasize guardrails over model cleverness?",
        a: "Parce qu'en entreprise, la première objection à l'adoption des agents IA n'est pas le manque d'intelligence, mais la peur de la perte de contrôle et des erreurs coûteuses.",
        aEn: "Because for serious businesses, the main blocker to agent adoption is fear of uncontrolled mutations, not lack of raw model intelligence.",
      },
    ],
  },
  {
    id: "mobileApps",
    slug: "mobile-apps",
    category: "byProduct",
    tone: "blue",
    spot: "decide",
    icon: Smartphone,
    title: "Optimisation de l'acquisition mobile & App Store",
    titleEn: "Mobile app growth, ASO, and profitable installs",
    eyebrow: "Solution · Applications Mobiles",
    eyebrowEn: "Solution · Mobile Apps",
    kicker: "Applications Mobiles",
    kickerEn: "Mobile Apps",
    lead: "Attirez des utilisateurs engagés sur iOS et Android sans dépendre aveuglément des régies publicitaires grâce à l'optimisation des fiches de store et aux boucles de parrainage.",
    leadEn: "Grow engaged iOS and Android user bases with precision App Store Optimization and high-converting onboarding funnels.",
    badge: "Bientôt disponible · Accès anticipé",
    badgeEn: "Coming Soon · Early Access",
    stat: {
      value: "+27 %",
      label: "de taux de conversion de la fiche App Store vers l'installation",
      labelEn: "conversion lift on App Store product page listings",
    },
    pains: {
      title: "Le coût exorbitant des installations publicitaires mobiles",
      titleEn: "Skyrocketing cost-per-install across paid mobile networks",
      description: "Avec les restrictions de tracking (ATT sur iOS), acheter des installations sans une rétention solide le premier jour revient à jeter de l'argent par les fenêtres.",
      descriptionEn: "With privacy tracking shifts on mobile, buying blind CPI installs without immediate Day 1 activation burns capital rapidly.",
      items: [
        "Fiches App Store génériques qui ne convertissent pas les visites en téléchargements",
        "Taux d'abandon massif entre l'ouverture de l'application et l'abonnement",
        "Coût par acquisition supérieur à la valeur vie du premier mois",
      ],
      itemsEn: [
        "Generic store screenshots that fail to trigger downloads",
        "Steep drop-off between app download and paywall opt-in",
        "CPI higher than 30-day realized user customer value",
      ],
    },
    playbook: {
      title: "La stratégie de croissance pour applications mobiles",
      titleEn: "The Mobile App Growth Playbook",
      description: "Maximiser la conversion naturelle sur l'App Store et Google Play.",
      descriptionEn: "Optimizing organic discoverability on the App Store and Google Play.",
      steps: [
        {
          step: "understand",
          label: "Audit ASO des mots-clés de store",
          labelEn: "ASO Keyword & Metadata Audit",
          detail: "Kaya analyse les termes les plus recherchés par catégorie d'applications.",
          detailEn: "Audits search volume, keyword difficulty, and store search rankings.",
        },
        {
          step: "decide",
          label: "Refonte des visuels de présentation",
          labelEn: "Store Screenshot Framing",
          detail: "Mise en avant des 3 écrans essentiels qui prouvent l'utilité en 3 secondes.",
          detailEn: "Frames the 3 core screenshots proving user benefit within 3 seconds.",
        },
        {
          step: "experiment",
          label: "Test d'onboarding et d'écran payant",
          labelEn: "Paywall & Onboarding Experiments",
          detail: "Optimisation de l'étape de présentation du forfait annuel.",
          detailEn: "Tests yearly subscription framing and discount triggers upon trial start.",
        },
        {
          step: "measure",
          label: "Mesure de la rétention J1 / J7 / J30",
          labelEn: "Day 1 / 7 / 30 Cohort Retention",
          detail: "Analyse du coût réel par utilisateur actif régulier.",
          detailEn: "Calculates blended CAC per engaged active subscriber.",
        },
      ],
    },
    recommendedIntegrations: ["App Store Connect", "RevenueCat", "PostHog"],
    mockData: {
      title: "Feuille de route ASO · iOS & Android",
      tag: "Mobile Growth · R1",
      status: "Accès anticipé",
      items: [
        { label: "Mots-clés ASO identifiés", value: "14 termes à fort volume et faible concurrence" },
        { label: "Recommandation titre", value: "Ajouter le bénéfice principal dans le sous-titre de 30 caractères" },
        { label: "Écran d'onboarding clé", value: "Demander la permission de notification au moment de la première valeur" },
      ],
      actionLabel: "Rejoindre la liste d'accès anticipé Mobile",
    },
    faqs: [
      {
        q: "Quand le module Mobile sera-t-il disponible en version finale ?",
        qEn: "When will the Mobile module be available in general release?",
        a: "Le module Mobile est actuellement en phase de test avec nos partenaires de conception. Vous pouvez demander un accès anticipé gratuit dès maintenant.",
        aEn: "The mobile module is currently in private preview with design partners. You can request early beta access today.",
      },
    ],
  },

  // --- PAR ÉQUIPE (byTeam) ---
  {
    id: "soloFounders",
    slug: "solo-founders",
    category: "byTeam",
    tone: "tangerine",
    spot: "decide",
    icon: User,
    title: "Le co-fondateur marketing autonome pour créateurs solos",
    titleEn: "The autonomous marketing co-founder for solo builders",
    eyebrow: "Solution · Fondateurs Solos",
    eyebrowEn: "Solution · Solo Founders",
    kicker: "Créateurs Solos",
    kickerEn: "Solo Founders",
    lead: "Vous avez codé le produit. Vous n'avez ni le temps ni l'envie de passer 4 heures par jour sur le marketing. Kaya prend en charge l'acquisition pendant que vous construisez les fonctionnalités.",
    leadEn: "You built the product. You don't have 4 hours a day to waste on marketing chore work. Kaya drives growth experiments while you ship code.",
    badge: "Conçu pour les développeurs indépendants",
    badgeEn: "Engineered for Indie Hackers",
    stat: {
      value: "10h+",
      label: "économisées chaque semaine sur les tâches de diffusion et de rédaction",
      labelEn: "saved every single week on distribution and copywriting chores",
    },
    pains: {
      title: "Le syndrome du codeur : construire encore une fonctionnalité au lieu de vendre",
      titleEn: "The builder syndrome: shipping more code instead of distributing",
      description: "Quand on est seul, coder est confortable alors que faire du marketing est intimidant et chronophage. Le produit stagne faute de visibilité.",
      descriptionEn: "When you're alone, coding feels safe while marketing feels ambiguous and draining. Great products die in silence.",
      items: [
        "Temps morcelé entre développement, support et promotion",
        "Culpabilité permanente de ne pas faire assez de marketing",
        "Aucun partenaire pour relire et challenger vos hypothèses d'acquisition",
      ],
      itemsEn: [
        "Attention constantly fragmented between dev, support, and distribution",
        "Persistent guilt over neglected marketing velocity",
        "No thought partner to challenge acquisition hypotheses and messaging",
      ],
    },
    playbook: {
      title: "La routine marketing solo de 15 minutes par semaine",
      titleEn: "The 15-Minute Weekly Solo Growth Routine",
      description: "Un rituel simple : vous lisez le brief le lundi, vous approuvez, Kaya s'occupe du reste.",
      descriptionEn: "A simple weekly loop: review Monday's growth brief, approve key actions, return to code.",
      steps: [
        {
          step: "understand",
          label: "Kaya analyse vos mises en production récentes",
          labelEn: "Kaya Ingests Recent Shipped Features",
          detail: "L'agent détecte ce que vous venez de déployer et crée les arguments de communication.",
          detailEn: "Detects your new changelog entries and drafts targeted announcements.",
        },
        {
          step: "decide",
          label: "Le Daily Growth Brief du lundi matin",
          labelEn: "Monday Morning Growth Brief",
          detail: "Un récapitulatif clair : ce qui a fonctionné, ce qui a échoué, et 2 actions prêtes pour validation.",
          detailEn: "One crisp summary: what worked, what stalled, and 2 ready-to-run experiments.",
        },
        {
          step: "control",
          label: "Validation en 1 clic sur votre téléphone",
          labelEn: "1-Click Sign-off on Mobile",
          detail: "Vous approuvez le texte ou le micro-budget d'un clic, sans interface complexe.",
          detailEn: "Review copy or ad spend adjustments in seconds with complete peace of mind.",
        },
        {
          step: "experiment",
          label: "Exécution autonome dans les clous",
          labelEn: "Bounded Autonomous Execution",
          detail: "Kaya publie les pages et lance les tests sans vous interrompre pendant vos sessions de code.",
          detailEn: "Kaya launches tests and monitors pacing without interrupting your flow state.",
        },
      ],
    },
    recommendedIntegrations: ["GitHub", "Stripe", "Google Search Console"],
    mockData: {
      title: "Espace Solo Founder · Routine Hebdomadaire",
      tag: "Temps Requis · 15 min/semaine",
      status: "Brief prêt",
      items: [
        { label: "Temps passé cette semaine", value: "8 minutes de relecture et validation" },
        { label: "Actions exécutées par Kaya", value: "1 page comparative publiée + 2 variantes d'annonces testées" },
        { label: "Résultat direct", value: "+ 7 nouveaux essais Stripe activés" },
        { label: "Budget dépensé", value: "38 € au total (sur 50 € alloués)" },
      ],
      actionLabel: "Adopter votre co-fondateur marketing",
    },
    faqs: [
      {
        q: "Est-ce accessible aux développeurs sans compétences marketing ?",
        qEn: "Can I use this with zero marketing background?",
        a: "Absolument. Kaya a été pensé pour les fondateurs techniques : les explications sont rationnelles, les formules sont affichées et aucun jargon creux n'est utilisé.",
        aEn: "Absolutely. Kaya was built for technical founders: clean logic, visible formulas, zero marketing fluff.",
      },
    ],
  },
  {
    id: "smallTeams",
    slug: "small-teams",
    category: "byTeam",
    tone: "grass",
    spot: "experiment",
    icon: Users,
    title: "Accélérer l'acquisition pour les équipes de 2 à 10 personnes",
    titleEn: "Empower high-velocity marketing for teams of 2 to 10",
    eyebrow: "Solution · Petites Équipes",
    eyebrowEn: "Solution · Small Teams",
    kicker: "Petites Équipes",
    kickerEn: "Small Teams",
    lead: "Alignez produit, technique et croissance sans réunions interminables. Donnez à votre équipe une mémoire marketing partagée où chaque décision s'appuie sur des données prouvées.",
    leadEn: "Align product, engineering, and GTM without endless meetings. Give your team a shared business memory where every play is backed by proven data.",
    badge: "Collaboration & Rôles partagés",
    badgeEn: "Collaborative Team Workspaces",
    stat: {
      value: "100 %",
      label: "de transparence sur les budgets, expériences et résultats pour toute l'équipe",
      labelEn: "visibility into budgets, experiments, and learnings across the entire team",
    },
    pains: {
      title: "Le manque de coordination entre ce qui se code et ce qui se vend",
      titleEn: "The disconnect between what gets shipped and what gets sold",
      description: "L'équipe produit sort de super fonctionnalités, mais le site ne les reflète pas et les campagnes continuent de promouvoir les anciennes options.",
      descriptionEn: "Engineering ships great features, but the website is out of date and ads continue promoting legacy positioning.",
      items: [
        "Personne ne sait exactement ce qui a été testé le mois dernier",
        "Conflits d'arbitrage sur l'utilisation du budget marketing disponible",
        "Dépendance à une seule personne qui détient tout le contexte commercial dans sa tête",
      ],
      itemsEn: [
        "Nobody remembers what was tested last month or why a tactic was abandoned",
        "Debates over where to allocate the limited monthly growth budget",
        "Single-person dependency on one founder carrying all commercial context",
      ],
    },
    playbook: {
      title: "La mémoire d'entreprise vivante pour équipes agiles",
      titleEn: "The Living Business Memory for Agile Teams",
      description: "Une source de vérité unique sur vos clients, vos personas et vos résultats.",
      descriptionEn: "A single shared source of truth for your ICPs, competitors, and proven playbooks.",
      steps: [
        {
          step: "understand",
          label: "Mémoire d'affaires partagée (Business Facts)",
          labelEn: "Shared Business Knowledge Graph",
          detail: "Kaya sépare les faits vérifiés, les hypothèses et les apprentissages invalidés.",
          detailEn: "Codifies confirmed business facts, active hypotheses, and disproved assumptions.",
        },
        {
          step: "decide",
          label: "Définition collaborative des politiques de dépense",
          labelEn: "Collaborative Budget Governance",
          detail: "L'équipe fixe les plafonds mensuels et choisit qui a le pouvoir d'approuver.",
          detailEn: "Team sets monthly caps and assigns explicit sign-off roles for ad spend and publishing.",
        },
        {
          step: "experiment",
          label: "File d'attente d'expérimentation collective",
          labelEn: "Open Experiment Backlog",
          detail: "Chaque membre de l'équipe peut soumettre une idée, Kaya l'évalue et la classe.",
          detailEn: "Any team member can propose an idea; Kaya evaluates, scores, and ranks it objectively.",
        },
        {
          step: "learn",
          label: "Partage automatique des apprentissages",
          labelEn: "Automated Knowledge Distribution",
          detail: "Notification Slack / email des victoires et des tactiques réfutées.",
          detailEn: "Slack and email summaries celebrating validated wins and retiring weak channels.",
        },
      ],
    },
    recommendedIntegrations: ["Slack", "GitHub", "Stripe", "PostHog", "Google Ads"],
    mockData: {
      title: "Espace Équipe · 4 Collaborateurs",
      tag: "Collaboration · Multi-utilisateurs",
      status: "Synchronisé",
      items: [
        { label: "Membres actifs", value: "Alex (Tech), Sophie (CEO), David (Produit)" },
        { label: "Faits d'affaires vérifiés", value: "42 faits confirmés dans la mémoire d'entreprise" },
        { label: "Expériences validées ce mois", value: "5 expériences terminées avec p < 0.05" },
        { label: "Économie de budget évitée", value: "450 € sauvés par coupure précoce d'un test raté" },
      ],
      actionLabel: "Inviter votre équipe sur Kaya",
    },
    faqs: [
      {
        q: "Peut-on définir des droits d'accès différents selon les membres de l'équipe ?",
        qEn: "Can we assign granular role-based permissions to team members?",
        a: "Oui. Kaya propose des rôles fins (Propriétaire, Administrateur, Membre) pour s'assurer que seules les personnes désignées peuvent engager des dépenses ou valider des textes publics.",
        aEn: "Yes. Kaya features role-based access control (Owner, Admin, Member) so only authorized leads can commit budget or approve public copy.",
      },
    ],
  },
  {
    id: "agencies",
    slug: "agencies",
    category: "byTeam",
    tone: "lilac",
    spot: "control",
    icon: Briefcase,
    title: "Le copilote multi-clients pour agences et studios de croissance",
    titleEn: "The multi-client growth operating system for modern agencies",
    eyebrow: "Solution · Agences & Studios",
    eyebrowEn: "Solution · Agencies & Studios",
    kicker: "Agences & Studios",
    kickerEn: "Agencies & Studios",
    lead: "Gérez les audits, les stratégies de positionnement et les files d'expérimentations de tous vos clients SaaS depuis un tableau de bord unifié et transparent.",
    leadEn: "Orchestrate audits, competitive positioning matrices, and experiment queues across all client accounts from one unified command center.",
    badge: "Bientôt disponible · Espace multi-comptes",
    badgeEn: "Coming Soon · Multi-Tenant Workspace",
    stat: {
      value: "3×",
      label: "plus de clients gérés par consultant avec une rigueur statistique irréprochable",
      labelEn: "more client accounts managed per strategist with auditable empirical rigor",
    },
    pains: {
      title: "Des heures perdues à refaire les mêmes audits et rapports manuels",
      titleEn: "Hours burned on repetitive manual audits and static slide decks",
      description: "Passer des jours à crawler des sites clients, monter des présentations PowerPoint qui prennent la poussière et justifier chaque euro dépensé épuise les équipes d'agence.",
      descriptionEn: "Spending days manually auditing client websites, assembling obsolete slide decks, and defending attribution drains agency margins.",
      items: [
        "Rapports mensuels statiques que les clients ne lisent jamais",
        "Difficulté à prouver la valeur exacte apportée au chiffre d'affaires",
        "Temps considérable passé sur l'extraction manuelle des données concurrentielles",
      ],
      itemsEn: [
        "Static monthly slide reports that clients barely glance at",
        "Friction proving true incremental ARR impact to skeptical founders",
        "Laborious manual hours spent auditing competitive landing pages",
      ],
    },
    playbook: {
      title: "L'agence IA-native nouvelle génération",
      titleEn: "The AI-Native Growth Agency Model",
      description: "Délivrez des audits en 5 minutes et pilotez des expérimentations en continu.",
      descriptionEn: "Deliver comprehensive client audits in 5 minutes and run high-velocity sprints.",
      steps: [
        {
          step: "understand",
          label: "Audit instantané de l'URL client",
          labelEn: "Instant Client URL Ingestion",
          detail: "Kaya génère en 2 minutes la cartographie ICP, les concurrents et le score de fit canal.",
          detailEn: "Kaya maps the client's ICP, competitor matrix, and channel fit scores in 2 minutes.",
        },
        {
          step: "decide",
          label: "Proposition de feuille de route sur 90 jours",
          labelEn: "90-Day Living Growth Roadmap",
          detail: "Une stratégie vivante partagée avec le client, synchronisée avec ses données Stripe.",
          detailEn: "A living strategy shared with the client, directly wired to their Stripe analytics.",
        },
        {
          step: "experiment",
          label: "Exécution des sprints avec validation client",
          labelEn: "Sprint Execution with Client Sign-off",
          detail: "Le client valide les budgets et les créations depuis son propre portail d'approbation.",
          detailEn: "Clients review and sign off on budgets and copy in their branded approval portal.",
        },
        {
          step: "learn",
          label: "Rapports d'attribution sans contestation",
          labelEn: "Indisputable Attribution Proof",
          detail: "Les clients constatent en temps réel le revenu net généré par chaque expérience.",
          detailEn: "Clients monitor verified incremental revenue tied straight to bank settlements.",
        },
      ],
    },
    recommendedIntegrations: ["Stripe", "Slack", "PostHog", "Google Ads"],
    mockData: {
      title: "Tableau de bord Agence · 12 Espaces Clients",
      tag: "Multi-tenant · Espace Partenaire",
      status: "Accès anticipé",
      items: [
        { label: "Clients actifs", value: "12 SaaS B2B suivis" },
        { label: "Temps moyen d'onboarding client", value: "Passé de 2 semaines à 45 minutes" },
        { label: "Expériences actives globales", value: "48 tests en cours simultanément" },
        { label: "Taux de rétention agence", value: "96 % grâce aux rapports d'attribution transparents" },
      ],
      actionLabel: "Postuler au programme Partenaire Agence",
    },
    faqs: [
      {
        q: "L'espace Agence sera-t-il disponible en marque blanche ?",
        qEn: "Will the agency workspace support white-label branding?",
        a: "Oui, le programme Partenaire Agence prévoit la possibilité de personnaliser le portail client avec votre logo et vos couleurs.",
        aEn: "Yes, our agency partner tier includes custom domains and white-label client portal branding.",
      },
    ],
  },
];

export function getSolutionBySlug(slug: string): SolutionItem | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
