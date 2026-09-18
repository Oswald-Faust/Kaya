import type { content as en } from "../en/content";

export const content: typeof en = {
  draftNote: "Brouillon écrit par Kai pour l'expérience « {experiment} ». À relire avant publication.",
  noProofYet: "Ajoutez ici une citation client ou un chiffre avant de publier.",
  page: {
    titleVs: "{product} face à {competitor}",
    titleFor: "{product} pour {audience}",
    whyHeading: "Pourquoi les équipes changent",
    forHeading: "Pour qui",
    forBody: "Conçu pour {audience}, avec une mise en route en quelques minutes.",
    ctaHeading: "Essayer",
    ctaBody: "Commencez avec {product} : {link}",
  },
  email: {
    subject: "Tirer le meilleur de {product}",
    greeting: "Bonjour,",
    intro: "Vous vous êtes inscrit à {product} : {oneLiner}",
    cta: "Reprenez là où vous en étiez : {link}",
    signature: "— L'équipe",
  },
  ad: {
    headline: "{product}, sans la mise en place",
    headlineLabel: "Titre",
    descriptionLabel: "Description",
    audienceLabel: "Audience",
    ctaLabel: "Appel à l'action",
    cta: "Commencer gratuitement",
    anglesLabel: "Angles à tester",
  },
  post: {
    title: "Post à propos de {product}",
    hook: "Ce que nous testons cette semaine : {hypothesis}.",
  },
};
