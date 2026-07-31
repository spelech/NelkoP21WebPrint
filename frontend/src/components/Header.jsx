import React from 'react';
import { Printer, RefreshCw, Bluetooth, BluetoothSearching, Undo2, Redo2 } from 'lucide-react';

export default function Header({
  appVersion,
  historyIndex,
  history,
  handleUndo,
  handleRedo,
  useBrowserBt,
  setUseBrowserBt,
  browserBtConnected,
  browserBtDeviceName,
  browserBtConnecting,
  handleConnectBrowserBt,
  handleDisconnectBrowserBt,
  setShowWizardModal,
  handlePrint,
  isPrinting
}) {
  return (
    <header className="h-14 md:h-16 border-b border-slate-800 glass-panel px-3 md:px-6 flex items-center justify-between z-10 shrink-0">
      {/* Title & Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
          <Printer className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent truncate select-none">
              P21 Studio
            </h1>
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[9px] font-mono font-semibold shrink-0">
              v{appVersion}
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-400">203 DPI Thermal Label Engine</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
        {/* Undo / Redo controls */}
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1 px-1.5 md:px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold flex items-center justify-center"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-1 px-1.5 md:px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold flex items-center justify-center"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Redo</span>
          </button>
        </div>

        {/* Connection status (hidden on mobile, managed in Print tab) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/55 p-1 rounded-xl border border-slate-800/80">
            {/* Target Segmented Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-850">
              <button 
                onClick={() => setUseBrowserBt(true)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Browser Direct
              </button>
              <button 
                onClick={() => setUseBrowserBt(false)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${!useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Server Bridge
              </button>
            </div>

            {/* Connection Status Buttons */}
            {useBrowserBt ? (
              browserBtConnected ? (
                <button
                  onClick={handleDisconnectBrowserBt}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold transition"
                  title={`Connected to ${browserBtDeviceName}. Click to disconnect.`}
                >
                  <Bluetooth className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{browserBtDeviceName || 'Connected'}</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectBrowserBt}
                  disabled={browserBtConnecting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold transition disabled:opacity-50"
                >
                  {browserBtConnecting ? (
                    <BluetoothSearching className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  ) : (
                    <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{browserBtConnecting ? 'Connecting...' : 'Pair'}</span>
                </button>
              )
            ) : (
              <button
                onClick={() => setShowWizardModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/10 text-[10px] font-bold transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configure Bridge</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Print Trigger Button */}
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="flex items-center gap-1.5 px-3.5 md:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
        >
          {isPrinting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
          <span>Print</span>
        </button>
      </div>
    </header>
  );
}
