import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal } from 'lucide-react';

const AgentLogsPanel = ({ reportData, blueprint, reanalyzing }) => {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const containerRef = useRef(null);

  // Reset and stream logs when reportData changes
  useEffect(() => {
    if (!reportData?.logs || reportData.logs.length === 0) {
      setVisibleLogs([]);
      return;
    }

    setVisibleLogs([]);
    const logs = reportData.logs;
    let currentIdx = 0;

    // Show the first log line immediately
    setVisibleLogs([logs[0]]);
    currentIdx = 1;

    const interval = setInterval(() => {
      if (currentIdx < logs.length) {
        const nextLine = logs[currentIdx];
        setVisibleLogs(prev => [...prev, nextLine]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [reportData]);

  // Smoothly scroll to the bottom of the log panel when new lines appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleLogs]);

  // 1. Reanalyzing/Loading State
  if (reanalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 font-mono text-sm bg-slate-950/80 border border-slate-800 rounded-xl">
        <Bot className="w-10 h-10 mb-3 text-indigo-400 animate-spin" />
        <div className="text-xs uppercase tracking-widest font-bold text-indigo-400 animate-pulse">Re-analyzing...</div>
        <div className="text-[10px] text-slate-500 mt-2">Validating patch & re-running simulation engine</div>
      </div>
    );
  }

  // 2. Initial Empty State
  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 font-mono text-sm bg-slate-950/80 border border-slate-800 rounded-xl">
        <Terminal className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <div>Awaiting execution telemetry...</div>
      </div>
    );
  }

  const isStreaming = visibleLogs.length < (reportData.logs?.length || 0);

  const renderLogLine = (line, idx) => {
    const { agent, status, message } = line;

    let icon = null;
    let agentClass = "text-white font-bold";
    let msgClass = "text-slate-300";
    let fallbackText = "";

    switch (status) {
      case 'running':
        icon = <span className="text-indigo-400 animate-spin font-sans">⟳</span>;
        msgClass = "text-slate-400 italic";
        break;
      case 'complete':
        icon = <span className="text-emerald-400 font-bold font-sans">✓</span>;
        break;
      case 'fallback':
        icon = <span className="text-amber-400 font-bold font-sans">⚠</span>;
        fallbackText = " (used deterministic fallback)";
        msgClass = "text-amber-400/90";
        break;
      case 'error':
        icon = <span className="text-red-500 font-bold font-sans">✗</span>;
        msgClass = "text-red-400";
        break;
      default:
        icon = <span className="text-slate-500">•</span>;
    }

    let providerBadge = null;
    if (line.provider) {
      if (line.provider === "gemini") {
        providerBadge = (
          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-950/60 text-blue-400 border border-blue-900/50 inline-block align-middle leading-none">
            Gemini
          </span>
        );
      } else if (line.provider === "groq") {
        providerBadge = (
          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 inline-block align-middle leading-none">
            Groq
          </span>
        );
      } else if (line.provider === "deterministic") {
        providerBadge = (
          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-900 text-slate-400 border border-slate-800 inline-block align-middle leading-none">
            Fallback
          </span>
        );
      }
    }

    return (
      <div
        key={idx}
        className="flex items-start gap-2 text-xs font-mono py-1.5 px-2 rounded hover:bg-slate-900/35 transition-colors animate-slide-in-left"
      >
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {icon}
        </div>
        <div className="leading-relaxed">
          <span className={agentClass}>{agent}</span>
          {providerBadge}
          {status === 'fallback' && (
            <span className="text-amber-400 font-semibold">{fallbackText}</span>
          )}
          <span className="text-slate-500 mx-2">:</span>
          <span className={msgClass}>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Terminal Header */}
      <div className="px-4 py-3 border-b border-slate-850 flex items-center gap-2 bg-slate-950/90">
        <Terminal className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Ascent Analysis Log
        </span>
      </div>

      {/* Terminal Log Console */}
      <div
        ref={containerRef}
        className="p-4 overflow-y-auto h-[400px] flex flex-col gap-1.5 scroll-smooth"
      >
        {visibleLogs.map((line, idx) => renderLogLine(line, idx))}

        {/* Blinking Cursor while streaming */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs font-mono py-1 px-2 mt-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="w-1.5 h-3.5 bg-indigo-500 animate-blink inline-block" />
            </div>
            <span className="text-[10px] italic text-slate-500">
              Streaming execution trace...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentLogsPanel;
