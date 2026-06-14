import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle,
  CheckCircle, Download, Clipboard, X, RefreshCw, Upload, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ResilienceGraph from './components/ResilienceGraph';
import AgentLogsPanel from './components/AgentLogsPanel';
import ResilienceScore from './components/ResilienceScore';
import CascadeTree from './components/CascadeTree';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server error: ${res.status}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

function App({ initialSample }) {
  const navigate = useNavigate();

  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [trafficProfile, setTrafficProfile] = useState('steady');

  const [blueprint, setBlueprint] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);

  const [notification, setNotification] = useState(null);
  const [yamlModalData, setYamlModalData] = useState(null);
  const [patchedNodes, setPatchedNodes] = useState([]);

  const [patchingId, setPatchingId] = useState(null);
  const [patchErrors, setPatchErrors] = useState({});
  const [reanalyzing, setReanalyzing] = useState(false);
  const [fixedFindingIds, setFixedFindingIds] = useState([]);
  const [fixedFindings, setFixedFindings] = useState([]);

  const playbackInterval = useRef(null);
  const initialSampleLoaded = useRef(false);

  const LOADING_STEPS = [
    "Initializing security sanitizer, stripping freeform input fields...",
    "Topology Analyst mapping NetworkX graph & calculating centrality...",
    "Detecting architectural weaknesses & synchronicity patterns...",
    "Orchestrator building adversary scenarios & test schedules...",
    "Running discrete-event simulation model...",
    "Cascade Analyzer compiling final stability report..."
  ];

  useEffect(() => {
    apiFetch(`${API_BASE}/samples`)
      .then(data => setSamples(data))
      .catch(() => {
        setSamples([
          { name: "ecommerce",   node_count: 14, weakness_count: 5 },
          { name: "ridesharing", node_count: 12, weakness_count: 3 },
          { name: "banking",     node_count: 16, weakness_count: 4 }
        ]);
      });
  }, []);

  // Auto-load if navigated here with a sample state
  useEffect(() => {
    if (initialSample && !initialSampleLoaded.current) {
      initialSampleLoaded.current = true;
      loadBlueprint(initialSample);
    }
  }, [initialSample]);

  const loadBlueprint = (name) => {
    setLoading(true);
    setLoadingStep(0);
    setPatchedNodes([]);
    setFixedFindings([]);
    setFixedFindingIds([]);
    setPatchErrors({});
    setPatchingId(null);
    setReanalyzing(false);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 450);

    apiFetch(`${API_BASE}/samples/${name}`)
      .then(bpData => {
        setBlueprint(bpData);
        setSelectedSample(name);
        setCurrentTick(0);
        setIsPlaying(false);
        setActiveScenarioIdx(0);
        return apiFetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bpData, force_live: false, traffic_profile: trafficProfile })
        });
      })
      .then(reportData => {
        setReport(reportData);
        clearInterval(stepInterval);
        setLoading(false);
      })
      .catch(err => {
        clearInterval(stepInterval);
        setLoading(false);
        showToast(err.message || "Error loading blueprint.", "error");
      });
  };

  const handleTriggerAnalysis = (forceLive = false) => {
    if (!blueprint) return;
    setLoading(true);
    setLoadingStep(0);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, forceLive ? 600 : 300);

    apiFetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, force_live: forceLive, traffic_profile: trafficProfile })
    })
      .then(reportData => {
        setReport(reportData);
        setCurrentTick(0);
        setIsPlaying(false);
        clearInterval(stepInterval);
        setLoading(false);
        showToast(forceLive ? "Live analysis complete." : "Analysis complete.", "success");
      })
      .catch(err => {
        clearInterval(stepInterval);
        setLoading(false);
        showToast(err.message || "Analysis failed.", "error");
      });
  };

  const triggerAnalysisWithProfile = (profile) => {
    if (!blueprint) return;
    setLoading(true);
    setLoadingStep(0);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 300);

    apiFetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, force_live: false, traffic_profile: profile })
    })
      .then(reportData => {
        setReport(reportData);
        setCurrentTick(0);
        setIsPlaying(false);
        clearInterval(stepInterval);
        setLoading(false);
        showToast(`Loaded cached analysis for ${profile} traffic.`, "success");
      })
      .catch(err => {
        clearInterval(stepInterval);
        setLoading(false);
        showToast(err.message || "Analysis failed.", "error");
      });
  };

  const handleReset = () => {
    setReport(null);
    setBlueprint(null);
    setSelectedSample(null);
    setTrafficProfile('steady');
    setPatchedNodes([]);
    setFixedFindings([]);
    setFixedFindingIds([]);
    setPatchErrors({});
    setPatchingId(null);
    setReanalyzing(false);
    setCurrentTick(0);
    setIsPlaying(false);
  };

  const handleUploadJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const customBlueprint = JSON.parse(event.target.result);
        if (!customBlueprint.system_name || !customBlueprint.nodes || !customBlueprint.edges) {
          showToast("Invalid blueprint format. Missing system_name, nodes, or edges.", "error");
          return;
        }
        setBlueprint(customBlueprint);
        setSelectedSample(null);
        setPatchedNodes([]);
        setFixedFindings([]);
        setFixedFindingIds([]);
        setPatchErrors({});
        setPatchingId(null);
        setReanalyzing(false);
        setCurrentTick(0);
        setIsPlaying(false);
        setLoading(true);
        setLoadingStep(0);
        const stepInterval = setInterval(() => {
          setLoadingStep(prev => {
            if (prev < LOADING_STEPS.length - 1) return prev + 1;
            clearInterval(stepInterval);
            return prev;
          });
        }, 300);

        apiFetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: customBlueprint, force_live: false, traffic_profile: trafficProfile })
        })
          .then(reportData => {
            setReport(reportData);
            clearInterval(stepInterval);
            setLoading(false);
            showToast("Custom blueprint analyzed successfully.", "success");
          })
          .catch(err => {
            clearInterval(stepInterval);
            setLoading(false);
            showToast(err.message || "Analysis failed for custom blueprint.", "error");
          });
      } catch {
        showToast("Failed to parse JSON file.", "error");
      }
    };
    reader.readAsText(file);
  };

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setCurrentTick(prev => {
          if (prev >= 100) { setIsPlaying(false); return 100; }
          return prev + 1;
        });
      }, 150 / playbackSpeed);
    } else {
      if (playbackInterval.current) clearInterval(playbackInterval.current);
    }
    return () => clearInterval(playbackInterval.current);
  }, [isPlaying, playbackSpeed]);

  const handleApplyFix = (findingId, patchParams) => {
    if (!blueprint) return;
    setPatchErrors(prev => ({ ...prev, [findingId]: null }));
    setPatchingId(findingId);

    apiFetch(`${API_BASE}/apply-fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, finding_id: findingId })
    })
      .then(resData => {
        if (!resData.valid) {
          setPatchErrors(prev => ({ ...prev, [findingId]: resData.rejection_reason }));
          setPatchingId(null);
        } else {
          const targetNode = patchParams?.node_id || "unknown";
          setPatchedNodes(prev => [...prev, targetNode]);
          setBlueprint(resData.patched_blueprint);
          const originalFinding = report?.score_breakdown?.find(f => f.finding_id === findingId);
          if (originalFinding) setFixedFindings(prev => [...prev, originalFinding]);
          setFixedFindingIds(prev => [...prev, findingId]);
          setReanalyzing(true);
          setPatchingId(null);

          apiFetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blueprint: resData.patched_blueprint, force_live: false, traffic_profile: trafficProfile })
          })
            .then(newReportData => {
              setReport(newReportData);
              setReanalyzing(false);
              showToast("Fix validated. Resilience score updated!", "success");
            })
            .catch(err => {
              setReanalyzing(false);
              showToast(err.message || "Re-analysis failed.", "error");
            });
        }
      })
      .catch(err => {
        setPatchErrors(prev => ({ ...prev, [findingId]: err.message || "Network error." }));
        setPatchingId(null);
      });
  };

  const handleExportYaml = (finding, scenarioType) => {
    const targetNode = finding.patch_params.node_id;
    const magnitude = finding.severity * 100.0;
    apiFetch(`${API_BASE}/export-yaml/${finding.finding_id}?scenario_type=${scenarioType}&target_node=${targetNode}&magnitude=${magnitude}`)
      .then(yamlText => setYamlModalData({ yaml: yamlText, node_id: targetNode, scenario: scenarioType }))
      .catch(err => showToast(err.message || "Failed to render Chaos Mesh config.", "error"));
  };

  const copyYamlToClipboard = () => {
    if (yamlModalData) {
      navigator.clipboard.writeText(yamlModalData.yaml);
      showToast("Chaos Mesh YAML copied to clipboard!", "success");
    }
  };

  const downloadYamlFile = () => {
    if (yamlModalData) {
      const element = document.createElement("a");
      const file = new Blob([yamlModalData.yaml], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `chaos-mesh-${yamlModalData.node_id}-${yamlModalData.scenario}.yaml`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const displayFindings = [
    ...fixedFindings,
    ...(report?.score_breakdown || []).filter(f => !fixedFindingIds.includes(f.finding_id))
  ];

  const currentScenarioResult = displayFindings[activeScenarioIdx]?.cascade_tree
    ? { cascade_tree: displayFindings[activeScenarioIdx].cascade_tree, per_node_stats: displayFindings[activeScenarioIdx].affected_nodes }
    : null;

  // Score color using warm theme thresholds (green >75, yellow 50-75, red <50)
  const getScoreColor = (s) => {
    if (s >= 75) return '#16A34A';
    if (s >= 50) return '#F59E0B';
    return '#DC2626';
  };

  return (
    <div className="min-h-screen bg-ascent-bg text-ascent-dark flex flex-col antialiased">
      {/* Navbar */}
      <header className="border-b border-ascent-border bg-white/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-nav">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ascent-orange rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-ascent-dark tracking-tight font-display">Ascent</span>
          </button>
          <span className="hidden md:block text-xs text-ascent-muted font-mono border-l border-ascent-border pl-3 ml-1">
            Autonomous Resilience Dashboard
          </span>
        </div>

        {blueprint && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="px-3 py-1.5 bg-ascent-bg border border-ascent-border rounded-lg text-xs font-mono text-ascent-mid">
              Active: <span className="font-bold text-ascent-orange uppercase">{selectedSample || 'Custom'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-ascent-bg border border-ascent-border px-2.5 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono text-ascent-muted uppercase">Traffic:</span>
              <select
                value={trafficProfile}
                onChange={(e) => { const v = e.target.value; setTrafficProfile(v); triggerAnalysisWithProfile(v); }}
                className="bg-transparent text-xs text-ascent-dark border-none outline-none cursor-pointer font-sans"
              >
                <option value="steady">Steady</option>
                <option value="burst">Burst (+300 req)</option>
                <option value="spike">Spike (instant peak)</option>
                <option value="diurnal">Diurnal (day pattern)</option>
              </select>
            </div>

            <label className="px-3 py-1.5 rounded-lg text-xs font-mono border bg-ascent-bg text-ascent-mid border-ascent-border hover:border-ascent-orange hover:text-ascent-dark cursor-pointer flex items-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5" />
              Upload JSON
              <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
            </label>

            <div className="flex flex-col items-center">
              <button
                onClick={() => handleTriggerAnalysis(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ascent-orange hover:bg-[#C94115] text-white flex items-center gap-1.5 shadow-cta transition-all justify-center"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Run Analysis
              </button>
              <button
                onClick={() => handleTriggerAnalysis(true)}
                className="text-[10px] font-medium text-ascent-muted hover:text-ascent-dark transition-colors mt-0.5"
                disabled={loading}
              >
                Force Live Re-Run ↺
              </button>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ascent-bg hover:bg-ascent-bg-alt border border-ascent-border text-ascent-mid flex items-center gap-1.5 transition-all"
              disabled={loading}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}
      </header>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-ascent-bg/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-ascent-border rounded-full" />
            <div className="absolute inset-0 border-4 border-t-ascent-orange border-r-ascent-orange rounded-full animate-spin" />
            <Shield className="absolute inset-0 m-auto w-10 h-10 text-ascent-orange animate-pulse" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-bold text-ascent-dark font-display">Ascent is analyzing...</h3>
            <p className="text-xs text-ascent-orange font-mono animate-pulse">{LOADING_STEPS[loadingStep]}</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-card flex items-center gap-3 animate-slide-in-left ${
          notification.type === 'success'
            ? 'bg-white text-green-700 border-green-200'
            : 'bg-white text-red-600 border-red-200'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-600" />
            : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {!report ? (
        /* Architecture Selector */
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto w-full">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-display font-extrabold text-ascent-dark">Select System Architecture</h2>
            <p className="text-ascent-mid text-sm max-w-xl mx-auto leading-relaxed">
              Choose a production-modeled architecture to run pre-deployment resilience analysis and identify cascading failures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
            {samples.map((sample) => {
              const descMap = {
                ecommerce:  "Payment path, shared DB, missing DLQ",
                ridesharing:"4-hop sync chain, fan-out explosion",
                banking:    "64× retry amplification, shared transaction DB",
              };
              return (
                <div
                  key={sample.name}
                  onClick={() => loadBlueprint(sample.name)}
                  className="bg-white hover:bg-ascent-bg border border-ascent-border hover:border-ascent-orange rounded-xl2 p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between h-44 group shadow-card hover:-translate-y-1"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-display font-extrabold uppercase text-ascent-dark group-hover:text-ascent-orange transition-colors">
                        {sample.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-ascent-muted bg-ascent-bg px-2 py-0.5 rounded-full border border-ascent-border">
                        {sample.node_count} nodes
                      </span>
                    </div>
                    <p className="text-xs text-ascent-mid leading-relaxed">{descMap[sample.name] || ''}</p>
                  </div>

                  <div className="pt-4 border-t border-ascent-border flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-ascent-orange bg-[#E8521A1A] border border-[#E8521A44] px-2.5 py-1 rounded-full">
                      {sample.weakness_count} weaknesses
                    </span>
                    <span className="text-xs font-mono text-ascent-orange group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Analyze →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <label className="px-5 py-2.5 rounded-full text-xs font-semibold border bg-white text-ascent-mid border-ascent-border hover:border-ascent-orange hover:text-ascent-dark cursor-pointer flex items-center gap-2 transition-all shadow-card">
            <Upload className="w-4 h-4" />
            Upload Custom Blueprint JSON
            <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
          </label>
        </div>
      ) : (
        <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 overflow-y-auto xl:overflow-hidden">
          {/* Left Column */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {report && (
              <div className="sticky top-[61px] z-30 bg-white/90 backdrop-blur-md rounded-xl2 p-0.5 shadow-card border border-ascent-border">
                <ResilienceScore
                  score={report.resilience_score}
                  confidence={report.confidence}
                  summary={report.overall_summary}
                  findings={report.score_breakdown}
                />
              </div>
            )}

            <div className="bg-ascent-bg-alt border border-ascent-border rounded-xl2 flex-1 flex flex-col overflow-hidden h-[40vh] min-h-[250px] md:h-auto md:min-h-[450px] relative shadow-card">
              <div className="px-4 py-3 border-b border-ascent-border flex items-center justify-between bg-white/60">
                <span className="text-xs font-bold uppercase tracking-wider text-ascent-muted font-mono">Sandbox Topology Simulation</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-ascent-border">
                    <button onClick={() => setCurrentTick(0)} className="p-1 hover:text-ascent-orange text-ascent-muted" title="Reset">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:text-ascent-orange text-ascent-mid">
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-mono font-bold text-ascent-mid w-16 text-center">TICK {currentTick}</span>
                  </div>
                  <div className="flex items-center bg-white rounded-lg border border-ascent-border text-[10px] font-mono overflow-hidden">
                    {[1, 2, 5].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2.5 py-1 transition-colors ${playbackSpeed === speed ? 'bg-ascent-orange text-white' : 'text-ascent-mid hover:text-ascent-dark'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-2 bg-white/40 border-b border-ascent-border flex items-center gap-4">
                <span className="text-[10px] font-mono text-ascent-muted">T=0</span>
                <input
                  type="range" min="0" max="100" value={currentTick}
                  onChange={(e) => setCurrentTick(parseInt(e.target.value))}
                  className="flex-1 cursor-pointer accent-ascent-orange"
                />
                <span className="text-[10px] font-mono text-ascent-muted">T=100</span>
              </div>

              <div className="flex-1 relative">
                <ResilienceGraph
                  blueprint={blueprint}
                  activeScenarioResult={currentScenarioResult}
                  currentTick={currentTick}
                  patchedNodes={patchedNodes}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Findings */}
            <div className="bg-white border border-ascent-border rounded-xl2 p-4 space-y-4 flex flex-col max-h-[380px] overflow-hidden shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ascent-muted font-mono border-b border-ascent-border pb-2">
                Detected Bottlenecks ({displayFindings.length})
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {displayFindings.map((finding, idx) => {
                  const targetNode = finding.patch_params?.node_id || "unknown";
                  const isCurrent = activeScenarioIdx === idx;
                  const isFixed = fixedFindingIds.includes(finding.finding_id);

                  return (
                    <div
                      key={finding.finding_id}
                      onClick={() => { setActiveScenarioIdx(idx); setCurrentTick(0); }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isFixed
                          ? 'bg-ascent-bg border-green-200 opacity-70'
                          : isCurrent
                            ? 'bg-[#E8521A08] border-ascent-orange shadow-sm'
                            : 'bg-ascent-bg border-ascent-border hover:border-ascent-orange'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-black text-ascent-orange">{finding.finding_id}</span>
                        <div className="flex items-center gap-1.5">
                          {isFixed && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded flex items-center gap-1">
                              ✓ Fixed
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-ascent-bg border border-ascent-border text-ascent-muted">
                            IMPACT {(finding.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-ascent-dark mb-1">{finding.title}</h4>

                      <div className="mb-2.5 p-2 bg-white rounded-lg border border-ascent-border font-mono text-[10px] text-ascent-mid space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-ascent-muted">Severity: </span><span className="font-bold text-red-500">{(finding.severity * 100).toFixed(1)}%</span></div>
                          <div><span className="text-ascent-muted">Blast Radius: </span><span className="font-bold text-ascent-orange">{(finding.blast_radius * 100).toFixed(1)}%</span></div>
                        </div>
                        <div>
                          <span className="text-ascent-muted">Likelihood: </span>
                          <span className="font-bold text-ascent-amber">{finding.likelihood.toFixed(2)}</span>
                          <span className="text-ascent-muted text-[9px] block leading-tight font-sans italic mt-0.5">({finding.likelihood_breakdown})</span>
                        </div>
                        {finding.affected_nodes && finding.affected_nodes.length > 0 && (
                          <div className="pt-1.5 border-t border-ascent-border">
                            <span className="text-ascent-muted block mb-1">Affected Nodes:</span>
                            <div className="flex flex-wrap gap-1 font-sans">
                              {finding.affected_nodes.map(node => (
                                <span key={node} className="px-1.5 py-0.5 bg-ascent-bg border border-ascent-border text-ascent-mid text-[9px] rounded font-mono">{node}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-ascent-mid line-clamp-2 leading-relaxed mb-3">{finding.remediation_text}</p>

                      {finding.cascade_tree && finding.cascade_tree.length > 0 && (
                        <div className="mb-3 p-2 bg-ascent-bg rounded-lg border border-ascent-border" onClick={(e) => e.stopPropagation()}>
                          <CascadeTree cascadeEvents={finding.cascade_tree} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-ascent-border font-mono">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!isFixed && patchingId !== finding.finding_id) handleApplyFix(finding.finding_id, finding.patch_params); }}
                          disabled={isFixed || patchingId !== null}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all ${
                            isFixed
                              ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                              : patchingId === finding.finding_id
                                ? 'bg-ascent-amber cursor-wait'
                                : 'bg-ascent-orange hover:bg-[#C94115]'
                          }`}
                        >
                          {patchingId === finding.finding_id ? (
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Validating...
                            </span>
                          ) : isFixed ? 'Fixed' : 'Apply Fix'}
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportYaml(finding, finding.scenario.split('_')[0]); }}
                          className="px-2 py-1 rounded-lg hover:bg-ascent-bg border border-ascent-border text-ascent-muted hover:text-ascent-dark text-[10px] font-mono flex items-center gap-1 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          YAML
                        </button>
                      </div>

                      {patchErrors[finding.finding_id] && (
                        <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] font-mono text-red-600">
                          <strong>Validation Rejection:</strong> {patchErrors[finding.finding_id]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cascade tree */}
            <div className="bg-white border border-ascent-border rounded-xl2 p-4 max-h-[300px] overflow-y-auto shadow-card">
              <CascadeTree
                cascadeEvents={displayFindings?.[activeScenarioIdx]?.cascade_tree}
                currentTick={currentTick}
              />
            </div>

            {/* Agent logs */}
            <div className="flex-1 min-h-[320px]">
              <AgentLogsPanel reportData={report} blueprint={blueprint} reanalyzing={reanalyzing} />
            </div>
          </div>
        </main>
      )}

      {/* YAML Modal */}
      {yamlModalData && (
        <div className="fixed inset-0 bg-ascent-dark/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white border border-ascent-border rounded-xl2 max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl">
            <div className="px-5 py-4 border-b border-ascent-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-ascent-dark">Chaos Mesh Specification</h3>
                <p className="text-[10px] text-ascent-muted font-mono">Target: {yamlModalData.node_id} ({yamlModalData.scenario})</p>
              </div>
              <button onClick={() => setYamlModalData(null)} className="p-1.5 hover:bg-ascent-bg rounded-lg text-ascent-muted hover:text-ascent-dark transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-auto bg-ascent-dark font-mono text-[11px] text-[#A89880] whitespace-pre leading-relaxed border-b border-ascent-border rounded-none">
              {yamlModalData.yaml}
            </div>

            <div className="px-5 py-3 flex justify-end gap-3 bg-ascent-bg rounded-b-xl2">
              <button onClick={copyYamlToClipboard} className="px-3 py-1.5 rounded-lg border border-ascent-border hover:bg-white text-xs text-ascent-mid flex items-center gap-1.5 transition-all">
                <Clipboard className="w-3.5 h-3.5" />
                Copy Code
              </button>
              <button onClick={downloadYamlFile} className="px-4 py-1.5 rounded-lg bg-ascent-orange hover:bg-[#C94115] text-xs font-bold text-white transition-all shadow-cta">
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
