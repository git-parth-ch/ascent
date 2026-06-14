import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle,
  CheckCircle, Download, Clipboard, X, RefreshCw, Upload,
  Sun, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';

import ResilienceGraph  from './components/ResilienceGraph';
import AgentLogsPanel  from './components/AgentLogsPanel';
import ResilienceScore from './components/ResilienceScore';
import CascadeTree     from './components/CascadeTree';

import lockupLight from './assets/ascent-lockup-light.svg';
import lockupDark  from './assets/ascent-lockup-dark.svg';
import bgImg       from './assets/bg.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server error: ${res.status}`);
  }
  const ct = res.headers.get('content-type');
  return ct && ct.includes('application/json') ? res.json() : res.text();
}

function App({ initialSample }) {
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useTheme();

  const [samples, setSamples]               = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [trafficProfile, setTrafficProfile] = useState('steady');
  const [blueprint, setBlueprint]           = useState(null);
  const [report, setReport]                 = useState(null);
  const [loading, setLoading]               = useState(false);
  const [loadingStep, setLoadingStep]       = useState(0);
  const [currentTick, setCurrentTick]       = useState(0);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [playbackSpeed, setPlaybackSpeed]   = useState(1);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [notification, setNotification]     = useState(null);
  const [yamlModalData, setYamlModalData]   = useState(null);
  const [patchedNodes, setPatchedNodes]     = useState([]);
  const [patchingId, setPatchingId]         = useState(null);
  const [patchErrors, setPatchErrors]       = useState({});
  const [reanalyzing, setReanalyzing]       = useState(false);
  const [fixedFindingIds, setFixedFindingIds] = useState([]);
  const [fixedFindings, setFixedFindings]   = useState([]);

  const playbackInterval = useRef(null);
  const initialSampleLoaded = useRef(false);

  const LOADING_STEPS = [
    'Initializing security sanitizer, stripping freeform input fields...',
    'Topology Analyst mapping NetworkX graph & calculating centrality...',
    'Detecting architectural weaknesses & synchronicity patterns...',
    'Orchestrator building adversary scenarios & test schedules...',
    'Running discrete-event simulation model...',
    'Cascade Analyzer compiling final stability report...',
  ];

  useEffect(() => {
    apiFetch(`${API_BASE}/samples`)
      .then(d => setSamples(d))
      .catch(() => setSamples([
        { name: 'ecommerce',   node_count: 14, weakness_count: 5 },
        { name: 'ridesharing', node_count: 12, weakness_count: 3 },
        { name: 'banking',     node_count: 16, weakness_count: 4 },
      ]));
  }, []);

  useEffect(() => {
    if (initialSample && !initialSampleLoaded.current) {
      initialSampleLoaded.current = true;
      loadBlueprint(initialSample);
    }
  }, [initialSample]);

  const stepInterval = (delay) => {
    const id = setInterval(() => {
      setLoadingStep(p => { if (p < LOADING_STEPS.length - 1) return p + 1; clearInterval(id); return p; });
    }, delay);
    return id;
  };

  const loadBlueprint = (name) => {
    setLoading(true); setLoadingStep(0);
    setPatchedNodes([]); setFixedFindings([]); setFixedFindingIds([]);
    setPatchErrors({}); setPatchingId(null); setReanalyzing(false);
    const sid = stepInterval(450);
    apiFetch(`${API_BASE}/samples/${name}`)
      .then(bp => {
        setBlueprint(bp); setSelectedSample(name);
        setCurrentTick(0); setIsPlaying(false); setActiveScenarioIdx(0);
        return apiFetch(`${API_BASE}/analyze`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bp, force_live: false, traffic_profile: trafficProfile }),
        });
      })
      .then(r => { setReport(r); clearInterval(sid); setLoading(false); })
      .catch(e => { clearInterval(sid); setLoading(false); showToast(e.message || 'Error.', 'error'); });
  };

  const handleTriggerAnalysis = (forceLive = false) => {
    if (!blueprint) return;
    setLoading(true); setLoadingStep(0);
    const sid = stepInterval(forceLive ? 600 : 300);
    apiFetch(`${API_BASE}/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, force_live: forceLive, traffic_profile: trafficProfile }),
    })
      .then(r => { setReport(r); setCurrentTick(0); setIsPlaying(false); clearInterval(sid); setLoading(false); showToast(forceLive ? 'Live analysis complete.' : 'Analysis complete.', 'success'); })
      .catch(e => { clearInterval(sid); setLoading(false); showToast(e.message || 'Analysis failed.', 'error'); });
  };

  const triggerAnalysisWithProfile = (profile) => {
    if (!blueprint) return;
    setLoading(true); setLoadingStep(0);
    const sid = stepInterval(300);
    apiFetch(`${API_BASE}/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, force_live: false, traffic_profile: profile }),
    })
      .then(r => { setReport(r); setCurrentTick(0); setIsPlaying(false); clearInterval(sid); setLoading(false); showToast(`Profile: ${profile}`, 'success'); })
      .catch(e => { clearInterval(sid); setLoading(false); showToast(e.message || 'Failed.', 'error'); });
  };

  const handleReset = () => {
    setReport(null); setBlueprint(null); setSelectedSample(null); setTrafficProfile('steady');
    setPatchedNodes([]); setFixedFindings([]); setFixedFindingIds([]);
    setPatchErrors({}); setPatchingId(null); setReanalyzing(false);
    setCurrentTick(0); setIsPlaying(false);
  };

  const handleUploadJson = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bp = JSON.parse(ev.target.result);
        if (!bp.system_name || !bp.nodes || !bp.edges) { showToast('Invalid blueprint format.', 'error'); return; }
        setBlueprint(bp); setSelectedSample(null);
        setPatchedNodes([]); setFixedFindings([]); setFixedFindingIds([]);
        setPatchErrors({}); setPatchingId(null); setReanalyzing(false);
        setCurrentTick(0); setIsPlaying(false); setLoading(true); setLoadingStep(0);
        const sid = stepInterval(300);
        apiFetch(`${API_BASE}/analyze`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bp, force_live: false, traffic_profile: trafficProfile }),
        })
          .then(r => { setReport(r); clearInterval(sid); setLoading(false); showToast('Blueprint analyzed.', 'success'); })
          .catch(err => { clearInterval(sid); setLoading(false); showToast(err.message || 'Analysis failed.', 'error'); });
      } catch { showToast('Failed to parse JSON.', 'error'); }
    };
    reader.readAsText(file);
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setCurrentTick(p => { if (p >= 100) { setIsPlaying(false); return 100; } return p + 1; });
      }, 150 / playbackSpeed);
    } else {
      clearInterval(playbackInterval.current);
    }
    return () => clearInterval(playbackInterval.current);
  }, [isPlaying, playbackSpeed]);

  const handleApplyFix = (findingId, patchParams) => {
    if (!blueprint) return;
    setPatchErrors(p => ({ ...p, [findingId]: null }));
    setPatchingId(findingId);
    apiFetch(`${API_BASE}/apply-fix`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, finding_id: findingId }),
    })
      .then(res => {
        if (!res.valid) { setPatchErrors(p => ({ ...p, [findingId]: res.rejection_reason })); setPatchingId(null); }
        else {
          setPatchedNodes(p => [...p, patchParams?.node_id || 'unknown']);
          setBlueprint(res.patched_blueprint);
          const orig = report?.score_breakdown?.find(f => f.finding_id === findingId);
          if (orig) setFixedFindings(p => [...p, orig]);
          setFixedFindingIds(p => [...p, findingId]);
          setReanalyzing(true); setPatchingId(null);
          apiFetch(`${API_BASE}/analyze`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blueprint: res.patched_blueprint, force_live: false, traffic_profile: trafficProfile }),
          })
            .then(nr => { setReport(nr); setReanalyzing(false); showToast('Fix validated. Score updated!', 'success'); })
            .catch(e => { setReanalyzing(false); showToast(e.message || 'Re-analysis failed.', 'error'); });
        }
      })
      .catch(e => { setPatchErrors(p => ({ ...p, [findingId]: e.message || 'Network error.' })); setPatchingId(null); });
  };

  const handleExportYaml = (finding, scenarioType) => {
    const tn = finding.patch_params.node_id;
    const mag = finding.severity * 100;
    apiFetch(`${API_BASE}/export-yaml/${finding.finding_id}?scenario_type=${scenarioType}&target_node=${tn}&magnitude=${mag}`)
      .then(y => setYamlModalData({ yaml: y, node_id: tn, scenario: scenarioType }))
      .catch(e => showToast(e.message || 'YAML export failed.', 'error'));
  };

  const copyYaml = () => { if (yamlModalData) { navigator.clipboard.writeText(yamlModalData.yaml); showToast('Copied!', 'success'); } };
  const downloadYaml = () => {
    if (!yamlModalData) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([yamlModalData.yaml], { type: 'text/plain' }));
    a.download = `chaos-mesh-${yamlModalData.node_id}-${yamlModalData.scenario}.yaml`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const displayFindings = [
    ...fixedFindings,
    ...(report?.score_breakdown || []).filter(f => !fixedFindingIds.includes(f.finding_id)),
  ];
  const currentScenarioResult = displayFindings[activeScenarioIdx]?.cascade_tree
    ? { cascade_tree: displayFindings[activeScenarioIdx].cascade_tree, per_node_stats: displayFindings[activeScenarioIdx].affected_nodes }
    : null;

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'var(--color-bg)', color: 'var(--color-dark)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b px-4 py-2.5"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

        {/* Single row: logo | controls (scrollable) | dark toggle */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="shrink-0">
            <img src={isDark ? lockupDark : lockupLight} alt="Ascent" className="h-9 w-auto" />
          </button>

          <span className="shrink-0 text-xs font-mono px-2 py-0.5 rounded border hidden sm:block"
            style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            Dashboard
          </span>

          {/* Scrollable controls strip */}
          {blueprint && (
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-0.5" style={{ scrollbarWidth: 'none' }}>

              {/* Active architecture */}
              <div className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-mono border"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-mid)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Active:&nbsp;</span>
                <span className="font-bold uppercase" style={{ color: '#E8521A' }}>{selectedSample || 'Custom'}</span>
              </div>

              {/* Traffic profile */}
              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--color-muted)' }}>Traffic:</span>
                <select
                  value={trafficProfile}
                  onChange={e => { const v = e.target.value; setTrafficProfile(v); triggerAnalysisWithProfile(v); }}
                  className="bg-transparent text-xs border-none outline-none cursor-pointer"
                  style={{ color: 'var(--color-dark)' }}
                >
                  <option value="steady">Steady</option>
                  <option value="burst">Burst</option>
                  <option value="spike">Spike</option>
                  <option value="diurnal">Diurnal</option>
                </select>
              </div>

              {/* Upload */}
              <label className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-mid)' }}>
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
              </label>

              {/* Run Analysis */}
              <button
                onClick={() => handleTriggerAnalysis(false)} disabled={loading}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: '#E8521A', boxShadow: '0 2px 8px rgba(232,82,26,0.35)' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#C94115'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#E8521A'; }}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Run Analysis
              </button>

              {/* Force live */}
              <button onClick={() => handleTriggerAnalysis(true)} disabled={loading}
                className="shrink-0 text-[10px] font-medium transition-colors"
                style={{ color: 'var(--color-muted)' }}>
                Force Live ↺
              </button>

              {/* Reset */}
              <button onClick={handleReset} disabled={loading}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-mid)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          )}

          {/* Spacer + dark toggle (always right) */}
          <div className="ml-auto shrink-0">
            <button onClick={toggleDark} className="p-2 rounded-full border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-mid)' }}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Loading overlay ──────────────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-6"
          style={{ backgroundColor: 'var(--color-bg)', opacity: 0.96, backdropFilter: 'blur(6px)' }}>
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: 'var(--color-border)' }} />
            <div className="absolute inset-0 border-4 border-t-ascent-orange border-r-ascent-orange rounded-full animate-spin" />
            <img src={isDark ? lockupDark : lockupLight} alt="" className="absolute inset-0 m-auto w-12 h-auto object-contain" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-bold font-display" style={{ color: 'var(--color-dark)' }}>Ascent is analyzing...</h3>
            <p className="text-xs font-mono text-ascent-orange animate-pulse">{LOADING_STEPS[loadingStep]}</p>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-card flex items-center gap-3 animate-slide-in-left ${
          notification.type === 'success' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-600'
        }`} style={{ backgroundColor: 'var(--color-card)' }}>
          {notification.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-600" />
            : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span className="text-xs font-semibold font-body">{notification.message}</span>
        </div>
      )}

      {/* ── Architecture Selector ─────────────────────────────────────────── */}
      {!report ? (
        <div
          className="flex-1 flex flex-col items-center justify-center p-8"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-bg)', opacity: 0.88 }} />

          <div className="relative z-10 w-full max-w-5xl">
            <div className="text-center space-y-3 mb-10">
              <h2 className="text-3xl font-display font-extrabold" style={{ color: 'var(--color-dark)' }}>
                Select System Architecture
              </h2>
              <p className="text-sm max-w-xl mx-auto leading-relaxed font-body" style={{ color: 'var(--color-mid)' }}>
                Choose a production-modeled architecture to run pre-deployment resilience analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
              {samples.map((s) => {
                const descMap = {
                  ecommerce:   'Payment path, shared DB, missing DLQ',
                  ridesharing: '4-hop sync chain, fan-out explosion',
                  banking:     '64× retry amplification, shared transaction DB',
                };
                return (
                  <div key={s.name} onClick={() => loadBlueprint(s.name)}
                    className="group rounded-xl2 p-6 cursor-pointer flex flex-col justify-between h-44 transition-all duration-200 hover:-translate-y-1"
                    style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(26,18,8,0.06), 0 4px 16px rgba(26,18,8,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#E8521A'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-display font-extrabold uppercase group-hover:text-ascent-orange transition-colors"
                          style={{ color: 'var(--color-dark)' }}>
                          {s.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                          style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                          {s.node_count} nodes
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-body" style={{ color: 'var(--color-mid)' }}>
                        {descMap[s.name] || ''}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: '#E8521A', backgroundColor: '#E8521A1A', border: '1px solid #E8521A44' }}>
                        {s.weakness_count} weaknesses
                      </span>
                      <span className="text-xs font-mono text-ascent-orange group-hover:translate-x-1 transition-transform">
                        Analyze →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <label className="px-5 py-2.5 rounded-full text-xs font-semibold border cursor-pointer flex items-center gap-2 transition-all hover:border-ascent-orange font-body"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-mid)' }}>
                <Upload className="w-4 h-4" />
                Upload Custom Blueprint JSON
                <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      ) : (

        /* ── Main Dashboard ───────────────────────────────────────────────── */
        <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-5 overflow-y-auto xl:overflow-hidden">

          {/* ── Left column: Score + Graph (8 cols) ─────────────────────── */}
          <div className="xl:col-span-8 flex flex-col gap-5">

            {/* Score gauge — sticky */}
            {report && (
              <div className="sticky top-[57px] z-30 rounded-xl2 p-0.5"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(26,18,8,0.06), 0 4px 16px rgba(26,18,8,0.04)' }}>
                <ResilienceScore
                  score={report.resilience_score}
                  confidence={report.confidence}
                  summary={report.overall_summary}
                  findings={report.score_breakdown}
                />
              </div>
            )}

            {/* Topology graph */}
            <div className="rounded-xl2 flex flex-col overflow-hidden flex-1 min-h-[380px]"
              style={{ backgroundColor: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(26,18,8,0.04)' }}>
              {/* Toolbar */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--color-muted)' }}>
                  Sandbox Topology Simulation
                </span>
                <div className="flex items-center gap-3">
                  {/* Play controls */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border"
                    style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <button onClick={() => setCurrentTick(0)} title="Reset" className="p-1 transition-colors hover:text-ascent-orange"
                      style={{ color: 'var(--color-muted)' }}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 transition-colors hover:text-ascent-orange"
                      style={{ color: 'var(--color-mid)' }}>
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-mono font-bold w-16 text-center" style={{ color: 'var(--color-mid)' }}>
                      TICK {currentTick}
                    </span>
                  </div>
                  {/* Speed */}
                  <div className="flex items-center rounded-lg overflow-hidden border text-[10px] font-mono"
                    style={{ borderColor: 'var(--color-border)' }}>
                    {[1, 2, 5].map(s => (
                      <button key={s} onClick={() => setPlaybackSpeed(s)}
                        className="px-2.5 py-1 transition-colors"
                        style={{ backgroundColor: playbackSpeed === s ? '#E8521A' : 'var(--color-card)', color: playbackSpeed === s ? '#fff' : 'var(--color-mid)' }}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tick slider */}
              <div className="px-6 py-2 flex items-center gap-4"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>T=0</span>
                <input type="range" min="0" max="100" value={currentTick}
                  onChange={e => setCurrentTick(parseInt(e.target.value))}
                  className="flex-1 cursor-pointer accent-ascent-orange" />
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>T=100</span>
              </div>

              {/* Graph */}
              <div className="flex-1 relative min-h-[320px]">
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

          {/* ── Right column: Findings + Logs (4 cols) ──────────────────── */}
          <div className="xl:col-span-4 flex flex-col gap-5">

            {/* Findings list */}
            <div className="rounded-xl2 p-4 flex flex-col max-h-[380px] overflow-hidden"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(26,18,8,0.04)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono pb-2 mb-2"
                style={{ color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}>
                Detected Bottlenecks ({displayFindings.length})
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {displayFindings.map((finding, idx) => {
                  const isCurrent = activeScenarioIdx === idx;
                  const isFixed   = fixedFindingIds.includes(finding.finding_id);
                  return (
                    <div key={finding.finding_id}
                      onClick={() => { setActiveScenarioIdx(idx); setCurrentTick(0); }}
                      className="p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: isFixed ? 'var(--color-bg)' : isCurrent ? '#E8521A08' : 'var(--color-bg)',
                        border: `1px solid ${isFixed ? '#16A34A44' : isCurrent ? '#E8521A' : 'var(--color-border)'}`,
                        opacity: isFixed ? 0.75 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-black text-ascent-orange">{finding.finding_id}</span>
                        <div className="flex items-center gap-1.5">
                          {isFixed && (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-body">
                              ✓ Fixed
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border"
                            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                            {(finding.impact * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold mb-1 font-body" style={{ color: 'var(--color-dark)' }}>{finding.title}</h4>

                      {/* Telemetry */}
                      <div className="mb-2.5 p-2 rounded-lg font-mono text-[10px] space-y-1"
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-mid)' }}>
                        <div className="grid grid-cols-2 gap-2">
                          <div><span style={{ color: 'var(--color-muted)' }}>Severity: </span><span className="font-bold text-red-500">{(finding.severity * 100).toFixed(1)}%</span></div>
                          <div><span style={{ color: 'var(--color-muted)' }}>Blast: </span><span className="font-bold text-ascent-orange">{(finding.blast_radius * 100).toFixed(1)}%</span></div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-muted)' }}>Likelihood: </span>
                          <span className="font-bold text-ascent-amber">{finding.likelihood.toFixed(2)}</span>
                        </div>
                        {finding.affected_nodes?.length > 0 && (
                          <div className="pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-muted)' }} className="block mb-1">Affected:</span>
                            <div className="flex flex-wrap gap-1">
                              {finding.affected_nodes.map(n => (
                                <span key={n} className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-mid)' }}>
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] line-clamp-2 leading-relaxed mb-3 font-body" style={{ color: 'var(--color-mid)' }}>
                        {finding.remediation_text}
                      </p>

                      {finding.cascade_tree?.length > 0 && (
                        <div className="mb-3 p-2 rounded-lg" onClick={e => e.stopPropagation()}
                          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                          <CascadeTree cascadeEvents={finding.cascade_tree} />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 font-body"
                        style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          onClick={e => { e.stopPropagation(); if (!isFixed && patchingId !== finding.finding_id) handleApplyFix(finding.finding_id, finding.patch_params); }}
                          disabled={isFixed || patchingId !== null}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all ${
                            isFixed ? 'cursor-not-allowed' : patchingId === finding.finding_id ? 'cursor-wait' : 'hover:bg-[#C94115]'
                          }`}
                          style={{ backgroundColor: isFixed ? '#16A34A55' : '#E8521A', color: isFixed ? '#16A34A' : 'white' }}>
                          {patchingId === finding.finding_id
                            ? <span className="flex items-center gap-1.5"><span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />Validating...</span>
                            : isFixed ? 'Fixed' : 'Apply Fix'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleExportYaml(finding, finding.scenario.split('_')[0]); }}
                          className="px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-mono transition-all hover:border-ascent-orange"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                          <Download className="w-3 h-3" /> YAML
                        </button>
                      </div>

                      {patchErrors[finding.finding_id] && (
                        <div className="mt-2 p-2 rounded-lg text-[10px] font-mono text-red-600 bg-red-50 border border-red-200">
                          <strong>Rejected:</strong> {patchErrors[finding.finding_id]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cascade tree */}
            <div className="rounded-xl2 p-4 max-h-[260px] overflow-y-auto"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(26,18,8,0.04)' }}>
              <CascadeTree cascadeEvents={displayFindings?.[activeScenarioIdx]?.cascade_tree} currentTick={currentTick} />
            </div>

            {/* Agent logs */}
            <div className="flex-1 min-h-[280px]">
              <AgentLogsPanel reportData={report} blueprint={blueprint} reanalyzing={reanalyzing} />
            </div>
          </div>
        </main>
      )}

      {/* ── YAML Modal ────────────────────────────────────────────────────── */}
      {yamlModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(15,11,8,0.65)' }}>
          <div className="rounded-xl2 max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 className="text-sm font-display font-bold" style={{ color: 'var(--color-dark)' }}>Chaos Mesh Specification</h3>
                <p className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>Target: {yamlModalData.node_id} ({yamlModalData.scenario})</p>
              </div>
              <button onClick={() => setYamlModalData(null)} className="p-1.5 rounded-lg transition-colors hover:text-ascent-orange"
                style={{ color: 'var(--color-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-auto font-mono text-[11px] whitespace-pre leading-relaxed"
              style={{ backgroundColor: '#0F0B08', color: '#9A9284' }}>
              {yamlModalData.yaml}
            </div>
            <div className="px-5 py-3 flex justify-end gap-3"
              style={{ backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={copyYaml} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all hover:border-ascent-orange font-body"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-mid)' }}>
                <Clipboard className="w-3.5 h-3.5" /> Copy Code
              </button>
              <button onClick={downloadYaml}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all font-body"
                style={{ backgroundColor: '#E8521A', boxShadow: '0 2px 8px rgba(232,82,26,0.30)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C94115'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8521A'}>
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
