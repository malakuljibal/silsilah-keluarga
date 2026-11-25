'use client';

import React, { useState, useRef } from 'react';
import { Person } from '@/types/family';
import { downloadExcelTemplate, exportFamilyToExcel, parseExcelToMembers } from '@/utils/excelFamily';
import { Download, Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';

interface ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Person[];
  onImportSuccess: (importedMembers: Person[], mode: 'merge' | 'replace') => void;
}

export default function ExcelModal({ isOpen, onClose, members, onImportSuccess }: ExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Person[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const parsed = await parseExcelToMembers(selectedFile);
      setPreviewData(parsed);
      setStatusMessage({
        type: 'success',
        text: `Berhasil membaca ${parsed.length} data warga dari file Excel! Siap di-import.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Gagal membaca file Excel. Pastikan format kolom sesuai dengan template.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = () => {
    if (previewData.length === 0) return;
    onImportSuccess(previewData, importMode);
    setStatusMessage({
      type: 'success',
      text: `Sukses mengimpor ${previewData.length} data keluarga ke sistem!`,
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manajemen Data Excel (Ribuan Warga)</h2>
              <p className="text-xs text-slate-500">Download template, input ribuan orang sekaligus, dan export data silsilah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Section 1: Template & Export */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" /> Unduh Template Excel
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Format resmi dengan kolom ID, NIK, Marga, Dusun, dan relasi Orang Tua/Anak.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="w-full py-2 px-3 text-xs font-medium text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" /> Export Data Saat Ini
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Cadangkan seluruh {members.length} data silsilah yang ada ke dalam file Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportFamilyToExcel(members)}
                className="w-full py-2 px-3 text-xs font-medium text-blue-700 bg-blue-100/70 hover:bg-blue-200/70 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Export Data ({members.length} Warga)
              </button>
            </div>
          </div>

          {/* Section 2: Upload Excel File */}
          <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors text-center bg-slate-50/30">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700 mb-1">Upload File Data Silsilah Excel</p>
              <p className="text-xs text-slate-400 mb-3">Mendukung file .xlsx, .xls, atau .csv skala ribuan baris</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-4 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
              >
                {file ? 'Ganti File Excel' : 'Pilih File Excel'}
              </button>
              {file && <p className="text-xs text-slate-600 mt-2 font-mono">{file.name}</p>}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* Preview & Import Options */}
          {previewData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Pilihan Mode Impor:</span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gabung & Update (Merge)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-600 font-medium">Ganti Seluruh Data (Replace)</span>
                  </label>
                </div>
              </div>

              {/* Preview mini table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Nama</th>
                      <th className="p-2">Marga</th>
                      <th className="p-2">Dusun</th>
                      <th className="p-2">L/P</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 10).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{row.id}</td>
                        <td className="p-2 font-medium text-slate-800">{row.fullName}</td>
                        <td className="p-2 text-slate-600">{row.clan || '-'}</td>
                        <td className="p-2 text-slate-600">{row.dusun || '-'}</td>
                        <td className="p-2 text-slate-600">{row.gender === 'female' ? 'P' : 'L'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 10 && (
                <p className="text-[11px] text-slate-400 italic text-center">
                  ... dan {previewData.length - 10} baris data warga lainnya
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
          {previewData.length > 0 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Masukkan {previewData.length} Data ke Sistem
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
