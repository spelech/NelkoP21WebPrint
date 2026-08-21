import { Bluetooth, Smartphone, Wifi, Settings } from 'lucide-react';

export interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  browserBtConnected: boolean;
  browserBtDeviceName: string;
  handleConnectBrowserBt: () => void;
  wizardTab: 'pc' | 'mobile' | 'bridge' | string;
  setWizardTab: (tab: 'pc' | 'mobile' | 'bridge' | string) => void;
  setUseBrowserBt: (useBt: boolean) => void;
  setShowSettings: (show: boolean) => void;
  isMobile?: boolean;
}

export default function WizardModal({
  isOpen,
  onClose,
  handleConnectBrowserBt,
  wizardTab,
  setWizardTab,
  setUseBrowserBt,
  setShowSettings,
  isMobile: _isMobile = false
}: WizardModalProps): React.ReactElement | null {
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
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
          <button 
            onClick={() => setWizardTab('esp32')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'esp32' || wizardTab === 'bridge' || wizardTab === 'pc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Wifi className="w-4 h-4" />
            ESP32 Print Bridge (Wi-Fi)
          </button>
          <button 
            onClick={() => setWizardTab('mobile')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-4 h-4" />
            Direct Mobile Bluetooth
          </button>
        </div>

        {/* Tab 1: ESP32 Print Bridge */}
        {(wizardTab === 'esp32' || wizardTab === 'bridge' || wizardTab === 'pc') && (
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">⚡</span>
                <div>
                  <p className="text-xs font-semibold text-white">ESP32 Hardware Print Bridge & Standalone Web UI</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect your Nelko P21 printer to the <strong>ESP32 Print Bridge</strong> (or container server bridge at <code>10.0.0.10</code>). Enables zero-pairing network printing over Wi-Fi (TCP Port 9100) from any PC, phone, or tablet!
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
                <Settings className="w-4 h-4" />
                Configure ESP32 / Server Bridge Settings
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Mobile Bluetooth */}
        {wizardTab === 'mobile' && (
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                <p className="text-xs">
                  <strong>Open in Mobile Chrome / WebBLE:</strong> Open <code>https://labelprinter.wileyriley.com</code> on Chrome (Android) or WebBLE browser (iOS).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                <p className="text-xs">
                  <strong>Select Printer:</strong> Ensure printer power LED is green and tap <strong>Connect Mobile Bluetooth</strong> to pair directly via browser Web Bluetooth (GATT).
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
      </div>
    </div>
  );
}
