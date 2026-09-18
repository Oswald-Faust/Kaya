import type { Locale } from "../config";
import { en } from "./en";
import { fr } from "./fr";

/** English is the reference shape; French must provide exactly the same keys. */
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, fr };
