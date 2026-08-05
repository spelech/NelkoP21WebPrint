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
    btPreferences.begin("printer-config", false);
    String savedMac = btPreferences.getString("mac", "");
    if (savedMac.length() == 17) {
        sscanf(savedMac.c_str(), "%hhx:%hhx:%hhx:%hhx:%hhx:%hhx",
               &macAddress[0], &macAddress[1], &macAddress[2],
               &macAddress[3], &macAddress[4], &macAddress[5]);
        Logger::log("Loaded saved printer MAC address from NVS: %s", savedMac.c_str());
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

    String macStr = getPrinterMACString();
    Logger::log("Attempting Bluetooth connection to printer: %s", macStr.c_str());

    if (SerialBT.connect(macAddress)) {
        Logger::log("Bluetooth printer connected successfully!");
        printerConnected = true;
        return true;
    } else {
        Logger::log("Bluetooth printer connection failed.");
        printerConnected = false;
        return false;
    }
}

bool isPrinterConnected() {
    return printerConnected;
}

void checkPrinterConnection() {
    unsigned long now = millis();
    if (now - lastCheckTime >= CHECK_INTERVAL_MS) {
        lastCheckTime = now;

        bool currentStatus = SerialBT.connected();
        if (currentStatus != printerConnected) {
            printerConnected = currentStatus;
            if (printerConnected) {
                Logger::log("Bluetooth printer status change: Connected.");
            } else {
                Logger::log("Bluetooth printer status change: Disconnected! Attempting reconnect...");
                if (SerialBT.connect(macAddress)) {
                    Logger::log("Reconnected to printer successfully!");
                    printerConnected = true;
                } else {
                    Logger::log("Reconnection attempt failed. Will retry.");
                }
            }
        } else if (!printerConnected) {
            Logger::log("Printer offline. Retrying Bluetooth connection...");
            if (SerialBT.connect(macAddress)) {
                Logger::log("Reconnected to printer successfully!");
                printerConnected = true;
            } else {
                Logger::log("Reconnection attempt failed. Will retry.");
            }
        }
    }
}

String scanBluetoothDevices() {
    Logger::log("Starting Bluetooth Classic inquiry scan (5s)...");
    
    BTScanResults* scanResults = SerialBT.discover(5000);
    String json = "[";
    
    if (scanResults != nullptr) {
        int count = scanResults->getCount();
        Logger::log("Bluetooth scan finished. Discovered %d devices.", count);
        
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
    
    json += "]";
    return json;
}

bool savePrinterMAC(const String& macStr) {
    if (macStr.length() != 17) {
        Logger::log("Invalid MAC format: %s", macStr.c_str());
        return false;
    }

    uint8_t newMac[6];
    if (sscanf(macStr.c_str(), "%hhx:%hhx:%hhx:%hhx:%hhx:%hhx",
               &newMac[0], &newMac[1], &newMac[2],
               &newMac[3], &newMac[4], &newMac[5]) != 6) {
        Logger::log("Failed to parse MAC string: %s", macStr.c_str());
        return false;
    }

    for (int i = 0; i < 6; i++) {
        macAddress[i] = newMac[i];
    }

    btPreferences.begin("printer-config", false);
    btPreferences.putString("mac", macStr);
    Logger::log("Saved new printer MAC address '%s' to NVS memory.", macStr.c_str());

    if (SerialBT.connected()) {
        SerialBT.disconnect();
    }
    printerConnected = false;
    
    if (SerialBT.connect(macAddress)) {
        Logger::log("Connected to newly configured printer: %s", macStr.c_str());
        printerConnected = true;
    } else {
        Logger::log("Saved MAC, but connection attempt failed. Will auto-retry.", macStr.c_str());
    }

    return true;
}
