import React from 'react';
import { BookOpen, Sparkles, RefreshCw, PlusCircle, Search, Layers, ShieldCheck, GitCompare, AlertTriangle, Compass, Target } from 'lucide-react';
import { WorkflowStats } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: WorkflowStats | null;
  onOpenAddModal: () => void;
  onReset: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenAddModal,
  onReset,
  isResetting,
}) => {
  const navItems = [
    { id: 'pipeline', label: 'Workflow Pipeline', icon: Sparkles, count: undefined },
    { id: 'papers', label: 'PaperCards', icon: BookOpen, count: stats?.paperCardCount },
    { id: 'evidence', label: 'Evidence', icon: ShieldCheck, count: stats?.evidenceCount },
    { id: 'comparisons', label: 'Comparisons', icon: GitCompare, count: stats?.comparisonCount },
    { id: 'limitations', label: 'Limitations', icon: AlertTriangle, count: stats?.limitationCount },
    { id: 'gaps', label: 'Research Gaps', icon: Target, count: stats?.gapCount },
    { id: 'directions', label: 'Future Directions', icon: Compass, count: stats?.directionCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-lg tracking-tight">Research Agent</span>
                <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40">
                  Autonomous Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400">Literature review, evidence extraction & gap synthesis</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-add-paper"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ingest Paper</span>
            </button>
            <button
              id="btn-reset-db"
              onClick={onReset}
              disabled={isResetting}
              title="Reset literature repository to seed benchmarks"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset State</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
