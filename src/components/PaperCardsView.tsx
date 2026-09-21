import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, Tag, Check, BarChart2, AlertCircle } from 'lucide-react';
import { PaperCard, Paper } from '../types';

interface PaperCardsViewProps {
  cards: PaperCard[];
  papers: Paper[];
  onSelectPaper: (doi: string) => void;
}

export const PaperCardsView: React.FC<PaperCardsViewProps> = ({
  cards,
  papers,
  onSelectPaper,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Map DOI to Paper for authors & venue
  const paperMap = new Map(papers.map((p) => [p.doi, p]));

  const filteredCards = cards.filter((card) => {
    const p = paperMap.get(card.doi);
    const searchStr = `${card.title} ${card.summary} ${card.key_findings.join(' ')} ${p?.authors.join(' ') || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Synthesized PaperCards</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured intelligence cards detailing findings, methodologies, metrics, and limitations
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter cards by title, findings..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Grid of PaperCards */}
      {filteredCards.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No PaperCards match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search query or run a new workflow to ingest papers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCards.map((card) => {
            const paper = paperMap.get(card.doi);
            return (
              <div
                key={card.doi}
                id={`papercard-${card.doi.replace(/[^a-zA-Z0-9]/g, '-')}`}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top metadata */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/40">
                          {card.doi}
                        </span>
                        {paper?.venue && (
                          <span className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            {paper.venue} {paper.year ? `(${paper.year})` : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-100 leading-snug">
                        {card.title}
                      </h3>
                      {paper?.authors && paper.authors.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {paper.authors.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300 leading-relaxed border border-slate-800/60">
                    <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Executive Summary</span>
                    {card.summary}
                  </div>

                  {/* Key Findings */}
                  {card.key_findings && card.key_findings.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Core Findings</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {card.key_findings.map((finding, idx) => (
                          <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <span className="leading-tight">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Methodology */}
                  {card.methodology && (
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Methodology: </span>
                      {card.methodology}
                    </div>
                  )}

                  {/* Datasets & Metrics Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.datasets?.map((ds, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{ds}</span>
                      </span>
                    ))}
                    {card.metrics?.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        <BarChart2 className="w-2.5 h-2.5 text-blue-400" />
                        <span>{m}</span>
                      </span>
                    ))}
                  </div>

                  {/* Limitations preview */}
                  {card.limitations && card.limitations.length > 0 && (
                    <div className="rounded border border-amber-900/30 bg-amber-950/20 p-2.5 text-[11px] text-amber-300/90">
                      <div className="flex items-center gap-1 font-semibold text-amber-400 mb-1 text-[10px] uppercase">
                        <AlertCircle className="w-3 h-3" />
                        <span>Stated Limitations</span>
                      </div>
                      <p className="line-clamp-2">{card.limitations[0]}</p>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onSelectPaper(card.doi)}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Full Paper & Chunks →
                  </button>
                  {paper?.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                      title="Open source URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
