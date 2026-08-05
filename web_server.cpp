#include "web_server.h"
#include "config.h"
#include "logger.h"
#include "printer_spp.h"
#include "wifi_manager.h"
#include "tspl_generator.h"
#include <WiFi.h>

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
        .error { color: #ef4444; font-size: 0.8rem; margin-top: 12px; display: none; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Nelko Print Bridge</h1>
        <p>Enter 24-Hour Portal PIN to Access</p>
        <form onsubmit="handleLogin(event)">
            <input type="password" id="pin-input" placeholder="••••" maxlength="8" required autofocus>
            <button type="submit">Authenticate Session</button>
            <div id="error-msg" class="error">Invalid PIN Passcode</div>
        </form>
    </div>
    <script>
        function handleLogin(e) {
            e.preventDefault();
            const pin = document.getElementById('pin-input').value;
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'pin=' + encodeURIComponent(pin)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/';
                } else {
                    document.getElementById('error-msg').style.display = 'block';
                }
            })
            .catch(() => {
                document.getElementById('error-msg').style.display = 'block';
            });
        }
    </script>
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
            <h1>Nelko P21 Wireless Bridge <span style="font-size:0.75rem; font-weight:500; color:#94a3b8; margin-left:6px; background:#1e293b; padding:2px 8px; border-radius:6px;">v1.1.2</span></h1>
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
                        <option value="14x40">14mm x 40mm (Standard)</option>
                        <option value="14x30">14mm x 30mm (Short)</option>
                        <option value="12x40">12mm x 40mm (Slim)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Main Text</label>
                    <input type="text" id="main-text" placeholder="Sample Text" value="Nelko P21">
                </div>
                <div class="form-group">
                    <label>Subtitle / Secondary Text</label>
                    <input type="text" id="sub-text" placeholder="Optional Subtitle" value="Item #1042">
                </div>
                <div class="form-group">
                    <label>Code128 Barcode Data</label>
                    <input type="text" id="barcode-data" placeholder="1042598" value="1042598">
                </div>
                <div class="form-group">
                    <label>Border Thickness (<span id="border-val">2</span>px)</label>
                    <input type="range" id="border-range" min="0" max="6" value="2" oninput="document.getElementById('border-val').textContent=this.value">
                </div>
                <button class="btn-primary" onclick="printLabel()">Print Label Direct</button>
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
                border_thickness: parseInt(document.getElementById('border-range').value)
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
    String cookie = webServer.header("Cookie");
    if (isSessionValid(cookie)) {
        return true;
    }
    webServer.sendHeader("Location", "/login");
    webServer.send(302, "text/plain", "Redirecting to portal login...");
    return false;
}

void handleLoginRoute() {
    webServer.send(200, "text/html", LOGIN_HTML);
}

void handleAuthLoginApi() {
    if (webServer.hasArg("pin")) {
        String pin = webServer.arg("pin");
        if (validatePIN(pin)) {
            String token = createSession();
            webServer.sendHeader("Set-Cookie", "nelko_session=" + token + "; Max-Age=86400; Path=/");
            webServer.send(200, "application/json", "{\"success\":true}");
            return;
        }
    }
    webServer.send(401, "application/json", "{\"success\":false,\"error\":\"Invalid PIN\"}");
}

void handleRootRoute() {
    if (!checkAuth()) return;
    webServer.send(200, "text/html", APP_HTML);
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

void handlePrintApi() {
    if (!checkAuth()) return;
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

        String tsplPayload = generateTSPLStream(req);
        if (isPrinterConnected()) {
            SerialBT.write((const uint8_t*)tsplPayload.c_str(), tsplPayload.length());
            Logger::log("Direct API Print: Sent %d bytes of TSPL to printer.", tsplPayload.length());
            webServer.send(200, "application/json", "{\"status\":\"success\"}");
        } else {
            Logger::log("Direct API Print error: Printer is offline.");
            webServer.send(503, "application/json", "{\"error\":\"Printer offline\"}");
        }
        return;
    }
    webServer.send(400, "application/json", "{\"error\":\"Invalid payload\"}");
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
    webServer.sendHeader("Location", "http://192.168.4.1/login", true);
    webServer.send(302, "text/plain", "");
}

void initWebServer() {
    const char* headerKeys[] = {"Cookie"};
    webServer.collectHeaders(headerKeys, 1);

    webServer.on("/", handleRootRoute);
    webServer.on("/login", handleLoginRoute);
    webServer.on("/api/auth/login", HTTP_POST, handleAuthLoginApi);
    webServer.on("/api/wifi/scan", HTTP_GET, handleScanApi);
    webServer.on("/api/wifi/save", HTTP_POST, handleSaveApi);
    webServer.on("/api/bt/scan", HTTP_GET, handleBtScanApi);
    webServer.on("/api/bt/save", HTTP_POST, handleBtSaveApi);
    webServer.on("/api/print", HTTP_POST, handlePrintApi);

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
