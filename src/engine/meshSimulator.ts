import {
  AlertThresholds,
  FaultMode,
  FrequencyBand,
  LinkStatus,
  MeshAlert,
  MeshLink,
  MeshNetworkState,
  MeshNode,
  NodeRole,
  NodeStatus,
  ScenarioPreset,
  TelemetrySample,
} from '../types/mesh';

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  latencyWarningMs: 45,
  latencyCriticalMs: 95,
  packetLossWarningPct: 2.0,
  packetLossCriticalPct: 6.5,
  minThroughputMbps: 35,
};

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
const METERS_PER_PX = 0.42;

function formatClockTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function createInitialNodes(): MeshNode[] {
  const baseNodes: Array<{
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
  }> = [
    {
      id: 'GW-01',
      label: 'Core Gateway 01',
      zone: 'Data Center Ingress',
      role: 'gateway',
      x: 480,
      y: 86,
      ip: '10.24.0.1',
      mac: 'A4:91:B1:08:40:01',
      band: '6 GHz',
      channel: 37,
    },
    {
      id: 'R-01',
      label: 'Relay North-West',
      zone: 'Building A Roof',
      role: 'relay',
      x: 260,
      y: 195,
      ip: '10.24.1.11',
      mac: 'A4:91:B1:08:41:11',
      band: '5 GHz',
      channel: 149,
    },
    {
      id: 'R-02',
      label: 'Relay North-East',
      zone: 'Building B Roof',
      role: 'relay',
      x: 700,
      y: 195,
      ip: '10.24.1.12',
      mac: 'A4:91:B1:08:41:12',
      band: '5 GHz',
      channel: 149,
    },
    {
      id: 'R-03',
      label: 'Relay Central Hub',
      zone: 'Atrium Spine',
      role: 'relay',
      x: 480,
      y: 265,
      ip: '10.24.1.13',
      mac: 'A4:91:B1:08:41:13',
      band: '6 GHz',
      channel: 37,
    },
    {
      id: 'R-04',
      label: 'Relay South Spine',
      zone: 'Logistics Yard',
      role: 'relay',
      x: 480,
      y: 410,
      ip: '10.24.1.14',
      mac: 'A4:91:B1:08:41:14',
      band: '5 GHz',
      channel: 157,
    },
    {
      id: 'E-01',
      label: 'Edge Sensor West',
      zone: 'Bay 01 Telemetry',
      role: 'edge',
      x: 115,
      y: 310,
      ip: '10.24.2.21',
      mac: 'A4:91:B1:08:42:21',
      band: '5 GHz',
      channel: 149,
    },
    {
      id: 'E-02',
      label: 'Edge Relay Dock',
      zone: 'Loading Dock W',
      role: 'edge',
      x: 245,
      y: 430,
      ip: '10.24.2.22',
      mac: 'A4:91:B1:08:42:22',
      band: '2.4 GHz',
      channel: 11,
    },
    {
      id: 'E-03',
      label: 'Edge AGV Corridor',
      zone: 'Assembly Floor',
      role: 'edge',
      x: 715,
      y: 430,
      ip: '10.24.2.23',
      mac: 'A4:91:B1:08:42:23',
      band: '5 GHz',
      channel: 157,
    },
    {
      id: 'E-04',
      label: 'Edge Sensor East',
      zone: 'Bay 04 Telemetry',
      role: 'edge',
      x: 845,
      y: 310,
      ip: '10.24.2.24',
      mac: 'A4:91:B1:08:42:24',
      band: '5 GHz',
      channel: 149,
    },
    {
      id: 'E-05',
      label: 'Edge Perimeter South',
      zone: 'Gate Checkpoint',
      role: 'edge',
      x: 480,
      y: 495,
      ip: '10.24.2.25',
      mac: 'A4:91:B1:08:42:25',
      band: '2.4 GHz',
      channel: 6,
    },
  ];

  return baseNodes.map((n, idx) => ({
    ...n,
    txPowerDbm: n.role === 'gateway' ? 24 : n.role === 'relay' ? 21 : 18,
    noiseFloorDbm: -94,
    rssiDbm: -52,
    snrDb: 42,
    latencyMs: n.role === 'gateway' ? 1.2 : 6.4 + idx * 0.8,
    jitterMs: 1.1,
    packetLossPct: 0.12,
    throughputMbps: n.role === 'gateway' ? 680 : n.role === 'relay' ? 310 : 145,
    hopCount: n.role === 'gateway' ? 0 : null,
    nextHopId: null,
    routePath: n.role === 'gateway' ? ['GW-01'] : [],
    cpuLoadPct: 22 + (idx % 4) * 5,
    airtimeUtilPct: 18 + (idx % 5) * 4,
    uptimeSeconds: 184200 + idx * 940,
    status: 'nominal',
    faultMode: 'none',
    history: [],
  }));
}

function createInitialLinkPairs(): Array<[string, string]> {
  return [
    ['GW-01', 'R-01'],
    ['GW-01', 'R-02'],
    ['GW-01', 'R-03'],
    ['R-01', 'R-03'],
    ['R-02', 'R-03'],
    ['R-01', 'E-01'],
    ['R-01', 'E-02'],
    ['R-03', 'R-04'],
    ['R-02', 'E-04'],
    ['R-02', 'E-03'],
    ['R-03', 'E-02'],
    ['R-03', 'E-03'],
    ['R-04', 'E-02'],
    ['R-04', 'E-03'],
    ['R-04', 'E-05'],
    ['E-01', 'E-02'],
    ['E-03', 'E-04'],
  ];
}

function computeDistanceMeters(a: MeshNode, b: MeshNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.max(8, Math.round(Math.sqrt(dx * dx + dy * dy) * METERS_PER_PX));
}

function evaluateLinkMetrics(
  source: MeshNode,
  target: MeshNode,
  existingId: string,
  noiseSeed: number
): MeshLink {
  const distanceMeters = computeDistanceMeters(source, target);
  const isDown =
    source.faultMode === 'hardware_drop' || target.faultMode === 'hardware_drop';

  if (isDown) {
    return {
      id: existingId,
      sourceId: source.id,
      targetId: target.id,
      distanceMeters,
      band: source.band === '6 GHz' && target.band === '6 GHz' ? '6 GHz' : source.band === '2.4 GHz' || target.band === '2.4 GHz' ? '2.4 GHz' : '5 GHz',
      rssiDbm: -100,
      snrDb: 0,
      capacityMbps: 0,
      throughputMbps: 0,
      latencyMs: 999,
      packetLossPct: 100,
      etx: 999,
      isPrimaryRoute: false,
      status: 'down',
    };
  }

  const band: FrequencyBand =
    source.band === '6 GHz' && target.band === '6 GHz'
      ? '6 GHz'
      : source.band === '2.4 GHz' || target.band === '2.4 GHz'
      ? '2.4 GHz'
      : '5 GHz';

  // Free-space + indoor/campus log-distance path loss model
  const freqPenalty = band === '6 GHz' ? 4.2 : band === '5 GHz' ? 2.5 : 0;
  const pathLoss = 34 + 24 * Math.log10(distanceMeters / 10 + 1) + freqPenalty;
  const avgTx = (source.txPowerDbm + target.txPowerDbm) / 2;

  const interferencePenalty =
    (source.faultMode === 'interference' ? 17 : 0) +
    (target.faultMode === 'interference' ? 17 : 0);

  const congestionPenalty =
    (source.faultMode === 'congestion' ? 1 : 0) +
    (target.faultMode === 'congestion' ? 1 : 0);

  const jitterWave = Math.sin(noiseSeed * 1.7) * 1.6 + (Math.random() - 0.5) * 1.8;
  const rssiDbm = round1(clamp(avgTx - pathLoss - interferencePenalty * 0.45 + jitterWave, -95, -34));

  const effectiveNoiseFloor = -94 + interferencePenalty * 0.85 + congestionPenalty * 2.5;
  const snrDb = round1(clamp(rssiDbm - effectiveNoiseFloor, 2, 54));

  // Packet loss rises sharply when SNR drops below 19 dB or congestion occurs
  const snrLoss = snrDb < 19 ? Math.pow((19 - snrDb) / 4.2, 2) * 1.35 : 0.08;
  const congestionLoss = congestionPenalty * 3.4;
  const interferenceLoss = interferencePenalty > 0 ? 4.2 + Math.random() * 2.6 : 0;
  const packetLossPct = round2(
    clamp(snrLoss + congestionLoss + interferenceLoss + Math.random() * 0.25, 0.02, 48)
  );

  // Latency combines baseline RF serialization + distance + retry backoff + congestion queue
  const baseHopLatency = band === '6 GHz' ? 2.1 : band === '5 GHz' ? 3.2 : 5.4;
  const queueDelay = congestionPenalty * (36 + Math.random() * 18);
  const retryDelay = packetLossPct * 2.8;
  const snrDelay = snrDb < 22 ? (22 - snrDb) * 1.45 : 0;
  const latencyMs = round1(
    clamp(baseHopLatency + distanceMeters * 0.03 + queueDelay + retryDelay + snrDelay + (Math.random() - 0.3) * 1.4, 1.5, 420)
  );

  const maxCap = band === '6 GHz' ? 860 : band === '5 GHz' ? 540 : 180;
  const snrFactor = clamp((snrDb - 6) / 34, 0.08, 1);
  const capacityMbps = round1(maxCap * snrFactor);

  const loadRatio =
    congestionPenalty > 0
      ? 0.28 + Math.random() * 0.14
      : clamp(0.68 - packetLossPct * 0.045 + (Math.random() - 0.5) * 0.08, 0.12, 0.92);
  const throughputMbps = round1(clamp(capacityMbps * loadRatio, 4, capacityMbps));

  const pSuccess = Math.max(0.05, 1 - packetLossPct / 100);
  const etx = round2(1 / (pSuccess * pSuccess) + latencyMs / 100);

  let status: LinkStatus = 'optimal';
  if (packetLossPct >= 5 || latencyMs >= 75 || snrDb < 13) {
    status = 'critical';
  } else if (packetLossPct >= 1.6 || latencyMs >= 30 || snrDb < 20) {
    status = 'degraded';
  }

  return {
    id: existingId,
    sourceId: source.id,
    targetId: target.id,
    distanceMeters,
    band,
    rssiDbm,
    snrDb,
    capacityMbps,
    throughputMbps,
    latencyMs,
    packetLossPct,
    etx,
    isPrimaryRoute: false,
    status,
  };
}

function computeRoutesAndNodeMetrics(
  nodes: MeshNode[],
  links: MeshLink[],
  thresholds: AlertThresholds,
  timestamp: number,
  tickCount: number
): { nodes: MeshNode[]; links: MeshLink[] } {
  const nodeMap = new Map<string, MeshNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  const adj = new Map<string, Array<{ neighborId: string; link: MeshLink }>>();
  nodes.forEach((n) => adj.set(n.id, []));

  links.forEach((link) => {
    if (link.status !== 'down') {
      adj.get(link.sourceId)?.push({ neighborId: link.targetId, link });
      adj.get(link.targetId)?.push({ neighborId: link.sourceId, link });
    }
  });

  // Dijkstra from Gateway GW-01 minimizing weighted ETX + hop cost
  const gateway = nodes.find((n) => n.role === 'gateway') ?? nodes[0];
  const dist = new Map<string, number>();
  const prevNode = new Map<string, string | null>();
  const prevLink = new Map<string, string | null>();
  const visited = new Set<string>();

  nodes.forEach((n) => {
    dist.set(n.id, Infinity);
    prevNode.set(n.id, null);
    prevLink.set(n.id, null);
  });

  if (gateway && gateway.faultMode !== 'hardware_drop') {
    dist.set(gateway.id, 0);
  }

  for (let i = 0; i < nodes.length; i++) {
    let u: string | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      if (!visited.has(n.id)) {
        const d = dist.get(n.id) ?? Infinity;
        if (d < bestD) {
          bestD = d;
          u = n.id;
        }
      }
    }
    if (!u || bestD === Infinity) break;
    visited.add(u);

    const neighbors = adj.get(u) ?? [];
    for (const { neighborId, link } of neighbors) {
      if (visited.has(neighborId)) continue;
      const alt = bestD + link.etx;
      if (alt < (dist.get(neighborId) ?? Infinity)) {
        dist.set(neighborId, alt);
        prevNode.set(neighborId, u);
        prevLink.set(neighborId, link.id);
      }
    }
  }

  const primaryLinkIds = new Set<string>();
  const timeLabel = formatClockTime(timestamp);

  const updatedNodes: MeshNode[] = nodes.map((orig) => {
    const isOffline = orig.faultMode === 'hardware_drop';
    if (isOffline) {
      const point = {
        timestamp,
        timeLabel,
        latencyMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        rssiDbm: -100,
      };
      return {
        ...orig,
        rssiDbm: -100,
        snrDb: 0,
        latencyMs: 0,
        jitterMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        hopCount: null,
        nextHopId: null,
        routePath: [],
        cpuLoadPct: 0,
        airtimeUtilPct: 0,
        status: 'offline' as NodeStatus,
        history: [...orig.history.slice(-39), point],
      };
    }

    if (orig.role === 'gateway') {
      const activePeers = (adj.get(orig.id) ?? []).filter((p) => p.link.status !== 'down');
      const totalInbound = activePeers.reduce((acc, p) => acc + p.link.throughputMbps * 0.42, 0);
      const gwLatency = round1(1.1 + Math.random() * 0.6 + (orig.faultMode === 'congestion' ? 18 : 0));
      const gwLoss = round2(orig.faultMode === 'congestion' ? 2.1 : 0.04 + Math.random() * 0.06);
      const gwThroughput = round1(clamp(totalInbound, 120, 920));
      const gwStatus: NodeStatus =
        gwLoss >= thresholds.packetLossCriticalPct || gwLatency >= thresholds.latencyCriticalMs
          ? 'critical'
          : gwLoss >= thresholds.packetLossWarningPct || gwLatency >= thresholds.latencyWarningMs
          ? 'warning'
          : 'nominal';

      const point = {
        timestamp,
        timeLabel,
        latencyMs: gwLatency,
        packetLossPct: gwLoss,
        throughputMbps: gwThroughput,
        rssiDbm: -38,
      };

      return {
        ...orig,
        rssiDbm: -38,
        snrDb: 56,
        latencyMs: gwLatency,
        jitterMs: round1(0.3 + Math.random() * 0.4),
        packetLossPct: gwLoss,
        throughputMbps: gwThroughput,
        hopCount: 0,
        nextHopId: null,
        routePath: [orig.id],
        cpuLoadPct: Math.round(clamp(28 + gwThroughput / 28 + Math.random() * 4, 15, 96)),
        airtimeUtilPct: Math.round(clamp(22 + gwThroughput / 22, 10, 95)),
        uptimeSeconds: orig.uptimeSeconds + 1,
        status: gwStatus,
        history: [...orig.history.slice(-39), point],
      };
    }

    // Reconstruct path back to gateway
    const routePath: string[] = [];
    let curr: string | null = orig.id;
    let guard = 0;
    let pathLatency = 0;
    let survivalProb = 1;
    let bottleneckThroughput = Infinity;
    let firstHopRssi = -95;
    let firstHopSnr = 0;

    while (curr && guard < 16) {
      routePath.push(curr);
      const parentId: string | null = prevNode.get(curr) ?? null;
      const linkId: string | null = prevLink.get(curr) ?? null;
      if (parentId && linkId) {
        primaryLinkIds.add(linkId);
        const link = links.find((l) => l.id === linkId);
        if (link) {
          pathLatency += link.latencyMs;
          survivalProb *= 1 - link.packetLossPct / 100;
          bottleneckThroughput = Math.min(bottleneckThroughput, link.throughputMbps);
          if (curr === orig.id) {
            firstHopRssi = link.rssiDbm;
            firstHopSnr = link.snrDb;
          }
        }
      }
      curr = parentId;
      guard++;
    }

    const reachedGateway = routePath[routePath.length - 1] === gateway?.id;

    if (!reachedGateway) {
      const point = {
        timestamp,
        timeLabel,
        latencyMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        rssiDbm: -96,
      };
      return {
        ...orig,
        rssiDbm: -96,
        snrDb: 2,
        latencyMs: 0,
        jitterMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        hopCount: null,
        nextHopId: null,
        routePath: [],
        cpuLoadPct: 18,
        airtimeUtilPct: 4,
        uptimeSeconds: orig.uptimeSeconds + 1,
        status: 'critical' as NodeStatus,
        history: [...orig.history.slice(-39), point],
      };
    }

    const hopCount = routePath.length - 1;
    const nextHopId = routePath[1] ?? null;
    const endToEndLatency = round1(pathLatency + (hopCount - 1) * 1.4);
    const endToEndLoss = round2(clamp((1 - survivalProb) * 100, 0.02, 99.9));
    const hopContentionFactor = orig.role === 'relay' ? 0.92 : Math.pow(0.84, Math.max(0, hopCount - 1));
    const effectiveThroughput = round1(
      clamp(bottleneckThroughput * hopContentionFactor, 4, 650)
    );
    const jitterMs = round1(
      clamp(endToEndLatency * 0.14 + (orig.faultMode !== 'none' ? 11 : 0.8) + Math.random() * 1.5, 0.4, 85)
    );

    let status: NodeStatus = 'nominal';
    if (
      endToEndLatency >= thresholds.latencyCriticalMs ||
      endToEndLoss >= thresholds.packetLossCriticalPct ||
      effectiveThroughput < thresholds.minThroughputMbps * 0.5
    ) {
      status = 'critical';
    } else if (
      endToEndLatency >= thresholds.latencyWarningMs ||
      endToEndLoss >= thresholds.packetLossWarningPct ||
      effectiveThroughput < thresholds.minThroughputMbps
    ) {
      status = 'warning';
    }

    const point = {
      timestamp,
      timeLabel,
      latencyMs: endToEndLatency,
      packetLossPct: endToEndLoss,
      throughputMbps: effectiveThroughput,
      rssiDbm: firstHopRssi,
    };

    const cpuWave = Math.sin((tickCount + orig.x) * 0.2) * 4;
    return {
      ...orig,
      rssiDbm: firstHopRssi,
      snrDb: firstHopSnr,
      latencyMs: endToEndLatency,
      jitterMs,
      packetLossPct: endToEndLoss,
      throughputMbps: effectiveThroughput,
      hopCount,
      nextHopId,
      routePath,
      cpuLoadPct: Math.round(
        clamp(24 + hopCount * 6 + (orig.faultMode === 'congestion' ? 38 : 0) + cpuWave, 10, 98)
      ),
      airtimeUtilPct: Math.round(
        clamp(20 + effectiveThroughput * 0.12 + (orig.faultMode === 'interference' ? 42 : 0), 8, 99)
      ),
      uptimeSeconds: orig.uptimeSeconds + 1,
      status,
      history: [...orig.history.slice(-39), point],
    };
  });

  const updatedLinks = links.map((l) => ({
    ...l,
    isPrimaryRoute: primaryLinkIds.has(l.id),
  }));

  return { nodes: updatedNodes, links: updatedLinks };
}

function evaluateAlerts(
  nodes: MeshNode[],
  prevAlerts: MeshAlert[],
  thresholds: AlertThresholds,
  timestamp: number
): MeshAlert[] {
  const timeLabel = formatClockTime(timestamp);
  const nextAlerts = prevAlerts.map((a) => ({ ...a }));

  const findActiveAlert = (nodeId: string, metric: MeshAlert['metric']) =>
    nextAlerts.find((a) => a.nodeId === nodeId && a.metric === metric && !a.resolved);

  for (const node of nodes) {
    // 1. Connectivity / Offline / Partitioned
    const isUnreachable = node.faultMode === 'hardware_drop' || node.hopCount === null;
    const activeConn = findActiveAlert(node.id, 'connectivity');
    if (isUnreachable) {
      if (!activeConn) {
        nextAlerts.unshift({
          id: `ALT-${node.id}-conn-${timestamp}`,
          timestamp,
          timeLabel,
          nodeId: node.id,
          nodeLabel: node.label,
          metric: 'connectivity',
          severity: 'critical',
          currentValue: 0,
          unit: 'hops',
          thresholdValue: 1,
          message:
            node.faultMode === 'hardware_drop'
              ? `${node.id} (${node.label}) stopped responding to mesh beacons.`
              : `${node.id} (${node.label}) is partitioned with no valid route to Gateway.`,
          recommendation:
            node.faultMode === 'hardware_drop'
              ? `Inspect power & radio interface on ${node.id}; traffic has failed over to backup relays.`
              : `Restore upstream relay or reposition ${node.id} within RF range of an active relay.`,
          acknowledged: false,
          resolved: false,
        });
      }
      // Resolve metric alerts while offline so they don't duplicate
      continue;
    } else if (activeConn) {
      activeConn.resolved = true;
      activeConn.resolvedAt = timestamp;
    }

    // 2. Latency Alert
    const activeLat = findActiveAlert(node.id, 'latency');
    if (node.latencyMs >= thresholds.latencyWarningMs) {
      const sev = node.latencyMs >= thresholds.latencyCriticalMs ? 'critical' : 'warning';
      const thr = sev === 'critical' ? thresholds.latencyCriticalMs : thresholds.latencyWarningMs;
      if (!activeLat) {
        nextAlerts.unshift({
          id: `ALT-${node.id}-lat-${timestamp}`,
          timestamp,
          timeLabel,
          nodeId: node.id,
          nodeLabel: node.label,
          metric: 'latency',
          severity: sev,
          currentValue: node.latencyMs,
          unit: 'ms',
          thresholdValue: thr,
          message: `High round-trip latency on ${node.id} (${node.latencyMs.toFixed(1)} ms vs ${thr} ms threshold).`,
          recommendation: `Check ${node.band} Ch ${node.channel} airtime contention or reduce hop depth via ${node.nextHopId ?? 'Gateway'}.`,
          acknowledged: false,
          resolved: false,
        });
      } else {
        activeLat.severity = sev;
        activeLat.currentValue = node.latencyMs;
        activeLat.thresholdValue = thr;
        activeLat.message = `High round-trip latency on ${node.id} (${node.latencyMs.toFixed(1)} ms vs ${thr} ms threshold).`;
      }
    } else if (activeLat) {
      activeLat.resolved = true;
      activeLat.resolvedAt = timestamp;
    }

    // 3. Packet Loss Alert
    const activeLoss = findActiveAlert(node.id, 'packet_loss');
    if (node.packetLossPct >= thresholds.packetLossWarningPct) {
      const sev = node.packetLossPct >= thresholds.packetLossCriticalPct ? 'critical' : 'warning';
      const thr = sev === 'critical' ? thresholds.packetLossCriticalPct : thresholds.packetLossWarningPct;
      if (!activeLoss) {
        nextAlerts.unshift({
          id: `ALT-${node.id}-loss-${timestamp}`,
          timestamp,
          timeLabel,
          nodeId: node.id,
          nodeLabel: node.label,
          metric: 'packet_loss',
          severity: sev,
          currentValue: node.packetLossPct,
          unit: '%',
          thresholdValue: thr,
          message: `Elevated packet loss on ${node.id} (${node.packetLossPct.toFixed(2)}% > ${thr}% limit).`,
          recommendation: `SNR measured at ${node.snrDb.toFixed(1)} dB. Mitigate RF interference on ${node.band} or tighten node spacing.`,
          acknowledged: false,
          resolved: false,
        });
      } else {
        activeLoss.severity = sev;
        activeLoss.currentValue = node.packetLossPct;
        activeLoss.thresholdValue = thr;
        activeLoss.message = `Elevated packet loss on ${node.id} (${node.packetLossPct.toFixed(2)}% > ${thr}% limit).`;
      }
    } else if (activeLoss) {
      activeLoss.resolved = true;
      activeLoss.resolvedAt = timestamp;
    }

    // 4. Throughput Degradation Alert (non-gateway nodes)
    const activeTp = findActiveAlert(node.id, 'throughput');
    if (node.role !== 'gateway' && node.throughputMbps < thresholds.minThroughputMbps) {
      const sev = node.throughputMbps < thresholds.minThroughputMbps * 0.5 ? 'critical' : 'warning';
      if (!activeTp) {
        nextAlerts.unshift({
          id: `ALT-${node.id}-tp-${timestamp}`,
          timestamp,
          timeLabel,
          nodeId: node.id,
          nodeLabel: node.label,
          metric: 'throughput',
          severity: sev,
          currentValue: node.throughputMbps,
          unit: 'Mbps',
          thresholdValue: thresholds.minThroughputMbps,
          message: `Throughput dropped to ${node.throughputMbps.toFixed(1)} Mbps on ${node.id} (min ${thresholds.minThroughputMbps} Mbps).`,
          recommendation: `Offload traffic from ${node.nextHopId ?? 'parent link'} or upgrade link band to 5/6 GHz.`,
          acknowledged: false,
          resolved: false,
        });
      } else {
        activeTp.severity = sev;
        activeTp.currentValue = node.throughputMbps;
      }
    } else if (activeTp) {
      activeTp.resolved = true;
      activeTp.resolvedAt = timestamp;
    }
  }

  return nextAlerts.slice(0, 80);
}

function buildTelemetrySample(
  nodes: MeshNode[],
  links: MeshLink[],
  alerts: MeshAlert[],
  timestamp: number
): TelemetrySample {
  const reachable = nodes.filter((n) => n.status !== 'offline' && n.hopCount !== null);
  const nonGatewayReachable = reachable.filter((n) => n.role !== 'gateway');

  const latencies = reachable.map((n) => n.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs =
    latencies.length > 0
      ? round1(latencies.reduce((s, v) => s + v, 0) / latencies.length)
      : 0;
  const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  const p95LatencyMs = latencies.length > 0 ? round1(latencies[p95Idx]) : 0;

  const avgPacketLossPct =
    reachable.length > 0
      ? round2(reachable.reduce((s, n) => s + n.packetLossPct, 0) / reachable.length)
      : 100;

  const totalThroughputMbps = round1(
    nonGatewayReachable.reduce((s, n) => s + n.throughputMbps, 0)
  );

  const activeLinks = links.filter((l) => l.status !== 'down').length;
  const criticalAlerts = alerts.filter((a) => !a.resolved && a.severity === 'critical').length;

  return {
    timestamp,
    timeLabel: formatClockTime(timestamp),
    avgLatencyMs,
    p95LatencyMs,
    avgPacketLossPct,
    totalThroughputMbps,
    activeNodes: reachable.length,
    totalNodes: nodes.length,
    activeLinks,
    criticalAlerts,
  };
}

export function stepMeshSimulation(
  state: MeshNetworkState,
  customTimestamp?: number
): MeshNetworkState {
  const timestamp = customTimestamp ?? Date.now();
  const nextTick = state.tickCount + 1;
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  const evaluatedLinks = state.links.map((link, idx) => {
    const src = nodeMap.get(link.sourceId);
    const tgt = nodeMap.get(link.targetId);
    if (!src || !tgt) return link;
    return evaluateLinkMetrics(src, tgt, link.id, nextTick + idx * 0.37);
  });

  const { nodes: routedNodes, links: routedLinks } = computeRoutesAndNodeMetrics(
    state.nodes,
    evaluatedLinks,
    state.thresholds,
    timestamp,
    nextTick
  );

  const updatedAlerts = evaluateAlerts(
    routedNodes,
    state.alerts,
    state.thresholds,
    timestamp
  );

  const sample = buildTelemetrySample(routedNodes, routedLinks, updatedAlerts, timestamp);

  return {
    ...state,
    nodes: routedNodes,
    links: routedLinks,
    alerts: updatedAlerts,
    telemetryHistory: [...state.telemetryHistory.slice(-59), sample],
    tickCount: nextTick,
  };
}

export function createInitialMeshState(): MeshNetworkState {
  const nodes = createInitialNodes();
  const pairs = createInitialLinkPairs();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const links: MeshLink[] = pairs.map(([srcId, tgtId], i) => {
    const src = nodeMap.get(srcId)!;
    const tgt = nodeMap.get(tgtId)!;
    return evaluateLinkMetrics(src, tgt, `LNK-${i + 1}`, i);
  });

  let state: MeshNetworkState = {
    networkName: 'Campus Industrial Mesh · Sector 04',
    protocol: 'HWMP (802.11s)',
    nodes,
    links,
    telemetryHistory: [],
    alerts: [],
    thresholds: { ...DEFAULT_THRESHOLDS },
    tickCount: 0,
    activeScenario: 'nominal',
  };

  // Seed 32 historical ticks (1s intervals) so graphs are populated immediately on load
  const now = Date.now();
  for (let i = 31; i >= 0; i--) {
    state = stepMeshSimulation(state, now - i * 1000);
  }

  return state;
}

export function applyScenarioPreset(
  state: MeshNetworkState,
  preset: ScenarioPreset
): MeshNetworkState {
  const nextNodes = state.nodes.map((n) => {
    let faultMode: FaultMode = 'none';
    if (preset === 'rf_interference' && (n.id === 'R-02' || n.id === 'E-04')) {
      faultMode = 'interference';
    } else if (preset === 'backbone_congestion' && (n.id === 'R-03' || n.id === 'R-04')) {
      faultMode = 'congestion';
    } else if (preset === 'node_failover' && n.id === 'R-01') {
      faultMode = 'hardware_drop';
    }
    return { ...n, faultMode };
  });

  return stepMeshSimulation({
    ...state,
    nodes: nextNodes,
    activeScenario: preset,
  });
}

export function addCustomMeshNode(
  state: MeshNetworkState,
  config: {
    label: string;
    zone: string;
    role: NodeRole;
    band: FrequencyBand;
    channel: number;
  }
): MeshNetworkState {
  const count = state.nodes.length + 1;
  const prefix = config.role === 'relay' ? 'R' : 'E';
  const sameRoleCount = state.nodes.filter((n) => n.role === config.role).length + 1;
  const id = `${prefix}-0${sameRoleCount}`;
  const x = Math.round(180 + ((count * 137) % 600));
  const y = Math.round(170 + ((count * 97) % 300));

  const newNode: MeshNode = {
    id,
    label: config.label.trim() || `Mesh ${config.role === 'relay' ? 'Relay' : 'Edge'} ${sameRoleCount}`,
    zone: config.zone.trim() || 'Auxiliary Sector',
    role: config.role,
    x,
    y,
    ip: `10.24.${config.role === 'relay' ? 1 : 2}.${30 + count}`,
    mac: `A4:91:B1:08:49:${(20 + count).toString(16).toUpperCase().padStart(2, '0')}`,
    band: config.band,
    channel: config.channel,
    txPowerDbm: config.role === 'relay' ? 21 : 18,
    noiseFloorDbm: -94,
    rssiDbm: -55,
    snrDb: 39,
    latencyMs: 8.5,
    jitterMs: 1.2,
    packetLossPct: 0.15,
    throughputMbps: 140,
    hopCount: null,
    nextHopId: null,
    routePath: [],
    cpuLoadPct: 24,
    airtimeUtilPct: 18,
    uptimeSeconds: 1,
    status: 'nominal',
    faultMode: 'none',
    history: [],
  };

  // Connect to 2 nearest non-dropped nodes
  const nearest = [...state.nodes]
    .sort(
      (a, b) =>
        Math.hypot(a.x - newNode.x, a.y - newNode.y) -
        Math.hypot(b.x - newNode.x, b.y - newNode.y)
    )
    .slice(0, 2);

  const newLinks = nearest.map((peer, idx) =>
    evaluateLinkMetrics(newNode, peer, `LNK-${state.links.length + idx + 1}`, state.tickCount)
  );

  return stepMeshSimulation({
    ...state,
    nodes: [...state.nodes, newNode],
    links: [...state.links, ...newLinks],
  });
}
