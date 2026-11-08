import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Clock,
  CalendarClock,
  CheckCircle2,
  X,
  Mail,
  MessageCircle,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { useBuilding } from '../context/BuildingContext';
import {
  evaluatePreDueReminderSchedule,
  formatMoney,
  formatMonthYearArabic,
  generateTenantReminderText,
} from '../utils/finance';
import { Apartment } from '../types';
import { ApartmentDrawerTab } from './ApartmentDetailDrawer';

interface PreDueBrowserReminderBannerProps {
  onOpenSettings: () => void;
  onEmailTenantReport?: (apartment: Apartment) => void;
  onNavigateToUnits?: () => void;
  onSelectUnit?: (unitId: string, tab?: ApartmentDrawerTab) => void;
  onCollectPayment?: (unitId: string) => void;
}

export const PreDueBrowserReminderBanner: React.FC<PreDueBrowserReminderBannerProps> = ({
  onOpenSettings,
  onEmailTenantReport,
  onNavigateToUnits,
  onSelectUnit,
  onCollectPayment,
}) => {
  const { apartments, revenues, settings, selectedMonth, isReadOnly } = useBuilding();

  const isEnabled = settings.enablePreDueBrowserReminder !== false;
  const dueDay = settings.lateRentAlertDay ?? 10;
  const preDueDays = settings.preDueReminderDays ?? 3;

  // Allow user to test/preview the exact 3-day pre-due window in browser or use current date
  const [simulateThreeDaysBefore, setSimulateThreeDaysBefore] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [browserToastVisible, setBrowserToastVisible] = useState<boolean>(false);
  const [notificationPermissionState, setNotificationPermissionState] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
      return 'in_app';
    } catch {
      return 'in_app';
    }
  });

  // Compute reference date: either real reference date ('2026-10-23') or simulated 3-days-before date
  const effectiveReferenceDate = useMemo(() => {
    if (simulateThreeDaysBefore) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const dObj = new Date(y || 2026, (m || 10) - 1, Math.max(1, dueDay - preDueDays));
      const yy = dObj.getFullYear();
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dObj.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    }
    return '2026-10-23';
  }, [simulateThreeDaysBefore, selectedMonth, dueDay, preDueDays]);

  const schedule = useMemo(() => {
    return evaluatePreDueReminderSchedule(
      apartments,
      revenues,
      selectedMonth,
      dueDay,
      effectiveReferenceDate,
      isEnabled,
      preDueDays
    );
  }, [apartments, revenues, selectedMonth, dueDay, effectiveReferenceDate, isEnabled, preDueDays]);

  // Automatically trigger in-browser notification when entering the 3-day pre-due window
  useEffect(() => {
    if (!isEnabled) return;
    if (schedule.shouldFireBrowserReminderNow) {
      setBrowserToastVisible(true);
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(schedule.browserNotificationTitle, {
            body: schedule.browserNotificationBody,
          });
        }
      } catch {
        // Ignore iframe Notification API restrictions; in-browser toast is displayed
      }
    }
  }, [
    isEnabled,
    schedule.shouldFireBrowserReminderNow,
    schedule.browserNotificationTitle,
    schedule.browserNotificationBody,
  ]);

  if (!isEnabled) return null;

  const triggerManualBrowserNotification = async () => {
    setSimulateThreeDaysBefore(true);
    setBrowserToastVisible(true);
    setIsExpanded(true);

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          setNotificationPermissionState(perm);
          if (perm === 'granted') {
            new Notification(schedule.browserNotificationTitle, {
              body: schedule.browserNotificationBody,
            });
          }
        } else if (Notification.permission === 'granted') {
          new Notification(schedule.browserNotificationTitle, {
            body: schedule.browserNotificationBody,
          });
        }
      }
    } catch {
      // Fallback to in-browser notification toast
    }
  };

  return (
    <div
      role="region"
      aria-label="تذكير مسبق بموعد استحقاق الإيجار الشهري"
      className="mb-4 space-y-2.5"
      dir="rtl"
    >
      {/* Simulated / Active Native Browser Notification Toast */}
      {browserToastVisible && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3.5">
            <div className="bg-indigo-500/20 border border-indigo-400/40 p-2.5 rounded-xl text-indigo-300 shrink-0 mt-0.5">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  إشعار المتصفح المجدول (قبل الاستحقاق بـ {schedule.preDueDays} أيام)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  موعد الاستحقاق: يوم {schedule.dueDay} ({schedule.currentMonthDueDate})
                </span>
                {notificationPermissionState === 'granted' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    إشعارات المتصفح مفعلة
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-white mt-1">
                {schedule.browserNotificationTitle}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {schedule.browserNotificationBody}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onNavigateToUnits && (
              <button
                onClick={onNavigateToUnits}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                مراجعة الشقق ({schedule.unpaidUnits.length})
              </button>
            )}
            <button
              onClick={() => setBrowserToastVisible(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="إخفاء إشعار المتصفح"
              aria-label="إخفاء إشعار المتصفح"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scheduler Status Bar */}
      <div
        className={`rounded-2xl border px-4 py-3 transition-all ${
          schedule.isWithinPreDueWindow
            ? 'bg-gradient-to-l from-indigo-50 via-blue-50/70 to-white border-indigo-200/90 shadow-sm'
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                schedule.isWithinPreDueWindow
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  جدولة تذكيرات المتصفح المسبقة (قبل الاستحقاق بـ {schedule.preDueDays} أيام)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مفعل تلقائياً</span>
                </span>
                {schedule.isWithinPreDueWindow ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white">
                    نشط الآن — متبقي {schedule.daysUntilDue} أيام على الاستحقاق
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>
                      التذكير القادم: يوم {schedule.reminderDay} من كل شهر ({schedule.activeScheduledReminderDate})
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {schedule.unpaidUnits.length > 0 ? (
                  <>
                    الشقق غير المسددة لشهر {formatMonthYearArabic(selectedMonth)} حتى الآن:{' '}
                    <span className="font-bold text-indigo-900">{schedule.unpaidUnits.length} شقق</span> (بينها{' '}
                    <span className="font-bold text-indigo-900">{schedule.tenantsUnpaidCount} مستأجرين</span>) بإجمالي{' '}
                    <span className="font-bold text-indigo-900">
                      {formatMoney(schedule.totalRemainingAmount, settings.currency)}
                    </span>
                  </>
                ) : (
                  <>جميع الوحدات مسددة بالكامل لشهر {formatMonthYearArabic(selectedMonth)}.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerManualBrowserNotification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>إرسال تذكير المتصفح الآن</span>
            </button>

            {schedule.unpaidUnits.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
              >
                <span>قائمة التذكير المسبق ({schedule.unpaidUnits.length})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="إعدادات التذكير المسبق"
              aria-label="إعدادات التذكير المسبق"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Unpaid Units List for Pre-Due Reminder */}
        {isExpanded && schedule.unpaidUnits.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
            {schedule.unpaidUnits.map(item => {
              const cleanPhone = (item.apartment.phone || '').replace(/[^0-9]/g, '');
              const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;
              const reminderMsg = generateTenantReminderText({
                residentName: item.apartment.residentName,
                unitNumber: item.apartment.number,
                overdueAmount: item.remainingAmount,
                currency: settings.currency,
                buildingName: settings.buildingName,
                treasurerName: settings.treasurerName,
                monthTarget: formatMonthYearArabic(selectedMonth),
                paymentDetails: settings.bankAccountDetails,
                tone: 'gentle',
              });

              return (
                <div
                  key={item.apartment.id}
                  className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[11px]">
                        شقة {item.apartment.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectUnit?.(item.apartment.id, 'finance')}
                        className="text-xs font-bold text-slate-800 hover:text-indigo-600 truncate transition-colors"
                      >
                        {item.apartment.residentName}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      المستحق يوم {schedule.dueDay}:{' '}
                      <span className="font-bold text-slate-800">
                        {formatMoney(item.remainingAmount, settings.currency)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onEmailTenantReport && (
                      <button
                        type="button"
                        onClick={() => onEmailTenantReport(item.apartment)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors"
                        title={`إرسال تذكير وكشف حساب بالبريد (${item.apartment.email || 'إضافة بريد'})`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {waPhone && (
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(reminderMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-colors"
                        title="تذكير مسبق عبر واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!isReadOnly && onCollectPayment && (
                      <button
                        type="button"
                        onClick={() => onCollectPayment(item.apartment.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                      >
                        تحصيل
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
