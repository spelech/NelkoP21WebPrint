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

#endif
