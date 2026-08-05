#include <WiFi.h>
#include <ESPmDNS.h>
#include "config.h"
#include "logger.h"
#include "printer_spp.h"
#include "web_server.h"
#include "wifi_manager.h"

WiFiServer printServer(TCP_PRINT_PORT);
WiFiClient printClient;

unsigned long lastBlinkTime = 0;
bool ledState = false;

void updateStatusLed() {
    unsigned long now = millis();
    
    // Status Logic:
    // 1. SoftAP Hotspot Active: Fast Blink (100ms)
    // 2. WiFi connected, but Bluetooth searching: Slow Blink (500ms)
    // 3. Fully Connected & Ready: Solid ON
    if (isSoftAP()) {
        if (now - lastBlinkTime >= 100) {
            lastBlinkTime = now;
            ledState = !ledState;
            digitalWrite(STATUS_LED_PIN, ledState ? HIGH : LOW);
        }
    } else if (!isPrinterConnected()) {
        if (now - lastBlinkTime >= 500) {
            lastBlinkTime = now;
            ledState = !ledState;
            digitalWrite(STATUS_LED_PIN, ledState ? HIGH : LOW);
        }
    } else {
        // Both connected: Solid ON
        digitalWrite(STATUS_LED_PIN, HIGH);
    }
}

void setup() {
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);

    // Initialize Logger
    Logger::init();
    Logger::log("System booting up...");

    // Initialize Wi-Fi Manager (Connects to saved Wi-Fi or starts SoftAP Hotspot)
    initWiFiManager();

    // Start mDNS responder (Works both in Station and SoftAP mode)
    if (MDNS.begin(MDNS_HOSTNAME)) {
        MDNS.addService("http", "tcp", 80);
        Logger::log("mDNS responder active: http://%s.local", MDNS_HOSTNAME);
    }

    // Connect Bluetooth Printer
    connectPrinter();

    // Start TCP print server (JetDirect port 9100)
    printServer.begin();
    Logger::log("TCP Print Port listener active on port %d.", TCP_PRINT_PORT);

    // Start Web Server & Log Server
    initWebServer();

    Logger::log("ESP32 Print Bridge & Standalone Designer is ready.");
}

void loop() {
    // 1. Maintain LED Status
    updateStatusLed();

    // 2. Process Wi-Fi Manager & Captive Portal DNS
    handleWiFiManager();

    // 3. Handle HTTP Requests & Live SSE Log Clients
    handleWebServer();
    Logger::handleClients();

    // 4. Maintain Bluetooth Link (Auto-Reconnect)
    checkPrinterConnection();

    // 5. Handle TCP Print Server Connections (Port 9100)
    if (!printClient) {
        printClient = printServer.available();
        if (printClient) {
            Logger::log("Incoming Wi-Fi TCP print client connected from %s", 
                        printClient.remoteIP().toString().c_str());
        }
    }

    if (printClient) {
        if (printClient.connected()) {
            if (printClient.available()) {
                // Read chunks of data and forward to printer
                uint8_t buffer[256];
                int bytesRead = printClient.read(buffer, sizeof(buffer));
                if (bytesRead > 0) {
                    if (isPrinterConnected()) {
                        SerialBT.write(buffer, bytesRead);
                        delay(10);
                        Logger::log("Forwarded %d bytes of print data to printer.", bytesRead);
                    } else {
                        Logger::log("WARNING: Received %d print bytes, but printer is offline!", bytesRead);
                    }
                }
            }
        } else {
            printClient.stop();
            Logger::log("Wi-Fi TCP print client disconnected.");
        }
    }
}
