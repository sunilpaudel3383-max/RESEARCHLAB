import React, { useState } from 'react';
import { X, Image as ImageIcon, Table as TableIcon, Check, Plus, Trash2 } from 'lucide-react';
import { PaperFigure, PaperTable } from '../lib/types';

interface FigureTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'figure' | 'table';
  sectionId: string;
  nextNumber: number;
  onSaveFigure: (fig: PaperFigure) => void;
  onSaveTable: (tbl: PaperTable) => void;
}

const SAMPLE_FIGURE_URLS = [
  { label: 'Structural Strain Distribution', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Concrete Compressive Stress-Strain Curve', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
  { label: 'Bridge Deck Vibration Spectrum', url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Soil Boring & Stratigraphy Log', url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80' },
];

export const FigureTableModal: React.FC<FigureTableModalProps> = ({
  isOpen,
  onClose,
  type,
  nextNumber,
  onSaveFigure,
  onSaveTable,
}) => {
  // Figure state
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_FIGURE_URLS[0].url);

  // Table state
  const [tableCaption, setTableCaption] = useState('Mechanical Properties and 28-Day Compressive Strength of Concrete Mixes');
  const [headers, setHeaders] = useState<string[]>(['Mix ID', 'w/c Ratio', 'Slump (mm)', 'Density (kg/m³)', '28-Day f\'c (MPa)']);
  const [rows, setRows] = useState<string[][]>([
    ['C30 Baseline', '0.45', '110', '2380', '34.2'],
    ['Fly Ash 20%', '0.40', '95', '2410', '39.8'],
    ['Silica Fume 8%', '0.35', '125', '2445', '48.6'],
  ]);

  if (!isOpen) return null;

  const handleFigureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !imageUrl.trim()) return;
    onSaveFigure({
      id: `fig-${Date.now()}`,
      number: nextNumber,
      caption: caption.trim(),
      imageUrl: imageUrl.trim(),
    });
    onClose();
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCaption.trim()) return;
    onSaveTable({
      id: `tbl-${Date.now()}`,
      number: nextNumber,
      caption: tableCaption.trim(),
      headers,
      rows,
    });
    onClose();
  };

  const handleAddColumn = () => {
    setHeaders(prev => [...prev, `Column ${prev.length + 1}`]);
    setRows(prev => prev.map(r => [...r, '-']));
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, new Array(headers.length).fill('-')]);
  };

  const handleDeleteRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              {type === 'figure' ? <ImageIcon className="w-5 h-5" /> : <TableIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">
                {type === 'figure' ? `Insert Figure ${nextNumber}` : `Insert Table ${nextNumber}`}
              </h3>
              <p className="text-xs text-stone-500">
                {type === 'figure' ? 'Add graphic chart or illustration with numbered caption' : 'Configure structured scientific data grid with caption'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {type === 'figure' ? (
          <form onSubmit={handleFigureSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Quick Sample Presets */}
            <div>
              <label className="text-xs font-semibold uppercase text-stone-500 block mb-1.5">
                Preset Scientific Imagery / Diagrams
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_FIGURE_URLS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      if (!caption) setCaption(sample.label);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs flex items-center space-x-2 transition-all ${
                      imageUrl === sample.url ? 'border-indigo-600 bg-indigo-50/60 font-semibold' : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <img src={sample.url} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="truncate">{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Image Source URL
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {imageUrl && (
              <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 text-center">
                <img src={imageUrl} alt="Preview" className="max-h-44 mx-auto rounded object-contain shadow-2xs" />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Figure Caption (Numbered: Figure {nextNumber}.) *
              </label>
              <textarea
                required
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. System architecture overview illustrating parameter flow between edge nodes."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800">
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
              >
                Insert Figure
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTableSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Table Caption (TABLE {nextNumber}) *
              </label>
              <input
                type="text"
                required
                value={tableCaption}
                onChange={(e) => setTableCaption(e.target.value)}
                placeholder="e.g. Comparison of convergence epochs and network transmission bandwidth"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Editable Table Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-stone-500">
                  Data Grid Matrix
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Col</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Row</span>
                  </button>
                </div>
              </div>

              <div className="border border-stone-200 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="p-1.5 border-r border-stone-200 last:border-r-0">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => {
                              const newH = [...headers];
                              newH[i] = e.target.value;
                              setHeaders(newH);
                            }}
                            className="w-full bg-transparent font-semibold text-xs focus:bg-white px-1 py-0.5 rounded"
                          />
                        </th>
                      ))}
                      <th className="w-8 p-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-stone-100 hover:bg-stone-50/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-1.5 border-r border-stone-200 last:border-r-0">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const newR = [...rows];
                                newR[rIdx][cIdx] = e.target.value;
                                setRows(newR);
                              }}
                              className="w-full bg-transparent text-xs focus:bg-white px-1 py-0.5 rounded"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rIdx)}
                            className="text-stone-300 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800">
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
              >
                Insert Table
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
