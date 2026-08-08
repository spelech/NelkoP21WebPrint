export interface LabelPreset {
  name: string;
  width: number;
  height: number;
  gap: number;
}

export type ElementType = 'text' | 'barcode' | 'qr' | 'line' | 'rectangle' | 'image';

export interface BaseElement {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontStyle?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  content: string;
  barcodeType?: string;
}

export interface QRElement extends BaseElement {
  type: 'qr';
  content: string;
  size?: number;
  qrHelperType?: string;
  qrHelperFields?: Record<string, string>;
  imgObject?: HTMLImageElement;
}

export interface LineElement extends BaseElement {
  type: 'line';
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  thickness?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  iconName?: string;
  imgObject?: HTMLImageElement;
}

export type LabelElement =
  | TextElement
  | BarcodeElement
  | QRElement
  | LineElement
  | RectangleElement
  | ImageElement;

export interface PrintStatus {
  type: 'success' | 'error';
  msg: string;
}

export interface BatchJob {
  variables: Record<string, string>;
  copies: number;
}
