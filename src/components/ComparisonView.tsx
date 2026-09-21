import React from 'react';
import { GitCompare, ArrowRightLeft, Layers, CheckCircle2 } from 'lucide-react';
import { Comparison, Paper } from '../types';

interface ComparisonViewProps {
  comparisons: Comparison[];
  papers: Paper[];
  onSelectPaper: (doi: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparisons,
  papers,
  onSelectPaper,
}) => {
  const paperMap = new Map(papers.map((p) => [p.doi, p]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Cross-Paper Comparison Engine</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Pairwise structural comparisons analyzing methodology divergence, benchmark alignment, and empirical tradeoffs
        </p>
      </div>

      {comparisons.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <GitCompare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No comparisons generated yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Run a workflow with at least 2 papers to generate comparative synthesis matrices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comparisons.map((comp) => {
            const p1 = paperMap.get(comp.paper1_doi);
            const p2 = paperMap.get(comp.paper2_doi);

            return (
              <div
                key={comp.id}
                id={`comp-${comp.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 hover:border-slate-700 transition-all"
              >
                {/* Paper Header Comparison */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  {/* Paper 1 */}
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Paper A</span>
                    <h3
                      onClick={() => onSelectPaper(comp.paper1_doi)}
                      className="text-sm font-semibold text-slate-200 hover:text-blue-300 cursor-pointer transition-colors"
                    >
                      {p1?.title || comp.paper1_doi}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{p1?.venue || 'Venue N/A'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{comp.paper1_doi}</span>
                    </div>
                  </div>

                  {/* Similarity Pill */}
                  <div className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {Math.round(comp.similarity_score * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500">Similarity</span>
                  </div>

                  {/* Paper 2 */}
                  <div className="flex-1 space-y-1 md:text-right">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Paper B</span>
                    <h3
                      onClick={() => onSelectPaper(comp.paper2_doi)}
                      className="text-sm font-semibold text-slate-200 hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      {p2?.title || comp.paper2_doi}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 md:justify-end">
                      <span>{p2?.venue || 'Venue N/A'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{comp.paper2_doi}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison Aspects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Methodology */}
                  {comp.methodology_comparison && (
                    <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Methodological Divergence
                      </span>
                      <p className="text-slate-400 leading-relaxed">{comp.methodology_comparison}</p>
                    </div>
                  )}

                  {/* Datasets */}
                  {comp.dataset_comparison && (
                    <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Benchmark & Dataset Alignment
                      </span>
                      <p className="text-slate-400 leading-relaxed">{comp.dataset_comparison}</p>
                    </div>
                  )}

                  {/* Metrics */}
                  {comp.metric_comparison && (
                    <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Metric Comparison & Trade-offs
                      </span>
                      <p className="text-slate-400 leading-relaxed">{comp.metric_comparison}</p>
                    </div>
                  )}

                  {/* Results */}
                  {comp.result_comparison && (
                    <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Cross-Validation Synthesis
                      </span>
                      <p className="text-slate-400 leading-relaxed">{comp.result_comparison}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
