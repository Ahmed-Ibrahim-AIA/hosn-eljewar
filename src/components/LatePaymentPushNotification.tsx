import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Wallet,
  Building2,
  Filter,
  VolumeX,
  Volume2,
  CalendarClock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import {
  buildLatePaymentPushSummary,
  generateTenantReminderText,
  formatMoney,
} from '../utils/finance';
import { ApartmentDrawerTab } from './ApartmentDetailDrawer';

interface LatePaymentPushNotificationProps {
  activeTab: 'dashboard' | 'units' | 'revenues' | 'expenses' | 'reports' | 'guide';
  onSelectUnit: (unitId: string, initialTab?: ApartmentDrawerTab) => void;
  onCollectPayment: (unitId: string) => void;
  onNavigateToOverdueUnits: () => void;
  onOpenBulkWhatsApp?: () => void;
}

const TAB_LABELS: Record<LatePaymentPushNotificationProps['activeTab'], string> = {
  dashboard: 'لوحة التحكم الرئيسية',
  units: 'سجل الشقق والسكان',
  revenues: 'سجل الإيرادات والتحصيل',
  expenses: 'سجل المصروفات والصيانة',
  reports: 'التقارير المالية والميزانية',
  guide: 'دليل التشغيل وتثبيت التطبيق',
};

export const LatePaymentPushNotification: React.FC<LatePaymentPushNotificationProps> = ({
  activeTab,
  onSelectUnit,
  onCollectPayment,
  onNavigateToOverdueUnits,
  onOpenBulkWhatsApp,
}) => {
  const { apartments, revenues, selectedMonth, settings } = useBuilding();

  // Track whether the notification toast is currently open, minimized, or muted for this session
  const [isOpen, setIsOpen] = useState(true);
  const [isExpandedList, setIsExpandedList] = useState(false);
  const [isSessionMuted, setIsSessionMuted] = useState(false);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  const summary = buildLatePaymentPushSummary(
    apartments,
    revenues,
    selectedMonth,
    settings.lateRentAlertDay ?? 10,
    '2026-10-23',
    settings.enableLateRentAlerts !== false
  );

  // Trigger push notification whenever the user opens/switches to any page (activeTab)
  useEffect(() => {
    if (summary.shouldTriggerPush && !isSessionMuted) {
      setIsOpen(true);
      setPulseTrigger((prev) => prev + 1);
    }
  }, [activeTab, selectedMonth, summary.shouldTriggerPush, isSessionMuted]);

  if (!summary.shouldTriggerPush) {
    return null;
  }

  // Minimized pill button in bottom-left so user can reopen the push notification summary anytime
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 left-5 z-40 print:hidden" dir="rtl">
        <button
          type="button"
          onClick={() => {
            setIsSessionMuted(false);
            setIsOpen(true);
          }}
          className="group flex items-center gap-2.5 bg-rose-950/95 hover:bg-rose-900 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-rose-950/30 border border-rose-500/40 transition-all duration-200 hover:scale-[1.02]"
          title="إظهار ملخص تنبيهات الدفع المتأخر"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
          <div className="text-right">
            <span className="text-xs font-black block leading-tight">
              تنبيه دفع: {summary.overdueUnitsCount} شقق متأخرة
            </span>
            <span className="text-[10px] text-rose-200 font-bold block">
              إجمالي {formatMoney(summary.totalOverdueAmount, settings.currency)} • اضغط لعرض الملخص
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      key={`push-${pulseTrigger}`}
      className="mb-5 print:hidden animate-in fade-in slide-in-from-top-2 duration-300"
      dir="rtl"
      role="region"
      aria-label="إشعار دفع فوري للشقق المتأخرة"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-rose-950 via-slate-900 to-slate-900 text-white border border-rose-500/40 shadow-xl shadow-rose-950/10">
        {/* Decorative top accent bar */}
        <div className="h-1 w-full bg-gradient-to-l from-rose-500 via-amber-400 to-rose-600" />

        <div className="p-4 sm:p-5">
          {/* Header & Quick Summary Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0 w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
                <BellRing className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/25 text-rose-200 border border-rose-400/30">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    إشعار دفع فوري (Push Notification)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200">
                    <CalendarClock className="w-3 h-3 text-amber-300" />
                    تم تجاوز يوم الاستحقاق ({summary.dueDay} من الشهر) منذ {summary.daysPastDue} يوم
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    • الصفحة الحالية: {TAB_LABELS[activeTab]}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                  ملخص سريع: توجد{' '}
                  <span className="text-amber-300 underline decoration-amber-400/60 underline-offset-4">
                    {summary.overdueUnitsCount} شقق
                  </span>{' '}
                  لم تسدد إيجار/اشتراك شهر ({selectedMonth}) بإجمالي متأخرات{' '}
                  <span className="text-rose-300 font-black">
                    {formatMoney(summary.totalOverdueAmount, settings.currency)}
                  </span>
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  موزعة بين{' '}
                  <span className="font-bold text-white">
                    {summary.tenantsOverdueCount} مستأجرين
                  </span>{' '}
                  و{' '}
                  <span className="font-bold text-white">
                    {summary.ownersOverdueCount} ملاك مقيمين
                  </span>
                  {' — '}الشقق المتأخرة:{' '}
                  <span className="text-amber-200 font-bold">
                    {summary.unpaidUnits
                      .map((u) => `شقة ${u.apartment.number} (${u.apartment.residentName})`)
                      .join('، ')}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenBulkWhatsApp && (
                <button
                  type="button"
                  data-testid="push-bulk-overdue-whatsapp-btn"
                  onClick={onOpenBulkWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>إرسال واتساب لكل المتأخرين بضغطة واحدة</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpandedList((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
              >
                {isExpandedList ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                    إخفاء تفصيل الشقق ({summary.overdueUnitsCount})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                    عرض الملخص التفصيلي والتحصيل ({summary.overdueUnitsCount})
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateToOverdueUnits}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                الشقق المتأخرة فقط
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSessionMuted(true);
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                title="إيقاف التكرار التلقائي عند التنقل بين الصفحات خلال هذه الجلسة"
              >
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">كتم مؤقت</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="تصغير الإشعار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Grouped Units Breakdown */}
          {isExpandedList && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {summary.unpaidUnits.map((item) => {
                const cleanPhone = (item.apartment.phone || '').replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('0')
                  ? '20' + cleanPhone.slice(1)
                  : cleanPhone;
                const waMessage = generateTenantReminderText({
                  residentName: item.apartment.residentName,
                  unitNumber: item.apartment.number,
                  overdueAmount: item.remainingAmount,
                  currency: settings.currency,
                  buildingName: settings.buildingName,
                  treasurerName: settings.treasurerName,
                  monthTarget: selectedMonth,
                  paymentDetails: settings.bankAccountDetails,
                  tone: 'gentle',
                });
                const whatsappUrl = cleanPhone
                  ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMessage)}`
                  : '';

                return (
                  <div
                    key={item.apartment.id}
                    className="bg-slate-950/60 border border-white/10 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-rose-400/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">
                            شقة {item.apartment.number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              item.apartment.residentType === 'tenant'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {item.apartment.residentType === 'tenant' ? 'مستأجر' : 'مالك'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              item.status === 'unpaid'
                                ? 'bg-rose-500/25 text-rose-300'
                                : 'bg-amber-500/25 text-amber-200'
                            }`}
                          >
                            {item.status === 'unpaid' ? 'غير مسدد' : 'سداد جزئي'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-1">
                          {item.apartment.residentName}
                        </p>
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block">المتبقي</span>
                        <span className="text-xs font-black text-rose-400">
                          {formatMoney(item.remainingAmount, settings.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => onCollectPayment(item.apartment.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
                      >
                        <Wallet className="w-3 h-3" />
                        سداد الآن
                      </button>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                          title={`إرسال تذكير واتساب إلى ${item.apartment.residentName}`}
                        >
                          <MessageCircle className="w-3 h-3" />
                          واتساب
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectUnit(item.apartment.id, 'finance')}
                        className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-bold transition-colors"
                        title="فتح ملف تعريف الشقة"
                      >
                        <Building2 className="w-3 h-3" />
                        الملف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
