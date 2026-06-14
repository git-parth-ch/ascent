import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';

const ScoreBreakdown = ({ findings }) => {
  const data = findings.map(f => ({ name: f.finding_id, impact: f.impact }));
  const maxImpact = Math.max(...data.map(d => d.impact), 0.1);

  return (
    <div className="w-40 h-24 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, maxImpact]} hide />
          <YAxis
            dataKey="name" type="category"
            tick={{ fill: 'var(--color-muted)', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}
            axisLine={false} tickLine={false} width={28}
          />
          <Bar dataKey="impact" radius={[0, 2, 2, 0]} barSize={6}>
            {data.map((entry, i) => {
              let color = '#F59E0B';
              if (entry.impact > 0.15) color = '#DC2626';
              else if (entry.impact > 0.08) color = '#E8521A';
              return <Cell key={i} fill={color} />;
            })}
            <LabelList
              dataKey="impact" position="right"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
              style={{ fill: 'var(--color-muted)', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' }}
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
    if (startValue === endValue) { setDisplayScore(endValue); return; }

    setIsAnimating(true);
    const duration = 1500;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const pct = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplayScore(Math.round(startValue + (endValue - startValue) * ease));
      if (pct < 1) requestAnimationFrame(animate);
      else { prevScoreRef.current = endValue; setIsAnimating(false); }
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getScoreStroke = () => {
    if (displayScore > 75) return '#16A34A';
    if (displayScore >= 50) return '#F59E0B';
    return '#DC2626';
  };

  const getScoreBorderColor = () => {
    if (displayScore > 75) return '#16A34A44';
    if (displayScore >= 50) return '#F59E0B44';
    return '#DC262644';
  };

  const getScoreIcon = () => {
    if (displayScore > 75) return <ShieldCheck className="w-9 h-9 text-green-600" />;
    if (displayScore >= 50) return <Shield className="w-9 h-9 text-amber-500" />;
    return <ShieldAlert className="w-9 h-9 text-red-500" />;
  };

  const radius = 44;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div
      className="px-5 py-4 rounded-xl2 flex flex-col md:flex-row items-center gap-5 transition-colors duration-500"
      style={{ border: `1px solid ${getScoreBorderColor()}`, backgroundColor: 'var(--color-card)' }}
    >
      {/* Gauge + bar chart */}
      <div className="flex flex-col items-center shrink-0">
        {/* SVG gauge — viewBox ensures cx=50,cy=50 is truly centered */}
        <div className="relative w-28 h-28">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full -rotate-90"
          >
            <circle
              cx="50" cy="50" r={radius}
              fill="transparent"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="50" cy="50" r={radius}
              fill="transparent"
              stroke={getScoreStroke()}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.4s ease-out' }}
            />
          </svg>
          {/* centred label */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${isAnimating ? 'opacity-60' : 'opacity-100'}`}>
            <span className="text-2xl font-black font-mono leading-none" style={{ color: 'var(--color-dark)' }}>
              {displayScore}
            </span>
            <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-muted)' }}>Score</span>
          </div>
        </div>

        {findings && findings.length > 0 && <ScoreBreakdown findings={findings} />}
      </div>

      {/* Text info */}
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center gap-3">
          {getScoreIcon()}
          <div>
            <h3 className="text-base font-bold font-display" style={{ color: 'var(--color-dark)' }}>
              Ascent Resilience Score
            </h3>
            <span className="text-xs font-mono flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--color-muted)' }}>
              <Activity className="w-3.5 h-3.5 text-ascent-orange" />
              Confidence:&nbsp;<strong style={{ color: 'var(--color-dark)' }}>{confidence}%</strong>
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed italic" style={{ color: 'var(--color-mid)' }}>
          "{summary || 'Perform resilience analysis to evaluate dependencies under extreme latency and retry storm conditions.'}"
        </p>

        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${confidence}%`, backgroundColor: '#E8521A' }} />
        </div>
      </div>
    </div>
  );
};

export default ResilienceScore;
