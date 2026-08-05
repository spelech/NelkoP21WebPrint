#ifndef PRINTER_SPP_H
#define PRINTER_SPP_H

#include "BluetoothSerial.h"

extern BluetoothSerial SerialBT;

bool connectPrinter();
bool isPrinterConnected();
void checkPrinterConnection();

#endif
