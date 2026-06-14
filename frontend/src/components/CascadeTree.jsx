import React, { useState } from 'react';

const getFailureEmoji = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('latency')) return '⚡';
  if (t.includes('timeout')) return '⏱';
  if (t.includes('unavailable') || t.includes('circuit_breaker') || t.includes('fail')) return '💀';
  if (t.includes('degraded') || t.includes('dependency')) return '📦';
  if (t.includes('retry')) return '🔄';
  return '⚠️';
};

const formatFailureLabel = (type = '') => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const TreeNode = ({ node, isRoot }) => {
  const isLeaf = !node.children || node.children.length === 0;

  // Root = red, Leaf = dark red, Downstream = orange
  let colorClass = "text-orange-400 border-orange-500/25 bg-orange-950/20";
  if (isRoot) {
    colorClass = "text-red-400 border-red-500/35 bg-red-950/25";
  } else if (isLeaf) {
    colorClass = "text-red-750 border-red-900/50 bg-red-950/35";
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/* Node Label Pill */}
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono ${colorClass}`}>
        <span className="text-xs select-none">{getFailureEmoji(node.failure_type)}</span>
        <span className="font-bold">{node.node}</span>
        <span className="opacity-70 text-[9px] font-sans">({formatFailureLabel(node.failure_type)} · tick {node.tick})</span>
      </div>

      {/* Render children recursively */}
      {node.children && node.children.length > 0 && (
        <div className="pl-3 ml-2.5 border-l border-slate-800 flex flex-col gap-1.5">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CascadeTree({ cascadeEvents, currentTick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!cascadeEvents || cascadeEvents.length === 0) {
    return (
      <div className="text-[10px] font-mono text-slate-550 bg-slate-905/10 p-2 rounded border border-slate-850/40">
        No cascade events recorded.
      </div>
    );
  }

  // Filter events by tick if currentTick is provided
  const activeEvents = currentTick !== undefined
    ? cascadeEvents.filter(e => e.tick <= currentTick)
    : cascadeEvents;

  if (activeEvents.length === 0) {
    return (
      <div className="text-[10px] font-mono text-slate-500 bg-slate-900/10 p-2 rounded border border-slate-800/40">
        Move simulation slider forward to see cascade.
      </div>
    );
  }

  // Map and build tree hierarchy
  const items = activeEvents.map(e => {
    const node = e.node || e.affected_node;
    let parent = e.parent;
    if (parent === undefined && e.source_node) {
      parent = e.source_node === e.affected_node ? null : e.source_node;
    }
    return {
      node,
      parent: parent || null,
      failure_type: e.failure_type,
      tick: e.tick
    };
  });

  const nodeMap = {};
  items.forEach(item => {
    nodeMap[item.node] = { ...item, children: [] };
  });

  const roots = [];
  items.forEach(item => {
    const treeNode = nodeMap[item.node];
    if (item.parent && nodeMap[item.parent]) {
      nodeMap[item.parent].children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  });

  return (
    <div className="space-y-2 select-none">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 hover:text-indigo-350 transition-colors uppercase tracking-wider font-bold"
      >
        <span>{isExpanded ? '▼' : '▶'} Cascade Tree ({activeEvents.length} nodes)</span>
      </button>

      {isExpanded && (
        <div className="pl-1 pt-1 flex flex-col gap-1.5">
          {roots.map((root, idx) => (
            <TreeNode key={idx} node={root} isRoot={true} />
          ))}
        </div>
      )}
    </div>
  );
}
