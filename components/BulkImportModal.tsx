import React, { useState, useRef, useCallback } from 'react';
import {
  parseAndValidateCsv,
  CsvParseResult,
  downloadSampleCsvTemplate,
  SAMPLE_CSV_CONTENT,
} from '../utils/csvParser';
import { bulkImportProducts } from '../services/api';
import { BulkImportResult } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: BulkImportResult) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // Import options
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [stockMode, setStockMode] = useState<'replace' | 'add'>('replace');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCsvText = (text: string) => {
    setCsvRawText(text);
    const parsed = parseAndValidateCsv(text);
    setParseResult(parsed);
    setImportResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvText(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv') && !droppedFile.type.includes('csv') && !droppedFile.type.includes('text')) {
        alert('Please drop a valid .csv file.');
        return;
      }
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvText(text);
      };
      reader.readAsText(droppedFile);
    }
  };

  const handleLoadDemo = () => {
    setFile(new File([SAMPLE_CSV_CONTENT], 'sample_inventory.csv', { type: 'text/csv' }));
    processCsvText(SAMPLE_CSV_CONTENT);
  };

  const handleReset = () => {
    setFile(null);
    setCsvRawText('');
    setParseResult(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.validCount === 0) return;

    setIsProcessing(true);
    try {
      const validItems = parseResult.rows.filter(r => r.isValid).map(r => r.data);
      const res = await bulkImportProducts(validItems, {
        updateExisting,
        stockMode,
      });
      setImportResult(res);
      onImportSuccess(res);
    } catch (err) {
      console.error('Bulk import failed', err);
      alert('An error occurred during import. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Filter preview rows
  const filteredRows = parseResult?.rows.filter(r => {
    if (previewFilter === 'valid') return r.isValid;
    if (previewFilter === 'errors') return !r.isValid;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Bulk Upload Products via CSV
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Import large inventories directly with automatic validation and duplicate detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSampleCsvTemplate()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-2xs"
              title="Download standard template with sample headers"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Import Result Banner (if completed) */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">Bulk Import Completed Successfully!</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                    <div className="bg-white/80 dark:bg-emerald-900/40 p-2 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 block">Total Processed</span>
                      <span className="font-bold font-mono text-sm">{importResult.totalProcessed}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-emerald-900/40 p-2 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 block">New Products Created</span>
                      <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-300">+{importResult.createdCount}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-emerald-900/40 p-2 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 block">Existing Updated</span>
                      <span className="font-bold font-mono text-sm text-blue-600 dark:text-blue-300">{importResult.updatedCount}</span>
                    </div>
                    <div className="bg-white/80 dark:bg-emerald-900/40 p-2 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 block">Stock Units Added</span>
                      <span className="font-bold font-mono text-sm font-mono">{importResult.totalUnitsAdded.toLocaleString()}</span>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 text-xs text-red-600 dark:text-red-300">
                      <strong>Warnings/Skipped:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* If no file or text parsed yet: show upload dropzone and format guidance */}
          {!parseResult ? (
            <div className="space-y-6">
              {/* Method Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'upload'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'paste'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Paste CSV Text
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Click to upload or drag & drop CSV file
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                      Supports comma-separated files (.csv) up to 10,000 rows.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadDemo();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 rounded-lg transition"
                      >
                        ⚡ Load Demo CSV (8 Sample Products)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-medium text-gray-700 dark:text-gray-300">
                      Paste Raw CSV (with header row):
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadDemo}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Paste Demo Sample
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder={`name,category,price,quantity_in_stock,reorder_level,supplier_id\n"Product A",Electronics,99.99,100,20,sup-101\n"Product B",Groceries,12.50,500,50,sup-102`}
                    className="w-full p-3 font-mono text-xs border rounded-xl dark:bg-gray-900 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!csvRawText.trim()}
                      onClick={() => processCsvText(csvRawText)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition"
                    >
                      Parse & Preview CSV
                    </button>
                  </div>
                </div>
              )}

              {/* Supported Columns Guide */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Expected Column Headers
                  </span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    Auto-mapped
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">name *</span>
                    <span className="text-gray-500 text-[11px]">Product name (required)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">category *</span>
                    <span className="text-gray-500 text-[11px]">e.g. Electronics, Furniture</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">price *</span>
                    <span className="text-gray-500 text-[11px]">e.g. 19.99 (positive number)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">quantity_in_stock *</span>
                    <span className="text-gray-500 text-[11px]">or 'stock', 'qty' (units)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 block">reorder_level</span>
                    <span className="text-gray-500 text-[11px]">Low-stock threshold (def. 10)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 block">supplier_id</span>
                    <span className="text-gray-500 text-[11px]">e.g. sup-101, sup-102</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 block">product_id</span>
                    <span className="text-gray-500 text-[11px]">Optional (auto-generated)</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 block">description</span>
                    <span className="text-gray-500 text-[11px]">Item details or specs</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Parsed File Preview and Validation Stage */
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Rows Detected</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                    {parseResult.totalRows}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Ready to Import</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                    {parseResult.validCount} valid
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-xs text-amber-600 dark:text-amber-400">Invalid / Skipped</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                    {parseResult.invalidCount} issues
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">Total Units to Stock</div>
                  <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                    {parseResult.totalUnitsToImport.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Import Settings & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Update existing products if ID or name matches
                    </span>
                  </label>

                  {updateExisting && (
                    <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-4">
                      <span className="text-gray-500">Stock update mode:</span>
                      <select
                        value={stockMode}
                        onChange={(e) => setStockMode(e.target.value as 'replace' | 'add')}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 font-medium"
                      >
                        <option value="replace">Set stock to CSV value</option>
                        <option value="add">Add CSV value to existing stock</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Filter table rows */}
                <div className="flex items-center gap-1 bg-white dark:bg-gray-700 p-0.5 rounded-lg border border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      previewFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    All ({parseResult.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                    }`}
                  >
                    Valid ({parseResult.validCount})
                  </button>
                  {parseResult.invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('errors')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        previewFilter === 'errors'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                      }`}
                    >
                      Issues ({parseResult.invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-80 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-[11px] uppercase bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">Row</th>
                        <th className="px-3 py-2.5 w-20">Status</th>
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5 text-right">Price</th>
                        <th className="px-3 py-2.5 text-right">Stock</th>
                        <th className="px-3 py-2.5 text-right">Reorder Level</th>
                        <th className="px-3 py-2.5">Supplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`${
                            row.isValid
                              ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                              : 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                          }`}
                        >
                          <td className="px-3 py-2 text-center text-gray-400">
                            #{row.rowIndex}
                          </td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                ✓ Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/60 px-2 py-0.5 rounded-full" title={row.errors.join('; ')}>
                                ✕ Error
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-sans font-medium text-gray-900 dark:text-white">
                            <div>{row.data.name || <span className="text-red-500 italic">Missing name</span>}</div>
                            {row.errors.length > 0 && (
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-sans mt-0.5">
                                {row.errors.join(', ')}
                              </div>
                            )}
                            {row.warnings.length > 0 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                                {row.warnings.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 font-sans text-gray-600 dark:text-gray-300">
                            {row.data.category}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-800 dark:text-gray-200">
                            ${row.data.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {row.data.quantity_in_stock.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-500">
                            {row.data.reorder_level}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-500">
                            {row.data.supplier_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom reset / switch file button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Choose another CSV file
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {file?.name && <span>File: <strong className="text-gray-800 dark:text-gray-200">{file.name}</strong></span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {parseResult ? (
              <span>
                {parseResult.validCount} products will be imported into Bigtable simulation.
              </span>
            ) : (
              <span>Supported formats: .csv, comma-delimited text</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {parseResult && (
              <button
                type="button"
                disabled={parseResult.validCount === 0 || isProcessing}
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Importing {parseResult.validCount} Items...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import {parseResult.validCount} Products Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkImportModal;
