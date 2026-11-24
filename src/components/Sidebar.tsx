import React from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  Network,
  Radio,
  Server,
  Sliders,
  X,
} from 'lucide-react';
import { RoutingProtocol, ScenarioPreset } from '../types/mesh';

export type DashboardTab = 'overview' | 'nodes' | 'alerts' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeAlertCount: number;
  criticalAlertCount: number;
  activeScenario: ScenarioPreset;
  onApplyScenario: (preset: ScenarioPreset) => void;
  protocol: RoutingProtocol;
  onChangeProtocol: (protocol: RoutingProtocol) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Topology & Telemetry', icon: Network },
  { id: 'nodes', label: 'Node Diagnostics', icon: Server },
  { id: 'alerts', label: 'Alert Console', icon: AlertTriangle },
  { id: 'reports', label: 'Diagnostic Reports', icon: FileText },
  { id: 'settings', label: 'Alert Thresholds', icon: Sliders },
];

const SCENARIOS: Array<{ id: ScenarioPreset; label: string; detail: string }> = [
  { id: 'nominal', label: 'Nominal Baseline', detail: 'Healthy multi-hop RF mesh' },
  { id: 'rf_interference', label: 'RF Interference', detail: 'Noise burst on R-02 & E-04' },
  { id: 'backbone_congestion', label: 'Backbone Congestion', detail: 'Queue saturation on R-03/04' },
  { id: 'node_failover', label: 'Node Failover Test', detail: 'Drop R-01 & reroute traffic' },
];

const PROTOCOLS: RoutingProtocol[] = ['HWMP (802.11s)', 'OLSRv2', 'BATMAN-adv'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAlertCount,
  criticalAlertCount,
  activeScenario,
  onApplyScenario,
  protocol,
  onChangeProtocol,
  mobileOpen,
  onCloseMobile,
}) => {
  const sidebarBody = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 dark:bg-teal-600 text-white shrink-0">
              <Radio className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              MeshScope
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 py-4 space-y-1" aria-label="Primary Navigation">
          <div className="px-2.5 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Monitoring Views
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'alerts' && activeAlertCount > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900'
                        : criticalAlertCount > 0
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Routing Protocol Selector */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <label
            htmlFor="routing-protocol-select"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
          >
            Routing Protocol View
          </label>
          <select
            id="routing-protocol-select"
            value={protocol}
            onChange={(e) => onChangeProtocol(e.target.value as RoutingProtocol)}
            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {PROTOCOLS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Fault & Stress Simulation Presets */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="px-1.5 pb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5" />
            <span>Fault Simulation Presets</span>
          </div>
          <div className="space-y-1">
            {SCENARIOS.map((sc) => {
              const selected = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onApplyScenario(sc.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md border transition-colors ${
                    selected
                      ? 'border-teal-600/50 bg-teal-50/70 dark:bg-teal-950/30 text-slate-900 dark:text-slate-100'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold leading-tight">{sc.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {sc.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="font-medium text-slate-700 dark:text-slate-300">Sector 04 Campus Mesh</div>
        <div className="mt-0.5 font-mono text-[11px]">2.4 / 5 / 6 GHz Multi-Hop</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0 z-20">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">{sidebarBody}</aside>
        </div>
      )}
    </>
  );
};
