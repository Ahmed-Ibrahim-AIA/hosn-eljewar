import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  ChevronDown,
  FolderOpen,
  Copy,
  Check,
  FileArchive,
  Sparkles,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { ExportScaleMultiplier } from '../services/fileMediaManager';

export interface UnifiedExportSplitButtonProps {
  /** Primary action label (e.g., "تنزيل مباشر" or "مشاركة للواتساب") */
  primaryLabel?: string;
  /** Triggered on 1-click primary button press */
  onPrimaryAction: () => void | Promise<void>;
  /** Triggered when user selects "حفظ باسم (Save As / Browse)" from menu */
  onSaveAsBrowse?: () => void | Promise<void>;
  /** Triggered when user selects "مشاركة للواتساب" from menu */
  onShareWhatsApp?: () => void | Promise<void>;
  /** Triggered when user selects "نسخ للحافظة (Ctrl+V)" from menu */
  onCopyToClipboard?: () => void | Promise<void>;
  /** Triggered when user clicks "إعدادات التصدير والصيغ المتقدمة (PNG/WebP/PDF/ZIP)" */
  onOpenStudioModal?: () => void;
  /** Quick format export callback (`PNG`, `JPG`, `WebP`, `PDF`, `ZIP`) */
  onQuickFormatExport?: (
    format: 'png' | 'jpeg' | 'webp' | 'pdf' | 'zip',
    scale: ExportScaleMultiplier
  ) => void | Promise<void>;
  isBusy?: boolean;
  kind?: 'image' | 'excel';
  testIdPrefix?: string;
}

/**
 * Figma / Linear / Notion Style Compact Split Button & Popover Menu
 * Combines the most frequent 1-click action with a compact dropdown for scale (`1x`, `2x`, `3x`),
 * instant format export (`PNG`, `JPG`, `WebP`, `PDF`, `ZIP`), clipboard copy (`Ctrl+V`), and Save-As picker.
 */
export const UnifiedExportSplitButton: React.FC<UnifiedExportSplitButtonProps> = ({
  primaryLabel = 'تنزيل فوري',
  onPrimaryAction,
  onSaveAsBrowse,
  onShareWhatsApp,
  onCopyToClipboard,
  onOpenStudioModal,
  onQuickFormatExport,
  isBusy = false,
  kind = 'image',
  testIdPrefix = 'unified-split',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedScale, setSelectedScale] = useState<ExportScaleMultiplier>(2);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleCopy = async () => {
    if (!onCopyToClipboard || isBusy) return;
    await onCopyToClipboard();
    setCopiedFeedback(true);
    setTimeout(() => {
      setCopiedFeedback(false);
      setMenuOpen(false);
    }, 1200);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center" dir="rtl">
      {/* Split Button Group */}
      <div className="inline-flex items-stretch rounded-xl shadow-xs border border-teal-600/30 overflow-hidden bg-gradient-to-l from-teal-700 to-emerald-600 text-white">
        {/* Primary 1-Click Action */}
        <button
          type="button"
          disabled={isBusy}
          data-testid={`${testIdPrefix}-primary-btn`}
          onClick={onPrimaryAction}
          className="px-3.5 py-2 text-xs font-black flex items-center gap-1.5 hover:bg-black/10 transition cursor-pointer disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-100" />
          ) : (
            <Download className="w-3.5 h-3.5 text-teal-100" />
          )}
          <span>{primaryLabel}</span>
        </button>

        {/* Divider + Compact Dropdown Trigger */}
        <button
          type="button"
          disabled={isBusy}
          data-testid={`${testIdPrefix}-dropdown-trigger`}
          onClick={() => setMenuOpen(v => !v)}
          className="px-2 py-2 border-r border-white/20 hover:bg-black/15 flex items-center justify-center transition cursor-pointer disabled:opacity-60"
          title="خيارات التصدير والمشاركة السريعة (Figma / Linear Menu)"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              menuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Compact Popover Menu */}
      {menuOpen && (
        <div
          data-testid={`${testIdPrefix}-popover-menu`}
          className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 p-2.5 text-right space-y-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Scale Multiplier Bar (1x, 2x, 3x) for Images */}
          {kind === 'image' && (
            <div className="px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-600">
                دقة التصدير (Scale):
              </span>
              <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 gap-0.5">
                {([1, 2, 3] as ExportScaleMultiplier[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedScale(s)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black transition cursor-pointer ${
                      selectedScale === s
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Format Chips */}
          {onQuickFormatExport && kind === 'image' && (
            <div className="px-1 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block px-1">
                تصدير فوري بالصيغة:
              </span>
              <div className="grid grid-cols-5 gap-1">
                {(
                  [
                    { id: 'png', label: 'PNG' },
                    { id: 'jpeg', label: 'JPG' },
                    { id: 'webp', label: 'WebP' },
                    { id: 'pdf', label: 'PDF' },
                    { id: 'zip', label: 'ZIP' },
                  ] as const
                ).map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onQuickFormatExport(fmt.id, selectedScale);
                    }}
                    className="py-1.5 px-1 rounded-lg border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 text-slate-800 font-mono font-black text-[10px] text-center transition cursor-pointer"
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 my-1" />

          {/* Menu Action Items */}
          <div className="space-y-0.5">
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onShareWhatsApp();
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 flex items-center justify-between text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>إرسال مباشر للواتساب</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  WhatsApp
                </span>
              </button>
            )}

            {onSaveAsBrowse && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onSaveAsBrowse();
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-amber-50 text-slate-800 hover:text-amber-950 flex items-center justify-between text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span>حفظ باسم واختيار المجلد...</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Save As
                </span>
              </button>
            )}

            {onCopyToClipboard && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 flex items-center justify-between text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {copiedFeedback ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                  <span>{copiedFeedback ? 'تم النسخ للحافظة!' : 'نسخ فوري للحافظة'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Ctrl+V
                </span>
              </button>
            )}

            {onOpenStudioModal && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenStudioModal();
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-indigo-50 text-indigo-950 flex items-center justify-between text-xs font-black transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>استوديو التصدير والضغط (ZIP / PDF)</span>
                </div>
                <FileArchive className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
