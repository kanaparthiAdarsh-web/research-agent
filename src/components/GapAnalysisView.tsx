import React from 'react';
import { Target, CheckCircle2, AlertCircle, HelpCircle, Shield, ArrowUpRight } from 'lucide-react';
import { Gap } from '../types';

interface GapAnalysisViewProps {
  gaps: Gap[];
  onNavigateToDirections: () => void;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  gaps,
  onNavigateToDirections,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Identified Literature Gaps</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesis of unaddressed voids, unresolved tensions, and empirical blind spots across the ingested corpus
          </p>
        </div>

        <button
          onClick={onNavigateToDirections}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <span>View Proposed Solutions & Directions</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Gaps List */}
      {gaps.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No research gaps identified yet</h3>
          <p className="text-xs text-slate-500 mt-1">Run a research workflow to analyze papers and extract literature gaps.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gaps.map((gap, index) => (
            <div
              key={gap.id}
              id={`gap-${gap.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/40">
                    GAP #{index + 1}
                  </span>
                  {gap.verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Cross-Validated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Hypothesis Void
                    </span>
                  )}
                  {gap.uncertainty_expressed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Epistemic Uncertainty Calibrated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Literature Coverage:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round((gap.coverage || 0.7) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-300 font-semibold">
                      {Math.round((gap.coverage || 0.7) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-sm font-medium text-slate-100 leading-relaxed bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
                {gap.description}
              </div>

              {/* Supporting Evidence Grid */}
              {gap.supporting_evidence && gap.supporting_evidence.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Supporting Literature Evidence</span>
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {gap.supporting_evidence.map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        className="text-xs text-slate-400 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded flex items-start gap-2"
                      >
                        <span className="text-blue-400 shrink-0 font-bold">•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Limitations */}
              {gap.related_limitations && gap.related_limitations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-500">Associated limitation clusters:</span>
                  {gap.related_limitations.map((limId, limIdx) => (
                    <span
                      key={limIdx}
                      className="font-mono text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded"
                    >
                      {limId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
