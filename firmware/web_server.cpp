#include "web_server.h"
#include "config.h"
#include "logger.h"
#include "printer_spp.h"
#include "wifi_manager.h"
#include "tspl_generator.h"
#include <WiFi.h>
#include <Preferences.h>

WebServer webServer(WEB_SERVER_PORT);
WiFiServer logServer(8080);

const char LOGIN_HTML[] PROGMEM = R"raw(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nelko Bridge - Portal Login</title>
    <style>
        body {
            background-color: #020617;
            color: #f1f5f9;
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .login-card {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(16px);
            border: 1px solid #1e293b;
            border-radius: 20px;
            padding: 32px;
            width: 100%;
            max-width: 360px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        h1 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 8px;
            background: linear-gradient(to right, #6366f1, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #94a3b8;
            font-size: 0.85rem;
            margin-bottom: 24px;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #334155;
            background: #090d16;
            color: #ffffff;
            font-size: 1.25rem;
            text-align: center;
            letter-spacing: 0.25em;
            box-sizing: border-box;
            margin-bottom: 16px;
        }
        button {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(to right, #4f46e5, #7c3aed);
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        button:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Nelko Print Bridge</h1>
        <p>Enter Portal PIN to Access</p>
        <form action="/api/auth/login" method="POST">
            <input type="password" name="pin" placeholder="••••" maxlength="8" required autofocus>
            <button type="submit">Authenticate Session</button>
        </form>
    </div>
</body>
</html>
)raw";

const char APP_HTML[] PROGMEM = R"raw(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nelko P21 Bridge & Designer</title>
    <style>
        body {
            background-color: #020617;
            color: #f1f5f9;
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 16px;
            display: flex;
            justify-content: center;
        }
        .container { width: 100%; max-width: 760px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }
        h1 { font-size: 1.35rem; margin: 0; background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-tabs { display: grid; grid-template-cols: 1fr 1fr; gap: 8px; margin-bottom: 20px; background: #0f172a; padding: 4px; border-radius: 12px; border: 1px solid #1e293b; }
        .tab-btn { padding: 10px; border: none; background: transparent; color: #94a3b8; font-weight: 600; font-size: 0.85rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: #312e81; color: #ffffff; }
        .card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid #1e293b; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.05em; }
        .form-group { margin-bottom: 14px; }
        label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
        input[type="text"], input[type="password"], select { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #334155; background: #090d16; color: #ffffff; font-size: 0.9rem; box-sizing: border-box; }
        input[type="range"] { width: 100%; accent-color: #6366f1; }
        .btn-primary { width: 100%; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; font-weight: 700; font-size: 0.95rem; cursor: pointer; }
        .btn-secondary { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; margin-bottom: 10px; }
        .terminal { background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; font-family: monospace; font-size: 0.8rem; color: #38bdf8; height: 220px; overflow-y: auto; white-space: pre-wrap; }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 12px; background: #10b981; color: white; font-weight: 600; font-size: 0.85rem; display: none; z-index: 100; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="display:flex; align-items:center;">
                <span>Nelko P21 Wireless Bridge</span>
                <span style="font-size:0.75rem; font-weight:700; color:#e0e7ff; background:#312e81; border:1px solid #6366f188; margin-left:10px; padding:3px 10px; border-radius:8px; -webkit-text-fill-color: initial; display:inline-block;">v2.0.2</span>
            </h1>
            <div id="status-badge" style="padding:4px 10px; border-radius:99px; font-size:0.75rem; font-weight:600; background:#ef444422; color:#ef4444; border:1px solid #ef444444;">Offline</div>
        </div>

        <div class="nav-tabs">
            <button class="tab-btn active" id="btn-designer" onclick="showTab('designer')">Standalone Designer</button>
            <button class="tab-btn" id="btn-config" onclick="showTab('config')">Bluetooth & Wi-Fi Settings</button>
        </div>

        <!-- TAB 1: Designer -->
        <div id="tab-designer">
            <div class="card">
                <div class="form-group">
                    <label>Label Size Preset</label>
                    <select id="preset-size">
                        <option value="40x14">40mm x 14mm (Standard)</option>
                        <option value="30x14">30mm x 14mm (Short)</option>
                        <option value="40x12">40mm x 12mm (Slim)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Main Text</label>
                    <input type="text" id="main-text" placeholder="Sample Text" value="Nelko P21">
                </div>
                <div class="form-group" style="display:grid; grid-template-cols: 1fr 1fr; gap:10px;">
                    <div>
                        <label>Main Text Size</label>
                        <select id="font-scale-main">
                            <option value="2" selected>Large (2x)</option>
                            <option value="3">Extra Large (3x)</option>
                            <option value="1">Medium (1x)</option>
                        </select>
                    </div>
                    <div>
                        <label>Subtitle Size</label>
                        <select id="font-scale-sub">
                            <option value="1" selected>Medium (1x)</option>
                            <option value="2">Large (2x)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Subtitle / Secondary Text</label>
                    <input type="text" id="sub-text" placeholder="Optional Subtitle" value="Item #1042">
                </div>
                <div class="form-group">
                    <label>Code128 Barcode Data</label>
                    <input type="text" id="barcode-data" placeholder="1042598" value="1042598">
                </div>
                <div class="form-group" style="display:grid; grid-template-cols: 1fr 1fr; gap:10px;">
                    <div>
                        <label>Horizontal Shift (<span id="x-off-val">0</span>px)</label>
                        <input type="range" id="x-off" min="-30" max="30" value="0" oninput="document.getElementById('x-off-val').textContent=this.value">
                    </div>
                    <div>
                        <label>Vertical Shift (<span id="y-off-val">0</span>px)</label>
                        <input type="range" id="y-off" min="-20" max="20" value="0" oninput="document.getElementById('y-off-val').textContent=this.value">
                    </div>
                </div>
                <div class="form-group">
                    <label>Border Thickness (<span id="border-val">2</span>px)</label>
                    <input type="range" id="border-range" min="0" max="6" value="2" oninput="document.getElementById('border-val').textContent=this.value">
                </div>
                <button class="btn-primary" onclick="printLabel()">Print Label Direct</button>
            </div>

            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div class="card-title" style="margin-bottom:0;">Custom JSON Template Management</div>
                    <div id="tpl-status-badge" style="padding:4px 10px; border-radius:99px; font-size:0.75rem; font-weight:600; background:#6366f122; color:#818cf8; border:1px solid #6366f144;">Checking...</div>
                </div>
                <input type="file" id="tpl-file-input" accept=".json" style="display:none;" onchange="uploadSelectedTemplate(event)">
                <button class="btn-secondary" onclick="document.getElementById('tpl-file-input').click()">Upload Nelko JSON Template File</button>
                <button class="btn-secondary" onclick="downloadActiveTemplate()">Export Active ESP32 Template</button>
                <button class="btn-secondary" style="border-color:#ef444466; color:#ef4444;" onclick="resetTemplate()">Reset to Default Layout</button>
            </div>
        </div>

        <!-- TAB 2: Config & Diagnostics -->
        <div id="tab-config" style="display:none;">
            <!-- Bluetooth Setup Card -->
            <div class="card">
                <div class="card-title">Bluetooth Printer Discovery</div>
                <div class="form-group">
                    <button class="btn-secondary" onclick="scanBt()">Scan Nearby Bluetooth Printers (5s)</button>
                    <select id="bt-select"><option value="">Select a discovered printer...</option></select>
                </div>
                <button class="btn-primary" onclick="saveBt()">Connect & Save Bluetooth Printer</button>
            </div>

            <!-- Wi-Fi Setup Card -->
            <div class="card">
                <div class="card-title">Wi-Fi Network Configuration</div>
                <div class="form-group">
                    <button class="btn-secondary" onclick="scanWifi()">Scan Local Wi-Fi Networks</button>
                    <select id="wifi-select"><option value="">Select a network...</option></select>
                </div>
                <div class="form-group">
                    <label>Wi-Fi Password</label>
                    <input type="password" id="wifi-pass" placeholder="Network Password">
                </div>
                <button class="btn-primary" onclick="saveWifi()">Save Wi-Fi & Reconnect</button>
            </div>

            <div class="card">
                <div class="card-title">Live SSE Log Console</div>
                <div class="terminal" id="log-console">Log stream initializing...</div>
            </div>
        </div>
    </div>

    <div class="toast" id="toast">Action completed!</div>

    <script>
        function showTab(tab) {
            document.getElementById('btn-designer').classList.remove('active');
            document.getElementById('btn-config').classList.remove('active');
            if (tab === 'designer') {
                document.getElementById('tab-designer').style.display = 'block';
                document.getElementById('tab-config').style.display = 'none';
                document.getElementById('btn-designer').classList.add('active');
            } else {
                document.getElementById('tab-designer').style.display = 'none';
                document.getElementById('tab-config').style.display = 'block';
                document.getElementById('btn-config').classList.add('active');
            }
        }

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 3000);
        }

        function printLabel() {
            const size = document.getElementById('preset-size').value.split('x');
            const payload = {
                width_mm: parseFloat(size[0]),
                height_mm: parseFloat(size[1]),
                main_text: document.getElementById('main-text').value,
                subtitle: document.getElementById('sub-text').value,
                barcode_data: document.getElementById('barcode-data').value,
                border_thickness: parseInt(document.getElementById('border-range').value),
                x_offset: parseInt(document.getElementById('x-off').value),
                y_offset: parseInt(document.getElementById('y-off').value),
                font_scale_main: parseInt(document.getElementById('font-scale-main').value),
                font_scale_sub: parseInt(document.getElementById('font-scale-sub').value)
            };

            fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => { showToast('Printed label successfully!'); })
            .catch(err => { showToast('Print error!'); });
        }

        function scanBt() {
            showToast('Scanning Bluetooth printers...');
            fetch('/api/bt/scan')
                .then(res => res.json())
                .then(devices => {
                    const sel = document.getElementById('bt-select');
                    sel.innerHTML = '<option value="">Select a discovered printer...</option>';
                    devices.forEach(d => {
                        const opt = document.createElement('option');
                        opt.value = d.mac;
                        opt.textContent = `${d.name} (${d.mac}) [${d.rssi} dBm]`;
                        sel.appendChild(opt);
                    });
                    showToast(`Discovered ${devices.length} Bluetooth devices!`);
                })
                .catch(err => { showToast('Bluetooth scan error!'); });
        }

        function saveBt() {
            const mac = document.getElementById('bt-select').value;
            if (!mac) { showToast('Please select a Bluetooth printer!'); return; }
            fetch('/api/bt/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `mac=${encodeURIComponent(mac)}`
            })
            .then(res => res.json())
            .then(data => { showToast('Saved & connected to Bluetooth printer!'); });
        }

        function scanWifi() {
            fetch('/api/wifi/scan')
                .then(res => res.json())
                .then(nets => {
                    const sel = document.getElementById('wifi-select');
                    sel.innerHTML = '<option value="">Select a network...</option>';
                    nets.forEach(n => {
                        const opt = document.createElement('option');
                        opt.value = n.ssid;
                        opt.textContent = `${n.ssid} (${n.rssi} dBm)`;
                        sel.appendChild(opt);
                    });
                });
        }

        function saveWifi() {
            const ssid = document.getElementById('wifi-select').value;
            const pass = document.getElementById('wifi-pass').value;
            fetch('/api/wifi/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`
            })
            .then(() => { showToast('Saved! Reconnecting device...'); });
        }

        function checkTemplateStatus() {
            fetch('/api/template/load')
                .then(res => res.json())
                .then(data => {
                    const badge = document.getElementById('tpl-status-badge');
                    if (!badge) return;
                    if (data && Object.keys(data).length > 0) {
                        badge.textContent = 'Custom JSON Template';
                        badge.style.background = '#10b98122';
                        badge.style.color = '#10b981';
                        badge.style.borderColor = '#10b98144';
                    } else {
                        badge.textContent = 'Default Built-in Layout';
                        badge.style.background = '#6366f122';
                        badge.style.color = '#818cf8';
                        badge.style.borderColor = '#6366f144';
                    }
                })
                .catch(err => {
                    const badge = document.getElementById('tpl-status-badge');
                    if (badge) {
                        badge.textContent = 'Default Built-in Layout';
                        badge.style.background = '#6366f122';
                        badge.style.color = '#818cf8';
                        badge.style.borderColor = '#6366f144';
                    }
                });
        }

        function uploadSelectedTemplate(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                fetch('/api/template/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: content
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'ok') {
                        showToast('Template uploaded successfully!');
                        checkTemplateStatus();
                    } else {
                        showToast('Upload failed: ' + (data.error || 'Invalid template'));
                    }
                })
                .catch(err => { showToast('Template upload error!'); });
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        function downloadActiveTemplate() {
            fetch('/api/template/load')
                .then(res => res.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'esp32-label-template.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Exported active template!');
                })
                .catch(err => { showToast('Error exporting template!'); });
        }

        function resetTemplate() {
            if (!confirm('Are you sure you want to reset to default layout?')) return;
            fetch('/api/template/reset', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    showToast('Reset to default layout!');
                    checkTemplateStatus();
                })
                .catch(err => { showToast('Reset error!'); });
        }

        function checkPrinterStatus() {
            fetch('/api/status')
                .then(res => res.json())
                .then(data => {
                    const badge = document.getElementById('status-badge');
                    if (!badge) return;
                    if (data.connected) {
                        badge.textContent = 'Connected: ' + data.mac;
                        badge.style.background = '#10b98122';
                        badge.style.color = '#10b981';
                        badge.style.borderColor = '#10b98144';
                    } else {
                        badge.textContent = 'Offline (' + data.mac + ')';
                        badge.style.background = '#ef444422';
                        badge.style.color = '#ef4444';
                        badge.style.borderColor = '#ef444444';
                    }
                })
                .catch(() => {});
        }

        document.addEventListener('DOMContentLoaded', () => {
            checkTemplateStatus();
            checkPrinterStatus();
            setInterval(checkPrinterStatus, 3000);
        });
        checkTemplateStatus();
        checkPrinterStatus();

        // Live Log Stream
        const sse = new EventSource(`http://${window.location.hostname}:8080/logs`);
        sse.onmessage = (e) => {
            const consoleEl = document.getElementById('log-console');
            consoleEl.textContent += e.data + '\n';
            consoleEl.scrollTop = consoleEl.scrollHeight;
        };
    </script>
</body>
</html>
)raw";

static bool checkAuth() {
    return true;
}

void handleLoginRoute() {
    webServer.send(200, "text/html", LOGIN_HTML);
}

void handleAuthLoginApi() {
    String pin = "";
    if (webServer.hasArg("pin")) {
        pin = webServer.arg("pin");
    }

    if (validatePIN(pin)) {
        String token = createSession();
        webServer.sendHeader("Set-Cookie", "nelko_session=" + token + "; Max-Age=86400; Path=/");
        webServer.sendHeader("Location", "/", true);
        webServer.send(302, "text/plain", "Authenticated successfully.");
        return;
    }

    webServer.sendHeader("Location", "/login", true);
    webServer.send(302, "text/plain", "Invalid PIN");
}

void handleRootRoute() {
    if (!checkAuth()) return;
    webServer.send_P(200, "text/html", APP_HTML);
}

void handleScanApi() {
    if (!checkAuth()) return;
    String json = scanWiFiNetworks();
    webServer.send(200, "application/json", json);
}

void handleSaveApi() {
    if (!checkAuth()) return;
    if (webServer.hasArg("ssid")) {
        String ssid = webServer.arg("ssid");
        String pass = webServer.hasArg("pass") ? webServer.arg("pass") : "";
        saveWiFiCredentials(ssid, pass);
        webServer.send(200, "application/json", "{\"status\":\"ok\"}");
        delay(1000);
        ESP.restart();
        return;
    }
    webServer.send(400, "application/json", "{\"error\":\"Missing SSID\"}");
}

void handleBtScanApi() {
    if (!checkAuth()) return;
    String json = scanBluetoothDevices();
    webServer.send(200, "application/json", json);
}

void handleBtSaveApi() {
    if (!checkAuth()) return;
    if (webServer.hasArg("mac")) {
        String mac = webServer.arg("mac");
        if (savePrinterMAC(mac)) {
            webServer.send(200, "application/json", "{\"status\":\"ok\"}");
            return;
        }
    }
    webServer.send(400, "application/json", "{\"error\":\"Invalid MAC address\"}");
}

static void sendCORSHeaders() {
    webServer.sendHeader("Access-Control-Allow-Origin", "*");
    webServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    webServer.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleOptionsCORS() {
    sendCORSHeaders();
    webServer.send(204, "text/plain", "");
}

void handleStatusApi() {
    sendCORSHeaders();
    String json = "{";
    json += "\"connected\":" + String(isPrinterConnected() ? "true" : "false") + ",";
    json += "\"mac\":\"" + getPrinterMACString() + "\",";
    json += "\"version\":\"" + String(APP_VERSION) + "\",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\"";
    json += "}";
    webServer.send(200, "application/json", json);
}

String getStoredTemplateJSON() {
    Preferences prefs;
    prefs.begin("label-tpl", true);
    String json = prefs.getString("layout", "");
    prefs.end();
    return json;
}

bool saveStoredTemplateJSON(const String& json) {
    Preferences prefs;
    prefs.begin("label-tpl", false);
    size_t written = prefs.putString("layout", json);
    prefs.end();
    return written > 0;
}

void clearStoredTemplateJSON() {
    Preferences prefs;
    prefs.begin("label-tpl", false);
    prefs.remove("layout");
    prefs.end();
}

void handleTemplateSaveApi() {
    sendCORSHeaders();
    String body = "";
    if (webServer.hasArg("plain")) {
        body = webServer.arg("plain");
    } else if (webServer.hasArg("json")) {
        body = webServer.arg("json");
    }

    if (body.length() > 0 && saveStoredTemplateJSON(body)) {
        Logger::log("Template Save: Stored dynamic JSON layout (%d bytes) to NVS.", body.length());
        webServer.send(200, "application/json", "{\"status\":\"ok\"}");
    } else {
        webServer.send(400, "application/json", "{\"error\":\"Invalid template JSON\"}");
    }
}

void handleTemplateLoadApi() {
    sendCORSHeaders();
    String storedJson = getStoredTemplateJSON();
    if (storedJson.length() == 0) {
        storedJson = "{}";
    }
    webServer.send(200, "application/json", storedJson);
}

void handleTemplateResetApi() {
    sendCORSHeaders();
    clearStoredTemplateJSON();
    Logger::log("Template Reset: Cleared NVS layout template. Restored default layout.");
    webServer.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handlePrintApi() {
    sendCORSHeaders();
    Logger::log("Received POST /api/print request from client.");
    if (webServer.hasArg("plain")) {
        String body = webServer.arg("plain");

        SimpleLabelRequest req;
        if (body.indexOf("main_text") != -1) {
            int idx = body.indexOf("\"main_text\"");
            int startQuote = body.indexOf('"', idx + 11);
            int endQuote = body.indexOf('"', startQuote + 1);
            if (startQuote != -1 && endQuote != -1) {
                req.mainText = body.substring(startQuote + 1, endQuote);
            }
        }
        if (body.indexOf("subtitle") != -1) {
            int idx = body.indexOf("\"subtitle\"");
            int startQuote = body.indexOf('"', idx + 10);
            int endQuote = body.indexOf('"', startQuote + 1);
            if (startQuote != -1 && endQuote != -1) {
                req.subtitle = body.substring(startQuote + 1, endQuote);
            }
        }
        if (body.indexOf("barcode_data") != -1) {
            int idx = body.indexOf("\"barcode_data\"");
            int startQuote = body.indexOf('"', idx + 14);
            int endQuote = body.indexOf('"', startQuote + 1);
            if (startQuote != -1 && endQuote != -1) {
                req.barcodeData = body.substring(startQuote + 1, endQuote);
            }
        }
        if (body.indexOf("x_offset") != -1) {
            int idx = body.indexOf("\"x_offset\"");
            int colon = body.indexOf(':', idx);
            if (colon != -1) req.xOffset = body.substring(colon + 1).toInt();
        }
        if (body.indexOf("y_offset") != -1) {
            int idx = body.indexOf("\"y_offset\"");
            int colon = body.indexOf(':', idx);
            if (colon != -1) req.yOffset = body.substring(colon + 1).toInt();
        }
        if (body.indexOf("font_scale_main") != -1) {
            int idx = body.indexOf("\"font_scale_main\"");
            int colon = body.indexOf(':', idx);
            if (colon != -1) req.fontScaleMain = body.substring(colon + 1).toInt();
        }
        if (body.indexOf("font_scale_sub") != -1) {
            int idx = body.indexOf("\"font_scale_sub\"");
            int colon = body.indexOf(':', idx);
            if (colon != -1) req.fontScaleSub = body.substring(colon + 1).toInt();
        }
        if (body.indexOf("border_thickness") != -1) {
            int idx = body.indexOf("\"border_thickness\"");
            int colon = body.indexOf(':', idx);
            if (colon != -1) req.borderThickness = body.substring(colon + 1).toInt();
        }

        String storedJson = getStoredTemplateJSON();
        String tsplPayload;
        if (body.indexOf("\"elements\"") != -1) {
            tsplPayload = generateTSPLFromJSON(body, req);
        } else if (storedJson.length() > 0) {
            tsplPayload = generateTSPLFromJSON(storedJson, req);
        } else {
            tsplPayload = generateTSPLStream(req);
        }

        if (isPrinterConnected()) {
            if (sendToPrinter((const uint8_t*)tsplPayload.c_str(), tsplPayload.length())) {
                Logger::log("Direct API Print: Sent %d bytes of TSPL to printer.", tsplPayload.length());
                webServer.send(200, "application/json", "{\"status\":\"success\"}");
            } else {
                Logger::log("Direct API Print: Write error / buffer stall.");
                webServer.send(500, "application/json", "{\"error\":\"Print transmission failed\"}");
            }
        } else {
            Logger::log("Direct API Print error: Printer is offline.");
            webServer.send(530, "application/json", "{\"error\":\"Printer offline\"}");
        }
        return;
    }
    webServer.send(400, "application/json", "{\"error\":\"Invalid payload\"}");
}

void handlePrintCanvasApi() {
    sendCORSHeaders();
    Logger::log("Received POST /api/print/canvas print request from web dashboard.");

    String body = "";
    if (webServer.hasArg("plain")) {
        body = webServer.arg("plain");
    }

    SimpleLabelRequest req;
    req.widthMm = 40.0f;
    req.heightMm = 14.0f;
    req.gapMm = 5.0f;
    req.copies = 1;

    if (body.indexOf("width_mm") != -1) {
        int idx = body.indexOf("\"width_mm\"");
        int colon = body.indexOf(':', idx);
        if (colon != -1) req.widthMm = body.substring(colon + 1).toFloat();
    }
    if (body.indexOf("height_mm") != -1) {
        int idx = body.indexOf("\"height_mm\"");
        int colon = body.indexOf(':', idx);
        if (colon != -1) req.heightMm = body.substring(colon + 1).toFloat();
    }
    if (body.indexOf("copies") != -1) {
        int idx = body.indexOf("\"copies\"");
        int colon = body.indexOf(':', idx);
        if (colon != -1) req.copies = body.substring(colon + 1).toInt();
    }

    String tsplPayload;
    String storedJson = getStoredTemplateJSON();
    if (body.indexOf("\"elements\"") != -1) {
        tsplPayload = generateTSPLFromJSON(body, req);
    } else if (storedJson.length() > 0) {
        tsplPayload = generateTSPLFromJSON(storedJson, req);
    } else {
        tsplPayload = generateTSPLStream(req);
    }

    if (isPrinterConnected()) {
        if (sendToPrinter((const uint8_t*)tsplPayload.c_str(), tsplPayload.length())) {
            Logger::log("Canvas Print: Forwarded %d bytes of TSPL to Bluetooth printer.", tsplPayload.length());
            webServer.send(200, "application/json", "{\"status\":\"success\"}");
        } else {
            Logger::log("Canvas Print: Write error / buffer stall.");
            webServer.send(500, "application/json", "{\"error\":\"Print transmission failed\"}");
        }
    } else {
        Logger::log("Canvas Print error: Bluetooth printer is offline!");
        webServer.send(530, "application/json", "{\"error\":\"Printer offline\"}");
    }
}

// Strict Captive Portal Redirection
void handleCaptivePortal() {
    if (isSoftAP()) {
        String host = webServer.hostHeader();
        if (host != "192.168.4.1" && host != "nelko-bridge.local") {
            webServer.sendHeader("Location", "http://192.168.4.1/login", true);
            webServer.send(302, "text/plain", "");
            return;
        }
    }
    webServer.send(404, "text/plain", "Not Found");
}

void initWebServer() {
    const char* headerKeys[] = {"Cookie"};
    webServer.collectHeaders(headerKeys, 1);

    webServer.on("/", handleRootRoute);
    webServer.on("/login", handleLoginRoute);
    webServer.on("/api/auth/login", handleAuthLoginApi);
    webServer.on("/api/wifi/scan", HTTP_GET, handleScanApi);
    webServer.on("/api/wifi/save", HTTP_POST, handleSaveApi);
    webServer.on("/api/bt/scan", HTTP_GET, handleBtScanApi);
    webServer.on("/api/bt/save", HTTP_POST, handleBtSaveApi);
    webServer.on("/api/status", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/status", HTTP_GET, handleStatusApi);
    webServer.on("/api/printer/status", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/printer/status", HTTP_GET, handleStatusApi);
    webServer.on("/api/template/save", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/template/save", HTTP_POST, handleTemplateSaveApi);
    webServer.on("/api/template/load", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/template/load", HTTP_GET, handleTemplateLoadApi);
    webServer.on("/api/template/reset", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/template/reset", HTTP_POST, handleTemplateResetApi);
    webServer.on("/api/print", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/print", HTTP_POST, handlePrintApi);
    webServer.on("/api/print/canvas", HTTP_OPTIONS, handleOptionsCORS);
    webServer.on("/api/print/canvas", HTTP_POST, handlePrintCanvasApi);

    // Captive Portal OS Detection Probe Handlers
    webServer.on("/generate_204", handleCaptivePortal);
    webServer.on("/gen_204", handleCaptivePortal);
    webServer.on("/hotspot-detect.html", handleCaptivePortal);
    webServer.on("/library/test/success.html", handleCaptivePortal);
    webServer.on("/success.txt", handleCaptivePortal);
    webServer.on("/canonical.html", handleCaptivePortal);
    webServer.on("/nconnect.asp", handleCaptivePortal);
    webServer.on("/connecttest.txt", handleCaptivePortal);
    webServer.on("/redirect", handleCaptivePortal);
    webServer.onNotFound(handleCaptivePortal);

    webServer.begin();
    logServer.begin();
    Logger::log("Embedded Label Designer & Captive Portal started on port %d.", WEB_SERVER_PORT);
}

void handleWebServer() {
    webServer.handleClient();

    WiFiClient client = logServer.available();
    if (client) {
        while (client.available()) {
            client.read();
        }
        Logger::addLogClient(client);
    }
}
