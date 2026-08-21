#ifndef PRINTER_SPP_H
#define PRINTER_SPP_H

#include "BluetoothSerial.h"
#include <Preferences.h>

extern BluetoothSerial SerialBT;

bool connectPrinter();
bool isPrinterConnected();
void checkPrinterConnection();

String scanBluetoothDevices();
bool savePrinterMAC(const String& macStr);
String getPrinterMACString();
bool sendToPrinter(const uint8_t* data, size_t len);

#endif
