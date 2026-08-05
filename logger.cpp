#include "logger.h"
#include <stdarg.h>

std::vector<WiFiClient> Logger::logClients;

void Logger::init() {
    Serial.begin(115200);
    delay(10);
    log("Logger initialized.");
}

void Logger::log(const char* format, ...) {
    char loc_buf[256];
    char* temp = loc_buf;
    va_list arg;
    va_list copy;
    va_start(arg, format);
    va_copy(copy, arg);
    int len = vsnprintf(temp, sizeof(loc_buf), format, copy);
    va_end(copy);
    if (len < 0) {
        va_end(arg);
        return;
    }
    if (len >= (int)sizeof(loc_buf)) {
        temp = (char*)malloc(len + 1);
        if (temp == NULL) {
            va_end(arg);
            return;
        }
        vsnprintf(temp, len + 1, format, arg);
    }
    va_end(arg);

    // Print to hardware Serial
    Serial.println(temp);

    // Prepare SSE data packet
    String ssePacket = "data: ";
    ssePacket += temp;
    ssePacket += "\n\n";

    // Broadcast to SSE log clients
    for (auto it = logClients.begin(); it != logClients.end(); ) {
        if (it->connected()) {
            it->print(ssePacket);
            it->flush();
            ++it;
        } else {
            it->stop();
            it = logClients.erase(it);
        }
    }

    if (temp != loc_buf) {
        free(temp);
    }
}

void Logger::addLogClient(WiFiClient client) {
    // Send standard SSE handshake headers
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/event-stream");
    client.println("Cache-Control: no-cache");
    client.println("Connection: keep-alive");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.flush();

    logClients.push_back(client);
    log("Added new diagnostic web log client. Total clients: %d", (int)logClients.size());
}

void Logger::handleClients() {
    // Clean up disconnected clients in main loop
    for (auto it = logClients.begin(); it != logClients.end(); ) {
        if (!it->connected()) {
            it->stop();
            it = logClients.erase(it);
            log("Removed disconnected web log client. Remaining: %d", (int)logClients.size());
        } else {
            ++it;
        }
    }
}

int Logger::getClientCount() {
    return (int)logClients.size();
}
