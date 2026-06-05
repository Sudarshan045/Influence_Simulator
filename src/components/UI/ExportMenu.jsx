/**
 * ExportMenu.jsx — Reusable Export Dropdown
 * ==========================================
 * A glassmorphism button with a dropdown showing CSV/JSON format options.
 * Self-contained: handles open/close, outside-click, and success flash.
 *
 * Props:
 *   onExportCSV  : () => boolean  — called when user picks CSV
 *   onExportJSON : () => boolean  — called when user picks JSON
 *   label        : string         — button label (default: "Export")
 *   disabled     : boolean        — disables the trigger button
 *   size         : "sm" | "md"    — button size (default: "sm")
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, FileText, Braces, Check } from 'lucide-react';

const FLASH_MS = 2200;

export default function ExportMenu({
  onExportCSV,
  onExportJSON,
  label    = 'Export',
  disabled = false,
  size     = 'sm',
}) {
  const [open,    setOpen]    = useState(false);
  const [flashed, setFlashed] = useState(null); // null | 'csv' | 'json'
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cleanup flash timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleExport = useCallback((format) => {
    const fn = format === 'csv' ? onExportCSV : onExportJSON;
    const ok = fn?.();
    setOpen(false);
    if (ok !== false) {
      setFlashed(format);
      timerRef.current = setTimeout(() => setFlashed(null), FLASH_MS);
    }
  }, [onExportCSV, onExportJSON]);

  const isSmall   = size === 'sm';
  const btnPad    = isSmall ? 'px-3 py-1.5' : 'px-4 py-2';
  const btnText   = isSmall ? 'text-xs'     : 'text-sm';
  const iconSize  = isSmall ? 13            : 15;

  const successFmt = flashed ? (flashed === 'csv' ? 'CSV' : 'JSON') : null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 font-semibold rounded-lg
          transition-all duration-200 select-none
          ${btnPad} ${btnText}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${successFmt ? '' : ''}
        `}
        style={{
          background: successFmt
            ? 'rgba(16,185,129,0.15)'
            : open
            ? 'rgba(124,58,237,0.2)'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${
            successFmt
              ? 'rgba(16,185,129,0.35)'
              : open
              ? 'rgba(124,58,237,0.4)'
              : 'rgba(255,255,255,0.1)'
          }`,
          color: successFmt ? '#34d399' : 'white',
          boxShadow: open ? '0 0 12px rgba(124,58,237,0.2)' : 'none',
        }}
      >
        {successFmt ? (
          <>
            <Check size={iconSize} />
            <span>{successFmt} saved</span>
          </>
        ) : (
          <>
            <Download size={iconSize} className={open ? 'text-violet-400' : 'text-slate-400'} />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-1.5 z-50 rounded-xl overflow-hidden animate-fade-in"
          style={{
            background: 'rgba(15,23,42,0.98)',
            border:     '1px solid rgba(255,255,255,0.1)',
            boxShadow:  '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)',
            minWidth:   '175px',
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Export Format
            </p>
          </div>

          {/* CSV option */}
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group"
            style={{ color: 'white' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <FileText size={13} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">CSV Spreadsheet</p>
              <p className="text-[10px] text-slate-500">Excel, Google Sheets</p>
            </div>
          </button>

          {/* JSON option */}
          <button
            onClick={() => handleExport('json')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
            style={{ color: 'white' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}
            >
              <Braces size={13} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">JSON Data</p>
              <p className="text-[10px] text-slate-500">Full schema + metadata</p>
            </div>
          </button>

          {/* Footer note */}
          <div
            className="px-3 py-2 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Download starts immediately.
              <br />No data leaves your device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
