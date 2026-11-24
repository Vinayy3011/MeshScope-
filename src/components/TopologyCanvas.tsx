import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Maximize2,
  Plus,
  Radio,
  Router,
  Server,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../engine/meshSimulator';
import { FaultMode, FrequencyBand, MeshLink, MeshNode, NodeRole, RoutingProtocol } from '../types/mesh';

interface TopologyCanvasProps {
  nodes: MeshNode[];
  links: MeshLink[];
  protocol: RoutingProtocol;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onSetNodeFault: (id: string, fault: FaultMode) => void;
  onAddNode: (config: {
    label: string;
    zone: string;
    role: NodeRole;
    band: FrequencyBand;
    channel: number;
  }) => void;
}

const FAULT_OPTIONS: Array<{ id: FaultMode; label: string }> = [
  { id: 'none', label: 'Nominal' },
  { id: 'interference', label: 'RF Noise' },
  { id: 'congestion', label: 'Congestion' },
  { id: 'hardware_drop', label: 'Drop Node' },
];

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  nodes,
  links,
  protocol,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onSetNodeFault,
  onAddNode,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showBackupLinks, setShowBackupLinks] = useState(true);
  const [showLinkLabels, setShowLinkLabels] = useState(true);
  const [showRfRings, setShowRfRings] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  // Add Node form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newRole, setNewRole] = useState<NodeRole>('edge');
  const [newBand, setNewBand] = useState<FrequencyBand>('5 GHz');

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? nodes[0] ?? null,
    [nodes, selectedNodeId]
  );

  const connectedLinks = useMemo(() => {
    if (!selectedNode) return [];
    return links.filter(
      (l) => l.sourceId === selectedNode.id || l.targetId === selectedNode.id
    );
  }, [links, selectedNode]);

  const selectedRouteLinkIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedNode || selectedNode.routePath.length < 2) return ids;
    for (let i = 0; i < selectedNode.routePath.length - 1; i++) {
      const a = selectedNode.routePath[i];
      const b = selectedNode.routePath[i + 1];
      const found = links.find(
        (l) => (l.sourceId === a && l.targetId === b) || (l.sourceId === b && l.targetId === a)
      );
      if (found) ids.add(found.id);
    }
    return ids;
  }, [links, selectedNode]);

  const getSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const viewW = CANVAS_WIDTH / zoom;
    const viewH = CANVAS_HEIGHT / zoom;
    const offsetX = (CANVAS_WIDTH - viewW) / 2;
    const offsetY = (CANVAS_HEIGHT - viewH) / 2;
    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    return {
      x: Math.max(40, Math.min(CANVAS_WIDTH - 40, offsetX + normX * viewW)),
      y: Math.max(40, Math.min(CANVAS_HEIGHT - 40, offsetY + normY * viewH)),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingNodeId) return;
    const { x, y } = getSvgCoords(e.clientX, e.clientY);
    onMoveNode(draggingNodeId, Math.round(x), Math.round(y));
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNode({
      label: newLabel,
      zone: newZone,
      role: newRole,
      band: newBand,
      channel: newBand === '6 GHz' ? 37 : newBand === '5 GHz' ? 149 : 11,
    });
    setNewLabel('');
    setNewZone('');
    setIsAddModalOpen(false);
  };

  const viewW = CANVAS_WIDTH / zoom;
  const viewH = CANVAS_HEIGHT / zoom;
  const viewX = (CANVAS_WIDTH - viewW) / 2;
  const viewY = (CANVAS_HEIGHT - viewH) / 2;

  const hoveredLink = hoveredLinkId ? links.find((l) => l.id === hoveredLinkId) : null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Interactive Mesh Topology
          </h2>
          <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
            {protocol} · Drag nodes to test RF path loss
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBackupLinks((v) => !v)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              showBackupLinks
                ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Backup Links
          </button>
          <button
            type="button"
            onClick={() => setShowLinkLabels((v) => !v)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              showLinkLabels
                ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Link Latency
          </button>
          <button
            type="button"
            onClick={() => setShowRfRings((v) => !v)}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              showRfRings
                ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            RF Coverage
          </button>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-2 py-1 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-x border-slate-200 dark:border-slate-700"
              title="Reset zoom"
            >
              <Maximize2 className="h-3 w-3 inline mr-1" />
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Node</span>
          </button>
        </div>
      </div>

      {/* Inline Add Node Form Bar */}
      {isAddModalOpen && (
        <form
          onSubmit={handleCreateNode}
          className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Node Name
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Edge Bay 06"
              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Location Zone
            </label>
            <input
              type="text"
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              placeholder="e.g. North Mezzanine"
              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as NodeRole)}
              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="edge">Edge Node</option>
              <option value="relay">Backbone Relay</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Radio Band
            </label>
            <select
              value={newBand}
              onChange={(e) => setNewBand(e.target.value as FrequencyBand)}
              className="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="5 GHz">5 GHz</option>
              <option value="6 GHz">6 GHz</option>
              <option value="2.4 GHz">2.4 GHz</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500"
            >
              Deploy to Mesh
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Split Workspace: Topology SVG Stage + Selected Node Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12">
        {/* Left/Main SVG Stage */}
        <div className="xl:col-span-8 relative bg-slate-50/70 dark:bg-slate-950/60 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 select-none">
          <svg
            ref={svgRef}
            viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
            className={`w-full h-[380px] sm:h-[460px] ${
              draggingNodeId ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <defs>
              <pattern
                id="mesh-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200/80 dark:text-slate-800/70"
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>

            <rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="url(#mesh-grid)"
            />

            {/* Optional RF Range Rings */}
            {showRfRings &&
              nodes.map((n) => {
                if (n.status === 'offline') return null;
                const radius = n.role === 'gateway' ? 195 : n.role === 'relay' ? 160 : 120;
                return (
                  <circle
                    key={`rf-${n.id}`}
                    cx={n.x}
                    cy={n.y}
                    r={radius}
                    fill="none"
                    stroke={n.role === 'gateway' ? '#0F766E' : '#64748B'}
                    strokeOpacity={0.18}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                );
              })}

            {/* Links */}
            {links.map((link) => {
              if (!showBackupLinks && !link.isPrimaryRoute) return null;
              const src = nodeMap.get(link.sourceId);
              const tgt = nodeMap.get(link.targetId);
              if (!src || !tgt) return null;

              const isHighlighted =
                selectedRouteLinkIds.has(link.id) || hoveredLinkId === link.id;

              const strokeColor =
                link.status === 'down'
                  ? '#94A3B8'
                  : link.status === 'critical'
                  ? '#DC2626'
                  : link.status === 'degraded'
                  ? '#D97706'
                  : link.isPrimaryRoute
                  ? '#0D9488'
                  : '#64748B';

              const strokeWidth = isHighlighted
                ? 3.2
                : link.isPrimaryRoute
                ? 2.2
                : 1.25;

              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;

              return (
                <g
                  key={link.id}
                  onMouseEnter={() => setHoveredLinkId(link.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                >
                  {/* Invisible wider hit target */}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="transparent"
                    strokeWidth={14}
                  />
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeOpacity={
                      link.status === 'down' ? 0.35 : link.isPrimaryRoute || isHighlighted ? 0.92 : 0.4
                    }
                    strokeWidth={strokeWidth}
                    strokeDasharray={
                      link.status === 'down' ? '5 5' : link.isPrimaryRoute ? undefined : '4 4'
                    }
                  />

                  {/* Subtle packet flow pulse on active primary links */}
                  {link.isPrimaryRoute && link.status !== 'down' && (
                    <circle r="3" fill={strokeColor}>
                      <animateMotion
                        dur={`${Math.max(0.8, Math.min(3.5, 220 / Math.max(25, link.throughputMbps))).toFixed(2)}s`}
                        repeatCount="indefinite"
                        path={`M ${tgt.x} ${tgt.y} L ${src.x} ${src.y}`}
                      />
                    </circle>
                  )}

                  {/* Midpoint Link Metric Pill */}
                  {showLinkLabels && link.isPrimaryRoute && link.status !== 'down' && (
                    <g transform={`translate(${mx}, ${my})`}>
                      <rect
                        x={-24}
                        y={-9}
                        width={48}
                        height={18}
                        rx={3}
                        className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                        strokeWidth={0.8}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-700 dark:fill-slate-200 font-mono text-[9px] font-medium"
                      >
                        {link.latencyMs.toFixed(0)}ms
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const radius = node.role === 'gateway' ? 22 : node.role === 'relay' ? 18 : 15;

              const ringColor =
                node.status === 'offline'
                  ? '#64748B'
                  : node.status === 'critical'
                  ? '#DC2626'
                  : node.status === 'warning'
                  ? '#D97706'
                  : node.role === 'gateway'
                  ? '#0F172A'
                  : '#0D9488';

              const fillColor =
                node.status === 'offline'
                  ? '#475569'
                  : node.status === 'critical'
                  ? '#DC2626'
                  : node.status === 'warning'
                  ? '#D97706'
                  : node.role === 'gateway'
                  ? '#0F172A'
                  : '#0D9488';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                    setDraggingNodeId(node.id);
                  }}
                >
                  {isSelected && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />
                  )}

                  <circle
                    r={radius + 2}
                    className="fill-white dark:fill-slate-900"
                    stroke={ringColor}
                    strokeWidth={2}
                  />
                  <circle r={radius - 1} fill={fillColor} />

                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-white font-mono text-[10px] font-bold pointer-events-none"
                  >
                    {node.id}
                  </text>

                  {/* Node Label & Telemetry Readout */}
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    className="fill-slate-800 dark:fill-slate-100 font-sans text-[11px] font-semibold pointer-events-none"
                  >
                    {node.label}
                  </text>
                  <text
                    y={radius + 26}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 font-mono text-[9.5px] pointer-events-none"
                  >
                    {node.status === 'offline'
                      ? 'OFFLINE'
                      : node.hopCount === null
                      ? 'NO ROUTE'
                      : `${node.latencyMs.toFixed(1)}ms · ${node.packetLossPct.toFixed(1)}%`}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Link Tooltip */}
          {hoveredLink && (
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs shadow-sm pointer-events-none">
              <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                Link {hoveredLink.sourceId} ↔ {hoveredLink.targetId} ({hoveredLink.band})
              </div>
              <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                <span>RSSI: {hoveredLink.rssiDbm.toFixed(0)} dBm</span>
                <span>Loss: {hoveredLink.packetLossPct.toFixed(2)}%</span>
                <span>{hoveredLink.throughputMbps.toFixed(0)} Mbps</span>
                <span>{hoveredLink.distanceMeters} m</span>
              </div>
            </div>
          )}

          {/* Legend Footer */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                Optimal Link / Nominal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                Degraded / Warning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                Critical / Partitioned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t border-dashed border-slate-400" />
                Redundant Backup Path
              </span>
            </div>
            <span className="font-mono text-slate-500">
              {nodes.length} Nodes · {links.length} Mesh Links
            </span>
          </div>
        </div>

        {/* Right: Node Inspector & Fault Injection */}
        <div className="xl:col-span-4 p-4 flex flex-col justify-between bg-white dark:bg-slate-900">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedNode.role === 'gateway' ? (
                      <Router className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    ) : selectedNode.role === 'relay' ? (
                      <Radio className="h-4 w-4 text-teal-600" />
                    ) : (
                      <Server className="h-4 w-4 text-slate-500" />
                    )}
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedNode.id} · {selectedNode.label}
                    </h3>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedNode.zone} · {selectedNode.ip} · {selectedNode.band} Ch {selectedNode.channel}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                    selectedNode.status === 'offline'
                      ? 'text-slate-500'
                      : selectedNode.status === 'critical'
                      ? 'text-rose-600 dark:text-rose-400'
                      : selectedNode.status === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              {/* 2x3 Metric Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Latency</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.status === 'offline' ? '—' : `${selectedNode.latencyMs.toFixed(1)} ms`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Packet Loss</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.packetLossPct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Throughput</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.status === 'offline' ? '—' : `${selectedNode.throughputMbps.toFixed(0)} Mbps`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">RSSI / SNR</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.status === 'offline'
                      ? '—'
                      : `${selectedNode.rssiDbm.toFixed(0)} / ${selectedNode.snrDb.toFixed(0)} dB`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Hop Count</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.hopCount === null ? 'Unreachable' : `${selectedNode.hopCount} hops`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Airtime Util</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedNode.airtimeUtilPct}%
                  </div>
                </div>
              </div>

              {/* Active Route Trace */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Active ETX Route to Gateway
                </div>
                {selectedNode.routePath.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                    {selectedNode.routePath.map((hopId, idx) => (
                      <React.Fragment key={`${hopId}-${idx}`}>
                        <span className="font-semibold">{hopId}</span>
                        {idx < selectedNode.routePath.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>No active uplink path available</span>
                  </div>
                )}
              </div>

              {/* Fault Injection Controls */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Node Fault Simulation
                  </span>
                  {selectedNode.faultMode !== 'none' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3" />
                      Fault Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-1.5">
                  {FAULT_OPTIONS.map((opt) => {
                    const active = selectedNode.faultMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSetNodeFault(selectedNode.id, opt.id)}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
                          active
                            ? opt.id === 'none'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Peer Links Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Adjacent RF Links ({connectedLinks.length})
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {connectedLinks.map((lnk) => {
                    const peerId =
                      lnk.sourceId === selectedNode.id ? lnk.targetId : lnk.sourceId;
                    return (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                      >
                        <span className="text-slate-800 dark:text-slate-200">
                          ↔ {peerId}{' '}
                          <span className="text-slate-400">
                            {lnk.isPrimaryRoute ? '(Primary)' : '(Backup)'}
                          </span>
                        </span>
                        <span
                          className={`tabular-nums ${
                            lnk.status === 'down'
                              ? 'text-slate-400'
                              : lnk.status === 'critical'
                              ? 'text-rose-600 dark:text-rose-400'
                              : lnk.status === 'degraded'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {lnk.status === 'down'
                            ? 'DOWN'
                            : `${lnk.latencyMs.toFixed(0)}ms · ${lnk.rssiDbm.toFixed(0)}dBm`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
