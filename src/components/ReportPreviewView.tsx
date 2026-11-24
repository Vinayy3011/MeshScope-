import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { MeshNetworkState } from '../types/mesh';
import { exportTelemetryCsv } from '../utils/csvExport';
import { PdfReportOptions } from '../utils/pdfReportGenerator';

interface ReportPreviewViewProps {
  networkState: MeshNetworkState;
  onGeneratePdf: (options: PdfReportOptions) => string;
}

export const ReportPreviewView: React.FC<ReportPreviewViewProps> = ({
  networkState,
  onGeneratePdf,
}) => {
  const [siteTitle, setSiteTitle] = useState(networkState.networkName);
  const [engineerName, setEngineerName] = useState('NetOps Diagnostics Team');
  const [notes, setNotes] = useState(
    'Scheduled wireless mesh health audit evaluating multi-hop latency stability, RF interference resilience, and gateway backhaul capacity.'
  );
  const [includeTopology, setIncludeTopology] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeNodeTable, setIncludeNodeTable] = useState(true);
  const [includeAlertLog, setIncludeAlertLog] = useState(true);
  const [lastExportMsg, setLastExportMsg] = useState<string | null>(null);

  const history = networkState.telemetryHistory;
  const meanLat =
    history.reduce((s, t) => s + t.avgLatencyMs, 0) / Math.max(1, history.length);
  const peakLat = Math.max(0, ...history.map((t) => t.p95LatencyMs));
  const meanLoss =
    history.reduce((s, t) => s + t.avgPacketLossPct, 0) / Math.max(1, history.length);
  const meanTp =
    history.reduce((s, t) => s + t.totalThroughputMbps, 0) / Math.max(1, history.length);

  const handleDownloadPdf = (e: React.FormEvent) => {
    e.preventDefault();
    const file = onGeneratePdf({
      siteTitle,
      engineerName,
      notes,
      includeTopology,
      includeCharts,
      includeNodeTable,
      includeAlertLog,
    });
    setLastExportMsg(`Downloaded PDF report: ${file}`);
  };

  const handleDownloadCsv = () => {
    const file = exportTelemetryCsv(networkState);
    setLastExportMsg(`Downloaded CSV telemetry log: ${file}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Report Configuration Form */}
      <form
        onSubmit={handleDownloadPdf}
        className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
      >
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Configure Diagnostic Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate a multi-page PDF document with embedded topology & telemetry charts
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Network / Site Title
          </label>
          <input
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prepared By
          </label>
          <input
            type="text"
            value={engineerName}
            onChange={(e) => setEngineerName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Diagnostic Engineering Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Included Report Sections
          </div>
          {[
            {
              label: 'Live Mesh Topology Snapshot (PNG)',
              checked: includeTopology,
              toggle: setIncludeTopology,
            },
            {
              label: 'Time-Series Latency, Loss & Throughput Charts',
              checked: includeCharts,
              toggle: setIncludeCharts,
            },
            {
              label: 'Per-Node RF & Routing Matrix Table',
              checked: includeNodeTable,
              toggle: setIncludeNodeTable,
            },
            {
              label: 'Automated Connectivity Alert & Action Log',
              checked: includeAlertLog,
              toggle: setIncludeAlertLog,
            },
          ].map((sec) => (
            <label
              key={sec.label}
              className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={sec.checked}
                onChange={(e) => sec.toggle(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
              <span>{sec.label}</span>
            </label>
          ))}
        </div>

        <div className="pt-3 flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF Report
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Raw CSV
          </button>
        </div>

        {lastExportMsg && (
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 pt-1">
            {lastExportMsg}
          </div>
        )}
      </form>

      {/* Right: Report Data Preview Sheet */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              <span>DIAGNOSTIC PREVIEW · {networkState.protocol}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {siteTitle}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prepared by {engineerName} · {history.length} telemetry samples captured
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Window Avg Latency</div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {meanLat.toFixed(1)} ms
            </div>
          </div>
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Peak P95 Latency</div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {peakLat.toFixed(1)} ms
            </div>
          </div>
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Window Avg Loss</div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {meanLoss.toFixed(2)}%
            </div>
          </div>
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Mean Throughput</div>
            <div className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {meanTp.toFixed(0)} Mbps
            </div>
          </div>
        </div>

        {/* Node Snapshot List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Node Health Snapshot ({networkState.nodes.length} Nodes)
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 px-3">Node</th>
                  <th className="py-2 px-3 text-right">Hops</th>
                  <th className="py-2 px-3 text-right">Latency</th>
                  <th className="py-2 px-3 text-right">Loss</th>
                  <th className="py-2 px-3 text-right">Throughput</th>
                  <th className="py-2 px-3 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                {networkState.nodes.map((n) => (
                  <tr key={n.id}>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {n.id} · {n.label}
                    </td>
                    <td className="py-1.5 px-3 text-right">{n.hopCount ?? '—'}</td>
                    <td className="py-1.5 px-3 text-right">
                      {n.status === 'offline' ? '—' : `${n.latencyMs.toFixed(1)} ms`}
                    </td>
                    <td className="py-1.5 px-3 text-right">{n.packetLossPct.toFixed(2)}%</td>
                    <td className="py-1.5 px-3 text-right">
                      {n.status === 'offline' ? '—' : `${n.throughputMbps.toFixed(0)} Mbps`}
                    </td>
                    <td
                      className={`py-1.5 px-3 text-right uppercase font-sans font-semibold ${
                        n.status === 'nominal'
                          ? 'text-emerald-600'
                          : n.status === 'warning'
                          ? 'text-amber-600'
                          : n.status === 'critical'
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {n.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recorded Alerts Summary */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Incident Log Summary ({networkState.alerts.length} Total Events)
          </h4>
          {networkState.alerts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No threshold breaches or node dropouts recorded in the active session.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {networkState.alerts.slice(0, 5).map((a) => (
                <li key={a.id} className="font-mono text-[11px]">
                  [{a.timeLabel}] {a.severity.toUpperCase()} {a.nodeId}: {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
