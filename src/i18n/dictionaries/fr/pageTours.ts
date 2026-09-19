import type { pageTours as en } from "../en/pageTours";

export const pageTours: typeof en = {
  label: "Visite de la page",
  replay: "Visite de cette page",
  start: "Montrez-moi",
  skip: "Plus tard",
  close: "Fermer la visite",
  previous: "Précédent",
  next: "Suivant",
  finish: "C'est compris",
  stepOf: "{index} sur {total}",
  introMeta: "{count} points · 30 secondes",
  pages: {
    command: {
      name: "Centre de pilotage",
      intro: "Votre point de départ chaque jour. En un écran : où en est le business, ce que l'agent recommande et ce qui attend votre décision.",
      steps: {
        "cc-header": { title: "Votre cockpit", body: "Le produit, la fraîcheur des données et la période couverte par chaque chiffre. Ouvrez l'agent d'ici quand vous avez un nouvel objectif." },
        "cc-metrics": { title: "Les chiffres qui comptent", body: "MRR, inscriptions, nouveaux clients et CAC, directement depuis vos outils connectés. Survolez un chiffre pour voir comment il est calculé." },
        "cc-brief": { title: "Le brief de l'agent", body: "Ce qui a changé depuis hier et pourquoi c'est important, rédigé par l'agent à partir de vos données. À lire en premier." },
        "cc-actions": { title: "Que faire maintenant", body: "Les expériences classées par impact, confiance et coût. Commencez par la première : « Lancer » la confie à l'agent, qui la prépare et l'exécute." },
        "cc-decisions": { title: "Vos décisions", body: "Tout ce qui dépense de l'argent ou publie attend ici votre validation. Rien de risqué ne se fait sans vous." },
        "cc-learned": { title: "Ce qu'on a appris", body: "Les dernières conclusions des expériences terminées. Elles changent ce que l'agent recommande ensuite." },
        "kai-launcher": { title: "Kai, sur tous les écrans", body: "Posez une question à Kai ou lancez l'action prioritaire depuis n'importe où. Raccourci : ⌘J." },
      },
    },
    kai: {
      name: "Kai",
      intro: "Votre co-pilote conversationnel de croissance, alimenté en direct par le RAG sur votre mémoire d'entreprise.",
      steps: {
        "kai-header": { title: "Rencontrez Kai", body: "Discutez de votre produit, votre stratégie, vos profils cibles et vos métriques. Kai s'appuie sur la vérité de vos données de workspace." },
      },
    },
    agent: {
      name: "Agents IA",
      intro: "L'espace où les agents autonomes d'exécution réalisent vos expériences et vos missions de croissance.",
      steps: {
        "agent-header": { title: "Travailleurs autonomes", body: "Les agents d'exécution planifient leurs étapes, appellent les outils dans le cadre de vos règles et attendent votre accord avant toute action risquée." },
        "agent-ask": { title: "Lancer une mission d'agent", body: "Définissez un objectif d'exécution concret. L'agent analyse le contexte, exécute les outils et produit des livrables." },
        "agent-runs": { title: "Toutes les exécutions", body: "Suivez les missions en cours et terminées, avec étapes, appels d'outils, logs et résultats." },
        "agent-approvals": { title: "En attente de décision", body: "Les actions dépassant votre niveau d'autonomie s'arrêtent ici pour validation humaine." },
      },
    },
    run: {
      name: "Exécution de l'agent",
      intro: "L'histoire complète d'une exécution : ce que l'agent a prévu, fait et produit, étape par étape.",
      steps: {
        "run-header": { title: "L'objectif", body: "Ce que vous avez demandé, quand ça a démarré, quel planificateur a été utilisé et combien d'outils ont été appelés." },
        "run-deliverables": { title: "Ce qu'il a produit", body: "Pages, emails, annonces ou posts rédigés par l'agent. Copiez-les ou laissez-le publier après validation." },
        "run-conversation": { title: "La conversation", body: "L'agent explique ce qu'il fait et pourquoi, simplement." },
        "run-plan": { title: "Le plan", body: "Les étapes choisies par l'agent et la raison de chacune." },
        "run-decision": { title: "Votre décision", body: "Cette exécution est en pause sur une action qui demande votre validation." },
        "run-timeline": { title: "La chronologie", body: "Chaque appel d'outil avec son résultat et la vérification de règles associée : une traçabilité complète." },
        "run-outcome": { title: "Le résultat", body: "Ce qui a changé dans votre workspace une fois l'exécution terminée." },
      },
    },
    strategy: {
      name: "Stratégie",
      intro: "Votre plan de croissance, rédigé à partir de ce que Kaya sait de votre produit, de votre marché et de votre objectif.",
      steps: {
        "strategy-header": { title: "Une stratégie vivante", body: "Elle est versionnée : chaque révision est datée et signée. Reconstruisez-la après un grand changement de produit ou de marché." },
        "strategy-body": { title: "Positionnement, canaux, paris", body: "À qui vous vendez, l'angle gagnant, les canaux classés par pertinence et les expériences qui en découlent." },
        "strategy-history": { title: "Pourquoi elle a changé", body: "Chaque version renvoie aux preuves qui l'ont fait évoluer : vous savez toujours pourquoi le plan a bougé." },
      },
    },
    experiments: {
      name: "Expériences",
      intro: "Chaque idée de croissance devient une expérience mesurée. Voici la liste complète.",
      steps: {
        "exps-header": { title: "Votre bilan", body: "Combien d'expériences sont terminées et combien ont gagné. C'est ce taux qui mesure le travail de Kaya." },
        "exps-views": { title: "Les vues", body: "File d'attente : la suite par priorité. En cours : ce qui tourne. Terminées : les résultats. Écartées : les idées que la mémoire a exclues." },
        "exps-table": { title: "Chaque expérience", body: "Canal, métrique, budget et statut sur une ligne. Ouvrez-en une pour lire son brief et la lancer." },
      },
    },
    experiment: {
      name: "Expérience",
      intro: "Tout sur une expérience : le pari, le raisonnement, la façon de la mesurer et où elle en est.",
      steps: {
        "xd-actions": { title: "Lancez-la", body: "Confiez l'expérience à l'agent. Il prépare ce qu'il faut et s'arrête pour votre validation avant de dépenser ou de publier." },
        "xd-lifecycle": { title: "Où elle en est", body: "De l'idée au verdict. L'étape surlignée est l'étape actuelle." },
        "xd-hypothesis": { title: "L'hypothèse", body: "Le pari en une phrase, l'audience visée et la seule métrique qui tranchera." },
        "xd-brief": { title: "Le brief", body: "Ce qui sera fait, pourquoi maintenant, comment c'est mesuré, ce qu'on apprend dans tous les cas et ce qui pourrait mal tourner." },
        "xd-result": { title: "Critères de succès", body: "Le seuil à battre, ce qui est observé jusqu'ici et le niveau de confiance. Le verdict ne suit que ces chiffres." },
        "xd-design": { title: "Conception", body: "Budget, plafond quotidien, durée et dates. La dépense ne dépasse jamais ce qui est affiché ici." },
        "xd-ranked": { title: "Pourquoi ce rang", body: "Les facteurs derrière son score de priorité, dont les apprentissages passés qui la font monter ou descendre." },
      },
    },
    learnings: {
      name: "Apprentissages",
      intro: "Ce que chaque expérience terminée vous a appris. C'est ainsi que Kaya comprend de mieux en mieux votre business.",
      steps: {
        "learn-header": { title: "Votre banque d'apprentissages", body: "Chaque expérience laisse une conclusion ici, qu'elle ait gagné ou non." },
        "learn-group": { title: "Gagnantes, perdantes, non concluantes", body: "Chaque apprentissage montre ses preuves et les recommandations futures qu'il influence." },
      },
    },
    analytics: {
      name: "Analytique",
      intro: "Des résultats business, pas des métriques de vanité. Kaya juge chaque expérience sur ces chiffres.",
      steps: {
        "an-header": { title: "Des données réelles", body: "Les chiffres viennent de vos connexions revenus et analytics, datés de leur dernière synchro." },
        "an-kpis": { title: "Économie unitaire", body: "MRR, ARPU, CAC, délai de rentabilité, ROAS et churn. Survolez un chiffre pour voir sa formule." },
        "an-charts": { title: "Tendances", body: "MRR et inscriptions dans le temps, pour voir ce que chaque expérience a fait bouger." },
        "an-funnel": { title: "Le funnel", body: "De la visite au client payant. L'étape la plus faible est souvent là où doit porter la prochaine expérience." },
        "an-economics": { title: "Par canal", body: "Dépense, clients et CAC par canal, pour savoir où chaque dollar investi rapporte le plus." },
      },
    },
    memory: {
      name: "Mémoire business",
      intro: "Tout ce que l'agent sait de votre business. Il n'agit que sur ce que vous avez confirmé.",
      steps: {
        "mem-header": { title: "Ce que sait l'agent", body: "Les faits confirmés, les propositions à valider et ceux qui sont dépassés, chacun avec sa source." },
        "mem-facts": { title: "Les faits", body: "Chaque fait a une source et un niveau de confiance. Corrigez ce qui est faux : l'agent suivra." },
        "mem-icps": { title: "Vos clients", body: "Les profils de clients idéaux que l'agent cible dans ses expériences." },
        "mem-competitors": { title: "Concurrents", body: "Face à qui vous êtes et en quoi vous êtes différent. Utilisé pour le positionnement et les pages comparatives." },
      },
    },
    campaigns: {
      name: "Campagnes",
      intro: "Les lancements payants sur tous les canaux. Chaque campagne sert une expérience.",
      steps: {
        "camp-header": { title: "Dépense active", body: "Ce qui est dépensé par jour en ce moment, tous canaux confondus." },
        "camp-table": { title: "Chaque campagne", body: "Canal, budget, dépense et résultats, chacun relié à l'expérience qu'il sert." },
      },
    },
    content: {
      name: "Contenu",
      intro: "Tout ce que l'agent écrit pour vous : pages, emails, annonces et posts.",
      steps: {
        "content-header": { title: "Rédigé pour vous", body: "L'agent écrit à partir des faits que vous avez confirmés, dans votre langue. Rien ne part sans validation." },
        "content-list": { title: "Chaque contenu", body: "Son statut, son canal et l'expérience à laquelle il appartient. Ouvrez-le pour le relire." },
      },
    },
    seo: {
      name: "SEO",
      intro: "Des requêtes de recherche aux pages, classements et conversions.",
      steps: {
        "module-header": { title: "Le canal SEO", body: "Des pages conçues pour capter les recherches que vos acheteurs font déjà." },
        "module-experiments": { title: "Expériences sur ce canal", body: "Chaque pari SEO en cours ou terminé, avec son statut." },
        "module-roadmap": { title: "Ce qui arrive", body: "Les capacités que ce module va recevoir et les connexions dont il dépend." },
      },
    },
    creators: {
      name: "Créateurs",
      intro: "Découverte, prise de contact, accords et revenus apportés par les créateurs.",
      steps: {
        "module-header": { title: "Le canal créateurs", body: "Des créateurs que votre audience suit déjà, mesurés sur les clients qu'ils apportent." },
        "module-experiments": { title: "Expériences sur ce canal", body: "Chaque pari créateurs en cours ou terminé, avec son statut." },
        "module-roadmap": { title: "Ce qui arrive", body: "Les capacités que ce module va recevoir et les connexions dont il dépend." },
      },
    },
    integrations: {
      name: "Intégrations",
      intro: "Les connexions donnent à l'agent des données réelles et la capacité d'agir. Commencez par votre outil de paiement.",
      steps: {
        "int-header": { title: "Pourquoi connecter", body: "Sans données, l'agent devine. Avec Stripe et vos analytics, il mesure les vrais revenus et les vraies inscriptions." },
        "int-connected": { title: "Connectées", body: "L'état, la dernière synchro et les capacités que chaque connexion donne à l'agent." },
        "int-catalog": { title: "Catalogue", body: "Classé par domaine. Connectez-vous avec une clé API ou par identification ; chaque changement effectué est enregistré." },
      },
    },
    settings: {
      name: "Paramètres",
      intro: "Votre workspace, votre équipe, votre langue et la liberté accordée à l'agent.",
      steps: {
        "set-nav": { title: "Sections", body: "Général, équipe, préférences, autonomie de l'agent, facturation et votre compte." },
        "set-general": { title: "Workspace", body: "Nom, icône et adresse de votre workspace." },
        "set-danger": { title: "Zone de danger", body: "Supprimer un workspace efface définitivement toutes ses données. Réservé aux propriétaires." },
      },
    },
  },
};
