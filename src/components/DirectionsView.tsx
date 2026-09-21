import React from 'react';
import { Compass, Lightbulb, Database, CheckSquare, Wrench, FileText } from 'lucide-react';
import { ResearchDirection } from '../types';

interface DirectionsViewProps {
  directions: ResearchDirection[];
}

export const DirectionsView: React.FC<DirectionsViewProps> = ({ directions }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Synthesized Research Directions</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Actionable research proposals addressing identified gaps with proposed methodologies and evaluation protocols
        </p>
      </div>

      {directions.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Compass className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No research directions generated yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Run the research workflow to automatically synthesize novel methodology directions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {directions.map((dir, idx) => (
            <div
              key={dir.id}
              id={`direction-${dir.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    PROPOSAL #{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{dir.id}</span>
                </div>
              </div>

              {/* Direction Title/Description */}
              <div className="text-base font-semibold text-slate-100 leading-snug">
                {dir.description}
              </div>

              {/* Methodology & Feasibility Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Methodology */}
                {dir.methodology && (
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                      <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Proposed Methodology</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{dir.methodology}</p>
                  </div>
                )}

                {/* Feasibility Notes */}
                {dir.feasibility_notes && (
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Feasibility & Hardware Assessment</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{dir.feasibility_notes}</p>
                  </div>
                )}
              </div>

              {/* Suggested Datasets */}
              {dir.datasets && dir.datasets.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recommended Evaluation Datasets & Testbeds</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dir.datasets.map((dataset, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-xs bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded"
                      >
                        {dataset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Evidence citations */}
              {dir.supporting_evidence && dir.supporting_evidence.length > 0 && (
                <div className="rounded-lg bg-slate-950/50 border border-slate-800/80 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>Literature Grounding Rationale</span>
                  </div>
                  <ul className="space-y-1 text-slate-400">
                    {dir.supporting_evidence.map((ev, evIdx) => (
                      <li key={evIdx} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
