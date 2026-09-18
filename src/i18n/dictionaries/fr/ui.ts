import type { ui as en } from "../en/ui";

export const ui: typeof en = {
  chart: { noData: "Aucune donnée sur cette période", label: "Graphique du {from} au {to}, de {min} à {max}" },
  status: {
    idea: "Idée",
    proposed: "Proposée",
    awaiting_approval: "En attente d'approbation",
    scheduled: "Planifiée",
    running: "En cours",
    evaluating: "En évaluation",
    completed: "Terminée",
    archived: "Archivée",
    suppressed: "Écartée",
  },
  outcome: { winner: "Gagnante", loser: "Perdante", inconclusive: "Non concluante" },
  confidence: "confiance",
  risk: { R0: "R0 Lecture", R1: "R1 Brouillon", R2: "R2 Publication", R3: "R3 Dépense", R4: "R4 Sensible" },
  goal: {
    onTrack: "Dans les temps",
    behindPlan: "En retard sur le plan",
    of: "{current} sur {target}",
    daysLeft: { one: "{count} jour restant", other: "{count} jours restants" },
    expectedByToday: "Attendu à ce jour : {pct} %",
  },
};
