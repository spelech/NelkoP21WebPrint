#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <vector>

class Logger {
public:
    static void init();
    static void log(const char* format, ...);
    static void addLogClient(WiFiClient client);
    static void handleClients();
    static int getClientCount();
private:
    static std::vector<WiFiClient> logClients;
};

#endif
