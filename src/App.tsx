import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { WorkflowRunner } from './components/WorkflowRunner';
import { PaperCardsView } from './components/PaperCardsView';
import { EvidenceView } from './components/EvidenceView';
import { ComparisonView } from './components/ComparisonView';
import { LimitationClusterView } from './components/LimitationClusterView';
import { GapAnalysisView } from './components/GapAnalysisView';
import { DirectionsView } from './components/DirectionsView';
import { AddPaperModal } from './components/AddPaperModal';
import { PaperDetailModal } from './components/PaperDetailModal';
import {
  Paper,
  PaperCard,
  Evidence,
  Comparison,
  Limitation,
  Gap,
  ResearchDirection,
  WorkflowStats,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperCards, setPaperCards] = useState<PaperCard[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [directions, setDirections] = useState<ResearchDirection[]>([]);

  const [selectedPaperDoi, setSelectedPaperDoi] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchAllData = async () => {
    try {
      const [
        statsRes,
        papersRes,
        cardsRes,
        evRes,
        compRes,
        limRes,
        gapsRes,
        dirRes,
      ] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/papers'),
        fetch('/api/papercards'),
        fetch('/api/evidence'),
        fetch('/api/comparisons'),
        fetch('/api/limitations'),
        fetch('/api/gaps'),
        fetch('/api/directions'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (papersRes.ok) setPapers(await papersRes.json());
      if (cardsRes.ok) setPaperCards(await cardsRes.json());
      if (evRes.ok) setEvidences(await evRes.json());
      if (compRes.ok) setComparisons(await compRes.json());
      if (limRes.ok) setLimitations(await limRes.json());
      if (gapsRes.ok) setGaps(await gapsRes.json());
      if (dirRes.ok) setDirections(await dirRes.json());
    } catch (err) {
      console.error('Error loading research data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleReset = async () => {
    if (!confirm('Reset literature repository back to initial seed benchmarks?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/reset', { method: 'POST' });
      await fetchAllData();
      setActiveTab('pipeline');
    } catch (e) {
      console.error('Failed to reset:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onReset={handleReset}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pipeline' && (
          <WorkflowRunner
            onWorkflowComplete={fetchAllData}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              fetchAllData();
            }}
          />
        )}

        {activeTab === 'papers' && (
          <PaperCardsView
            cards={paperCards}
            papers={papers}
            onSelectPaper={(doi) => setSelectedPaperDoi(doi)}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceView
            evidences={evidences}
            papers={papers}
            onSelectPaper={(doi) => setSelectedPaperDoi(doi)}
          />
        )}

        {activeTab === 'comparisons' && (
          <ComparisonView
            comparisons={comparisons}
            papers={papers}
            onSelectPaper={(doi) => setSelectedPaperDoi(doi)}
          />
        )}

        {activeTab === 'limitations' && (
          <LimitationClusterView
            limitations={limitations}
            papers={papers}
            onSelectPaper={(doi) => setSelectedPaperDoi(doi)}
          />
        )}

        {activeTab === 'gaps' && (
          <GapAnalysisView
            gaps={gaps}
            onNavigateToDirections={() => setActiveTab('directions')}
          />
        )}

        {activeTab === 'directions' && (
          <DirectionsView directions={directions} />
        )}
      </main>

      {/* Modals */}
      <PaperDetailModal
        doi={selectedPaperDoi}
        onClose={() => setSelectedPaperDoi(null)}
      />

      <AddPaperModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPaperAdded={fetchAllData}
      />
    </div>
  );
}

export default App;
