import React from 'react';
import { getBezierPath } from 'reactflow';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) {
  const { sync, color, isFlowing, reverse, thickness, isAnimated } = data || {};

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const edgeColor = color || '#334155';
  const edgeThickness = thickness || 2.5;

  return (
    <>
      {/* Background/Base edge path */}
      <path
        id={id}
        className="react-flow__edge-path transition-all duration-300"
        d={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: edgeThickness,
          strokeDasharray: sync ? undefined : '5,5',
          fill: 'none',
        }}
      />

      {/* Animated dash overlay for active flows */}
      {isAnimated && !isFlowing && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={edgeThickness}
          className="react-flow__edge-path animate-dash"
          style={{
            strokeDasharray: sync ? undefined : '5,5',
          }}
        />
      )}

      {/* SVG flowing red dot particle for cascade animation */}
      {isFlowing && (
        <circle 
          r="5" 
          fill="#EF4444" 
          className="filter drop-shadow-[0_0_5px_rgba(239,68,68,0.9)]"
        >
          <animateMotion
            dur="0.8s"
            repeatCount="indefinite"
            path={edgePath}
            keyPoints={reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      )}
    </>
  );
}
