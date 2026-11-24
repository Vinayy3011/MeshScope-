import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../engine/meshSimulator';
import { MeshNetworkState } from '../types/mesh';

export interface PdfReportOptions {
  siteTitle: string;
  engineerName: string;
  notes: string;
  includeTopology: boolean;
  includeCharts: boolean;
  includeNodeTable: boolean;
  includeAlertLog: boolean;
}

function renderTopologySnapshotDataUrl(state: MeshNetworkState): string {
  const canvas = document.createElement('canvas');
  const scale = 1.5;
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Clean light background for crisp PDF printing
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle coordinate grid
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 0.75;
  for (let x = 0; x <= CANVAS_WIDTH; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  // Draw links
  for (const link of state.links) {
    const src = nodeMap.get(link.sourceId);
    const tgt = nodeMap.get(link.targetId);
    if (!src || !tgt) continue;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);

    if (link.status === 'down') {
      ctx.strokeStyle = '#CBD5E1';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
    } else if (link.status === 'critical') {
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = link.isPrimaryRoute ? 2.8 : 1.6;
      if (!link.isPrimaryRoute) ctx.setLineDash([4, 3]);
    } else if (link.status === 'degraded') {
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = link.isPrimaryRoute ? 2.6 : 1.5;
      if (!link.isPrimaryRoute) ctx.setLineDash([4, 3]);
    } else {
      ctx.strokeStyle = link.isPrimaryRoute ? '#0F766E' : '#94A3B8';
      ctx.lineWidth = link.isPrimaryRoute ? 2.5 : 1.25;
      if (!link.isPrimaryRoute) ctx.setLineDash([4, 4]);
    }
    ctx.stroke();
    ctx.restore();

    // Link midpoint label for primary routes
    if (link.isPrimaryRoute && link.status !== 'down') {
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(mx - 22, my - 8, 44, 15);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(mx - 22, my - 8, 44, 15);
      ctx.fillStyle = '#334155';
      ctx.font = '600 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${link.latencyMs.toFixed(0)}ms`, mx, my);
    }
  }

  // Draw nodes
  for (const node of state.nodes) {
    const r = node.role === 'gateway' ? 22 : node.role === 'relay' ? 18 : 15;
    const fill =
      node.status === 'offline'
        ? '#64748B'
        : node.status === 'critical'
        ? '#DC2626'
        : node.status === 'warning'
        ? '#D97706'
        : node.role === 'gateway'
        ? '#0F172A'
        : '#0D9488';

    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(node.x, node.y, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    // Label below node
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 10px sans-serif';
    ctx.fillText(node.label, node.x, node.y + r + 14);
    ctx.fillStyle = '#475569';
    ctx.font = '500 9px monospace';
    const sub =
      node.status === 'offline'
        ? 'OFFLINE'
        : `${node.latencyMs.toFixed(1)}ms | ${node.packetLossPct.toFixed(1)}%`;
    ctx.fillText(sub, node.x, node.y + r + 26);
  }

  return canvas.toDataURL('image/png');
}

function renderChartsSnapshotDataUrl(state: MeshNetworkState): string {
  const w = 1140;
  const h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  const history = state.telemetryHistory;
  if (history.length < 2) return canvas.toDataURL('image/png');

  const panels: Array<{
    title: string;
    unit: string;
    color: string;
    values: number[];
    maxVal: number;
    xOffset: number;
  }> = [
    {
      title: 'Average Network Latency (ms)',
      unit: 'ms',
      color: '#0284C7',
      values: history.map((s) => s.avgLatencyMs),
      maxVal: Math.max(80, ...history.map((s) => s.avgLatencyMs)) * 1.15,
      xOffset: 20,
    },
    {
      title: 'Mean Packet Loss (%)',
      unit: '%',
      color: '#D97706',
      values: history.map((s) => s.avgPacketLossPct),
      maxVal: Math.max(5, ...history.map((s) => s.avgPacketLossPct)) * 1.2,
      xOffset: 393,
    },
    {
      title: 'Aggregate Throughput (Mbps)',
      unit: 'Mbps',
      color: '#059669',
      values: history.map((s) => s.totalThroughputMbps),
      maxVal: Math.max(500, ...history.map((s) => s.totalThroughputMbps)) * 1.15,
      xOffset: 766,
    },
  ];

  const pw = 354;
  const ph = 310;
  const padL = 44;
  const padR = 16;
  const padT = 42;
  const padB = 34;
  const plotW = pw - padL - padR;
  const plotH = ph - padT - padB;

  for (const panel of panels) {
    const x0 = panel.xOffset;
    const y0 = 24;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, pw, ph);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(panel.title, x0 + 14, y0 + 22);

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const gy = y0 + padT + (plotH * i) / 4;
      ctx.strokeStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.moveTo(x0 + padL, gy);
      ctx.lineTo(x0 + padL + plotW, gy);
      ctx.stroke();

      const tickVal = panel.maxVal * (1 - i / 4);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(tickVal.toFixed(panel.unit === '%' ? 1 : 0), x0 + padL - 6, gy + 3);
    }

    // Line path
    ctx.beginPath();
    panel.values.forEach((val, idx) => {
      const px = x0 + padL + (idx / (panel.values.length - 1)) * plotW;
      const py = y0 + padT + plotH - (Math.min(val, panel.maxVal) / panel.maxVal) * plotH;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = panel.color;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Latest value annotation
    const latest = panel.values[panel.values.length - 1];
    ctx.fillStyle = panel.color;
    ctx.font = '700 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `Latest: ${latest.toFixed(panel.unit === '%' ? 2 : 1)} ${panel.unit}`,
      x0 + pw - 14,
      y0 + 22
    );

    // Time span
    ctx.fillStyle = '#64748B';
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(history[0].timeLabel, x0 + padL, y0 + ph - 12);
    ctx.textAlign = 'right';
    ctx.fillText(history[history.length - 1].timeLabel, x0 + padL + plotW, y0 + ph - 12);
  }

  return canvas.toDataURL('image/png');
}

export function generateNetworkDiagnosticPdf(
  state: MeshNetworkState,
  options: PdfReportOptions
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date();
  const reportId = `MS-${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(
    2,
    '0'
  )}${String(generatedAt.getDate()).padStart(2, '0')}-${String(
    generatedAt.getHours()
  ).padStart(2, '0')}${String(generatedAt.getMinutes()).padStart(2, '0')}`;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MeshScope Diagnostic Performance Report', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${options.siteTitle || state.networkName}  |  Protocol: ${state.protocol}  |  Report ID: ${reportId}`,
    margin,
    20
  );
  doc.text(
    `Generated: ${generatedAt.toLocaleString()}  |  Prepared by: ${options.engineerName || 'Network Operations'}`,
    margin,
    26
  );

  let y = 40;

  // Executive KPI Summary
  const latest = state.telemetryHistory[state.telemetryHistory.length - 1];
  const avgLat =
    state.telemetryHistory.reduce((s, t) => s + t.avgLatencyMs, 0) /
    Math.max(1, state.telemetryHistory.length);
  const avgLoss =
    state.telemetryHistory.reduce((s, t) => s + t.avgPacketLossPct, 0) /
    Math.max(1, state.telemetryHistory.length);
  const avgTp =
    state.telemetryHistory.reduce((s, t) => s + t.totalThroughputMbps, 0) /
    Math.max(1, state.telemetryHistory.length);
  const activeAlerts = state.alerts.filter((a) => !a.resolved);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Executive Telemetry Summary', margin, y);
  y += 5;

  const kpiCards = [
    {
      label: 'Avg Mesh Latency',
      value: `${(latest?.avgLatencyMs ?? 0).toFixed(1)} ms`,
      sub: `Window Mean: ${avgLat.toFixed(1)} ms`,
    },
    {
      label: 'Mean Packet Loss',
      value: `${(latest?.avgPacketLossPct ?? 0).toFixed(2)}%`,
      sub: `Window Mean: ${avgLoss.toFixed(2)}%`,
    },
    {
      label: 'Aggregate Throughput',
      value: `${(latest?.totalThroughputMbps ?? 0).toFixed(1)} Mbps`,
      sub: `Window Mean: ${avgTp.toFixed(1)} Mbps`,
    },
    {
      label: 'Mesh Availability',
      value: `${latest?.activeNodes ?? 0} / ${state.nodes.length} Nodes`,
      sub: `${activeAlerts.length} Active Alert(s)`,
    },
  ];

  const cardW = (contentWidth - 9) / 4;
  kpiCards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 3, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(c.value, cx + 3, y + 12.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(c.sub, cx + 3, y + 17);
  });

  y += 26;

  if (options.notes.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Diagnostic Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(options.notes.trim(), contentWidth);
    doc.text(wrapped, margin, y + 4.5);
    y += 6 + wrapped.length * 4;
  }

  // Topology Snapshot
  if (options.includeTopology) {
    if (y > pageHeight - 108) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Wireless Mesh Topology Snapshot', margin, y);
    y += 4;

    const topoImg = renderTopologySnapshotDataUrl(state);
    if (topoImg) {
      const imgH = (contentWidth * CANVAS_HEIGHT) / CANVAS_WIDTH;
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, imgH);
      doc.addImage(topoImg, 'PNG', margin, y, contentWidth, imgH);
      y += imgH + 8;
    }
  }

  // Telemetry Charts
  if (options.includeCharts) {
    if (y > pageHeight - 75) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Time-Series Performance Trends', margin, y);
    y += 4;

    const chartImg = renderChartsSnapshotDataUrl(state);
    if (chartImg) {
      const chartH = (contentWidth * 360) / 1140;
      doc.addImage(chartImg, 'PNG', margin, y, contentWidth, chartH);
      y += chartH + 8;
    }
  }

  // Node Performance Table
  if (options.includeNodeTable) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Node-Level Telemetry & RF Link Diagnostics', margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [
        [
          'Node',
          'Role / Band',
          'Hops',
          'Latency',
          'Loss %',
          'Throughput',
          'RSSI / SNR',
          'Status',
        ],
      ],
      body: state.nodes.map((n) => [
        `${n.id} (${n.label})`,
        `${n.role.toUpperCase()} · ${n.band}`,
        n.hopCount === null ? 'N/A' : String(n.hopCount),
        n.status === 'offline' ? '—' : `${n.latencyMs.toFixed(1)} ms`,
        `${n.packetLossPct.toFixed(2)}%`,
        n.status === 'offline' ? '—' : `${n.throughputMbps.toFixed(1)} Mbps`,
        n.status === 'offline' ? '—' : `${n.rssiDbm.toFixed(0)} dBm / ${n.snrDb.toFixed(0)} dB`,
        n.status.toUpperCase(),
      ]),
    });

    const tableEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (tableEnd ?? y + 40) + 8;
  }

  // Alert Incident Log
  if (options.includeAlertLog) {
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Automated Connectivity Alerts & Recommendations', margin, y);
    y += 3;

    if (state.alerts.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('No connectivity anomalies or threshold breaches recorded in this diagnostic window.', margin, y + 6);
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.2, cellPadding: 2.2 },
        headStyles: { fillColor: [127, 29, 29], textColor: 255, fontStyle: 'bold' },
        head: [['Time', 'Severity', 'Node', 'Diagnostic Finding', 'State', 'Action']],
        body: state.alerts.slice(0, 25).map((a) => [
          a.timeLabel,
          a.severity.toUpperCase(),
          a.nodeId,
          a.message,
          a.resolved ? 'RESOLVED' : a.acknowledged ? 'ACK' : 'ACTIVE',
          a.recommendation,
        ]),
      });
    }
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `MeshScope Wireless Mesh Performance Analyzer  |  Threshold Policy: Latency >${state.thresholds.latencyCriticalMs}ms, Loss >${state.thresholds.packetLossCriticalPct}%`,
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  }

  const filename = `meshscope-diagnostic-${reportId}.pdf`;
  doc.save(filename);
  return filename;
}
