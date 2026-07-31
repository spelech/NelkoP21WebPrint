import React from 'react';
import { Settings, Wifi } from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  driverConfig, 
  setDriverConfig, 
  handleSaveConfig 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Server Printer Connection Settings
        </h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Driver Type</label>
            <select 
              value={driverConfig.driver_type}
              onChange={(e) => setDriverConfig({ ...driverConfig, driver_type: e.target.value })}
              className="w-full p-2.5 rounded-xl glass-input text-sm"
            >
              <option value="tcp" className="bg-slate-900">TCP Network Bridge (ESP32 / ESPHome Proxy)</option>
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
                  onChange={(e) => setDriverConfig({ ...driverConfig, tcp_host: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Port</label>
                <input 
                  type="number"
                  value={driverConfig.tcp_port}
                  onChange={(e) => setDriverConfig({ ...driverConfig, tcp_port: parseInt(e.target.value) || 9100 })}
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
                onChange={(e) => setDriverConfig({ ...driverConfig, bt_mac: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-sm"
              />
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
