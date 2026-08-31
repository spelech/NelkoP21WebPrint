import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { browserBtDriver } from '../utils/webBluetoothDriver';
import { convertCanvasToTsplBytes } from '../utils/tsplGenerator';
import { 
  buildOffscreenCanvas as buildOffscreenCanvasUtil, 
  buildOffscreenCanvasForJob as buildOffscreenCanvasForJobUtil,
  prepareElementAssets
} from '../utils/canvasRenderer';
import { LabelPreset, LabelElement, PrintStatus, BatchJob } from '../types';
import { QrCacheItem } from '../components/CanvasWorkspace';

export function isMobileClient(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isCoarsePointer = typeof window.matchMedia === 'function' && Boolean(window.matchMedia('(pointer: coarse)')?.matches);
  return isMobileUserAgent || isCoarsePointer;
}

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
  isMobile: boolean;
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
  const isMobile = isMobileClient();

  // Print & Driver State
  const [useBrowserBt, setUseBrowserBt] = useState<boolean>(() => {
    if (!isMobile) return false;
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('nelko_use_browser_bt');
    return saved !== null ? saved === 'true' : true;
  });
  const [browserBtConnected, setBrowserBtConnected] = useState<boolean>(false);
  const [browserBtDeviceName, setBrowserBtDeviceName] = useState<string>('');
  const [browserBtConnecting, setBrowserBtConnecting] = useState<boolean>(false);

  const [density, setDensity] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    const saved = localStorage.getItem('nelko_print_density');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 15) return parsed;
    }
    return 3;
  });

  const [copies, setCopies] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const saved = localStorage.getItem('nelko_print_copies');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    return 1;
  });

  const [ditherMethod] = useState<string>('threshold');
  const [invertColors, setInvertColors] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('nelko_invert_colors');
    return saved === 'true';
  });

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<PrintStatus | null>(null);

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && isMobile) {
      localStorage.setItem('nelko_use_browser_bt', String(useBrowserBt));
    }
  }, [useBrowserBt, isMobile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nelko_print_density', String(density));
    }
  }, [density]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nelko_print_copies', String(copies));
    }
  }, [copies]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nelko_invert_colors', String(invertColors));
    }
  }, [invertColors]);

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
      selectedPreset?.gap ?? 5, 
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

        await prepareElementAssets(jobElements, qrCache);

        const canvas = buildOffscreenCanvasForJobUtil(jobElements, activeWidthMm, activeHeightMm, qrCache);
        const payloadBytes = convertCanvasToTsplBytes(
          canvas, 
          activeWidthMm, 
          activeHeightMm, 
          selectedPreset?.gap ?? 5, 
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
      await prepareElementAssets(elements, qrCache);
      const canvas = buildOffscreenCanvasUtil(elements, activeWidthMm, activeHeightMm, qrCache);
      const res = await fetch('/api/preview/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: canvas.toDataURL('image/png'),
          width_mm: activeWidthMm,
          height_mm: activeHeightMm,
          gap_mm: selectedPreset?.gap ?? 5,
          dither_method: ditherMethod
        })
      });
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error('Preview error:', err);
    }
  };

  // Handle Print Job
  const handlePrint = async (): Promise<void> => {
    setIsPrinting(true);
    setPrintStatus(null);

    try {
      await prepareElementAssets(elements, qrCache);
      const canvas = buildOffscreenCanvasUtil(elements, activeWidthMm, activeHeightMm, qrCache);

      if (useBrowserBt) {
        const payloadBytes = convertCanvasToTsplBytes(
          canvas, 
          activeWidthMm, 
          activeHeightMm, 
          selectedPreset?.gap ?? 5, 
          density, 
          copies, 
          ditherMethod, 
          invertColors
        );
        const success = await browserBtDriver.sendBytes(payloadBytes);
        if (success) {
          setPrintStatus({ type: 'success', msg: `Direct Browser BT: Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: 'Browser Bluetooth stream failed or device disconnected' });
        }
      } else {
        // Strip DOM node references before serializing to JSON payload
        const cleanElements = elements.map(el => {
          const { imgObject: _imgObject, ...rest } = el as any;
          return rest;
        });

        const res = await fetch('/api/print/canvas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: canvas.toDataURL('image/png'),
            width_mm: activeWidthMm,
            height_mm: activeHeightMm,
            gap_mm: selectedPreset?.gap ?? 5,
            density: density,
            copies: copies,
            dither_method: ditherMethod,
            elements: cleanElements
          })
        });
        const data = await res.json();
        if (res.ok) {
          setPrintStatus({ type: 'success', msg: `Server Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: data.detail || 'Print failed' });
        }
      }
    } catch (err: any) {
      setPrintStatus({ type: 'error', msg: `Print Error: ${err?.message || err}` });
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    isMobile,
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
