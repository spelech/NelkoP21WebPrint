#include <WiFi.h>
#include <ESPmDNS.h>
#include "config.h"
#include "logger.h"
#include "printer_spp.h"
#include "web_server.h"

WiFiServer printServer(TCP_PRINT_PORT);
WiFiClient printClient;

unsigned long lastBlinkTime = 0;
bool ledState = false;

void updateStatusLed() {
    unsigned long now = millis();
    
    // Status Logic:
    // 1. WiFi not connected: Fast Blink (100ms)
    // 2. WiFi connected, but Bluetooth not: Slow Blink (500ms)
    // 3. Both connected: Solid ON
    if (WiFi.status() != WL_CONNECTED) {
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

    // Connect WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Logger::log("Connecting to WiFi SSID: %s", WIFI_SSID);
    
    // Non-blocking indicator loop during WiFi initiation
    while (WiFi.status() != WL_CONNECTED) {
        updateStatusLed();
        delay(10);
    }
    
    Logger::log("WiFi Connected successfully!");
    Logger::log("IP Address: %s", WiFi.localIP().toString().c_str());

    // Start mDNS responder
    if (MDNS.begin(MDNS_HOSTNAME)) {
        Logger::log("mDNS responder started: http://%s.local", MDNS_HOSTNAME);
    }

    // Connect Bluetooth Printer
    connectPrinter();

    // Start TCP print server
    printServer.begin();
    Logger::log("TCP Print Port listener started on port %d.", TCP_PRINT_PORT);

    // Start Web Server & Log Server
    initWebServer();

    Logger::log("ESP32 Print Bridge is active and listening.");
}

void loop() {
    // 1. Maintain LED Status
    updateStatusLed();

    // 2. Handle HTTP and Log Clients
    handleWebServer();
    Logger::handleClients();

    // 3. Maintain Bluetooth Link (Auto-Reconnect)
    checkPrinterConnection();

    // 4. Handle TCP Print Server Connections (JetDirect Port 9100)
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
