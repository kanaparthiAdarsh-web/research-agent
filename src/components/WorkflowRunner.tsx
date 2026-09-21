import React, { useState, useEffect } from 'react';
import { Play, Sparkles, CheckCircle2, Clock, Search, Terminal, AlertCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { Job } from '../types';

interface WorkflowRunnerProps {
  onWorkflowComplete: () => void;
  onNavigateToTab: (tab: string) => void;
}

const PRESET_QUESTIONS = [
  'Mitigating hallucination in Large Language Models via multi-agent debate and verification',
  'Attribution granularity and citation fidelity in retrieval-augmented generation',
  'Sample efficiency and exploration bounds in offline reinforcement learning',
  'Mechanistic interpretability of reasoning in transformer attention heads'
];

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({
  onWorkflowComplete,
  onNavigateToTab,
}) => {
  const [question, setQuestion] = useState(PRESET_QUESTIONS[0]);
  const [maxPapers, setMaxPapers] = useState(3);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = async () => {
    if (!question.trim()) return;
    setIsRunning(true);
    setError(null);

    try {
      const resp = await fetch('/api/workflow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          research_question: question,
          max_papers: maxPapers
        })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to start workflow');
      }

      const job: Job = await resp.json();
      setActiveJob(job);
    } catch (err: any) {
      setError(err.message || 'Error executing workflow');
      setIsRunning(false);
    }
  };

  // Poll job status while running
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
      if (activeJob?.status === 'completed') {
        setIsRunning(false);
        onWorkflowComplete();
      }
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/workflow/jobs/${activeJob.id}`);
        if (res.ok) {
          const updated: Job = await res.json();
          setActiveJob(updated);
          if (updated.status === 'completed') {
            setIsRunning(false);
            onWorkflowComplete();
          } else if (updated.status === 'failed') {
            setIsRunning(false);
          }
        }
      } catch (e) {
        console.error('Error polling job:', e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const stages = [
    { name: 'Discovery', desc: 'Querying OpenAlex & ArXiv literature databases' },
    { name: 'Ingestion & Chunking', desc: 'Parsing full-text & generating semantic segments' },
    { name: 'Hybrid Indexing', desc: 'Building BM25 & keyword overlap search index' },
    { name: 'PaperCard Synthesis', desc: 'Extracting findings, methodology & metrics' },
    { name: 'Evidence Verification', desc: 'Mining quotes and validating claim provenance' },
    { name: 'Cross-Paper Comparison', desc: 'Constructing pairwise comparison matrices' },
    { name: 'Limitation Clustering', desc: 'Categorizing constraints (data, method, scope)' },
    { name: 'Gap Synthesis', desc: 'Identifying unaddressed literature voids' },
    { name: 'Research Directions', desc: 'Synthesizing actionable novel methodologies' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Literature Review Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Scientific Literature Review & Gap Analysis
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Enter a research inquiry to trigger the autonomous multi-agent pipeline: discovery across academic repositories, full-text chunking, hybrid retrieval indexing, PaperCard generation, factual evidence extraction, limitation clustering, and research direction synthesis.
          </p>
        </div>

        {/* Input Card */}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="research-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Research Question or Topic
            </label>
            <div className="relative">
              <input
                id="research-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Mitigating hallucination in Large Language Models..."
                disabled={isRunning}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-medium text-slate-400">Preset research topics:</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(q)}
                  disabled={isRunning}
                  className="rounded-md border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-slate-100 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <label htmlFor="max-papers-select" className="text-xs text-slate-400">
                Max Papers to Ingest:
              </label>
              <select
                id="max-papers-select"
                value={maxPapers}
                onChange={(e) => setMaxPapers(Number(e.target.value))}
                disabled={isRunning}
                className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value={2}>2 Papers (Fast)</option>
                <option value={3}>3 Papers (Balanced)</option>
                <option value={5}>5 Papers (Deep Review)</option>
              </select>
            </div>

            <button
              id="btn-run-workflow"
              onClick={startWorkflow}
              disabled={isRunning || !question.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Literature Review</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-800/60 p-3 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Live Workflow State */}
      {activeJob && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Job:</span>
                <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/40">
                  {activeJob.id}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    activeJob.status === 'completed'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : activeJob.status === 'failed'
                      ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  {activeJob.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-1">
                {activeJob.current_stage || 'Processing workflow...'}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-blue-400">{activeJob.progress}%</span>
              <p className="text-[11px] text-slate-500">Progress completion</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(activeJob.progress, 5)}%` }}
            />
          </div>

          {/* Stages Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stages.map((stg, i) => {
              const stageProgressThreshold = ((i + 1) / stages.length) * 100;
              const isPast = activeJob.progress >= stageProgressThreshold;
              const isCurrent =
                activeJob.progress < stageProgressThreshold &&
                activeJob.progress >= ((i) / stages.length) * 100;

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    isPast
                      ? 'border-emerald-900/50 bg-emerald-950/20 text-slate-300'
                      : isCurrent
                      ? 'border-blue-500/50 bg-blue-950/30 text-blue-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className="font-medium text-slate-200">{stg.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{stg.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Terminal / Live Logs */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Agent Execution Logs</span>
              </div>
              <span className="text-[10px] text-slate-500">Live feed</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
              {activeJob.logs && activeJob.logs.length > 0 ? (
                activeJob.logs.map((log, index) => (
                  <div key={index} className="text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-blue-500 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Awaiting stage output...</div>
              )}
            </div>
          </div>

          {/* If completed, prompt user to inspect views */}
          {activeJob.status === 'completed' && (
            <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-200">Literature Synthesis Finished</h3>
                  <p className="text-xs text-emerald-400/80">
                    Extracted paper findings, cross-comparisons, clustered limitations, and formulated novel research directions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('papers')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <span>View PaperCards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateToTab('directions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <span>Explore Gaps & Directions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
