/**
 * Deterministic history for the demo company (Tickwarden, a fictional cron
 * monitoring SaaS). The numbers are produced from a small causal model of the
 * business so that every experiment in the story leaves a real footprint in
 * the metrics — and experiment results are derived from these same rows.
 */
import type { DailyMetricsRow } from "@/server/domain/analytics/metrics";

export const DEMO_START = "2026-06-01";
export const DEMO_END = "2026-09-12";
export const DEMO_TODAY = "2026-09-13";

export const STORY = {
  exp001MetaBroad: { start: "2026-06-10", end: "2026-07-05", dailySpend: 16, cpc: 0.85, trueCac: 200 },
  exp002Comparison: { start: "2026-06-20", end: "2026-07-25" },
  hnLaunch: { day: "2026-07-14" },
  exp003GoogleExact: { start: "2026-07-08", end: "2026-08-10", dailySpend: 14.5, cpc: 1.3, trueCac: 34 },
  googleAlwaysOn: { start: "2026-08-11", dailySpend: 20 },
  exp004AnnualDefault: { start: "2026-08-01", end: "2026-08-28" },
  exp006ActivationNudge: { start: "2026-08-30", end: "2026-09-13" },
  exp005Competitor: { start: "2026-09-04", end: "2026-09-17", dailySpend: 13, cpc: 1.6, trueCac: 39 },
} as const;

export interface ChannelDayRow extends DailyMetricsRow {
  channel: string;
}

export interface ArmTotals {
  exposures: number;
  conversions: number;
  spend: number;
}

export interface GeneratedHistory {
  channelRows: ChannelDayRow[];
  blendedRows: DailyMetricsRow[];
  arms: {
    exp001: ArmTotals;
    exp002: { control: ArmTotals; treatment: ArmTotals };
    exp003: ArmTotals;
    exp004: { control: ArmTotals; treatment: ArmTotals };
    exp005: ArmTotals;
    exp006: { control: ArmTotals; treatment: ArmTotals };
  };
}

const START_MRR = 4180;
const START_CUSTOMERS = 104;
const PLAN_TEAM = 29;
const PLAN_BUSINESS = 99;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Emits whole units while carrying the fractional remainder, so totals track expectations exactly. */
class Carry {
  private acc = new Map<string, number>();
  private parity = new Map<string, number>();
  take(key: string, expected: number): number {
    const total = (this.acc.get(key) ?? 0) + expected;
    const whole = Math.floor(total);
    this.acc.set(key, total - whole);
    return whole;
  }
  /** Splits units 50/50 across calls, alternating the odd unit so arms stay balanced. */
  split(key: string, n: number): [number, number] {
    const p = this.parity.get(key) ?? 0;
    const control = Math.floor((n + p) / 2);
    if (n % 2 === 1) this.parity.set(key, 1 - p);
    return [control, n - control];
  }
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const inRange = (day: string, r: { start: string; end: string }) => day >= r.start && day <= r.end;
const emptyArm = (): ArmTotals => ({ exposures: 0, conversions: 0, spend: 0 });

export function generateDemoHistory(): GeneratedHistory {
  const rng = mulberry32(20260601);
  const carry = new Carry();
  const channelRows: ChannelDayRow[] = [];
  const blendedRows: DailyMetricsRow[] = [];
  const arms: GeneratedHistory["arms"] = {
    exp001: emptyArm(),
    exp002: { control: emptyArm(), treatment: emptyArm() },
    exp003: emptyArm(),
    exp004: { control: emptyArm(), treatment: emptyArm() },
    exp005: emptyArm(),
    exp006: { control: emptyArm(), treatment: emptyArm() },
  };

  let mrr = START_MRR;
  let customers = START_CUSTOMERS;
  let customerCounter = 0;
  const WEEKDAY = [0.7, 1.06, 1.1, 1.07, 1.02, 0.9, 0.66]; // Sun..Sat

  for (let d = 0; ; d++) {
    const day = addDays(DEMO_START, d);
    if (day > DEMO_END) break;
    const wf = WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()];
    const noise = () => 0.9 + rng() * 0.2;

    type Acq = { channel: string; spend: number; clicks: number; impressions: number; visits: number; signups: number; paidExpected?: number };
    const acq: Acq[] = [];

    // Direct / word of mouth
    {
      const visits = Math.round(92 * (1 + d * 0.0025) * wf * noise());
      acq.push({ channel: "direct", spend: 0, clicks: 0, impressions: 0, visits, signups: carry.take("direct.su", visits * 0.03) });
    }

    // SEO: generic content + comparison-intent searchers
    {
      const generic = Math.round(128 * Math.pow(1.0032, d) * wf * noise());
      const pagesLive = day > STORY.exp002Comparison.end;
      const intentBase = 64 + (pagesLive ? Math.min(130, (d - 55) * 2.1) : 0);
      const intent = Math.round(intentBase * wf * noise());
      let signups = carry.take("seo.generic", generic * 0.026);
      if (inRange(day, STORY.exp002Comparison)) {
        const [control, treatment] = carry.split("exp002", intent);
        const cSu = carry.take("seo.exp002.c", control * 0.031);
        const tSu = carry.take("seo.exp002.t", treatment * 0.079);
        arms.exp002.control.exposures += control;
        arms.exp002.control.conversions += cSu;
        arms.exp002.treatment.exposures += treatment;
        arms.exp002.treatment.conversions += tSu;
        signups += cSu + tSu;
      } else {
        signups += carry.take("seo.intent", intent * (pagesLive ? 0.079 : 0.031));
      }
      const visits = generic + intent;
      acq.push({ channel: "seo_content", spend: 0, clicks: visits, impressions: Math.round(visits / 0.034), visits, signups });
    }

    // Hacker News: baseline plus the Show HN spike
    {
      const spike = day === STORY.hnLaunch.day ? 1650 : day === addDays(STORY.hnLaunch.day, 1) ? 420 : day === addDays(STORY.hnLaunch.day, 2) ? 110 : 0;
      const base = Math.round(21 * noise());
      const visits = base + spike;
      acq.push({ channel: "hacker_news", spend: 0, clicks: 0, impressions: 0, visits, signups: carry.take("hn", base * 0.02 + spike * 0.012) });
    }

    // Reddit
    {
      const visits = Math.round(13 * wf * noise());
      acq.push({ channel: "reddit", spend: 0, clicks: 0, impressions: 0, visits, signups: carry.take("reddit", visits * 0.025) });
    }

    // Meta: broad interest test (EXP-001)
    if (inRange(day, STORY.exp001MetaBroad)) {
      const s = STORY.exp001MetaBroad;
      const clicks = Math.round(s.dailySpend / s.cpc);
      const visits = Math.round(clicks * 0.9);
      const paid = carry.take("meta.paid", s.dailySpend / s.trueCac);
      arms.exp001.spend += s.dailySpend;
      arms.exp001.exposures += visits;
      arms.exp001.conversions += paid;
      acq.push({
        channel: "meta_ads",
        spend: s.dailySpend,
        clicks,
        impressions: Math.round(clicks / 0.009),
        visits,
        signups: carry.take("meta.su", visits * 0.011),
        paidExpected: paid,
      });
    }

    // Google Search: exact-intent test, then always-on, plus competitor test (EXP-005)
    {
      let spend = 0;
      let paid = 0;
      let clicks = 0;
      if (inRange(day, STORY.exp003GoogleExact)) {
        const s = STORY.exp003GoogleExact;
        const c = Math.round(s.dailySpend / s.cpc);
        const p = carry.take("g.exact.paid", s.dailySpend / s.trueCac);
        arms.exp003.spend += s.dailySpend;
        arms.exp003.exposures += c;
        arms.exp003.conversions += p;
        spend += s.dailySpend;
        clicks += c;
        paid += p;
      } else if (day >= STORY.googleAlwaysOn.start) {
        const s = STORY.googleAlwaysOn;
        spend += s.dailySpend;
        clicks += Math.round(s.dailySpend / 1.28);
        paid += carry.take("g.always.paid", s.dailySpend / 35);
      }
      if (inRange(day, STORY.exp005Competitor) && day <= DEMO_END) {
        const s = STORY.exp005Competitor;
        const c = Math.round(s.dailySpend / s.cpc);
        const p = carry.take("g.comp.paid", s.dailySpend / s.trueCac);
        arms.exp005.spend += s.dailySpend;
        arms.exp005.exposures += c;
        arms.exp005.conversions += p;
        spend += s.dailySpend;
        clicks += c;
        paid += p;
      }
      if (spend > 0) {
        const visits = Math.round(clicks * 0.93);
        acq.push({
          channel: "google_search",
          spend,
          clicks,
          impressions: Math.round(clicks / 0.052),
          visits,
          signups: carry.take("g.su", visits * 0.085),
          paidExpected: paid,
        });
      }
    }

    // ── Funnel after signup, per channel ──
    const inExp004 = inRange(day, STORY.exp004AnnualDefault);
    const inExp006 = inRange(day, STORY.exp006ActivationNudge) && day <= DEMO_END;
    let dayNewMrr = 0;
    let dayNewCustomers = 0;
    const dayRows: ChannelDayRow[] = [];

    for (const a of acq) {
      let activations: number;
      if (inExp006) {
        const [control, treatment] = carry.split("exp006", a.signups);
        const cAct = carry.take(`${a.channel}.act.c`, control * 0.4);
        const tAct = carry.take(`${a.channel}.act.t`, treatment * 0.46);
        arms.exp006.control.exposures += control;
        arms.exp006.control.conversions += cAct;
        arms.exp006.treatment.exposures += treatment;
        arms.exp006.treatment.conversions += tAct;
        activations = cAct + tAct;
      } else {
        activations = carry.take(`${a.channel}.act`, a.signups * 0.42);
      }

      const trials = carry.take(`${a.channel}.trial`, a.signups * 0.24);
      let paid: number;
      if (a.paidExpected !== undefined) {
        paid = a.paidExpected;
      } else if (inExp004) {
        const [control, treatment] = carry.split("exp004", trials);
        const cPaid = carry.take(`${a.channel}.paid.c`, control * 0.1);
        const tPaid = carry.take(`${a.channel}.paid.t`, treatment * 0.106);
        arms.exp004.control.exposures += control;
        arms.exp004.control.conversions += cPaid;
        arms.exp004.treatment.exposures += treatment;
        arms.exp004.treatment.conversions += tPaid;
        paid = cPaid + tPaid;
      } else {
        paid = carry.take(`${a.channel}.paid`, trials * 0.1);
      }

      let newMrr = 0;
      for (let i = 0; i < paid; i++) {
        customerCounter++;
        newMrr += customerCounter % 6 === 0 ? PLAN_BUSINESS : PLAN_TEAM;
      }
      dayNewMrr += newMrr;
      dayNewCustomers += paid;

      dayRows.push({
        day,
        channel: a.channel,
        impressions: a.impressions,
        clicks: a.clicks,
        visits: a.visits,
        signups: a.signups,
        activations,
        trials,
        paidConversions: paid,
        newMrr,
        churnedMrr: 0,
        mrr: 0,
        customers: 0,
        spend: round2(a.spend),
      });
    }

    const churnedMrr = round2(carry.take("churn.mrr", mrr * 0.00092 * 100) / 100);
    const churnedCustomers = carry.take("churn.customers", churnedMrr / 40.5);
    mrr = round2(mrr + dayNewMrr - churnedMrr);
    customers = customers + dayNewCustomers - churnedCustomers;

    channelRows.push(...dayRows);
    blendedRows.push({
      day,
      impressions: sum(dayRows, "impressions"),
      clicks: sum(dayRows, "clicks"),
      visits: sum(dayRows, "visits"),
      signups: sum(dayRows, "signups"),
      activations: sum(dayRows, "activations"),
      trials: sum(dayRows, "trials"),
      paidConversions: dayNewCustomers,
      newMrr: dayNewMrr,
      churnedMrr,
      mrr,
      customers,
      spend: round2(sum(dayRows, "spend")),
    });
  }

  arms.exp001.spend = round2(arms.exp001.spend);
  arms.exp003.spend = round2(arms.exp003.spend);
  arms.exp005.spend = round2(arms.exp005.spend);
  return { channelRows, blendedRows, arms };
}

function sum(rows: ChannelDayRow[], key: keyof DailyMetricsRow): number {
  return rows.reduce((s, r) => s + (r[key] as number), 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
