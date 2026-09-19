export interface LegalSection {
  id: string;
  title: string;
  keyTakeaway?: string;
  paragraphs: string[];
  subsections?: {
    title: string;
    paragraphs: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
}

export interface LegalDocument {
  id: "legal" | "privacy" | "terms" | "dpa";
  slug: string;
  title: string;
  kicker: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS_FR: Record<string, LegalDocument> = {
  legal: {
    id: "legal",
    slug: "legal",
    title: "Mentions Légales",
    kicker: "Informations légales & Éditeur",
    lastUpdated: "18 septembre 2026",
    summary:
      "Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), vous trouverez ci-après les mentions légales relatives à la plateforme Kaya.",
    sections: [
      {
        id: "editeur",
        title: "1. Éditeur de la plateforme",
        keyTakeaway:
          "Kaya Technologies est la société éditrice de la plateforme Marketing OS, hébergée et opérée depuis l'Union Européenne.",
        paragraphs: [
          "Le site web et le service applicatif accessible à l'adresse https://kaya.ai (et ses sous-domaines) sont édités par la société Kaya Technologies SAS, société par actions simplifiée au capital de 50 000 euros, immatriculée au Registre du Commerce et des Sociétés de Paris.",
          "Siège social : 12 rue de la Paix, 75002 Paris, France.",
          "Numéro d'immatriculation RCS : 912 345 678 R.C.S. Paris",
          "Numéro de TVA intracommunautaire : FR 12 912345678",
          "Directeur de la publication : Oswald Faust, en qualité de Président.",
          "Contact électronique : contact@kaya.ai",
        ],
      },
      {
        id: "hebergeur",
        title: "2. Hébergement & Infrastructure",
        keyTakeaway:
          "Toutes les données sont hébergées sur des serveurs sécurisés situés dans l'Espace Économique Européen.",
        paragraphs: [
          "L'infrastructure de production et les serveurs applicatifs de Kaya sont hébergés par :",
          "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (Région Europe de l'Ouest / AWS Francfort & Paris).",
          "Les bases de données relationnelles et caches en mémoire sont opérés par Neon Inc. et Upstash Inc. au sein de centres de données situés dans l'Union Européenne (Région eu-central-1, Francfort, Allemagne).",
        ],
      },
      {
        id: "propriete-intellectuelle",
        title: "3. Propriété intellectuelle & Marques",
        keyTakeaway:
          "L'interface, la charte graphique, les algorithmes de gouvernance et les logos Kaya sont protégés par le droit de la propriété intellectuelle.",
        paragraphs: [
          "L'intégralité du contenu présent sur le site Kaya (notamment les textes, codes sources, architectures, identités visuelles, illustrations 3D en pâte à modeler, logos et bases de données) est la propriété exclusive de Kaya Technologies SAS ou de ses partenaires licenciés.",
          "Toute reproduction, distribution, modification, adaptation ou retransmission, même partielle, de ces éléments est strictement interdite sans le consentement exprès et écrit de Kaya Technologies SAS.",
          "Les marques et logos tiers cités sur le site (notamment Stripe, Google Ads, GitHub, Hacker News) demeurent la propriété pleine et entière de leurs titulaires respectifs et ne sont mentionnés qu'à des fins d'interopérabilité technique et de compatibilité des intégrations.",
        ],
      },
      {
        id: "contact",
        title: "4. Contact et signalement",
        paragraphs: [
          "Pour toute question relative aux mentions légales, ou pour signaler un contenu inapproprié ou une violation de droits, vous pouvez contacter notre service juridique par email à l'adresse legal@kaya.ai ou par voie postale à notre siège social.",
        ],
      },
    ],
  },

  privacy: {
    id: "privacy",
    slug: "privacy",
    title: "Politique de Confidentialité",
    kicker: "Protection des données personnelles (RGPD)",
    lastUpdated: "18 septembre 2026",
    summary:
      "Kaya s'engage à protéger la vie privée de ses utilisateurs et de leurs clients. Vos données d'entreprise et les informations de vos prospects ne sont jamais utilisées pour entraîner des modèles d'intelligence artificielle.",
    sections: [
      {
        id: "engagement",
        title: "1. Notre engagement fondamental : Zéro entraînement d'IA",
        keyTakeaway:
          "Garantie contractuelle : aucune des données que vous soumettez à Kaya n'est utilisée pour l'entraînement ou l'amélioration des modèles de langage (LLM).",
        paragraphs: [
          "La confidentialité de votre modèle économique est notre priorité absolue. Lorsque Kaya analyse votre site web, vos tunnels de conversion ou vos données Stripe, ces informations ne sont exploitées que pour délivrer le service à votre organisation.",
          "Nous utilisons les APIs d'Anthropic (Claude) et de fournisseurs partenaires sous des accords stricts de niveau entreprise ('Zero Data Retention' et exclusion explicite de tout réentraînement de modèle).",
        ],
      },
      {
        id: "donnees-collectees",
        title: "2. Données que nous collectons",
        paragraphs: [
          "Dans le cadre de l'utilisation de Marketing OS, nous collectons et traitons les catégories de données suivantes :",
        ],
        subsections: [
          {
            title: "2.1 Données de compte et d'identification",
            paragraphs: [
              "Nom, prénom, adresse email professionnelle, mot de passe chiffré (hashé via Argon2id), et rôle au sein de l'organisation.",
            ],
          },
          {
            title: "2.2 Données d'intelligence produit et d'onboarding",
            paragraphs: [
              "URL publique de votre site web, textes extraits lors du crawl, modèles tarifaires, profils de clients idéaux (ICP) et concurrents renseignés ou confirmés par vos soins.",
            ],
          },
          {
            title: "2.3 Données de facturation et d'analyse financière",
            paragraphs: [
              "Identifiants de transactions Stripe, métriques d'abonnements agrégées (MRR, taux d'attrition, valeur vie client). Aucune coordonnée bancaire complète n'est stockée sur nos serveurs ; elles sont traitées exclusivement par Stripe.",
            ],
          },
          {
            title: "2.4 Journaux techniques et d'audit",
            paragraphs: [
              "Adresses IP de connexion, empreintes de requêtes, journaux d'audit immuables pour chaque action exécutée par l'agent (avec horodatage et niveau de risque R0-R4).",
            ],
          },
        ],
      },
      {
        id: "finalites",
        title: "3. Finalités et bases légales du traitement",
        paragraphs: [
          "Nous traitons vos données personnelles uniquement sur les bases légales prévues par le RGPD (Règlement Général sur la Protection des Données) :",
        ],
        subsections: [
          {
            title: "Bases légales applicables :",
            paragraphs: [
              "• Exécution du contrat : pour fournir la plateforme, orchestrer les expériences marketing et exécuter les actions approuvées.",
              "• Intérêt légitime : pour sécuriser l'infrastructure, prévenir la fraude et les attaques par injection de prompt.",
              "• Respect d'obligations légales : pour la conservation des factures et l'archivage comptable.",
              "• Consentement : pour l'envoi de communications facultatives ou l'activation de cookies non essentiels.",
            ],
          },
        ],
      },
      {
        id: "sous-traitants",
        title: "4. Sous-traitants ultérieurs et transferts de données",
        keyTakeaway:
          "Tous nos sous-traitants sont liés par des clauses contractuelles strictes et respectent les standards RGPD.",
        paragraphs: [
          "Kaya fait appel à des prestataires de confiance pour l'exécution de certaines fonctionnalités techniques :",
        ],
        subsections: [
          {
            title: "Liste des sous-traitants principaux :",
            paragraphs: [],
            table: {
              headers: ["Prestataire", "Rôle / Service", "Localisation des données", "Garanties"],
              rows: [
                ["Neon Inc.", "Hébergement base de données PostgreSQL", "UE (Francfort, Allemagne)", "Conforme RGPD"],
                ["Upstash Inc.", "Gestion du cache Redis et rate-limiting", "UE (Francfort, Allemagne)", "Conforme RGPD"],
                ["Vercel Inc.", "Hébergement web et serverless runtime", "UE (Francfort) / USA", "Clauses Contractuelles Types (SCC)"],
                ["Anthropic PBC", "Moteur LLM d'extraction (API Entreprise)", "USA (API Zero Retention)", "SCC + DPA Entreprise"],
                ["Stripe Inc.", "Paiements et gestion des abonnements", "UE / USA", "Certifié PCI-DSS Niveau 1 + DPA"],
                ["Resend Inc.", "Envoi d'emails transactionnels", "UE / USA", "Conforme RGPD"],
              ],
            },
          },
        ],
      },
      {
        id: "droits-rgpd",
        title: "5. Vos droits sur vos données",
        keyTakeaway:
          "Vous disposez d'un droit d'accès, de rectification, d'effacement et d'exportation de l'intégralité de vos données.",
        paragraphs: [
          "Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :",
          "• Droit d'accès et de copie de l'ensemble des données vous concernant.",
          "• Droit de rectification des informations inexactes ou incomplètes.",
          "• Droit à l'effacement ('droit à l'oubli') de votre compte et de vos données d'entreprise.",
          "• Droit à la limitation du traitement et droit d'opposition.",
          "• Droit à la portabilité des données dans un format structuré et lisible par machine (JSON/CSV).",
          "Pour exercer l'un de ces droits, contactez notre Délégué à la Protection des Données (DPO) à l'adresse privacy@kaya.ai. Nous nous engageons à répondre sous 30 jours ouvrés.",
        ],
      },
      {
        id: "securite",
        title: "6. Sécurité et intégrité technique",
        paragraphs: [
          "Kaya met en œuvre des mesures de sécurité techniques et organisationnelles de pointe :",
          "• Chiffrement de toutes les communications en transit (TLS 1.3) et chiffrement des données au repos (AES-256).",
          "• Verrouillage des mutations de base de données par triggers PostgreSQL immuables pour les journaux d'audit.",
          "• Garde-fous réseau stricts contre les attaques SSRF lors du crawl des URLs de vos produits.",
        ],
      },
    ],
  },

  terms: {
    id: "terms",
    slug: "terms",
    title: "Conditions Générales d'Utilisation et de Vente",
    kicker: "Contrat de service & Engagements",
    lastUpdated: "18 septembre 2026",
    summary:
      "Les présentes conditions régissent l'accès et l'utilisation de la plateforme Kaya. Elles définissent les règles d'autonomie de l'agent, les engagements de gouvernance et les conditions financières applicables.",
    sections: [
      {
        id: "objet",
        title: "1. Objet du contrat et description du service",
        keyTakeaway:
          "Kaya est un système d'exploitation de croissance piloté par IA (Marketing OS) agissant sous votre gouvernance stricte.",
        paragraphs: [
          "Kaya fournit aux fondateurs et entreprises un agent logiciel autonome conçu pour comprendre leur produit, formuler des stratégies d'acquisition, déployer des micro-expériences et mesurer les résultats d'affaires réels.",
          "Le service est délivré selon quatre niveaux d'autonomie paramétrables par le client : Observer (R0), Suggérer (R1), Copilote (R2-R3) et Pilote Automatique (R4).",
        ],
      },
      {
        id: "compte-responsabilite",
        title: "2. Création de compte et responsabilité de l'utilisateur",
        paragraphs: [
          "L'accès au service nécessite la création d'un espace de travail (Workspace) associé à une organisation vérifiée.",
          "L'utilisateur garantit que les informations fournies lors de son inscription sont exactes et à jour. Il est seul responsable du maintien de la confidentialité de ses identifiants de connexion.",
          "L'utilisateur conserve la pleine responsabilité éditoriale et légale sur tout contenu dont il approuve la publication publique via les modules de validation de Kaya.",
        ],
      },
      {
        id: "gouvernance-financiere",
        title: "3. Gouvernance financière et plafonds de dépenses",
        keyTakeaway:
          "Plafonds infranchissables : Kaya ne peut jamais engager de dépense publicitaire supérieure à vos limites programmées en dur.",
        paragraphs: [
          "Lorsque le client active des intégrations publicitaires (ex. Google Ads ou Meta Ads), il définit des plafonds de dépense quotidiens et mensuels stricts.",
          "Ces plafonds sont validés cryptographiquement et mathématiquement par du code déterministe avant chaque appel d'API vers les régies publicitaires. Aucune hallucination de modèle d'IA ne peut outrepasser ces seuils.",
        ],
      },
      {
        id: "utilisation-acceptable",
        title: "4. Politique d'utilisation acceptable",
        paragraphs: [
          "L'utilisateur s'engage formellement à ne pas utiliser Kaya pour :",
          "• Diffuser du contenu illégal, diffamatoire, trompeur ou portant atteinte aux droits de tiers.",
          "• Mener des campagnes de spam ou d'astroturfing non conformes aux règles de plateformes tierces.",
          "• Tenter d'injecter des prompts malveillants ou de manipuler les agents de crawl d'autres utilisateurs.",
          "Kaya Technologies se réserve le droit de suspendre immédiatement l'accès au service en cas de violation avérée de ces dispositions.",
        ],
      },
      {
        id: "facturation-resiliation",
        title: "5. Tarifs, facturation et résiliation",
        paragraphs: [
          "Les forfaits d'abonnement (Gratuit, Lancement, Croissance, Échelle) sont facturés mensuellement ou annuellement via Stripe.",
          "Le client peut résilier son abonnement à tout moment depuis son tableau de bord de facturation. La résiliation prend effet à la fin de la période de facturation en cours, sans pénalité.",
        ],
      },
      {
        id: "garantie-limitation",
        title: "6. Limitation de responsabilité",
        paragraphs: [
          "Kaya s'engage à fournir le service avec diligence et selon les règles de l'art. Toutefois, Kaya ne garantit aucun niveau de chiffre d'affaires ou de conversion spécifique, les résultats dépendant de facteurs exogènes de marché propres au produit du client.",
          "La responsabilité totale de Kaya Technologies au titre du contrat est expressément limitée au montant total payé par le client au cours des 12 derniers mois précédant l'événement générateur.",
        ],
      },
    ],
  },

  dpa: {
    id: "dpa",
    slug: "dpa",
    title: "Accord de Traitement des Données (DPA)",
    kicker: "Data Processing Agreement · Article 28 RGPD",
    lastUpdated: "18 septembre 2026",
    summary:
      "Le présent accord de traitement des données (DPA) régit le traitement des données à caractère personnel effectué par Kaya pour le compte de ses clients dans le respect des exigences de l'Article 28 du RGPD.",
    sections: [
      {
        id: "cadre-roles",
        title: "1. Cadre juridique et qualification des rôles",
        keyTakeaway:
          "Le Client agit en qualité de Responsable du Traitement. Kaya Technologies SAS agit en qualité de Sous-traitant.",
        paragraphs: [
          "Le présent DPA s'applique à tout traitement de données personnelles réalisé par Kaya dans le cadre de l'exécution des Services souscrits par le Client.",
          "Le Client conserve la maîtrise totale et la propriété de ses données. Kaya s'engage à ne traiter les données que sur instruction documentée du Client, conformément aux présentes stipulations.",
        ],
      },
      {
        id: "nature-donnees",
        title: "2. Nature et catégories de données traitées",
        paragraphs: [
          "Les données traitées par Kaya au nom du Client comprennent :",
          "• Données d'utilisateurs et prospects : identifiants de sessions, adresses email des comptes d'essai, métadonnées de navigation associées aux conversions.",
          "• Données de campagne : statistiques d'annonces, termes de recherche d'intention, logs d'approbation d'expériences.",
          "Les personnes concernées sont les visiteurs, prospects et utilisateurs finaux du Client.",
        ],
      },
      {
        id: "obligations-sous-traitant",
        title: "3. Obligations de Kaya en qualité de sous-traitant",
        paragraphs: [
          "Conformément à l'Article 28 du RGPD, Kaya s'engage à :",
          "• Ne traiter les données que pour les seules finalités convenues d'exécution du service Marketing OS.",
          "• Veiller à ce que les personnes autorisées à traiter les données soient soumises à une stricte obligation de confidentialité.",
          "• Mettre en œuvre les mesures techniques et organisationnelles garantissant un niveau de sécurité adapté au risque (chiffrement, contrôles d'accès stricts, sauvegardes quotidiennes).",
          "• Assister le Client dans la mesure du possible pour répondre aux demandes d'exercice de droits formulées par les personnes concernées.",
        ],
      },
      {
        id: "sous-traitance-ulterieure",
        title: "4. Sous-traitance ultérieure autorisée",
        paragraphs: [
          "Le Client accorde par les présentes une autorisation générale à Kaya pour faire appel à des sous-traitants ultérieurs de premier rang (hébergeurs d'infrastructures, processeurs de paiement, modèles LLM sans rétention).",
          "Kaya s'assure que chaque sous-traitant ultérieur est soumis à des obligations au moins aussi strictes que celles stipulées dans le présent DPA.",
          "En cas de modification ou d'ajout d'un sous-traitant ultérieur significatif, Kaya informera le Client au préalable avec un préavis minimal de 15 jours.",
        ],
      },
      {
        id: "violation-donnees",
        title: "5. Notification des violations de données personnelles",
        keyTakeaway:
          "Notification d'incident sous 48 heures maximum auprès du Client en cas de violation de sécurité avérée.",
        paragraphs: [
          "Kaya notifiera le Client sans retard injustifié et, au plus tard, dans les 48 heures suivant la prise de connaissance de toute violation avérée de données personnelles ayant un impact sur les données du Client.",
          "Cette notification précisera la nature de l'incident, les catégories de données concernées, les conséquences prévisibles et les mesures correctives immédiates adoptées.",
        ],
      },
      {
        id: "fin-contrat",
        title: "6. Sort des données au terme du service",
        paragraphs: [
          "Au terme de la relation contractuelle, Kaya s'engage, au choix du Client, à supprimer l'intégralité des données personnelles ou à les restituer dans un format informatique standard (JSON / CSV / SQL dump).",
          "La suppression définitive de toutes les copies de sauvegarde sur nos serveurs intervient dans un délai maximal de 30 jours calendaires.",
        ],
      },
    ],
  },
};

export const LEGAL_DOCS_EN: Record<string, LegalDocument> = {
  legal: {
    id: "legal",
    slug: "legal",
    title: "Legal Notice",
    kicker: "Legal Information & Publisher",
    lastUpdated: "September 18, 2026",
    summary:
      "In accordance with European and French digital economy regulations (LCEN), please find below the corporate, hosting, and regulatory information pertaining to the Kaya platform.",
    sections: [
      {
        id: "editeur",
        title: "1. Platform Publisher",
        keyTakeaway:
          "Kaya Technologies SAS is the publishing company of Marketing OS, hosted and operated within the European Union.",
        paragraphs: [
          "The website and software application accessible at https://kaya.ai (and its subdomains) are published and operated by Kaya Technologies SAS, a simplified joint-stock company with a share capital of €50,000, registered with the Paris Trade and Companies Register.",
          "Headquarters: 12 rue de la Paix, 75002 Paris, France.",
          "RCS Registration: 912 345 678 R.C.S. Paris",
          "EU VAT Number: FR 12 912345678",
          "Publication Director: Oswald Faust, acting as President.",
          "Electronic contact: contact@kaya.ai",
        ],
      },
      {
        id: "hebergeur",
        title: "2. Hosting & Cloud Infrastructure",
        keyTakeaway:
          "All production infrastructure and customer data reside within European Union data centers.",
        paragraphs: [
          "Kaya's production hosting and edge routing are provided by:",
          "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA (Western Europe Region / AWS Frankfurt & Paris).",
          "Relational databases and in-memory caches are hosted by Neon Inc. and Upstash Inc. in data centers situated within the European Union (eu-central-1 region, Frankfurt, Germany).",
        ],
      },
      {
        id: "propriete-intellectuelle",
        title: "3. Intellectual Property & Trademarks",
        keyTakeaway:
          "The user interface, graphic brand assets, autonomous algorithms, and logos are strictly protected under international intellectual property law.",
        paragraphs: [
          "All content present on the Kaya platform (including text, UI layouts, source code, visual systems, 3D clay illustrations, logos, and proprietary data models) is the exclusive property of Kaya Technologies SAS or its licensed partners.",
          "Any reproduction, distribution, modification, adaptation, or retransmission, whether partial or complete, is strictly prohibited without prior express written authorization from Kaya Technologies SAS.",
          "Third-party trademarks and trade names cited on the site (including Stripe, Google Ads, GitHub, Hacker News) remain the exclusive property of their respective holders and are referenced strictly for interoperability and integration purposes.",
        ],
      },
      {
        id: "contact",
        title: "4. Inquiries & Legal Contact",
        paragraphs: [
          "For any questions regarding this legal notice or to report inappropriate content or infringement, please contact our legal counsel at legal@kaya.ai or by postal mail at our registered corporate address.",
        ],
      },
    ],
  },

  privacy: {
    id: "privacy",
    slug: "privacy",
    title: "Privacy Policy",
    kicker: "Personal Data Protection (GDPR)",
    lastUpdated: "September 18, 2026",
    summary:
      "Kaya is firmly committed to safeguarding the privacy of our customers and their end-users. Your proprietary software telemetry and prospect data are never used to train artificial intelligence models.",
    sections: [
      {
        id: "engagement",
        title: "1. Core Guarantee: Zero AI Model Training",
        keyTakeaway:
          "Contractual guarantee: none of the customer data you submit or connect to Kaya is ever used to train or fine-tune AI foundation models (LLMs).",
        paragraphs: [
          "Protecting your strategic business data is our top priority. When Kaya inspects your web pages, analyzes conversion funnels, or audits Stripe telemetry, this information is utilized solely to deliver the service to your workspace.",
          "We interface with Anthropic (Claude) and enterprise model providers under strict corporate zero-data-retention agreements with explicit exclusions from any model training or reinforcement learning sets.",
        ],
      },
      {
        id: "donnees-collectees",
        title: "2. Data We Collect",
        paragraphs: [
          "In the course of providing Marketing OS, we collect and process the following categories of data:",
        ],
        subsections: [
          {
            title: "2.1 Account and Authentication Data",
            paragraphs: [
              "Full name, business email address, cryptographically hashed passwords (via Argon2id), and assigned organization roles.",
            ],
          },
          {
            title: "2.2 Product Intelligence & Onboarding Telemetry",
            paragraphs: [
              "Public URLs of your software, text scraped during initial crawl, pricing models, ideal customer profiles (ICPs), and confirmed competitive positioning.",
            ],
          },
          {
            title: "2.3 Billing & Revenue Analytics",
            paragraphs: [
              "Stripe transaction identifiers and aggregated subscription metrics (MRR, churn rates, customer lifetime value). No full payment card credentials are ever stored on our servers; payments are processed entirely by Stripe.",
            ],
          },
          {
            title: "2.4 Technical & Governance Audit Logs",
            paragraphs: [
              "Connection IP addresses, request signatures, and tamper-proof audit trails for every automated action initiated by the agent (annotated with timestamps and risk classification R0-R4).",
            ],
          },
        ],
      },
      {
        id: "finalites",
        title: "3. Purposes and Legal Bases for Processing",
        paragraphs: [
          "We process personal data strictly under valid legal grounds provided by the European General Data Protection Regulation (GDPR):",
        ],
        subsections: [
          {
            title: "Applicable legal bases:",
            paragraphs: [
              "• Contractual Performance: to operate the software platform, run growth workflows, and execute approved campaigns.",
              "• Legitimate Interest: to defend infrastructure, prevent security incidents, and mitigate prompt injection threats.",
              "• Legal Compliance: to satisfy statutory tax, accounting, and invoice retention mandates.",
              "• Explicit Consent: for non-essential communications or optional tracking preferences.",
            ],
          },
        ],
      },
      {
        id: "sous-traitants",
        title: "4. Authorized Sub-processors & International Transfers",
        keyTakeaway:
          "All sub-processors are bound by strict Data Processing Agreements guaranteeing GDPR-compliant protection standards.",
        paragraphs: [
          "Kaya collaborates with trusted infrastructure providers to deliver specialized system operations:",
        ],
        subsections: [
          {
            title: "Key authorized sub-processors:",
            paragraphs: [],
            table: {
              headers: ["Vendor", "Service / Role", "Data Location", "Safeguards"],
              rows: [
                ["Neon Inc.", "Managed PostgreSQL Database", "EU (Frankfurt, Germany)", "GDPR Compliant"],
                ["Upstash Inc.", "Serverless Redis & Rate Limiting", "EU (Frankfurt, Germany)", "GDPR Compliant"],
                ["Vercel Inc.", "Edge Compute & Frontend Hosting", "EU (Frankfurt) / USA", "Standard Contractual Clauses (SCC)"],
                ["Anthropic PBC", "Enterprise LLM Inference Engine", "USA (Zero Data Retention API)", "SCC + Enterprise DPA"],
                ["Stripe Inc.", "Payment Billing & Subscriptions", "EU / USA", "PCI-DSS Level 1 + Enterprise DPA"],
                ["Resend Inc.", "Transactional Email Delivery", "EU / USA", "GDPR Compliant + SCC"],
              ],
            },
          },
        ],
      },
      {
        id: "droits-rgpd",
        title: "5. Your GDPR Rights",
        keyTakeaway:
          "You retain absolute rights to access, rectify, export, and erase all personal and organizational data.",
        paragraphs: [
          "Under Articles 15 through 22 of the GDPR, you are entitled to the following rights:",
          "• Right to access and receive an electronic copy of your processed personal data.",
          "• Right to prompt rectification of inaccurate or outdated information.",
          "• Right to erasure ('right to be forgotten') of your account and related telemetry.",
          "• Right to restriction of processing and right to object.",
          "• Right to data portability in an open, machine-readable format (JSON/CSV).",
          "To exercise your rights, please reach out to our Data Protection Officer at privacy@kaya.ai. We commit to responding within 30 calendar days.",
        ],
      },
      {
        id: "securite",
        title: "6. Security & Infrastructure Integrity",
        paragraphs: [
          "Kaya implements defense-in-depth architectural standards:",
          "• Universal encryption in transit via TLS 1.3 and at rest via AES-256.",
          "• Immutable PostgreSQL append-only triggers for the governance audit ledger.",
          "• Strict internal SSRF network filtering when crawling customer web properties.",
        ],
      },
    ],
  },

  terms: {
    id: "terms",
    slug: "terms",
    title: "Terms of Service & Master Agreement",
    kicker: "Service Contract & Autonomous Governance",
    lastUpdated: "September 18, 2026",
    summary:
      "These terms govern your access to and use of the Kaya platform. They outline agent autonomy levels, financial spend controls, governance boundaries, and billing commitments.",
    sections: [
      {
        id: "objet",
        title: "1. Scope of Agreement & Platform Description",
        keyTakeaway:
          "Kaya is an AI-powered Marketing OS designed to operate software acquisition under your deterministic supervision.",
        paragraphs: [
          "Kaya provides founders and software teams with an autonomous marketing agent engineered to audit software positioning, formulate growth hypotheses, deploy micro-experiments, and measure verified commercial results.",
          "The software operates across four configurable autonomy tiers: Observer (R0), Suggest (R1), Copilot (R2-R3), and Full Autopilot (R4).",
        ],
      },
      {
        id: "compte-responsabilite",
        title: "2. Account Registration & User Responsibility",
        paragraphs: [
          "Access to the platform requires the creation of a verified workspace tied to an authenticated organization.",
          "The user represents that all registration information submitted is truthful and complete. The user remains solely responsible for safeguarding access credentials.",
          "The customer retains full editorial and legal accountability for all creative assets, copy, or communications approved for public release through Kaya's governance review workflows.",
        ],
      },
      {
        id: "gouvernance-financiere",
        title: "3. Financial Governance & Spend Hard Caps",
        keyTakeaway:
          "Unbreachable limits: Kaya cannot exceed your programmed budget caps under any condition.",
        paragraphs: [
          "When the customer activates paid acquisition channels (such as Google Ads or Meta Ads), strict daily and monthly budget maximums must be set.",
          "These limits are enforced cryptographically and mathematically by deterministic software guards prior to executing external API calls. No generative LLM hallucination can supersede these deterministic guardrails.",
        ],
      },
      {
        id: "utilisation-acceptable",
        title: "4. Acceptable Use Policy",
        paragraphs: [
          "Users agree not to utilize Kaya for:",
          "• Generating or publishing deceptive, unlawful, defamatory, or copyright-infringing content.",
          "• Executing unprompted spam campaigns or astroturfing violating third-party platform policies.",
          "• Attempting prompt injection attacks or interfering with multi-tenant agent execution.",
          "Kaya Technologies reserves the right to suspend or terminate accounts found in material violation of these principles.",
        ],
      },
      {
        id: "facturation-resiliation",
        title: "5. Pricing, Subscription & Cancellation",
        paragraphs: [
          "Subscription plans (Free, Launch, Growth, Scale) are billed on a recurring monthly or annual cadence via Stripe.",
          "Customers may cancel subscriptions at any time directly through the billing settings. Cancellations take effect at the conclusion of the active billing cycle with no cancellation penalties.",
        ],
      },
      {
        id: "garantie-limitation",
        title: "6. Warranty Disclaimer & Limitation of Liability",
        paragraphs: [
          "Kaya provides its software with high professional diligence. However, Kaya does not guarantee specific conversion volumes or revenue metrics, which depend on external market dynamics unique to the customer's product.",
          "To the maximum extent permitted by law, Kaya Technologies' aggregate financial liability under this agreement is expressly capped at the total amount paid by the customer during the twelve (12) months preceding the claim.",
        ],
      },
    ],
  },

  dpa: {
    id: "dpa",
    slug: "dpa",
    title: "Data Processing Agreement (DPA)",
    kicker: "Data Processing Agreement · GDPR Article 28",
    lastUpdated: "September 18, 2026",
    summary:
      "This Data Processing Agreement (DPA) governs the processing of personal data conducted by Kaya on behalf of customers in accordance with the standards of Article 28 of the GDPR.",
    sections: [
      {
        id: "cadre-roles",
        title: "1. Legal Context & Role Allocation",
        keyTakeaway:
          "The Customer acts as Data Controller. Kaya Technologies SAS acts as Data Processor.",
        paragraphs: [
          "This DPA applies to all personal data processing activities conducted by Kaya in providing the Marketing OS platform to the Customer.",
          "The Customer retains full ownership, instruction authority, and custody over all uploaded data. Kaya processes customer personal data solely upon documented customer instructions.",
        ],
      },
      {
        id: "nature-donnees",
        title: "2. Scope & Categories of Processed Data",
        paragraphs: [
          "Customer data handled by Kaya on the Customer's behalf includes:",
          "• Prospect and End-User Telemetry: session tokens, trial account emails, and anonymized conversion journey logs.",
          "• Acquisition Campaign Records: campaign performance statistics, high-intent query patterns, and approval audit records.",
          "Data subjects consist of visitors, prospects, and end-users of the Customer's software.",
        ],
      },
      {
        id: "obligations-sous-traitant",
        title: "3. Kaya's Obligations as Data Processor",
        paragraphs: [
          "Pursuant to Article 28 of the GDPR, Kaya undertakes to:",
          "• Process data exclusively for the agreed purpose of operating the Marketing OS platform.",
          "• Guarantee that personnel authorized to handle personal data are bound by strict professional confidentiality.",
          "• Deploy state-of-the-art security measures commensurate with processing risks (end-to-end encryption, access controls, automated backups).",
          "• Assist the Customer in fulfilling data subject requests under GDPR Chapter III.",
        ],
      },
      {
        id: "sous-traitance-ulterieure",
        title: "4. Authorized Sub-processing",
        paragraphs: [
          "The Customer grants general written authorization to Kaya to engage specialized third-party sub-processors (cloud hosting, payment gateways, zero-retention LLM providers).",
          "Kaya warrants that every sub-processor is bound by data protection obligations at least as protective as those contained in this DPA.",
          "Kaya will notify the Customer at least 15 days in advance of any material change or addition of a sub-processor.",
        ],
      },
      {
        id: "violation-donnees",
        title: "5. Security Breach Notification",
        keyTakeaway:
          "Incident notice provided within 48 hours maximum upon verification of any confirmed security breach.",
        paragraphs: [
          "Kaya shall notify the Customer without undue delay and, at the latest, within forty-eight (48) hours of becoming aware of any confirmed personal data breach affecting Customer data.",
          "The notification shall detail the nature of the breach, affected data categories, likely consequences, and immediate remedial actions deployed.",
        ],
      },
      {
        id: "fin-contrat",
        title: "6. Data Return & Secure Deletion",
        paragraphs: [
          "Upon termination of the service agreement, Kaya shall, at the Customer's election, securely delete or export all Customer personal data in a standard structured format (JSON / CSV / SQL dump).",
          "All backup copies are permanently and irrecoverably purged from our storage within a maximum window of thirty (30) calendar days.",
        ],
      },
    ],
  },
};

export const LEGAL_DOCS = LEGAL_DOCS_FR;

export function getLegalDoc(id: string, locale: string = "fr"): LegalDocument | undefined {
  const docs = locale === "en" ? LEGAL_DOCS_EN : LEGAL_DOCS_FR;
  return docs[id] || docs.legal;
}
