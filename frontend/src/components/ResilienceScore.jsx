import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';

const ScoreBreakdown = ({ findings }) => {
  const data = findings.map(f => ({ name: f.finding_id, impact: f.impact }));
  const maxImpact = Math.max(...data.map(d => d.impact), 0.1);

  return (
    <div className="w-36 h-20 mt-3 border-t border-ascent-border pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: -25, bottom: 0 }}>
          <XAxis type="number" domain={[0, maxImpact]} hide />
          <YAxis
            dataKey="name" type="category"
            tick={{ fill: '#A89880', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}
            axisLine={false} tickLine={false} width={20}
          />
          <Bar dataKey="impact" radius={[0, 2, 2, 0]} barSize={5}>
            {data.map((entry, i) => {
              let color = '#F59E0B';
              if (entry.impact > 0.15) color = '#DC2626';
              else if (entry.impact > 0.08) color = '#E8521A';
              return <Cell key={i} fill={color} />;
            })}
            <LabelList
              dataKey="impact" position="right"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
              style={{ fill: '#A89880', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' }}
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

  const getScoreBg = () => {
    if (displayScore > 75) return 'bg-green-50 border-green-200';
    if (displayScore >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreIcon = () => {
    if (displayScore > 75) return <ShieldCheck className="w-10 h-10 text-green-600 animate-pulse" />;
    if (displayScore >= 50) return <Shield className="w-10 h-10 text-amber-500 animate-pulse" />;
    return <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce" />;
  };

  const radius = 50;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={`p-5 rounded-xl2 border ${getScoreBg()} flex flex-col md:flex-row items-center gap-6 transition-colors duration-500`}>
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle className="stroke-ascent-border" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
            <circle
              fill="transparent"
              stroke={getScoreStroke()}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease-out' }}
              r={normalizedRadius} cx={radius} cy={radius}
            />
          </svg>
          <div className={`absolute flex flex-col items-center justify-center transition-opacity duration-300 ${isAnimating ? 'opacity-65' : 'opacity-100'}`}>
            <span className="text-2xl font-black font-mono text-ascent-dark">{displayScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-ascent-muted">Score</span>
          </div>
        </div>
        {findings && findings.length > 0 && <ScoreBreakdown findings={findings} />}
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          {getScoreIcon()}
          <div>
            <h3 className="text-lg font-bold text-ascent-dark font-display">Ascent Resilience Score</h3>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-xs font-mono text-ascent-muted flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-ascent-orange" />
                Confidence: <span className="text-ascent-dark font-bold ml-1">{confidence}%</span>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-ascent-mid leading-relaxed italic">
          "{summary || 'Perform resilience analysis to evaluate dependencies under extreme latency and retry storm conditions.'}"
        </p>

        <div className="w-full bg-ascent-border h-1.5 rounded-full overflow-hidden">
          <div className="bg-ascent-orange h-full rounded-full transition-all duration-700" style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ResilienceScore;
