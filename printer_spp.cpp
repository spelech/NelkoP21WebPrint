#include "printer_spp.h"
#include "config.h"
#include "logger.h"

BluetoothSerial SerialBT;

static uint8_t macAddress[6] = PRINTER_MAC;
static unsigned long lastCheckTime = 0;
static const unsigned long CHECK_INTERVAL_MS = 10000; // Check/reconnect every 10 seconds
static bool printerConnected = false;

bool connectPrinter() {
    Logger::log("Initializing Bluetooth Classic SPP master...");
    
    // Begin Bluetooth in master mode
    if (!SerialBT.begin("ESP32_Print_Bridge", true)) {
        Logger::log("Failed to start Bluetooth Serial.");
        return false;
    }
    
    char macStr[18];
    sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", 
            macAddress[0], macAddress[1], macAddress[2], 
            macAddress[3], macAddress[4], macAddress[5]);
            
    Logger::log("Attempting Bluetooth connection to printer: %s", macStr);
    
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
            // Keep trying reconnect if still disconnected
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
