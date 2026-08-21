#ifndef CONFIG_H
#define CONFIG_H

// If config_local.h exists, it will override Wi-Fi and Bluetooth credentials.
// Create config_local.h on your PC to set your private network configurations.
#if __has_include("config_local.h")
#include "config_local.h"
#endif

// Default fallback configurations (overridden by config_local.h if defined)
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifndef WIFI_PASS
#define WIFI_PASS "YOUR_WIFI_PASSWORD"
#endif

#ifndef PRINTER_MAC
#define PRINTER_MAC {0x00, 0x11, 0x22, 0x33, 0x44, 0x55}
#endif

// General system overrides
#ifndef MDNS_HOSTNAME
#define MDNS_HOSTNAME "nelko-bridge"
#endif

#ifndef TCP_PRINT_PORT
#define TCP_PRINT_PORT 9100
#endif

#ifndef WEB_SERVER_PORT
#define WEB_SERVER_PORT 80
#endif

#ifndef STATUS_LED_PIN
#define STATUS_LED_PIN 2  // Onboard LED on ESP32-WROOM-32
#endif

#ifndef DEFAULT_PORTAL_PIN
#define DEFAULT_PORTAL_PIN "1234"
#endif

#ifndef ENABLE_PIN_AUTH
#define ENABLE_PIN_AUTH true
#endif

#ifndef APP_VERSION
#define APP_VERSION "2.0.2"
#endif

#endif
