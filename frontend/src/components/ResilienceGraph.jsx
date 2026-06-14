import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Hardcoded coordinates for sample architectures to guarantee pixel-perfect visual layouts
const LAYOUTS = {
  ecommerce: {
    "api-gateway": { x: 40, y: 160 },
    "orders-service": { x: 280, y: 160 },
    "payment-service": { x: 520, y: 50 },
    "inventory-service": { x: 520, y: 170 },
    "notification-queue": { x: 520, y: 290 },
    "email-service": { x: 760, y: 290 },
  },
  ridesharing: {
    "passenger-gateway": { x: 40, y: 80 },
    "driver-gateway": { x: 40, y: 240 },
    "matching-service": { x: 280, y: 160 },
    "billing-db": { x: 520, y: 80 },
    "notification-service": { x: 520, y: 240 },
  },
  banking: {
    "mobile-api": { x: 40, y: 80 },
    "web-api": { x: 40, y: 240 },
    "auth-service": { x: 280, y: 80 },
    "transaction-service": { x: 280, y: 240 },
    "ledger-db": { x: 520, y: 160 },
    "fraud-service": { x: 520, y: 280 },
  }
};

const getFallbackPosition = (index, count) => {
  const cols = Math.ceil(Math.sqrt(count));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return { x: 100 + col * 240, y: 100 + row * 150 };
};

// --- Frontend Topology Calculations ---

const getLongestSyncDepth = (nodeId, edges) => {
  const visited = new Set();
  const dfs = (curr) => {
    if (visited.has(curr)) return 0;
    visited.add(curr);
    let maxDepth = 0;
    const outgoingSync = edges.filter(e => (e.from_node === curr || e.from === curr) && e.sync);
    outgoingSync.forEach(e => {
      const to = e.to_node || e.to;
      maxDepth = Math.max(maxDepth, 1 + dfs(to));
    });
    visited.delete(curr);
    return maxDepth;
  };
  return dfs(nodeId);
};

const hasCycleFrom = (startId, adj) => {
  const visited = new Set();
  const dfs = (curr) => {
    const neighbors = adj[curr] || [];
    for (const neighbor of neighbors) {
      if (neighbor === startId) return true;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        if (dfs(neighbor)) return true;
      }
    }
    return false;
  };
  return dfs(startId);
};

const computeCentrality = (nodes, adj) => {
  const centrality = {};
  nodes.forEach(n => centrality[n.id] = 0);
  
  // Brandes betweenness centrality
  nodes.forEach(sNode => {
    const s = sNode.id;
    const S = [];
    const P = {};
    const sigma = {};
    const d = {};
    
    nodes.forEach(w => {
      P[w.id] = [];
      sigma[w.id] = 0;
      d[w.id] = -1;
    });
    
    sigma[s] = 1;
    d[s] = 0;
    
    const Q = [s];
    
    while (Q.length > 0) {
      const v = Q.shift();
      S.push(v);
      
      const neighbors = adj[v] || [];
      neighbors.forEach(w => {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }
    
    const delta = {};
    nodes.forEach(w => delta[w.id] = 0);
    
    while (S.length > 0) {
      const w = S.pop();
      P[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s) {
        centrality[w] += delta[w];
      }
    }
  });
  
  const N = nodes.length;
  const scale = N > 2 ? 1 / ((N - 1) * (N - 2)) : 1;
  nodes.forEach(n => {
    centrality[n.id] = centrality[n.id] * scale;
  });
  
  return centrality;
};

const computeTopologyMetrics = (blueprint) => {
  if (!blueprint) return { centrality: {}, inDegree: {}, outDegree: {}, antiPatterns: {}, priorityScores: {} };

  const nodes = blueprint.nodes || [];
  const edges = blueprint.edges || [];

  const adj = {};
  const inDegree = {};
  const outDegree = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
    outDegree[n.id] = 0;
  });

  edges.forEach(e => {
    const from = e.from_node || e.from;
    const to = e.to_node || e.to;
    if (adj[from]) adj[from].push(to);
    if (outDegree[from] !== undefined) outDegree[from]++;
    if (inDegree[to] !== undefined) inDegree[to]++;
  });

  const centrality = computeCentrality(nodes, adj);

  const antiPatterns = {};
  nodes.forEach(node => {
    const ap = [];
    const cent = centrality[node.id] || 0.0;
    const inD = inDegree[node.id] || 0;
    const outD = outDegree[node.id] || 0;

    const hasSelfLoop = edges.some(e => {
      const from = e.from_node || e.from;
      const to = e.to_node || e.to;
      return from === node.id && to === node.id;
    });
    if (hasSelfLoop) ap.push("self_loop");

    if (hasCycleFrom(node.id, adj)) {
      ap.push("dependency_cycle");
    }

    const hasSyncOutgoing = edges.some(e => {
      const from = e.from_node || e.from;
      return from === node.id && e.sync;
    });
    if (hasSyncOutgoing && !node.circuit_breaker && node.retries === 0) {
      ap.push("unprotected_sync_call");
    }

    if (cent > 0.4 && node.replicas <= 1) {
      ap.push("single_point_of_failure");
    }

    if (!node.circuit_breaker && cent > 0.4) {
      ap.push("missing_circuit_breaker");
    }

    const syncDepth = getLongestSyncDepth(node.id, edges);
    if (syncDepth > 3) {
      ap.push("long_sync_chain");
    }

    if ((node.type === "database" || node.type === "queue") && inD > 2) {
      ap.push("shared_state_risk");
    }

    if (outD > 5) {
      ap.push("fan_out_explosion");
    }

    if (node.type === "queue" && !node.has_dlq) {
      ap.push("queue_without_dlq");
    }

    antiPatterns[node.id] = ap;
  });

  const priorityScores = {};
  nodes.forEach(node => {
    const dc = node.declared_criticality;
    let criticalityWeight = 0.4;
    
    if (dc === undefined || dc === null) {
      const isEntry = (blueprint.entry_nodes || []).includes(node.id);
      criticalityWeight = isEntry ? 0.7 : 0.4;
    } else if (dc >= 0.9) {
      criticalityWeight = 1.0;
    } else if (dc >= 0.6) {
      criticalityWeight = 0.7;
    } else if (dc >= 0.3) {
      criticalityWeight = 0.4;
    } else {
      criticalityWeight = 0.1;
    }

    const cent = centrality[node.id] || 0.0;
    const apCount = antiPatterns[node.id]?.length || 0;
    priorityScores[node.id] = cent * criticalityWeight * (1 + apCount * 0.2);
  });

  return { centrality, inDegree, outDegree, antiPatterns, priorityScores };
};

// --- MOCK CASCADE RESULT IN CASE OF FALLBACKS ---
const MOCK_ECOMMERCE_CASCADE = [
  {
    "tick": 20,
    "source_node": "orders-service",
    "affected_node": "orders-service",
    "failure_type": "latency"
  },
  {
    "tick": 21,
    "source_node": "orders-service",
    "affected_node": "api-gateway",
    "failure_type": "dependency_failure"
  }
];

const ResilienceGraph = ({ blueprint, activeScenarioResult, currentTick, patchedNodes = [], loading }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [flowingEdges, setFlowingEdges] = useState({});
  const [targetedNodeId, setTargetedNodeId] = useState(null);

  // 1. Manage active target pulses and sequential edge flow animations
  useEffect(() => {
    if (!blueprint) {
      setFlowingEdges({});
      setTargetedNodeId(null);
      return;
    }

    // Determine cascade events (fallback to mock ecommerce cascade if none exists yet)
    let cascadeEvents = activeScenarioResult?.cascade_tree || [];
    if (cascadeEvents.length === 0 && blueprint.system_name === 'ecommerce') {
      cascadeEvents = MOCK_ECOMMERCE_CASCADE;
    }

    if (cascadeEvents.length === 0) {
      setFlowingEdges({});
      setTargetedNodeId(null);
      return;
    }

    const firstEvent = cascadeEvents[0];
    const startTick = firstEvent.tick;

    if (currentTick === startTick) {
      // 1. Set the target node to pulse red
      setTargetedNodeId(firstEvent.source_node);
      setFlowingEdges({});

      // 2. Schedule flows for propagating edges
      const propagationEvents = cascadeEvents.filter(e => e.source_node !== e.affected_node);
      const timers = [];

      propagationEvents.forEach((event, idx) => {
        // 500ms delay between consecutive hops in cascade order
        const delay = 500 * (idx + 1);

        const t = setTimeout(() => {
          // Find the edge connecting event.source_node and event.affected_node in either direction
          const edgeIdx = blueprint.edges.findIndex(edge => {
            const from = edge.from_node || edge.from;
            const to = edge.to_node || edge.to;
            return (from === event.source_node && to === event.affected_node) ||
                   (from === event.affected_node && to === event.source_node);
          });

          if (edgeIdx !== -1) {
            const edge = blueprint.edges[edgeIdx];
            const fromNode = edge.from_node || edge.from;
            const toNode = edge.to_node || edge.to;
            const edgeId = `e-${fromNode}-${toNode}-${edgeIdx}`;

            // Reverse path particle flow if the edge targets the source of failure (propagates upstream)
            const isReverse = (toNode === event.source_node);

            setFlowingEdges(prev => ({
              ...prev,
              [edgeId]: { flowing: true, reverse: isReverse }
            }));

            // Stop edge flow after 1.5 seconds
            const stopT = setTimeout(() => {
              setFlowingEdges(prev => {
                const updated = { ...prev };
                delete updated[edgeId];
                return updated;
              });
            }, 1500);
            timers.push(stopT);
          }
        }, delay);

        timers.push(t);
      });

      // Turn off node target pulse after 2 seconds
      const targetedTimer = setTimeout(() => {
        setTargetedNodeId(null);
      }, 2000);
      timers.push(targetedTimer);

      return () => timers.forEach(clearTimeout);
    }
  }, [currentTick, activeScenarioResult, blueprint]);

  // 2. Render ReactFlow Node & Edge sets
  useEffect(() => {
    if (!blueprint) return;

    const sysName = blueprint.system_name || 'custom';
    const activeLayout = LAYOUTS[sysName] || {};

    // Compute metrics
    const { centrality, inDegree, outDegree, antiPatterns, priorityScores } = computeTopologyMetrics(blueprint);

    const maxScore = Math.max(...Object.values(priorityScores), 0.1);
    const minScore = Math.min(...Object.values(priorityScores), 0);
    const scoreRange = maxScore - minScore;

    // Gather active degraded nodes at currentTick
    const degradedNodesAtTick = {};
    let sourceNodeAtTick = null;
    let cbStatesAtTick = {};

    let cascadeEvents = activeScenarioResult?.cascade_tree || [];
    if (cascadeEvents.length === 0 && blueprint.system_name === 'ecommerce') {
      cascadeEvents = MOCK_ECOMMERCE_CASCADE;
    }

    if (cascadeEvents.length > 0) {
      for (const event of cascadeEvents) {
        if (event.tick <= currentTick) {
          degradedNodesAtTick[event.affected_node] = true;
          if (event.source_node === event.affected_node && event.failure_type !== 'dependency_failure') {
            sourceNodeAtTick = event.source_node;
          }
        }
      }

      for (const event of cascadeEvents) {
        if (event.tick <= currentTick && event.failure_type === 'circuit_breaker_open') {
          cbStatesAtTick[event.affected_node] = 'OPEN';
        }
      }
    }

    // Map Nodes
    const flowNodes = blueprint.nodes.map((node, index) => {
      const position = activeLayout[node.id] || getFallbackPosition(index, blueprint.nodes.length);
      
      let status = 'healthy';
      if (node.id === sourceNodeAtTick) {
        status = 'source';
      } else if (degradedNodesAtTick[node.id]) {
        status = 'degraded';
      }

      const cbState = cbStatesAtTick[node.id] || 'CLOSED';

      // Sizing scale (40px to 80px based on priority score)
      const pScore = priorityScores[node.id] || 0;
      const nodeWidth = scoreRange > 0.001 
        ? 40 + ((pScore - minScore) / scoreRange) * 40 
        : 60;

      const isPatched = patchedNodes.includes(node.id);
      const isTargeted = node.id === targetedNodeId;

      return {
        id: node.id,
        type: 'custom',
        position,
        data: {
          id: node.id,
          label: node.label || node.id,
          type: node.type,
          replicas: node.replicas,
          circuit_breaker: node.circuit_breaker,
          circuit_breaker_state: cbState,
          status,
          nominal_latency_ms: node.nominal_latency_ms,
          failure_reason: status === 'source' ? 'ACTIVE PERTURBATION' : (status === 'degraded' ? 'DEGRADED PERFORMANCE' : null),
          width: nodeWidth,
          anti_patterns: antiPatterns[node.id] || [],
          isPatched,
          isTargeted,
          priority_score: pScore,
          centrality: centrality[node.id]
        }
      };
    });

    // Map Edges
    const flowEdges = blueprint.edges.map((edge, idx) => {
      const fromNode = edge.from_node || edge.from;
      const toNode = edge.to_node || edge.to;
      const edgeId = `e-${fromNode}-${toNode}-${idx}`;

      const isSourceDegraded = degradedNodesAtTick[fromNode];
      const isTargetDegraded = degradedNodesAtTick[toNode];
      const isCircuitOpen = cbStatesAtTick[fromNode] === 'OPEN' || cbStatesAtTick[toNode] === 'OPEN';

      let edgeColor = '#334155'; // default dark gray
      let isAnimated = false;

      if (currentTick > 0) {
        if (isCircuitOpen) {
          edgeColor = '#EF4444'; // red (broken connection)
          isAnimated = false;
        } else if (isSourceDegraded && isTargetDegraded) {
          edgeColor = '#F59E0B'; // orange (cascaded delay)
          isAnimated = true;
        } else if (isSourceDegraded || isTargetDegraded) {
          edgeColor = '#818CF8'; // soft purple
          isAnimated = true;
        } else {
          edgeColor = '#10B981'; // green (healthy active traffic)
          isAnimated = true;
        }
      } else {
        // Idle state (Tick 0)
        edgeColor = edge.sync ? '#6366F1' : '#0D9488';
        isAnimated = false;
      }

      // Dynamic edge thickness from simulation output metrics
      const fromStats = activeScenarioResult?.per_node_stats?.[fromNode];
      const toStats = activeScenarioResult?.per_node_stats?.[toNode];
      const fromVol = fromStats ? (fromStats.success + fromStats.failed) : 100;
      const toVol = toStats ? (toStats.success + toStats.failed) : 100;
      const fromShare = outDegree[fromNode] > 0 ? (fromVol / outDegree[fromNode]) : fromVol;
      const toShare = inDegree[toNode] > 0 ? (toVol / inDegree[toNode]) : toVol;
      const estimatedTraffic = (fromShare + toShare) / 2;
      const edgeThickness = Math.max(1.5, Math.min(6, 1.5 + (estimatedTraffic / 200)));

      const flowState = flowingEdges[edgeId];

      return {
        id: edgeId,
        source: fromNode,
        target: toNode,
        type: 'custom',
        data: {
          sync: edge.sync,
          color: edgeColor,
          isFlowing: !!flowState,
          reverse: flowState?.reverse,
          thickness: edgeThickness,
          isAnimated: isAnimated
        }
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [blueprint, activeScenarioResult, currentTick, flowingEdges, targetedNodeId, patchedNodes]);

  return (
    <div className={`w-full h-full min-h-[400px] transition-all duration-500 ${loading ? 'animate-bg-pulse' : ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        panOnScroll={false}
        zoomOnScroll={false}
        draggable={true}
      >
        <Background color="#1E293B" gap={16} size={1.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ResilienceGraph;
