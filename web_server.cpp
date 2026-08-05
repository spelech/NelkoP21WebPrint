#include "web_server.h"
#include "config.h"
#include "logger.h"
#include "printer_spp.h"
#include <WiFi.h>

WebServer webServer(WEB_SERVER_PORT);
WiFiServer logServer(8080);

const char INDEX_HTML[] PROGMEM = R"raw(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nelko P21 Print Bridge</title>
    <style>
        body {
            background-color: #020617;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 800px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 16px;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(to right, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .card {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }
        .card-title {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-top: 0;
            margin-bottom: 16px;
        }
        .grid {
            display: grid;
            grid-template-cols: 1fr;
            gap: 16px;
        }
        @media (min-width: 640px) {
            .grid {
                grid-template-cols: 1fr 1fr;
            }
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #1e293b;
        }
        .status-item:last-child {
            border-bottom: none;
        }
        .label {
            color: #94a3b8;
            font-size: 0.875rem;
        }
        .value {
            font-size: 0.875rem;
            font-weight: 500;
        }
        .badge {
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-success {
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .badge-danger {
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .terminal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .terminal-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #94a3b8;
        }
        .btn {
            background-color: #1e293b;
            color: #f1f5f9;
            border: 1px solid #334155;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background-color: #334155;
        }
        .terminal {
            background-color: #090d16;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 16px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.8125rem;
            color: #38bdf8;
            height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nelko P21 Print Bridge</h1>
            <div id="connection-indicator" class="badge badge-danger">Offline</div>
        </div>

        <div class="card">
            <div class="card-title">Device Configuration</div>
            <div class="grid">
                <div>
                    <div class="status-item">
                        <span class="label">Wi-Fi IP</span>
                        <span class="value" id="wifi-ip">Connecting...</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Signal Strength (RSSI)</span>
                        <span class="value" id="wifi-rssi">- dBm</span>
                    </div>
                    <div class="status-item">
                        <span class="label">mDNS Hostname</span>
                        <span class="value">nelko-bridge.local</span>
                    </div>
                </div>
                <div>
                    <div class="status-item">
                        <span class="label">Bluetooth Status</span>
                        <span class="value" id="bt-status">Disconnected</span>
                    </div>
                    <div class="status-item">
                        <span class="label">TCP Print Port</span>
                        <span class="value">9100</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Log Web Clients</span>
                        <span class="value" id="log-clients">0</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="terminal-header">
                <span class="terminal-title">Live Debug Diagnostics</span>
                <button class="btn" onclick="clearLogs()">Clear Console</button>
            </div>
            <div class="terminal" id="log-console">Initializing bridge diagnostic logs...
</div>
        </div>
    </div>

    <script>
        const logConsole = document.getElementById('log-console');
        let sseSource = null;

        function clearLogs() {
            logConsole.textContent = '';
        }

        function appendLog(message) {
            const date = new Date();
            const timeStr = date.toTimeString().split(' ')[0];
            logConsole.textContent += `[${timeStr}] ${message}\n`;
            logConsole.scrollTop = logConsole.scrollHeight;
        }

        function fetchStats() {
            fetch('/stats')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('wifi-ip').textContent = data.ip;
                    document.getElementById('wifi-rssi').textContent = `${data.rssi} dBm`;
                    
                    const btStatus = document.getElementById('bt-status');
                    const indicator = document.getElementById('connection-indicator');
                    
                    if (data.bt_connected) {
                        btStatus.textContent = "Connected";
                        btStatus.className = "value";
                        indicator.textContent = "Ready";
                        indicator.className = "badge badge-success";
                    } else {
                        btStatus.textContent = "Searching...";
                        btStatus.className = "value badge-danger";
                        indicator.textContent = "Offline";
                        indicator.className = "badge badge-danger";
                    }
                    
                    document.getElementById('log-clients').textContent = data.log_clients;
                })
                .catch(err => {
                    console.error('Failed to fetch diagnostics:', err);
                });
        }

        function initLogs() {
            if (sseSource) {
                sseSource.close();
            }
            
            // Connect to Port 8080 for SSE Log Stream
            sseSource = new EventSource(`http://${window.location.hostname}:8080/logs`);
            
            sseSource.onopen = () => {
                appendLog("ESTABLISHED diagnostics log stream connection.");
            };
            
            sseSource.onmessage = (event) => {
                appendLog(event.data);
            };
            
            sseSource.onerror = (err) => {
                appendLog("DISCONNECTED from log stream. Attempting auto-reconnect...");
            };
        }

        // Initialize
        fetchStats();
        initLogs();
        setInterval(fetchStats, 3000);
    </script>
</body>
</html>
)raw";

void handleRoot() {
    webServer.send(200, "text/html", INDEX_HTML);
}

void handleStats() {
    String json = "{";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    json += "\"bt_connected\":" + String(isPrinterConnected() ? "true" : "false") + ",";
    json += "\"log_clients\":" + String(Logger::getClientCount()) + ",";
    json += "\"heap\":" + String(ESP.getFreeHeap()) + ",";
    json += "\"uptime\":" + String(millis() / 1000);
    json += "}";
    
    webServer.send(200, "application/json", json);
}

void initWebServer() {
    webServer.on("/", handleRoot);
    webServer.on("/stats", handleStats);
    webServer.begin();
    logServer.begin();
    Logger::log("Web diagnostic server started on port %d.", WEB_SERVER_PORT);
    Logger::log("Web log stream server started on port 8080.");
}

void handleWebServer() {
    webServer.handleClient();
    
    // Accept clients on the 8080 TCP server for logs
    WiFiClient client = logServer.available();
    if (client) {
        // Read headers first to clear input buffer before handshaking SSE
        while (client.available()) {
            client.read();
        }
        Logger::addLogClient(client);
    }
}
