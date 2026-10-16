import { BulkImportItem } from '../types';

export interface ParsedCsvRow {
  rowIndex: number; // 1-based data row index
  raw: Record<string, string>;
  data: BulkImportItem;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CsvParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalUnitsToImport: number;
  categoriesFound: string[];
}

// Robust CSV Line/Field Parser handling quotes and escaped quotes
export function parseCsvText(csvText: string): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Normalize line breaks
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip the second quote
        } else {
          // End of quoted string
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(val => val.length > 0)) {
          result.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(val => val.length > 0)) {
      result.push(currentRow);
    }
  }

  return result;
}

// Normalize known column aliases to standard fields
function normalizeHeaderName(header: string): string {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['id', 'productid', 'sku', 'code', 'itemid', 'partnumber'].includes(clean)) return 'product_id';
  if (['name', 'productname', 'title', 'itemname', 'product'].includes(clean)) return 'name';
  if (['category', 'department', 'dept', 'type', 'group'].includes(clean)) return 'category';
  if (['price', 'unitprice', 'cost', 'msrp', 'retailprice', 'sellingprice'].includes(clean)) return 'price';
  if (['quantityinstock', 'stock', 'quantity', 'qty', 'units', 'instock', 'currentstock'].includes(clean)) return 'quantity_in_stock';
  if (['reorderlevel', 'reorderpoint', 'minstock', 'threshold', 'alertlevel', 'reorder'].includes(clean)) return 'reorder_level';
  if (['supplierid', 'supplier', 'vendorid', 'vendor', 'manufacturer'].includes(clean)) return 'supplier_id';
  if (['description', 'desc', 'details', 'notes', 'summary'].includes(clean)) return 'description';
  return clean;
}

export function parseAndValidateCsv(csvText: string): CsvParseResult {
  const rawRows = parseCsvText(csvText);

  if (rawRows.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      totalUnitsToImport: 0,
      categoriesFound: [],
    };
  }

  const rawHeaders = rawRows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeaderName);
  const dataRows = rawRows.slice(1);

  const categoriesSet = new Set<string>();
  let totalUnits = 0;

  const parsedRows: ParsedCsvRow[] = dataRows.map((rowCells, idx) => {
    const rawMap: Record<string, string> = {};
    const fieldMap: Record<string, string> = {};

    rawHeaders.forEach((origHeader, i) => {
      const val = rowCells[i] !== undefined ? rowCells[i].trim() : '';
      rawMap[origHeader] = val;
      const normalizedKey = normalizedHeaders[i];
      if (normalizedKey) {
        fieldMap[normalizedKey] = val;
      }
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation: Name
    const name = fieldMap['name'] || '';
    if (!name) {
      errors.push('Product name is required');
    }

    // Category
    let category = fieldMap['category'] || '';
    if (!category) {
      category = 'General';
      warnings.push('Category missing, defaulted to "General"');
    } else {
      categoriesSet.add(category);
    }

    // Price
    const rawPrice = fieldMap['price'];
    let price = 0;
    if (rawPrice === undefined || rawPrice === '') {
      errors.push('Price is required');
    } else {
      // Remove currency symbols if present
      const cleanPrice = rawPrice.replace(/[$,€£]/g, '').trim();
      const parsedPrice = parseFloat(cleanPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        errors.push(`Invalid price "${rawPrice}" (must be a positive number)`);
      } else {
        price = Math.round(parsedPrice * 100) / 100;
      }
    }

    // Stock Quantity
    const rawStock = fieldMap['quantity_in_stock'];
    let stock = 0;
    if (rawStock === undefined || rawStock === '') {
      errors.push('Stock quantity is required');
    } else {
      const parsedStock = parseInt(rawStock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        errors.push(`Invalid stock quantity "${rawStock}" (must be a non-negative integer)`);
      } else {
        stock = parsedStock;
      }
    }

    // Reorder Level
    const rawReorder = fieldMap['reorder_level'];
    let reorderLevel = 10;
    if (rawReorder !== undefined && rawReorder !== '') {
      const parsedReorder = parseInt(rawReorder, 10);
      if (isNaN(parsedReorder) || parsedReorder < 0) {
        warnings.push(`Invalid reorder level "${rawReorder}", defaulted to 10`);
      } else {
        reorderLevel = parsedReorder;
      }
    }

    // Supplier ID
    const supplierId = fieldMap['supplier_id'] || 'sup-101';

    // Description
    const description = fieldMap['description'] || `${name} (${category})`;

    // Product ID (optional)
    const productId = fieldMap['product_id'] || undefined;

    const isValid = errors.length === 0;
    if (isValid) {
      totalUnits += stock;
    }

    return {
      rowIndex: idx + 1,
      raw: rawMap,
      data: {
        product_id: productId,
        name,
        category,
        price,
        quantity_in_stock: stock,
        reorder_level: reorderLevel,
        supplier_id: supplierId,
        description,
      },
      isValid,
      errors,
      warnings,
    };
  });

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return {
    headers: rawHeaders,
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    invalidCount,
    totalUnitsToImport: totalUnits,
    categoriesFound: Array.from(categoriesSet),
  };
}

// Sample CSV Template Generator
export const SAMPLE_CSV_CONTENT = `name,category,price,quantity_in_stock,reorder_level,supplier_id,description
"Ultra-Wide 34\\" Curved Monitor",Electronics,499.99,45,15,sup-101,"High refresh rate 144Hz curved gaming and productivity monitor"
"Wireless Mechanical Keyboard",Electronics,129.50,110,25,sup-101,"Hot-swappable RGB mechanical keyboard with brown switches"
"Standing Desk Converter",Furniture,189.00,30,10,sup-103,"Adjustable height pneumatic standing desk riser"
"Organic Colombian Roast Coffee 1kg",Groceries,24.99,250,50,sup-102,"Fair-trade whole bean dark roast coffee"
"Stainless Steel Insulated Bottle 1L",Home Goods,34.95,85,20,sup-102,"Double-walled vacuum insulated flask keeping drinks cold for 24h"
"Noise Cancelling Microphone",Electronics,79.99,60,15,sup-101,"Studio cardioid USB condenser mic with pop filter"
"Smart LED Desk Lamp",Home Goods,45.00,90,20,sup-102,"Touch control dimmable desk lamp with wireless phone charger"
"Bamboo Desk Organizer Set",Furniture,28.50,140,30,sup-103,"Eco-friendly modular drawer and pen holder set"`;

export function downloadSampleCsvTemplate(filename = 'inventory_import_template.csv') {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
