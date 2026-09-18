import { describe, expect, it } from "vitest";
import { matchAcceptLanguage } from "./config";
import { fmt, plural } from "./format";

describe("i18n helpers", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(fmt("Hi {name}, {missing}", { name: "Ada" })).toBe("Hi Ada, {missing}");
  });

  it("uses each language's plural rules", () => {
    const forms = { one: "{count} seat", other: "{count} seats" };
    expect(plural("en", 0, forms)).toBe("0 seats");
    expect(plural("en", 1, forms)).toBe("1 seat");
    expect(plural("fr", 0, { one: "{count} siège", other: "{count} sièges" })).toBe("0 siège");
    expect(plural("fr", 2, { one: "{count} siège", other: "{count} sièges" })).toBe("2 sièges");
  });

  it("negotiates Accept-Language", () => {
    expect(matchAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(matchAcceptLanguage("de-DE,en;q=0.5")).toBe("en");
    expect(matchAcceptLanguage("de-DE")).toBeNull();
    expect(matchAcceptLanguage(undefined)).toBeNull();
  });
});

import { translateRunText } from "./run-text";

describe("run text", () => {
  it("translates recorded step titles and keeps unknown text", () => {
    expect(translateRunText("Reading pricing", "fr")).toBe("Lecture des tarifs");
    expect(translateRunText("Reading 3 more pages", "fr")).toBe("Lecture de 3 page(s) supplémentaire(s)");
    expect(translateRunText("Reading tickwarden.com", "fr")).toBe("Lecture de tickwarden.com");
    expect(translateRunText("Saved strategy v4", "fr")).toBe("Stratégie v4 enregistrée");
    expect(translateRunText("Something custom", "fr")).toBe("Something custom");
    expect(translateRunText("Reading pricing", "en")).toBe("Reading pricing");
  });
});
