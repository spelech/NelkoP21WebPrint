#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <WebServer.h>

extern WebServer webServer;

void initWebServer();
void handleWebServer();

String getStoredTemplateJSON();
bool saveStoredTemplateJSON(const String& json);
void clearStoredTemplateJSON();

#endif
