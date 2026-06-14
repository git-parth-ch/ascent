import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Cpu, Play, Pause, RotateCcw, AlertTriangle, 
  Settings, CheckCircle, Shield, Download, Clipboard, X, RefreshCw, HelpCircle, Upload
} from 'lucide-react';

import ResilienceGraph from './components/ResilienceGraph';
import AgentLogsPanel from './components/AgentLogsPanel';
import ResilienceScore from './components/ResilienceScore';
import CascadeTree from './components/CascadeTree';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  // Sample architectures
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('ecommerce');
  
  // Current active blueprint and report
  const [blueprint, setBlueprint] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Simulation playback state
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // multiplier
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  
  // Patch application alerts & notifications
  const [notification, setNotification] = useState(null);
  const [yamlModalData, setYamlModalData] = useState(null);
  const [patchedNodes, setPatchedNodes] = useState([]);

  // Apply Fix detailed flow states
  const [patchingId, setPatchingId] = useState(null);
  const [patchErrors, setPatchErrors] = useState({});
  const [reanalyzing, setReanalyzing] = useState(false);
  const [fixedFindingIds, setFixedFindingIds] = useState([]);
  const [fixedFindings, setFixedFindings] = useState([]);
  
  // Timer for playback loop
  const playbackInterval = useRef(null);

  // Loading step strings for agent feedback
  const LOADING_STEPS = [
    "Initializing security sanitizer, stripping freeform input fields...",
    "Topology Analyst mapping NetworkX graph & calculating centrality...",
    "Detecting architectural weaknesses & synchronicity patterns...",
    "Orchestrator building adversary scenarios & test schedules...",
    "Running discrete-event simulation model...",
    "Cascade Analyzer compiling final stability report..."
  ];

  // 1. Fetch samples list on mount
  useEffect(() => {
    fetch(`${API_BASE}/samples`)
      .then(res => res.json())
      .then(data => {
        setSamples(data);
        if (data.length > 0) {
          loadBlueprint(data[0].name);
        }
      })
      .catch(err => {
        console.error("Failed to fetch samples:", err);
        // Fallback placeholder samples for visual stability
        setSamples([
          { name: "ecommerce", node_count: 6, weakness_count: 5 },
          { name: "ridesharing", node_count: 5, weakness_count: 3 },
          { name: "banking", node_count: 6, weakness_count: 4 }
        ]);
      });
  }, []);

  // 2. Load system blueprint
  const loadBlueprint = (name) => {
    setLoading(true);
    setLoadingStep(0);
    setPatchedNodes([]);
    setFixedFindings([]);
    setFixedFindingIds([]);
    setPatchErrors({});
    setPatchingId(null);
    setReanalyzing(false);
    
    // Simulate loading steps visually
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 450);

    fetch(`${API_BASE}/samples/${name}`)
      .then(res => res.json())
      .then(bpData => {
        setBlueprint(bpData);
        setSelectedSample(name);
        setCurrentTick(0);
        setIsPlaying(false);
        setActiveScenarioIdx(0);
        
        // Load cached analysis initially
        return fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bpData, force_live: false })
        });
      })
      .then(res => res.json())
      .then(reportData => {
        setReport(reportData);
        clearInterval(stepInterval);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading blueprint:", err);
        clearInterval(stepInterval);
        setLoading(false);
      });
  };

  // 3. Trigger live pipeline run
  const runLiveAnalysis = () => {
    if (!blueprint) return;
    setLoading(true);
    setLoadingStep(0);
    
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 600);

    fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, force_live: true })
    })
      .then(res => res.json())
      .then(reportData => {
        setReport(reportData);
        setCurrentTick(0);
        setIsPlaying(false);
        clearInterval(stepInterval);
        setLoading(false);
        showToast("Analysis complete. Resilience metrics updated!", "success");
      })
      .catch(err => {
        console.error("Live analysis failed:", err);
        clearInterval(stepInterval);
        setLoading(false);
        showToast("Live analysis failed. Using fallback simulation data.", "error");
      });
  };

  // 3b. Reset all simulation results and return to raw blueprint view
  const handleReset = () => {
    setReport(null);
    setPatchedNodes([]);
    setFixedFindings([]);
    setFixedFindingIds([]);
    setPatchErrors({});
    setPatchingId(null);
    setReanalyzing(false);
    setCurrentTick(0);
    setIsPlaying(false);
    showToast("Simulation and findings reset successfully.", "success");
  };

  // 3c. Upload custom blueprint JSON
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

        fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: customBlueprint, force_live: false })
        })
          .then(res => res.json())
          .then(reportData => {
            setReport(reportData);
            clearInterval(stepInterval);
            setLoading(false);
            showToast("Custom blueprint uploaded & analyzed successfully.", "success");
          })
          .catch(err => {
            console.error("Custom analysis failed:", err);
            clearInterval(stepInterval);
            setLoading(false);
            showToast("Analysis failed for custom blueprint.", "error");
          });

      } catch (err) {
        showToast("Failed to parse JSON file.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Helper toast notification
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setCurrentTick(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 150 / playbackSpeed);
    } else {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    }
    return () => clearInterval(playbackInterval.current);
  }, [isPlaying, playbackSpeed]);

  // Apply fix handler
  const handleApplyFix = (findingId, patchParams) => {
    if (!blueprint) return;
    
    // Clear previous error for this finding
    setPatchErrors(prev => ({ ...prev, [findingId]: null }));
    // Show spinner & label "Validating..."
    setPatchingId(findingId);

    fetch(`${API_BASE}/apply-fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprint,
        finding_id: findingId
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (!resData.valid) {
          // 4. If validator rejects: show a red error box below the button with the rejection reason.
          // Do not proceed. Button resets to "Apply Fix".
          setPatchErrors(prev => ({ ...prev, [findingId]: resData.rejection_reason }));
          setPatchingId(null);
        } else {
          // 5. If validator accepts:
          const targetNode = patchParams?.node_id || "unknown";
          
          // a. Shield icon (🛡) appears on the patched node in the graph
          setPatchedNodes(prev => [...prev, targetNode]);
          
          // b. The patched node border animates from red to green over 1 second
          // (This is triggered via keyframes on the node render update)
          setBlueprint(resData.patched_blueprint);

          // Add this finding to the fixed lists
          const originalFinding = report?.score_breakdown?.find(f => f.finding_id === findingId);
          if (originalFinding) {
            setFixedFindings(prev => [...prev, originalFinding]);
          }
          setFixedFindingIds(prev => [...prev, findingId]);

          // c. Automatically trigger POST /analyze with the patched blueprint and force_live=false
          // d. Show "Re-analyzing..." in the agent log panel
          setReanalyzing(true);
          setPatchingId(null); // clear button loading state

          fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blueprint: resData.patched_blueprint,
              force_live: false
            })
          })
            .then(analyzeRes => analyzeRes.json())
            .then(newReportData => {
              setReport(newReportData);
              setReanalyzing(false);
              showToast("Fix validated. Resilience score updated!", "success");
            })
            .catch(err => {
              console.error("Re-analysis failed:", err);
              setReanalyzing(false);
              showToast("Re-analysis failed.", "error");
            });
        }
      })
      .catch(err => {
        console.error("Failed to apply patch:", err);
        setPatchErrors(prev => ({ ...prev, [findingId]: "Network error trying to contact validation server." }));
        setPatchingId(null);
      });
  };

  // Export Chaos Mesh YAML
  const handleExportYaml = (finding, scenarioType) => {
    const targetNode = finding.patch_params.node_id;
    // magnitude_ms: severity (0.0–1.0) mapped to milliseconds (0–100ms)
    // e.g. severity=0.5 → 50ms latency injection in Chaos Mesh YAML
    // This is intentional — severity acts as a proxy for failure intensity.
    const magnitude = finding.severity * 100.0;
    
    fetch(`${API_BASE}/export-yaml/${finding.finding_id}?scenario_type=${scenarioType}&target_node=${targetNode}&magnitude=${magnitude}`)
      .then(res => res.text())
      .then(yamlText => {
        setYamlModalData({
          yaml: yamlText,
          node_id: targetNode,
          scenario: scenarioType
        });
      })
      .catch(err => {
        console.error("YAML export failed:", err);
        showToast("Failed to render Chaos Mesh config.", "error");
      });
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
      const file = new Blob([yamlModalData.yaml], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `chaos-mesh-${yamlModalData.node_id}-${yamlModalData.scenario}.yaml`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Calculate display list of findings: fixed ones are preserved, new active ones are appended below
  const displayFindings = [
    ...fixedFindings,
    ...(report?.score_breakdown || []).filter(f => !fixedFindingIds.includes(f.finding_id))
  ];

  // Extract currently active scenario results for timeline/graph mapping
  const currentScenarioResult = displayFindings[activeScenarioIdx]?.cascade_tree 
    ? {
        cascade_tree: displayFindings[activeScenarioIdx].cascade_tree,
        per_node_stats: displayFindings[activeScenarioIdx].affected_nodes
      }
    : null;

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col antialiased">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
            <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Ascent
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Autonomous System Chaos & Resilience Engineering Tool
            </p>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-snug">
              Autonomous pre-deployment resilience analysis powered by an agent swarm. Upload your architecture. Let Ascent find what breaks it.
            </p>
          </div>
        </div>

        {/* Architecture Selector */}
        <div className="flex items-center gap-2">
          {samples.map((sample) => (
            <button
              key={sample.name}
              onClick={() => loadBlueprint(sample.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-200 ${
                selectedSample === sample.name
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {sample.name.toUpperCase()} ({sample.node_count} nodes)
            </button>
          ))}

          <label className="ml-2 px-3 py-1.5 rounded-lg text-xs font-mono border bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-205 cursor-pointer flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Upload JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={handleUploadJson} 
              className="hidden" 
            />
          </label>
          
          <button
            onClick={runLiveAnalysis}
            className="ml-4 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Analysis
          </button>

          <button
            onClick={handleReset}
            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-350 flex items-center gap-1.5 transition-all"
            disabled={loading}
            title="Reset simulation and findings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>


        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
            <Cpu className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-bold text-slate-100 font-sans">Ascent is analyzing...</h3>
            <p className="text-xs text-indigo-400 font-mono animate-pulse">{LOADING_STEPS[loadingStep]}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border shadow-2xl flex items-center gap-3 animate-slide-in ${
          notification.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
            : 'bg-red-950/90 text-red-300 border-red-500/30'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 overflow-y-auto xl:overflow-hidden">
        {/* Left Column - Score & Graph (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Resilience Circular Gauge Summary */}
          {report && (
            <div className="sticky top-[76px] z-30 bg-slate-950/90 backdrop-blur-md rounded-xl p-0.5 shadow-lg border border-slate-800/50">
              <ResilienceScore 
                score={report.resilience_score}
                confidence={report.confidence}
                summary={report.overall_summary}
              />
            </div>
          )}

          {/* Graph Sandbox Viewer */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden h-[40vh] min-h-[250px] md:h-auto md:min-h-[450px] relative">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-350 font-mono">Sandbox Topology Simulation</span>
              
              {/* Playback Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-850">
                  <button 
                    onClick={() => setCurrentTick(0)} 
                    className="p-1 hover:text-white text-slate-400"
                    title="Reset to Tick 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 hover:text-white text-slate-305"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-400 w-16 text-center">TICK {currentTick}</span>
                </div>

                {/* Speed selector */}
                <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-850 text-[10px] font-mono">
                  {[1, 2, 5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-1 ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slider Range */}
            <div className="px-6 py-2 bg-slate-950/20 border-b border-slate-900 flex items-center gap-4">
              <span className="text-[10px] font-mono text-slate-500">T=0</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentTick} 
                onChange={(e) => setCurrentTick(parseInt(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-500">T=100</span>
            </div>

            {/* React Flow Render */}
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

        {/* Right Column - Findings & Agent Logs (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Findings & Vulnerabilities List */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col max-h-[380px] overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 font-mono border-b border-slate-800 pb-2">
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
                    onClick={() => {
                      setActiveScenarioIdx(idx);
                      setCurrentTick(0);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isFixed
                        ? 'bg-slate-950/20 border-emerald-950/30 opacity-60'
                        : isCurrent 
                          ? 'bg-indigo-950/15 border-indigo-500/50 shadow-inner' 
                          : 'bg-slate-950/35 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-black text-indigo-400">{finding.finding_id}</span>
                      <div className="flex items-center gap-1.5">
                        {isFixed && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-sans">
                            ✓ Fixed
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          IMPACT {(finding.impact * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mb-1">{finding.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {finding.remediation_text}
                    </p>

                    {finding.cascade_tree && finding.cascade_tree.length > 0 && (
                      <div className="mb-3 p-2 bg-slate-950/45 rounded-lg border border-slate-900" onClick={(e) => e.stopPropagation()}>
                        <CascadeTree cascadeEvents={finding.cascade_tree} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isFixed && patchingId !== finding.finding_id) {
                            handleApplyFix(finding.finding_id, finding.patch_params);
                          }
                        }}
                        disabled={isFixed || patchingId !== null}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold text-white transition-all ${
                          isFixed
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 cursor-not-allowed'
                            : patchingId === finding.finding_id
                              ? 'bg-indigo-700/60 cursor-wait'
                              : 'bg-indigo-600/90 hover:bg-indigo-700'
                        }`}
                      >
                        {patchingId === finding.finding_id ? (
                          <span className="flex items-center gap-1.5 font-sans">
                            <span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Validating...
                          </span>
                        ) : isFixed ? (
                          "Fixed"
                        ) : (
                          "Apply Fix"
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportYaml(finding, finding.scenario.split('_')[0]);
                        }}
                        className="px-2 py-1 rounded hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        YAML
                      </button>
                    </div>

                    {/* Validation Rejection Error Box */}
                    {patchErrors[finding.finding_id] && (
                      <div className="mt-2.5 p-2 bg-red-950/40 border border-red-900/50 rounded text-[10px] font-mono text-red-300">
                        <strong>Validation Rejection:</strong> {patchErrors[finding.finding_id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cascadefailure Timelines */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 max-h-[300px] overflow-y-auto">
            <CascadeTree 
              cascadeEvents={displayFindings?.[activeScenarioIdx]?.cascade_tree}
              currentTick={currentTick}
            />
          </div>

          {/* Agent execution logs */}
          <div className="flex-1 min-h-[320px]">
            <AgentLogsPanel reportData={report} blueprint={blueprint} reanalyzing={reanalyzing} />
          </div>
        </div>
      </main>

      {/* YAML modal preview */}
      {yamlModalData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-850 rounded-xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl animate-zoom-in">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Chaos Mesh Specification</h3>
                <p className="text-[10px] text-slate-500 font-mono">Export for target: {yamlModalData.node_id} ({yamlModalData.scenario})</p>
              </div>
              <button 
                onClick={() => setYamlModalData(null)}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code view */}
            <div className="p-5 flex-1 overflow-auto bg-slate-950 font-mono text-[11px] text-slate-300 whitespace-pre leading-relaxed border-b border-slate-850">
              {yamlModalData.yaml}
            </div>

            {/* Footer buttons */}
            <div className="px-5 py-3 flex justify-end gap-3 bg-slate-950/50">
              <button
                onClick={copyYamlToClipboard}
                className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs text-slate-300 flex items-center gap-1.5 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy Code
              </button>
              <button
                onClick={downloadYamlFile}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all"
              >
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
