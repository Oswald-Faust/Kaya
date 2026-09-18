import type { en } from "../en";
import { about } from "./about";
import { agentRun } from "./agentRun";
import { app } from "./app";
import { auth } from "./auth";
import { brand } from "./brand";
import { common } from "./common";
import { content } from "./content";
import { errors } from "./errors";
import { hero } from "./hero";
import { integrations } from "./integrations";
import { landing } from "./landing";
import { marketing } from "./marketing";
import { onboarding } from "./onboarding";
import { pricing } from "./pricing";
import { settings } from "./settings";
import { strategyGen } from "./strategyGen";
import { shell } from "./shell";
import { tour } from "./tour";
import { ui } from "./ui";
import { useCases } from "./useCases";

const meta = { description: "Kaya est l'agent IA qui fait votre marketing. Construisez votre produit. Kaya le fait grandir." };

export const fr: typeof en = { meta, about, agentRun, app, auth, brand, common, content, errors, hero, integrations, landing, marketing, onboarding, pricing, settings, strategyGen, shell, tour, ui, useCases };
