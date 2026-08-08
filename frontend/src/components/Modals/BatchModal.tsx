import React, { RefObject, ChangeEvent } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { BatchJob } from '../../types';

export interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  setCsvHeaders: (headers: string[]) => void;
  csvRows: Record<string, string>[];
  setCsvRows: (rows: Record<string, string>[]) => void;
  csvFilename: string;
  setCsvFilename: (filename: string) => void;
  variableMapping: Record<string, string>;
  setVariableMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  batchPreviewIndex: number;
  setBatchPreviewIndex: React.Dispatch<React.SetStateAction<number>>;
  getTemplateVariables: () => string[];
  handleExecuteBatchPrint: (jobs: BatchJob[]) => Promise<void>;
  parseCSV: (csvText: string) => { headers: string[]; rows: Record<string, string>[] };
  csvFileInputRef: RefObject<HTMLInputElement>;
}

export default function BatchModal({
  isOpen,
  onClose,
  csvHeaders,
  setCsvHeaders,
  csvRows,
  setCsvRows,
  csvFilename,
  setCsvFilename,
  variableMapping,
  setVariableMapping,
  batchPreviewIndex,
  setBatchPreviewIndex,
  getTemplateVariables,
  handleExecuteBatchPrint,
  parseCSV,
  csvFileInputRef
}: BatchModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] text-left select-text">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            CSV Batch Print Studio
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-sm text-slate-300">
          {csvRows.length === 0 ? (
            <div 
              onClick={() => csvFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500 bg-slate-900/40 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
            >
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition" />
              <div>
                <p className="font-semibold text-white">Upload CSV File</p>
                <p className="text-xs text-slate-500 mt-1">Select or drag a CSV file containing label rows</p>
              </div>
              <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result;
                    if (typeof content !== 'string') return;
                    const { headers, rows } = parseCSV(content);
                    if (headers.length === 0 || rows.length === 0) {
                      alert("Invalid or empty CSV file.");
                      return;
                    }
                    setCsvHeaders(headers);
                    setCsvRows(rows);
                    setCsvFilename(file.name);
                    
                    // Auto-map matching variable names
                    const templateVars = getTemplateVariables();
                    const initialMapping: Record<string, string> = {};
                    templateVars.forEach(v => {
                      const match = headers.find(h => h.toLowerCase() === v.toLowerCase());
                      if (match) initialMapping[v] = match;
                    });
                    setVariableMapping(initialMapping);
                    setBatchPreviewIndex(0);
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Active CSV File</p>
                  <p className="text-sm font-semibold text-indigo-300">{csvFilename}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition"
                >
                  Clear File
                </button>
              </div>

              {/* Mapping variables */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Map Template Placeholders to CSV Columns
                </h4>
                {getTemplateVariables().length === 0 ? (
                  <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                    ⚠️ No variables like <code>{"{{variable}}"}</code> found in current label elements. Add text/QR codes containing double curly braces to map CSV fields.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {getTemplateVariables().map(v => (
                      <div key={v} className="grid grid-cols-3 items-center gap-3">
                        <span className="text-xs font-mono text-indigo-300">{"{{"}{v}{"}}"}</span>
                        <span className="text-center text-xs text-slate-500">maps to</span>
                        <select
                          value={variableMapping[v] || ''}
                          onChange={(e) => setVariableMapping({ ...variableMapping, [v]: e.target.value })}
                          className="p-2 rounded-lg glass-input text-xs"
                        >
                          <option value="">-- Ignore / Clear --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Preview Slider */}
              {csvRows.length > 0 && (
                <div className="border-t border-slate-800/80 pt-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Label Preview (Row {batchPreviewIndex + 1} of {csvRows.length})
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={batchPreviewIndex === 0}
                        onClick={() => setBatchPreviewIndex(prev => prev - 1)}
                        className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition"
                      >
                        ◀ Prev
                      </button>
                      <button
                        disabled={batchPreviewIndex === csvRows.length - 1}
                        onClick={() => setBatchPreviewIndex(prev => prev + 1)}
                        className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition"
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>

                  {/* Display rendered variables for preview */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
                    {getTemplateVariables().map(v => {
                      const col = variableMapping[v];
                      const val = col ? csvRows[batchPreviewIndex]?.[col] : `{{${v}}}`;
                      return (
                        <div key={v} className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-500">{"{{"}{v}{"}}"}</span>
                          <span className="text-indigo-400 font-semibold truncate max-w-[250px]">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition"
          >
            Close
          </button>
          {csvRows.length > 0 && (
            <button 
              onClick={async () => {
                const jobs: BatchJob[] = csvRows.map(row => {
                  const variables: Record<string, string> = {};
                  Object.entries(variableMapping).forEach(([k, col]) => {
                    if (col) {
                      variables[k] = row[col] || '';
                    }
                  });
                  return { variables, copies: 1 };
                });
                await handleExecuteBatchPrint(jobs);
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              Print Batch ({csvRows.length} labels)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
