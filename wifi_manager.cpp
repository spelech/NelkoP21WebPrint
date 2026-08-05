#include "wifi_manager.h"
#include "config.h"
#include "logger.h"

static Preferences preferences;
static DNSServer dnsServer;
static bool softAPMode = false;
static std::vector<Session> activeSessions;
static const unsigned long SESSION_DURATION_MS = 86400000UL; // 24 Hours in milliseconds

#ifndef DEFAULT_PORTAL_PIN
#define DEFAULT_PORTAL_PIN "1234"
#endif

void initWiFiManager() {
    preferences.begin("wifi-config", false);
    String ssid = preferences.getString("ssid", WIFI_SSID);
    String pass = preferences.getString("pass", WIFI_PASS);

    Logger::log("Initializing Wi-Fi Manager...");

    if (ssid.length() > 0 && ssid != "YOUR_WIFI_SSID") {
        WiFi.mode(WIFI_STA);
        WiFi.begin(ssid.c_str(), pass.c_str());
        Logger::log("Connecting to saved Wi-Fi network: %s", ssid.c_str());

        unsigned long startAttemptTime = millis();
        // 15-second non-blocking timeout for Wi-Fi station connection
        while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
            delay(100);
        }
    }

    if (WiFi.status() == WL_CONNECTED) {
        softAPMode = false;
        Logger::log("Wi-Fi Station connected successfully!");
        Logger::log("IP Address: %s", WiFi.localIP().toString().c_str());
    } else {
        // Fallback to SoftAP Hotspot & Captive Portal
        softAPMode = true;
        Logger::log("Wi-Fi Station connection failed or unconfigured.");
        Logger::log("Starting SoftAP Hotspot & Strict Captive Portal...");

        WiFi.disconnect(true);
        delay(100);
        WiFi.mode(WIFI_AP);

        IPAddress apIP(192, 168, 4, 1);
        IPAddress netMask(255, 255, 255, 0);
        WiFi.softAPConfig(apIP, apIP, netMask);
        WiFi.softAP("Nelko-Bridge-AP");

        // Redirect all DNS queries (*) to SoftAP IP for strict captive portal
        dnsServer.setErrorOutputCode(DNSReplyCode::NoError);
        dnsServer.start(53, "*", apIP);

        Logger::log("SoftAP Hotspot active: 'Nelko-Bridge-AP'");
        Logger::log("Captive Portal Gateway IP: %s", apIP.toString().c_str());
    }
}

void handleWiFiManager() {
    if (softAPMode) {
        dnsServer.processNextRequest();
    }

    // Clean up expired 24h sessions
    unsigned long now = millis();
    for (auto it = activeSessions.begin(); it != activeSessions.end(); ) {
        if (now - it->createdAt >= SESSION_DURATION_MS) {
            it = activeSessions.erase(it);
            Logger::log("Expired 24h session token removed.");
        } else {
            ++it;
        }
    }
}

bool isSoftAP() {
    return softAPMode;
}

bool validatePIN(const String& pin) {
    String correctPIN = preferences.getString("pin", DEFAULT_PORTAL_PIN);
    return (pin == correctPIN);
}

String createSession() {
    String token = String(random(100000, 999999)) + String(millis());
    Session newSession;
    newSession.token = token;
    newSession.createdAt = millis();
    activeSessions.push_back(newSession);
    Logger::log("Created new 24-hour authenticated session.");
    return token;
}

bool isSessionValid(const String& cookieHeader) {
    if (cookieHeader.length() == 0) return false;

    int tokenIndex = cookieHeader.indexOf("nelko_session=");
    if (tokenIndex == -1) return false;

    String token = cookieHeader.substring(tokenIndex + 14);
    int endSemi = token.indexOf(';');
    if (endSemi != -1) {
        token = token.substring(0, endSemi);
    }
    token.trim();

    unsigned long now = millis();
    for (const auto& session : activeSessions) {
        if (session.token == token && (now - session.createdAt < SESSION_DURATION_MS)) {
            return true;
        }
    }
    return false;
}

String scanWiFiNetworks() {
    Logger::log("Scanning local Wi-Fi networks...");
    int n = WiFi.scanNetworks();
    String json = "[";
    for (int i = 0; i < n; ++i) {
        if (i > 0) json += ",";
        json += "{";
        json += "\"ssid\":\"" + WiFi.SSID(i) + "\",";
        json += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
        json += "\"encryption\":\"" + String(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "Open" : "Secured") + "\"";
        json += "}";
    }
    json += "]";
    return json;
}

bool saveWiFiCredentials(const String& ssid, const String& pass) {
    if (ssid.length() == 0) return false;

    preferences.putString("ssid", ssid);
    preferences.putString("pass", pass);
    Logger::log("Saved new Wi-Fi credentials for SSID '%s' to NVS storage.", ssid.c_str());
    return true;
}
