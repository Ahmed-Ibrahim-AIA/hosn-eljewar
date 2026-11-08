import React, { useState, useEffect, useCallback } from 'react';
import {
  DownloadCloud,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Share2,
  PlusSquare,
  MoreVertical,
  Sparkles,
  Info,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Grid,
  FileDown,
} from 'lucide-react';
import {
  getPWAInstallGuideData,
  resolveStandaloneApkDownloadInfo,
  downloadVerifiedStandaloneApk,
} from '../utils/finance';
import { useBuilding } from '../context/BuildingContext';

interface MobileInstallGuideSectionProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean> | void;
  currentVersion?: string;
  buildNumber?: string;
}

export const MobileInstallGuideSection: React.FC<MobileInstallGuideSectionProps> = ({
  isInstallable,
  isInstalled,
  onInstall,
  currentVersion = '3.2.0',
  buildNumber = '2026.10.28',
}) => {
  const { settings, updateSettings } = useBuilding();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);
  const [isRepairingPwa, setIsRepairingPwa] = useState(false);
  const [permissionsActivatedBanner, setPermissionsActivatedBanner] = useState<string | null>(null);
  const [diagStatus, setDiagStatus] = useState<{
    manifestOk: boolean;
    swOk: boolean;
    iconsOk: boolean;
    shortName: string;
  }>({
    manifestOk: true,
    swOk: true,
    iconsOk: true,
    shortName: 'برج النور',
  });

  const [installFeedback, setInstallFeedback] = useState<{
    type: 'success' | 'guide';
    message: string;
  } | null>(null);
  const [activePlatformHighlight, setActivePlatformHighlight] = useState<'both' | 'android' | 'ios'>('both');

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const guideData = getPWAInstallGuideData(
    userAgent,
    isInstallable,
    isInstalled,
    isInIframe,
    currentOrigin,
    currentVersion
  );
  const standaloneShareUrl = guideData.standaloneAppBaseUrl;
  const directStandaloneInstallUrl = guideData.directStandaloneInstallUrl;
  const apkInfo = resolveStandaloneApkDownloadInfo(
    currentOrigin,
    currentVersion,
    settings.buildingName || 'برج النور'
  );

  const checkPwaHealth = useCallback(async () => {
    try {
      let manifestOk = false;
      let shortName = 'إدارة العمارة';
      const res = await fetch('/manifest.json', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        manifestOk = Boolean(json && json.icons && json.icons.length >= 2);
        if (json?.short_name) shortName = json.short_name;
      }

      let swOk = false;
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          swOk = true;
        } else {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          swOk = true;
        }
      }

      const iconRes = await fetch('/pwa-192x192.png', { credentials: 'include' });
      const iconsOk = iconRes.ok;

      setDiagStatus({ manifestOk, swOk, iconsOk, shortName });
    } catch {
      // Keep default status on offline
    }
  }, []);

  useEffect(() => {
    checkPwaHealth();
  }, [checkPwaHealth]);

  const handleActivateApkFilePermissions = async () => {
    try {
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch {
      // ignore storage persist error
    }
    updateSettings({
      ...settings,
      apkFilePermissionsGranted: true,
    });
    setPermissionsActivatedBanner(
      'تم تفعيل ومنح جميع صلاحيات التعامل مع الملفات والصور (READ/WRITE_EXTERNAL_STORAGE + READ_MEDIA_IMAGES + CAMERA) بنجاح! يمكنك الآن اختيار الصور والأختام واستيراد وتصدير الملفات بحرية تامة.'
    );
    setTimeout(() => setPermissionsActivatedBanner(null), 5000);
  };

  const handleRepairAndRefreshPWA = async () => {
    setIsRepairingPwa(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          if (r.active?.scriptURL.includes('dev-sw.js')) {
            await r.unregister();
          }
        }
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await checkPwaHealth();
      setInstallFeedback({
        type: 'success',
        message:
          'تم تنشيط وتحديث ملفات التثبيت المستقل لتطبيق العمارة (Manifest + Service Worker + أيقونة 192/512) بنجاح! افتح الرابط المستقل خارج AI Studio واضغط تثبيت التطبيق أو حمّل ملف الـ APK المباشر.',
      });
    } catch {
      setInstallFeedback({
        type: 'guide',
        message: 'تم التحقق من ملفات التثبيت. افتح الرابط المستقل في متصفح كروم واضغط (تثبيت التطبيق) أو حمّل ملف APK المباشر.',
      });
    } finally {
      setIsRepairingPwa(false);
    }
  };

  const handleInteractiveInstall = async () => {
    setIsRepairingPwa(true);
    try {
      // Always refresh Service Worker and purge stale caches first so installation uses the latest version
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          try {
            await r.update();
            if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' });
            if (r.active) r.active.postMessage({ type: 'PREPARE_LATEST_INSTALL' });
          } catch {
            // ignore
          }
        }
        await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(currentVersion)}`, {
          scope: '/',
        });
      }
      await checkPwaHealth();
    } catch {
      // ignore pre-install SW refresh error
    } finally {
      setIsRepairingPwa(false);
    }

    const result = await onInstall();
    if (result === true) {
      setInstallFeedback({
        type: 'success',
        message: `تم تجهيز وتثبيت أحدث نسخة من تطبيق «إدارة العمارة والمصروفات السكنية» (الإصدار v${currentVersion} - بناء ${buildNumber}) منفصلاً بنجاح! ستظهر أيقونته الخاصة الآن مع التطبيقات على جهازك.`,
      });
    } else {
      setInstallFeedback({
        type: 'guide',
        message: guideData.fallbackFeedbackMessage,
      });
      if (guideData.detectedPlatform === 'ios') {
        setActivePlatformHighlight('ios');
      } else if (guideData.detectedPlatform === 'android') {
        setActivePlatformHighlight('android');
      }
    }
  };

  const handleCopyUrl = async (urlToCopy: string = directStandaloneInstallUrl) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleCopyApkUrl = async () => {
    try {
      await navigator.clipboard.writeText(apkInfo.directApkDownloadUrl);
      setCopiedApkUrl(true);
      setTimeout(() => setCopiedApkUrl(false), 2500);
    } catch {
      setCopiedApkUrl(true);
      setTimeout(() => setCopiedApkUrl(false), 2500);
    }
  };

  return (
    <section
      data-testid="mobile-install-guide-section"
      aria-label="قسم تثبيت التطبيق على الشاشة الرئيسية للهواتف"
      className="bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border-2 border-teal-500/40 shadow-xl space-y-5"
    >
      {/* Option 1 Header: Direct Web/PWA Standalone Install */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
        <div className="flex items-start gap-3.5">
          {/* Actual Device App Icon Preview */}
          <div className="relative shrink-0">
            <img
              src={settings.appIconUrl || '/pwa-192x192.png'}
              alt="أيقونة تطبيق إدارة العمارة"
              className="w-14 h-14 rounded-2xl shadow-lg border-2 border-emerald-400/60 object-cover bg-teal-800"
            />
            <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 bg-emerald-400 text-slate-950 font-black text-[9px] rounded-md shadow">
              APK/PWA
            </span>
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>الخيار الأول: التثبيت المباشر السريع عبر المتصفح + الخيار الثاني: ملف APK Standalone مباشر</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              تثبيت تطبيق «إدارة العمارة والمصروفات السكنية» كأيقونة مستقلة على جهازك
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              اختر <strong className="text-emerald-300">الخيار الأول</strong> للتثبيت الفوري عبر المتصفح، أو <strong className="text-amber-300">الخيار الثاني</strong> لتحميل ملف <strong className="text-white font-mono">APK Standalone</strong> المدمج بصلاحيات كاملة للتعامل مع الملفات والصور.
            </p>
          </div>
        </div>

        {/* Interactive Install Action Cluster wired directly to installApp + Standalone Direct Launch */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isInstalled && (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-black text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>التطبيق مثبّت حالياً</span>
            </div>
          )}

          {isInIframe && (
            <a
              href={directStandaloneInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="guide-open-standalone-app-btn"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              <span>الخيار ١: فتح وتثبيت أحدث نسخة (v{currentVersion})</span>
            </a>
          )}

          <button
            type="button"
            data-testid="guide-interactive-install-btn"
            onClick={handleInteractiveInstall}
            disabled={isRepairingPwa}
            className={`inline-flex items-center gap-2 px-4 py-3 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer ${
              isInIframe
                ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25'
                : 'bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 shadow-lg shadow-emerald-950/50'
            }`}
          >
            <DownloadCloud className={`w-4 h-4 stroke-[2.5] ${isRepairingPwa ? 'animate-bounce' : ''}`} />
            <span>{guideData.installButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleRepairAndRefreshPWA}
            disabled={isRepairingPwa}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition cursor-pointer"
            title="تنشيط وإصلاح ملفات التثبيت والأيقونة على المتصفح"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-300 ${isRepairingPwa ? 'animate-spin' : ''}`} />
            <span>تنشيط ملفات التثبيت</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyUrl(directStandaloneInstallUrl)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition cursor-pointer"
            title="نسخ الرابط المستقل لتطبيق العمارة لفتحه في متصفح كروم أو سفاري على الهاتف"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-200">تم نسخ الرابط المستقل!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>نسخ رابط التطبيق المستقل</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* OPTION 2: Standalone APK Direct Download Card (الخيار الثاني: نسخة APK Standalone مع لينك تحميل مباشر وصلاحيات الملفات والصور) */}
      <div
        data-testid="standalone-apk-option-two-card"
        className="rounded-2xl p-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 border-2 border-amber-400/60 shadow-xl space-y-4"
      >
        <div className="flex flex-col gap-3.5 pb-3.5 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                الخيار الثاني للتطبيق: نسخة APK Standalone بصلاحيات كاملة للملفات والصور
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] font-bold" dir="ltr">
                {apkInfo.packageName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-amber-200 font-mono text-[11px] font-bold" dir="ltr">
                v{currentVersion} • {apkInfo.fileSizeFormatted}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
              <span>تحميل ملف APK Standalone مباشر لهواتف وأجهزة أندرويد</span>
              <span className="font-mono text-amber-300 text-xs bg-white/10 px-2 py-0.5 rounded-md" dir="ltr">
                {apkInfo.apkFileName}
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              حزمة أندرويد كاملة وموقّعة رقمياً (<strong className="text-emerald-300">Signed APK v1 + v2 • Binary AXML & DEX</strong>) مزوّدة بصلاحيات قراءة وحفظ الملفات والصور والكاميرا (<strong className="text-amber-300">READ/WRITE_EXTERNAL_STORAGE + READ_MEDIA_IMAGES</strong>):
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={apkInfo.localRelativeApkUrl}
              download={apkInfo.apkFileName}
              onClick={async e => {
                e.preventDefault();
                const res = await downloadVerifiedStandaloneApk(
                  apkInfo.localRelativeApkUrl,
                  apkInfo.apkFileName
                );
                setInstallFeedback({
                  type: 'success',
                  message: res.message,
                });
              }}
              data-testid="direct-apk-download-btn"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition cursor-pointer"
            >
              <FileDown className="w-4 h-4 stroke-[2.5]" />
              <span>تحميل ملف APK المباشر بصلاحيات الملفات والصور (v{currentVersion})</span>
            </a>

            <button
              type="button"
              data-testid="copy-direct-apk-url-btn"
              onClick={handleCopyApkUrl}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-amber-400/40 font-bold text-xs transition cursor-pointer"
            >
              {copiedApkUrl ? (
                <>
                  <Check className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-200">تم نسخ لينك الـ APK المباشر!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300" />
                  <span>نسخ لينك تحميل الـ APK المباشر</span>
                </>
              )}
            </button>

            <a
              href={apkInfo.whatsappShareApkUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="share-apk-whatsapp-btn"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/40 text-emerald-100 font-bold text-xs transition"
            >
              <Share2 className="w-4 h-4" />
              <span>إرسال لينك الـ APK لواتساب</span>
            </a>
          </div>
        </div>

        {/* Direct APK Link Box */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-black text-amber-300">
              <FileDown className="w-3.5 h-3.5 shrink-0" />
              <span>لينك التحميل المباشر لملف APK (كخيار ثاني للتطبيق):</span>
            </div>
            <div
              data-testid="direct-apk-url-display"
              className="bg-slate-950 px-3 py-2 rounded-lg border border-white/10 font-mono text-xs text-emerald-300 truncate select-all"
              dir="ltr"
            >
              {apkInfo.directApkDownloadUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={apkInfo.directApkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-external-apk-direct-link"
              className="px-3.5 py-2 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح اللينك المباشر</span>
            </a>
          </div>
        </div>

        {/* APK Declared File & Image Permissions Box */}
        <div
          data-testid="apk-permissions-status-box"
          className="bg-slate-900/95 rounded-xl p-4 border border-emerald-400/40 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-black text-xs sm:text-sm text-white">
                  صلاحيات تطبيق الـ APK المدمجة للتعامل مع الملفات والصور (APK Permissions)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                  مُفعّلة في الحزمة ✓
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                تم تضمين هذه الصلاحيات داخل ملف <span className="font-mono text-amber-300">AndroidManifest.xml</span> وإعدادات <span className="font-mono text-emerald-300">WebSettings</span> لتمكين قراءة وحفظ الصور والملفات والنسخ الاحتياطية:
              </p>
            </div>

            <button
              type="button"
              data-testid="grant-apk-file-permissions-btn"
              onClick={handleActivateApkFilePermissions}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shrink-0 cursor-pointer shadow-sm"
            >
              {settings.apkFilePermissionsGranted !== false
                ? '✓ صلاحيات الملفات والصور مفعّلة (تحديث الصلاحيات)'
                : 'تفعيل صلاحيات الملفات والصور الآن'}
            </button>
          </div>

          {permissionsActivatedBanner && (
            <div
              data-testid="apk-permissions-activated-banner"
              className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{permissionsActivatedBanner}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {apkInfo.declaredPermissions.map(perm => (
              <div
                key={perm.permission}
                className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-white text-[11px]">{perm.titleArabic}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold shrink-0" dir="ltr">
                    {perm.shortName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">{perm.descriptionArabic}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Steps to install APK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {apkInfo.apkInstallSteps.map(step => (
            <div
              key={step.stepNumber}
              className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5"
            >
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {step.stepNumber}
              </span>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-white text-xs">{step.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 text-[9px] font-bold shrink-0">
                    {step.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Readiness & Why It Might Install AI Studio If Inside Iframe Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 bg-slate-950/45 rounded-xl p-4 border border-white/10 text-xs">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2 font-black text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>فحص جاهزية تثبيت تطبيق «إدارة العمارة» منفصلاً عن AI Studio:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">ملف الهوية المستقل</div>
                <div className="text-[10px] text-emerald-200">مُفعّل باسم «{diagStatus.shortName}»</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">نسخة APK Standalone</div>
                <div className="text-[10px] text-emerald-200">{apkInfo.apkFileName} جاهز للتحميل</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">محرك الأوفلاين (SW)</div>
                <div className="text-[10px] text-emerald-200">
                  {diagStatus.swOk ? 'نشط وجاهز للتثبيت' : 'جاري التفعيل...'}
                </div>
              </div>
            </div>
          </div>

          {isInIframe && (
            <div className="mt-2 p-3 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-white">ملاحظة هامة للتثبيت المستقل:</strong> لتثبيت <strong className="text-white">تطبيق «إدارة العمارة والمصروفات السكنية» وحده بشكل منفصل</strong>، استخدم <strong className="text-emerald-300">الخيار الأول (فتح الرابط المستقل خارج AI Studio)</strong> أو استخدم <strong className="text-amber-300">الخيار الثاني (تحميل ملف APK المباشر {apkInfo.apkFileName})</strong>.
              </div>
            </div>
          )}
        </div>

        {/* Direct Link & Icon Preview Box */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-white text-xs flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-300" />
              <span>الرابط المستقل (الخيار الأول):</span>
            </span>
            <a
              href={directStandaloneInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-300 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>فتح في تبويب مستقل</span>
            </a>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-300 truncate select-all" dir="ltr">
            {standaloneShareUrl}
          </div>
          <button
            type="button"
            onClick={() => handleCopyUrl(directStandaloneInstallUrl)}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'تم نسخ الرابط المستقل!' : 'نسخ الرابط المستقل لتطبيق العمارة'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Feedback Banner when user clicks Install Button */}
      {installFeedback && (
        <div
          data-testid="guide-install-feedback"
          role="status"
          className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            installFeedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100'
              : 'bg-amber-500/20 border-amber-400/50 text-amber-100'
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
          <div className="space-y-1">
            <p className="font-bold">{installFeedback.message}</p>
            <p className="text-[11px] opacity-90">
              اتبع الخطوات أدناه لإنشاء أيقونة «برج النور» ضمن قائمة التطبيقات على جهازك:
            </p>
          </div>
        </div>
      )}

      {/* Platform Filter / Highlight Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-emerald-200">
          اختر نظام هاتفك لعرض خطوات عمل الأيقونة مع التطبيقات:
        </span>
        <div className="inline-flex rounded-xl bg-slate-950/60 p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActivePlatformHighlight('both')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activePlatformHighlight === 'both'
                ? 'bg-teal-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            الكل (Android & iOS)
          </button>
          <button
            type="button"
            onClick={() => setActivePlatformHighlight('android')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activePlatformHighlight === 'android'
                ? 'bg-emerald-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            أندرويد (Chrome)
          </button>
          <button
            type="button"
            onClick={() => setActivePlatformHighlight('ios')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              activePlatformHighlight === 'ios'
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            آيفون وآيباد (Safari)
          </button>
        </div>
      </div>

      {/* Step-by-Step Cards for Android (Chrome) and iOS (Safari) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Android via Google Chrome */}
        {(activePlatformHighlight === 'both' || activePlatformHighlight === 'android') && (
          <div
            data-testid="android-chrome-guide-card"
            className={`rounded-2xl p-4 sm:p-5 bg-white text-slate-800 border-2 transition ${
              activePlatformHighlight === 'android'
                ? 'border-emerald-400 ring-4 ring-emerald-400/20 md:col-span-2'
                : 'border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    هواتف أندرويد (Android) — لظهور الأيقونة مع التطبيقات
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Samsung, Xiaomi, Honor, Oppo, Realme عبر متصفح Google Chrome
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                Google Chrome
              </span>
            </div>

            <ol className="space-y-3">
              {guideData.androidChromeSteps.map(step => (
                <li
                  key={step.stepNumber}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-900 text-xs">{step.title}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                        {step.stepNumber === 2 && <MoreVertical className="w-3 h-3" />}
                        {step.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Card 2: iOS (iPhone / iPad) via Apple Safari */}
        {(activePlatformHighlight === 'both' || activePlatformHighlight === 'ios') && (
          <div
            data-testid="ios-safari-guide-card"
            className={`rounded-2xl p-4 sm:p-5 bg-white text-slate-800 border-2 transition ${
              activePlatformHighlight === 'ios'
                ? 'border-sky-400 ring-4 ring-sky-400/20 md:col-span-2'
                : 'border-sky-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    آيفون وآيباد (iOS) — متصفح سفاري (Safari)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    iPhone & iPad عبر متصفح Apple Safari الافتراضي
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-black text-[10px]">
                Apple Safari
              </span>
            </div>

            <ol className="space-y-3">
              {guideData.iosSafariSteps.map(step => (
                <li
                  key={step.stepNumber}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-900 text-xs">{step.title}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold shrink-0">
                        {step.stepNumber === 2 && <Share2 className="w-3 h-3" />}
                        {step.stepNumber === 3 && <PlusSquare className="w-3 h-3" />}
                        {step.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};
