#ifndef TSPL_GENERATOR_H
#define TSPL_GENERATOR_H

#include <Arduino.h>

struct SimpleLabelRequest {
    float widthMm = 14.0;
    float heightMm = 40.0;
    float gapMm = 5.0;
    int density = 3;
    int copies = 1;
    String mainText = "";
    String subtitle = "";
    String barcodeData = "";
    String qrData = "";
    int borderThickness = 0;
};

String generateTSPLStream(const SimpleLabelRequest& req);

#endif
