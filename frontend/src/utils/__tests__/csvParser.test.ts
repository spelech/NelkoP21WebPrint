import { describe, it, expect } from 'vitest';
import { parseCSV, getTemplateVariables } from '../csvParser';
import { LabelElement } from '../../types';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('parses standard comma-separated lines correctly', () => {
      const csvContent = 'name,age,city\nAlice,30,New York\nBob,25,San Francisco';
      const result = parseCSV(csvContent);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toEqual([
        { name: 'Alice', age: '30', city: 'New York' },
        { name: 'Bob', age: '25', city: 'San Francisco' }
      ]);
    });

    it('handles quoted values with embedded commas and whitespace', () => {
      const csvContent = 'sku,description,price\nSKU-001,"Widget, Large",19.99\nSKU-002,\'Gadget, Small\',9.99';
      const result = parseCSV(csvContent);

      expect(result.headers).toEqual(['sku', 'description', 'price']);
      expect(result.rows).toEqual([
        { sku: 'SKU-001', description: 'Widget, Large', price: '19.99' },
        { sku: 'SKU-002', description: 'Gadget, Small', price: '9.99' }
      ]);
    });

    it('returns empty headers and rows for empty or whitespace-only input', () => {
      expect(parseCSV('')).toEqual({ headers: [], rows: [] });
      expect(parseCSV('   \n  \r\n   ')).toEqual({ headers: [], rows: [] });
    });

    it('ignores rows with fewer fields than headers', () => {
      const csvContent = 'col1,col2,col3\nval1,val2\nval1,val2,val3';
      const result = parseCSV(csvContent);

      expect(result.headers).toEqual(['col1', 'col2', 'col3']);
      expect(result.rows).toEqual([
        { col1: 'val1', col2: 'val2', col3: 'val3' }
      ]);
    });
  });

  describe('getTemplateVariables', () => {
    it('detects {{variable_name}} patterns in text and QR elements', () => {
      const elements: LabelElement[] = [
        {
          id: 1,
          type: 'text',
          x: 10,
          y: 10,
          content: 'Item: {{item_name}} - Price: {{price}}',
          fontSize: 12
        },
        {
          id: 2,
          type: 'qr',
          x: 10,
          y: 50,
          content: 'https://example.com/qr/{{item_name}}?batch={{batch_id}}'
        },
        {
          id: 3,
          type: 'barcode',
          x: 10,
          y: 100,
          content: '{{ignored_barcode_var}}'
        },
        {
          id: 4,
          type: 'line',
          x: 0,
          y: 0
        }
      ];

      const variables = getTemplateVariables(elements);
      expect(variables).toEqual(['item_name', 'price', 'batch_id']);
    });

    it('returns empty array when elements contain no mustache variables', () => {
      const elements: LabelElement[] = [
        {
          id: 1,
          type: 'text',
          x: 10,
          y: 10,
          content: 'Static label text',
          fontSize: 12
        }
      ];

      expect(getTemplateVariables(elements)).toEqual([]);
    });

    it('returns empty array when given no elements', () => {
      expect(getTemplateVariables([])).toEqual([]);
    });
  });
});
