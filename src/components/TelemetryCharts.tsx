import React, { useState } from 'react';
import { AlertThresholds, TelemetrySample } from '../types/mesh';

interface TelemetryChartsProps {
  history: TelemetrySample[];
  thresholds: AlertThresholds;
}

interface ChartConfig {
  id: 'latency' | 'loss' | 'throughput';
  title: string;
  unit: string;
  color: string;
  secondaryColor?: string;
  thresholdValue?: number;
  thresholdLabel?: string;
  getValue: (s: TelemetrySample) => number;
  getSecondaryValue?: (s: TelemetrySample) => number;
  secondaryLabel?: string;
  minMaxBound: number;
  decimals: number;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  history,
  thresholds,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const configs: ChartConfig[] = [
    {
      id: 'latency',
      title: 'Network Latency (Avg & P95)',
      unit: 'ms',
      color: '#0284C7',
      secondaryColor: '#94A3B8',
      secondaryLabel: 'P95',
      thresholdValue: thresholds.latencyCriticalMs,
      thresholdLabel: `Crit ${thresholds.latencyCriticalMs}ms`,
      getValue: (s) => s.avgLatencyMs,
      getSecondaryValue: (s) => s.p95LatencyMs,
      minMaxBound: 110,
      decimals: 1,
    },
    {
      id: 'loss',
      title: 'Packet Loss Rate',
      unit: '%',
      color: '#D97706',
      thresholdValue: thresholds.packetLossCriticalPct,
      thresholdLabel: `Crit ${thresholds.packetLossCriticalPct}%`,
      getValue: (s) => s.avgPacketLossPct,
      minMaxBound: 8,
      decimals: 2,
    },
    {
      id: 'throughput',
      title: 'Aggregate Mesh Throughput',
      unit: 'Mbps',
      color: '#0D9488',
      getValue: (s) => s.totalThroughputMbps,
      minMaxBound: 600,
      decimals: 0,
    },
  ];

  const svgW = 380;
  const svgH = 175;
  const padL = 38;
  const padR = 12;
  const padT = 16;
  const padB = 24;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const activeSample =
    hoverIdx !== null && history[hoverIdx]
      ? history[hoverIdx]
      : history[history.length - 1];

  return (
    <section
      aria-label="Real-Time Telemetry Charts"
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {configs.map((cfg) => {
        const primaryValues = history.map(cfg.getValue);
        const secondaryValues = cfg.getSecondaryValue
          ? history.map(cfg.getSecondaryValue)
          : [];
        const rawMax = Math.max(
          cfg.minMaxBound,
          ...primaryValues,
          ...secondaryValues,
          cfg.thresholdValue ?? 0
        );
        const maxVal = rawMax * 1.12;

        const buildPath = (vals: number[]) =>
          vals
            .map((v, i) => {
              const x = padL + (i / Math.max(1, vals.length - 1)) * plotW;
              const y = padT + plotH - (Math.min(v, maxVal) / maxVal) * plotH;
              return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ');

        const primaryPath = buildPath(primaryValues);
        const secondaryPath = secondaryValues.length > 0 ? buildPath(secondaryValues) : '';

        const currentDisplay = activeSample ? cfg.getValue(activeSample) : 0;
        const thresholdY =
          cfg.thresholdValue !== undefined
            ? padT + plotH - (Math.min(cfg.thresholdValue, maxVal) / maxVal) * plotH
            : null;

        const activeX =
          hoverIdx !== null && history.length > 1
            ? padL + (hoverIdx / (history.length - 1)) * plotW
            : null;

        return (
          <div
            key={cfg.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4"
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="font-display text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                {cfg.title}
              </h3>
              <div className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {currentDisplay.toFixed(cfg.decimals)} {cfg.unit}
                {activeSample && hoverIdx !== null && (
                  <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                    @ {activeSample.timeLabel}
                  </span>
                )}
              </div>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-44 cursor-crosshair select-none"
              onMouseMove={(e) => {
                if (history.length < 2) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgW;
                const clamped = Math.max(padL, Math.min(padL + plotW, relX));
                const idx = Math.round(((clamped - padL) / plotW) * (history.length - 1));
                setHoverIdx(idx);
              }}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const gy = padT + plotH * t;
                const labelVal = maxVal * (1 - t);
                return (
                  <g key={t}>
                    <line
                      x1={padL}
                      y1={gy}
                      x2={padL + plotW}
                      y2={gy}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth={1}
                    />
                    <text
                      x={padL - 5}
                      y={gy + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px]"
                    >
                      {labelVal.toFixed(cfg.decimals === 2 ? 1 : 0)}
                    </text>
                  </g>
                );
              })}

              {/* Threshold Line */}
              {thresholdY !== null && (
                <g>
                  <line
                    x1={padL}
                    y1={thresholdY}
                    x2={padL + plotW}
                    y2={thresholdY}
                    stroke="#DC2626"
                    strokeOpacity={0.55}
                    strokeDasharray="4 3"
                    strokeWidth={1}
                  />
                  <text
                    x={padL + plotW - 2}
                    y={thresholdY - 4}
                    textAnchor="end"
                    className="fill-rose-600 dark:fill-rose-400 font-mono text-[8.5px]"
                  >
                    {cfg.thresholdLabel}
                  </text>
                </g>
              )}

              {/* Secondary Series (P95) */}
              {secondaryPath && (
                <path
                  d={secondaryPath}
                  fill="none"
                  stroke={cfg.secondaryColor}
                  strokeWidth={1.35}
                  strokeDasharray="3 2"
                />
              )}

              {/* Primary Series */}
              {primaryPath && (
                <path
                  d={primaryPath}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover Crosshair */}
              {activeX !== null && activeSample && (
                <g>
                  <line
                    x1={activeX}
                    y1={padT}
                    x2={activeX}
                    y2={padT + plotH}
                    className="stroke-slate-400 dark:stroke-slate-500"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={activeX}
                    cy={
                      padT +
                      plotH -
                      (Math.min(cfg.getValue(activeSample), maxVal) / maxVal) * plotH
                    }
                    r={3.5}
                    fill={cfg.color}
                    className="stroke-white dark:stroke-slate-900"
                    strokeWidth={1.5}
                  />
                </g>
              )}

              {/* X-axis Start & End Timestamps */}
              {history.length > 1 && (
                <>
                  <text
                    x={padL}
                    y={svgH - 6}
                    textAnchor="start"
                    className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px]"
                  >
                    {history[0].timeLabel}
                  </text>
                  <text
                    x={padL + plotW}
                    y={svgH - 6}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 font-mono text-[9px]"
                  >
                    {history[history.length - 1].timeLabel}
                  </text>
                </>
              )}
            </svg>
          </div>
        );
      })}
    </section>
  );
};
