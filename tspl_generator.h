#ifndef TSPL_GENERATOR_H
#define TSPL_GENERATOR_H

#include <Arduino.h>

struct SimpleLabelRequest {
    float widthMm = 40.0;
    float heightMm = 14.0;
    float gapMm = 2.0;
    int density = 3;
    int copies = 1;
    String mainText = "";
    String subtitle = "";
    String barcodeData = "";
    String qrData = "";
    int borderThickness = 0;
    int xOffset = 0;
    int yOffset = 0;
    int fontScaleMain = 2;
    int fontScaleSub = 1;
    int barcodeHeight = 24;
};

String generateTSPLStream(const SimpleLabelRequest& req);

#endif
