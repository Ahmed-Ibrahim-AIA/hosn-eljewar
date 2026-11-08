import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  buildSmartNotificationsFeed,
  SmartNotificationCategory,
  SmartNotificationItem,
} from '../utils/finance';
import {
  openExternalUrlOrWhatsApp,
  triggerSmartSystemNotification,
} from '../utils/apkBridge';
import {
  X,
  BellRing,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  PlusCircle,
  FileSpreadsheet,
  ListChecks,
  Wrench,
  Volume2,
  VolumeX,
  Check,
  Send,
  TrendingUp,
} from 'lucide-react';

interface SmartNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment: (unitId?: string) => void;
  onSelectUnit: (unitId: string) => void;
  onOpenBulkWhatsApp: () => void;
  onOpenFloorsExcelSheet: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const SmartNotificationCenterModal: React.FC<SmartNotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onCollectPayment,
  onSelectUnit,
  onOpenBulkWhatsApp,
  onOpenFloorsExcelSheet,
  onNavigateToTab,
}) => {
  const {
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    maintenanceNotes,
    quickTasks,
    selectedMonth,
    settings,
    updateSettings,
    generateMonthlyRecurringExpenses,
    toggleQuickTask,
  } = useBuilding();

  const [selectedCategory, setSelectedCategory] = useState<'all' | SmartNotificationCategory>('all');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      buildSmartNotificationsFeed({
        apartments,
        revenues,
        expenses,
        recurringExpenses,
        maintenanceNotes,
        quickTasks,
        settings,
        selectedMonth,
      }),
    [
      apartments,
      revenues,
      expenses,
      recurringExpenses,
      maintenanceNotes,
      quickTasks,
      settings,
      selectedMonth,
    ]
  );

  if (!isOpen) return null;

  const filteredItems = summary.items.filter(item =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const unreadCount = summary.items.filter(i => !readIds.includes(i.id)).length;

  const handleMarkAllRead = () => {
    setReadIds(summary.items.map(i => i.id));
    setFeedbackBanner('تم تحديد جميع الإشعارات الذكية كمقروءة!');
    setTimeout(() => setFeedbackBanner(null), 3000);
  };

  const handleTriggerDevicePushNotification = async () => {
    const res = await triggerSmartSystemNotification(
      summary.topNotificationTitle,
      summary.topNotificationBody,
      settings.smartNotificationSound !== false
    );
    setFeedbackBanner(res.message);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleExecutePrimaryAction = (item: SmartNotificationItem) => {
    if (!readIds.includes(item.id)) {
      setReadIds(prev => [...prev, item.id]);
    }
    switch (item.primaryActionType) {
      case 'collect_payment':
        onClose();
        onCollectPayment(item.unitId);
        break;
      case 'send_whatsapp':
        if (item.whatsappUrl) {
          openExternalUrlOrWhatsApp(item.whatsappUrl);
        }
        break;
      case 'open_bulk_whatsapp':
        onClose();
        onOpenBulkWhatsApp();
        break;
      case 'generate_recurring': {
        const res = generateMonthlyRecurringExpenses(selectedMonth);
        setFeedbackBanner(
          res.generatedCount > 0
            ? `تم توليد وتسجيل ${res.generatedCount} فواتير شهرية ثابتة لشهر ${selectedMonth} بنجاح!`
            : `جميع الفواتير الشهرية الثابتة مسجلة بالفعل لشهر ${selectedMonth}.`
        );
        setTimeout(() => setFeedbackBanner(null), 4000);
        break;
      }
      case 'complete_quick_task':
        if (item.quickTaskId) {
          toggleQuickTask(item.quickTaskId);
          setFeedbackBanner('تم إنجاز المهمة السريعة بنجاح!');
          setTimeout(() => setFeedbackBanner(null), 3000);
        }
        break;
      case 'open_floors_sheet':
        onClose();
        onOpenFloorsExcelSheet();
        break;
      case 'open_unit':
        if (item.unitId) {
          onClose();
          onSelectUnit(item.unitId);
        }
        break;
      case 'open_settings':
      default:
        onClose();
        onNavigateToTab('reports');
        break;
    }
  };

  const categories: Array<{
    id: 'all' | SmartNotificationCategory;
    label: string;
    count: number;
  }> = [
    { id: 'all', label: 'كل الإشعارات الذكية', count: summary.totalCount },
    {
      id: 'overdue_payment',
      label: 'متأخرات السداد',
      count: summary.items.filter(i => i.category === 'overdue_payment').length,
    },
    {
      id: 'treasury_insight',
      label: 'الخزينة والفواتير الشهرية',
      count: summary.items.filter(i => i.category === 'treasury_insight').length,
    },
    {
      id: 'urgent_task',
      label: 'المهام العاجلة',
      count: summary.items.filter(i => i.category === 'urgent_task').length,
    },
    {
      id: 'maintenance_due',
      label: 'الصيانة الدورية',
      count: summary.items.filter(i => i.category === 'maintenance_due').length,
    },
  ];

  return (
    <div
      data-testid="smart-notification-center-modal"
      className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl border-2 border-indigo-400 shadow-2xl max-w-3xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-indigo-500/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 relative">
              <BellRing className="w-6 h-6 text-amber-300" />
              {unreadCount > 0 && (
                <span
                  data-testid="smart-modal-unread-badge"
                  className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[10px] font-mono"
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  مركز الإشعارات الذكية الفورية (Smart Notifications)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>تحليل ذكي مباشر</span>
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 font-bold truncate mt-0.5">
                {summary.topNotificationTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-smart-notifications-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Smart Controls Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="trigger-smart-device-notification-btn"
              onClick={handleTriggerDevicePushNotification}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-l from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال إشعار ذكي للهاتف / المتصفح الآن</span>
            </button>

            <button
              type="button"
              data-testid="mark-all-smart-notifications-read-btn"
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>تحديد الكل كمقروء</span>
            </button>
          </div>

          {/* Sound & Launch Smart Notification Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="toggle-smart-notification-sound-btn"
              onClick={() =>
                updateSettings({
                  ...settings,
                  smartNotificationSound: settings.smartNotificationSound === false,
                })
              }
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                settings.smartNotificationSound !== false
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {settings.smartNotificationSound !== false ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>
                {settings.smartNotificationSound !== false ? 'صوت التنبيه مفعل' : 'صامِت'}
              </span>
            </button>

            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                data-testid="toggle-smart-launch-checkbox"
                checked={settings.smartNotificationOnLaunch !== false}
                onChange={e =>
                  updateSettings({
                    ...settings,
                    smartNotificationOnLaunch: e.target.checked,
                  })
                }
                className="rounded accent-emerald-500"
              />
              <span>إشعار ذكي تلقائي عند فتح التطبيق</span>
            </label>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`smart-cat-tab-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white text-indigo-900' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {feedbackBanner && (
          <div
            data-testid="smart-notification-feedback-banner"
            className="mx-4 mt-3 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-2 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {filteredItems.map(item => {
            const isRead = readIds.includes(item.id);
            const isCritical = item.priority === 'critical';
            const isHigh = item.priority === 'high';
            const isInfo = item.priority === 'info';

            return (
              <div
                key={item.id}
                data-testid={`smart-notification-card-${item.id}`}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRead
                    ? 'border-slate-200 bg-slate-50/70 opacity-85'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50/60 shadow-2xs'
                    : isHigh
                    ? 'border-amber-300 bg-amber-50/50 shadow-2xs'
                    : isInfo
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-indigo-200 bg-indigo-50/40'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCritical
                        ? 'bg-rose-600 text-white'
                        : isHigh
                        ? 'bg-amber-500 text-slate-950'
                        : isInfo
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {item.category === 'overdue_payment' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : item.category === 'urgent_task' ? (
                      <ListChecks className="w-5 h-5" />
                    ) : item.category === 'maintenance_due' ? (
                      <Wrench className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900">
                        {item.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isCritical
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isInfo
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Action Buttons on Card */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                  {item.whatsappUrl && item.primaryActionType !== 'send_whatsapp' && (
                    <button
                      type="button"
                      data-testid={`smart-whatsapp-btn-${item.id}`}
                      onClick={() => openExternalUrlOrWhatsApp(item.whatsappUrl!)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </button>
                  )}

                  {item.unitId && item.primaryActionType !== 'open_unit' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectUnit(item.unitId!);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[11px] transition cursor-pointer"
                    >
                      ملف الشقة
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid={`smart-action-btn-${item.id}`}
                    onClick={() => handleExecutePrimaryAction(item)}
                    className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : isHigh
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {item.primaryActionType === 'collect_payment' ? (
                      <PlusCircle className="w-3.5 h-3.5" />
                    ) : item.primaryActionType === 'open_floors_sheet' ? (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{item.primaryActionLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
          <span className="font-bold">
            إجمالي التنبيهات الذكية النشطة لشهر {selectedMonth}: {summary.totalCount} تنبيهات ({summary.criticalCount} عاجلة)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-black text-slate-700 hover:text-rose-600 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
