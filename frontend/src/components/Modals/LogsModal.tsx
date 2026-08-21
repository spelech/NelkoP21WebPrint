import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Trash2, RefreshCw, X } from 'lucide-react';

export interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear system logs?')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll logs when modal is open
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle auto scrolling
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log =>
    log.toLowerCase().includes(filterText.toLowerCase())
  );

  const parseLogLine = (line: string) => {
    let levelColor = 'text-slate-400';
    let isError = false;

    if (line.includes('ERROR') || line.includes('CRITICAL') || line.includes('Failed')) {
      levelColor = 'text-rose-400';
      isError = true;
    } else if (line.includes('WARNING') || line.includes('WARN')) {
      levelColor = 'text-amber-400';
    } else if (line.includes('INFO')) {
      levelColor = 'text-indigo-400';
    } else if (line.includes('SUCCESS') || line.includes('Successfully')) {
      levelColor = 'text-emerald-400';
    }

    return { levelColor, isError };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                System & ESP32 Printer Logs
              </h2>
              <p className="text-[10px] text-slate-400">Live output of the server bridge and print jobs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition border border-slate-750"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearLogs}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 transition border border-slate-750 hover:border-rose-900/30 disabled:opacity-50"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition border border-slate-750"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search / Filter log lines..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 max-w-md p-2 rounded-xl glass-input text-xs"
          />

          <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer self-start sm:self-auto select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
            />
            Auto-scroll logs
          </label>
        </div>

        {/* Logs Terminal Body */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed bg-slate-950 text-slate-300 select-text">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Terminal className="w-6 h-6 text-slate-700 animate-pulse" />
              <span>No logs recorded yet. Run a print job to see activity.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log, idx) => {
                const { levelColor, isError } = parseLogLine(log);
                return (
                  <div key={idx} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-900/50 flex items-start gap-2 break-all ${isError ? 'bg-rose-950/10' : ''}`}>
                    <span className="text-slate-650 shrink-0 select-none">[{idx + 1}]</span>
                    <span className={`flex-1 whitespace-pre-wrap ${levelColor}`}>{log}</span>
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/20 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Polling bridge status every 2 seconds</span>
          <span>Showing {filteredLogs.length} of {logs.length} entries</span>
        </div>
      </div>
    </div>
  );
}
