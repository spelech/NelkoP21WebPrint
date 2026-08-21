#include "printer_spp.h"
#include "config.h"
#include "logger.h"

BluetoothSerial SerialBT;

static Preferences btPreferences;
static uint8_t macAddress[6] = PRINTER_MAC;
static unsigned long lastCheckTime = 0;
static const unsigned long CHECK_INTERVAL_MS = 10000;
static bool printerConnected = false;

static void loadSavedMAC() {
    btPreferences.begin("printer-config", true);
    String savedMac = btPreferences.getString("mac", "");
    btPreferences.end();
    if (savedMac.length() == 17) {
        unsigned int b[6];
        if (sscanf(savedMac.c_str(), "%x:%x:%x:%x:%x:%x",
                   &b[0], &b[1], &b[2], &b[3], &b[4], &b[5]) == 6) {
            for (int i = 0; i < 6; i++) {
                macAddress[i] = (uint8_t)b[i];
            }
            Logger::log("Loaded saved printer MAC address from NVS: %s", savedMac.c_str());
        }
    }
}

String getPrinterMACString() {
    char macStr[18];
    sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
            macAddress[0], macAddress[1], macAddress[2],
            macAddress[3], macAddress[4], macAddress[5]);
    return String(macStr);
}

bool connectPrinter() {
    Logger::log("Initializing Bluetooth Classic SPP master...");
    loadSavedMAC();

    if (!SerialBT.begin("ESP32_Print_Bridge", true)) {
        Logger::log("Failed to start Bluetooth Serial.");
        return false;
    }

    // Don't attempt connection on boot if default placeholder MAC is set
    if (macAddress[0] == 0x00 && macAddress[1] == 0x11 && macAddress[2] == 0x22) {
        Logger::log("Default placeholder MAC configured. Awaiting printer pairing from web UI.");
        printerConnected = false;
        return false;
    }

    String macStr = getPrinterMACString();
    Logger::log("Attempting Bluetooth connection to printer: %s", macStr.c_str());

    SerialBT.disconnect();
    delay(100);

    if (SerialBT.connect(macAddress)) {
        Logger::log("Bluetooth printer connected successfully!");
        printerConnected = true;
        return true;
    } else {
        Logger::log("Bluetooth printer connection failed. Will auto-retry periodically.");
        printerConnected = false;
        return false;
    }
}

bool isPrinterConnected() {
    printerConnected = SerialBT.connected();
    return printerConnected;
}

void checkPrinterConnection() {
    unsigned long now = millis();
    if (SerialBT.connected()) {
        printerConnected = true;
        return;
    }
    
    printerConnected = false;

    // Check if placeholder MAC is set; don't auto-reconnect if unconfigured
    if (macAddress[0] == 0x00 && macAddress[1] == 0x11 && macAddress[2] == 0x22) {
        return;
    }

    // Auto-reconnect periodically every CHECK_INTERVAL_MS (10s) without spamming
    if (now - lastCheckTime >= CHECK_INTERVAL_MS) {
        lastCheckTime = now;
        Logger::log("Auto-reconnecting Bluetooth printer (%s)...", getPrinterMACString().c_str());
        SerialBT.disconnect();
        delay(100);
        if (SerialBT.connect(macAddress)) {
            Logger::log("Auto-reconnected to Bluetooth printer successfully!");
            printerConnected = true;
        } else {
            Logger::log("Auto-reconnect attempt failed. Next retry in 10s.");
        }
    }
}

String scanBluetoothDevices() {
    size_t freeHeapBefore = ESP.getFreeHeap();
    Logger::log("Starting Bluetooth Classic inquiry scan (5s)... Initial free heap: %u bytes", freeHeapBefore);

    if (freeHeapBefore < 25000) {
        Logger::log("WARNING: Heap memory too low for Bluetooth scan (%u bytes free). Aborting scan.", freeHeapBefore);
        return "[]";
    }

    // Temporarily pause active Bluetooth SPP link to maximize RAM during scan
    bool wasConnected = SerialBT.connected();
    if (wasConnected) {
        Logger::log("Temporarily pausing active Bluetooth SPP link to free ~30KB RAM for inquiry scan...");
        SerialBT.disconnect();
        printerConnected = false;
        delay(100);
    }

    BTScanResults* scanResults = SerialBT.discover(5000);
    String json = "[";

    if (scanResults != nullptr) {
        int count = scanResults->getCount();
        Logger::log("Bluetooth scan finished. Discovered %d devices. Free heap: %u bytes", count, ESP.getFreeHeap());

        for (int i = 0; i < count; i++) {
            BTAdvertisedDevice* device = scanResults->getDevice(i);
            if (i > 0) json += ",";

            String name = device->getName().c_str();
            if (name.length() == 0) {
                name = "Unknown Bluetooth Device";
            }

            String mac = device->getAddress().toString().c_str();
            int rssi = device->getRSSI();

            json += "{";
            json += "\"name\":\"" + name + "\",";
            json += "\"mac\":\"" + mac + "\",";
            json += "\"rssi\":" + String(rssi);
            json += "}";
        }
    } else {
        Logger::log("Bluetooth scan returned no results or failed.");
    }

    // Restore active Bluetooth connection if previously paired
    if (wasConnected) {
        Logger::log("Restoring active Bluetooth connection to printer...");
        if (SerialBT.connect(macAddress)) {
            printerConnected = true;
            Logger::log("Reconnected to printer successfully after scan.");
        }
    }

    json += "]";
    return json;
}

bool savePrinterMAC(const String& macStr) {
    if (macStr.length() != 17) {
        Logger::log("Invalid MAC format: %s", macStr.c_str());
        return false;
    }

    unsigned int b[6];
    if (sscanf(macStr.c_str(), "%x:%x:%x:%x:%x:%x",
               &b[0], &b[1], &b[2], &b[3], &b[4], &b[5]) != 6) {
        Logger::log("Failed to parse MAC string: %s", macStr.c_str());
        return false;
    }

    for (int i = 0; i < 6; i++) {
        macAddress[i] = (uint8_t)b[i];
    }

    btPreferences.begin("printer-config", false);
    btPreferences.putString("mac", macStr);
    btPreferences.end();
    Logger::log("Saved new printer MAC address '%s' to NVS memory.", macStr.c_str());

    SerialBT.disconnect();
    printerConnected = false;
    lastCheckTime = 0; // Trigger auto-reconnect on next loop tick asynchronously
    return true;
}
