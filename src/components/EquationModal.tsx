import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { X, Check, HelpCircle, Copy, Sparkles } from 'lucide-react';
import { PaperEquation } from '../lib/types';

interface EquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equation: PaperEquation) => void;
  initialEquation?: PaperEquation | null;
  nextNumber: number;
}

const COMMON_SYMBOLS = [
  { label: 'Bending Stress', latex: '\\sigma = \\frac{M \\cdot y}{I}' },
  { label: 'Beam Deflection', latex: '\\delta = \\frac{5 w L^4}{384 E I}' },
  { label: 'Effective Stress', latex: '\\sigma\' = \\sigma - u' },
  { label: 'Shear Strength', latex: '\\tau = c\' + \\sigma\' \\tan\\phi' },
  { label: 'Hooke\'s Law', latex: '\\sigma = E \\cdot \\varepsilon' },
  { label: 'Darcy-Weisbach', latex: 'h_f = f \\frac{L}{D} \\frac{v^2}{2g}' },
  { label: 'Manning Flow', latex: 'Q = \\frac{1}{n} A R_h^{2/3} S^{1/2}' },
  { label: 'Axial Stress', latex: 'f_c\' = \\frac{P}{A}' },
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Delta', latex: '\\Delta' },
  { label: 'Sigma', latex: '\\sigma' },
  { label: 'Tau', latex: '\\tau' },
  { label: 'Epsilon', latex: '\\varepsilon' },
  { label: 'Theta', latex: '\\theta' },
  { label: 'Integral', latex: '\\int_{0}^{L} M(x) dx' },
  { label: 'Partial', latex: '\\frac{\\partial^2 w}{\\partial x^2}' },
  { label: 'Sqrt', latex: '\\sqrt{f_c\'}' },
  { label: 'Matrix', latex: '\\begin{bmatrix} k_{11} & k_{12} \\\\ k_{21} & k_{22} \\end{bmatrix}' },
];

export const EquationModal: React.FC<EquationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEquation,
  nextNumber,
}) => {
  const [latex, setLatex] = useState(initialEquation?.latex || '\\sigma_{\\max} = \\frac{M \\cdot c}{I}');
  const [description, setDescription] = useState(initialEquation?.description || '');
  const [number, setNumber] = useState(initialEquation?.number || nextNumber);
  const [renderError, setRenderError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialEquation) {
      setLatex(initialEquation.latex);
      setDescription(initialEquation.description || '');
      setNumber(initialEquation.number);
    } else {
      setLatex('\\sigma_{\\max} = \\frac{M \\cdot c}{I}');
      setDescription('Maximum elastic bending stress in structural beam');
      setNumber(nextNumber);
    }
  }, [initialEquation, nextNumber, isOpen]);

  useEffect(() => {
    if (!previewRef.current) return;
    try {
      katex.render(latex || '...', previewRef.current, {
        displayMode: true,
        throwOnError: true,
      });
      setRenderError(null);
    } catch (err: any) {
      setRenderError(err.message || 'Invalid LaTeX syntax');
    }
  }, [latex]);

  if (!isOpen) return null;

  const handleInsertSymbol = (symLatex: string) => {
    setLatex(prev => prev + ' ' + symLatex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latex.trim()) return;
    onSave({
      id: initialEquation?.id || `eq-${Date.now()}`,
      number,
      latex: latex.trim(),
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-mono text-sm font-semibold">Σ</span>
            <div>
              <h3 className="font-semibold text-stone-900">
                {initialEquation ? 'Edit Scientific Equation' : 'Insert Numbered Equation'}
              </h3>
              <p className="text-xs text-stone-500">Rendered with KaTeX mathematical typography</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Symbol Quick Palette */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
              Scientific Notation Palette
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-stone-50 rounded-lg border border-stone-200 max-h-24 overflow-y-auto">
              {COMMON_SYMBOLS.map((sym, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertSymbol(sym.latex)}
                  className="px-2 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-stone-200 rounded font-mono transition-colors text-stone-700"
                  title={sym.label}
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
              LaTeX Equation Source
            </label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={3}
              placeholder="e.g. \\nabla_\\theta J(\\theta) = \\mathbb{E}[\\dots]"
              className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-stone-900 text-stone-100 selection:bg-indigo-700"
              required
            />
          </div>

          {/* Live KaTeX Render Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Equation Preview (Display Mode)
              </label>
              <span className="text-xs font-mono text-stone-500">Eq. ({number})</span>
            </div>
            <div className="p-4 bg-amber-50/40 rounded-lg border border-amber-200/60 min-h-[80px] flex items-center justify-center overflow-x-auto relative">
              <div ref={previewRef} className="text-stone-900 text-lg py-1 px-4" />
              <span className="absolute right-4 font-serif text-stone-600 font-semibold text-sm">
                ({number})
              </span>
            </div>
            {renderError && (
              <p className="mt-1 text-xs text-rose-600 font-mono bg-rose-50 p-1.5 rounded">
                Syntax error: {renderError}
              </p>
            )}
          </div>

          {/* Details & Numbering */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Equation No.
              </label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Description / Caption (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Policy gradient objective with baseline"
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!renderError || !latex.trim()}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialEquation ? 'Update Equation' : 'Insert into Paper'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
