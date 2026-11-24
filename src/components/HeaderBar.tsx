import React from 'react';
import { Download, Menu, Moon, Pause, Play, RotateCcw, Sun } from 'lucide-react';
import { DashboardTab } from './Sidebar';

interface HeaderBarProps {
  activeTab: DashboardTab;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  tickRateMs: number;
  onChangeTickRate: (ms: number) => void;
  onResetNetwork: () => void;
  onQuickExportPdf: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMobileNav: () => void;
  lastUpdatedLabel: string;
}

const TAB_TITLES: Record<DashboardTab, string> = {
  overview: 'Topology & Real-Time Telemetry',
  nodes: 'Node Diagnostics Matrix',
  alerts: 'Automated Connectivity Alerts',
  reports: 'Diagnostic PDF Reports',
  settings: 'Alert Threshold Policy',
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  isStreaming,
  onToggleStreaming,
  tickRateMs,
  onChangeTickRate,
  onResetNetwork,
  onQuickExportPdf,
  isDark,
  onToggleTheme,
  onOpenMobileNav,
  lastUpdatedLabel,
}) => {
  return (
    <header className="sticky top-0 z-10 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
            MeshScope
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      {/* Right: Stream Controls & Primary Export Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Real streaming telemetry status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pr-2 border-r border-slate-200 dark:border-slate-800">
          <span
            className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${
              isStreaming
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isStreaming ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-500'
              }`}
              aria-hidden="true"
            />
            {isStreaming ? 'Live Stream' : 'Paused'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[11px]">{lastUpdatedLabel}</span>
        </div>

        {/* Play / Pause & Interval */}
        <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
          <button
            type="button"
            onClick={onToggleStreaming}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            title={isStreaming ? 'Pause telemetry stream' : 'Resume telemetry stream'}
          >
            {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTickRate(tickRateMs === 1000 ? 500 : 1000)}
            className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 ${
              tickRateMs === 500
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Toggle sampling rate (1s vs 0.5s)"
          >
            {tickRateMs === 500 ? '2x' : '1x'}
          </button>
        </div>

        <button
          type="button"
          onClick={onResetNetwork}
          className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Reset topology & clear faults"
          aria-label="Reset topology"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={onQuickExportPdf}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export PDF Report</span>
        </button>
      </div>
    </header>
  );
};
