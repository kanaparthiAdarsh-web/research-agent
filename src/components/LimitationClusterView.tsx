import React, { useState } from 'react';
import { AlertTriangle, Tag, Database, Cpu, FlaskConical, Globe, BookOpen } from 'lucide-react';
import { Limitation, Paper } from '../types';

interface LimitationClusterViewProps {
  limitations: Limitation[];
  papers: Paper[];
  onSelectPaper: (doi: string) => void;
}

export const LimitationClusterView: React.FC<LimitationClusterViewProps> = ({
  limitations,
  papers,
  onSelectPaper,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const paperMap = new Map(papers.map((p) => [p.doi, p]));

  const categories = [
    { id: 'all', label: 'All Categories', icon: Tag },
    { id: 'technical', label: 'Technical & Compute', icon: Cpu },
    { id: 'methodological', label: 'Methodological', icon: FlaskConical },
    { id: 'data_related', label: 'Data & Benchmarks', icon: Database },
    { id: 'scope', label: 'Scope & Transferability', icon: Globe },
  ];

  const filtered = limitations.filter((lim) => {
    if (selectedCategory === 'all') return true;
    return lim.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'methodological':
        return <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />;
      case 'data_related':
        return <Database className="w-3.5 h-3.5 text-emerald-400" />;
      case 'scope':
        return <Globe className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Clustered Paper Limitations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Extraction and taxonomic clustering of stated constraints, failure modes, and architectural bottlenecks
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.id === 'all'
                ? limitations.length
                : limitations.filter((l) => l.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Limitations */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No limitations found in this cluster</h3>
          <p className="text-xs text-slate-500 mt-1">Select another cluster or run an expanded literature search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lim) => {
            const paper = paperMap.get(lim.paper_doi);
            return (
              <div
                key={lim.id}
                id={`limitation-${lim.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300 capitalize">
                      {getCategoryIcon(lim.category)}
                      <span>{lim.category.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{lim.id}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {lim.text}
                  </p>

                  {lim.original_text && (
                    <div className="rounded bg-slate-950/80 p-2.5 border border-slate-800 text-[11px] text-slate-400 italic">
                      <span className="text-slate-500 not-italic font-semibold text-[10px] uppercase block mb-0.5">Author's original statement:</span>
                      "{lim.original_text}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="truncate max-w-[260px]">
                    <span className="text-slate-500">Paper: </span>
                    <button
                      onClick={() => onSelectPaper(lim.paper_doi)}
                      className="text-blue-400 hover:text-blue-300 truncate font-medium text-left"
                    >
                      {paper?.title || lim.paper_doi}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{paper?.year || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
