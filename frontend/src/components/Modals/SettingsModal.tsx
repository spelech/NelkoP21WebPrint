import React, { useState } from 'react';
import { Settings, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export interface DriverConfig {
  driver_type: 'tcp' | 'spp' | 'mock' | string;
  tcp_host: string;
  tcp_port: number;
  bt_mac: string;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverConfig: DriverConfig;
  setDriverConfig: (config: DriverConfig) => void;
  handleSaveConfig: () => void;
  handleProbeBridge?: (candidate?: DriverConfig) => Promise<{ reachable: boolean; error?: string; status?: string }>;
  isMobile?: boolean;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  driverConfig, 
  setDriverConfig, 
  handleSaveConfig,
  handleProbeBridge,
  isMobile: _isMobile = false
}: SettingsModalProps): React.ReactElement | null {
  const [probing, setProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{ reachable: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const onTestConnection = async () => {
    if (!handleProbeBridge) return;
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await handleProbeBridge(driverConfig);
      if (res.reachable) {
        setProbeResult({
          reachable: true,
          message: res.status || `Bridge reachable at ${driverConfig.tcp_host}:${driverConfig.tcp_port || 9100}`
        });
      } else {
        setProbeResult({
          reachable: false,
          message: res.error || `Bridge unreachable at ${driverConfig.tcp_host}:${driverConfig.tcp_port || 9100}`
        });
      }
    } catch (err: any) {
      setProbeResult({
        reachable: false,
        message: `Probe failed: ${err?.message || err}`
      });
    } finally {
      setProbing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Server Printer Connection Settings
        </h3>

        <div className="flex flex-col gap-4">
          <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-200">
            <span className="font-semibold text-indigo-300">TCP Network Bridge: </span>
            Recommended for server & ESP32 network printing (e.g. <code className="text-white font-mono">10.0.0.196:9100</code>).
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Driver Type</label>
            <select 
              value={driverConfig.driver_type}
              onChange={(e) => {
                setDriverConfig({ ...driverConfig, driver_type: e.target.value });
                setProbeResult(null);
              }}
              className="w-full p-2.5 rounded-xl glass-input text-sm"
            >
              <option value="tcp" className="bg-slate-900">TCP Network Bridge (ESP32 Print Bridge / JetDirect)</option>
              <option value="spp" className="bg-slate-900">Direct Bluetooth SPP (RFCOMM)</option>
              <option value="mock" className="bg-slate-900">Mock Driver (Testing)</option>
            </select>
          </div>

          {driverConfig.driver_type === 'tcp' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">IP Address / Host</label>
                <input 
                  type="text"
                  value={driverConfig.tcp_host}
                  onChange={(e) => {
                    setDriverConfig({ ...driverConfig, tcp_host: e.target.value });
                    setProbeResult(null);
                  }}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Port</label>
                <input 
                  type="number"
                  value={driverConfig.tcp_port}
                  onChange={(e) => {
                    setDriverConfig({ ...driverConfig, tcp_port: parseInt(e.target.value, 10) || 9100 });
                    setProbeResult(null);
                  }}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>
          )}

          {driverConfig.driver_type === 'spp' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bluetooth MAC Address</label>
              <input 
                type="text"
                placeholder="e.g. 00:11:22:33:44:55"
                value={driverConfig.bt_mac}
                onChange={(e) => {
                  setDriverConfig({ ...driverConfig, bt_mac: e.target.value });
                  setProbeResult(null);
                }}
                className="w-full p-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          )}

          {/* Test Connection Action */}
          {handleProbeBridge && (
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={onTestConnection}
                disabled={probing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${probing ? 'animate-spin' : ''}`} />
                <span>{probing ? 'Testing Reachability...' : 'Test Bridge Connection'}</span>
              </button>

              {probeResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  probeResult.reachable 
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                }`}>
                  {probeResult.reachable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="truncate">{probeResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveConfig}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
