import React, { useState, useRef, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  BuildingSettings,
  AppThemeId,
  SaveLocationFolder,
  ImageExportFormat,
  ExcelExportFormat,
} from '../types';
import {
  validateBackupFile,
  BackupValidationResult,
  getCurrentMonthUnpaidUnits,
  evaluateMonthlyDueStatus,
  generateAppIconSvgDataUrl,
  generateOfficialStampSvgDataUrl,
  validateBrandingImageDataUrl,
  AppDisplayMode,
  resolveAppDisplayModeConfig,
  getAppVersionAndSystemInfo,
  resolveDynamicAppVersion,
  SettingsModalTabKey,
  downloadVerifiedStandaloneApk,
  APP_THEMES_CATALOG,
  APP_ACCENT_COLOR_SWATCHES,
  resolveAppThemeConfig,
  APK_DECLARED_PERMISSIONS,
} from '../utils/finance';
import {
  hasNativeApkBridge,
  pickFileFromDeviceOrWeb,
  requestAllApkPermissions,
  saveFileToDevice,
  SAVE_LOCATION_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  EXCEL_FORMAT_OPTIONS,
  saveDefaultSavePreferences,
} from '../utils/apkBridge';
import {
  Palette,
  X,
  Settings,
  CheckCircle,
  Download,
  Upload,
  RotateCcw,
  Building,
  Database,
  FileJson,
  AlertTriangle,
  FileCheck,
  Check,
  BellRing,
  BellOff,
  Calendar,
  Clock,
  CalendarClock,
  Eye,
  Lock,
  Share2,
  Copy,
  Mail,
  Image as ImageIcon,
  Stamp,
  Trash2,
  Monitor,
  Smartphone,
  DownloadCloud,
  RefreshCw,
  Info,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Wifi,
  WifiOff,
  CheckCircle2,
  CreditCard,
  Laptop,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import { MobileInstallGuideSection } from './MobileInstallGuideSection';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsModalTabKey;
  displayMode?: AppDisplayMode;
  onChangeDisplayMode?: (mode: AppDisplayMode) => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isOnline?: boolean;
  isServiceWorkerReady?: boolean;
  isUpdatingApp?: boolean;
  updateRevision?: number;
  lastUpdatedAt?: string | null;
  onInstall?: () => Promise<boolean> | void;
  onUpdateApp?: (reloadAfterUpdate?: boolean) => Promise<boolean> | void;
  onOpenStandaloneInstallModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  initialTab = 'general',
  displayMode = 'desktop',
  onChangeDisplayMode,
  isInstallable = false,
  isInstalled = false,
  isOnline = true,
  isServiceWorkerReady = true,
  isUpdatingApp = false,
  updateRevision = 0,
  lastUpdatedAt = null,
  onInstall,
  onUpdateApp,
  onOpenStandaloneInstallModal,
}) => {
  const {
    settings,
    updateSettings,
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    selectedMonth,
    exportBackup,
    importBackup,
    resetToDefault,
  } = useBuilding();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);
  const officialStampInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsModalTabKey>(initialTab);
  const [formData, setFormData] = useState<BuildingSettings>({
    ...settings,
    enableLateRentAlerts: settings.enableLateRentAlerts ?? true,
    lateRentAlertDay: settings.lateRentAlertDay ?? 10,
    enablePreDueBrowserReminder: settings.enablePreDueBrowserReminder ?? true,
    preDueReminderDays: settings.preDueReminderDays ?? 3,
    enableEmailNotifications: settings.enableEmailNotifications ?? true,
    treasurerEmail: settings.treasurerEmail ?? 'hossam.treasurer@alnoor-building.eg',
    readOnlyMode: settings.readOnlyMode ?? false,
    appIconUrl: settings.appIconUrl ?? '',
    officialStampUrl: settings.officialStampUrl ?? '',
    appTheme: settings.appTheme ?? 'emerald',
    customAccentColor: settings.customAccentColor ?? '#059669',
    apkFilePermissionsGranted: settings.apkFilePermissionsGranted ?? true,
    defaultSaveFolder: settings.defaultSaveFolder ?? 'custom_ask',
    defaultCustomSubfolder: settings.defaultCustomSubfolder ?? 'حسن_الجوار',
    defaultImageFormat: settings.defaultImageFormat ?? 'png',
    defaultExcelFormat: settings.defaultExcelFormat ?? 'xlsx',
    alwaysPreviewBeforeSave: settings.alwaysPreviewBeforeSave ?? true,
  });
  const [copiedReadOnlyLink, setCopiedReadOnlyLink] = useState(false);
  const [brandingFeedback, setBrandingFeedback] = useState<string | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);
  const [apkPermissionsFeedback, setApkPermissionsFeedback] = useState<string | null>(null);
  const [savePrefsFeedback, setSavePrefsFeedback] = useState<string | null>(null);

  // Display Mode, Updates & System Info state
  const [updateSuccessBanner, setUpdateSuccessBanner] = useState<string | null>(null);
  const [updateStepText, setUpdateStepText] = useState<string | null>(null);
  const [copiedInstaPay, setCopiedInstaPay] = useState(false);
  const [displayModeFeedback, setDisplayModeFeedback] = useState<string | null>(null);
  const [pastedBackupJson, setPastedBackupJson] = useState('');

  const displayConfig = resolveAppDisplayModeConfig(displayMode);
  const activeThemeConfig = resolveAppThemeConfig(
    formData.appTheme || settings.appTheme,
    formData.customAccentColor || settings.customAccentColor
  );

  const handleSelectThemeOneClick = (themeId: AppThemeId, customHex?: string) => {
    const chosenTheme = APP_THEMES_CATALOG.find(t => t.id === themeId) || APP_THEMES_CATALOG[0];
    const effectiveHex = customHex || chosenTheme.primaryHex;
    const updated: BuildingSettings = {
      ...formData,
      appTheme: themeId,
      customAccentColor: effectiveHex,
    };
    setFormData(updated);
    updateSettings(updated);
    setThemeFeedback(`تم تطبيق ثيم «${chosenTheme.nameArabic}» وتغيير ألوان البرنامج فوراً!`);
    setTimeout(() => setThemeFeedback(null), 3500);
  };

  const handleGrantApkPermissionsInSettings = async () => {
    const res = await requestAllApkPermissions();
    const updated: BuildingSettings = {
      ...formData,
      apkFilePermissionsGranted: true,
    };
    setFormData(updated);
    updateSettings(updated);
    setApkPermissionsFeedback(res.message);
    setTimeout(() => setApkPermissionsFeedback(null), 4500);
  };

  const handleUpdateDefaultSaveSetting = (
    patch: Partial<{
      defaultSaveFolder: SaveLocationFolder;
      defaultCustomSubfolder: string;
      defaultImageFormat: ImageExportFormat;
      defaultExcelFormat: ExcelExportFormat;
      alwaysPreviewBeforeSave: boolean;
    }>,
    feedbackMsg: string
  ) => {
    const updated: BuildingSettings = {
      ...formData,
      ...patch,
    };
    setFormData(updated);
    updateSettings(updated);
    saveDefaultSavePreferences(patch);
    setSavePrefsFeedback(feedbackMsg);
    setTimeout(() => setSavePrefsFeedback(null), 3500);
  };

  const systemInfo = useMemo(() => {
    return getAppVersionAndSystemInfo({
      apartments,
      revenues,
      expenses,
      settings,
      lastUpdatedTimestamp: lastUpdatedAt || null,
      updateRevision,
    });
  }, [apartments, revenues, expenses, settings, lastUpdatedAt, updateRevision]);

  const handleSelectDisplayMode = (nextMode: AppDisplayMode) => {
    onChangeDisplayMode?.(nextMode);
    setDisplayModeFeedback(
      nextMode === 'mobile'
        ? 'تم التغيير إلى وضع عرض الموبايل (Mobile Version) بنجاح!'
        : 'تم التغيير إلى وضع عرض الكمبيوتر (Desktop Version) بنجاح!'
    );
    setTimeout(() => setDisplayModeFeedback(null), 3500);
  };

  const handleTriggerUpdate = async (reloadImmediately = false) => {
    setUpdateSuccessBanner(null);
    setUpdateStepText('١/٣ جاري فحص أحدث نسخة وتحديث عامل الخدمة (Service Worker)...');
    await new Promise(resolve => setTimeout(resolve, 250));
    setUpdateStepText('٢/٣ جاري تحديث ملفات الواجهة وبيانات الإصدار مع الحفاظ التام على البيانات...');
    const nextMeta = resolveDynamicAppVersion(updateRevision + 1, new Date().toISOString());
    if (onUpdateApp) {
      await onUpdateApp(reloadImmediately);
    }
    setUpdateStepText(null);
    setUpdateSuccessBanner(
      `تم تحديث البرنامج وبيانات الإصدار تلقائياً إلى النسخة الأحدث (v${nextMeta.version} - بناء ${nextMeta.buildNumber}) بنجاح! جميع بيانات السكان والإيرادات والمصروفات محفوظة بالكامل.`
    );
  };

  const handleCopyInstaPay = async () => {
    try {
      await navigator.clipboard.writeText(systemInfo.instapayUrl);
      setCopiedInstaPay(true);
      setTimeout(() => setCopiedInstaPay(false), 2500);
    } catch {
      setCopiedInstaPay(true);
      setTimeout(() => setCopiedInstaPay(false), 2500);
    }
  };

  // Backup / Restore State
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmResetStep, setConfirmResetStep] = useState(false);

  const configuredDueDay = formData.lateRentAlertDay ?? 10;
  const dueEvaluation = evaluateMonthlyDueStatus(selectedMonth, configuredDueDay);
  const currentMonthLateUnits = getCurrentMonthUnpaidUnits(
    apartments,
    revenues,
    selectedMonth,
    configuredDueDay
  );

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  const compressAndReadImageFile = (
    file: File,
    maxDimension: number,
    onDone: (dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const rawDataUrl = ev.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width || maxDimension;
          let height = img.height || maxDimension;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            onDone(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // Fallback to raw data URL if canvas fails
        }
        onDone(rawDataUrl);
      };
      img.onerror = () => {
        onDone(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAppIconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressAndReadImageFile(file, 256, dataUrl => {
      setFormData(prev => {
        const updated = { ...prev, appIconUrl: dataUrl };
        updateSettings(updated);
        return updated;
      });
      setBrandingFeedback('تم اختيار وحفظ صورة أيقونة البرنامج من جهازك بنجاح!');
      setTimeout(() => setBrandingFeedback(null), 3500);
    });
    e.target.value = '';
  };

  const handlePickAppIconFromDevice = async () => {
    if (hasNativeApkBridge()) {
      const picked = await pickFileFromDeviceOrWeb({
        accept: 'image/*',
        optimizeAsImage: true,
        maxImageDim: 256,
      });
      if (picked && picked.dataUrl) {
        setFormData(prev => {
          const updated = { ...prev, appIconUrl: picked.dataUrl };
          updateSettings(updated);
          return updated;
        });
        setBrandingFeedback('تم اختيار وحفظ صورة أيقونة البرنامج من الهاتف بنجاح!');
        setTimeout(() => setBrandingFeedback(null), 3500);
      }
      return;
    }
    appIconInputRef.current?.click();
  };

  const handleSaveAppIconToDevice = async () => {
    const iconDataUrl = validateBrandingImageDataUrl(formData.appIconUrl)
      ? formData.appIconUrl!
      : generateAppIconSvgDataUrl(formData.buildingName, 'teal');
    const saved = await saveFileToDevice({
      fileName: `ايقونة_${(formData.buildingName || 'برج_النور').replace(/\s+/g, '_')}.png`,
      mimeType: 'image/png',
      dataUrl: iconDataUrl,
    });
    setBrandingFeedback(saved.message);
    setTimeout(() => setBrandingFeedback(null), 3500);
  };

  const handleOfficialStampFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressAndReadImageFile(file, 280, dataUrl => {
      setFormData(prev => {
        const updated = { ...prev, officialStampUrl: dataUrl };
        updateSettings(updated);
        return updated;
      });
      setBrandingFeedback('تم اختيار وحفظ صورة الختم الرسمي من جهازك بنجاح!');
      setTimeout(() => setBrandingFeedback(null), 3500);
    });
    e.target.value = '';
  };

  const handlePickOfficialStampFromDevice = async () => {
    if (hasNativeApkBridge()) {
      const picked = await pickFileFromDeviceOrWeb({
        accept: 'image/*',
        optimizeAsImage: true,
        maxImageDim: 280,
      });
      if (picked && picked.dataUrl) {
        setFormData(prev => {
          const updated = { ...prev, officialStampUrl: picked.dataUrl };
          updateSettings(updated);
          return updated;
        });
        setBrandingFeedback('تم اختيار وحفظ صورة الختم الرسمي من الهاتف بنجاح!');
        setTimeout(() => setBrandingFeedback(null), 3500);
      }
      return;
    }
    officialStampInputRef.current?.click();
  };

  const handleSaveOfficialStampToDevice = async () => {
    const stampDataUrl = validateBrandingImageDataUrl(formData.officialStampUrl)
      ? formData.officialStampUrl!
      : generateOfficialStampSvgDataUrl(formData.buildingName, formData.treasurerName, 'emerald');
    const saved = await saveFileToDevice({
      fileName: `ختم_${(formData.buildingName || 'برج_النور').replace(/\s+/g, '_')}.png`,
      mimeType: 'image/png',
      dataUrl: stampDataUrl,
    });
    setBrandingFeedback(saved.message);
    setTimeout(() => setBrandingFeedback(null), 3500);
  };

  const handleExport = () => {
    exportBackup();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const processFileContent = (content: string, fileName: string) => {
    setSelectedFileName(fileName);
    setSelectedFileContent(content);
    setImportStatus(null);
    const result = validateBackupFile(content);
    setValidationResult(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        processFileContent(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePickBackupFileFromDevice = async () => {
    if (hasNativeApkBridge()) {
      const picked = await pickFileFromDeviceOrWeb({
        accept: '.json,application/json,*/*',
        optimizeAsImage: false,
      });
      if (picked && picked.textContent) {
        processFileContent(picked.textContent, picked.fileName || 'building_backup.json');
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportStatus({
        success: false,
        message: 'عذراً، يجب اختيار ملف بصيغة JSON فقط (.json).',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        processFileContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!selectedFileContent || !validationResult?.isValid) return;

    const res = importBackup(selectedFileContent);
    setImportStatus(res);
    setSelectedFileContent(null);
    setValidationResult(null);
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 2200);
    }
  };

  const handleCancelSelectedFile = () => {
    setSelectedFileContent(null);
    setSelectedFileName(null);
    setValidationResult(null);
    setImportStatus(null);
  };

  const handleReset = () => {
    if (!confirmResetStep) {
      setConfirmResetStep(true);
      return;
    }
    resetToDefault();
    onClose();
  };

  const handleCopyShareableReadOnlyUrl = () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?mode=readonly`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedReadOnlyLink(true);
      setTimeout(() => setCopiedReadOnlyLink(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const reminderDayBeforeDue = Math.max(1, configuredDueDay - 3);

  return (
    <div
      data-testid="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                <span>قائمة الضبط والإعدادات الشاملة</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono">
                  v{systemInfo.version}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                بيانات العمارة • طريقة عرض التطبيق • تثبيت البرنامج • تحديثات ومعلومات الإصدار • المساعدة • النسخ الاحتياطي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (4 Consolidated Tabs inside Settings) */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-3 gap-1.5 scrollbar-none">
          <button
            type="button"
            data-testid="settings-tab-general"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>بيانات العمارة والتنبيهات</span>
          </button>

          <button
            type="button"
            data-testid="settings-tab-display-install-updates"
            onClick={() => setActiveTab('display_install_updates')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'display_install_updates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-teal-600 shrink-0" />
            <span>طريقة العرض والتثبيت والإصدار</span>
          </button>

          <button
            type="button"
            data-testid="settings-tab-help"
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'help'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>المساعدة ودليل التشغيل</span>
          </button>

          <button
            type="button"
            data-testid="settings-tab-backup"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-black border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>النسخ الاحتياطي (Backup)</span>
          </button>
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="p-6 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
            
            {/* Quick Summary & Direct Switcher Strip inside Settings (طريقة العرض والتثبيت والإصدار والمساعدة) */}
            <div
              data-testid="settings-consolidated-quick-bar"
              className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {displayConfig.mode === 'mobile' ? (
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-black text-xs text-white block">
                      طريقة عرض التطبيق الحالية: {displayConfig.activeLabelArabic}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      يمكنك التبديل الفوري بين عرض الكمبيوتر وعرض الموبايل أو إدارة التثبيت والتحديثات والمساعدة من هنا
                    </span>
                  </div>
                </div>

                {/* Direct Display Mode Switcher inside Settings */}
                <div
                  data-testid="settings-quick-display-mode-group"
                  className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0 self-start sm:self-center"
                >
                  <button
                    type="button"
                    data-testid="settings-quick-desktop-btn"
                    onClick={() => handleSelectDisplayMode('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      displayConfig.mode === 'desktop'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>عرض الكمبيوتر</span>
                  </button>
                  <button
                    type="button"
                    data-testid="settings-quick-mobile-btn"
                    onClick={() => handleSelectDisplayMode('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      displayConfig.mode === 'mobile'
                        ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>عرض الموبايل</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('display_install_updates')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600/25 hover:bg-teal-600/40 text-teal-200 border border-teal-500/30 font-bold text-[11px] transition cursor-pointer"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>تثبيت البرنامج وطريقة العرض</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('display_install_updates')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 font-bold text-[11px] transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>تحديثات ومعلومات الإصدار (v{systemInfo.version})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('help')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/30 font-bold text-[11px] transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>المساعدة ودليل التشغيل</span>
                </button>
              </div>
            </div>

            {/* NEW: 1-Click Theme & Color Studio Card (استوديو الثيمات وتغيير ألوان البرنامج بضغطة واحدة) */}
            <div
              data-testid="settings-themes-color-studio"
              className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/70 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: activeThemeConfig.effectiveAccentHex }}
                  >
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        استوديو الثيمات وتغيير ألوان البرنامج بضغطة واحدة (Themes & Colors)
                      </h4>
                      <span
                        data-testid="active-theme-badge"
                        className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black"
                      >
                        الثيم النشط: {activeThemeConfig.nameArabic}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اضغط على أي ثيم أو لون لتغيير مظهر وألوان البرنامج بالكامل فوراً بضغطة واحدة
                    </p>
                  </div>
                </div>
                {themeFeedback && (
                  <span
                    data-testid="theme-change-feedback"
                    className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>{themeFeedback}</span>
                  </span>
                )}
              </div>

              {/* 6 Interactive 1-Click Theme Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {APP_THEMES_CATALOG.map(theme => {
                  const isSelected = activeThemeConfig.id === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      data-testid={`theme-card-${theme.id}`}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectThemeOneClick(theme.id, theme.primaryHex)}
                      className={`p-3 rounded-xl border-2 text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg border border-black/15 shrink-0 shadow-2xs flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${theme.primaryHex}, ${theme.headerBgHex})`,
                            }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </span>
                          <span className="font-black text-xs text-slate-900 truncate">
                            {theme.nameArabic}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-black shrink-0">
                          {theme.badgeArabic}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {theme.subtitleArabic}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Quick Color Swatches Bar */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="font-black text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تغيير سريع للون البرنامج بضغطة واحدة:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {APP_ACCENT_COLOR_SWATCHES.map(swatch => {
                    const isActiveSwatch =
                      activeThemeConfig.effectiveAccentHex.toLowerCase() ===
                        swatch.hex.toLowerCase() && activeThemeConfig.id === swatch.themeId;
                    return (
                      <button
                        key={`${swatch.themeId}-${swatch.hex}`}
                        type="button"
                        data-testid={`color-swatch-${swatch.themeId}`}
                        onClick={() => handleSelectThemeOneClick(swatch.themeId, swatch.hex)}
                        title={swatch.labelArabic}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                          isActiveSwatch
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/50 shrink-0"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.labelArabic}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NEW: APK File & Image Permissions Card inside Settings (صلاحيات ملف الـ APK للتعامل مع الملفات والصور) */}
            <div
              data-testid="settings-apk-permissions-card"
              className="p-4 rounded-2xl border-2 border-teal-300 bg-gradient-to-l from-teal-950 via-slate-900 to-emerald-950 text-white space-y-3 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-xs sm:text-sm text-white">
                        صلاحيات تطبيق الـ APK الشاملة (حفظ الملفات والصور • التصدير للواتساب • الكاميرا والإشعارات)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                        تُطلب تلقائياً عند التنصيب ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      يطلب التطبيق الموافقة التلقائية عند التثبيت والتشغيل على جميع الصلاحيات اللازمة لحفظ الصور والملفات في الجهاز واختيار الأيقونة والختم ({APK_DECLARED_PERMISSIONS.map(p => p.shortName).join(' • ')})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="settings-grant-apk-permissions-btn"
                  onClick={handleGrantApkPermissionsInSettings}
                  className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shrink-0 cursor-pointer self-start sm:self-center"
                >
                  طلب والموافقة على كل الصلاحيات الآن
                </button>
              </div>

              {apkPermissionsFeedback && (
                <div
                  data-testid="settings-apk-permissions-feedback"
                  className="p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400 text-emerald-100 font-bold text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{apkPermissionsFeedback}</span>
                </div>
              )}
            </div>

            {/* NEW: Default Save Location on Device & Image/Excel Formats Studio (إعدادات مكان الحفظ الافتراضي وصيغ الصور والإكسيل) */}
            <div
              data-testid="settings-default-save-location-section"
              className="p-4 sm:p-5 rounded-2xl border-2 border-teal-400 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/75 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        إعدادات مكان الحفظ الافتراضي على الجهاز وصيغ الصور وملفات الإكسيل
                      </h4>
                      <span
                        data-testid="active-default-save-folder-badge"
                        className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black"
                      >
                        المجلد الافتراضي:{' '}
                        {SAVE_LOCATION_OPTIONS.find(o => o.id === formData.defaultSaveFolder)
                          ?.shortLabelArabic || 'التنزيلات'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      حدد المجلد الافتراضي لحفظ الصور وشيتات الإكسيل على هاتفك أو جهازك، والصيغة الافتراضية، وخيار معاينة الصورة أثناء الحفظ
                    </p>
                  </div>
                </div>
                {savePrefsFeedback && (
                  <span
                    data-testid="settings-save-prefs-feedback"
                    className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>{savePrefsFeedback}</span>
                  </span>
                )}
              </div>

              {/* 1. Default Save Folder Selector */}
              <div className="space-y-2">
                <label className="block font-black text-xs text-slate-800">
                  ١. مكان الحفظ الافتراضي على الجهاز (الصور وملفات الإكسيل):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {SAVE_LOCATION_OPTIONS.map(loc => {
                    const isSelected = (formData.defaultSaveFolder || 'custom_ask') === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        data-testid={`settings-default-folder-${loc.id}`}
                        aria-pressed={isSelected}
                        onClick={() =>
                          handleUpdateDefaultSaveSetting(
                            { defaultSaveFolder: loc.id },
                            `تم تعيين «${loc.shortLabelArabic}» كمكان حفظ افتراضي على الجهاز!`
                          )
                        }
                        className={`p-2.5 rounded-xl border-2 text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/90 ring-2 ring-teal-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-slate-900">
                            {loc.shortLabelArabic}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          {loc.descriptionArabic}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Default Subfolder & Live Preview Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <label className="block font-black text-xs text-slate-800">
                    ٢. اسم المجلد الفرعي الافتراضي (داخل مجلد الحفظ):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      data-testid="settings-default-subfolder-input"
                      value={formData.defaultCustomSubfolder ?? 'حسن_الجوار'}
                      onChange={e =>
                        handleUpdateDefaultSaveSetting(
                          { defaultCustomSubfolder: e.target.value },
                          'تم تحديث اسم المجلد الفرعي الافتراضي للحفظ!'
                        )
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-hidden"
                      placeholder="مثال: حسن_الجوار"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    يُضاف تلقائياً لتنظيم ملفات وصور العمارة (اتركه فارغاً للحفظ في المجلد الرئيسي مباشرة).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-teal-600" />
                      <span>معاينة الصورة وتأكيد المكان أثناء الحفظ</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      فتح نافذة المعاينة الحية وتكبير الصورة واختيار الصيغ في كل مرة قبل الحفظ النهائي
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    data-testid="settings-always-preview-checkbox"
                    checked={formData.alwaysPreviewBeforeSave ?? true}
                    onChange={e =>
                      handleUpdateDefaultSaveSetting(
                        { alwaysPreviewBeforeSave: e.target.checked },
                        e.target.checked
                          ? 'تم تفعيل المعاينة الحية للصورة قبل الحفظ!'
                          : 'تم تفعيل الحفظ الفوري المباشر إلى المجلد الافتراضي!'
                      )
                    }
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* 3. Default Image Format & Default Excel Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Default Image Format */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <label className="block font-black text-xs text-slate-800">
                    ٣. صيغة حفظ الصور الافتراضية (PNG / JPG / WEBP / SVG):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {IMAGE_FORMAT_OPTIONS.map(fmt => {
                      const isActive = (formData.defaultImageFormat || 'png') === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          data-testid={`settings-default-image-format-${fmt.id}`}
                          onClick={() =>
                            handleUpdateDefaultSaveSetting(
                              { defaultImageFormat: fmt.id },
                              `تم تعيين صيغة الصورة الافتراضية إلى (.${fmt.extension.toUpperCase()})!`
                            )
                          }
                          className={`px-2.5 py-2 rounded-lg border text-right text-[11px] font-bold flex items-center justify-between gap-1 cursor-pointer ${
                            isActive
                              ? 'border-teal-600 bg-teal-600 text-white font-black'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span>.{fmt.extension.toUpperCase()}</span>
                          <span className="text-[9px] opacity-85">{fmt.badgeArabic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Excel Format */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <label className="block font-black text-xs text-slate-800">
                    ٤. صيغة حفظ ملفات الإكسيل الافتراضية (XLSX / XLS / CSV / XML / ODS / TSV):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EXCEL_FORMAT_OPTIONS.map(fmt => {
                      const isActive = (formData.defaultExcelFormat || 'xlsx') === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          data-testid={`settings-default-excel-format-${fmt.id}`}
                          onClick={() =>
                            handleUpdateDefaultSaveSetting(
                              { defaultExcelFormat: fmt.id },
                              `تم تعيين صيغة الإكسيل الافتراضية إلى (.${fmt.extension.toUpperCase()})!`
                            )
                          }
                          className={`px-2 py-2 rounded-lg border text-center text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isActive
                              ? 'border-teal-600 bg-teal-600 text-white font-black'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span>.{fmt.extension.toUpperCase()}</span>
                          <span className="text-[9px] opacity-85 truncate max-w-full">
                            {fmt.badgeArabic}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: Program Icon & Official Stamp Customization Card (أيقونة البرنامج والختم الرسمي) */}
            <div
              data-testid="branding-icon-stamp-section"
              className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      تخصيص صورة أيقونة البرنامج وصورة الختم الرسمي
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اختر صورة من جهازك أو من النماذج الجاهزة لتظهر كأيقونة للبرنامج وفي الإيصالات والتقارير والفاتورة البيضاء
                    </p>
                  </div>
                </div>
                {brandingFeedback && (
                  <span
                    data-testid="branding-save-feedback"
                    className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>{brandingFeedback}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Program Icon Picker (صورة أيقونة البرنامج) */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-400 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      <img
                        data-testid="preview-app-icon-img"
                        src={
                          validateBrandingImageDataUrl(formData.appIconUrl)
                            ? formData.appIconUrl
                            : '/pwa-192x192.png'
                        }
                        alt="معاينة أيقونة البرنامج"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>صورة أيقونة البرنامج</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        تظهر في شريط البرنامج العلوي، وأيقونة التثبيت، وترويسة الإيصالات والتقارير.
                      </p>
                    </div>
                  </div>

                  {/* Upload & Reset Controls */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        data-testid="choose-app-icon-btn"
                        onClick={handlePickAppIconFromDevice}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار صورة للأيقونة من جهازك</span>
                      </button>
                      <button
                        type="button"
                        data-testid="save-app-icon-device-btn"
                        onClick={handleSaveAppIconToDevice}
                        className="px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="حفظ صورة الأيقونة في الجهاز"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>حفظ للجهاز</span>
                      </button>
                      {formData.appIconUrl && (
                        <button
                          type="button"
                          data-testid="reset-app-icon-btn"
                          onClick={() => {
                            const updated = { ...formData, appIconUrl: '/pwa-192x192.png' };
                            setFormData(updated);
                            updateSettings(updated);
                            setBrandingFeedback('تم استعادة شعار «حُسْنُ الجِوَار» الرسمي للبرنامج');
                            setTimeout(() => setBrandingFeedback(null), 3000);
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          title="استعادة شعار حسن الجوار الرسمي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        ref={appIconInputRef}
                        data-testid="upload-app-icon-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAppIconFileUpload}
                      />
                    </div>

                    {/* Ready-made App Icon Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">أيقونات جاهزة:</span>
                      <button
                        type="button"
                        data-testid="preset-app-icon-hasan-elgewar"
                        onClick={() => {
                          const updated = { ...formData, appIconUrl: '/pwa-192x192.png' };
                          setFormData(updated);
                          updateSettings(updated);
                          setBrandingFeedback('تم تطبيق شعار «حُسْنُ الجِوَار» الذهبي المرفق!');
                          setTimeout(() => setBrandingFeedback(null), 3000);
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-slate-900 border border-amber-300 text-[10px] font-black transition cursor-pointer"
                      >
                        شعار حسن الجوار الذهبي
                      </button>
                      {(
                        [
                          { label: 'الزمردية', theme: 'teal' },
                          { label: 'النيلية', theme: 'indigo' },
                          { label: 'الذهبية', theme: 'amber' },
                        ] as const
                      ).map(preset => (
                        <button
                          key={preset.theme}
                          type="button"
                          data-testid={`preset-app-icon-${preset.theme}`}
                          onClick={() => {
                            const svgUrl = generateAppIconSvgDataUrl(
                              formData.buildingName,
                              preset.theme
                            );
                            const updated = { ...formData, appIconUrl: svgUrl };
                            setFormData(updated);
                            updateSettings(updated);
                            setBrandingFeedback(`تم تطبيق الأيقونة ${preset.label}!`);
                            setTimeout(() => setBrandingFeedback(null), 3000);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Official Stamp Picker (صورة الختم الرسمي) */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-indigo-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 p-1">
                      {validateBrandingImageDataUrl(formData.officialStampUrl) ? (
                        <img
                          data-testid="preview-official-stamp-img"
                          src={formData.officialStampUrl}
                          alt="معاينة الختم الرسمي"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-full border border-dashed border-emerald-600/60 flex flex-col items-center justify-center text-[8px] text-emerald-800 font-black leading-tight text-center">
                          <span>ختم الإدارة</span>
                          <span className="text-[7px] text-slate-500">معتمد</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>صورة الختم الرسمي للعقار</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        يُطبع تلقائياً أسفل إيصالات الاستلام، كشوف الحساب الرسمية، وصورة الفاتورة البيضاء للواتساب.
                      </p>
                    </div>
                  </div>

                  {/* Upload & Reset Controls */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        data-testid="choose-official-stamp-btn"
                        onClick={handlePickOfficialStampFromDevice}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار صورة للختم الرسمي من جهازك</span>
                      </button>
                      <button
                        type="button"
                        data-testid="save-official-stamp-device-btn"
                        onClick={handleSaveOfficialStampToDevice}
                        className="px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="حفظ صورة الختم الرسمي في الجهاز"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>حفظ للجهاز</span>
                      </button>
                      {formData.officialStampUrl && (
                        <button
                          type="button"
                          data-testid="reset-official-stamp-btn"
                          onClick={() => {
                            const updated = { ...formData, officialStampUrl: '' };
                            setFormData(updated);
                            updateSettings(updated);
                            setBrandingFeedback('تم استعادة الختم الافتراضي');
                            setTimeout(() => setBrandingFeedback(null), 3000);
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          title="استعادة الختم الافتراضي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        ref={officialStampInputRef}
                        data-testid="upload-official-stamp-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleOfficialStampFileUpload}
                      />
                    </div>

                    {/* Ready-made Official Stamp Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">أختام رسمية جاهزة:</span>
                      {(
                        [
                          { label: 'ختم أخضر معتمد', theme: 'emerald' },
                          { label: 'ختم أزرق رسمي', theme: 'indigo' },
                          { label: 'ختم ذهبي', theme: 'amber' },
                        ] as const
                      ).map(preset => (
                        <button
                          key={preset.theme}
                          type="button"
                          data-testid={`preset-official-stamp-${preset.theme}`}
                          onClick={() => {
                            const stampUrl = generateOfficialStampSvgDataUrl(
                              formData.buildingName,
                              formData.treasurerName,
                              preset.theme
                            );
                            const updated = { ...formData, officialStampUrl: stampUrl };
                            setFormData(updated);
                            updateSettings(updated);
                            setBrandingFeedback(`تم اختيار ${preset.label}!`);
                            setTimeout(() => setBrandingFeedback(null), 3000);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Due Day & Late Rent Alerts Configuration Box */}
            <div
              className={`p-4 rounded-2xl border-2 transition ${
                formData.enableLateRentAlerts
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.enableLateRentAlerts
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {formData.enableLateRentAlerts ? (
                      <BellRing className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        ضبط يوم الاستحقاق الشهري وتنبيهات الإيجار المتأخر
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          formData.enableLateRentAlerts
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {formData.enableLateRentAlerts ? 'مُفعّل تلقائياً' : 'متوقف'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      يقوم التطبيق تلقائياً بتحديد حالة الشقق كـ <strong className="text-rose-700">"متأخرة"</strong> في لوحة التحكم وقائمة الشقق إذا لم يتم تسجيل إيراد لها بعد حلول <strong>يوم الاستحقاق الشهري</strong> المحدد.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!formData.enableLateRentAlerts}
                  aria-label="تفعيل تنبيهات الإيجار المتأخر"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      enableLateRentAlerts: !prev.enableLateRentAlerts,
                    }))
                  }
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.enableLateRentAlerts ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.enableLateRentAlerts ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Monthly Due Day Configuration Controls */}
              <div className="mt-3.5 pt-3.5 border-t border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                    <label htmlFor="monthly-due-day-select" className="font-black text-slate-800 text-xs">
                      يوم الاستحقاق الشهري:
                    </label>
                    <select
                      id="monthly-due-day-select"
                      aria-label="يوم الاستحقاق الشهري"
                      value={configuredDueDay}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          lateRentAlertDay: Number(e.target.value),
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white font-bold text-xs text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500"
                    >
                      {Array.from({ length: 28 }, (_, idx) => idx + 1).map(day => (
                        <option key={day} value={day}>
                          يوم {day} من كل شهر
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Day Presets */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold ml-1">اختيار سريع:</span>
                    {[1, 5, 10, 15, 20, 25].map(presetDay => (
                      <button
                        key={presetDay}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            lateRentAlertDay: presetDay,
                          })
                        }
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                          configuredDueDay === presetDay
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                        }`}
                      >
                        يوم {presetDay}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Automatic Status Evaluation Preview */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    dueEvaluation.isPastDueDate
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      تاريخ استحقاق شهر ({selectedMonth}):{' '}
                      <strong className="font-mono">{dueEvaluation.dueDateFormatted}</strong>
                    </span>
                    <span className="mx-1">•</span>
                    {dueEvaluation.isPastDueDate ? (
                      <span className="text-rose-700">
                        تجاوز موعد الاستحقاق ({dueEvaluation.daysPastDue} يوم) — يتم تصنيف الشقق غير المسددة كـ «متأخرة» تلقائياً
                      </span>
                    ) : (
                      <span className="text-indigo-700">
                        متبقي {dueEvaluation.daysUntilDue} يوم على حلول موعد الاستحقاق الشهري
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-black bg-white px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {currentMonthLateUnits.length} شقق غير مسددة
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: 3-Day Pre-Due Browser Reminder Scheduling Card */}
            <div
              className={`p-4 rounded-2xl border-2 transition ${
                formData.enablePreDueBrowserReminder
                  ? 'bg-indigo-50/70 border-indigo-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.enablePreDueBrowserReminder
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        نظام جدولة التذكيرات في المتصفح (قبل موعد الاستحقاق بـ 3 أيام)
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          formData.enablePreDueBrowserReminder
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {formData.enablePreDueBrowserReminder ? 'التنبيه المسبق مُفعّل' : 'التنبيه المسبق معطّل'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      يرسل التطبيق تذكيراً تلقائياً في المتصفح قبل حلول يوم الاستحقاق الشهري بـ <strong>3 أيام</strong> (أي في <strong>يوم {reminderDayBeforeDue} من كل شهر</strong> بناءً على يوم الاستحقاق {configuredDueDay}) لتنبيهك بالشقق التي لم تسدد بعد.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={!!formData.enablePreDueBrowserReminder}
                  aria-label="تفعيل تذكير المتصفح قبل الاستحقاق بـ 3 أيام"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      enablePreDueBrowserReminder: !prev.enablePreDueBrowserReminder,
                    }))
                  }
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.enablePreDueBrowserReminder ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.enablePreDueBrowserReminder ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* NEW: Read-Only Mode Card (وضع القراءة فقط) */}
            <div
              className={`p-4 rounded-2xl border-2 transition ${
                formData.readOnlyMode
                  ? 'bg-teal-50/80 border-teal-400'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.readOnlyMode
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {formData.readOnlyMode ? <Lock className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        وضع «القراءة فقط» (Read-Only Mode) لمشاركة التقارير
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          formData.readOnlyMode
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {formData.readOnlyMode ? 'وضع القراءة فقط نشط' : 'وضع التحرير الكامل'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      يتيح مشاركة الوصول للتطبيق مع السكان أو الملاك لمشاهدة التقارير المالية وكشوف الحساب فقط، مع <strong>تعطيل ومنع إضافة أو تعديل أو حذف</strong> أي بيانات مالية أو شقق.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={!!formData.readOnlyMode}
                  aria-label="تفعيل وضع القراءة فقط"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      readOnlyMode: !prev.readOnlyMode,
                    }))
                  }
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.readOnlyMode ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.readOnlyMode ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>رابط مشاركة مباشر يفتح التطبيق في وضع القراءة فقط (`?mode=readonly`):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyShareableReadOnlyUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px] transition shadow-2xs"
                >
                  {copiedReadOnlyLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">تم نسخ رابط القراءة فقط!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ رابط المشاهدة فقط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                اسم العمارة / العقار <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.buildingName}
                onChange={e => setFormData({ ...formData, buildingName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                عنوان العقار
              </label>
              <input
                type="text"
                value={formData.buildingAddress}
                onChange={e => setFormData({ ...formData, buildingAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم أمين الصندوق / المسؤول
                </label>
                <input
                  type="text"
                  value={formData.treasurerName}
                  onChange={e => setFormData({ ...formData, treasurerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  هاتف أمين الصندوق
                </label>
                <input
                  type="tel"
                  value={formData.treasurerPhone}
                  onChange={e => setFormData({ ...formData, treasurerPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>بريد الإدارة لإرسال الإيصالات</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.treasurerEmail || ''}
                  onChange={e => setFormData({ ...formData, treasurerEmail: e.target.value })}
                  placeholder="treasurer@building.eg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  العملة المستخدمة
                </label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                >
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="$">دولار ($)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الاشتراك الشهري الافتراضي
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.defaultMonthlyFee}
                  onChange={e => setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-emerald-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رصيد صندوق الطوارئ / الوديعة
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.emergencyFundBalance}
                  onChange={e => setFormData({ ...formData, emergencyFundBalance: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-bold font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المستهدف لصندوق الطوارئ
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.emergencyFundTarget}
                  onChange={e => setFormData({ ...formData, emergencyFundTarget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                بيانات الدفع الإلكتروني (إنستاباي / محفظة / بنك)
              </label>
              <input
                type="text"
                placeholder="تظهر في الإيصالات والرسائل لتسهيل السداد"
                value={formData.bankAccountDetails || ''}
                onChange={e => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
              >
                <CheckCircle className="w-4 h-4" />
                حفظ الإعدادات
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Display Mode, Standalone App Installation & Version/Updates Info (طريقة العرض والتثبيت والإصدار) */}
        {activeTab === 'display_install_updates' && (
          <div
            data-testid="settings-display-install-updates-panel"
            className="p-6 space-y-6 text-xs max-h-[78vh] overflow-y-auto"
          >
            {/* 1. App Display Mode & How to Change It (طريقة عرض التطبيق وطريقة التغيير) */}
            <div
              data-testid="settings-display-mode-section"
              className="p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/50 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    {displayConfig.mode === 'mobile' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      أولاً: طريقة عرض التطبيق وطريقة التغيير (كمبيوتر / موبايل)
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اختر طريقة العرض الأنسب لجهازك الحالي، ويتم حفظ اختيارك تلقائياً على الجهاز
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-black text-[11px] self-start sm:self-center shrink-0">
                  الوضع الحالي: {displayConfig.activeLabelArabic}
                </span>
              </div>

              {displayModeFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{displayModeFeedback}</span>
                </div>
              )}

              {/* Interactive Display Mode Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  data-testid="switch-to-desktop-mode-btn"
                  onClick={() => handleSelectDisplayMode('desktop')}
                  aria-pressed={displayConfig.mode === 'desktop'}
                  className={`p-4 rounded-2xl border-2 text-right transition flex flex-col justify-between gap-3 cursor-pointer ${
                    displayConfig.mode === 'desktop'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          displayConfig.mode === 'desktop'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-slate-900">
                          عرض الكمبيوتر (Desktop Version)
                        </div>
                        <span className="text-[11px] text-slate-500">
                          شاشة كاملة عريضة وموسعة
                        </span>
                      </div>
                    </div>
                    {displayConfig.mode === 'desktop' && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                        مفعّل حالياً ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    يعرض الجداول والتقارير والرسوم البيانية بعرض الشاشة الكامل (حتى 1280px) ليكون مثالياً لشاشات الكمبيوتر واللابتوب.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="switch-to-mobile-mode-btn"
                  onClick={() => handleSelectDisplayMode('mobile')}
                  aria-pressed={displayConfig.mode === 'mobile'}
                  className={`p-4 rounded-2xl border-2 text-right transition flex flex-col justify-between gap-3 cursor-pointer ${
                    displayConfig.mode === 'mobile'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          displayConfig.mode === 'mobile'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-slate-900">
                          عرض الموبايل (Mobile Version)
                        </div>
                        <span className="text-[11px] text-slate-500">
                          واجهة مدمجة مع شريط تنقل سفلي
                        </span>
                      </div>
                    </div>
                    {displayConfig.mode === 'mobile' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                        مفعّل حالياً ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    يضبط أبعاد التطبيق لتناسب شاشة الهاتف المحمول (440px) مع تفعيل شريط التنقل السفلي السريع للتحصيل والمتابعة بيد واحدة.
                  </p>
                </button>
              </div>

              {/* Explanation of How to Change Display Mode */}
              <div className="p-3.5 rounded-xl bg-white border border-indigo-200/80 flex items-start gap-2.5 text-[11px] text-slate-700">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-slate-900 block mb-0.5">
                    طريقة تغيير وضع العرض في أي وقت:
                  </span>
                  <span>
                    اضغط على أيقونة <strong>«قائمة الضبط» (⚙️)</strong> في أعلى الشاشة ← اختر تبويب{' '}
                    <strong>«طريقة العرض والتثبيت والإصدار»</strong> (أو من شريط الاختصارات السريع أعلى قائمة الضبط) ← اضغط على{' '}
                    <strong>«عرض الكمبيوتر»</strong> أو <strong>«عرض الموبايل»</strong> ليتم تطبيق الشكل فوراً.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Standalone App Installation Section (تثبيت البرنامج منفصلاً) */}
            <div
              data-testid="settings-install-app-section"
              className="p-5 rounded-2xl border-2 border-teal-300 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 space-y-4 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900">
                        ثانياً: تثبيت البرنامج منفصلاً على الهاتف أو الكمبيوتر
                      </h4>
                      <span
                        data-testid="install-always-latest-badge"
                        className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black"
                      >
                        يثبّت أحدث نسخة دائماً (v{systemInfo.version}) ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      يقوم زر التثبيت بتحديث ملفات النسخة الأحدث تلقائياً ثم تثبيت تطبيق «{settings.buildingName}» بأيقونته المستقلة
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                  <a
                    href={`/borj-elnoor-standalone.apk?v=${encodeURIComponent(systemInfo.version)}`}
                    download={`borj-elnoor-standalone-v${systemInfo.version}.apk`}
                    onClick={async e => {
                      e.preventDefault();
                      await downloadVerifiedStandaloneApk(
                        `/borj-elnoor-standalone.apk?v=${encodeURIComponent(systemInfo.version)}`,
                        `borj-elnoor-standalone-v${systemInfo.version}.apk`
                      );
                    }}
                    data-testid="settings-header-apk-download-btn"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition cursor-pointer"
                    title="الخيار الثاني: تحميل مباشر لملف APK Standalone الصالح (436 KB)"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل APK مباشر (الخيار ٢ — 436 KB)</span>
                  </a>

                  {onOpenStandaloneInstallModal && (
                    <button
                      type="button"
                      data-testid="settings-open-standalone-installer-btn"
                      onClick={onOpenStandaloneInstallModal}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs shadow-xs transition cursor-pointer"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>تثبيت أحدث نسخة (v{systemInfo.version})</span>
                    </button>
                  )}
                </div>
              </div>

              <MobileInstallGuideSection
                isInstallable={isInstallable}
                isInstalled={isInstalled}
                currentVersion={systemInfo.version}
                buildNumber={systemInfo.buildNumber}
                onInstall={
                  onInstall ||
                  (() => {
                    onOpenStandaloneInstallModal?.();
                  })
                }
              />
            </div>

            {/* 3. Updates & Version Information Section (تحديثات ومعلومات الإصدار) */}
            <div
              data-testid="settings-version-updates-section"
              className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-5 shadow-2xs"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white space-y-4 shadow-md border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                      <RefreshCw className={`w-5 h-5 ${isUpdatingApp || updateStepText ? 'animate-spin' : ''}`} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-white">
                          ثالثاً: تحديثات ومعلومات الإصدار
                        </h4>
                        <span
                          data-testid="app-version-badge"
                          className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black font-mono"
                        >
                          v{systemInfo.version}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black">
                          يتحدث تلقائياً مع كل تحديث
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        تحديث البرنامج المثبت وبيانات الإصدار ورقم البناء فوراً مع كل تحديث دون المساس ببيانات السكان أو الخزينة
                      </p>
                    </div>
                  </div>

                  <span
                    data-testid="app-build-badge"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-200 shrink-0 self-start sm:self-center"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>بناء: {systemInfo.buildNumber}</span>
                  </span>
                </div>

                {/* Update Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    data-testid="trigger-app-update-btn"
                    disabled={isUpdatingApp || Boolean(updateStepText)}
                    onClick={() => handleTriggerUpdate(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isUpdatingApp || updateStepText ? 'animate-spin' : ''}`} />
                    <span>
                      {isUpdatingApp || updateStepText
                        ? 'جاري تحديث البرنامج وبيانات الإصدار...'
                        : 'تحديث البرنامج وبيانات الإصدار لأحدث نسخة الآن'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="force-reload-updated-app-btn"
                    disabled={isUpdatingApp || Boolean(updateStepText)}
                    onClick={() => handleTriggerUpdate(true)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>تحديث وإعادة تشغيل التطبيق فوراً</span>
                  </button>
                </div>

                {updateStepText && (
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-emerald-200 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300 shrink-0" />
                    <span>{updateStepText}</span>
                  </div>
                )}

                {updateSuccessBanner && (
                  <div
                    data-testid="app-update-success-banner"
                    className="p-3.5 rounded-xl bg-emerald-500/25 border border-emerald-400 text-xs font-bold text-white flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{updateSuccessBanner}</p>
                      <p className="text-[11px] text-emerald-200">
                        آخر تحديث مسجل على هذا الجهاز: {systemInfo.lastUpdatedFormatted} • الكاش: {systemInfo.cacheVersion}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 text-[11px] text-emerald-200/90">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      ضمان أمان البيانات: التحديث يحافظ على جميع السجلات ({systemInfo.apartmentsCount} شقة، {systemInfo.revenuesCount} إيصال، {systemInfo.expensesCount} مصروف).
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">
                    آخر تحديث: {systemInfo.lastUpdatedFormatted}
                  </span>
                </div>
              </div>

              {/* System & Version Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">اسم البرنامج وبيانات الإصدار المحدثة</span>
                  <p className="font-black text-slate-900 text-xs">{systemInfo.programName}</p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span
                      data-testid="system-info-version-pill"
                      className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-black font-mono text-[11px]"
                    >
                      الإصدار {systemInfo.version}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                      بناء {systemInfo.buildNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({systemInfo.releaseDate})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-slate-500 font-semibold block">حالة التثبيت والاتصال</span>
                  <div className="flex items-center gap-1.5 font-black text-slate-900">
                    <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      {isInstalled ? 'مثبّت كتطبيق مستقل' : 'يعمل عبر المتصفح (قابل للتثبيت)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className={`inline-flex items-center gap-1 ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                      <span>{isOnline ? 'متصل بالإنترنت' : 'وضع أوفلاين'}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-700">
                      {isServiceWorkerReady ? 'دعم أوفلاين مفعّل ✓' : 'تخزين محلي مفعّل ✓'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>عنوان الدفع انستا باي</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInstaPay}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold transition cursor-pointer"
                    >
                      {copiedInstaPay ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedInstaPay ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                  <p className="font-black text-slate-900 text-xs">
                    باسم: {systemInfo.instapayRecipient}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-800 truncate" dir="ltr">
                    {systemInfo.instapayUrl}
                  </p>
                </div>
              </div>

              {/* Changelog / Release Features */}
              <div className="space-y-2">
                <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>سجل التحديثات وأبرز مميزات الإصدار الحالي (v{systemInfo.version}):</span>
                </h5>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {systemInfo.changelogFeatures.map(item => (
                    <div key={item.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-black text-xs text-slate-900">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 pr-5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black shrink-0">
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Navigation: Back & Close */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span>رجوع للخلف (إعدادات العمارة)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>إغلاق النافذة</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Help & User Guide (المساعدة ودليل التشغيل) */}
        {activeTab === 'help' && (
          <div
            data-testid="settings-help-guide-panel"
            className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto"
          >
            <div className="p-5 rounded-2xl bg-gradient-to-l from-slate-900 via-teal-950 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    المساعدة ودليل التشغيل الشامل للنظام
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    إرشادات الاستخدام اليومي، العمل بدون إنترنت (أوفلاين)، إدارة التحصيل، والتقارير المصورة
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 self-start sm:self-center ${
                  isOnline
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isOnline ? 'متصل بالإنترنت (Online)' : 'وضع عدم الاتصال (Offline)'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                  <Laptop className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. تشغيل التطبيق وتغيير طريقة العرض</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  يعمل التطبيق مباشرة من المتصفح أو كتطبيق مستقل مثبت على هاتفك أو حاسوبك. يمكنك التبديل في أي وقت بين <strong>«عرض الكمبيوتر»</strong> و<strong>«عرض الموبايل»</strong> من داخل قائمة الضبط عبر تبويب <strong>«طريقة العرض والتثبيت والإصدار»</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                  <WifiOff className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>2. العمل أوفلاين (بدون إنترنت) وحفظ البيانات</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  يحتفظ النظام بجميع بيانات الـ 27 شقة والإيرادات والمصروفات على ذاكرة جهازك تلقائياً، مما يتيح لك إصدار الإيصالات ومراجعة الحسابات حتى في حال انقطاع الإنترنت.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>3. نموذج الإكسيل المصور والملخصات السريعة</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  من الشريط العلوي أو من شاشة <strong>«الملخصات والمهام السريعة»</strong> يمكنك فتح <strong>«جدول الأدوار والأسماء»</strong> لاستعراض الـ 10 أدوار بنظام البطاقات الملونة الاحترافية وتحميله كصورة عالية الدقة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                  <HardDrive className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>4. النسخ الاحتياطي وتحديث الإصدار بأمان</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تحديث البرنامج من تبويب <strong>«طريقة العرض والتثبيت والإصدار»</strong> لا يحذف أي بيانات مسجلة. كما ننصح دورياً بتحميل ملف نسخة احتياطية (JSON) من تبويب <strong>«النسخ الاحتياطي»</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>هل ترغب في تثبيت البرنامج أو تحديث الإصدار أو أخذ نسخة احتياطية الآن؟</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('display_install_updates')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer"
                >
                  العرض والتثبيت والإصدار
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('backup')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xs transition cursor-pointer"
                >
                  النسخ الاحتياطي
                </button>
              </div>
            </div>

            {/* Footer Navigation: Back & Close */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span>رجوع للخلف (إعدادات العمارة)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>إغلاق النافذة</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Database Backup & Restore */}
        {activeTab === 'backup' && (
          <div
            data-testid="settings-backup-panel"
            className="p-6 space-y-6 text-xs max-h-[78vh] overflow-y-auto"
          >
            {/* Top Header Bar with Quick Back & Close Buttons */}
            <div className="p-4 rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">
                    قائمة النسخ الاحتياطي واستعادة قاعدة البيانات
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    حفظ نسخة كاملة من السجلات أو استعادتها بأمان تام على جهازك
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  data-testid="backup-tab-back-btn"
                  onClick={() => setActiveTab('general')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs transition cursor-pointer"
                  title="العودة إلى تبويب إعدادات العمارة"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  <span>رجوع للخلف</span>
                </button>
                <button
                  type="button"
                  data-testid="backup-tab-close-btn"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs transition cursor-pointer"
                  title="إغلاق نافذة الضبط"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>
            
            {/* Status alerts */}
            {importStatus && (
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  importStatus.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {importStatus.success ? 'اكتملت العملية بنجاح' : 'تنبيه في الاستعادة'}
                  </h4>
                  <p className="text-xs mt-0.5">{importStatus.message}</p>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>تصدير نسخة احتياطية من قاعدة البيانات (Backup JSON)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    احفظ نسخة كاملة من جميع بيانات وسجلات العمارة في ملف JSON مشفر محلياً على جهازك
                  </p>
                </div>
              </div>

              {/* Current Data Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">الشقق والسكان</span>
                  <span className="font-black text-sm text-slate-900">{apartments.length} شقة</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">سندات القبض</span>
                  <span className="font-black text-sm text-emerald-600">{revenues.length} سند</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">سندات الصرف</span>
                  <span className="font-black text-sm text-rose-600">{expenses.length} سند</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">مصروفات متكررة</span>
                  <span className="font-black text-sm text-indigo-600">{recurringExpenses.length} بنود</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  📁 الصيغة: JSON متوافق • الاسم التلقائي: building_backup_YYYY-MM-DD.json
                </span>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم تنزيل النسخة الاحتياطية!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تحميل النسخة الاحتياطية الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import / Restore Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="mb-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>استعادة نسخة احتياطية سابقة (Restore Database)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  قم برفع ملف JSON محفوظ سابقاً لاسترجاع بيانات السكان والمصروفات بالكامل
                </p>
              </div>

              {/* Upload Dropzone + Direct Paste JSON Box for APK */}
              {!validationResult?.isValid ? (
                <div className="space-y-4">
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={handlePickBackupFileFromDevice}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/60'
                        : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <FileJson className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-800 mb-1">
                      اسحب ملف النسخة الاحتياطية (JSON) هنا، أو اضغط للاختيار من جهازك
                    </p>
                    <p className="text-[11px] text-slate-500">
                      يقبل ملفات النسخ الاحتياطي الخاصة بتطبيق إدارة العمارة (*.json)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Direct JSON Paste Restore for APK & WhatsApp */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        أو الصق كود النسخة الاحتياطية (JSON) مباشرة هنا (مناسب لتطبيق الـ APK والواتساب):
                      </span>
                      {pastedBackupJson.trim() && (
                        <button
                          type="button"
                          data-testid="validate-pasted-backup-btn"
                          onClick={() =>
                            processFileContent(pastedBackupJson.trim(), 'نسخة_احتياطية_ملصوقة.json')
                          }
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                        >
                          فحص واستعادة الكود الملصوق
                        </button>
                      )}
                    </div>
                    <textarea
                      data-testid="paste-backup-json-textarea"
                      dir="ltr"
                      rows={3}
                      value={pastedBackupJson}
                      onChange={e => setPastedBackupJson(e.target.value)}
                      placeholder='{"app":"BuildingFinanceApp","apartments":[...],"revenues":[...]}'
                      className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                /* Pre-Restore Inspection Card */
                <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-6 h-6 text-indigo-600" />
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">
                          {selectedFileName}
                        </h5>
                        <span className="text-[11px] text-emerald-600 font-bold">
                          ✓ تم فحص الملف وهو سليم وصالح للاستعادة
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelSelectedFile}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      اختيار ملف آخر
                    </button>
                  </div>

                  {/* Backup metadata details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">العقار المسجل:</span>
                      <span className="font-bold text-slate-900">
                        {validationResult.metadata?.buildingName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">عدد الشقق:</span>
                      <span className="font-bold text-slate-900">
                        {validationResult.metadata?.apartmentsCount} شقة
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">سندات القبض:</span>
                      <span className="font-bold text-emerald-600">
                        {validationResult.metadata?.revenuesCount} سند
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">سندات الصرف:</span>
                      <span className="font-bold text-rose-600">
                        {validationResult.metadata?.expensesCount} سند
                      </span>
                    </div>
                    {validationResult.metadata?.recurringExpensesCount !== undefined && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">مصروفات متكررة:</span>
                        <span className="font-bold text-indigo-600">
                          {validationResult.metadata?.recurringExpensesCount} بنود
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      تنبيه: سيؤدي تأكيد الاستعادة إلى استبدال البيانات الحالية بالكامل ببيانات هذه النسخة الاحتياطية.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelSelectedFile}
                      className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      <Check className="w-4 h-4" />
                      تأكيد واستعادة قاعدة البيانات الآن
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset to Default Demo Data */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-700 block">استعادة البيانات الأساسية لبرج النور:</span>
                <span className="text-[11px] text-slate-400">إعادة تعيين التطبيق إلى النسخة الأساسية لبرج النور (27 شقة)</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط المصنع
              </button>
            </div>

            {/* Bottom Action Bar: Back & Close */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                data-testid="backup-tab-footer-back-btn"
                onClick={() => setActiveTab('general')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span>رجوع للخلف (إعدادات العمارة)</span>
              </button>
              <button
                type="button"
                data-testid="backup-tab-footer-close-btn"
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>إغلاق النافذة</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
