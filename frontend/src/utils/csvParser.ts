import { LabelElement } from '../types';

export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export const parseCSV = (text: string): CSVData => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const cleanLines = lines.map(line => line.trim()).filter(line => line.length > 0);
  if (cleanLines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(cleanLines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < cleanLines.length; i++) {
    const values = parseLine(cleanLines[i]);
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, index) => {
        row[h] = values[index] || '';
      });
      rows.push(row);
    }
  }
  return { headers, rows };
};

export const getTemplateVariables = (elements: LabelElement[]): string[] => {
  const vars = new Set<string>();
  elements.forEach(el => {
    if (el.type === 'text' || el.type === 'qr') {
      const matches = (el.content || '').match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(m => {
          vars.add(m.slice(2, -2).trim());
        });
      }
    }
  });
  return Array.from(vars);
};
