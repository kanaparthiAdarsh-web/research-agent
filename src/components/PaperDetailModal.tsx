import React, { useEffect, useState } from 'react';
import { X, BookOpen, Layers, ShieldCheck, AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { Paper, PaperCard, Evidence, Limitation, Chunk } from '../types';

interface PaperDetailModalProps {
  doi: string | null;
  onClose: () => void;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({ doi, onClose }) => {
  const [data, setData] = useState<{
    paper: Paper;
    card: PaperCard | null;
    evidences: Evidence[];
    limitations: Limitation[];
    chunks: Chunk[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'chunks' | 'evidence'>('card');

  useEffect(() => {
    if (!doi) {
      setData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/papers/${encodeURIComponent(doi)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch paper');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [doi]);

  if (!doi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="space-y-1 max-w-[85%]">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/40">
                {doi}
              </span>
              {data?.paper.venue && (
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {data.paper.venue} {data.paper.year ? `(${data.paper.year})` : ''}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-100 leading-snug">
              {data?.paper.title || 'Loading paper...'}
            </h3>
            {data?.paper.authors && (
              <p className="text-xs text-slate-400">{data.paper.authors.join(', ')}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div className="flex border-b border-slate-800 shrink-0 gap-1 pt-2">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'card'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PaperCard Synthesis
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'chunks'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ingested Chunks ({data?.chunks.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'evidence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence & Citations ({data?.evidences.length || 0})
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching paper dossier...</span>
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-slate-500">Paper details unavailable.</div>
          ) : (
            <>
              {/* Tab: PaperCard */}
              {activeTab === 'card' && (
                <div className="space-y-4">
                  {/* Abstract */}
                  {data.paper.abstract && (
                    <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-1">
                      <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                        Original Abstract
                      </span>
                      <p className="text-slate-300 leading-relaxed">{data.paper.abstract}</p>
                    </div>
                  )}

                  {/* Summary */}
                  {data.card && (
                    <div className="rounded-lg bg-blue-950/20 border border-blue-900/40 p-3.5 space-y-1">
                      <span className="font-semibold text-blue-300 text-[11px] uppercase tracking-wider block">
                        Synthesized Executive Summary
                      </span>
                      <p className="text-blue-100 leading-relaxed">{data.card.summary}</p>
                    </div>
                  )}

                  {/* Key Findings */}
                  {data.card?.key_findings && (
                    <div className="space-y-1.5">
                      <span className="font-semibold text-slate-300 text-xs block">Key Findings</span>
                      <ul className="space-y-1 text-slate-300">
                        {data.card.key_findings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Methodology & Datasets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.card?.methodology && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Methodology
                        </span>
                        <p className="text-slate-300">{data.card.methodology}</p>
                      </div>
                    )}
                    {data.card?.datasets && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Evaluation Datasets
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {data.card.datasets.map((ds, i) => (
                            <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                              {ds}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Chunks */}
              {activeTab === 'chunks' && (
                <div className="space-y-3">
                  {data.chunks.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No segmented chunks available.</div>
                  ) : (
                    data.chunks.map((chk, idx) => (
                      <div key={chk.id || idx} className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-blue-400">
                            {chk.section_title || `Chunk #${idx + 1}`}
                          </span>
                          {chk.page_number && <span>Page {chk.page_number}</span>}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                          {chk.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Evidence */}
              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  {data.evidences.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No evidence entries extracted yet.</div>
                  ) : (
                    data.evidences.map((ev) => (
                      <div key={ev.id} className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-400 font-semibold uppercase">
                            {ev.verification_state} ({Math.round(ev.confidence * 100)}%)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{ev.id}</span>
                        </div>
                        <p className="text-slate-200 italic font-serif">"{ev.quote}"</p>
                        <p className="text-slate-400 text-[11px]">{ev.context}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
