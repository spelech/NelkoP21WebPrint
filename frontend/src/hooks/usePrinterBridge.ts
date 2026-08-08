import { useState, Dispatch, SetStateAction } from 'react';
import QRCode from 'qrcode';
import { browserBtDriver } from '../utils/webBluetoothDriver';
import { convertCanvasToTsplBytes } from '../utils/tsplGenerator';
import { 
  buildOffscreenCanvas as buildOffscreenCanvasUtil, 
  buildOffscreenCanvasForJob as buildOffscreenCanvasForJobUtil 
} from '../utils/canvasRenderer';
import { LabelPreset, LabelElement, PrintStatus, BatchJob } from '../types';
import { QrCacheItem } from '../components/CanvasWorkspace';

export interface UsePrinterBridgeParams {
  elements: LabelElement[];
  activeWidthMm: number;
  activeHeightMm: number;
  selectedPreset: LabelPreset;
  qrCache: Record<string, QrCacheItem>;
  selectedTemplateId: number | string | null;
  setShowWizardModal?: Dispatch<SetStateAction<boolean>>;
}

export interface UsePrinterBridgeReturn {
  density: number;
  setDensity: Dispatch<SetStateAction<number>>;
  copies: number;
  setCopies: Dispatch<SetStateAction<number>>;
  invertColors: boolean;
  setInvertColors: Dispatch<SetStateAction<boolean>>;
  ditherMethod: string;
  isPrinting: boolean;
  setIsPrinting: Dispatch<SetStateAction<boolean>>;
  printStatus: PrintStatus | null;
  setPrintStatus: Dispatch<SetStateAction<PrintStatus | null>>;
  previewUrl: string | null;
  setPreviewUrl: Dispatch<SetStateAction<string | null>>;
  showPreview: boolean;
  setShowPreview: Dispatch<SetStateAction<boolean>>;
  useBrowserBt: boolean;
  setUseBrowserBt: Dispatch<SetStateAction<boolean>>;
  browserBtConnected: boolean;
  browserBtDeviceName: string;
  browserBtConnecting: boolean;
  handleConnectBrowserBt: () => Promise<void>;
  handleDisconnectBrowserBt: () => Promise<void>;
  handlePrint: () => Promise<void>;
  renderCanvasToTsplBytes: () => Uint8Array;
  handleGeneratePreview: () => Promise<void>;
  handleExecuteBatchPrint: (jobs: BatchJob[]) => Promise<void>;
  handlePrintBatchDirect: (jobs: BatchJob[]) => Promise<void>;
}

export function usePrinterBridge({
  elements,
  activeWidthMm,
  activeHeightMm,
  selectedPreset,
  qrCache,
  selectedTemplateId,
  setShowWizardModal
}: UsePrinterBridgeParams): UsePrinterBridgeReturn {
  // Print & Driver State
  const [useBrowserBt, setUseBrowserBt] = useState<boolean>(true);
  const [browserBtConnected, setBrowserBtConnected] = useState<boolean>(false);
  const [browserBtDeviceName, setBrowserBtDeviceName] = useState<string>('');
  const [browserBtConnecting, setBrowserBtConnecting] = useState<boolean>(false);

  const [density, setDensity] = useState<number>(3);
  const [copies, setCopies] = useState<number>(1);
  const [ditherMethod] = useState<string>('threshold');
  const [invertColors, setInvertColors] = useState<boolean>(false);

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<PrintStatus | null>(null);

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Connect Browser Bluetooth
  const handleConnectBrowserBt = async (): Promise<void> => {
    setPrintStatus(null);
    setBrowserBtConnecting(true);
    try {
      const res = await browserBtDriver.requestConnection();
      if (res.success) {
        setBrowserBtConnected(true);
        setBrowserBtDeviceName(res.name);
        setPrintStatus({ type: 'success', msg: `Connected to ${res.name} via browser Bluetooth!` });
        setShowWizardModal?.(false);
      } else {
        setBrowserBtConnected(false);
        setPrintStatus({ type: 'error', msg: res.error || 'Failed to connect via browser Bluetooth' });
      }
    } finally {
      setBrowserBtConnecting(false);
    }
  };

  const handleDisconnectBrowserBt = async (): Promise<void> => {
    await browserBtDriver.disconnect();
    setBrowserBtConnected(false);
    setBrowserBtDeviceName('');
    setPrintStatus({ type: 'success', msg: 'Disconnected from Bluetooth device.' });
  };

  // Render HTML5 Canvas to 1-Bit TSPL payload
  const renderCanvasToTsplBytes = (): Uint8Array => {
    const canvas = buildOffscreenCanvasUtil(elements, activeWidthMm, activeHeightMm, qrCache);
    return convertCanvasToTsplBytes(
      canvas, 
      activeWidthMm, 
      activeHeightMm, 
      selectedPreset.gap, 
      density, 
      copies, 
      ditherMethod, 
      invertColors
    );
  };

  // Direct Bluetooth Sequential Batch Printer
  const handlePrintBatchDirect = async (jobs: BatchJob[]): Promise<void> => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const jobElements = elements.map(el => {
          let content = ('content' in el && el.content) ? el.content : '';
          if (el.type === 'text' || el.type === 'qr') {
            Object.entries(job.variables).forEach(([k, v]) => {
              content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
            });
          }
          return { ...el, content } as LabelElement;
        });

        for (let j = 0; j < jobElements.length; j++) {
          const el = jobElements[j];
          if (el.type === 'qr') {
            const dataUrl = await QRCode.toDataURL(el.content, { margin: 1 });
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = dataUrl;
            });
            el.imgObject = img;
          }
        }

        const canvas = buildOffscreenCanvasForJobUtil(jobElements, activeWidthMm, activeHeightMm, qrCache);
        const payloadBytes = convertCanvasToTsplBytes(
          canvas, 
          activeWidthMm, 
          activeHeightMm, 
          selectedPreset.gap, 
          density, 
          job.copies, 
          ditherMethod, 
          invertColors
        );
        
        const success = await browserBtDriver.sendBytes(payloadBytes);
        if (!success) {
          throw new Error(`Failed to send job #${i + 1} in batch`);
        }
        setPrintStatus({ type: 'success', msg: `Printed label #${i + 1}/${jobs.length} in batch...` });
        await new Promise(r => setTimeout(r, 200));
      }
      setPrintStatus({ type: 'success', msg: `Successfully printed all ${jobs.length} labels in batch!` });
    } catch (err: any) {
      setPrintStatus({ type: 'error', msg: `Batch Print Error: ${err?.message || err}` });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExecuteBatchPrint = async (jobs: BatchJob[]): Promise<void> => {
    if (useBrowserBt) {
      await handlePrintBatchDirect(jobs);
    } else {
      setIsPrinting(true);
      setPrintStatus(null);
      try {
        const res = await fetch('/api/print/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: selectedTemplateId || 'custom_batch_temp',
            jobs: jobs,
            density: density,
            dither_method: ditherMethod
          })
        });
        const data = await res.json();
        if (res.ok) {
          setPrintStatus({ type: 'success', msg: `Batch of ${jobs.length} labels printed successfully via bridge!` });
        } else {
          setPrintStatus({ type: 'error', msg: data.detail || 'Batch print failed' });
        }
      } catch (err: any) {
        setPrintStatus({ type: 'error', msg: `Bridge Batch Error: ${err?.message || err}` });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  // Generate Preview from API
  const handleGeneratePreview = async (): Promise<void> => {
    setShowPreview(true);
    setPreviewUrl(null);
    try {
      const canvas = buildOffscreenCanvasUtil(elements, activeWidthMm, activeHeightMm, qrCache);
      const res = await fetch('/api/preview/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: canvas.toDataURL('image/png'),
          width_mm: activeWidthMm,
          height_mm: activeHeightMm,
          gap_mm: selectedPreset.gap,
          dither_method: ditherMethod
        })
      });
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Print Job
  const handlePrint = async (): Promise<void> => {
    setIsPrinting(true);
    setPrintStatus(null);

    if (useBrowserBt) {
      try {
        const payloadBytes = renderCanvasToTsplBytes();
        const success = await browserBtDriver.sendBytes(payloadBytes);
        if (success) {
          setPrintStatus({ type: 'success', msg: `Direct Browser BT: Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: 'Browser Bluetooth stream failed or device disconnected' });
        }
      } catch (err: any) {
        setPrintStatus({ type: 'error', msg: `Direct Print Error: ${err?.message || err}` });
      } finally {
        setIsPrinting(false);
      }
    } else {
      try {
        const canvas = buildOffscreenCanvasUtil(elements, activeWidthMm, activeHeightMm, qrCache);
        const res = await fetch('/api/print/canvas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: canvas.toDataURL('image/png'),
            width_mm: activeWidthMm,
            height_mm: activeHeightMm,
            gap_mm: selectedPreset.gap,
            density: density,
            copies: copies,
            dither_method: ditherMethod
          })
        });
        const data = await res.json();
        if (res.ok) {
          setPrintStatus({ type: 'success', msg: `Server Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: data.detail || 'Print failed' });
        }
      } catch (err: any) {
        setPrintStatus({ type: 'error', msg: `Network Error: ${err?.message || err}` });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  return {
    density,
    setDensity,
    copies,
    setCopies,
    invertColors,
    setInvertColors,
    ditherMethod,
    isPrinting,
    setIsPrinting,
    printStatus,
    setPrintStatus,
    previewUrl,
    setPreviewUrl,
    showPreview,
    setShowPreview,
    useBrowserBt,
    setUseBrowserBt,
    browserBtConnected,
    browserBtDeviceName,
    browserBtConnecting,
    handleConnectBrowserBt,
    handleDisconnectBrowserBt,
    handlePrint,
    renderCanvasToTsplBytes,
    handleGeneratePreview,
    handleExecuteBatchPrint,
    handlePrintBatchDirect,
  };
}
