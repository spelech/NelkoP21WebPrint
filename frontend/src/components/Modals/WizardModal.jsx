import React from 'react';
import { Bluetooth, Monitor, Smartphone, Wifi, AlertTriangle, Settings } from 'lucide-react';

export default function WizardModal({
  isOpen,
  onClose,
  browserBtConnected,
  browserBtDeviceName,
  handleConnectBrowserBt,
  wizardTab,
  setWizardTab,
  setUseBrowserBt,
  setShowSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-indigo-400" />
            Nelko P21 Connection Wizard
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Connection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
          <button 
            onClick={() => setWizardTab('pc')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'pc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor className="w-4 h-4" />
            PC (Web Serial)
          </button>
          <button 
            onClick={() => setWizardTab('mobile')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile Direct
          </button>
          <button 
            onClick={() => setWizardTab('bridge')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'bridge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Wifi className="w-4 h-4" />
            Server Bridge
          </button>
        </div>

        {/* Tab 1: PC Direct vs Server Bridge */}
        {wizardTab === 'pc' && (
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 leading-relaxed space-y-1">
                <p><strong>Hardware & PC Compatibility Fact:</strong></p>
                <p>1. The Nelko P21's USB-C port is <em>power charging ONLY</em> (no USB data controller hardware).</p>
                <p>2. Windows OS Bluetooth stack fails to negotiate RFCOMM sockets with Nelko printer chips, preventing PC browser direct Bluetooth connection.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">🌐</span>
                <div>
                  <p className="text-xs font-semibold text-white">Recommended PC Solution: Server Bridge Mode</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Switch to <strong>Server Bridge Mode</strong>. The home server container at <code>10.0.0.10</code> (or ESP32 node) handles the Bluetooth connection to the printer directly. You can click <strong>Print</strong> from any PC, Mac, or browser on your home network with zero PC Bluetooth pairing!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  setUseBrowserBt(false);
                  onClose();
                  setShowSettings(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Wifi className="w-4 h-4" />
                Switch to Server Bridge Mode
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile Direct */}
        {wizardTab === 'mobile' && (
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <p className="text-xs">
                  <strong>Open in Mobile Chrome / WebBLE:</strong> Open <code>https://labelprint.wileyriley.com</code> on Chrome (Android) or WebBLE browser (iOS).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <p className="text-xs">
                  <strong>Select Printer:</strong> Ensure green power light is on and tap <strong>Connect Mobile Bluetooth</strong> to pair.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={handleConnectBrowserBt}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4" />
                Pair & Connect Mobile Bluetooth
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Server Bridge */}
        {wizardTab === 'bridge' && (
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300">
                <strong>Zero-Pairing Network Printing:</strong> Connect printer directly to the home server via an <strong>ESP32 Wi-Fi Bridge</strong> (TCP Port 9100) or host Linux Bluetooth driver (<code>/dev/rfcomm0</code>).
              </p>
              <p className="text-xs text-slate-400">
                Allows any device, phone, or Home Assistant automation to print instantly without pairing Bluetooth in the browser.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  setUseBrowserBt(false);
                  onClose();
                  setShowSettings(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Settings className="w-4 h-4" />
                Configure Server Bridge Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
