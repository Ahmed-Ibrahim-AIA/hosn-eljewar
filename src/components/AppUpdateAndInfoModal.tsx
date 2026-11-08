import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { getAppVersionAndSystemInfo } from '../utils/finance';
import {
  RefreshCw,
  Info,
  CheckCircle2,
  ShieldCheck,
  Database,
  Building2,
  Sparkles,
  Smartphone,
  Wifi,
  WifiOff,
  X,
  CreditCard,
  Copy,
  Check,
  Clock,
  Layers,
} from 'lucide-react';

interface AppUpdateAndInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstalled: boolean;
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  isUpdatingApp: boolean;
  lastUpdatedAt: string;
  onUpdateApp: (reloadAfterUpdate?: boolean) => Promise<boolean>;
  onOpenSettingsBranding?: () => void;
}

export const AppUpdateAndInfoModal: React.FC<AppUpdateAndInfoModalProps> = ({
  isOpen,
  onClose,
  isInstalled,
  isOnline,
  isServiceWorkerReady,
  isUpdatingApp,
  lastUpdatedAt,
  onUpdateApp,
  onOpenSettingsBranding,
}) => {
  const { apartments, revenues, expenses, settings } = useBuilding();
  const [updateSuccessBanner, setUpdateSuccessBanner] = useState<string | null>(null);
  const [updateStepText, setUpdateStepText] = useState<string | null>(null);
  const [copiedInstaPay, setCopiedInstaPay] = useState(false);

  const systemInfo = useMemo(() => {
    return getAppVersionAndSystemInfo({
      apartments,
      revenues,
      expenses,
      settings,
      lastUpdatedTimestamp: lastUpdatedAt || null,
    });
  }, [apartments, revenues, expenses, settings, lastUpdatedAt]);

  if (!isOpen) return null;

  const handleTriggerUpdate = async (reloadImmediately = false) => {
    setUpdateSuccessBanner(null);
    setUpdateStepText('١/٣ جاري فحص أحدث نسخة وتحديث عامل الخدمة (Service Worker)...');
    await new Promise(resolve => setTimeout(resolve, 250));
    setUpdateStepText('٢/٣ جاري تحديث ملفات الواجهة ومسح الكاش القديم مع الحفاظ التام على البيانات...');
    await onUpdateApp(reloadImmediately);
    setUpdateStepText(null);
    setUpdateSuccessBanner(
      `تم تحديث البرنامج المثبت على جهازك إلى أحدث إصدار (v${systemInfo.version} - بناء ${systemInfo.buildNumber}) بنجاح! جميع بيانات السكان والإيرادات والمصروفات محفوظة بالكامل.`
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

  return (
    <div
      data-testid="app-update-and-info-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 my-4">
        {/* Top Header */}
        <div className="bg-gradient-to-l from-slate-900 via-teal-950 to-indigo-950 p-5 sm:p-6 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                {settings.appIconUrl ? (
                  <img
                    src={settings.appIconUrl}
                    alt={systemInfo.buildingName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  تحديث البرنامج المثبت ومعلومات النظام
                </h2>
                <span
                  data-testid="app-version-badge"
                  className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black font-mono"
                >
                  v{systemInfo.version}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {systemInfo.programName} — <strong className="text-white">{systemInfo.buildingName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* 1. Installed App Update Section (تحديث البرنامج المثبت على الجهاز لأحدث نسخة) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white space-y-4 shadow-md border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  <RefreshCw className={`w-5 h-5 ${isUpdatingApp || updateStepText ? 'animate-spin' : ''}`} />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    تحديث البرنامج المثبت على الجهاز لأحدث نسخة (v{systemInfo.version})
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    يقوم بتحديث ملفات التطبيق المثبت على هاتفك أو جهازك وتفعيل آخر الميزات فوراً دون المساس ببيانات السكان أو الخزينة.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-200 shrink-0 self-start sm:self-center">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>بناء: {systemInfo.buildNumber}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                data-testid="trigger-app-update-btn"
                disabled={isUpdatingApp || Boolean(updateStepText)}
                onClick={() => handleTriggerUpdate(false)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm transition shadow-md cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isUpdatingApp || updateStepText ? 'animate-spin' : ''}`} />
                <span>
                  {isUpdatingApp || updateStepText
                    ? 'جاري تحديث البرنامج المثبت...'
                    : 'تحديث البرنامج المثبت لأحدث نسخة الآن'}
                </span>
              </button>

              <button
                type="button"
                data-testid="force-reload-updated-app-btn"
                disabled={isUpdatingApp || Boolean(updateStepText)}
                onClick={() => handleTriggerUpdate(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>تحديث وإعادة تشغيل التطبيق فوراً</span>
              </button>
            </div>

            {/* Progress / Status Feedback */}
            {updateStepText && (
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-emerald-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300 shrink-0" />
                <span>{updateStepText}</span>
              </div>
            )}

            {updateSuccessBanner && (
              <div
                data-testid="app-update-success-banner"
                className="p-3.5 rounded-xl bg-emerald-500/25 border border-emerald-400 text-xs font-bold text-white flex items-start gap-2.5 animate-in fade-in duration-150"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{updateSuccessBanner}</p>
                  <p className="text-[11px] text-emerald-200">
                    آخر تحديث مسجل على هذا الجهاز: {systemInfo.lastUpdatedFormatted}
                  </p>
                </div>
              </div>
            )}

            {/* Data Safety Guarantee */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 text-[11px] text-emerald-200/90">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ضمان أمان البيانات: التحديث لا يحذف أي بيانات مسجلة ({systemInfo.apartmentsCount} شقة، {systemInfo.revenuesCount} إيصال، {systemInfo.expensesCount} مصروف محفوظة بأمان).
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-300">
                آخر تحديث: {systemInfo.lastUpdatedFormatted}
              </span>
            </div>
          </div>

          {/* 2. Comprehensive Program Information Grid (معلومات البرنامج والنظام) */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>معلومات البرنامج والنظام الحالي:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Program Name & Version */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">اسم البرنامج والإصدار</span>
                <p className="font-black text-slate-900 text-sm">{systemInfo.programName}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-black font-mono text-[11px]">
                    الإصدار {systemInfo.version}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({systemInfo.releaseDate})
                  </span>
                </div>
              </div>

              {/* Building & Treasurer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">العقار وإدارة الصندوق</span>
                <p className="font-black text-slate-900 text-sm">{systemInfo.buildingName}</p>
                <p className="text-slate-600 font-bold text-[11px]">
                  أمين الصندوق: <span className="text-slate-900">{systemInfo.treasurerName}</span>
                </p>
                {systemInfo.buildingAddress && (
                  <p className="text-[11px] text-slate-500 truncate">{systemInfo.buildingAddress}</p>
                )}
              </div>

              {/* Installation & Offline Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-semibold block">حالة التثبيت والاتصال</span>
                <div className="flex items-center gap-1.5 font-black text-slate-900">
                  <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    {isInstalled ? 'مثبّت كتطبيق مستقل على الجهاز' : 'يعمل عبر المتصفح (قابل للتثبيت)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
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

              {/* Local Database Statistics */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>قاعدة البيانات المحفوظة على الجهاز</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap pt-1 font-bold text-slate-800">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {systemInfo.apartmentsCount} شقة
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {systemInfo.revenuesCount} سند قبض
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                    {systemInfo.expensesCount} مصروف
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-0.5">
                  حجم التخزين المحلي التقريبي: <strong className="font-mono">{systemInfo.estimatedStorageKb} KB</strong>
                </p>
              </div>

              {/* Custom Icon & Official Stamp Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>هوية البرنامج والختم الرسمي</span>
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      systemInfo.hasCustomAppIcon
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {systemInfo.hasCustomAppIcon ? 'أيقونة مخصصة مفعّلة ✓' : 'الأيقونة الافتراضية'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      systemInfo.hasCustomOfficialStamp
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {systemInfo.hasCustomOfficialStamp ? 'ختم رسمي مفعّل ✓' : 'الختم الافتراضي'}
                  </span>
                </div>
                {onOpenSettingsBranding && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettingsBranding();
                    }}
                    className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer block pt-0.5"
                  >
                    تغيير صورة الأيقونة أو الختم الرسمي ←
                  </button>
                )}
              </div>

              {/* InstaPay Payment Info */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>عنوان الدفع انستا باي (InstaPay)</span>
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
          </div>

          {/* 3. What's New in Latest Version (سجل تحديثات وميزات النسخة الحالية) */}
          <div className="space-y-2.5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أبرز الميزات والتحديثات في النسخة الحالية (v{systemInfo.version}):</span>
            </h3>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {systemInfo.changelogFeatures.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-black text-xs sm:text-sm text-slate-900">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pr-6 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      item.badge.includes('جديد')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-600 font-bold">
            <span>رقم الإصدار: </span>
            <span className="font-mono font-black text-slate-900">
              v{systemInfo.version} ({systemInfo.cacheVersion})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
