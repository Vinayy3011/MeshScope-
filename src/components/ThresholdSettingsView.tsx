import React, { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { DEFAULT_THRESHOLDS } from '../engine/meshSimulator';
import { AlertThresholds } from '../types/mesh';

interface ThresholdSettingsViewProps {
  thresholds: AlertThresholds;
  onSaveThresholds: (next: AlertThresholds) => void;
}

export const ThresholdSettingsView: React.FC<ThresholdSettingsViewProps> = ({
  thresholds,
  onSaveThresholds,
}) => {
  const [draft, setDraft] = useState<AlertThresholds>(thresholds);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThresholds(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_THRESHOLDS });
    onSaveThresholds({ ...DEFAULT_THRESHOLDS });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <section className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          Automated Alert Threshold Policy
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure warning and critical triggers evaluated continuously across every active mesh node.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Latency Warning Threshold (ms)
            </label>
            <input
              type="number"
              min={10}
              max={500}
              step={1}
              value={draft.latencyWarningMs}
              onChange={(e) =>
                setDraft({ ...draft, latencyWarningMs: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Flags multi-hop queueing or minor RF contention.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Latency Critical Threshold (ms)
            </label>
            <input
              type="number"
              min={20}
              max={1000}
              step={1}
              value={draft.latencyCriticalMs}
              onChange={(e) =>
                setDraft({ ...draft, latencyCriticalMs: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Triggers critical alert for real-time voice/control degradation.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Packet Loss Warning (%)
            </label>
            <input
              type="number"
              min={0.2}
              max={50}
              step={0.1}
              value={draft.packetLossWarningPct}
              onChange={(e) =>
                setDraft({ ...draft, packetLossWarningPct: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Packet Loss Critical (%)
            </label>
            <input
              type="number"
              min={0.5}
              max={90}
              step={0.5}
              value={draft.packetLossCriticalPct}
              onChange={(e) =>
                setDraft({ ...draft, packetLossCriticalPct: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Minimum Per-Node Throughput Floor (Mbps)
            </label>
            <input
              type="number"
              min={5}
              max={500}
              step={5}
              value={draft.minThroughputMbps}
              onChange={(e) =>
                setDraft({ ...draft, minThroughputMbps: Number(e.target.value) })
              }
              className="w-full sm:w-1/2 px-3 py-2 text-sm font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Nodes falling below this effective bandwidth trigger throughput degradation alerts.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Policy updated
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500"
            >
              <Save className="h-3.5 w-3.5" />
              Apply Threshold Policy
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
