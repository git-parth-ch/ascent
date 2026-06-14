import React, { useState } from 'react';

const getFailureEmoji = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('latency'))    return '⚡';
  if (t.includes('timeout'))    return '⏱';
  if (t.includes('unavailable') || t.includes('circuit_breaker') || t.includes('fail')) return '💀';
  if (t.includes('degraded') || t.includes('dependency')) return '📦';
  if (t.includes('retry'))      return '🔄';
  return '⚠️';
};

const formatFailureLabel = (type = '') =>
  type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const TreeNode = ({ node, isRoot }) => {
  const isLeaf = !node.children || node.children.length === 0;
  let colorClass = 'text-ascent-orange border-[#F2A65A44] bg-[#F2A65A0D]';
  if (isRoot) colorClass = 'text-red-600 border-red-200 bg-red-50';
  else if (isLeaf) colorClass = 'text-red-700 border-red-200 bg-red-50';

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono ${colorClass}`}>
        <span className="text-xs select-none">{getFailureEmoji(node.failure_type)}</span>
        <span className="font-bold">{node.node}</span>
        <span className="opacity-70 text-[9px] font-sans">({formatFailureLabel(node.failure_type)} · tick {node.tick})</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="pl-3 ml-2.5 border-l border-ascent-border flex flex-col gap-1.5">
          {node.children.map((child, idx) => <TreeNode key={idx} node={child} isRoot={false} />)}
        </div>
      )}
    </div>
  );
};

export default function CascadeTree({ cascadeEvents, currentTick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!cascadeEvents || cascadeEvents.length === 0) {
    return (
      <div className="text-[10px] font-mono text-ascent-muted p-2 rounded border border-ascent-border">
        No cascade events recorded.
      </div>
    );
  }

  const activeEvents = currentTick !== undefined
    ? cascadeEvents.filter(e => e.tick <= currentTick)
    : cascadeEvents;

  if (activeEvents.length === 0) {
    return (
      <div className="text-[10px] font-mono text-ascent-muted p-2 rounded border border-ascent-border">
        Move simulation slider forward to see cascade.
      </div>
    );
  }

  const items = activeEvents.map(e => {
    const node = e.node || e.affected_node;
    let parent = e.parent;
    if (parent === undefined && e.source_node) {
      parent = e.source_node === e.affected_node ? null : e.source_node;
    }
    return { node, parent: parent || null, failure_type: e.failure_type, tick: e.tick };
  });

  const nodeMap = {};
  items.forEach(item => { nodeMap[item.node] = { ...item, children: [] }; });
  const roots = [];
  items.forEach(item => {
    const treeNode = nodeMap[item.node];
    if (item.parent && nodeMap[item.parent]) nodeMap[item.parent].children.push(treeNode);
    else roots.push(treeNode);
  });

  return (
    <div className="space-y-2 select-none">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-ascent-orange hover:text-[#C94115] transition-colors uppercase tracking-wider font-bold"
      >
        <span>{isExpanded ? '▼' : '▶'} Cascade Tree ({activeEvents.length} nodes)</span>
      </button>
      {isExpanded && (
        <div className="pl-1 pt-1 flex flex-col gap-1.5">
          {roots.map((root, idx) => <TreeNode key={idx} node={root} isRoot={true} />)}
        </div>
      )}
    </div>
  );
}
