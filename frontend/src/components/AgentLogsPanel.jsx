import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal } from 'lucide-react';

const AgentLogsPanel = ({ reportData, blueprint, reanalyzing }) => {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!reportData?.logs || reportData.logs.length === 0) { setVisibleLogs([]); return; }
    setVisibleLogs([]);
    const logs = reportData.logs;
    let currentIdx = 0;
    setVisibleLogs([logs[0]]);
    currentIdx = 1;
    const interval = setInterval(() => {
      if (currentIdx < logs.length) {
        setVisibleLogs(prev => [...prev, logs[currentIdx++]]);
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [reportData]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [visibleLogs]);

  if (reanalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-ascent-mid font-mono text-sm bg-white border border-ascent-border rounded-xl2 shadow-card">
        <Bot className="w-10 h-10 mb-3 text-ascent-orange animate-spin" />
        <div className="text-xs uppercase tracking-widest font-bold text-ascent-orange animate-pulse">Re-analyzing...</div>
        <div className="text-[10px] text-ascent-muted mt-2">Validating patch &amp; re-running simulation engine</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-ascent-muted font-mono text-sm bg-white border border-ascent-border rounded-xl2 shadow-card">
        <Terminal className="w-10 h-10 mb-3 text-ascent-border animate-pulse" />
        <div>Awaiting execution telemetry...</div>
      </div>
    );
  }

  const isStreaming = visibleLogs.length < (reportData.logs?.length || 0);

  const renderLogLine = (line, idx) => {
    const { agent, status, message } = line;
    let icon, agentClass = "text-ascent-dark font-bold", msgClass = "text-ascent-mid", fallbackText = "";

    switch (status) {
      case 'running':
        icon = <span className="text-ascent-orange animate-spin font-sans">⟳</span>;
        msgClass = "text-ascent-muted italic";
        break;
      case 'complete':
        icon = <span className="text-green-600 font-bold">✓</span>;
        break;
      case 'fallback':
        icon = <span className="text-amber-500 font-bold">⚠</span>;
        fallbackText = " (deterministic fallback)";
        msgClass = "text-amber-600";
        break;
      case 'error':
        icon = <span className="text-red-500 font-bold">✗</span>;
        msgClass = "text-red-600";
        break;
      default:
        icon = <span className="text-ascent-muted">•</span>;
    }

    let providerBadge = null;
    if (line.provider === "gemini") {
      providerBadge = <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-600 border border-blue-200 inline-block align-middle leading-none">Gemini</span>;
    } else if (line.provider === "groq") {
      providerBadge = <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-50 text-green-700 border border-green-200 inline-block align-middle leading-none">Groq</span>;
    } else if (line.provider === "deterministic") {
      providerBadge = <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-ascent-bg text-ascent-muted border border-ascent-border inline-block align-middle leading-none">Fallback</span>;
    }

    return (
      <div key={idx} className="flex items-start gap-2 text-xs font-mono py-1.5 px-2 rounded hover:bg-ascent-bg transition-colors animate-slide-in-left">
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</div>
        <div className="leading-relaxed">
          <span className={agentClass}>{agent}</span>
          {providerBadge}
          {status === 'fallback' && <span className="text-amber-600 font-semibold">{fallbackText}</span>}
          <span className="text-ascent-border mx-2">:</span>
          <span className={msgClass}>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-ascent-border rounded-xl2 overflow-hidden flex flex-col shadow-card">
      <div className="px-4 py-3 border-b border-ascent-border flex items-center gap-2 bg-ascent-bg">
        <Terminal className="w-4 h-4 text-ascent-orange" />
        <span className="text-xs font-bold uppercase tracking-wider text-ascent-mid font-mono">Ascent Analysis Log</span>
      </div>

      <div ref={containerRef} className="p-4 overflow-y-auto h-[400px] flex flex-col gap-1.5 scroll-smooth">
        {visibleLogs.map((line, idx) => renderLogLine(line, idx))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs font-mono py-1 px-2 mt-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="w-1.5 h-3.5 bg-ascent-orange animate-blink inline-block" />
            </div>
            <span className="text-[10px] italic text-ascent-muted">Streaming execution trace...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLogsPanel;
