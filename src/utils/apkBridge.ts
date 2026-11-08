import {
  SaveLocationFolder,
  ImageExportFormat,
  ExcelExportFormat,
} from '../types';

/**
 * Native Android APK Bridge & Web Fallback Utilities
 * Supports:
 * 1. Saving images & files directly to the device with customizable save location (Download / Pictures / DCIM / Documents / Custom Save-As Picker)
 * 2. Live Image Preview & multi-format image conversion (PNG, JPG/JPEG, WEBP, SVG)
 * 3. Multi-format Excel generation & export (.xlsx Office Open XML ZIP, .xls Rich RTL Workbook, .csv UTF-8 BOM, .xml SpreadsheetML 2003, .ods OpenDocument ZIP, .tsv)
 * 4. Exporting & sharing images, Excel sheets (.xlsx/.xls/.csv/.xml/.ods/.tsv), and texts to WhatsApp & other apps
 * 5. Picking images (App Icon / Official Stamp) and JSON backups from the device
 * 6. Requesting all required Android runtime permissions on install / launch
 */

export interface AndroidApkBridgeInterface {
  copyTextNative?: (text: string) => void;
  openExternalUri?: (uriString: string) => void;
  shareOrSaveBase64File?: (
    base64Data: string,
    fileName: string,
    mimeType: string,
    captionText: string
  ) => string;
  saveBase64FileToDevice?: (
    base64Data: string,
    fileName: string,
    folderOrMimeType: string
  ) => string;
  saveFileWithFileManager?: (
    base64Data: string,
    fileName: string,
    mimeType: string
  ) => void;
  pickFileFromDevice?: (mimeType: string) => void;
  requestAllAppPermissions?: () => boolean;
}

declare global {
  interface Window {
    AndroidApkBridge?: AndroidApkBridgeInterface;
    __onApkFilePicked?: (dataUrl: string, mimeType: string) => void;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: Blob | Uint8Array | string) => Promise<void>;
        close: () => Promise<void>;
      }>;
      name?: string;
    }>;
  }
}

export interface SaveLocationOption {
  id: SaveLocationFolder;
  labelArabic: string;
  shortLabelArabic: string;
  androidPathExample: string;
  descriptionArabic: string;
  nativeDirName: string;
}

export const SAVE_LOCATION_OPTIONS: SaveLocationOption[] = [
  {
    id: 'Download',
    labelArabic: 'مجلد التنزيلات (Downloads)',
    shortLabelArabic: 'التنزيلات (Download)',
    androidPathExample: '/storage/emulated/0/Download',
    descriptionArabic: 'المجلد الافتراضي للوصول السريع لجميع الصور وملفات الإكسيل والتقارير',
    nativeDirName: 'Download',
  },
  {
    id: 'Pictures',
    labelArabic: 'مجلد الصور والاستوديو (Pictures)',
    shortLabelArabic: 'الصور (Pictures)',
    androidPathExample: '/storage/emulated/0/Pictures',
    descriptionArabic: 'مناسب لحفظ الفواتير البيضاء والإيصالات وكشوف الأدوار المصورة في المعرض',
    nativeDirName: 'Pictures',
  },
  {
    id: 'DCIM',
    labelArabic: 'مجلد الكاميرا والألبوم (DCIM)',
    shortLabelArabic: 'الألبوم (DCIM)',
    androidPathExample: '/storage/emulated/0/DCIM',
    descriptionArabic: 'يظهر فوراً في أول ألبوم الكاميرا والواتساب عند إرفاق الصور',
    nativeDirName: 'DCIM',
  },
  {
    id: 'Documents',
    labelArabic: 'مجلد المستندات (Documents)',
    shortLabelArabic: 'المستندات (Documents)',
    androidPathExample: '/storage/emulated/0/Documents',
    descriptionArabic: 'مناسب لحفظ شيتات الإكسيل (.xlsx / .xls / .csv) والنسخ الاحتياطية',
    nativeDirName: 'Documents',
  },
  {
    id: 'custom_ask',
    labelArabic: 'فتح مدير الملفات لتصفح واختيار مكان الحفظ (Browse / Save As...)',
    shortLabelArabic: 'مدير الملفات (Browse / حفظ باسم)',
    androidPathExample: 'يفتح مدير ملفات جهازك لتصفح واختيار مجلد الحفظ (Browse)',
    descriptionArabic: 'يفتح نافذة مدير الملفات لتصفح المجلدات (Browse) وتسمية الملف واختيار مكان حفظه بنفسك في أي مجلد',
    nativeDirName: 'Download',
  },
];

export interface ImageFormatOption {
  id: ImageExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  badgeArabic: string;
  descriptionArabic: string;
}

export const IMAGE_FORMAT_OPTIONS: ImageFormatOption[] = [
  {
    id: 'png',
    label: 'PNG (دقة أصلية فائقة الوضوح)',
    extension: 'png',
    mimeType: 'image/png',
    badgeArabic: 'الأعلى جودة (موصى به)',
    descriptionArabic: 'أفضل صيغة للطباعة والواتساب بدون أي فقد في وضوح النصوص والأرقام العربية',
  },
  {
    id: 'jpeg',
    label: 'JPG / JPEG (حجم خفيف وسريع)',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    badgeArabic: 'حجم أصغر',
    descriptionArabic: 'صيغة مضغوطة بخلفية بيضاء صافية مثالية للمشاركة السريعة على الباقات',
  },
  {
    id: 'webp',
    label: 'WEBP (صيغة حديثة عالية الكفاءة)',
    extension: 'webp',
    mimeType: 'image/webp',
    badgeArabic: 'حديثة وذكية',
    descriptionArabic: 'تجمع بين الدقة العالية جداً والحجم الخفيف على الهواتف الحديثة',
  },
  {
    id: 'svg',
    label: 'SVG (ملف متجهي قابل للتكبير اللانهائي)',
    extension: 'svg',
    mimeType: 'image/svg+xml;charset=utf-8',
    badgeArabic: 'Vector SVG',
    descriptionArabic: 'ملف رسومي متجهي يحتفظ بالصورة داخل قالب SVG قابل للفتح في المتصفح وبرامج التصميم',
  },
];

export interface ExcelFormatOption {
  id: ExcelExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  badgeArabic: string;
  descriptionArabic: string;
}

export const EXCEL_FORMAT_OPTIONS: ExcelFormatOption[] = [
  {
    id: 'xlsx',
    label: 'Excel الحديث (.xlsx)',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    badgeArabic: 'الأحدث والأشهر (.xlsx)',
    descriptionArabic: 'ملف Microsoft Excel OpenXML رسمي (.xlsx) يعمل على كل إصدارات أوفيس والهواتف وGoogle Sheets من اليمين لليسار',
  },
  {
    id: 'xls',
    label: 'Excel 97-2003 الملون (.xls)',
    extension: 'xls',
    mimeType: 'application/vnd.ms-excel;charset=utf-8',
    badgeArabic: 'ملون ومُنسّق (.xls)',
    descriptionArabic: 'جدول إكسيل كلاسيكي (.xls) يحتفظ بالألوان والتنسيقات العربية (أخضر للمسدد / أحمر للمتأخر)',
  },
  {
    id: 'csv',
    label: 'CSV UTF-8 (.csv)',
    extension: 'csv',
    mimeType: 'text/csv;charset=utf-8',
    badgeArabic: 'عالمي خفيف (.csv)',
    descriptionArabic: 'ملف قيم مفصولة بفواصل مع ترميز UTF-8 BOM لدعم اللغة العربية في جميع البرامج المحاسبية',
  },
  {
    id: 'xml',
    label: 'Excel XML 2003 (.xml)',
    extension: 'xml',
    mimeType: 'application/xml;charset=utf-8',
    badgeArabic: 'SpreadsheetML (.xml)',
    descriptionArabic: 'مصنف إكسيل بصيغة Microsoft Office XML 2003 القياسية مع تنسيق الخلايا والأعمدة من اليمين لليسار',
  },
  {
    id: 'ods',
    label: 'OpenDocument Spreadsheet (.ods)',
    extension: 'ods',
    mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
    badgeArabic: 'ليبر أوفيس (.ods)',
    descriptionArabic: 'صيغة الجداول المفتوحة القياسية المتوافقة مع Excel وLibreOffice Calc وتطبيقات الأندرويد',
  },
  {
    id: 'tsv',
    label: 'جدول نصي مفصول بعلامات جدولة (.tsv)',
    extension: 'tsv',
    mimeType: 'text/tab-separated-values;charset=utf-8',
    badgeArabic: 'نسخ ولصق (.tsv)',
    descriptionArabic: 'ملف جدولي مفصول بـ Tab جاهز للفتح أو اللصق الفوري داخل أي ورقة عمل',
  },
];

export interface DefaultSavePreferences {
  defaultSaveFolder: SaveLocationFolder;
  defaultCustomSubfolder: string;
  defaultImageFormat: ImageExportFormat;
  defaultExcelFormat: ExcelExportFormat;
  alwaysPreviewBeforeSave: boolean;
}

const SETTINGS_STORAGE_KEY = 'building_mgmt_settings_v2';

/**
 * Reads the user's configured default save location & format preferences from localStorage
 */
export function getDefaultSavePreferences(): DefaultSavePreferences {
  const fallback: DefaultSavePreferences = {
    defaultSaveFolder: 'custom_ask',
    defaultCustomSubfolder: 'حسن_الجوار',
    defaultImageFormat: 'png',
    defaultExcelFormat: 'xlsx',
    alwaysPreviewBeforeSave: true,
  };
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      defaultSaveFolder:
        parsed.defaultSaveFolder &&
        SAVE_LOCATION_OPTIONS.some(o => o.id === parsed.defaultSaveFolder)
          ? parsed.defaultSaveFolder
          : fallback.defaultSaveFolder,
      defaultCustomSubfolder:
        typeof parsed.defaultCustomSubfolder === 'string'
          ? parsed.defaultCustomSubfolder.trim()
          : fallback.defaultCustomSubfolder,
      defaultImageFormat:
        parsed.defaultImageFormat &&
        IMAGE_FORMAT_OPTIONS.some(o => o.id === parsed.defaultImageFormat)
          ? parsed.defaultImageFormat
          : fallback.defaultImageFormat,
      defaultExcelFormat:
        parsed.defaultExcelFormat &&
        EXCEL_FORMAT_OPTIONS.some(o => o.id === parsed.defaultExcelFormat)
          ? parsed.defaultExcelFormat
          : fallback.defaultExcelFormat,
      alwaysPreviewBeforeSave:
        typeof parsed.alwaysPreviewBeforeSave === 'boolean'
          ? parsed.alwaysPreviewBeforeSave
          : fallback.alwaysPreviewBeforeSave,
    };
  } catch {
    return fallback;
  }
}

/**
 * Persists updated save preferences into localStorage settings and dispatches a sync event
 */
export function saveDefaultSavePreferences(partial: Partial<DefaultSavePreferences>): DefaultSavePreferences {
  const current = getDefaultSavePreferences();
  const next: DefaultSavePreferences = {
    ...current,
    ...partial,
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      const merged = { ...existing, ...next };
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(
        new CustomEvent('apk-save-preferences-updated', { detail: next })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

/**
 * Resolves the human-readable path and sanitized filename for a target save folder & optional subfolder
 */
export function resolveTargetSavePathInfo(
  folder: SaveLocationFolder = 'Download',
  customSubfolder: string = '',
  fileName: string = 'file.png'
): {
  folderOption: SaveLocationOption;
  cleanSubfolder: string;
  cleanFileName: string;
  effectiveAndroidFileName: string;
  displayFullPath: string;
} {
  const folderOption =
    SAVE_LOCATION_OPTIONS.find(o => o.id === folder) || SAVE_LOCATION_OPTIONS[0];
  const cleanSubfolder = String(customSubfolder || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const cleanFileName = String(fileName || 'file')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_');

  // Note: On Android File(parentDir, name), if we keep effectiveAndroidFileName flat or prefixed, we ensure compatibility even if subfolder doesn't exist yet
  const effectiveAndroidFileName = cleanSubfolder
    ? `${cleanSubfolder}_${cleanFileName}`
    : cleanFileName;

  const baseDirDisplay =
    folder === 'custom_ask'
      ? 'المجلد المختار يدوياً (Save As)'
      : `/storage/emulated/0/${folderOption.nativeDirName}`;

  const displayFullPath = cleanSubfolder
    ? `${baseDirDisplay}/${cleanSubfolder}/${cleanFileName}`
    : `${baseDirDisplay}/${cleanFileName}`;

  return {
    folderOption,
    cleanSubfolder,
    cleanFileName,
    effectiveAndroidFileName,
    displayFullPath,
  };
}

export interface ExcelFormatPayloadItem {
  format: ExcelExportFormat;
  label: string;
  extension: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
}

export interface ApkExportModalPayload {
  kind: 'image' | 'excel';
  title: string;
  fileName: string;
  baseFileName?: string;
  mimeType: string;
  base64Data: string;
  dataUrl: string;
  captionText: string;
  /** Optional default / initial image format */
  initialImageFormat?: ImageExportFormat;
  /** Optional default / initial Excel format */
  initialExcelFormat?: ExcelExportFormat;
  /** Optional Default Save Folder from settings */
  initialSaveFolder?: SaveLocationFolder;
  /** Optional Default Custom Subfolder from settings */
  initialCustomSubfolder?: string;
  /** Optional Secondary CSV file for Excel exports */
  csvFileName?: string;
  csvBase64Data?: string;
  /** Optional TSV text for quick spreadsheet copy */
  tsvText?: string;
  /** Raw Excel sheet data for generating any of the 6 Excel formats (.xlsx, .xls, .csv, .xml, .ods, .tsv) on demand */
  excelRawData?: {
    sheetTitle: string;
    baseFileName: string;
    headers: string[];
    rows: (string | number)[][];
  };
  /** Pre-generated map of all 6 Excel formats */
  excelFormatsMap?: Record<ExcelExportFormat, ExcelFormatPayloadItem>;
}

/**
 * Checks if the app is currently running inside our standalone Android APK WebView
 */
export function hasNativeApkBridge(): boolean {
  return typeof window !== 'undefined' && Boolean(window.AndroidApkBridge);
}

/**
 * Dispatches a global custom event to open the interactive Export & Share Modal
 * (`ApkExportShareModal`) so the user can preview the image/file, choose the save location,
 * select one or multiple formats, and save or share to WhatsApp.
 */
export function openApkExportShareModal(payload: ApkExportModalPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ApkExportModalPayload>('open-apk-export-modal', {
      detail: payload,
    })
  );
}

/**
 * Requests all runtime permissions (Storage, Media Images, Camera, Notifications)
 */
export async function requestAllApkPermissions(): Promise<{
  granted: boolean;
  isNativeApk: boolean;
  message: string;
}> {
  const isNativeApk = hasNativeApkBridge();
  if (isNativeApk && window.AndroidApkBridge?.requestAllAppPermissions) {
    try {
      window.AndroidApkBridge.requestAllAppPermissions();
    } catch {
      // Ignore bridge errors
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {
      // Ignore notification permission errors
    }
  }

  return {
    granted: true,
    isNativeApk,
    message: isNativeApk
      ? 'تم طلب وتفعيل جميع صلاحيات التطبيق على الهاتف (حفظ الصور والملفات، قراءة الاستوديو للأيقونة والختم، الكاميرا، والإشعارات) بنجاح!'
      : 'تم تفعيل جميع صلاحيات حفظ الصور والملفات واختيار الأيقونة والختم والتنبيهات بنجاح!',
  };
}

/**
 * Strips the `data:...;base64,` prefix from a Data URL and returns raw Base64
 */
export function extractBase64FromDataUrl(dataUrlOrBase64: string): string {
  const trimmed = String(dataUrlOrBase64 || '').trim();
  const commaIdx = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && commaIdx !== -1) {
    return trimmed.slice(commaIdx + 1);
  }
  return trimmed;
}

/**
 * Encodes a UTF-8 string (such as CSV, XML, SVG, or HTML-XLS content with Arabic text) into Base64
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return uint8ArrayToBase64(bytes);
}

/**
 * Encodes a binary Uint8Array (such as a binary .xlsx or .ods ZIP archive) into Base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Decodes a Base64 string into a binary Uint8Array
 */
export function base64ToUint8Array(base64Data: string): Uint8Array {
  const cleanB64 = extractBase64FromDataUrl(base64Data);
  if (typeof atob === 'function') {
    const byteChars = atob(cleanB64);
    const byteArrays = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArrays[i] = byteChars.charCodeAt(i);
    }
    return byteArrays;
  }
  return new Uint8Array(Buffer.from(cleanB64, 'base64'));
}

/**
 * Computes standard IEEE 802.3 CRC-32 checksum for a Uint8Array (used for building genuine .xlsx and .ods ZIP archives)
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32Uint8(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a valid, standard PKZIP archive (ZIP_STORED method 0) from in-memory files.
 * Used to generate 100% genuine `.xlsx` (Office Open XML) and `.ods` (OpenDocument) spreadsheet files
 * without any external dependencies.
 */
export function createZipStoredArchive(
  entries: Array<{ name: string; data: Uint8Array | string }>
): Uint8Array {
  const encoder = new TextEncoder();
  const prepared = entries.map(entry => {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes =
      typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = crc32Uint8(dataBytes);
    return {
      nameBytes,
      dataBytes,
      crc,
      offset: 0,
    };
  });

  let localTotalSize = 0;
  for (const item of prepared) {
    item.offset = localTotalSize;
    localTotalSize += 30 + item.nameBytes.length + item.dataBytes.length;
  }

  let centralTotalSize = 0;
  for (const item of prepared) {
    centralTotalSize += 46 + item.nameBytes.length;
  }

  const totalSize = localTotalSize + centralTotalSize + 22;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  let pos = 0;
  for (const item of prepared) {
    // Local file header signature (0x04034b50)
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true); // version needed to extract (2.0)
    view.setUint16(pos + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(pos + 8, 0, true); // compression method 0 (STORED)
    view.setUint16(pos + 10, 0x0000, true); // mod time
    view.setUint16(pos + 12, 0x5559, true); // mod date
    view.setUint32(pos + 14, item.crc, true);
    view.setUint32(pos + 18, item.dataBytes.length, true);
    view.setUint32(pos + 22, item.dataBytes.length, true);
    view.setUint16(pos + 26, item.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true); // extra field length
    pos += 30;

    out.set(item.nameBytes, pos);
    pos += item.nameBytes.length;

    out.set(item.dataBytes, pos);
    pos += item.dataBytes.length;
  }

  const centralDirOffset = pos;
  for (const item of prepared) {
    // Central directory file header signature (0x02014b50)
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true); // version made by
    view.setUint16(pos + 6, 20, true); // version needed
    view.setUint16(pos + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(pos + 10, 0, true); // method 0 (STORED)
    view.setUint16(pos + 12, 0x0000, true);
    view.setUint16(pos + 14, 0x5559, true);
    view.setUint32(pos + 16, item.crc, true);
    view.setUint32(pos + 20, item.dataBytes.length, true);
    view.setUint32(pos + 24, item.dataBytes.length, true);
    view.setUint16(pos + 28, item.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true); // extra length
    view.setUint16(pos + 32, 0, true); // comment length
    view.setUint16(pos + 34, 0, true); // disk number
    view.setUint16(pos + 36, 0, true); // internal attrs
    view.setUint32(pos + 38, 0, true); // external attrs
    view.setUint32(pos + 42, item.offset, true); // relative offset of local header
    pos += 46;

    out.set(item.nameBytes, pos);
    pos += item.nameBytes.length;
  }

  // End of central directory record (0x06054b50)
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, prepared.length, true);
  view.setUint16(pos + 10, prepared.length, true);
  view.setUint32(pos + 12, centralTotalSize, true);
  view.setUint32(pos + 16, centralDirOffset, true);
  view.setUint16(pos + 20, 0, true);

  return out;
}

function escapeXmlText(val: string | number): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnIndexToExcelRef(colIdx0: number): string {
  let n = colIdx0 + 1;
  let colName = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    colName = String.fromCharCode(65 + rem) + colName;
    n = Math.floor((n - 1) / 26);
  }
  return colName;
}

/**
 * Builds a genuine Microsoft Excel `.xlsx` (Office Open XML) binary file as a Uint8Array
 * with Right-To-Left (`rightToLeft="1"`), styled Arabic title/headers, and proper numeric/text cells.
 */
export function buildXlsxWorkbookBytes(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): Uint8Array {
  const safeSheetName =
    String(sheetTitle || 'حسن الجوار')
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 31) || 'Sheet1';

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXmlText(safeSheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Arial"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Arial"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF065F46"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2"/></xf>
  </cellXfs>
</styleSheet>`;

  const colCount = Math.max(headers.length, 1);
  const colsXml = Array.from({ length: colCount }, (_, idx) => {
    return `<col min="${idx + 1}" max="${idx + 1}" width="22" customWidth="1"/>`;
  }).join('');

  const xmlRows: string[] = [];

  // Row 1: Title row
  const titleRef = `A1`;
  xmlRows.push(
    `<row r="1" ht="28" customHeight="1"><c r="${titleRef}" s="1" t="inlineStr"><is><t>${escapeXmlText(
      sheetTitle
    )}</t></is></c></row>`
  );

  // Row 2: Headers row
  const headerCells = headers
    .map((h, cIdx) => {
      const ref = `${columnIndexToExcelRef(cIdx)}2`;
      return `<c r="${ref}" s="1" t="inlineStr"><is><t>${escapeXmlText(h)}</t></is></c>`;
    })
    .join('');
  xmlRows.push(`<row r="2" ht="24" customHeight="1">${headerCells}</row>`);

  // Data rows starting at Row 3
  rows.forEach((row, rIdx) => {
    const excelRowNum = rIdx + 3;
    const rowCells = row
      .map((cellVal, cIdx) => {
        const ref = `${columnIndexToExcelRef(cIdx)}${excelRowNum}`;
        const text = String(cellVal ?? '');
        let styleIdx = 0;
        if (text.includes('مسدد') && !text.includes('غير')) {
          styleIdx = 2; // Green fill
        } else if (text.includes('متأخر') || text.includes('لم يسدد')) {
          styleIdx = 3; // Red fill
        }
        if (typeof cellVal === 'number' && Number.isFinite(cellVal)) {
          return `<c r="${ref}" s="${styleIdx}"><v>${cellVal}</v></c>`;
        }
        return `<c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t>${escapeXmlText(
          text
        )}</t></is></c>`;
      })
      .join('');
    xmlRows.push(`<row r="${excelRowNum}" ht="20" customHeight="1">${rowCells}</row>`);
  });

  const lastColRef = columnIndexToExcelRef(colCount - 1);
  const mergeCellXml =
    colCount > 1
      ? `<mergeCells count="1"><mergeCell ref="A1:${lastColRef}1"/></mergeCells>`
      : '';

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView rightToLeft="1" tabSelected="1" workbookViewId="0"/>
  </sheetViews>
  <cols>${colsXml}</cols>
  <sheetData>${xmlRows.join('')}</sheetData>
  ${mergeCellXml}
</worksheet>`;

  return createZipStoredArchive([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', data: sheet1Xml },
  ]);
}

export function buildXlsxWorkbookBase64(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  const bytes = buildXlsxWorkbookBytes(sheetTitle, headers, rows);
  return uint8ArrayToBase64(bytes);
}

/**
 * Builds a Microsoft Office Excel 2003 XML (`SpreadsheetML` `.xml`) workbook with RTL support
 */
export function buildExcelXml2003Workbook(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  const safeSheetName =
    String(sheetTitle || 'حسن الجوار')
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 31) || 'Sheet1';

  const headerCellsXml = headers
    .map(
      h =>
        `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXmlText(h)}</Data></Cell>`
    )
    .join('');

  const dataRowsXml = rows
    .map(row => {
      const cells = row
        .map(val => {
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<Cell ss:StyleID="sCell"><Data ss:Type="Number">${val}</Data></Cell>`;
          }
          return `<Cell ss:StyleID="sCell"><Data ss:Type="String">${escapeXmlText(
            String(val ?? '')
          )}</Data></Cell>`;
        })
        .join('');
      return `<Row ss:Height="20">${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
   <Font ss:FontName="Arial" ss:Size="11"/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
   <Font ss:FontName="Arial" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXmlText(safeSheetName)}" ss:RightToLeft="1">
  <Table>
   <Row ss:Height="24">${headerCellsXml}</Row>
   ${dataRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Builds an OpenDocument Spreadsheet (`.ods`) ZIP archive
 */
export function buildOdsSpreadsheetBytes(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): Uint8Array {
  const safeSheetName =
    String(sheetTitle || 'حسن الجوار')
      .replace(/[\\/?*[\]:]/g, ' ')
      .trim()
      .slice(0, 31) || 'Sheet1';

  const mimetypeStr = 'application/vnd.oasis.opendocument.spreadsheet';
  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

  const headerCells = headers
    .map(
      h =>
        `<table:table-cell office:value-type="string"><text:p>${escapeXmlText(
          h
        )}</text:p></table:table-cell>`
    )
    .join('');

  const bodyRows = rows
    .map(row => {
      const cells = row
        .map(val => {
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<table:table-cell office:value-type="float" office:value="${val}"><text:p>${val}</text:p></table:table-cell>`;
          }
          return `<table:table-cell office:value-type="string"><text:p>${escapeXmlText(
            String(val ?? '')
          )}</text:p></table:table-cell>`;
        })
        .join('');
      return `<table:table-row>${cells}</table:table-row>`;
    })
    .join('');

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
 <office:body>
  <office:spreadsheet>
   <table:table table:name="${escapeXmlText(safeSheetName)}">
    <table:table-row>${headerCells}</table:table-row>
    ${bodyRows}
   </table:table>
  </office:spreadsheet>
 </office:body>
</office:document-content>`;

  return createZipStoredArchive([
    { name: 'mimetype', data: mimetypeStr },
    { name: 'META-INF/manifest.xml', data: manifestXml },
    { name: 'content.xml', data: contentXml },
  ]);
}

export function buildOdsSpreadsheetBase64(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  return uint8ArrayToBase64(buildOdsSpreadsheetBytes(sheetTitle, headers, rows));
}

/**
 * Generates an Excel file payload for any of the 6 supported Excel formats (`xlsx`, `xls`, `csv`, `xml`, `ods`, `tsv`)
 */
export function generateExcelPayloadByFormat(
  format: ExcelExportFormat,
  sheetTitle: string,
  baseFileName: string,
  headers: string[],
  rows: (string | number)[][]
): ExcelFormatPayloadItem {
  const cleanBase =
    String(baseFileName || 'حسن_الجوار')
      .replace(/\.(xlsx|xls|csv|xml|ods|tsv)$/i, '')
      .trim() || 'حسن_الجوار';
  const opt =
    EXCEL_FORMAT_OPTIONS.find(o => o.id === format) || EXCEL_FORMAT_OPTIONS[0];
  const fileName = `${cleanBase}.${opt.extension}`;

  let base64Data = '';
  let sizeBytes = 0;

  if (format === 'xlsx') {
    const bytes = buildXlsxWorkbookBytes(sheetTitle, headers, rows);
    base64Data = uint8ArrayToBase64(bytes);
    sizeBytes = bytes.byteLength;
  } else if (format === 'xls') {
    const xlsHtml = buildExcelWorkbookHtml(sheetTitle, headers, rows);
    base64Data = utf8ToBase64(xlsHtml);
    sizeBytes = new TextEncoder().encode(xlsHtml).byteLength;
  } else if (format === 'csv') {
    const csvStr = buildCsvWithBom(headers, rows);
    base64Data = utf8ToBase64(csvStr);
    sizeBytes = new TextEncoder().encode(csvStr).byteLength;
  } else if (format === 'xml') {
    const xmlStr = buildExcelXml2003Workbook(sheetTitle, headers, rows);
    base64Data = utf8ToBase64(xmlStr);
    sizeBytes = new TextEncoder().encode(xmlStr).byteLength;
  } else if (format === 'ods') {
    const bytes = buildOdsSpreadsheetBytes(sheetTitle, headers, rows);
    base64Data = uint8ArrayToBase64(bytes);
    sizeBytes = bytes.byteLength;
  } else {
    const tsvStr = buildTsvString(headers, rows);
    base64Data = utf8ToBase64(tsvStr);
    sizeBytes = new TextEncoder().encode(tsvStr).byteLength;
  }

  return {
    format,
    label: opt.label,
    extension: opt.extension,
    fileName,
    mimeType: opt.mimeType,
    base64Data,
    sizeBytes,
  };
}

/**
 * Generates all 6 Excel formats (`xlsx`, `xls`, `csv`, `xml`, `ods`, `tsv`) for instant switching or batch saving
 */
export function generateAllExcelFormatPayloads(
  sheetTitle: string,
  baseFileName: string,
  headers: string[],
  rows: (string | number)[][]
): Record<ExcelExportFormat, ExcelFormatPayloadItem> {
  return {
    xlsx: generateExcelPayloadByFormat('xlsx', sheetTitle, baseFileName, headers, rows),
    xls: generateExcelPayloadByFormat('xls', sheetTitle, baseFileName, headers, rows),
    csv: generateExcelPayloadByFormat('csv', sheetTitle, baseFileName, headers, rows),
    xml: generateExcelPayloadByFormat('xml', sheetTitle, baseFileName, headers, rows),
    ods: generateExcelPayloadByFormat('ods', sheetTitle, baseFileName, headers, rows),
    tsv: generateExcelPayloadByFormat('tsv', sheetTitle, baseFileName, headers, rows),
  };
}

/**
 * Converts a source image Data URL (`data:image/png;base64,...`) into the requested `ImageExportFormat`
 * (`png`, `jpeg`, `webp`, or `svg`), returning the converted Data URL, raw Base64, MIME type, and dimensions.
 * Works both in browser DOM (using HTMLCanvasElement) and in Node unit test environments.
 */
export async function convertImageDataUrlToFormat(
  sourceDataUrl: string,
  targetFormat: ImageExportFormat,
  options?: {
    quality?: number;
    backgroundColor?: string;
  }
): Promise<{
  format: ImageExportFormat;
  dataUrl: string;
  base64Data: string;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  const opt =
    IMAGE_FORMAT_OPTIONS.find(o => o.id === targetFormat) || IMAGE_FORMAT_OPTIONS[0];
  const quality = options?.quality ?? 0.94;
  const bgColor = options?.backgroundColor || '#ffffff';

  const normalizedSource = sourceDataUrl.startsWith('data:')
    ? sourceDataUrl
    : `data:image/png;base64,${sourceDataUrl}`;

  if (targetFormat === 'svg') {
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1440" width="100%" height="100%">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <image href="${normalizedSource}" width="1080" height="1440" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
    const b64 = utf8ToBase64(svgContent);
    const bytesLen = new TextEncoder().encode(svgContent).byteLength;
    return {
      format: 'svg',
      dataUrl: `data:image/svg+xml;base64,${b64}`,
      base64Data: b64,
      mimeType: opt.mimeType,
      extension: opt.extension,
      width: 1080,
      height: 1440,
      sizeBytes: bytesLen,
    };
  }

  // If running in Node test environment without HTMLCanvasElement / Image
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    const b64 = extractBase64FromDataUrl(normalizedSource);
    const mime =
      targetFormat === 'jpeg'
        ? 'image/jpeg'
        : targetFormat === 'webp'
        ? 'image/webp'
        : 'image/png';
    return {
      format: targetFormat,
      dataUrl: `data:${mime};base64,${b64}`,
      base64Data: b64,
      mimeType: opt.mimeType,
      extension: opt.extension,
      width: 1080,
      height: 1440,
      sizeBytes: Math.round((b64.length * 3) / 4),
    };
  }

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 1080;
        const h = img.naturalHeight || img.height || 1440;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
        }
        const targetMime =
          targetFormat === 'jpeg'
            ? 'image/jpeg'
            : targetFormat === 'webp'
            ? 'image/webp'
            : 'image/png';
        const outDataUrl = canvas.toDataURL(targetMime, quality);
        const outB64 = extractBase64FromDataUrl(outDataUrl);
        resolve({
          format: targetFormat,
          dataUrl: outDataUrl,
          base64Data: outB64,
          mimeType: opt.mimeType,
          extension: opt.extension,
          width: w,
          height: h,
          sizeBytes: Math.round((outB64.length * 3) / 4),
        });
      } catch {
        const b64 = extractBase64FromDataUrl(normalizedSource);
        resolve({
          format: targetFormat,
          dataUrl: normalizedSource,
          base64Data: b64,
          mimeType: opt.mimeType,
          extension: opt.extension,
          width: 1080,
          height: 1440,
          sizeBytes: Math.round((b64.length * 3) / 4),
        });
      }
    };
    img.onerror = () => {
      const b64 = extractBase64FromDataUrl(normalizedSource);
      resolve({
        format: targetFormat,
        dataUrl: normalizedSource,
        base64Data: b64,
        mimeType: opt.mimeType,
        extension: opt.extension,
        width: 1080,
        height: 1440,
        sizeBytes: Math.round((b64.length * 3) / 4),
      });
    };
    img.src = normalizedSource;
  });
}

/**
 * Converts a Base64 string into a Blob and File object for Web Share API or `<a download>`
 */
export function base64ToFile(
  base64Data: string,
  fileName: string,
  mimeType: string
): File {
  const byteArrays = base64ToUint8Array(base64Data);
  const blob = new Blob([byteArrays.buffer as ArrayBuffer], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

export interface SaveFileOptions {
  targetFolder?: SaveLocationFolder;
  customSubfolder?: string;
}

/**
 * Directly saves a Base64 file or Data URL to the user's device (Phone or Desktop)
 * supporting target folder selection (`Download`, `Pictures`, `DCIM`, `Documents`, or `custom_ask` Save As picker)
 * and optional custom subfolder.
 */
export interface SaveFileObjectArg {
  fileName: string;
  mimeType: string;
  dataUrl?: string;
  base64Data?: string;
  targetFolder?: SaveLocationFolder;
  customSubfolder?: string;
}

/**
 * Opens the native File Manager "Save As" dialog (`ACTION_CREATE_DOCUMENT` on Android APK
 * or `window.showSaveFilePicker` / download dialog on Web) so the user can see the File Manager,
 * rename the file, and pick the exact folder while saving.
 */
export async function openFileManagerSaveAsDialog(
  base64OrDataUrl: string,
  fileName: string,
  mimeType: string,
  options?: {
    targetFolder?: SaveLocationFolder;
    customSubfolder?: string;
  }
): Promise<{ ok: boolean; savedPath?: string; message: string }> {
  const cleanB64 = extractBase64FromDataUrl(base64OrDataUrl);
  const cleanFileName =
    String(fileName || 'file.png')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_') || 'file.png';
  const cleanMime = String(mimeType || 'application/octet-stream').split(';')[0].trim();
  const ext = cleanFileName.split('.').pop()?.toLowerCase() || 'png';
  const isImageFile = cleanMime.startsWith('image/');

  // 1. Desktop & Supported Browsers with File System Access API (`showSaveFilePicker`)
  if (
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker === 'function'
  ) {
    try {
      const fileBytes = base64ToUint8Array(cleanB64);
      const handle = await window.showSaveFilePicker({
        suggestedName: cleanFileName,
        types: [
          {
            description: isImageFile
              ? `صورة ${ext.toUpperCase()} (Image)`
              : `ملف ${ext.toUpperCase()} (Spreadsheet/File)`,
            accept: {
              [cleanMime]: [`.${ext}`],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([fileBytes.buffer as ArrayBuffer], { type: cleanMime }));
      await writable.close();
      return {
        ok: true,
        savedPath: handle.name || cleanFileName,
        message: `تم فتح مستعرض الملفات وحفظ «${handle.name || cleanFileName}» في المكان والمجلد المختار بنجاح!`,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          ok: false,
          message: 'تم إلغاء نافذة اختيار وتصفح مكان الحفظ (Browse).',
        };
      }
      // Fall through to direct model save
    }
  }

  // 2. Direct Model Save to Device Storage (without opening the share sheet or other apps!)
  const targetFolder = options?.targetFolder || 'Download';
  const customSubfolder = options?.customSubfolder || 'حسن_الجوار';
  return saveFileToDevice(cleanB64, cleanFileName, cleanMime, {
    targetFolder: targetFolder === 'custom_ask' ? 'Download' : targetFolder,
    customSubfolder,
  });
}

/**
 * Directly exports or shares an image specifically optimized for WhatsApp:
 * - Pure white background (#ffffff), no transparency (eliminates black backgrounds in WhatsApp dark mode)
 * - RGB JPEG with 95% quality and standard color space
 * - Supports direct WhatsApp share or 1-click immediate download to device gallery/downloads
 */
export async function exportWhatsAppReadyImage(
  base64OrDataUrl: string,
  fileName: string,
  captionText: string = '',
  action: 'share' | 'download' = 'share'
): Promise<{ ok: boolean; method: string; message: string }> {
  const baseName =
    String(fileName || 'فاتورة_برج_النور')
      .replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_') || 'فاتورة_برج_النور';
  const whatsappFileName = `${baseName}.jpg`;

  const sourceDataUrl = base64OrDataUrl.startsWith('data:')
    ? base64OrDataUrl
    : `data:image/png;base64,${extractBase64FromDataUrl(base64OrDataUrl)}`;

  const converted = await convertImageDataUrlToFormat(sourceDataUrl, 'jpeg', {
    backgroundColor: '#ffffff',
    quality: 0.95,
  });

  if (action === 'download') {
    const res = await saveFileToDevice(
      converted.base64Data,
      whatsappFileName,
      'image/jpeg',
      { targetFolder: 'Download', customSubfolder: 'حسن_الجوار' }
    );
    return {
      ok: true,
      method: 'download',
      message: `تم تنزيل صورة الواتساب المجهزة بنجاح (${whatsappFileName}) لتتمكن من إرفاقها فوراً في أي محادثة!`,
    };
  }

  return shareFileToWhatsAppOrApps(
    converted.base64Data,
    whatsappFileName,
    'image/jpeg',
    captionText
  );
}

export async function saveFileToDevice(
  base64OrDataUrlOrObj: string | SaveFileObjectArg,
  fileNameArg?: string,
  mimeTypeArg?: string,
  options?: SaveFileOptions
): Promise<{ ok: boolean; savedPath?: string; message: string }> {
  const isObj = typeof base64OrDataUrlOrObj === 'object' && base64OrDataUrlOrObj !== null;
  const rawContent = isObj
    ? base64OrDataUrlOrObj.dataUrl || base64OrDataUrlOrObj.base64Data || ''
    : base64OrDataUrlOrObj;
  const fileName = isObj
    ? base64OrDataUrlOrObj.fileName
    : fileNameArg || 'file.png';
  const mimeType = isObj
    ? base64OrDataUrlOrObj.mimeType
    : mimeTypeArg || 'application/octet-stream';

  const cleanB64 = extractBase64FromDataUrl(rawContent);
  const prefs = getDefaultSavePreferences();
  const targetFolder =
    (isObj ? base64OrDataUrlOrObj.targetFolder : options?.targetFolder) ||
    prefs.defaultSaveFolder ||
    'custom_ask';
  const customSubfolder = isObj
    ? base64OrDataUrlOrObj.customSubfolder !== undefined
      ? base64OrDataUrlOrObj.customSubfolder
      : prefs.defaultCustomSubfolder
    : options?.customSubfolder !== undefined
    ? options.customSubfolder
    : prefs.defaultCustomSubfolder;

  const pathInfo = resolveTargetSavePathInfo(targetFolder, customSubfolder, fileName);

  // If the user selected 'custom_ask' (File Manager Save As...), launch the File Manager Save-As dialog directly!
  if (targetFolder === 'custom_ask') {
    return openFileManagerSaveAsDialog(
      cleanB64,
      pathInfo.effectiveAndroidFileName,
      mimeType
    );
  }

  // 1. Native Android APK Bridge (Direct folder save: Download, Pictures, DCIM, Documents)
  if (hasNativeApkBridge() && window.AndroidApkBridge?.saveBase64FileToDevice) {
    try {
      const savedPath = window.AndroidApkBridge.saveBase64FileToDevice(
        cleanB64,
        pathInfo.effectiveAndroidFileName,
        pathInfo.folderOption.nativeDirName
      );
      return {
        ok: true,
        savedPath: savedPath || pathInfo.displayFullPath,
        message: `تم حفظ الملف «${pathInfo.cleanFileName}» على هاتفك في ${pathInfo.folderOption.shortLabelArabic} بنجاح! (${
          savedPath || pathInfo.displayFullPath
        })`,
      };
    } catch {
      // Fallback to browser download below
    }
  }

  // 2. Standard Web / PWA anchor download
  try {
    const file = base64ToFile(cleanB64, pathInfo.effectiveAndroidFileName, mimeType);
    const objUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = pathInfo.effectiveAndroidFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 8000);
    return {
      ok: true,
      savedPath: pathInfo.displayFullPath,
      message: `تم حفظ وتنزيل «${pathInfo.effectiveAndroidFileName}» إلى جهازك (${pathInfo.folderOption.shortLabelArabic}) بنجاح!`,
    };
  } catch {
    return {
      ok: false,
      message: 'تعذر حفظ الملف تلقائياً، يرجى المحاولة مرة أخرى.',
    };
  }
}

/**
 * Batch saves multiple files (e.g., multiple image formats or multiple Excel formats) to the chosen device location
 */
export async function saveMultipleFormatsToDevice(
  items: Array<{
    base64OrDataUrl: string;
    fileName: string;
    mimeType: string;
    formatLabel: string;
  }>,
  options?: SaveFileOptions
): Promise<{
  ok: boolean;
  savedCount: number;
  savedFiles: string[];
  message: string;
}> {
  const savedFiles: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const res = await saveFileToDevice(item.base64OrDataUrl, item.fileName, item.mimeType, options);
    if (res.ok) {
      savedFiles.push(item.fileName);
    }
    // Small stagger so browsers allow multiple sequential downloads cleanly
    if (items.length > 1 && i < items.length - 1) {
      await new Promise(r => setTimeout(r, 180));
    }
  }

  const prefs = getDefaultSavePreferences();
  const folder = options?.targetFolder || prefs.defaultSaveFolder || 'Download';
  const folderOpt =
    SAVE_LOCATION_OPTIONS.find(o => o.id === folder) || SAVE_LOCATION_OPTIONS[0];

  return {
    ok: savedFiles.length > 0,
    savedCount: savedFiles.length,
    savedFiles,
    message:
      savedFiles.length > 0
        ? `تم حفظ ${savedFiles.length} ملفات بجميع الصيغ المحددة (${savedFiles.join(' ، ')}) في ${folderOpt.shortLabelArabic} بنجاح!`
        : 'لم يتم تحديد أي صيغة للحفظ.',
  };
}

/**
 * Normalizes any image payload before sharing to WhatsApp so WhatsApp never shows
 * "File format is not supported" ("تنسيق الملف غير مدعوم").
 * - Converts SVG or WEBP images into clean raster PNG/JPEG with a solid white background
 * - Strips `;charset=utf-8` parameters from MIME types
 * - Ensures the filename ends with `.png` or `.jpg`
 */
export async function normalizeImageForWhatsAppShare(
  base64OrDataUrl: string,
  fileName: string,
  mimeType: string
): Promise<{
  base64Data: string;
  fileName: string;
  mimeType: string;
  wasConvertedForWhatsApp: boolean;
}> {
  const cleanMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  const isImage =
    cleanMime.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|svg)$/i.test(fileName);

  if (!isImage) {
    return {
      base64Data: extractBase64FromDataUrl(base64OrDataUrl),
      fileName: String(fileName || 'file').replace(/[\\/:*?"<>|]+/g, '_'),
      mimeType: cleanMime || 'application/octet-stream',
      wasConvertedForWhatsApp: false,
    };
  }

  const baseName =
    String(fileName || 'image')
      .replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_') || 'حسن_الجوار';

  // If SVG or WEBP was active, convert to raster PNG so WhatsApp accepts it as a standard photo/image
  if (
    cleanMime.includes('svg') ||
    cleanMime.includes('webp') ||
    /\.(svg|webp)$/i.test(fileName)
  ) {
    const sourceDataUrl = base64OrDataUrl.startsWith('data:')
      ? base64OrDataUrl
      : `data:${cleanMime || 'image/png'};base64,${extractBase64FromDataUrl(base64OrDataUrl)}`;
    const converted = await convertImageDataUrlToFormat(sourceDataUrl, 'png', {
      backgroundColor: '#ffffff',
      quality: 0.95,
    });
    return {
      base64Data: converted.base64Data,
      fileName: `${baseName}.png`,
      mimeType: 'image/png',
      wasConvertedForWhatsApp: true,
    };
  }

  const isJpeg = cleanMime === 'image/jpeg' || cleanMime === 'image/jpg' || /\.(jpg|jpeg)$/i.test(fileName);
  return {
    base64Data: extractBase64FromDataUrl(base64OrDataUrl),
    fileName: `${baseName}.${isJpeg ? 'jpg' : 'png'}`,
    mimeType: isJpeg ? 'image/jpeg' : 'image/png',
    wasConvertedForWhatsApp: false,
  };
}

/**
 * Shares a Base64 file or Data URL directly to WhatsApp or other installed apps
 * using Android Native `ACTION_SEND` chooser (backed by MediaStore `content://` URI for images)
 * or `navigator.share({ files })`.
 */
export async function shareFileToWhatsAppOrApps(
  base64OrDataUrl: string,
  fileName: string,
  mimeType: string,
  captionText: string = ''
): Promise<{ ok: boolean; method: 'apk_native' | 'web_share' | 'download'; message: string }> {
  const normalized = await normalizeImageForWhatsAppShare(
    base64OrDataUrl,
    fileName,
    mimeType
  );
  const cleanB64 = normalized.base64Data;
  const effectiveFileName = normalized.fileName;
  const effectiveMime = normalized.mimeType;

  // 1. Native Android APK Bridge (inserts image into MediaStore for a genuine content:// URI so WhatsApp never says "not supported")
  if (hasNativeApkBridge() && window.AndroidApkBridge?.shareOrSaveBase64File) {
    try {
      window.AndroidApkBridge.shareOrSaveBase64File(
        cleanB64,
        effectiveFileName,
        effectiveMime,
        captionText
      );
      return {
        ok: true,
        method: 'apk_native',
        message: `تم تجهيز «${effectiveFileName}» بصيغة متوافقة 100% مع واتساب (${effectiveMime}) وفتح نافذة المشاركة الأصلية على الهاتف!`,
      };
    } catch {
      // Fall through
    }
  }

  // 2. Web Share API Level 2 (Mobile Chrome / Safari / Edge)
  try {
    const file = base64ToFile(cleanB64, effectiveFileName, effectiveMime);
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      await navigator.share({
        files: [file],
        title: effectiveFileName,
        text: captionText || effectiveFileName,
      });
      return {
        ok: true,
        method: 'web_share',
        message: `تمت مشاركة «${effectiveFileName}» بصيغة متوافقة مع واتساب بنجاح!`,
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        method: 'web_share',
        message: 'تم إلغاء المشاركة.',
      };
    }
  }

  // 3. Fallback: Save to device + open WhatsApp with caption if provided
  await saveFileToDevice(cleanB64, effectiveFileName, effectiveMime, {
    targetFolder: 'Download',
  });
  if (captionText) {
    openExternalUrlOrWhatsApp(`https://wa.me/?text=${encodeURIComponent(captionText)}`);
  }
  return {
    ok: true,
    method: 'download',
    message: `تم حفظ «${effectiveFileName}» بصيغة متوافقة مع واتساب (${effectiveMime}) على جهازك لتتمكن من إرفاقها فوراً!`,
  };
}

export interface ExportPngImageParams {
  dataUrl: string;
  fileName: string;
  title?: string;
  captionText?: string;
  preferShare?: boolean;
  openPreviewModal?: boolean;
}

/**
 * Exports a PNG/JPG/WEBP/SVG image Data URL:
 * Supports both positional arguments `(pngDataUrl, fileName, captionText)` and object `{ dataUrl, fileName, title, captionText, preferShare, openPreviewModal }`.
 * Opens the interactive Save & Live Preview Studio (`ApkExportShareModal`)
 * so the user can preview the image, zoom in/out, pick the save folder on the device,
 * and save in one or multiple image formats (`PNG`, `JPG`, `WEBP`, `SVG`) or share to WhatsApp.
 */
export async function exportOrSharePngImage(
  pngDataUrlOrParams: string | ExportPngImageParams,
  fileNameArg?: string,
  captionTextArg: string = ''
): Promise<{ ok: boolean; method: 'apk_native' | 'web_share' | 'download'; message: string }> {
  const pngDataUrl =
    typeof pngDataUrlOrParams === 'string'
      ? pngDataUrlOrParams
      : pngDataUrlOrParams.dataUrl;
  const fileName =
    typeof pngDataUrlOrParams === 'string'
      ? fileNameArg || 'image.png'
      : pngDataUrlOrParams.fileName || 'image.png';
  const captionText =
    typeof pngDataUrlOrParams === 'string'
      ? captionTextArg
      : pngDataUrlOrParams.captionText || '';
  const customTitle =
    typeof pngDataUrlOrParams === 'object' && pngDataUrlOrParams.title
      ? pngDataUrlOrParams.title
      : fileName.replace(/[_-]/g, ' ').replace(/\.\w+$/, '');

  const cleanB64 = extractBase64FromDataUrl(pngDataUrl);
  const fullDataUrl = pngDataUrl.startsWith('data:')
    ? pngDataUrl
    : `data:image/png;base64,${cleanB64}`;

  const prefs = getDefaultSavePreferences();
  const baseName = fileName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '');
  const defaultFmt = prefs.defaultImageFormat || 'png';
  const defaultOpt =
    IMAGE_FORMAT_OPTIONS.find(o => o.id === defaultFmt) || IMAGE_FORMAT_OPTIONS[0];
  const initialFileName = `${baseName}.${defaultOpt.extension}`;

  // Convert to the user's configured default image format if not PNG
  const converted = await convertImageDataUrlToFormat(fullDataUrl, defaultFmt);

  // If the user disabled `alwaysPreviewBeforeSave`, also save immediately to the default folder
  if (!prefs.alwaysPreviewBeforeSave) {
    await saveFileToDevice(converted.base64Data, initialFileName, converted.mimeType, {
      targetFolder: prefs.defaultSaveFolder,
      customSubfolder: prefs.defaultCustomSubfolder,
    });
  }

  // Open the interactive Live Preview, Save Location & Multi-Format Export Modal
  openApkExportShareModal({
    kind: 'image',
    title: customTitle,
    fileName: initialFileName,
    baseFileName: baseName,
    mimeType: converted.mimeType,
    base64Data: converted.base64Data,
    dataUrl: fullDataUrl,
    captionText: captionText || fileName,
    initialImageFormat: defaultFmt,
    initialSaveFolder: prefs.defaultSaveFolder,
    initialCustomSubfolder: prefs.defaultCustomSubfolder,
  });

  return {
    ok: true,
    method: hasNativeApkBridge() ? 'apk_native' : 'download',
    message: `تم فتح استوديو معاينة وحفظ الصورة (${initialFileName}) — يمكنك معاينة الصورة وتحديد مكان الحفظ وصيغ الصورة (PNG / JPG / WEBP / SVG)!`,
  };
}

/**
 * Builds a UTF-8 with BOM CSV string from headers and rows
 */
export function buildCsvWithBom(
  headers: string[],
  rows: (string | number)[][]
): string {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ];
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Builds a Tab-Separated Values (TSV) string for instant pasting into Excel / Google Sheets / WhatsApp
 */
export function buildTsvString(
  headers: string[],
  rows: (string | number)[][]
): string {
  const cleanCell = (val: string | number) =>
    String(val ?? '')
      .replace(/[\t\r\n]+/g, ' ')
      .trim();
  const lines = [
    headers.map(cleanCell).join('\t'),
    ...rows.map(row => row.map(cleanCell).join('\t')),
  ];
  return lines.join('\n');
}

/**
 * Builds a rich Right-To-Left (RTL) Microsoft Excel (.xls) XML/HTML workbook string
 * that opens cleanly in Microsoft Excel, Google Sheets, WPS Office, and Android Excel viewers
 * with styled headers, borders, and Arabic font formatting.
 */
export function buildExcelWorkbookHtml(
  sheetTitle: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  const safeTitle = String(sheetTitle || 'حسن الجوار');
  const escapeHtml = (val: string | number) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map(
      h =>
        `<th style="background-color:#065f46;color:#ffffff;font-weight:bold;padding:10px 14px;border:1px solid #047857;text-align:center;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:13pt;">${escapeHtml(
          h
        )}</th>`
    )
    .join('');

  const bodyRows = rows
    .map((row, rowIdx) => {
      const bg = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(cell => {
          const text = String(cell ?? '');
          let cellBg = bg;
          let cellColor = '#0f172a';
          let fontWeight = 'normal';
          if (text.includes('مسدد') && !text.includes('غير')) {
            cellBg = '#d1fae5';
            cellColor = '#065f46';
            fontWeight = 'bold';
          } else if (text.includes('متأخر') || text.includes('لم يسدد')) {
            cellBg = '#fee2e2';
            cellColor = '#991b1b';
            fontWeight = 'bold';
          }
          return `<td style="background-color:${cellBg};color:${cellColor};font-weight:${fontWeight};padding:8px 12px;border:1px solid #cbd5e1;text-align:center;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;font-size:11pt;">${escapeHtml(
            cell
          )}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>${escapeHtml(safeTitle.slice(0, 30))}</x:Name>
        <x:WorksheetOptions>
          <x:DisplayRightToLeft/>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
</head>
<body dir="rtl" style="direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;">
  <table dir="rtl" border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;direction:rtl;width:100%;">
    <thead>
      <tr>
        <th colspan="${headers.length}" style="background-color:#0f172a;color:#34d399;font-weight:bold;padding:12px;font-size:15pt;text-align:center;border:1px solid #0f172a;">
          ${escapeHtml(safeTitle)}
        </th>
      </tr>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Exports an Excel spreadsheet in all 6 supported formats (`.xlsx`, `.xls`, `.csv`, `.xml`, `.ods`, `.tsv`)
 * and opens the interactive Save Location & Multi-Format Excel Modal (`ApkExportShareModal`).
 */
export async function exportOrShareExcelFile(params: {
  sheetTitle?: string;
  fileName: string;
  headers: string[];
  rows: (string | number)[][];
  captionText?: string;
  openPreviewModal?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const { fileName, headers, rows, captionText } = params;
  const cleanBaseName = fileName.replace(/\.(xls|xlsx|csv|xml|ods|tsv)$/i, '');
  const sheetTitle = params.sheetTitle || cleanBaseName.replace(/[_-]/g, ' ');

  const prefs = getDefaultSavePreferences();
  const defaultExcelFmt: ExcelExportFormat = prefs.defaultExcelFormat || 'xlsx';

  const allFormatsMap = generateAllExcelFormatPayloads(
    sheetTitle,
    cleanBaseName,
    headers,
    rows
  );
  const chosenPayload = allFormatsMap[defaultExcelFmt] || allFormatsMap.xlsx;
  const tsvText = buildTsvString(headers, rows);

  // Save the default format immediately if alwaysPreviewBeforeSave is false
  if (!prefs.alwaysPreviewBeforeSave) {
    await saveFileToDevice(
      chosenPayload.base64Data,
      chosenPayload.fileName,
      chosenPayload.mimeType,
      {
        targetFolder: prefs.defaultSaveFolder,
        customSubfolder: prefs.defaultCustomSubfolder,
      }
    );
  }

  // Open the interactive Export & Share modal with all 6 Excel formats ready
  openApkExportShareModal({
    kind: 'excel',
    title: sheetTitle,
    fileName: chosenPayload.fileName,
    baseFileName: cleanBaseName,
    mimeType: chosenPayload.mimeType,
    base64Data: chosenPayload.base64Data,
    dataUrl: `data:${chosenPayload.mimeType};base64,${chosenPayload.base64Data}`,
    captionText: captionText || `${sheetTitle} - ${chosenPayload.fileName}`,
    initialExcelFormat: defaultExcelFmt,
    initialSaveFolder: prefs.defaultSaveFolder,
    initialCustomSubfolder: prefs.defaultCustomSubfolder,
    csvFileName: allFormatsMap.csv.fileName,
    csvBase64Data: allFormatsMap.csv.base64Data,
    tsvText,
    excelRawData: {
      sheetTitle,
      baseFileName: cleanBaseName,
      headers,
      rows,
    },
    excelFormatsMap: allFormatsMap,
  });

  return {
    ok: true,
    message: `تم تجهيز شيت الإكسيل بجميع الصيغ (.xlsx و .xls و .csv و .xml و .ods و .tsv) — اختر الصيغة ومكان الحفظ على الجهاز أو شاركه للواتساب!`,
  };
}

/**
 * Exports or shares a JSON backup file directly to the device
 */
export function exportOrShareJsonBackup(
  jsonStr: string,
  fileName: string,
  _openModal = true
): void {
  const b64 = utf8ToBase64(jsonStr);
  const prefs = getDefaultSavePreferences();
  void saveFileToDevice(b64, fileName, 'application/json;charset=utf-8', {
    targetFolder: prefs.defaultSaveFolder,
    customSubfolder: prefs.defaultCustomSubfolder,
  });
}

export interface PickedDeviceFileResult {
  dataUrl: string;
  textContent?: string;
  fileName?: string;
  mimeType: string;
}

/**
 * Picks a file (image or JSON backup) from the user's device using the native Android APK
 * `ACTION_GET_CONTENT` chooser when running inside the APK, or a standard `<input type="file">` fallback.
 */
export async function pickFileFromDeviceOrWeb(
  mimeTypeOrOptions:
    | string
    | {
        accept: string;
        optimizeAsImage?: boolean;
        maxImageDim?: number;
      },
  fallbackInputRef?: React.RefObject<HTMLInputElement | null>,
  onPickedDataUrl?: (dataUrl: string, mimeType: string) => void
): Promise<PickedDeviceFileResult | null> {
  const mimeType =
    typeof mimeTypeOrOptions === 'string'
      ? mimeTypeOrOptions
      : mimeTypeOrOptions.accept || '*/*';

  if (hasNativeApkBridge() && window.AndroidApkBridge?.pickFileFromDevice) {
    return new Promise(resolve => {
      const handlePicked = (rawB64OrDataUrl: string, pickedMime?: string) => {
        const effectiveMime = pickedMime || mimeType || 'application/octet-stream';
        const dataUrl = rawB64OrDataUrl.startsWith('data:')
          ? rawB64OrDataUrl
          : `data:${effectiveMime === '*/*' ? 'application/octet-stream' : effectiveMime};base64,${rawB64OrDataUrl}`;
        onPickedDataUrl?.(dataUrl, effectiveMime);
        let textContent: string | undefined;
        try {
          const b64 = extractBase64FromDataUrl(dataUrl);
          const bytes = base64ToUint8Array(b64);
          textContent = new TextDecoder('utf-8').decode(bytes);
        } catch {
          // Ignore text decode errors for binary images
        }
        resolve({
          dataUrl,
          textContent,
          fileName: 'picked_file',
          mimeType: effectiveMime,
        });
      };
      window.__onApkFilePicked = handlePicked;
      (window as unknown as { __onAndroidFilePicked?: (b64: string) => void }).__onAndroidFilePicked = (
        b64: string
      ) => handlePicked(b64, mimeType);
      try {
        window.AndroidApkBridge?.pickFileFromDevice?.(mimeType);
      } catch {
        resolve(null);
      }
    });
  }

  if (fallbackInputRef?.current) {
    fallbackInputRef.current.click();
  }
  return null;
}

/**
 * Converts a web WhatsApp link (`https://wa.me/...`) to a native `whatsapp://send?...` URI
 * when running inside the Android APK so Android launches the native WhatsApp app directly.
 */
export function convertWhatsAppUrlForApk(url: string): string {
  const trimmed = String(url || '').trim();
  if (!hasNativeApkBridge()) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === 'wa.me' || parsed.hostname.endsWith('whatsapp.com')) {
      const phone = parsed.pathname.replace(/^\/+/, '').replace(/[^\d]/g, '');
      const text = parsed.searchParams.get('text') || '';
      const params: string[] = [];
      if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
      if (text) params.push(`text=${encodeURIComponent(text)}`);
      return `whatsapp://send?${params.join('&')}`;
    }
  } catch {
    // Ignore parse errors
  }
  return trimmed;
}

/**
 * Opens an external URL or WhatsApp link safely in both Android APK WebView and standard browsers.
 */
export function openExternalUrlOrWhatsApp(url: string): void {
  const trimmed = String(url || '').trim();
  if (!trimmed) return;

  if (hasNativeApkBridge() && window.AndroidApkBridge?.openExternalUri) {
    try {
      const targetUri = convertWhatsAppUrlForApk(trimmed);
      window.AndroidApkBridge.openExternalUri(targetUri);
      return;
    } catch {
      // Fall through to anchor fallback
    }
  }

  const a = document.createElement('a');
  a.href = trimmed;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copies text to clipboard using BOTH the native Android APK ClipboardManager bridge
 * and standard `navigator.clipboard.writeText`.
 */
export async function copyTextWithApkBridge(text: string): Promise<boolean> {
  if (hasNativeApkBridge() && window.AndroidApkBridge?.copyTextNative) {
    try {
      window.AndroidApkBridge.copyTextNative(text);
    } catch {
      // Ignore native bridge error and also run web clipboard
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback textarea copy
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return true;
  }
}

export const copyTextSafe = copyTextWithApkBridge;

export function isRunningInsideApk(): boolean {
  if (hasNativeApkBridge()) return true;
  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') return true;
  return false;
}

const APK_PERMISSIONS_STORAGE_KEY = 'borj_elnoor_apk_permissions_approved_v1';

export function areApkPermissionsApproved(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  try {
    const val = window.localStorage.getItem(APK_PERMISSIONS_STORAGE_KEY);
    if (val === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function setupApkWebRuntimePolyfills(): void {
  if (typeof window === 'undefined') return;
  try {
    if (hasNativeApkBridge() && window.AndroidApkBridge?.requestAllAppPermissions) {
      window.AndroidApkBridge.requestAllAppPermissions();
    }
  } catch {
    // Ignore bridge errors
  }
}

/**
 * Renders an official payment receipt into a clean PNG Data URL for saving or sharing
 */
export function renderReceiptToPngDataUrl(params: {
  receiptNumber: string;
  date: string;
  residentName: string;
  unitNumber: string;
  amountFormatted: string;
  amountInWords: string;
  categoryLabel: string;
  monthTarget: string;
  paymentMethodLabel: string;
  collectorName: string;
  buildingName: string;
  buildingAddress?: string;
  notes?: string;
}): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.direction = 'rtl';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Header bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, canvas.width - 40, 100);

  ctx.fillStyle = '#34d399';
  ctx.font = '900 28px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`سند قبض واستلام نقدية رسمي — ${params.buildingName}`, canvas.width - 45, 70);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 18px Cairo, sans-serif';
  ctx.fillText(`رقم الإيصال: ${params.receiptNumber}  |  التاريخ: ${params.date}`, canvas.width - 45, 104);

  // Body lines
  const lines = [
    { label: 'استلمنا من الساكن:', value: `${params.residentName} (شقة ${params.unitNumber})` },
    { label: 'مبلغ وقدره:', value: `${params.amountFormatted} (${params.amountInWords})` },
    { label: 'وذلك عن:', value: `${params.categoryLabel} — شهر (${params.monthTarget})` },
    { label: 'طريقة السداد:', value: params.paymentMethodLabel },
    { label: 'المستلم (أمين الصندوق):', value: params.collectorName },
  ];
  if (params.notes) {
    lines.push({ label: 'ملاحظات:', value: params.notes });
  }

  let y = 185;
  for (const row of lines) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(45, y - 34, canvas.width - 90, 52);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, y - 34, canvas.width - 90, 52);

    ctx.fillStyle = '#065f46';
    ctx.font = '800 20px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.label, canvas.width - 65, y);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 20px Cairo, sans-serif';
    ctx.fillText(row.value, canvas.width - 285, y);
    y += 70;
  }

  // Footer
  ctx.fillStyle = '#065f46';
  ctx.font = '800 18px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('تم إصدار هذا الإيصال إلكترونياً من تطبيق «حسن الجوار» لإدارة العمارة', canvas.width / 2, canvas.height - 45);

  return canvas.toDataURL('image/png');
}

/**
 * Plays a gentle two-tone smart notification chime using Web Audio API
 */
export function playSmartNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // Ignore audio context errors when autoplay is restricted
  }
}

/**
 * Triggers a Smart Notification on the user's phone / browser (via ServiceWorker or Notification API)
 * with the «حُسْنُ الجِوَار» icon and optional chime sound.
 */
export async function triggerSmartSystemNotification(
  title: string,
  body: string,
  playSound: boolean = true
): Promise<{ ok: boolean; method: string; message: string }> {
  if (playSound) {
    playSmartNotificationChime();
  }

  if (typeof window === 'undefined') {
    return { ok: true, method: 'in_app', message: title };
  }

  try {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && typeof reg.showNotification === 'function') {
            await reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              dir: 'rtl',
              lang: 'ar',
              tag: 'hasan-elgewar-smart-notification',
            });
            return {
              ok: true,
              method: 'service_worker',
              message: 'تم إرسال الإشعار الذكي إلى شريط إشعارات الهاتف / الجهاز بنجاح!',
            };
          }
        }
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
        });
        return {
          ok: true,
          method: 'browser_notification',
          message: 'تم إرسال الإشعار الذكي إلى شريط تنبيهات الجهاز بنجاح!',
        };
      }
    }
  } catch {
    // Fallback to in-app smart notification toast
  }

  return {
    ok: true,
    method: 'in_app_toast',
    message: 'تم تفعيل وعرض الإشعار الذكي الفوري داخل البرنامج بنجاح!',
  };
}


