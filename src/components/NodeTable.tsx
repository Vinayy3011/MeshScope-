import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { FaultMode, MeshNode, NodeStatus } from '../types/mesh';

interface NodeTableProps {
  nodes: MeshNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onSetNodeFault: (id: string, fault: FaultMode) => void;
  compact?: boolean;
}

type SortKey = 'id' | 'hopCount' | 'latencyMs' | 'packetLossPct' | 'throughputMbps' | 'rssiDbm';

export const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onSetNodeFault,
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === 'id' || key === 'hopCount');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nodes
      .filter((n) => {
        if (statusFilter !== 'all' && n.status !== statusFilter) return false;
        if (!q) return true;
        return (
          n.id.toLowerCase().includes(q) ||
          n.label.toLowerCase().includes(q) ||
          n.zone.toLowerCase().includes(q) ||
          n.ip.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
        else if (sortKey === 'hopCount') cmp = (a.hopCount ?? 99) - (b.hopCount ?? 99);
        else cmp = (a[sortKey] as number) - (b[sortKey] as number);
        return sortAsc ? cmp : -cmp;
      });
  }, [nodes, query, statusFilter, sortKey, sortAsc]);

  const statusText = (s: NodeStatus) => {
    if (s === 'nominal') return 'Nominal';
    if (s === 'warning') return 'Warning';
    if (s === 'critical') return 'Critical';
    return 'Offline';
  };

  const statusColor = (s: NodeStatus) => {
    if (s === 'nominal') return 'text-emerald-700 dark:text-emerald-400';
    if (s === 'warning') return 'text-amber-700 dark:text-amber-400';
    if (s === 'critical') return 'text-rose-700 dark:text-rose-400';
    return 'text-slate-500 dark:text-slate-400';
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Mesh Node Performance Matrix
          </h2>
          {!compact && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time per-node RF link metrics, hop distance, and route health
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Status Filter */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['all', 'nominal', 'warning', 'critical', 'offline'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter node, IP, zone..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-44 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort('id')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Node
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">Role / Radio</th>
              <th className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('hopCount')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Hops
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('latencyMs')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Latency
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('packetLossPct')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Loss
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('throughputMbps')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Throughput
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('rssiDbm')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  RSSI / SNR
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-4 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No mesh nodes match the current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((n) => {
                const isSelected = selectedNodeId === n.id;
                return (
                  <tr
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-50/50 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        <span className="font-mono">{n.id}</span> · {n.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {n.zone} · {n.ip}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                      <span className="capitalize">{n.role}</span> · {n.band} Ch {n.channel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {n.hopCount === null ? '—' : n.hopCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {n.status === 'offline' ? '—' : `${n.latencyMs.toFixed(1)} ms`}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium ${
                        n.packetLossPct >= 5
                          ? 'text-rose-600 dark:text-rose-400'
                          : n.packetLossPct >= 2
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {n.packetLossPct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {n.status === 'offline' ? '—' : `${n.throughputMbps.toFixed(1)} Mbps`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {n.status === 'offline'
                        ? '—'
                        : `${n.rssiDbm.toFixed(0)} dBm / ${n.snrDb.toFixed(0)} dB`}
                    </td>
                    <td className={`py-2.5 px-3 font-medium whitespace-nowrap ${statusColor(n.status)}`}>
                      {statusText(n.status)}
                    </td>
                    <td
                      className="py-2.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {n.faultMode !== 'none' ? (
                        <button
                          type="button"
                          onClick={() => onSetNodeFault(n.id, 'none')}
                          className="px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetNodeFault(n.id, 'interference')}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Test Fault
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
