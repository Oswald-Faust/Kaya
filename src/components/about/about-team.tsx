"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/marketing/motion";
import { ClayStar, ClaySquiggle } from "@/components/brand/clay";
import { LayoutGrid, Table, MapPin, Sparkles, Search } from "lucide-react";
import Image from "next/image";

type Department = "All" | "Leadership" | "Intelligence" | "Growth" | "Design";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: Department;
  location: string;
  avatar: string;
  background: string;
  superpower: string;
  bio: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "alex-v",
    name: "Alexandre V.",
    role: "Co-founder & CEO",
    department: "Leadership",
    location: "Paris / SF",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    background: "Ex-SaaS Founder, 2x YC Alum",
    superpower: "Obsessed with CAC payback economics",
    bio: "Built and sold two developer tools. Experienced firsthand the pain of spending $20k/mo on ad managers that delivered zero pipeline.",
  },
  {
    id: "elena-r",
    name: "Elena Rostova",
    role: "Co-founder & CTO",
    department: "Leadership",
    location: "Paris",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    background: "PhD in Autonomous Systems, Inria",
    superpower: "Zero-latency tool execution pipelines",
    bio: "Researched multi-agent coordination and probabilistic verification. Leads Kaya's deterministic agent runtime and safety kernels.",
  },
  {
    id: "marcus-k",
    name: "Marcus Klein",
    role: "Head of Agent Intelligence",
    department: "Intelligence",
    location: "Berlin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    background: "Ex-Staff AI Engineer at DeepMind",
    superpower: "Structured grounding without hallucinations",
    bio: "Designs the knowledge extraction crawler and verification engines that link live website evidence to business facts.",
  },
  {
    id: "claire-d",
    name: "Claire Dubois",
    role: "Principal Product Designer",
    department: "Design",
    location: "Lyon",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    background: "Ex-Linear, Clay Design Partner",
    superpower: "Micro-interactions & clay tactile systems",
    bio: "Believes software should be calm, legible, and fun. Crafted Kaya's design tokens, command palette, and clay illustration language.",
  },
  {
    id: "tariq-m",
    name: "Tariq Mansour",
    role: "Growth Systems Architect",
    department: "Growth",
    location: "London",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    background: "Former Head of Growth at Revolut",
    superpower: "Multi-touch causal attribution modeling",
    bio: "Engineered the Channel Fit Score algorithm and deterministic experiment lifecycle ranking from statistical first principles.",
  },
  {
    id: "sarah-l",
    name: "Sarah Lin",
    role: "Senior Security & Governance Engineer",
    department: "Intelligence",
    location: "San Francisco",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    background: "Ex-Cloudflare Security Team",
    superpower: "Prompt-injection defense & immutable triggers",
    bio: "Guarantees that Kaya's budget policies and approval engines remain tamper-proof at the database trigger layer.",
  },
  {
    id: "lucas-b",
    name: "Lucas Bernard",
    role: "Fullstack Platform Engineer",
    department: "Growth",
    location: "Bordeaux",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    background: "Core Next.js & Postgres Contributor",
    superpower: "Turbopack optimization & typed Drizzle schema",
    bio: "Maintains the 31-table tenant schema, fast integrations catalog, and real-time polling streams for the Command Center.",
  },
  {
    id: "maya-p",
    name: "Maya Patel",
    role: "Applied ML & Experimentation Lead",
    department: "Intelligence",
    location: "New York",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80",
    background: "MSc Statistics, Carnegie Mellon",
    superpower: "Poisson rate testing & sequential Bayes",
    bio: "Spearheaded the experiment evaluation suite, ensuring Kaya reliably stops losing ads before they waste founder capital.",
  },
];

export function AboutTeam() {
  const [activeDept, setActiveDept] = useState<Department>("All");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(() => {
    return TEAM_MEMBERS.filter((m) => {
      const matchesDept = activeDept === "All" || m.department === activeDept;
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.superpower.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [activeDept, searchQuery]);

  return (
    <section id="team" className="relative py-20 sm:py-28 bg-cream border-b border-line">
      {/* Decorative stars */}
      <div className="pointer-events-none absolute top-12 left-10 hidden sm:block">
        <ClayStar tone="lime" size={36} className="rotate-12 opacity-80" />
      </div>
      <div className="pointer-events-none absolute top-20 right-12 hidden sm:block">
        <ClaySquiggle tone="tangerine" width={110} height={40} className="-rotate-6 opacity-75" />
      </div>

      <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-xs font-semibold tracking-wider uppercase text-subtle">
              The People Behind The Agent
            </p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] font-[560] tracking-[-0.04em] text-ink">
              Meet the builders of Kaya
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-lg text-muted">
              Inspired by Clay&apos;s table view and MindMarket&apos;s human touch: a lean, multidisciplinary crew of engineers, statisticians, and designers dedicated to autonomous growth.
            </p>
          </Reveal>
        </div>

        {/* Database Controls Toolbar (Clay signature style) */}
        <div className="mt-12 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Department Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {(["All", "Leadership", "Intelligence", "Growth", "Design"] as Department[]).map((dept) => {
                const isActive = activeDept === dept;
                const count =
                  dept === "All"
                    ? TEAM_MEMBERS.length
                    : TEAM_MEMBERS.filter((m) => m.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-ink text-white shadow-sm"
                        : "bg-stone/50 text-ink hover:bg-stone"
                    }`}
                  >
                    <span>{dept}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-white text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right side controls: Search & View Switcher */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-subtle" />
                <input
                  type="text"
                  placeholder="Filter team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-40 sm:w-52 rounded-lg border border-line bg-cream/70 pl-8 pr-3 text-xs text-ink placeholder:text-subtle focus:border-agent focus:bg-surface focus:outline-none"
                />
              </div>

              {/* View Switcher: Table vs Grid */}
              <div className="flex items-center rounded-lg border border-line bg-stone/40 p-1">
                <button
                  onClick={() => setViewMode("table")}
                  title="Table view (Clay style)"
                  className={`flex size-7 items-center justify-center rounded-md text-xs transition-all ${
                    viewMode === "table" ? "bg-surface text-ink shadow-sm" : "text-subtle hover:text-ink"
                  }`}
                >
                  <Table className="size-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid view (MindMarket style)"
                  className={`flex size-7 items-center justify-center rounded-md text-xs transition-all ${
                    viewMode === "grid" ? "bg-surface text-ink shadow-sm" : "text-subtle hover:text-ink"
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table View (Clay database style) */}
          {viewMode === "table" ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-stone/30 font-mono uppercase tracking-wider text-[11px] text-subtle">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">Team Member</th>
                    <th className="py-3.5 px-4 font-medium">Role</th>
                    <th className="py-3.5 px-4 font-medium">Department</th>
                    <th className="py-3.5 px-4 font-medium">Location</th>
                    <th className="py-3.5 px-4 font-medium">Superpower / Focus</th>
                    <th className="py-3.5 px-4 font-medium">Prior Background</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="group transition-colors hover:bg-cream/60"
                    >
                      {/* Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-line bg-stone">
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-[560] text-ink text-[13px]">{member.name}</p>
                            <p className="text-[11px] text-muted sm:hidden">{member.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 font-medium text-ink">
                        {member.role}
                      </td>

                      {/* Department badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-stone px-2 py-0.5 font-mono text-[10px] text-ink font-medium">
                          {member.department}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-subtle" />
                          <span>{member.location}</span>
                        </span>
                      </td>

                      {/* Superpower */}
                      <td className="py-3 px-4 text-ink font-medium">
                        <span className="inline-flex items-center gap-1.5 text-agent">
                          <Sparkles className="size-3 shrink-0" />
                          <span>{member.superpower}</span>
                        </span>
                      </td>

                      {/* Background */}
                      <td className="py-3 px-4 text-muted">
                        {member.background}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-sm text-muted">
                  No team members matching your search.
                </div>
              )}
            </div>
          ) : (
            /* Grid View (MindMarket faces style) */
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <div>
                    <div className="relative mb-4 mx-auto size-24 overflow-hidden rounded-full border-2 border-line bg-stone shadow-inner">
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h4 className="text-base font-[560] text-ink">{member.name}</h4>
                      <p className="text-xs font-medium text-agent mt-0.5">{member.role}</p>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted">
                        <MapPin className="size-3 text-subtle" />
                        <span>{member.location}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-muted border-t border-line/70 pt-3">
                      {member.bio}
                    </p>
                  </div>
                  <div className="mt-4 rounded-lg bg-cream p-2.5 text-[11px]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-subtle block mb-1">Focus</span>
                    <span className="font-medium text-ink">{member.superpower}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
