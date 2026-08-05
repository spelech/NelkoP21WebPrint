#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <vector>

struct Session {
    String token;
    unsigned long createdAt;
};

void initWiFiManager();
void handleWiFiManager();

bool isSoftAP();
bool isSessionValid(const String& cookieHeader);
String createSession();
bool validatePIN(const String& pin);

String scanWiFiNetworks();
bool saveWiFiCredentials(const String& ssid, const String& pass);

#endif
