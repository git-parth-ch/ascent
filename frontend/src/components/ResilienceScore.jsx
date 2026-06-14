import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';

const ScoreBreakdown = ({ findings }) => {
  // Format finding data for Recharts
  const data = findings.map(f => ({
    name: f.finding_id,
    title: f.title,
    impact: f.impact,
  }));

  // Max impact to set Domain
  const maxImpact = Math.max(...data.map(d => d.impact), 0.1);

  return (
    <div className="w-36 h-20 mt-3 border-t border-slate-800/40 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: -25, bottom: 0 }}
        >
          <XAxis type="number" domain={[0, maxImpact]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
            axisLine={false}
            tickLine={false}
            width={20}
          />
          <Bar 
            dataKey="impact" 
            radius={[0, 2, 2, 0]}
            barSize={5}
          >
            {data.map((entry, index) => {
              let color = '#eab308'; // yellow
              if (entry.impact > 0.15) {
                color = '#ef4444'; // red
              } else if (entry.impact > 0.08) {
                color = '#f97316'; // orange
              }
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
            <LabelList 
              dataKey="impact" 
              position="right" 
              formatter={(v) => `${(v * 100).toFixed(1)}%`} 
              style={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ResilienceScore = ({ score, confidence, summary, findings }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    const startValue = prevScoreRef.current;
    const endValue = score;
    if (startValue === endValue) {
      setDisplayScore(endValue);
      return;
    }

    setIsAnimating(true);
    const duration = 1500; // 1.5 seconds
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutCubic curve for a premium, snappy feel
      const ease = 1 - Math.pow(1 - percentage, 3);
      
      const currentValue = Math.round(startValue + (endValue - startValue) * ease);
      setDisplayScore(currentValue);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        prevScoreRef.current = endValue;
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Color logic based on animating score (FIX 6: green > 75)
  const getScoreColor = () => {
    if (displayScore > 75) return 'text-emerald-400 stroke-emerald-500';
    if (displayScore >= 50) return 'text-amber-400 stroke-amber-500';
    return 'text-red-400 stroke-red-500';
  };

  const getScoreBg = () => {
    if (displayScore > 75) return 'bg-emerald-950/20 border-emerald-900/30';
    if (displayScore >= 50) return 'bg-amber-950/20 border-amber-900/30';
    return 'bg-red-950/20 border-red-900/30';
  };

  const getScoreIcon = () => {
    if (displayScore > 75) return <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />;
    if (displayScore >= 50) return <Shield className="w-10 h-10 text-amber-400 animate-pulse" />;
    return <ShieldAlert className="w-10 h-10 text-red-400 animate-bounce" />;
  };

  // SVG Gauge details
  const radius = 50;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={`p-5 rounded-xl border ${getScoreBg()} flex flex-col md:flex-row items-center gap-6 shadow-xl transition-colors duration-500`}>
      {/* Circle Gauge & ScoreBreakdown container */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              className="stroke-slate-800"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              className={`transition-all duration-300 ease-out ${getScoreColor()}`}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          {/* Center content - old score fades slightly during animation */}
          <div className={`absolute flex flex-col items-center justify-center transition-opacity duration-300 ${isAnimating ? 'opacity-65' : 'opacity-100'}`}>
            <span className="text-2xl font-black font-mono text-slate-100">{displayScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Score</span>
          </div>
        </div>
        
        {/* Score breakdown horizontal bar chart */}
        {findings && findings.length > 0 && (
          <ScoreBreakdown findings={findings} />
        )}
      </div>

      {/* Summary Info */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          {getScoreIcon()}
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-sans">Ascent Resilience Score</h3>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Confidence: <span className="text-slate-200 font-bold">{confidence}%</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-350 leading-relaxed font-sans italic">
          "{summary || 'Perform resilience analysis to evaluate dependencies under extreme latency and retry storm conditions.'}"
        </p>

        {/* Confidence Progress Bar */}
        <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResilienceScore;
