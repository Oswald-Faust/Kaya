import {
  Coins,
  FileText,
  FlaskConical,
  Mail,
  Megaphone,
  MessagesSquare,
  Repeat,
  Rocket,
  Search,
  Sprout,
  TrendingDown,
  TrendingUp,
  ChartLine,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/marketing/nav-data";

export interface UseCaseItem {
  id: string;
  slug: string;
  category: "getCustomers" | "growWhatYouHave";
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
  problem: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    bullets: string[];
    bulletsEn: string[];
  };
  solution: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    features: { title: string; titleEn: string; desc: string; descEn: string }[];
  };
  loopSteps: {
    step: "understand" | "decide" | "experiment" | "control" | "learn" | "measure";
    label: string;
    labelEn: string;
    desc: string;
    descEn: string;
  }[];
  mockData: {
    title: string;
    tag: string;
    status: string;
    items: { label: string; value: string; hint?: string }[];
    actionLabel: string;
  };
  guardrails: {
    policy: string;
    policyEn: string;
    detail: string;
    detailEn: string;
  }[];
  faqs: {
    q: string;
    qEn: string;
    a: string;
    aEn: string;
  }[];
}

export const USE_CASES: UseCaseItem[] = [
  {
    id: "yourFirst100Customers",
    slug: "first-100-customers",
    category: "getCustomers",
    tone: "grass",
    spot: "understand",
    icon: Sprout,
    title: "Trouver vos 100 premiers clients sans brûler de budget pub",
    titleEn: "Get your first 100 customers without burning ad budget",
    eyebrow: "Phase 0 → 1",
    eyebrowEn: "0 → 1 Phase",
    kicker: "Acquisition initiale",
    kickerEn: "Initial Acquisition",
    lead: "Kaya explore votre produit en profondeur, identifie votre profil de client idéal le plus réceptif et lance les premières actions d'acquisition à coût zéro.",
    leadEn: "Kaya deeply analyzes your product, pinpoints your highest-converting buyer persona, and rolls out zero-cost initial acquisition plays.",
    badge: "0$ de budget média requis",
    badgeEn: "Zero ad spend required",
    stat: {
      value: "31 %",
      label: "de conversion essai-à-payant constatée sur les premiers cohortes",
      labelEn: "trial-to-paid conversion observed on initial cohorts",
    },
    problem: {
      title: "Le piège du démarrage : tester tout et n'importe quoi à l'aveugle",
      titleEn: "The startup trap: testing everything blindly",
      description: "Quand on n'a pas encore de réputation ni de budget, dépenser sur Google Ads ou spammer LinkedIn ne produit que du bruit et du découragement.",
      descriptionEn: "When you lack brand equity and budget, running blind Google ads or spamming LinkedIn only brings noise and burnout.",
      bullets: [
        "Incertitude complète sur le canal qui convertit le mieux",
        "Budgets gaspillés sur des mots-clés trop larges et non qualifiés",
        "Discours produit trop générique qui ne résonne auprès de personne",
      ],
      bulletsEn: [
        "Complete uncertainty on which acquisition channel converts",
        "Wasted budget on broad, unqualified keywords",
        "Generic messaging that fails to resonate with core buyers",
      ],
    },
    solution: {
      title: "L'approche Kaya : un angle aiguisé fondé sur vos faits réels",
      titleEn: "The Kaya approach: razor-sharp positioning grounded in your facts",
      description: "En explorant votre site web et vos intégrations, Kaya extrait les arguments concrets qui font convertir vos visiteurs, et priorise 3 leviers organiques.",
      descriptionEn: "By scanning your live site and integrations, Kaya extracts the tangible facts that convert, prioritizing 3 high-signal organic levers.",
      features: [
        {
          title: "Extraction automatique de l'ICP",
          titleEn: "Automated ICP Extraction",
          desc: "Détection des douleurs réelles, des déclencheurs d'achat et des objections fréquentes.",
          descEn: "Detects real pain points, purchase triggers, and recurring objections directly from product signals.",
        },
        {
          title: "Pages comparatives de niche",
          titleEn: "Niche Comparison Pages",
          desc: "Génération de pages comparatives honnêtes qui ciblent les acheteurs en phase de décision.",
          descEn: "Generates honest, grounded comparison pages targeting high-intent buyers seeking alternatives.",
        },
        {
          title: "Préparation de lancements communautaires",
          titleEn: "Community Launch Playbooks",
          desc: "Drafts sur mesure pour Hacker News Show HN ou Product Hunt, sans artifice marketing.",
          descEn: "Tailored Show HN and Product Hunt release drafts written with engineer-friendly honesty.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Crawl & Découverte",
        labelEn: "Crawl & Discovery",
        desc: "Kaya analyse votre application, votre modèle tarifaire et vos concurrents directs.",
        descEn: "Kaya crawls your web presence, pricing tiers, and direct competitive landscape.",
      },
      {
        step: "decide",
        label: "Score d'adéquation canal",
        labelEn: "Channel Fit Scoring",
        desc: "Score de 0 à 100 pour chaque canal : seuls les leviers à rentabilité immédiate sont retenus.",
        descEn: "Scores channels 0–100: only high-probability, immediate-return channels are prioritized.",
      },
      {
        step: "experiment",
        label: "Lancement de 3 micro-tests",
        labelEn: "3 Targeted Micro-Tests",
        desc: "Pages d'atterrissage ciblées, posts communautaires et accroches testées en parallèle.",
        descEn: "Concurrent targeted landing pages, community posts, and value props tested with strict bounds.",
      },
      {
        step: "measure",
        label: "Analyse des inscriptions",
        labelEn: "Signup Cohort Analysis",
        desc: "Mesure de l'activation réelle et élimination des canaux qui attirent des curieux.",
        descEn: "Measures real activation, pruning channels that only bring unqualified tire-kickers.",
      },
    ],
    mockData: {
      title: "Plan d'acquisition · Premiers 100 clients",
      tag: "Canaux organiques · R0",
      status: "3 expériences actives",
      items: [
        { label: "ICP Principal", value: "Lead Backend SaaS (5-50 employés)", hint: "Confiance 88%" },
        { label: "Canal Recommandé", value: "Show HN + Page alternative dédiée", hint: "Score Fit: 84/100" },
        { label: "Canal à éviter", value: "Meta Ads (trop cher pour la phase 0)", hint: "Recommandé de reporter" },
        { label: "Budget Requis", value: "0 € en médias payants", hint: "100% organique" },
      ],
      actionLabel: "Activer le plan 100 clients",
    },
    guardrails: [
      {
        policy: "Politique 0 € média",
        policyEn: "Zero-Ad Spend Policy",
        detail: "Aucune dépense publicitaire n'est engagée tant que le taux d'activation n'est pas mesuré.",
        detailEn: "No ad spend is ever initiated before baseline product activation is verified.",
      },
      {
        policy: "Validation manuelle obligatoire",
        policyEn: "Mandatory Founder Approval",
        detail: "Toutes les publications publiques nécessitent votre clic de confirmation.",
        detailEn: "All public-facing copy and launch drafts require explicit founder sign-off.",
      },
    ],
    faqs: [
      {
        q: "Combien de temps faut-il pour voir les premiers résultats ?",
        qEn: "How long does it take to see initial traction?",
        a: "Kaya structure vos premiers tests dès les 48 premières heures. Les premières inscriptions qualifiées arrivent généralement dès la première semaine de diffusion.",
        aEn: "Kaya structures initial tests within 48 hours. Qualified signups typically follow within the first week of deployment.",
      },
      {
        q: "Faut-il avoir déjà des utilisateurs ?",
        qEn: "Do I need existing users before using this?",
        a: "Non, ce cas d'usage est spécifiquement conçu pour les fondateurs partant de zéro utilisateur ou de leur première dizaine d'amis testeurs.",
        aEn: "No, this use case is engineered specifically for founders starting with zero users or just a handful of early beta testers.",
      },
    ],
  },
  {
    id: "launchOnHnProductHunt",
    slug: "launch-hn-product-hunt",
    category: "getCustomers",
    tone: "tangerine",
    spot: "experiment",
    icon: Rocket,
    title: "Réussir son lancement sur Hacker News & Product Hunt",
    titleEn: "Nail your Hacker News & Product Hunt launches",
    eyebrow: "Lancement Communautaire",
    eyebrowEn: "Community Launches",
    kicker: "Distribution organique",
    kickerEn: "Organic Distribution",
    lead: "Préparez un lancement Show HN sincère et une campagne Product Hunt sans hype artificielle, calibrés pour séduire les développeurs exigeants.",
    leadEn: "Craft an authentic Show HN and Product Hunt debut without synthetic hype, tailored specifically for discerning engineers and builders.",
    badge: "Rédaction sans jargon",
    badgeEn: "Zero fluff copywriting",
    stat: {
      value: "4.8×",
      label: "plus de discussions techniques qualifiées qu'un post marketing générique",
      labelEn: "more qualified technical feedback than generic marketing posts",
    },
    problem: {
      title: "La communauté rejette instantanément le jargon corporate",
      titleEn: "Tech communities instinctively reject corporate buzzwords",
      description: "Sur Hacker News ou Reddit, la moindre formulation creuse comme 'la solution IA révolutionnaire' se traduit par un vote négatif ou le silence complet.",
      descriptionEn: "On HN and tech subreddits, hollow marketing claims like 'the revolutionary AI platform' lead straight to downvotes or immediate indifference.",
      bullets: [
        "Titres trop sensationnels qui provoquent le rejet",
        "Absence de détails d'architecture ou de stack technique",
        "Incapacité à répondre avec précision aux objections des développeurs",
      ],
      bulletsEn: [
        "Sensational headlines that trigger cynical downvotes",
        "Absence of concrete architecture or stack transparency",
        "Inability to handle sharp technical objections swiftly",
      ],
    },
    solution: {
      title: "Des textes ancrés dans votre code et vos choix d'ingénierie",
      titleEn: "Copy anchored directly in your code and engineering decisions",
      description: "Kaya analyse vos dépôts, votre documentation technique et formule une histoire 'Show HN' transparente sur les compromis et les choix techniques.",
      descriptionEn: "Kaya parses your technical docs and crafts a transparent 'Show HN' narrative explaining why you built it and the trade-offs you chose.",
      features: [
        {
          title: "Brouillons Show HN honnêtes",
          titleEn: "Honest Show HN Drafts",
          desc: "Mise en avant du problème concret résolu, des limites actuelles et de l'architecture.",
          descEn: "Focuses on the exact engineering problem solved, known trade-offs, and technical rationale.",
        },
        {
          title: "Checklist timing & premier commentaire",
          titleEn: "Launch Timing & First Comment Checklist",
          desc: "Kaya génère le premier commentaire fondateur avec FAQ d'anticipation des questions clés.",
          descEn: "Prepares the founder's initial comment addressing the obvious questions before they are asked.",
        },
        {
          title: "Kit média Product Hunt prêt à l'emploi",
          titleEn: "Ready-to-use Product Hunt Asset Kit",
          desc: "Screenshots annotés, vidéo de démo produit sans fioritures et proposition de valeur en 60 caractères.",
          descEn: "Annotated UI crops, crisp product demo walkthroughs, and a 60-character tagline that hits.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Extraction des détails d'ingénierie",
        labelEn: "Engineering Deep Dive",
        desc: "Kaya extrait la proposition de valeur technique unique et les technologies sous-jacentes.",
        descEn: "Extracts your technical differentiation and architectural choices directly from your docs.",
      },
      {
        step: "decide",
        label: "Angle d'attaque communautaire",
        labelEn: "Community Angle Formulation",
        desc: "Définition du titre : 'Show HN: We built X because Y was frustrating'.",
        descEn: "Frames the title: 'Show HN: We built X because Y was frustrating' without buzzwords.",
      },
      {
        step: "experiment",
        label: "Relecture & simulation d'objections",
        labelEn: "Objection Simulation",
        desc: "Kaya simule les 5 questions les plus critiques que la communauté va poser.",
        descEn: "Simulates the 5 toughest critiques the community is likely to raise on day one.",
      },
      {
        step: "control",
        label: "Feu vert fondateur",
        labelEn: "Founder Green Light",
        desc: "Vous validez le texte final et copiez-collez votre lancement au moment optimal.",
        descEn: "You review and copy-paste the finalized text at the optimal time window.",
      },
    ],
    mockData: {
      title: "Brouillon Show HN · Prêt pour validation",
      tag: "Hacker News · R1 Approbation",
      status: "Prêt à publier",
      items: [
        { label: "Titre proposé", value: "Show HN: Kaya – The AI Agent That Does Your Marketing" },
        { label: "Angle principal", value: "Transparence totale : règles strictes, formules de stats affichées" },
        { label: "Points d'attention", value: "Bien mentionner que les modèles ne remplacent pas les garde-fous" },
        { label: "Validation", value: "En attente de votre approbation", hint: "Requis" },
      ],
      actionLabel: "Approuver et copier le texte",
    },
    guardrails: [
      {
        policy: "Interdiction de manipulation de votes",
        policyEn: "Zero Vote-Manipulation Guarantee",
        detail: "Kaya respecte scrupuleusement les conditions d'utilisation des plateformes et interdit l'astroturfing.",
        detailEn: "Strict adherence to platform terms: zero botting, zero artificial upvoting, 100% organic.",
      },
    ],
    faqs: [
      {
        q: "Kaya publie-t-il automatiquement sur mon compte Hacker News ?",
        qEn: "Does Kaya post directly to my HN account?",
        a: "Non. Pour des raisons d'authenticité et de sécurité, Kaya génère les textes et vous donne le contrôle total pour soumettre le post depuis votre propre compte.",
        aEn: "No. For authenticity and account safety, Kaya drafts the launch and leaves the actual submission to you.",
      },
    ],
  },
  {
    id: "winComparisonSearches",
    slug: "comparison-searches",
    category: "getCustomers",
    tone: "blue",
    spot: "understand",
    icon: Search,
    title: "Gagner les recherches comparatives (vs Concurrents)",
    titleEn: "Win high-intent competitor comparison searches",
    eyebrow: "SEO d'intention d'achat",
    eyebrowEn: "High-Intent SEO",
    kicker: "Pages comparatives",
    kickerEn: "Comparison Pages",
    lead: "Captez les acheteurs au moment précis où ils comparent vos concurrents, grâce à des pages alternatives objectives, précises et sans superlatifs creux.",
    leadEn: "Capture prospects right when they evaluate competitors with fair, fact-based alternative and comparison pages.",
    badge: "1ère source de conversion SaaS",
    badgeEn: "#1 Converting SaaS SEO Play",
    stat: {
      value: "3.2×",
      label: "taux de conversion supérieur aux pages de blog informatives",
      labelEn: "higher conversion rate than standard informational blog posts",
    },
    problem: {
      title: "Vos concurrents captent les clients qui cherchent pourtant une alternative",
      titleEn: "Your competitors win buyers who are actively seeking alternatives",
      description: "Des centaines de personnes cherchent chaque mois 'Alternative à [Concurrent]'. Si vous n'avez pas de page dédiée, ils choisissent un autre acteur établi.",
      descriptionEn: "Hundreds of buyers search 'Alternative to [Competitor]' every month. Without a dedicated page, they end up with another legacy incumbent.",
      bullets: [
        "Trafic SEO informationnel à fort volume mais conversion quasi nulle",
        "Pages comparatives concurrentes biaisées qui manquent de crédibilité",
        "Temps considérable requis pour analyser manuellement chaque grille de prix concurrente",
      ],
      bulletsEn: [
        "Informational SEO traffic brings pageviews but near-zero signups",
        "Competitor comparison pages often feel biased and lack trust",
        "Hours spent manually tracking competitors' changing price points",
      ],
    },
    solution: {
      title: "Des matrices comparatives générées sur des faits vérifiés",
      titleEn: "Fact-checked comparative matrices built automatically",
      description: "Kaya extrait les forces, faiblesses et tarifs de vos concurrents, et met en valeur votre wedge unique avec honnêteté intellectuelle.",
      descriptionEn: "Kaya maps competitor strengths, pricing, and caveats, highlighting your wedge with complete factual accuracy.",
      features: [
        {
          title: "Détection des wedges concurrentiels",
          titleEn: "Competitive Wedge Discovery",
          desc: "Identification du critère différenciant où vous gagnez systématiquement le switch.",
          descEn: "Pinpoints the exact feature or pricing wedge where you reliably win the switch.",
        },
        {
          title: "Mise à jour continue des grilles tarifaires",
          titleEn: "Live Competitor Pricing Matrices",
          desc: "Kaya vérifie que les prix et fonctionnalités comparés restent exacts.",
          descEn: "Continuously checks that compared competitor plans and tiers remain accurate.",
        },
        {
          title: "Structure SEO schema.org prête pour Google",
          titleEn: "Turnkey Schema.org SEO Structure",
          desc: "Balisage structuré pour faire ressortir votre page dans les résultats de recherche.",
          descEn: "Full rich-snippet schema markup to stand out on Google comparison search results.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Cartographie des concurrents",
        labelEn: "Competitor Landscape Mapping",
        desc: "Identification des 3 à 5 acteurs les plus fréquemment cités par vos prospects.",
        descEn: "Identifies the 3 to 5 players most frequently mentioned by your prospective buyers.",
      },
      {
        step: "decide",
        label: "Angle d'attaque par concurrent",
        labelEn: "Per-Competitor Wedge Strategy",
        desc: "Exemple : 'Pour les équipes backend qui veulent une alerte dès qu'un cron ne démarre pas'.",
        descEn: "E.g. 'For backend teams who need alerts when a scheduled job fails to even start'.",
      },
      {
        step: "experiment",
        label: "Publication de la page d'atterrissage",
        labelEn: "Landing Page Publication",
        desc: "Génération de la page avec tableau comparatif et citation des sources publiques.",
        descEn: "Deploys the page with verified comparative tables and cited public sources.",
      },
      {
        step: "measure",
        label: "Suivi des positions & essais",
        labelEn: "Rank & Conversion Tracking",
        desc: "Kaya mesure le nombre d'inscriptions directement attribuables à chaque page comparative.",
        descEn: "Directly attributes new trial accounts to the specific comparison URL.",
      },
    ],
    mockData: {
      title: "Tableau comparatif · Tickwarden vs Cronitor",
      tag: "SEO Comparatif · R2",
      status: "Publié et indexé",
      items: [
        { label: "Concurrent ciblé", value: "Cronitor (tarifs à partir de 21 $/m)" },
        { label: "Wedge Tickwarden", value: "Tarif d'équipe fixe + alerte de non-démarrage" },
        { label: "Recherches mensuelles", value: "1 400 requêtes d'intention ciblée" },
        { label: "Taux de conversion", value: "8.4 % de visiteur en inscription d'essai" },
      ],
      actionLabel: "Générer une nouvelle page comparative",
    },
    guardrails: [
      {
        policy: "Règle de fair-play et d'exactitude",
        policyEn: "Fair-Play & Truth in Advertising",
        detail: "Interdiction des affirmations non prouvées ou dénigrantes ; reconnaissance explicite des points forts du concurrent.",
        detailEn: "No unsubstantiated claims; explicit recognition of competitors' actual strengths.",
      },
    ],
    faqs: [
      {
        q: "Est-ce légal de citer et comparer ses concurrents ?",
        qEn: "Is comparative marketing legally compliant?",
        a: "Oui, la publicité comparative loyale est légale en Europe et aux États-Unis dès lors qu'elle repose sur des faits vérifiables, objectifs et non trompeurs. Kaya applique ces règles par conception.",
        aEn: "Yes, truthful comparative advertising is fully compliant in the US and EU when based on verifiable, objective facts. Kaya enforces this natively.",
      },
    ],
  },
  {
    id: "scalePaidSearch",
    slug: "scale-paid-search",
    category: "getCustomers",
    tone: "pink",
    spot: "control",
    icon: TrendingUp,
    title: "Scaler le Search payant sous contrôle budgétaire absolu",
    titleEn: "Scale paid search with immutable budget guardrails",
    eyebrow: "Google & Search Ads",
    eyebrowEn: "Google & Search Ads",
    kicker: "Acquisition payante",
    kickerEn: "Paid Acquisition",
    lead: "Déployez et optimisez vos campagnes Google Ads sans jamais dépasser vos plafonds journaliers grâce à un moteur de gouvernance déterministe.",
    leadEn: "Launch and scale high-intent Google search campaigns without ever exceeding daily caps, guarded by deterministic governance.",
    badge: "Plafonds inviolables par code",
    badgeEn: "Hard-coded budget limits",
    stat: {
      value: "-42 %",
      label: "sur le coût par acquisition moyen grâce aux coupures automatiques",
      labelEn: "reduction in blended CAC via automatic low-performing campaign pauses",
    },
    problem: {
      title: "Les algorithmes publicitaires sont conçus pour dépenser votre argent",
      titleEn: "Ad platforms are designed to maximize spend, not your runway",
      description: "Sans surveillance constante, une campagne Google Ads peut engloutir 500 $ en 24h sur des termes de recherche sans rapport avec votre logiciel.",
      descriptionEn: "Without 24/7 monitoring, ad platforms will happily consume $500 overnight on broad match terms completely irrelevant to your SaaS.",
      bullets: [
        "Mots-clés broad match qui attirent des requêtes hors-sujet",
        "Dépassements de budget imprévus le week-end",
        "Difficulté à réconcilier les clics publicitaires avec les vrais paiements Stripe",
      ],
      bulletsEn: [
        "Broad keywords triggering unrelated consumer queries",
        "Uncontrolled weekend budget spikes",
        "Disconnect between ad platform click counts and real Stripe revenue",
      ],
    },
    solution: {
      title: "L'agent autonome bridé par votre politique financière",
      titleEn: "Autonomous execution locked within your financial policy",
      description: "Kaya gère vos enchères, crée des variantes d'annonces et coupe les campagnes non rentables, mais ne peut jamais enfreindre vos plafonds codés en dur.",
      descriptionEn: "Kaya bids, tests ad variants, and prunes underperformers, but is mathematically blocked from exceeding your preset limits.",
      features: [
        {
          title: "Plafonds de dépense quotidiens infranchissables",
          titleEn: "Unbreachable Daily Spend Caps",
          desc: "Vérification cryptographique au moment de chaque appel API vers Google Ads.",
          descEn: "Evaluated and verified at the exact millisecond of every ad platform mutation.",
        },
        {
          title: "Pause automatique des variantes déficitaires",
          titleEn: "Automatic Exposure Reduction",
          desc: "Si le CAC dépasse 2× la cible après 9 jours, la variante est mise en pause sans attendre.",
          descEn: "If CAC exceeds 2× target after statistical window, Kaya pauses the variant automatically.",
        },
        {
          title: "Exclusion continue des termes négatifs",
          titleEn: "Continuous Negative Keyword Pruning",
          desc: "Nettoyage quotidien des termes de recherche pour ne payer que les intentions d'achat.",
          descEn: "Daily negative keyword mining so you never pay twice for irrelevant search queries.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Analyse des termes de recherche",
        labelEn: "Query Intent Analysis",
        desc: "Filtrage des mots-clés : suppression immédiate des requêtes gratuites ou génériques.",
        descEn: "Filters keywords: eliminates 'free' or broad consumer searches instantly.",
      },
      {
        step: "decide",
        label: "Allocation du budget par groupe d'annonces",
        labelEn: "Ad Group Allocation",
        desc: "Exemple : 30 $/jour sur 'monitoring cron' avec cap max à 45 $/jour.",
        descEn: "E.g. $30/day on 'cron job monitoring' with a hard $45/day absolute ceiling.",
      },
      {
        step: "control",
        label: "Validation des augmentations",
        labelEn: "Augmentation Policy Check",
        desc: "Toute hausse de budget supérieure à 20 % nécessite votre clic d'approbation.",
        descEn: "Any budget increase above 20% requires explicit founder confirmation.",
      },
      {
        step: "measure",
        label: "Calcul du ROAS sur données Stripe",
        labelEn: "Real Stripe ROAS Tracking",
        desc: "Kaya calcule le retour sur investissement sur les vrais paiements, pas sur les simples clics.",
        descEn: "Calculates ROAS against confirmed bank settlements, never phantom pixels.",
      },
    ],
    mockData: {
      title: "Demande d'approbation · Google Search Ads",
      tag: "Budget & Gouvernance · R3",
      status: "Validation requise",
      items: [
        { label: "Action demandée", value: "Augmenter Google Search de 30 $ à 45 $/jour" },
        { label: "Justification", value: "CAC actuel de 48 $ pour une valeur vie estimée à 348 $" },
        { label: "Garde-fou 1", value: "Plafond journalier : 45 $ sur 60 $ max autorisés (OK)" },
        { label: "Garde-fou 2", value: "Budget mensuel projeté : 1 180 $ sur 1 500 $ (OK)" },
      ],
      actionLabel: "Approuver l'augmentation de budget",
    },
    guardrails: [
      {
        policy: "Plafond mensuel inviolable",
        policyEn: "Hard Monthly Limit",
        detail: "Même une commande utilisateur ou une erreur de modèle ne peut forcer Kaya à dépasser votre budget mensuel.",
        detailEn: "Neither LLM output nor accidental prompt can bypass the hard database check.",
      },
    ],
    faqs: [
      {
        q: "Kaya peut-il dépenser mon argent sans mon accord ?",
        qEn: "Can Kaya spend money without my approval?",
        a: "Non. Par défaut, Kaya fonctionne en mode 'Copilote' : il prépare les campagnes, calcule les budgets, et attend votre feu vert pour chaque dépense.",
        aEn: "No. By default, Kaya runs in Copilot mode: it structures ads, estimates bids, and waits for your green light.",
      },
    ],
  },
  {
    id: "spendASmallBudgetWell",
    slug: "small-budget",
    category: "growWhatYouHave",
    tone: "sun",
    spot: "decide",
    icon: Coins,
    title: "Bien dépenser un budget marketing modeste (500–1 500 €/m)",
    titleEn: "Make every dollar count on a modest marketing budget ($500–$1,500/mo)",
    eyebrow: "Gestion de Budget",
    eyebrowEn: "Budget Allocation",
    kicker: "Discipline financière",
    kickerEn: "Financial Discipline",
    lead: "Ne diluez pas vos ressources sur six canaux à la fois. Kaya concentre vos euros là où les tests peuvent atteindre une significativité statistique.",
    leadEn: "Stop spreading thin across six channels. Kaya concentrates your cash where experiments can reach true statistical power.",
    badge: "Significativité statistique garantie",
    badgeEn: "Statistical significance first",
    stat: {
      value: "100 %",
      label: "des tests menés atteignent le seuil d'apprentissage requis",
      labelEn: "of executed tests reach actionable statistical confidence",
    },
    problem: {
      title: "La dilution budgétaire : le pire ennemi des startups amorcées",
      titleEn: "Budget dilution: the #1 killer of bootstrapped growth",
      description: "Mettre 100 $ sur Facebook, 100 $ sur LinkedIn, 100 $ sur Twitter et 100 $ sur Google ne produit aucun résultat exploitable : les échantillons sont trop faibles pour apprendre.",
      descriptionEn: "Putting $100 on Meta, $100 on LinkedIn, and $100 on Google yields zero statistical learnings—just fragmented waste.",
      bullets: [
        "Trop de canaux activés avec des montants insuffisants pour sortir de la phase d'apprentissage",
        "Aucune certitude sur la cause réelle d'un succès ou d'un échec",
        "Absence de réserve financière pour réagir aux opportunités",
      ],
      bulletsEn: [
        "Too many channels with insufficient sample size to exit platform learning phases",
        "No clarity on whether failure was tactical or fundamental",
        "Zero reserve held for scaling winning signals",
      ],
    },
    solution: {
      title: "Allocation ciblée avec réserve d'opportunité",
      titleEn: "Focused allocation with an explicit opportunity reserve",
      description: "Kaya impose un montant minimal par test pour garantir un apprentissage fiable, et conserve toujours une réserve de 20 % pour accélérer sur les gagnants.",
      descriptionEn: "Kaya enforces minimum budget thresholds per experiment to guarantee conclusive data, keeping 20% in reserve for winners.",
      features: [
        {
          title: "Calculateur de puissance statistique",
          titleEn: "Statistical Power Calculator",
          desc: "Kaya refuse d'allouer un budget si le volume de clics projeté est trop faible pour conclure.",
          descEn: "Rejects experiments whose projected click sample size is too weak to detect a real lift.",
        },
        {
          title: "Matrice d'allocation dynamique",
          titleEn: "Dynamic Budget Matrix",
          desc: "Concentration des fonds sur un seul canal payant + un levier de contenu organique.",
          descEn: "Allocates 80% to 1 paid channel + 1 organic content pillar, holding 20% in dry powder.",
        },
        {
          title: "Protection contre les hausses impulsives",
          titleEn: "Impulse Protection Guardrails",
          desc: "Plafonnement des augmentations de budget pour éviter les phases d'emballement algorithmique.",
          descEn: "Limits pacing spikes so ad platform algorithms don't burn extra budget inefficiently.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Audit du runway & des objectifs",
        labelEn: "Runway & Goal Audit",
        desc: "Kaya prend en compte votre budget total disponible et votre coût d'acquisition cible.",
        descEn: "Ingests your monthly marketing runway and target customer acquisition cost.",
      },
      {
        step: "decide",
        label: "Sélection des 2 seuls canaux éligibles",
        labelEn: "2-Channel Concentration",
        desc: "Élimination des canaux trop chers (ex: LinkedIn Ads à 12 $ le clic éliminé au profit de Search).",
        descEn: "Disqualifies cost-prohibitive channels (e.g. $12 CPC LinkedIn ads) in favor of high-intent search.",
      },
      {
        step: "experiment",
        label: "Exécution rythmée sur 30 jours",
        labelEn: "30-Day Paced Testing",
        desc: "Dépenses réparties uniformément pour éviter l'épuisement prématuré de votre trésorerie.",
        descEn: "Distributes spend smoothly to prevent premature budget exhaustion early in the month.",
      },
      {
        step: "learn",
        label: "Rapport de rentabilité par euro dépensé",
        labelEn: "Learnings per Euro Spent",
        desc: "Chaque euro dépensé produit soit un client payant, soit une règle d'exclusion définitive.",
        descEn: "Every dollar spent yields either paying accounts or an explicit suppression rule.",
      },
    ],
    mockData: {
      title: "Plan d'allocation budgétaire · Ce mois-ci",
      tag: "Trésorerie · 1 000 €/m",
      status: "Optimisé",
      items: [
        { label: "Google Search (intention)", value: "500 €", hint: "Financé · seuil atteint" },
        { label: "Création pages SEO", value: "300 €", hint: "Financé · 3 pages" },
        { label: "Réserve opportunité", value: "200 €", hint: "Conservé pour variantes gagnantes" },
        { label: "LinkedIn Ads", value: "0 €", hint: "Rejeté : budget min 1 500 € requis" },
      ],
      actionLabel: "Appliquer la répartition budgétaire",
    },
    guardrails: [
      {
        policy: "Règle de non-dispersion",
        policyEn: "Anti-Fragmentation Policy",
        detail: "Kaya bloque la création de plus de 2 expériences payantes simultanées sous 1 000 €/mois de budget.",
        detailEn: "Blocks creating more than 2 concurrent paid experiments when monthly budget is under $1,000.",
      },
    ],
    faqs: [
      {
        q: "Quel est le budget mensuel minimum conseillé pour démarrer ?",
        qEn: "What is the recommended minimum monthly budget?",
        a: "Vous pouvez démarrer avec 0 € en utilisant uniquement les cas d'usage organiques (SEO, communauté). Si vous souhaitez faire du search payant, nous conseillons un minimum de 300 €/mois.",
        aEn: "You can start at $0 using organic plays. For paid search experiments, we recommend a minimum of $300/mo.",
      },
    ],
  },
  {
    id: "turnTrialsIntoCustomers",
    slug: "turn-trials-into-customers",
    category: "growWhatYouHave",
    tone: "lilac",
    spot: "experiment",
    icon: Repeat,
    title: "Convertir les inscriptions d'essai en clients payants",
    titleEn: "Turn free trials into paying subscribers",
    eyebrow: "Activation & Lifecycle",
    eyebrowEn: "Activation & Lifecycle",
    kicker: "Conversion produit",
    kickerEn: "Product Conversion",
    lead: "Les emails d'onboarding basés sur le temps ne fonctionnent plus. Kaya réagit aux actions réelles des utilisateurs pour les amener au moment 'Aha'.",
    leadEn: "Time-based drip emails are dead. Kaya monitors in-app milestones to trigger timely guidance right when users get stuck.",
    badge: "+34 % d'activation produit",
    badgeEn: "+34% Activation Rate",
    stat: {
      value: "2.1×",
      label: "plus de conversions quand l'email répond à un blocage réel de l'utilisateur",
      labelEn: "lift in conversion when emails directly address user in-app bottlenecks",
    },
    problem: {
      title: "La plupart des utilisateurs d'essai abandonnent sans avoir testé votre valeur",
      titleEn: "Most trial users abandon before ever experiencing your core value",
      description: "Envoyer un email générique à J+1, J+3 et J+7 agace vos utilisateurs s'ils n'ont pas encore configuré leur compte ou s'ils sont bloqués sur une intégration.",
      descriptionEn: "Sending generic Day 1, Day 3, and Day 7 emails annoys users when they are stuck on technical setup.",
      bullets: [
        "Séquences d'emails déconnectées de l'activité réelle de l'utilisateur",
        "Aucune relance ciblée sur l'étape critique d'activation manquée",
        "Offres de remise génériques envoyées à des utilisateurs déjà convaincus",
      ],
      bulletsEn: [
        "Drip emails oblivious to actual in-app telemetry",
        "Zero follow-up on the specific drop-off step",
        "Discounts sprayed blindly at prospects already willing to pay full price",
      ],
    },
    solution: {
      title: "Des déclencheurs comportementaux synchronisés avec votre produit",
      titleEn: "Event-driven lifecycle sequences mapped to your core funnel",
      description: "Kaya écoute les événements de votre application et envoie des messages utiles, concis et contextuels pour lever chaque point de friction.",
      descriptionEn: "Kaya monitors product telemetry and sends concise, helpful intervention emails to unblock each user.",
      features: [
        {
          title: "Identification du jalon d'activation",
          titleEn: "Aha Moment Discovery",
          desc: "Détection statistique de l'action qui prédit 80 % de la rétention à long terme.",
          descEn: "Pinpoints the exact setup milestone that predicts 80%+ long-term retention.",
        },
        {
          title: "Emails événementiels réactifs",
          titleEn: "Behavioral Trigger Sequences",
          desc: "Relance personnalisée si l'utilisateur n'a pas créé son premier projet après 48h.",
          descEn: "Contextual nudge if a user signs up but fails to create their first monitor within 48h.",
        },
        {
          title: "Proposition de passage au forfait payant au bon moment",
          titleEn: "Well-Timed Upgrade Prompts",
          desc: "Notification ciblée quand le quota d'essai est sur le point d'être atteint.",
          descEn: "Timely prompt when the user's trial limit is approached with high engagement.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Cartographie du tunnel d'activation",
        labelEn: "Funnel Drop-off Mapping",
        desc: "Kaya analyse les points d'abandon entre l'inscription et le premier usage réel.",
        descEn: "Maps where signups abandon between signup and first core usage.",
      },
      {
        step: "decide",
        label: "Stratégie de messages comportementaux",
        labelEn: "Lifecycle Messaging Policy",
        desc: "Définition de 3 déclencheurs majeurs : blocage technique, succès initial, fin d'essai.",
        descEn: "Sets 3 key triggers: technical blocker, initial value realized, trial expiry.",
      },
      {
        step: "experiment",
        label: "Test de variantes de relance",
        labelEn: "Subject & Tone Testing",
        desc: "Comparaison entre emails courts de fondateur vs tutoriels pas à pas.",
        descEn: "A/B tests personal founder plain-text notes vs interactive visual step guides.",
      },
      {
        step: "measure",
        label: "Suivi du taux de conversion essai-à-payant",
        labelEn: "Trial-to-Paid Reconciliation",
        desc: "Mesure de l'impact net sur le MRR et ajustement continu des messages.",
        descEn: "Directly calculates incremental MRR generated from triggered lifecycle emails.",
      },
    ],
    mockData: {
      title: "Séquence Lifecycle · Déclencheur Comportemental",
      tag: "Lifecycle Email · R2",
      status: "Actif",
      items: [
        { label: "Déclencheur", value: "Compte créé sans moniteur après 48h" },
        { label: "Objet de l'email", value: "Besoin d'un coup de main pour configurer votre premier job ?" },
        { label: "Taux d'ouverture", value: "68 % (expéditeur : fondateur)" },
        { label: "Taux de réactivation", value: "24 % reprennent la configuration" },
      ],
      actionLabel: "Configurer les déclencheurs lifecycle",
    },
    guardrails: [
      {
        policy: "Garde-fou anti-fatigue",
        policyEn: "Frequency Cap Guardrail",
        detail: "Kaya n'envoie jamais plus d'un email tous les 3 jours au même utilisateur.",
        detailEn: "Strict frequency ceiling: no user receives more than 1 lifecycle email per 3-day window.",
      },
    ],
    faqs: [
      {
        q: "Comment Kaya se connecte-t-il à mon produit ?",
        qEn: "How does Kaya hook into my product data?",
        a: "Via notre intégration webhook simple ou via vos outils d'analytics existants (PostHog, Segment, Stripe).",
        aEn: "Through lightweight webhooks or standard adapters to PostHog, Segment, and Stripe.",
      },
    ],
  },
  {
    id: "diagnoseASignupsDrop",
    slug: "diagnose-signups-drop",
    category: "growWhatYouHave",
    tone: "tangerine",
    spot: "learn",
    icon: TrendingDown,
    title: "Diagnostiquer et inverser une baisse soudaine d'inscriptions",
    titleEn: "Diagnose and reverse sudden signup drops",
    eyebrow: "Monitoring & Diagnostic",
    eyebrowEn: "Monitoring & Diagnosis",
    kicker: "Intelligence de crise",
    kickerEn: "Crisis Intelligence",
    lead: "Vos inscriptions ont chuté de 30 % cette semaine ? Kaya croise vos sources de trafic, vos taux de conversion par page et vos modifications récentes pour isoler la cause exacte.",
    leadEn: "Signups dropped 30% this week? Kaya cross-references traffic cohorts, page-level conversion, and recent deploys to isolate the culprit.",
    badge: "Diagnostic en moins de 15 minutes",
    badgeEn: "15-Minute Diagnosis",
    stat: {
      value: "< 15 min",
      label: "pour identifier l'origine exacte d'une rupture de conversion",
      labelEn: "to locate the root cause of conversion funnel breakdowns",
    },
    problem: {
      title: "La panique du tableau de bord sans explication",
      titleEn: "Dashboard panic without actionable explanation",
      description: "Constater une chute de conversion sur Google Analytics sans savoir si c'est un problème technique, un changement d'algorithme ou une concurrence accrue fait perdre des journées entières.",
      descriptionEn: "Staring at a red chart without knowing if it's a broken form, an SEO penalty, or competitor action causes days of paralyzed debate.",
      bullets: [
        "Hypothèses contradictoires dans l'équipe",
        "Changements précipités qui aggravent la situation",
        "Retard dans la détection des pannes de formulaires d'inscription",
      ],
      bulletsEn: [
        "Conflicting theories among founders and team",
        "Hasty website tweaks that introduce further regressions",
        "Silent signup form breakage discovered days late",
      ],
    },
    solution: {
      title: "Analyse causale automatisée et plan de secours immédiat",
      titleEn: "Automated root-cause analysis and immediate remediation",
      description: "Kaya analyse vos logs, compare les performances cohorte par cohorte et vous délivre un diagnostic chiffré sans hypothèses gratuites.",
      descriptionEn: "Kaya decomposes traffic by landing page, device, and referrer, surfacing the exact point of divergence.",
      features: [
        {
          title: "Détection des anomalies de formulaire",
          titleEn: "Form & Auth Health Checks",
          desc: "Vérification continue des parcours d'authentification et de paiement.",
          descEn: "Validates that authentication, OAuth providers, and checkout flows respond cleanly.",
        },
        {
          title: "Décomposition par canal et appareil",
          titleEn: "Cohort & Device Segmentation",
          desc: "Isolement du problème : est-ce réservé aux utilisateurs mobiles ou à un canal spécifique ?",
          descEn: "Isolates the drop: is it limited to Safari mobile, organic search, or a specific region?",
        },
        {
          title: "Daily Growth Brief d'alerte",
          titleEn: "Daily Growth Alert Brief",
          desc: "Notification proactive le lundi matin avec la cause identifiée et l'action corrective.",
          descEn: "Proactive alert with verified cause and pre-staged corrective experiments.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Détection de l'écart statistique",
        labelEn: "Anomaly Detection",
        desc: "Kaya repère toute déviation anormale par rapport aux moyennes des 4 dernières semaines.",
        descEn: "Flags anomalies that deviate statistically from 4-week rolling baselines.",
      },
      {
        step: "decide",
        label: "Élimination des faux positifs",
        labelEn: "Hypothesis Elimination",
        desc: "Vérification de la saisonnalité (jours fériés, week-ends) avant de sonner l'alarme.",
        descEn: "Accounts for seasonality, holidays, and external platform outages first.",
      },
      {
        step: "experiment",
        label: "Test de remédiation ciblé",
        labelEn: "Remediation Experiment",
        desc: "Restauration d'une version de page validée ou réactivation du canal prioritaire.",
        descEn: "Rolls back ungrounded copy changes or re-allocates budget to proven baseline channels.",
      },
      {
        step: "learn",
        label: "Enregistrement dans la mémoire d'entreprise",
        labelEn: "Business Memory Update",
        desc: "L'apprentissage est archivé pour que l'agent prévienne la récurrence de l'erreur.",
        descEn: "Codifies the incident in business memory so future strategies avoid the same pitfall.",
      },
    ],
    mockData: {
      title: "Diagnostic de crise · Baisse de 28 % des inscriptions",
      tag: "Audit Causal · R0",
      status: "Résolu",
      items: [
        { label: "Constat", value: "Baisse de 28 % sur 5 jours glissants" },
        { label: "Cause racine", value: "Le bouton OAuth Google sur Safari Mobile renvoyait une 500" },
        { label: "Canal épargné", value: "Desktop et Chrome inchangés (+2 %)" },
        { label: "Recommandation", value: "Correctif déployé · Retour au volume nominal sous 24h" },
      ],
      actionLabel: "Voir le rapport de diagnostic complet",
    },
    guardrails: [
      {
        policy: "Alerte sans panique",
        policyEn: "Calm Observability",
        detail: "Kaya n'envoie d'alerte que si la baisse est statistiquement significative (> 2 écarts-types).",
        detailEn: "Alerts trigger only on statistically significant deviations (> 2 standard deviations).",
      },
    ],
    faqs: [
      {
        q: "Comment Kaya fait-il la différence entre une anomalie et un simple week-end calme ?",
        qEn: "How does Kaya separate random weekend dips from real issues?",
        a: "Kaya compare vos métriques jour par jour par rapport aux mêmes jours des semaines précédentes, éliminant ainsi les variations hebdomadaires normales.",
        aEn: "Kaya compares day-of-week cohorts against 4-week baselines, filtering out normal weekend drops.",
      },
    ],
  },
  {
    id: "knowWhatDroveRevenue",
    slug: "revenue-attribution",
    category: "growWhatYouHave",
    tone: "grass",
    spot: "learn",
    icon: ChartLine,
    title: "Savoir exactement ce qui génère votre revenu Stripe",
    titleEn: "Know exactly which touchpoint generated your Stripe revenue",
    eyebrow: "Attribution & Revenu",
    eyebrowEn: "Attribution & Revenue",
    kicker: "Vérité financière",
    kickerEn: "Financial Truth",
    lead: "Fini les données d'attribution floues où chaque régie publicitaire s'attribue 100 % de vos ventes. Kaya réconcilie chaque centime avec vos données Stripe réelles.",
    leadEn: "No more phantom attribution where Google, Meta, and LinkedIn all claim credit for the same customer. Kaya ties every dollar to verified Stripe invoices.",
    badge: "100 % réconcilié avec Stripe",
    badgeEn: "100% Stripe Reconciled",
    stat: {
      value: "0 $",
      label: "de chiffre d'affaires attribué en double",
      labelEn: "double-counted revenue across overlapping advertising channels",
    },
    problem: {
      title: "Chaque plateforme publicitaire prétend être responsable de toutes vos ventes",
      titleEn: "Every ad platform claims credit for every single conversion",
      description: "Si vous additionnez les conversions rapportées par Google Ads, Facebook et LinkedIn, vous obtenez souvent le double de ce qui arrive réellement sur votre compte bancaire.",
      descriptionEn: "Add up Google, Meta, and LinkedIn self-reported conversions and you'll find they claim 2× your real bank deposits.",
      bullets: [
        "Pixels publicitaires qui s'approprient les conversions des clients existants",
        "Absence de modèle d'attribution impartial",
        "Calculs de CAC erronés qui faussent les décisions stratégiques",
      ],
      bulletsEn: [
        "Platform pixels taking credit for existing word-of-mouth users",
        "Lack of an objective, neutral attribution ledger",
        "Distorted CAC numbers leading to disastrous scaling decisions",
      ],
    },
    solution: {
      title: "La formule mathématique visible pour chaque conversion",
      titleEn: "The explicit mathematical formula behind every conversion",
      description: "Kaya affiche la formule d'attribution exacte, les points de contact enregistrés et fait le lien direct entre l'ID d'inscription et la facture Stripe.",
      descriptionEn: "Kaya shows the exact attribution equation, recorded touchpoints, and bridges anonymous clicks to actual Stripe subscriptions.",
      features: [
        {
          title: "Réconciliation Stripe native",
          titleEn: "Native Stripe Invoice Matching",
          desc: "Seuls les paiements confirmés sur Stripe sont comptabilisés dans le calcul du ROI.",
          descEn: "Only verified Stripe bank transactions count toward true ROAS and CAC metrics.",
        },
        {
          title: "Attribution multi-touch transparente",
          titleEn: "Transparent Multi-Touch Attribution",
          desc: "Premier contact, contact intermédiaire et dernier clic clairement distingués.",
          descEn: "Clearly shows first-touch discovery, mid-funnel nurture, and last-touch closing interactions.",
        },
        {
          title: "Calcul du LTV et CAC réel",
          titleEn: "True LTV & Blended CAC Engine",
          desc: "Formules mathématiques explicites affichées dans l'interface sans boîte noire.",
          descEn: "Auditable mathematical formulas surfaced right in the UI, zero black-box magic.",
        },
      ],
    },
    loopSteps: [
      {
        step: "understand",
        label: "Collecte des signaux de parcours",
        labelEn: "Touchpoint Journey Tracking",
        desc: "Kaya enregistre les paramètres UTM, les referrers et les pages d'entrée.",
        descEn: "Logs UTM parameters, organic referrers, and entry pages without cookie bloat.",
      },
      {
        step: "decide",
        label: "Modélisation de l'attribution",
        labelEn: "Neutral Attribution Modeling",
        desc: "Attribution impartiale : aucune régie publicitaire n'est favorisée.",
        descEn: "Applies neutral multi-touch formulas with stated limits and full transparency.",
      },
      {
        step: "experiment",
        label: "Ajustement des budgets aux canaux rentables",
        labelEn: "Budget Re-weighting",
        desc: "Kaya propose de couper les canaux qui ne génèrent que des clics sans rétention.",
        descEn: "Recommends cutting channels that generate vanity signups with high immediate churn.",
      },
      {
        step: "learn",
        label: "Mise à jour du CAC par canal",
        labelEn: "True Channel CAC Update",
        desc: "Le coût réel par client payant est actualisé et guide la stratégie du mois suivant.",
        descEn: "Real CAC per paying account is updated to guide subsequent growth cycles.",
      },
    ],
    mockData: {
      title: "Rapport d'attribution · Cohorte Août",
      tag: "Attribution Réconciliée · R0",
      status: "Vérifié Stripe",
      items: [
        { label: "MRR Réel généré", value: "+ 3 420 €/mois (Stripe confirmé)" },
        { label: "Canal #1 (Revenu)", value: "Pages SEO Comparatives (54 % du MRR, CAC 18 €)" },
        { label: "Canal #2 (Revenu)", value: "Google Search Ads (32 % du MRR, CAC 64 €)" },
        { label: "Canal non rentable", value: "LinkedIn Ads (CAC 310 € pour 1 abonné)" },
      ],
      actionLabel: "Explorer l'attribution détaillée",
    },
    guardrails: [
      {
        policy: "Mathématiques hors LLM",
        policyEn: "Deterministic Math Guarantee",
        detail: "Tous les calculs financiers sont effectués par du code TypeScript déterministe, jamais par hallucination de modèle.",
        detailEn: "All revenue, ROAS, and CAC equations are computed by deterministic TypeScript math, never LLM output.",
      },
    ],
    faqs: [
      {
        q: "Kaya respecte-t-il la confidentialité et le RGPD ?",
        qEn: "Is Kaya's attribution privacy and GDPR compliant?",
        a: "Oui. Kaya fonctionne avec une infrastructure privacy-first, sans stocker de données personnelles non nécessaires et sans trackers invasifs.",
        aEn: "Yes. Kaya uses a privacy-first attribution architecture that avoids invasive cross-site fingerprinting.",
      },
    ],
  },
];

export function getUseCaseBySlug(slug: string): UseCaseItem | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
