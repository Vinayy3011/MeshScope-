export type NodeRole = 'gateway' | 'relay' | 'edge';

export type NodeStatus = 'nominal' | 'warning' | 'critical' | 'offline';

export type FaultMode = 'none' | 'interference' | 'congestion' | 'hardware_drop';

export type FrequencyBand = '2.4 GHz' | '5 GHz' | '6 GHz';

export type LinkStatus = 'optimal' | 'degraded' | 'critical' | 'down';

export type RoutingProtocol = 'HWMP (802.11s)' | 'OLSRv2' | 'BATMAN-adv';

export interface NodeHistoryPoint {
  timestamp: number;
  timeLabel: string;
  latencyMs: number;
  packetLossPct: number;
  throughputMbps: number;
  rssiDbm: number;
}

export interface MeshNode {
  id: string;
  label: string;
  zone: string;
  role: NodeRole;
  x: number;
  y: number;
  ip: string;
  mac: string;
  band: FrequencyBand;
  channel: number;
  txPowerDbm: number;
  noiseFloorDbm: number;
  rssiDbm: number;
  snrDb: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputMbps: number;
  hopCount: number | null;
  nextHopId: string | null;
  routePath: string[];
  cpuLoadPct: number;
  airtimeUtilPct: number;
  uptimeSeconds: number;
  status: NodeStatus;
  faultMode: FaultMode;
  history: NodeHistoryPoint[];
}

export interface MeshLink {
  id: string;
  sourceId: string;
  targetId: string;
  distanceMeters: number;
  band: FrequencyBand;
  rssiDbm: number;
  snrDb: number;
  capacityMbps: number;
  throughputMbps: number;
  latencyMs: number;
  packetLossPct: number;
  etx: number;
  isPrimaryRoute: boolean;
  status: LinkStatus;
}

export interface TelemetrySample {
  timestamp: number;
  timeLabel: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgPacketLossPct: number;
  totalThroughputMbps: number;
  activeNodes: number;
  totalNodes: number;
  activeLinks: number;
  criticalAlerts: number;
}

export type AlertSeverity = 'warning' | 'critical';

export type AlertMetric = 'latency' | 'packet_loss' | 'throughput' | 'connectivity';

export interface MeshAlert {
  id: string;
  timestamp: number;
  timeLabel: string;
  nodeId: string;
  nodeLabel: string;
  metric: AlertMetric;
  severity: AlertSeverity;
  currentValue: number;
  unit: string;
  thresholdValue: number;
  message: string;
  recommendation: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: number;
}

export interface AlertThresholds {
  latencyWarningMs: number;
  latencyCriticalMs: number;
  packetLossWarningPct: number;
  packetLossCriticalPct: number;
  minThroughputMbps: number;
}

export type ScenarioPreset =
  | 'nominal'
  | 'rf_interference'
  | 'backbone_congestion'
  | 'node_failover';

export interface MeshNetworkState {
  networkName: string;
  protocol: RoutingProtocol;
  nodes: MeshNode[];
  links: MeshLink[];
  telemetryHistory: TelemetrySample[];
  alerts: MeshAlert[];
  thresholds: AlertThresholds;
  tickCount: number;
  activeScenario: ScenarioPreset;
}
