import React, { useState } from 'react';
import {
  DownloadCloud,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  X,
  Share2,
  MoreVertical,
  FileDown,
} from 'lucide-react';
import {
  resolveStandaloneBuildingAppUrls,
  resolveDynamicAppVersion,
  resolveStandaloneApkDownloadInfo,
  downloadVerifiedStandaloneApk,
} from '../utils/finance';

interface StandaloneBuildingAppInstallerProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean> | void;
  buildingName?: string;
  appIconUrl?: string;
  updateRevision?: number;
}

export const StandaloneBuildingAppInstallModal: React.FC<StandaloneBuildingAppInstallerProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onInstall,
  buildingName = 'برج النور',
  appIconUrl,
  updateRevision = 0,
}) => {
  const [copiedStandaloneUrl, setCopiedStandaloneUrl] = useState(false);
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);
  const [directPromptMessage, setDirectPromptMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const dynamicVersion = resolveDynamicAppVersion(updateRevision).version;
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const { standaloneAppBaseUrl, directStandaloneInstallUrl } =
    resolveStandaloneBuildingAppUrls(currentOrigin, dynamicVersion);
  const apkInfo = resolveStandaloneApkDownloadInfo(currentOrigin, dynamicVersion, buildingName);

  const handleCopyStandaloneUrl = async () => {
    try {
      await navigator.clipboard.writeText(directStandaloneInstallUrl);
      setCopiedStandaloneUrl(true);
      setTimeout(() => setCopiedStandaloneUrl(false), 3000);
    } catch {
      setCopiedStandaloneUrl(true);
      setTimeout(() => setCopiedStandaloneUrl(false), 3000);
    }
  };

  const handleCopyApkUrl = async () => {
    try {
      await navigator.clipboard.writeText(apkInfo.directApkDownloadUrl);
      setCopiedApkUrl(true);
      setTimeout(() => setCopiedApkUrl(false), 3000);
    } catch {
      setCopiedApkUrl(true);
      setTimeout(() => setCopiedApkUrl(false), 3000);
    }
  };

  const handleTriggerNativeInstall = async () => {
    const res = await onInstall();
    if (res === true) {
      setDirectPromptMessage(
        `تم تجهيز وتثبيت أحدث نسخة (v${dynamicVersion}) من تطبيق «إدارة العمارة والمصروفات السكنية» منفصلاً بنجاح! ستجده الآن بأيقونته المستقلة مع تطبيقات جهازك.`
      );
    } else if (isInIframe) {
      setDirectPromptMessage(
        `تم تحديث ملفات النسخة الأحدث (v${dynamicVersion})! اختر الخيار الأول لفتح الرابط المستقل أو الخيار الثاني لتحميل ملف APK المباشر (${apkInfo.apkFileName}).`
      );
    } else {
      setDirectPromptMessage(
        `تم تجهيز أحدث نسخة (v${dynamicVersion})! افتح قائمة المتصفح (⋮ في أعلى كروم أو زر المشاركة في سفاري) واختر «تثبيت التطبيق» أو حمّل ملف APK المباشر من الخيار الثاني أدناه.`
      );
    }
  };

  return (
    <div
      data-testid="standalone-building-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-teal-500/40 my-6">
        {/* Top Header */}
        <div className="bg-gradient-to-l from-teal-900 via-emerald-900 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={appIconUrl || '/pwa-192x192.png'}
              alt="أيقونة تطبيق إدارة العمارة"
              className="w-14 h-14 rounded-2xl border-2 border-emerald-400 shadow-lg bg-teal-800 object-cover shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-black mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>خياران للتثبيت: تثبيت مباشر (PWA) + ملف APK Standalone مباشر</span>
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                تثبيت تطبيق «إدارة العمارة والمصروفات السكنية - {buildingName}» منفصلاً
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-800 text-xs sm:text-sm max-h-[78vh] overflow-y-auto">
          {/* Option 1: Direct Standalone Web/PWA Launch & Install */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white space-y-4 shadow-lg">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs">
                الخيار الأول: التثبيت السريع المباشر عبر المتصفح (Android / iOS / PC)
              </span>
              <span className="text-[11px] text-emerald-200 font-bold">بدون إطار AI Studio</span>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              اضغط على الزر التالي لفتح تطبيق <strong>«إدارة العمارة والمصروفات السكنية»</strong> في نافذة متصفح مستقلة تماماً عن AI Studio وتثبيته كأيقونة مستقلة فوراً:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={directStandaloneInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="open-standalone-app-direct-link"
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition text-center"
              >
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                <span>فتح وتثبيت تطبيق العمارة منفصلاً (الخيار الأول)</span>
              </a>

              <button
                type="button"
                data-testid="copy-standalone-app-url-btn"
                onClick={handleCopyStandaloneUrl}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedStandaloneUrl ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-emerald-200">تم نسخ الرابط المستقل!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-300" />
                    <span>نسخ الرابط المستقل</span>
                  </>
                )}
              </button>
            </div>

            {/* Standalone URL Display + Direct Native Trigger */}
            <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
              <div className="bg-slate-950/70 px-3 py-2 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-300 truncate select-all flex-1" dir="ltr">
                {standaloneAppBaseUrl}
              </div>
              {isInstalled ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/30 text-emerald-200 font-black text-[11px] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مثبّت بالفعل</span>
                </span>
              ) : (
                <button
                  type="button"
                  data-testid="modal-direct-install-trigger-btn"
                  onClick={handleTriggerNativeInstall}
                  className="px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>{isInstallable ? 'تثبيت الآن' : 'تفعيل التثبيت المباشر'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Standalone APK Direct Download Link (الخيار الثاني) */}
          <div
            data-testid="modal-apk-option-two-section"
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white space-y-4 border-2 border-amber-400/50 shadow-lg"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                الخيار الثاني: نسخة APK Standalone مع لينك تحميل مباشر لملف APK
              </span>
              <span className="text-[11px] text-amber-200 font-mono font-bold">
                {apkInfo.packageName} • v{dynamicVersion}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              حمّل ملف الحزمة المستقل <strong className="text-amber-300 font-mono">{apkInfo.apkFileName}</strong> مباشرة كخيار ثانٍ لتثبيت التطبيق على هواتف وأجهزة أندرويد أو مشاركة لينك التحميل المباشر لملف الـ APK:
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={apkInfo.localRelativeApkUrl}
                download={apkInfo.apkFileName}
                onClick={async e => {
                  e.preventDefault();
                  const res = await downloadVerifiedStandaloneApk(
                    apkInfo.localRelativeApkUrl,
                    apkInfo.apkFileName
                  );
                  setDirectPromptMessage(res.message);
                }}
                data-testid="modal-direct-apk-download-btn"
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition text-center cursor-pointer"
              >
                <FileDown className="w-4 h-4 stroke-[2.5]" />
                <span>تحميل ملف APK المباشر الآن ({apkInfo.apkFileName} — 436 KB)</span>
              </a>

              <button
                type="button"
                data-testid="modal-copy-apk-url-btn"
                onClick={handleCopyApkUrl}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedApkUrl ? (
                  <>
                    <Check className="w-4 h-4 text-amber-300" />
                    <span className="text-amber-200">تم نسخ لينك الـ APK!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-300" />
                    <span>نسخ لينك الـ APK المباشر</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct APK URL Display + WhatsApp Share */}
            <div className="pt-2 border-t border-white/15 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-amber-200 font-bold">
                <span>لينك التحميل المباشر لملف APK (كخيار ثاني للتطبيق):</span>
                <span className="font-mono text-emerald-300">Direct APK Link</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                <div
                  data-testid="modal-direct-apk-url-text"
                  className="bg-slate-950/85 px-3 py-2 rounded-lg border border-amber-400/30 font-mono text-[11px] text-amber-300 truncate select-all flex-1"
                  dir="ltr"
                >
                  {apkInfo.directApkDownloadUrl}
                </div>
                <a
                  href={apkInfo.whatsappShareApkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/30 text-emerald-100 font-bold text-[11px] flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>إرسال لينك APK لواتساب</span>
                </a>
              </div>
            </div>
          </div>

          {directPromptMessage && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs font-bold leading-relaxed">
              {directPromptMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-semibold">
            يظهر التطبيق بعد التثبيت باسم «إدارة العمارة» وأيقونة برج النور المستقلة
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

interface StandaloneDirectInstallBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean> | void;
  onOpenInstallModal: () => void;
  onOpenUpdateAndInfo?: () => void;
  buildingName?: string;
  appIconUrl?: string;
}

/**
 * Prominent banner shown automatically when the user opens the standalone URL (?install_standalone=1)
 * or when they want a 1-click bar to install the Building Management App separately from AI Studio.
 */
export const StandaloneDirectInstallBanner: React.FC<StandaloneDirectInstallBannerProps> = ({
  isInstallable,
  isInstalled,
  onInstall,
  onOpenInstallModal,
  onOpenUpdateAndInfo,
  buildingName = 'برج النور',
  appIconUrl,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  if (isInstalled || dismissed) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isStandaloneInstallMode =
    searchParams?.get('install_standalone') === '1' || searchParams?.get('standalone') === '1';

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const { directStandaloneInstallUrl, localRelativeApkUrl, apkFileName, latestVersionTag } =
    resolveStandaloneBuildingAppUrls(currentOrigin);

  const handleDirectInstallClick = async () => {
    if (isInstallable) {
      const ok = await onInstall();
      if (ok) {
        setStatusNote('تم تثبيت تطبيق إدارة العمارة والمصروفات السكنية بنجاح!');
      }
      return;
    }
    if (isInIframe) {
      onOpenInstallModal();
      return;
    }
    setStatusNote(
      'أنت الآن في الرابط المستقل لتطبيق العمارة (خارج AI Studio)! اضغط على النقاط الثلاث (⋮) أعلى متصفح كروم واختر «تثبيت التطبيق» أو حمّل ملف الـ APK المباشر كخيار ثانٍ.'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directStandaloneInstallUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      data-testid="standalone-direct-install-banner"
      className={`no-print border-b shadow-xs ${
        isStandaloneInstallMode
          ? 'bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/40'
          : 'bg-gradient-to-l from-teal-950 via-slate-900 to-slate-900 text-white border-teal-500/30'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <img
            src={appIconUrl || '/pwa-192x192.png'}
            alt="أيقونة تطبيق العمارة"
            className="w-10 h-10 rounded-xl border border-emerald-400/60 shadow-sm shrink-0 bg-teal-800 object-cover"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-white text-xs sm:text-sm">
                تثبيت تطبيق «إدارة العمارة والمصروفات السكنية - {buildingName}» منفصلاً
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                تطبيق مستقل + APK مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isInIframe
                ? 'الخيار ١: افتح الرابط المستقل للتثبيت المباشر — الخيار ٢: حمّل ملف APK Standalone برابط مباشر:'
                : 'أنت الآن في الرابط المستقل لتطبيق العمارة — ثبّت التطبيق مباشرة أو حمّل ملف الـ APK المستقل:'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isInIframe ? (
            <>
              <a
                href={directStandaloneInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="banner-open-standalone-app-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>الخيار ١: فتح وتثبيت مستقل</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-emerald-300" />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="banner-direct-install-now-btn"
              onClick={handleDirectInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>الخيار ١: تثبيت التطبيق الآن</span>
            </button>
          )}

          {/* Option 2 Direct APK Download Button */}
          <a
            href={localRelativeApkUrl}
            download={apkFileName}
            onClick={async e => {
              e.preventDefault();
              const res = await downloadVerifiedStandaloneApk(localRelativeApkUrl, apkFileName);
              setStatusNote(res.message);
            }}
            data-testid="banner-direct-apk-download-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer"
            title="الخيار الثاني: تحميل مباشر لملف APK Standalone"
          >
            <FileDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>الخيار ٢: تحميل APK مباشر (436 KB)</span>
          </a>

          <button
            type="button"
            onClick={onOpenInstallModal}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-400/30 font-bold text-xs transition cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5" />
            <span>خيارات ولينك الـ APK</span>
          </button>

          {onOpenUpdateAndInfo && (
            <button
              type="button"
              data-testid="banner-update-app-info-btn"
              onClick={onOpenUpdateAndInfo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 border border-indigo-400/40 font-bold text-xs transition cursor-pointer"
              title="تحديث البرنامج المثبت على الجهاز لأحدث نسخة ومعلومات البرنامج"
            >
              <span>تحديث البرنامج ومعلوماته (v{latestVersionTag})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="إخفاء شريط التثبيت"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs font-bold flex items-center justify-between gap-2">
            <span>{statusNote}</span>
            <button
              type="button"
              onClick={() => setStatusNote(null)}
              className="text-emerald-200 hover:text-white text-[11px] underline"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
