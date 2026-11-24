import React from 'react';
import { AlertThresholds, TelemetrySample } from '../types/mesh';

interface KpiStripProps {
  history: TelemetrySample[];
  thresholds: AlertThresholds;
  activeAlertsCount: number;
}

function MiniSparkline({
  values,
  strokeColor,
}: {
  values: number[];
  strokeColor: string;
}) {
  if (values.length < 2) return null;
  const w = 84;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.01, max - min);

  const pts = values
    .map((v, idx) => {
      const x = (idx / (values.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  history,
  thresholds,
  activeAlertsCount,
}) => {
  const latest = history[history.length - 1];
  const prev = history[Math.max(0, history.length - 6)];

  const avgLat = latest?.avgLatencyMs ?? 0;
  const p95Lat = latest?.p95LatencyMs ?? 0;
  const latDelta = latest && prev ? latest.avgLatencyMs - prev.avgLatencyMs : 0;

  const avgLoss = latest?.avgPacketLossPct ?? 0;
  const lossDelta = latest && prev ? latest.avgPacketLossPct - prev.avgPacketLossPct : 0;

  const throughput = latest?.totalThroughputMbps ?? 0;
  const tpDelta = latest && prev ? latest.totalThroughputMbps - prev.totalThroughputMbps : 0;

  const activeNodes = latest?.activeNodes ?? 0;
  const totalNodes = latest?.totalNodes ?? 0;
  const activeLinks = latest?.activeLinks ?? 0;

  const latState =
    avgLat >= thresholds.latencyCriticalMs
      ? { label: 'Critical', cls: 'text-rose-600 dark:text-rose-400', stroke: '#DC2626' }
      : avgLat >= thresholds.latencyWarningMs
      ? { label: 'Elevated', cls: 'text-amber-600 dark:text-amber-400', stroke: '#D97706' }
      : { label: 'Nominal', cls: 'text-emerald-600 dark:text-emerald-400', stroke: '#0284C7' };

  const lossState =
    avgLoss >= thresholds.packetLossCriticalPct
      ? { label: 'Critical', cls: 'text-rose-600 dark:text-rose-400', stroke: '#DC2626' }
      : avgLoss >= thresholds.packetLossWarningPct
      ? { label: 'Degraded', cls: 'text-amber-600 dark:text-amber-400', stroke: '#D97706' }
      : { label: 'Nominal', cls: 'text-emerald-600 dark:text-emerald-400', stroke: '#0D9488' };

  const availState =
    activeNodes < totalNodes || activeAlertsCount > 0
      ? {
          label: activeNodes < totalNodes ? 'Failover Active' : `${activeAlertsCount} Active Alert`,
          cls: activeNodes < totalNodes ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
        }
      : { label: 'All Links Up', cls: 'text-emerald-600 dark:text-emerald-400' };

  return (
    <section
      aria-label="Key Network Metrics"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* Latency */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Mean Mesh Latency</span>
          <span className={`font-medium ${latState.cls}`}>{latState.label}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {avgLat.toFixed(1)}
            </span>
            <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">ms</span>
          </div>
          <MiniSparkline
            values={history.slice(-20).map((s) => s.avgLatencyMs)}
            strokeColor={latState.stroke}
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          <span>P95: {p95Lat.toFixed(1)} ms</span>
          <span aria-hidden="true">·</span>
          <span>
            {latDelta >= 0 ? '+' : ''}
            {latDelta.toFixed(1)} ms
          </span>
        </div>
      </div>

      {/* Packet Loss */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Mean Packet Loss</span>
          <span className={`font-medium ${lossState.cls}`}>{lossState.label}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {avgLoss.toFixed(2)}
            </span>
            <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">%</span>
          </div>
          <MiniSparkline
            values={history.slice(-20).map((s) => s.avgPacketLossPct)}
            strokeColor={lossState.stroke}
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          <span>Limit: {thresholds.packetLossCriticalPct.toFixed(1)}%</span>
          <span aria-hidden="true">·</span>
          <span>
            {lossDelta >= 0 ? '+' : ''}
            {lossDelta.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Throughput */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Aggregate Throughput</span>
          <span className="font-medium text-teal-700 dark:text-teal-400">Active Traffic</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {throughput.toFixed(0)}
            </span>
            <span className="ml-1 font-mono text-xs text-slate-500 dark:text-slate-400">Mbps</span>
          </div>
          <MiniSparkline
            values={history.slice(-20).map((s) => s.totalThroughputMbps)}
            strokeColor="#0D9488"
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          <span>{activeLinks} Active Links</span>
          <span aria-hidden="true">·</span>
          <span>
            {tpDelta >= 0 ? '+' : ''}
            {tpDelta.toFixed(0)} Mbps
          </span>
        </div>
      </div>

      {/* Mesh Availability */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Node Availability</span>
          <span className={`font-medium ${availState.cls}`}>{availState.label}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {activeNodes}
            </span>
            <span className="ml-1 font-mono text-sm text-slate-500 dark:text-slate-400">
              / {totalNodes} nodes
            </span>
          </div>
          <MiniSparkline
            values={history.slice(-20).map((s) => s.activeNodes)}
            strokeColor={activeNodes < totalNodes ? '#DC2626' : '#16A34A'}
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          <span>
            {totalNodes > 0 ? ((activeNodes / totalNodes) * 100).toFixed(0) : 0}% Reachable
          </span>
          <span aria-hidden="true">·</span>
          <span>{activeAlertsCount} Open Alerts</span>
        </div>
      </div>
    </section>
  );
};
