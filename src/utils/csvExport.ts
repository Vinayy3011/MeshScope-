import { MeshNetworkState } from '../types/mesh';

export function exportTelemetryCsv(state: MeshNetworkState): string {
  const headers = [
    'Timestamp',
    'Time',
    'AvgLatencyMs',
    'P95LatencyMs',
    'AvgPacketLossPct',
    'TotalThroughputMbps',
    'ActiveNodes',
    'ActiveLinks',
    'CriticalAlerts',
  ];

  const rows = state.telemetryHistory.map((s) =>
    [
      s.timestamp,
      s.timeLabel,
      s.avgLatencyMs.toFixed(2),
      s.p95LatencyMs.toFixed(2),
      s.avgPacketLossPct.toFixed(2),
      s.totalThroughputMbps.toFixed(2),
      s.activeNodes,
      s.activeLinks,
      s.criticalAlerts,
    ].join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `meshscope-telemetry-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
