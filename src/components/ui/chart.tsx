"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/cn";

export interface ChartPoint {
  x: string;
  y: number;
}

export interface ChartMarker {
  x: string;
  label: string;
}

export function ChartContainer({ title, value, children, actions, className }: { title: string; value?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{title}</p>
          {value && <div className="mt-0.5 text-lg font-semibold tracking-tight tabular">{value}</div>}
        </div>
        {actions}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * Minimal line/area chart with a hover crosshair and annotation markers
 * (experiment launches). Purely presentational: values arrive pre-computed.
 */
export function AreaChart({
  data,
  markers = [],
  height = 160,
  format = (n) => String(Math.round(n)),
  formatX = (x) => x,
  tone = "ink",
}: {
  data: ChartPoint[];
  markers?: ChartMarker[];
  height?: number;
  format?: (n: number) => string;
  formatX?: (x: string) => string;
  tone?: "ink" | "agent";
}) {
  const gradientId = useId();
  const { t } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const pad = { top: 8, bottom: 20 };

  const { path, area, points, max, min } = useMemo(() => {
    const ys = data.map((d) => d.y);
    const max = Math.max(...ys, 0);
    const min = Math.min(...ys, 0);
    const span = max - min || 1;
    const innerH = height - pad.top - pad.bottom;
    const points = data.map((d, i) => ({
      x: data.length === 1 ? width / 2 : (i / (data.length - 1)) * width,
      y: pad.top + innerH - ((d.y - min) / span) * innerH,
    }));
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${path} L${width},${height - pad.bottom} L0,${height - pad.bottom} Z`;
    return { path, area, points, max, min };
  }, [data, height, pad.bottom, pad.top]);

  if (data.length === 0) {
    return <div className="grid place-items-center text-xs text-subtle" style={{ height }}>{t.ui.chart.noData}</div>;
  }

  const stroke = tone === "agent" ? "var(--color-agent)" : "var(--color-ink)";
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full overflow-visible"
        style={{ height }}
        role="img"
        aria-label={fmt(t.ui.chart.label, { from: formatX(data[0].x), to: formatX(data[data.length - 1].x), min: format(min), max: format(max) })}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={width} y1={height - pad.bottom} y2={height - pad.bottom} stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
        {markers.map((m) => {
          const i = data.findIndex((d) => d.x === m.x);
          if (i < 0) return null;
          return (
            <line
              key={m.x + m.label}
              x1={points[i].x}
              x2={points[i].x}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="var(--color-agent)"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              opacity={0.6}
            />
          );
        })}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover !== null && (
          <line x1={points[hover].x} x2={points[hover].x} y1={pad.top} y2={height - pad.bottom} stroke="var(--color-line-strong)" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {markers.map((m) => {
        const i = data.findIndex((d) => d.x === m.x);
        if (i < 0) return null;
        return (
          <span
            key={`label-${m.x}-${m.label}`}
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-sm bg-agent-soft px-1 text-[10px] font-medium text-agent"
            style={{ left: `${(points[i].x / width) * 100}%` }}
          >
            {m.label}
          </span>
        );
      })}
      <div className="mt-1 flex justify-between text-2xs text-subtle tabular">
        <span>{formatX(data[0].x)}</span>
        <span>{formatX(data[data.length - 1].x)}</span>
      </div>
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-2xs text-white tabular"
          style={{ left: `${(points[hover].x / width) * 100}%` }}
        >
          {formatX(hovered.x)} · {format(hovered.y)}
        </div>
      )}
    </div>
  );
}

/** Tiny inline trend line for table rows and metric footers. */
export function Sparkline({ values, className, tone = "ink" }: { values: number[]; className?: string; tone?: "ink" | "positive" | "negative" }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * 60).toFixed(1)},${(18 - ((v - min) / span) * 16).toFixed(1)}`)
    .join(" ");
  const color = tone === "positive" ? "var(--color-positive)" : tone === "negative" ? "var(--color-negative)" : "var(--color-muted)";
  return (
    <svg viewBox="0 0 60 20" className={cn("h-5 w-15", className)} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
