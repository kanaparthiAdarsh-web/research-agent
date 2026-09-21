import React, { useState } from 'react';
import { X, Plus, Upload, BookOpen, AlertCircle } from 'lucide-react';

interface AddPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperAdded: () => void;
}

export const AddPaperModal: React.FC<AddPaperModalProps> = ({
  isOpen,
  onClose,
  onPaperAdded,
}) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [venue, setVenue] = useState('arXiv cs.AI');
  const [year, setYear] = useState(new Date().getFullYear());
  const [doi, setDoi] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Paper title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const resp = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          authors: authors.split(',').map((a) => a.trim()).filter(Boolean),
          venue,
          year: Number(year) || new Date().getFullYear(),
          doi: doi.trim() || undefined,
          abstract,
          full_text: fullText,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to ingest paper');
      }

      onPaperAdded();
      onClose();
      // Reset form
      setTitle('');
      setAuthors('');
      setAbstract('');
      setFullText('');
      setDoi('');
    } catch (err: any) {
      setError(err.message || 'Error ingesting paper');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Ingest Scientific Paper</h3>
              <p className="text-xs text-slate-400">Add custom publication for automatic chunking & PaperCard generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="paper-title" className="block text-slate-300 font-medium mb-1">
              Paper Title *
            </label>
            <input
              id="paper-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Constitutional AI: Harmlessness from AI Feedback"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="paper-authors" className="block text-slate-300 font-medium mb-1">
                Authors (comma separated)
              </label>
              <input
                id="paper-authors"
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Y. Bai, S. Kadavath, S. Kundu"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="paper-venue" className="block text-slate-300 font-medium mb-1">
                Venue & Year
              </label>
              <div className="flex gap-2">
                <input
                  id="paper-venue"
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="NeurIPS / arXiv"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  id="paper-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="paper-doi" className="block text-slate-300 font-medium mb-1">
              DOI (optional)
            </label>
            <input
              id="paper-doi"
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.48550/arXiv.2212.08073"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="paper-abstract" className="block text-slate-300 font-medium mb-1">
              Abstract
            </label>
            <textarea
              id="paper-abstract"
              rows={3}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste paper abstract here..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="paper-fulltext" className="block text-slate-300 font-medium mb-1">
              Full Text or Key Sections (for chunking & evidence extraction)
            </label>
            <textarea
              id="paper-fulltext"
              rows={4}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="Paste paper sections, introduction, or discussion text here..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Ingest & Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
