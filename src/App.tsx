/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { AlertsPanel } from './components/AlertsPanel';
import { HeaderBar } from './components/HeaderBar';
import { KpiStrip } from './components/KpiStrip';
import { NodeTable } from './components/NodeTable';
import { ReportPreviewView } from './components/ReportPreviewView';
import { DashboardTab, Sidebar } from './components/Sidebar';
import { TelemetryCharts } from './components/TelemetryCharts';
import { ThresholdSettingsView } from './components/ThresholdSettingsView';
import { TopologyCanvas } from './components/TopologyCanvas';
import {
  addCustomMeshNode,
  applyScenarioPreset,
  createInitialMeshState,
  stepMeshSimulation,
} from './engine/meshSimulator';
import {
  AlertThresholds,
  FaultMode,
  FrequencyBand,
  MeshNetworkState,
  NodeRole,
  RoutingProtocol,
  ScenarioPreset,
} from './types/mesh';
import { generateNetworkDiagnosticPdf, PdfReportOptions } from './utils/pdfReportGenerator';

export default function App() {
  const [networkState, setNetworkState] = useState<MeshNetworkState>(() =>
    createInitialMeshState()
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('GW-01');
  const [isStreaming, setIsStreaming] = useState(true);
  const [tickRateMs, setTickRateMs] = useState(1000);
  const [isDark, setIsDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setInterval(() => {
      setNetworkState((prev) => stepMeshSimulation(prev));
    }, tickRateMs);
    return () => window.clearInterval(timer);
  }, [isStreaming, tickRateMs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const activeAlerts = useMemo(
    () => networkState.alerts.filter((a) => !a.resolved),
    [networkState.alerts]
  );

  const criticalAlerts = useMemo(
    () => activeAlerts.filter((a) => a.severity === 'critical'),
    [activeAlerts]
  );

  const unackCritical = useMemo(
    () => criticalAlerts.filter((a) => !a.acknowledged),
    [criticalAlerts]
  );

  const lastSample =
    networkState.telemetryHistory[networkState.telemetryHistory.length - 1];

  const handleMoveNode = (id: string, x: number, y: number) => {
    setNetworkState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  };

  const handleSetNodeFault = (id: string, fault: FaultMode) => {
    setNetworkState((prev) =>
      stepMeshSimulation({
        ...prev,
        activeScenario: fault === 'none' ? prev.activeScenario : 'nominal',
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, faultMode: fault } : n)),
      })
    );
  };

  const handleApplyScenario = (preset: ScenarioPreset) => {
    setNetworkState((prev) => applyScenarioPreset(prev, preset));
  };

  const handleAddNode = (config: {
    label: string;
    zone: string;
    role: NodeRole;
    band: FrequencyBand;
    channel: number;
  }) => {
    setNetworkState((prev) => {
      const updated = addCustomMeshNode(prev, config);
      const newest = updated.nodes[updated.nodes.length - 1];
      if (newest) setSelectedNodeId(newest.id);
      return updated;
    });
  };

  const handleChangeProtocol = (protocol: RoutingProtocol) => {
    setNetworkState((prev) => ({ ...prev, protocol }));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setNetworkState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
  };

  const handleAcknowledgeAll = () => {
    setNetworkState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        !a.resolved ? { ...a, acknowledged: true } : a
      ),
    }));
  };

  const handleClearResolved = () => {
    setNetworkState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => !a.resolved),
    }));
  };

  const handleSaveThresholds = (next: AlertThresholds) => {
    setNetworkState((prev) =>
      stepMeshSimulation({
        ...prev,
        thresholds: next,
      })
    );
  };

  const handleResetNetwork = () => {
    setNetworkState(createInitialMeshState());
    setSelectedNodeId('GW-01');
    showToast('Topology & telemetry reset to nominal baseline.');
  };

  const handleGeneratePdf = (options: PdfReportOptions): string => {
    const filename = generateNetworkDiagnosticPdf(networkState, options);
    showToast(`Exported PDF report: ${filename}`);
    return filename;
  };

  const handleQuickExportPdf = () => {
    handleGeneratePdf({
      siteTitle: networkState.networkName,
      engineerName: 'NetOps Automated Export',
      notes:
        'Snapshot diagnostic export capturing live wireless mesh topology, multi-hop latency/loss trends, per-node RF link metrics, and automated alert logs.',
      includeTopology: true,
      includeCharts: true,
      includeNodeTable: true,
      includeAlertLog: true,
    });
  };

  const handleInspectNodeFromAlert = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeAlertCount={activeAlerts.length}
        criticalAlertCount={criticalAlerts.length}
        activeScenario={networkState.activeScenario}
        onApplyScenario={handleApplyScenario}
        protocol={networkState.protocol}
        onChangeProtocol={handleChangeProtocol}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <HeaderBar
          activeTab={activeTab}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming((v) => !v)}
          tickRateMs={tickRateMs}
          onChangeTickRate={setTickRateMs}
          onResetNetwork={handleResetNetwork}
          onQuickExportPdf={handleQuickExportPdf}
          isDark={isDark}
          onToggleTheme={() => setIsDark((v) => !v)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          lastUpdatedLabel={lastSample?.timeLabel ?? '--:--:--'}
        />

        <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Active Critical Incident Banner */}
          {unackCritical.length > 0 && activeTab !== 'alerts' && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-semibold text-rose-800 dark:text-rose-200">
                  {unackCritical.length} Critical Connectivity Alert
                  {unackCritical.length > 1 ? 's' : ''}:
                </span>
                <span className="text-rose-700 dark:text-rose-300 truncate">
                  {unackCritical[0].message}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                >
                  Open Alert Console
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyScenario('nominal')}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                >
                  Restore Nominal
                </button>
              </div>
            </div>
          )}

          {/* View Router */}
          {activeTab === 'overview' && (
            <>
              <KpiStrip
                history={networkState.telemetryHistory}
                thresholds={networkState.thresholds}
                activeAlertsCount={activeAlerts.length}
              />

              <TopologyCanvas
                nodes={networkState.nodes}
                links={networkState.links}
                protocol={networkState.protocol}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onMoveNode={handleMoveNode}
                onSetNodeFault={handleSetNodeFault}
                onAddNode={handleAddNode}
              />

              <TelemetryCharts
                history={networkState.telemetryHistory}
                thresholds={networkState.thresholds}
              />

              <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5">
                <div className="2xl:col-span-7">
                  <NodeTable
                    nodes={networkState.nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    onSetNodeFault={handleSetNodeFault}
                    compact
                  />
                </div>
                <div className="2xl:col-span-5">
                  <AlertsPanel
                    alerts={networkState.alerts}
                    nodes={networkState.nodes}
                    onAcknowledge={handleAcknowledgeAlert}
                    onAcknowledgeAll={handleAcknowledgeAll}
                    onClearResolved={handleClearResolved}
                    onRecoverNode={handleSetNodeFault}
                    onInspectNode={handleInspectNodeFromAlert}
                    compact
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'nodes' && (
            <>
              <KpiStrip
                history={networkState.telemetryHistory}
                thresholds={networkState.thresholds}
                activeAlertsCount={activeAlerts.length}
              />
              <NodeTable
                nodes={networkState.nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => {
                  setSelectedNodeId(id);
                  setActiveTab('overview');
                }}
                onSetNodeFault={handleSetNodeFault}
              />
            </>
          )}

          {activeTab === 'alerts' && (
            <AlertsPanel
              alerts={networkState.alerts}
              nodes={networkState.nodes}
              onAcknowledge={handleAcknowledgeAlert}
              onAcknowledgeAll={handleAcknowledgeAll}
              onClearResolved={handleClearResolved}
              onRecoverNode={handleSetNodeFault}
              onInspectNode={handleInspectNodeFromAlert}
            />
          )}

          {activeTab === 'reports' && (
            <ReportPreviewView
              networkState={networkState}
              onGeneratePdf={handleGeneratePdf}
            />
          )}

          {activeTab === 'settings' && (
            <ThresholdSettingsView
              thresholds={networkState.thresholds}
              onSaveThresholds={handleSaveThresholds}
            />
          )}
        </main>
      </div>

      {/* Export / Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
