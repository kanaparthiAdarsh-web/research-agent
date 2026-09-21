import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, HelpCircle, XCircle, Quote, ExternalLink } from 'lucide-react';
import { Evidence, Paper } from '../types';

interface EvidenceViewProps {
  evidences: Evidence[];
  papers: Paper[];
  onSelectPaper: (doi: string) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  evidences,
  papers,
  onSelectPaper,
}) => {
  const [filterState, setFilterState] = useState<string>('all');
  const paperMap = new Map(papers.map((p) => [p.doi, p]));

  const filtered = evidences.filter((ev) => {
    if (filterState === 'all') return true;
    return ev.verification_state === filterState;
  });

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'uncertain':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
            <HelpCircle className="w-3 h-3" />
            Uncertain
          </span>
        );
      case 'contradicted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" />
            Contradicted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Extracted & Verified Evidence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verbatim scientific claims extracted from literature chunks with algorithmic verification confidence
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {['all', 'verified', 'uncertain', 'contradicted'].map((state) => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`text-xs px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                filterState === state
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No evidence matching current filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try switching filter tabs or running another literature query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ev) => {
            const paper = paperMap.get(ev.paper_doi);
            return (
              <div
                key={ev.id}
                id={`evidence-${ev.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStateBadge(ev.verification_state)}
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {Math.round(ev.confidence * 100)}% Confidence
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{ev.id}</span>
                  </div>

                  {/* Verbatim Quote */}
                  <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 relative">
                    <Quote className="w-4 h-4 text-blue-500/40 absolute top-2.5 left-2.5" />
                    <p className="text-xs text-slate-200 italic pl-5 leading-relaxed font-serif">
                      "{ev.quote}"
                    </p>
                  </div>

                  {/* Context & Content */}
                  <div className="text-xs space-y-1 text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-300">Claim Context: </span>
                      <span>{ev.context}</span>
                    </div>
                    {ev.provenance && Object.keys(ev.provenance).length > 0 && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Source:</span>
                        <span className="font-mono text-slate-400">
                          {JSON.stringify(ev.provenance).replace(/[{"}]/g, '').replace(/,/g, ', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Paper Link */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="truncate max-w-[240px]">
                    <span className="text-slate-500">From: </span>
                    <button
                      onClick={() => onSelectPaper(ev.paper_doi)}
                      className="text-blue-400 hover:text-blue-300 truncate font-medium text-left"
                    >
                      {paper?.title || ev.paper_doi}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{paper?.venue || 'Scholarly Article'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
