import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Server, Database, Layers, Shield } from 'lucide-react';

const CylinderShape = ({ children, className, style }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ ...style, borderRadius: '0' }}>
      {/* 3D Top Cap */}
      <div className="absolute top-0 left-0 right-0 h-[25%] rounded-[50%/50%] bg-orange-400/40 border-inherit border-t-2 border-l-2 border-r-2 z-10" />
      {/* 3D Body & Bottom cap */}
      <div className="absolute inset-0 rounded-b-[50%_25%] bg-inherit border-2 border-inherit flex items-center justify-center pt-[10%]">
        {children}
      </div>
    </div>
  );
};

export default function CustomNode({ data }) {
  const {
    id,
    label,
    type,
    replicas,
    circuit_breaker,
    circuit_breaker_state,
    status, // "healthy", "degraded", "source"
    nominal_latency_ms,
    failure_reason,
    width,
    anti_patterns = [],
    isPatched,
    isTargeted,
    priority_score,
    centrality
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  // Determine shape size
  const size = width || 60;
  const iconSize = size >= 65 ? "w-6 h-6" : "w-4 h-4";

  // Determine background fill and base border colors
  let shapeClass = "";
  let baseColor = "";
  
  if (type === 'database') {
    shapeClass = "bg-orange-600/90 border-orange-500 text-orange-200";
    baseColor = "#F97316";
  } else if (type === 'queue') {
    shapeClass = "bg-purple-600/90 border-purple-500 text-purple-200 rounded-xl";
    baseColor = "#A855F7";
  } else {
    // service
    shapeClass = "bg-blue-600/90 border-blue-500 text-blue-200 rounded-xl";
    baseColor = "#3B82F6";
  }

  // Border & animation classes based on status
  let borderClass = "border-2";
  if (isPatched) {
    borderClass = "border-2 shadow-md shadow-emerald-500/20 animate-patch-success";
  } else if (isTargeted) {
    borderClass = "animate-target-pulse";
  } else if (anti_patterns.length > 0) {
    borderClass = "animate-border-pulse border-2 border-red-500/80";
  } else if (status === 'source') {
    borderClass = "animate-target-pulse";
  } else if (status === 'degraded') {
    borderClass = "border-2 border-amber-500 shadow-md shadow-amber-500/20";
  }

  const renderIcon = () => {
    switch (type) {
      case 'database':
        return <Database className={iconSize} />;
      case 'queue':
        return <Layers className={iconSize} />;
      default:
        return <Server className={iconSize} />;
    }
  };

  return (
    <div 
      className="relative flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Target/Source handles for ReactFlow */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: isPatched ? '#10B981' : baseColor }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: isPatched ? '#10B981' : baseColor }}
      />

      {/* Patched Shield Badge */}
      {isPatched && (
        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 text-[9px] shadow-lg border border-emerald-400 z-30 animate-bounce">
          <Shield className="w-3.5 h-3.5 fill-white" />
        </div>
      )}

      {/* Main Node Shape */}
      {type === 'database' ? (
        <CylinderShape 
          className={`shadow-lg transition-all duration-300 ${shapeClass} ${borderClass}`}
          style={{ width: size, height: size * 0.9 }}
        >
          {renderIcon()}
        </CylinderShape>
      ) : (
        <div 
          className={`flex items-center justify-center shadow-lg transition-all duration-300 ${shapeClass} ${borderClass}`}
          style={{ width: size, height: size }}
        >
          {renderIcon()}
        </div>
      )}

      {/* Below-Node Text Label */}
      <div className="text-[10px] font-semibold text-slate-350 mt-2 text-center whitespace-nowrap font-mono max-w-[130px] truncate flex items-center justify-center gap-1">
        {isPatched && <span>🛡️</span>}
        <span>{label}</span>
      </div>

      {/* Inspect Popover Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full mb-3 bg-slate-950/95 border border-slate-850 p-3 rounded-xl shadow-2xl z-50 text-[10px] w-52 font-mono text-slate-300 pointer-events-none flex flex-col gap-1.5 backdrop-blur-sm">
          <div className="border-b border-slate-900 pb-1 flex justify-between items-center">
            <span className="font-bold text-white uppercase">{label}</span>
            <span className="text-[9px] bg-slate-900 px-1 py-0.5 rounded text-slate-400 uppercase">{type}</span>
          </div>
          <div>Status: <span className={`font-semibold uppercase ${status === 'source' ? 'text-red-400' : (status === 'degraded' ? 'text-amber-400' : 'text-emerald-400')}`}>{status === 'source' ? 'PERTURBED' : status}</span></div>
          {failure_reason && <div className="text-red-400 text-[9px] bg-red-950/30 px-1 py-0.5 rounded">{failure_reason}</div>}
          <div>Latency: <span className="text-white">{nominal_latency_ms}ms</span></div>
          <div>Replicas: <span className="text-white">{replicas}</span></div>
          <div>Circuit Breaker: <span className={circuit_breaker ? "text-emerald-400" : "text-slate-500"}>{circuit_breaker ? (circuit_breaker_state || "CLOSED") : "DISABLED"}</span></div>
          {priority_score !== undefined && <div>Priority Score: <span className="text-indigo-400 font-bold">{(priority_score * 100).toFixed(1)}</span></div>}
          {centrality !== undefined && <div>Centrality: <span className="text-indigo-300">{(centrality).toFixed(3)}</span></div>}
          {anti_patterns.length > 0 && (
            <div className="border-t border-slate-900 pt-1.5">
              <div className="text-red-400 font-bold mb-0.5">Anti-patterns:</div>
              <div className="flex flex-col gap-0.5">
                {anti_patterns.map((ap, i) => (
                  <span key={i} className="text-[9px] bg-red-950/40 text-red-300 border border-red-900/30 rounded px-1 py-0.2 select-text">{ap}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
