import React from 'react';
import {
  HelpCircle,
  Wifi,
  WifiOff,
  DownloadCloud,
  RefreshCw,
  HardDrive,
  Laptop,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MobileInstallGuideSection } from './MobileInstallGuideSection';

interface GuideViewProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  onInstall: () => Promise<boolean> | void;
  onOpenBackup: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({
  isInstallable,
  isInstalled,
  isOnline,
  onInstall,
  onOpenBackup,
}) => {
  return (
    <div data-testid="guide-page-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              دليل التشغيل وتثبيت التطبيق على الهواتف
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              دليل شامل لتثبيت التطبيق على الشاشة الرئيسية للهواتف (Android & iOS)، والعمل بدون إنترنت، وحفظ النسخ الاحتياطية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>متصل بالإنترنت (Online)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs rounded-xl animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>وضع عدم الاتصال (Offline)</span>
            </span>
          )}
        </div>
      </div>

      {/* Prominent Mobile Home Screen Installation Section (iOS Safari & Android Chrome + Interactive Install Button) */}
      <MobileInstallGuideSection
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={onInstall}
      />

      {/* Operating & Offline FAQ Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              1. من أين أقوم بتشغيل التطبيق؟
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            يمكنك تشغيل التطبيق مباشرةً من الرابط السحابي على أي متصفح (Chrome, Safari, Edge)، أو تثبيته كتطبيق مستقل (PWA) على شاشة هاتفك الرئيسية ليعمل بملء الشاشة وبسرعة فائقة.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              2. العمل أوفلاين (بدون إنترنت)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            بمجرد فتح التطبيق أو تثبيته على هاتفك، يحفظ نظام (Service Worker) جميع الواجهات والخطوط على جهازك لتتمكن من تسجيل الإيرادات والمصروفات وعرض التقارير بدون اتصال بالإنترنت.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 pt-1">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>حفظ تلقائي وفوري على ذاكرة جهازك</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-base">
                3. حفظ البيانات والنسخ الاحتياطي
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              تحديث التطبيق لا يؤثر على بياناتك المالية المسجلة. كما يمكنك دائماً تصدير نسخة احتياطية كاملة (JSON) لنقلها لأي هاتف أو حاسوب آخر بأمان.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenBackup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-400" />
              <span>فتح النسخ الاحتياطي وتصدير البيانات</span>
            </button>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>آمن 100%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
