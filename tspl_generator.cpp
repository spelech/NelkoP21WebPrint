#include "tspl_generator.h"

String generateTSPLStream(const SimpleLabelRequest& req) {
    String tspl = "";
    
    // Header
    tspl += "SIZE " + String(req.widthMm, 1) + " mm, " + String(req.heightMm, 1) + " mm\r\n";
    if (req.gapMm > 0) {
        tspl += "GAP " + String(req.gapMm, 1) + " mm, 0 mm\r\n";
    } else {
        tspl += "GAP 0 mm, 0 mm\r\n";
    }
    tspl += "DIRECTION 0\r\n";
    tspl += "DENSITY " + String(req.density) + "\r\n";
    tspl += "CLS\r\n";

    // Compute pixel dimensions (203 DPI = 8 dots/mm)
    int widthDots = (int)(req.widthMm * 8.0f);
    int heightDots = (int)(req.heightMm * 8.0f);

    // Optional Border Box
    if (req.borderThickness > 0) {
        tspl += "BOX 4,4," + String(widthDots - 4) + "," + String(heightDots - 4) + "," + String(req.borderThickness) + "\r\n";
    }

    int yCursor = 24;

    // Main Text
    if (req.mainText.length() > 0) {
        // TEXT x,y,"font",rotation,x_multi,y_multi,align,"content"
        tspl += "TEXT " + String(widthDots / 2) + "," + String(yCursor) + ",\"3\",0,1,1,2,\"" + req.mainText + "\"\r\n";
        yCursor += 40;
    }

    // Subtitle
    if (req.subtitle.length() > 0) {
        tspl += "TEXT " + String(widthDots / 2) + "," + String(yCursor) + ",\"2\",0,1,1,2,\"" + req.subtitle + "\"\r\n";
        yCursor += 35;
    }

    // Barcode Code128
    if (req.barcodeData.length() > 0) {
        // BARCODE x,y,"128",height,human_readable,rotation,narrow,wide,align,"content"
        tspl += "BARCODE " + String(widthDots / 2) + "," + String(yCursor) + ",\"128\",45,1,0,2,4,2,\"" + req.barcodeData + "\"\r\n";
        yCursor += 70;
    }

    // QR Code
    if (req.qrData.length() > 0) {
        // QRCODE x,y,ecc_level,cell_width,mode,rotation,align,"content"
        tspl += "QRCODE " + String(widthDots / 2) + "," + String(yCursor) + ",H,4,A,0,2,\"" + req.qrData + "\"\r\n";
    }

    // Footer
    tspl += "PRINT " + String(req.copies) + ",1\r\n";

    return tspl;
}
