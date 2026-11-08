import React, { useEffect, useState, useMemo } from 'react';
import {
  SaveLocationFolder,
  ImageExportFormat,
  ExcelExportFormat,
} from '../types';
import {
  ApkExportModalPayload,
  SAVE_LOCATION_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  EXCEL_FORMAT_OPTIONS,
  saveMultipleFormatsToDevice,
  shareFileToWhatsAppOrApps,
  resolveTargetSavePathInfo,
  saveDefaultSavePreferences,
  getDefaultSavePreferences,
} from '../utils/apkBridge';
import {
  ExportScaleMultiplier,
  transformAndOptimizeImage,
  buildStandardizedFileName,
  computeContentChecksum,
  base64ToUint8Array,
  extractBase64FromDataUrl,
} from '../services/fileMediaManager';
import { useFileMediaManager } from '../hooks/useFileMediaManager';
import {
  X,
  Download,
  Share2,
  Check,
  Copy,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  FolderTree,
  Save,
  FileArchive,
  AlertTriangle,
  RefreshCw,
  ClipboardCopy,
  FileText,
  Gauge,
} from 'lucide-react';

type ExtendedImageFormat = ImageExportFormat | 'avif' | 'pdf';

interface ExtendedImageFormatOption {
  id: ExtendedImageFormat;
  extension: string;
  mimeType: string;
  badgeArabic: string;
}

const EXTENDED_IMAGE_FORMAT_OPTIONS: ExtendedImageFormatOption[] = [
  ...IMAGE_FORMAT_OPTIONS.map(o => ({
    id: o.id as ExtendedImageFormat,
    extension: o.extension,
    mimeType: o.mimeType,
    badgeArabic: o.badgeArabic,
  })),
  {
    id: 'avif',
    extension: 'avif',
    mimeType: 'image/avif',
    badgeArabic: 'ضغط فائق (AVIF)',
  },
  {
    id: 'pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    badgeArabic: 'مستند رسمي (PDF)',
  },
];

/**
 * Unified Export, Save, Optimization & Sharing Studio (`ApkExportShareModal.tsx`)
 * Engineered to match Figma / Linear / Notion & Google Material 3 standards:
 * - Powered by `useFileMediaManager` (DRY unified service layer + automatic ObjectURL cleanup)
 * - Supports `1x`, `2x`, `3x` OffscreenCanvas resolution scaling & lossless quality control
 * - Supports `PNG`, `JPG`, `WebP`, `AVIF`, `SVG`, `PDF`, and all 6 Excel formats (`XLSX`, `XLS`, `CSV`, `XML`, `ODS`, `TSV`)
 * - Multi-file `ZIP Streaming` bundler (1-click `.zip` package instead of dozens of separate files)
 * - Direct Binary Clipboard Copy (`Ctrl+V` / `ClipboardItem`) & Standardized Hash Naming (`project-YYYY-MM-DD-hash.ext`)
 * - Real-time Progress Bar + Retry button on error + Duplicate Checksum Guard
 */
export const ApkExportShareModal: React.FC = () => {
  const [payload, setPayload] = useState<ApkExportModalPayload | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedBinaryImage, setCopiedBinaryImage] = useState(false);

  const {
    progressState,
    isBusy,
    scale,
    setScale,
    quality,
    setQuality,
    resetProgress,
    saveSingleFile,
    exportMultipleAsZip,
    copyImageToClipboard,
    copyShareLinkOrText,
    shareWhatsAppReady,
    retryLastOperation,
  } = useFileMediaManager();

  // File naming & location (طريقة الحفظ النموذجية)
  const [selectedFolder, setSelectedFolder] = useState<SaveLocationFolder>('Download');
  const [customSubfolder, setCustomSubfolder] = useState<string>('حسن_الجوار');
  const [editableBaseName, setEditableBaseName] = useState<string>('');
  const [useStandardHashName, setUseStandardHashName] = useState<boolean>(false);
  const [showPreviewAccordion, setShowPreviewAccordion] = useState<boolean>(false);
  const [showMultiFormatSave, setShowMultiFormatSave] = useState<boolean>(false);

  // Formats
  const [activeImageFormat, setActiveImageFormat] = useState<ExtendedImageFormat>('png');
  const [selectedImageFormats, setSelectedImageFormats] = useState<ImageExportFormat[]>(['png', 'jpeg']);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [imageBgColor, setImageBgColor] = useState<string>('#ffffff');
  const [convertedImagePreview, setConvertedImagePreview] = useState<{
    dataUrl: string;
    base64Data: string;
    mimeType: string;
    extension: string;
    width: number;
    height: number;
    sizeBytes: number;
    contentHash: string;
  } | null>(null);

  const [activeExcelFormat, setActiveExcelFormat] = useState<ExcelExportFormat>('xlsx');
  const [selectedExcelFormats, setSelectedExcelFormats] = useState<ExcelExportFormat[]>(['xlsx', 'xls']);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ApkExportModalPayload>;
      if (customEvent.detail) {
        const d = customEvent.detail;
        const prefs = getDefaultSavePreferences();
        setPayload(d);
        setFeedback(null);
        setCopiedText(false);
        setCopiedBinaryImage(false);
        resetProgress();

        const initFolder = d.initialSaveFolder || prefs.defaultSaveFolder || 'Download';
        const initSub =
          d.initialCustomSubfolder !== undefined
            ? d.initialCustomSubfolder
            : prefs.defaultCustomSubfolder || 'حسن_الجوار';
        setSelectedFolder(initFolder === 'custom_ask' ? 'Download' : initFolder);
        setCustomSubfolder(initSub);

        const rawBase =
          d.baseFileName ||
          d.fileName.replace(/\.(png|jpg|jpeg|webp|avif|svg|pdf|xlsx|xls|csv|xml|ods|tsv)$/i, '');
        setEditableBaseName(rawBase);

        const initImgFmt = d.initialImageFormat || prefs.defaultImageFormat || 'png';
        setActiveImageFormat(initImgFmt);
        setSelectedImageFormats(
          initImgFmt === 'png' ? ['png', 'jpeg'] : [initImgFmt, 'png']
        );
        setPreviewZoom(100);
        setImageBgColor('#ffffff');
        setScale(1);
        setShowPreviewAccordion(false);
        setShowMultiFormatSave(false);

        const initExcelFmt = d.initialExcelFormat || prefs.defaultExcelFormat || 'xlsx';
        setActiveExcelFormat(initExcelFmt);
        setSelectedExcelFormats(
          initExcelFmt === 'xlsx' ? ['xlsx', 'xls'] : [initExcelFmt, 'xlsx']
        );
      }
    };
    window.addEventListener('open-apk-export-modal', handler);
    return () => window.removeEventListener('open-apk-export-modal', handler);
  }, [resetProgress, setScale]);

  // Live OffscreenCanvas / Worker-backed image transformation on format, scale, quality, or bg change
  useEffect(() => {
    if (!payload || payload.kind !== 'image') {
      setConvertedImagePreview(null);
      return;
    }
    let cancelled = false;
    transformAndOptimizeImage(payload.dataUrl, editableBaseName || 'حسن_الجوار', {
      format: activeImageFormat,
      scale,
      quality,
      backgroundColor: imageBgColor,
    }).then(res => {
      if (!cancelled) {
        setConvertedImagePreview({
          dataUrl: res.dataUrl,
          base64Data: res.base64Data,
          mimeType: res.mimeType,
          extension: res.extension,
          width: res.width,
          height: res.height,
          sizeBytes: res.sizeBytes,
          contentHash: res.contentHash,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [payload, activeImageFormat, scale, quality, imageBgColor, editableBaseName]);

  const isImage = payload?.kind === 'image';

  const activeImageOption = useMemo(
    () =>
      EXTENDED_IMAGE_FORMAT_OPTIONS.find(o => o.id === activeImageFormat) ||
      EXTENDED_IMAGE_FORMAT_OPTIONS[0],
    [activeImageFormat]
  );

  const activeExcelOption = useMemo(
    () =>
      EXCEL_FORMAT_OPTIONS.find(o => o.id === activeExcelFormat) ||
      EXCEL_FORMAT_OPTIONS[0],
    [activeExcelFormat]
  );

  const activeExcelPayloadItem = useMemo(() => {
    if (!payload || payload.kind !== 'excel') return null;
    if (payload.excelFormatsMap && payload.excelFormatsMap[activeExcelFormat]) {
      return payload.excelFormatsMap[activeExcelFormat];
    }
    return {
      format: activeExcelFormat,
      label: activeExcelOption.label,
      extension: activeExcelOption.extension,
      fileName: `${editableBaseName || 'حسن_الجوار'}.${activeExcelOption.extension}`,
      mimeType: activeExcelOption.mimeType,
      base64Data: payload.base64Data,
      sizeBytes: Math.round((payload.base64Data.length * 3) / 4),
    };
  }, [payload, activeExcelFormat, activeExcelOption, editableBaseName]);

  const currentFileNameWithExt = useMemo(() => {
    const cleanBase =
      (editableBaseName || '').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'حسن_الجوار';
    const ext = isImage ? activeImageOption.extension : activeExcelOption.extension;
    if (useStandardHashName) {
      const hash = isImage
        ? convertedImagePreview?.contentHash
        : activeExcelPayloadItem
        ? computeContentChecksum(activeExcelPayloadItem.base64Data)
        : undefined;
      return buildStandardizedFileName({
        titleOrSlug: cleanBase,
        extension: ext,
        scale: isImage ? scale : 1,
        contentHash: hash,
      });
    }
    const scaleSuffix = isImage && scale > 1 ? `@${scale}x` : '';
    return `${cleanBase}${scaleSuffix}.${ext}`;
  }, [
    editableBaseName,
    isImage,
    activeImageOption,
    activeExcelOption,
    useStandardHashName,
    convertedImagePreview,
    activeExcelPayloadItem,
    scale,
  ]);

  const resolvedSavePath = useMemo(() => {
    return resolveTargetSavePathInfo(
      selectedFolder,
      customSubfolder,
      currentFileNameWithExt
    );
  }, [selectedFolder, customSubfolder, currentFileNameWithExt]);

  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(prev => (prev?.text === text ? null : prev));
    }, 6500);
  };

  // 1. Direct 1-Click Download into Downloads folder
  const handleDirectDownload = async () => {
    if (isImage) {
      const imgData =
        convertedImagePreview ||
        (await transformAndOptimizeImage(payload!.dataUrl, editableBaseName || 'حسن_الجوار', {
          format: activeImageFormat,
          scale,
          quality,
          backgroundColor: imageBgColor,
        }));
      const res = await saveSingleFile({
        base64OrDataUrl: imgData.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: imgData.mimeType,
        mode: 'direct_download',
        targetFolder: 'Download',
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    } else if (activeExcelPayloadItem) {
      const res = await saveSingleFile({
        base64OrDataUrl: activeExcelPayloadItem.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: activeExcelPayloadItem.mimeType,
        mode: 'direct_download',
        targetFolder: 'Download',
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    }
  };

  // 2. طريقة الحفظ النموذجية: حفظ مباشر داخل المجلد والمجلد الفرعي المختار
  const handleModelFolderSave = async () => {
    if (isImage) {
      const imgData =
        convertedImagePreview ||
        (await transformAndOptimizeImage(payload!.dataUrl, editableBaseName || 'حسن_الجوار', {
          format: activeImageFormat,
          scale,
          quality,
          backgroundColor: imageBgColor,
        }));
      const res = await saveSingleFile({
        base64OrDataUrl: imgData.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: imgData.mimeType,
        mode: 'model_folder',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(
        res.wasDuplicatePrevented
          ? res.stepLabelArabic
          : `تم حفظ الملف بنجاح في مجلد: ${res.savedPath || resolvedSavePath.displayFullPath}`,
        res.status === 'error' ? 'error' : 'success'
      );
    } else if (activeExcelPayloadItem) {
      const res = await saveSingleFile({
        base64OrDataUrl: activeExcelPayloadItem.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: activeExcelPayloadItem.mimeType,
        mode: 'model_folder',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(
        res.wasDuplicatePrevented
          ? res.stepLabelArabic
          : `تم حفظ ملف الإكسيل بنجاح في مجلد: ${res.savedPath || resolvedSavePath.displayFullPath}`,
        res.status === 'error' ? 'error' : 'success'
      );
    }
  };

  // 3. مستعرض النظام (File System Access API `showSaveFilePicker` / Browse)
  const handleSaveAsBrowse = async () => {
    if (isImage) {
      const imgData =
        convertedImagePreview ||
        (await transformAndOptimizeImage(payload!.dataUrl, editableBaseName || 'حسن_الجوار', {
          format: activeImageFormat,
          scale,
          quality,
          backgroundColor: imageBgColor,
        }));
      const res = await saveSingleFile({
        base64OrDataUrl: imgData.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: imgData.mimeType,
        mode: 'save_as_picker',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    } else if (activeExcelPayloadItem) {
      const res = await saveSingleFile({
        base64OrDataUrl: activeExcelPayloadItem.base64Data,
        fileName: currentFileNameWithExt,
        mimeType: activeExcelPayloadItem.mimeType,
        mode: 'save_as_picker',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    }
  };

  // 4. مخصص للواتساب: إرسال صورة نقية ومباشرة للواتساب
  const handleWhatsAppDirectShare = async () => {
    if (isImage) {
      const res = await shareWhatsAppReady(
        payload!.dataUrl,
        editableBaseName || 'فاتورة_برج_النور',
        payload!.captionText,
        'share'
      );
      triggerToast(res.stepLabelArabic);
    } else if (activeExcelPayloadItem) {
      const res = await shareFileToWhatsAppOrApps(
        activeExcelPayloadItem.base64Data,
        currentFileNameWithExt,
        activeExcelPayloadItem.mimeType,
        payload!.captionText
      );
      triggerToast(res.message);
    }
  };

  // 5. مخصص للواتساب: تنزيل نسخة الواتساب المعتمدة (.JPG)
  const handleWhatsAppDirectDownload = async () => {
    if (isImage) {
      const res = await shareWhatsAppReady(
        payload!.dataUrl,
        editableBaseName || 'فاتورة_برج_النور',
        payload!.captionText,
        'download'
      );
      triggerToast(res.stepLabelArabic);
    } else {
      await handleDirectDownload();
    }
  };

  // 6. نسخ الصورة مباشرة للحافظة (Ctrl+V Binary ClipboardItem)
  const handleCopyBinaryImage = async () => {
    if (!payload) return;
    const ok = await copyImageToClipboard(
      convertedImagePreview?.dataUrl || payload.dataUrl
    );
    if (ok) {
      setCopiedBinaryImage(true);
      triggerToast(
        'تم نسخ الصورة مباشرة إلى الحافظة! يمكنك لصقها فوراً (Ctrl+V) في واتساب أو أي تطبيق.'
      );
      setTimeout(() => setCopiedBinaryImage(false), 3000);
    }
  };

  // 7. نسخ ملخص التقرير نصياً للواتساب
  const handleCopyAndWhatsAppText = async () => {
    const textToCopy = payload?.tsvText || payload?.captionText || '';
    await copyShareLinkOrText(textToCopy, true);
    setCopiedText(true);
    triggerToast('تم نسخ التقرير نصياً للحافظة بنجاح!');
    setTimeout(() => setCopiedText(false), 3000);
  };

  // 8. تجميع الصيغ المتعددة في ملف مضغوط واحد (ZIP Streaming Bundler)
  const handleBundleMultipleAsZip = async () => {
    const cleanBase =
      (editableBaseName || '').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'حسن_الجوار';

    if (isImage) {
      const entries: Array<{ fileName: string; data: Uint8Array }> = [];
      for (const fmt of selectedImageFormats) {
        const conv = await transformAndOptimizeImage(payload!.dataUrl, cleanBase, {
          format: fmt,
          scale,
          quality,
          backgroundColor: imageBgColor,
        });
        entries.push({
          fileName: `${cleanBase}.${conv.extension}`,
          data: conv.uint8Bytes,
        });
      }
      const res = await exportMultipleAsZip({
        entries,
        bundleBaseName: `${cleanBase}_حزمة_الصور`,
        mode: 'model_folder',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    } else {
      const entries: Array<{ fileName: string; data: Uint8Array }> = [];
      for (const fmt of selectedExcelFormats) {
        const opt = EXCEL_FORMAT_OPTIONS.find(o => o.id === fmt) || EXCEL_FORMAT_OPTIONS[0];
        const itemPayload = payload!.excelFormatsMap?.[fmt];
        if (itemPayload) {
          entries.push({
            fileName: `${cleanBase}.${opt.extension}`,
            data: base64ToUint8Array(extractBase64FromDataUrl(itemPayload.base64Data)),
          });
        }
      }
      const res = await exportMultipleAsZip({
        entries,
        bundleBaseName: `${cleanBase}_حزمة_الإكسيل`,
        mode: 'model_folder',
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.stepLabelArabic, res.status === 'error' ? 'error' : 'success');
    }
  };

  // 9. حفظ الصيغ المتعددة كملفات منفصلة (توافق رجعي مع الاختبارات)
  const handleBatchSaveFormats = async () => {
    const cleanBase =
      (editableBaseName || '').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'حسن_الجوار';

    if (isImage) {
      const items: Array<{
        base64OrDataUrl: string;
        fileName: string;
        mimeType: string;
        formatLabel: string;
      }> = [];
      for (const fmt of selectedImageFormats) {
        const conv = await transformAndOptimizeImage(payload!.dataUrl, cleanBase, {
          format: fmt,
          scale,
          quality,
          backgroundColor: imageBgColor,
        });
        items.push({
          base64OrDataUrl: conv.base64Data,
          fileName: `${cleanBase}.${conv.extension}`,
          mimeType: conv.mimeType,
          formatLabel: conv.extension.toUpperCase(),
        });
      }
      const res = await saveMultipleFormatsToDevice(items, {
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.message);
    } else {
      const items: Array<{
        base64OrDataUrl: string;
        fileName: string;
        mimeType: string;
        formatLabel: string;
      }> = [];
      for (const fmt of selectedExcelFormats) {
        const opt = EXCEL_FORMAT_OPTIONS.find(o => o.id === fmt) || EXCEL_FORMAT_OPTIONS[0];
        const itemPayload = payload!.excelFormatsMap?.[fmt];
        if (itemPayload) {
          items.push({
            base64OrDataUrl: itemPayload.base64Data,
            fileName: `${cleanBase}.${opt.extension}`,
            mimeType: itemPayload.mimeType,
            formatLabel: opt.extension.toUpperCase(),
          });
        }
      }
      const res = await saveMultipleFormatsToDevice(items, {
        targetFolder: selectedFolder,
        customSubfolder: (customSubfolder || '').trim(),
      });
      triggerToast(res.message);
    }
  };

  const handleSetCurrentPreferencesAsDefault = () => {
    const safeImgFmt: ImageExportFormat =
      activeImageFormat === 'avif' || activeImageFormat === 'pdf'
        ? 'png'
        : activeImageFormat;
    saveDefaultSavePreferences({
      defaultSaveFolder: selectedFolder,
      defaultCustomSubfolder: (customSubfolder || '').trim(),
      ...(isImage
        ? { defaultImageFormat: safeImgFmt }
        : { defaultExcelFormat: activeExcelFormat }),
    });
    triggerToast('تم حفظ هذه الإعدادات والمجلد كخيار افتراضي في التطبيق!');
  };

  if (!payload) return null;

  return (
    <div
      data-testid="apk-export-share-modal"
      className="fixed inset-0 z-[95] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full overflow-hidden my-auto max-h-[94vh] flex flex-col transition-all">
        {/* Figma / Linear / Material 3 Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-600/20 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
              {isImage ? (
                <ImageIcon className="w-5 h-5 text-teal-700" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                  استوديو التصدير والحفظ والمشاركة الموحد
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                  .{isImage ? activeImageOption.extension : activeExcelOption.extension}
                </span>
                {isImage && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono text-[10px] font-black">
                    {scale}x
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-bold truncate mt-0.5">
                {currentFileNameWithExt}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-apk-export-modal-btn"
            onClick={() => setPayload(null)}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Progress Bar & Status Indicator */}
        {progressState.status !== 'idle' && (
          <div className="px-5 py-2.5 bg-slate-900 text-white border-b border-slate-800 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold gap-2">
              <span className="truncate">{progressState.stepLabelArabic}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-teal-300">
                  {progressState.progressPercent}%
                </span>
                {progressState.status === 'error' && progressState.canRetry && (
                  <button
                    type="button"
                    onClick={retryLastOperation}
                    className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة المحاولة</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressState.status === 'error'
                    ? 'bg-rose-500'
                    : progressState.wasDuplicatePrevented
                    ? 'bg-amber-400'
                    : 'bg-teal-400'
                }`}
                style={{ width: `${progressState.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Feedback Toast */}
          {feedback && (
            <div
              data-testid="apk-export-feedback-banner"
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-between gap-2.5 shadow-xs ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="leading-snug">{feedback.text}</span>
              </div>
              {feedback.type === 'error' && (
                <button
                  type="button"
                  onClick={retryLastOperation}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black shrink-0 cursor-pointer"
                >
                  إعادة المحاولة
                </button>
              )}
            </div>
          )}

          {/* SECTION 1: 🟢 تصدير مخصص ومباشر للواتساب + نسخ فوري للحافظة (Ctrl+V) */}
          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-emerald-950">
                    مشاركة سلسة وتصدير مباشر للواتساب والحافظة
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    صورة RGB نقية بخلفية بيضاء معتمدة 100% أو نسخ مباشر للصورة في الحافظة (Ctrl+V)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                WhatsApp + Clipboard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={isBusy}
                data-testid="apk-modal-whatsapp-direct-share-btn"
                onClick={handleWhatsAppDirectShare}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال للواتساب</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                data-testid="apk-modal-whatsapp-direct-download-btn"
                onClick={handleWhatsAppDirectDownload}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-400 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>تنزيل نسخة واتساب</span>
              </button>

              {isImage && (
                <button
                  type="button"
                  disabled={isBusy}
                  data-testid="apk-modal-copy-binary-image-btn"
                  onClick={handleCopyBinaryImage}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-60"
                  title="نسخ الصورة مباشرة للصق الفوري Ctrl+V في واتساب ويب أو أي برنامج"
                >
                  {copiedBinaryImage ? (
                    <Check className="w-3.5 h-3.5 text-teal-300" />
                  ) : (
                    <ClipboardCopy className="w-3.5 h-3.5 text-teal-300" />
                  )}
                  <span>{copiedBinaryImage ? 'تم نسخ الصورة!' : 'نسخ الصورة (Ctrl+V)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 2: ⚡ تنزيل مباشر سريع (Direct Download) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-slate-900">
                  تنزيل مباشر في التحميلات (Downloads)
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  حفظ فوري بنقرة واحدة مع التحقق الذكي من البصمة الرقمية لمنع التكرار
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={isBusy}
              data-testid="apk-modal-direct-download-downloads-btn"
              onClick={handleDirectDownload}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shrink-0 transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              تنزيل الآن
            </button>
          </div>

          {/* SECTION 3: 🎛️ اختيار الصيغة والدقة (Figma / Linear Format & Scale Selector: 1x, 2x, 3x) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900">
                صيغة التصدير ودقة الأبعاد:
              </span>

              {/* Scale Multiplier Selector (1x, 2x, 3x) for Images */}
              {isImage && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-teal-600" />
                    الأبعاد:
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 gap-0.5">
                    {([1, 2, 3] as ExportScaleMultiplier[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        data-testid={`select-export-scale-${s}x`}
                        onClick={() => setScale(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black transition cursor-pointer ${
                          scale === s
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isImage ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXTENDED_IMAGE_FORMAT_OPTIONS.map(fmt => {
                  const isActive = activeImageFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      data-testid={`select-image-format-${fmt.id}`}
                      onClick={() => setActiveImageFormat(fmt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="uppercase font-mono">.{fmt.extension}</span>
                      <span
                        className={`text-[10px] font-bold truncate ${
                          isActive ? 'text-teal-300' : 'text-slate-500'
                        }`}
                      >
                        {fmt.badgeArabic}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXCEL_FORMAT_OPTIONS.map(fmt => {
                  const isActive = activeExcelFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      data-testid={`select-excel-format-${fmt.id}`}
                      onClick={() => setActiveExcelFormat(fmt.id)}
                      className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between gap-1 ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="uppercase font-mono font-black text-xs">
                          .{fmt.extension}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-teal-300" />}
                      </div>
                      <span
                        className={`text-[10px] font-bold truncate ${
                          isActive ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {fmt.badgeArabic}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: 📁 طريقة الحفظ النموذجية (تحديد المجلد، تغيير اسم المجلد، وتسمية قياسية) */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-amber-700" />
                <h4 className="font-black text-xs sm:text-sm text-slate-900">
                  طريقة الحفظ النموذجية واختيار المجلد والمسار
                </h4>
              </div>
              <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2.5 py-1 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStandardHashName}
                  onChange={e => setUseStandardHashName(e.target.checked)}
                  className="rounded accent-slate-900"
                />
                <span>تسمية قياسية تلقائية (تاريخ + بصمة Hash)</span>
              </label>
            </div>

            {/* 1. Folder Selector */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                1. اختر مكان الحفظ على الجهاز:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'Download', label: 'التنزيلات', sub: 'Downloads' },
                  { id: 'Pictures', label: 'الصور', sub: 'Pictures' },
                  { id: 'Documents', label: 'المستندات', sub: 'Documents' },
                  { id: 'DCIM', label: 'الألبوم', sub: 'DCIM' },
                ].map(loc => {
                  const isSelected = selectedFolder === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      data-testid={`save-folder-option-${loc.id}`}
                      onClick={() => setSelectedFolder(loc.id as SaveLocationFolder)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-black shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">{loc.label}</div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? 'text-teal-300' : 'text-slate-500'
                        }`}
                      >
                        {loc.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Subfolder editor & Filename editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  2. اسم مجلد الحفظ داخل الجهاز (تغيير اسم المجلد):
                </label>
                <input
                  type="text"
                  data-testid="export-custom-subfolder-input"
                  value={customSubfolder}
                  onChange={e => setCustomSubfolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:border-teal-600 focus:outline-hidden"
                  placeholder="مثال: حسن_الجوار أو اتركه فارغاً"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  3. اسم الملف قبل الحفظ:
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    data-testid="export-editable-filename-input"
                    value={editableBaseName}
                    onChange={e => setEditableBaseName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:border-teal-600 focus:outline-hidden pl-14"
                    placeholder="اسم الملف..."
                  />
                  <span className="absolute left-2 text-[11px] font-mono font-black text-slate-500">
                    .{isImage ? activeImageOption.extension : activeExcelOption.extension}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Path Preview Banner */}
            <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] font-bold text-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-amber-800 font-black shrink-0">مسار الحفظ:</span>
                <code className="text-teal-800 dir-ltr text-right truncate">
                  /storage/emulated/0/{selectedFolder}/
                  {customSubfolder ? `${customSubfolder}/` : ''}
                  {currentFileNameWithExt}
                </code>
              </div>
              {convertedImagePreview?.contentHash && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] shrink-0">
                  #{convertedImagePreview.contentHash}
                </span>
              )}
            </div>

            {/* Action buttons for Model Save & Native OS SaveFilePicker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isBusy}
                data-testid="apk-modal-model-save-btn"
                onClick={handleModelFolderSave}
                className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الملف في هذا المجلد الآن</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                data-testid="apk-modal-file-manager-save-as-btn"
                onClick={handleSaveAsBrowse}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                title="يفتح نافذة اختيار المسار والاسم مباشرة عبر File System Access API"
              >
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <span>اختيار مسار حر (Save As Picker)</span>
              </button>
            </div>
          </div>

          {/* SECTION 5: معاينة المحتوى قبل الحفظ (Collapsible Preview) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreviewAccordion(v => !v)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-black text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>معاينة المحتوى والتحكم بالجودة والأبعاد</span>
                {convertedImagePreview && (
                  <span className="text-[10px] font-normal text-slate-500">
                    ({convertedImagePreview.width}×{convertedImagePreview.height} •{' '}
                    {Math.max(1, Math.round(convertedImagePreview.sizeBytes / 1024))} KB)
                  </span>
                )}
              </div>
              {showPreviewAccordion ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showPreviewAccordion && (
              <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/60">
                {isImage && (
                  <>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(z => Math.max(50, z - 25))}
                          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs cursor-pointer"
                          title="تصغير"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold font-mono">{previewZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(z => Math.min(200, z + 25))}
                          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs cursor-pointer"
                          title="تكبير"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewZoom(100)}
                          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs cursor-pointer"
                          title="إعادة ضبط"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <span>الجودة: {Math.round(quality * 100)}%</span>
                        <input
                          type="range"
                          min={0.6}
                          max={1.0}
                          step={0.05}
                          value={quality}
                          onChange={e => setQuality(Number(e.target.value))}
                          className="w-20 accent-teal-600"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <span>الخلفية:</span>
                        {['#ffffff', '#f8fafc', '#fffbeb'].map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setImageBgColor(hex)}
                            className={`w-5 h-5 rounded-full border cursor-pointer ${
                              imageBgColor === hex ? 'ring-2 ring-teal-600' : 'border-slate-300'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-200/50 p-2 max-h-56 overflow-auto flex items-center justify-center">
                      <img
                        data-testid="apk-export-image-preview"
                        src={
                          activeImageFormat === 'pdf'
                            ? payload.dataUrl
                            : convertedImagePreview?.dataUrl || payload.dataUrl
                        }
                        alt={payload.title}
                        style={{
                          width: `${previewZoom}%`,
                          maxWidth: previewZoom > 100 ? 'none' : '100%',
                          backgroundColor: imageBgColor,
                        }}
                        className="max-h-52 w-auto object-contain rounded shadow-xs"
                      />
                    </div>
                  </>
                )}

                {!isImage && payload.excelRawData && (
                  <div className="overflow-x-auto max-h-36 rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-[11px] text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          {payload.excelRawData.headers.map((h, i) => (
                            <th
                              key={i}
                              className="p-1.5 border border-slate-700 font-bold whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payload.excelRawData.rows.slice(0, 4).map((r, rIdx) => (
                          <tr key={rIdx} className="even:bg-slate-50">
                            {r.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="p-1.5 border border-slate-200 text-slate-800 whitespace-nowrap"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 6: تجميع الصيغ في ملف مضغوط واحد (ZIP Streaming) أو الحفظ المتعدد */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMultiFormatSave(v => !v)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-black text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-indigo-600" />
                <span>تجميع عدة صيغ في ملف مضغوط واحد (ZIP Streaming)</span>
              </div>
              {showMultiFormatSave ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showMultiFormatSave && (
              <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/60 text-xs">
                <p className="text-[11px] text-slate-600 font-medium">
                  بدلاً من تحميل عشرات الملفات المنفصلة، يقوم محرك التدفق بتجميع الصيغ المختارة في أرشيف <code className="font-mono font-bold text-indigo-700">.ZIP</code> واحد نظيف:
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isBusy}
                    data-testid="apk-modal-bundle-zip-btn"
                    onClick={handleBundleMultipleAsZip}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>
                      تنزيل كملف مضغوط واحد (.ZIP) (
                      {isImage
                        ? selectedImageFormats.join(' + ').toUpperCase()
                        : selectedExcelFormats.join(' + ').toUpperCase()}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    data-testid="apk-modal-save-multi-formats-btn"
                    onClick={handleBatchSaveFormats}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-300" />
                    <span>حفظ كملفات منفصلة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSetCurrentPreferencesAsDefault}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer mr-auto"
                  >
                    حفظ كإعداد افتراضي دائماً
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Text Copy & Close */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <button
            type="button"
            data-testid="apk-modal-whatsapp-text-btn"
            onClick={handleCopyAndWhatsAppText}
            className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-emerald-700 transition cursor-pointer"
          >
            {copiedText ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {copiedText ? 'تم نسخ التقرير نصياً!' : 'نسخ ملخص الفاتورة نصياً للواتساب'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPayload(null)}
            className="font-black text-slate-600 hover:text-slate-900 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
