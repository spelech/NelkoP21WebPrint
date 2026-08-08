import { LabelPreset } from '../types';

// Presets oriented in Landscape view (Width x Height) for optimal readable workspace
export const PRESETS: LabelPreset[] = [
  { name: '40 x 14 mm (Standard Gap)', width: 40, height: 14, gap: 5 },
  { name: '40 x 12 mm White Gap', width: 40, height: 12, gap: 5 },
  { name: '30 x 20 mm Small', width: 30, height: 20, gap: 5 },
  { name: '30 x 15 mm Micro', width: 30, height: 15, gap: 5 },
  { name: '30 x 12 mm Compact', width: 30, height: 12, gap: 5 },
  { name: '30 x 30 mm Square', width: 30, height: 30, gap: 5 },
  { name: '22 x 12 mm Mini', width: 22, height: 12, gap: 5 },
  { name: '50 x 15 mm Cable Flag Wrap', width: 50, height: 15, gap: 5 },
  { name: '60 x 12 mm Continuous Roll', width: 60, height: 12, gap: 0 },
];
