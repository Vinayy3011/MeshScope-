import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';
import { FaultMode, MeshAlert, MeshNode } from '../types/mesh';

interface AlertsPanelProps {
  alerts: MeshAlert[];
  nodes: MeshNode[];
  onAcknowledge: (alertId: string) => void;
  onAcknowledgeAll: () => void;
  onClearResolved: () => void;
  onRecoverNode: (nodeId: string, fault: FaultMode) => void;
  onInspectNode: (nodeId: string) => void;
  compact?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  nodes,
  onAcknowledge,
  onAcknowledgeAll,
  onClearResolved,
  onRecoverNode,
  onInspectNode,
  compact = false,
}) => {
  const [filter, setFilter] = useState<'active' | 'critical' | 'resolved' | 'all'>('active');

  const nodeFaultMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.faultMode])),
    [nodes]
  );

  const visibleAlerts = useMemo(() => {
    const list = alerts.filter((a) => {
      if (filter === 'active') return !a.resolved;
      if (filter === 'critical') return !a.resolved && a.severity === 'critical';
      if (filter === 'resolved') return a.resolved;
      return true;
    });
    return compact ? list.slice(0, 6) : list;
  }, [alerts, filter, compact]);

  const activeCount = alerts.filter((a) => !a.resolved).length;
  const criticalCount = alerts.filter((a) => !a.resolved && a.severity === 'critical').length;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Automated Connectivity Alerts
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {activeCount} active · {criticalCount} critical
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['active', 'critical', 'resolved', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors whitespace-nowrap ${
                  filter === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onAcknowledgeAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Acknowledge All
            </button>
          )}
          {alerts.some((a) => a.resolved) && (
            <button
              type="button"
              onClick={onClearResolved}
              className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Clear Resolved
            </button>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {visibleAlerts.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No {filter === 'all' ? '' : filter} connectivity alerts
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              All monitored mesh links are operating within configured latency, packet loss, and throughput thresholds. Trigger a fault preset in the sidebar to test automated alerting.
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const hasActiveFault = (nodeFaultMap.get(alert.nodeId) ?? 'none') !== 'none';
            return (
              <div
                key={alert.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {alert.resolved ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : alert.severity === 'critical' ? (
                      <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold uppercase tracking-wide ${
                          alert.resolved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : alert.severity === 'critical'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {alert.resolved ? 'Resolved' : alert.severity}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspectNode(alert.nodeId)}
                        className="font-mono font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        {alert.nodeId} ({alert.nodeLabel})
                      </button>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {alert.timeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Recommendation: {alert.recommendation}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!alert.resolved && hasActiveFault && (
                    <button
                      type="button"
                      onClick={() => onRecoverNode(alert.nodeId, 'none')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
                    >
                      <Wrench className="h-3 w-3" />
                      Recover Node
                    </button>
                  )}
                  {!alert.resolved && !alert.acknowledged && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(alert.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      <Check className="h-3 w-3" />
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolved && alert.acknowledged && (
                    <span className="text-[11px] font-mono text-slate-400 px-2">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
