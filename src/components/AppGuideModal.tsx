import React from 'react';
import {
  X,
  HelpCircle,
  Wifi,
  WifiOff,
  DownloadCloud,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MobileInstallGuideSection } from './MobileInstallGuideSection';

interface AppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  onInstall: () => Promise<boolean> | void;
  onOpenBackup: () => void;
}

export const AppGuideModal: React.FC<AppGuideModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isOnline,
  onInstall,
  onOpenBackup,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="app-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <DownloadCloud className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">دليل التشغيل وتثبيت التطبيق على الهواتف</h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                ثبّت التطبيق على الشاشة الرئيسية للهاتف (iOS & Android) ليعمل كتطبيق مستقل وبدون إنترنت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">حالة الاتصال الحالية:</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                متصل بالإنترنت (Online)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                وضع عدم الاتصال (Offline) - التطبيق يعمل بكفاءة
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Prominent Mobile Home Screen Installation Section (iOS Safari & Android Chrome + Interactive Install Button) */}
          <MobileInstallGuideSection
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            onInstall={onInstall}
          />

          {/* Question 1 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-base">
                  1. من أين أقوم بتشغيل التطبيق؟
                </h3>
                <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
                  يمكنك تشغيل التطبيق بعدة طرق سهلة وسريعة:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-slate-800">مباشرة من المتصفح (Cloud Link):</strong> من خلال الرابط السحابي الخاص بالتطبيق على جهاز الكمبيوتر أو الهاتف (يدعم Chrome, Safari, Edge, Firefox).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-slate-800">تثبيته كتطبيق مستقل (PWA):</strong> اضغط على زر <span className="font-bold text-emerald-700">"تثبيت التطبيق الآن"</span> أعلاه ليصبح برنامجاً قائماً بذاته على شاشة هاتفك أو سطح مكتب حاسوبك بدون شريط متصفح وبأيقونة مخصصة.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0 mt-0.5">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-base">
                  2. هل يمكن تشغيله أوفلاين (بدون إنترنت)؟
                </h3>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>نعم 100%! التطبيق مُهيأ كـ Progressive Web App (PWA) للعمل بدون إنترنت بالكامل.</span>
                </div>
                <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
                  بمجرد فتح التطبيق مرة واحدة، يقوم نظام التخزين المؤقت المتقدم (Service Worker) بحفظ كامل الواجهات، والخطوط، والرسوم البيانية في ذاكرة جهازك.
                </p>
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-base">
                  3. هل ممكن تحديثه بعد إضافة البيانات دون فقدانها؟
                </h3>
                <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
                  <strong className="text-slate-900">نعم بالتأكيد!</strong> تم تصميم التطبيق ليفصل كلياً بين "برمجة التطبيق" و"بياناتك المالية":
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold mb-1 text-xs">
                      <HardDrive className="w-4 h-4" />
                      <span>حفظ دائم ومستمر</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      تحديث الكود أو إضافة مزايا جديدة للواجهة لا يؤثر إطلاقاً على بياناتك المخزنة في المتصفح.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1 text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>نسخ احتياطي واستعادة فورية</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      يمكنك تنزيل نسخة احتياطية بصيغة JSON بضغطة زر لنقلها لأي جهاز أو حاسوب آخر بكل أمان.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBackup();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <DownloadCloud className="w-4 h-4 text-emerald-400" />
                    <span>فتح نافذة النسخ الاحتياطي وتصدير البيانات الآن</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            فهمت، شكراً لك
          </button>
        </div>

      </div>
    </div>
  );
};
