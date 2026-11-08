import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  calculateTotals,
  calculateApartmentsBalances,
  groupExpensesByCategory,
  filterByMonth,
  formatMoney,
  getCurrentMonthUnpaidUnits,
  evaluateMonthlyDueStatus,
  getScheduledMaintenanceReminders,
  calculateOccupancyStats,
  calculate6MonthsOccupancyHistory,
  buildFloorsExcelSheetData,
  REVENUE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  RECURRENCE_INTERVAL_LABELS,
} from '../utils/finance';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building,
  PlusCircle,
  Receipt,
  FileText,
  Calendar,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  BellRing,
  BellOff,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Wrench,
  Repeat,
  Clock,
  Layers,
  Settings,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Users,
  Archive,
  BarChart3,
  FileImage,
  Edit2,
} from 'lucide-react';
import { Revenue, Expense, MaintenanceCategory, RecurrenceInterval } from '../types';
import { FinancialEvolutionChart } from './FinancialEvolutionChart';
import { ApartmentAvatar } from './ApartmentAvatar';
import { ApartmentDrawerTab } from './ApartmentDetailDrawer';

interface DashboardViewProps {
  onOpenAddRevenue: (unitId?: string) => void;
  onOpenAddExpense: () => void;
  onViewReceipt: (rev: Revenue) => void;
  onSelectUnit: (unitId: string, initialTab?: ApartmentDrawerTab) => void;
  onNavigateToTab: (tab: string) => void;
  onNavigateToOverdueUnits?: () => void;
  onOpenSettings?: () => void;
  onOpenFloorsDiagram?: () => void;
  onOpenFloorsExcelSheet?: () => void;
  onOpenWhatsAppInvoice?: () => void;
  onOpenBulkWhatsApp?: () => void;
  onEditRevenue?: (rev: Revenue) => void;
  onEditExpense?: (exp: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddRevenue,
  onOpenAddExpense,
  onViewReceipt,
  onSelectUnit,
  onNavigateToTab,
  onNavigateToOverdueUnits,
  onOpenSettings,
  onOpenFloorsDiagram,
  onOpenFloorsExcelSheet,
  onOpenWhatsAppInvoice,
  onOpenBulkWhatsApp,
  onEditRevenue,
  onEditExpense,
}) => {
  const {
    settings,
    updateSettings,
    apartments,
    revenues,
    deleteRevenue,
    expenses,
    deleteExpense,
    maintenanceNotes,
    addMaintenanceNote,
    deleteMaintenanceNote,
    advancePeriodicMaintenance,
    quickTasks,
    addQuickTask,
    updateQuickTask,
    toggleQuickTask,
    deleteQuickTask,
    clearCompletedQuickTasks,
    selectedMonth,
    setSelectedMonth,
    isReadOnly,
  } = useBuilding();

  // Quick Tasks local form state
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'normal' | 'high'>('normal');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [confirmDeleteTrxId, setConfirmDeleteTrxId] = useState<string | null>(null);
  const [editingQuickTaskId, setEditingQuickTaskId] = useState<string | null>(null);
  const [editingQuickTaskText, setEditingQuickTaskText] = useState('');

  // Periodic Maintenance Quick Schedule Form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedUnitId, setSchedUnitId] = useState(apartments[0]?.id || 'apt-1');
  const [schedCategory, setSchedCategory] = useState<MaintenanceCategory>('elevator');
  const [schedDate, setSchedDate] = useState('2026-10-25');
  const [schedInterval, setSchedInterval] = useState<RecurrenceInterval>('monthly');
  const [schedAssignedTo, setSchedAssignedTo] = useState('');

  // Notification banner feedback & collapsible overdue cards toggle
  const [alertToast, setAlertToast] = useState<string | null>(null);
  const [showOverdueCardsGrid, setShowOverdueCardsGrid] = useState<boolean>(true);

  // Filter current month transactions
  const monthRevenues = filterByMonth(revenues, selectedMonth);
  const monthExpenses = filterByMonth(expenses, selectedMonth);

  // Totals for the whole time to determine actual current treasury
  const allTimeTotals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);

  // Totals for this specific month
  const monthTotals = calculateTotals(monthRevenues, monthExpenses, 0);

  // Balances of all apartments
  const aptBalances = calculateApartmentsBalances(apartments, revenues, 1);
  const unpaidUnits = aptBalances.filter(b => b.balance < 0);
  const totalArrears = Math.abs(unpaidUnits.reduce((acc, b) => acc + b.balance, 0));

  // Current Month Late Rent Alerts & Automatic Due Day Status
  const lateRentAlertsEnabled = settings.enableLateRentAlerts !== false;
  const configuredDueDay = settings.lateRentAlertDay ?? 10;
  const dueEvaluation = evaluateMonthlyDueStatus(selectedMonth, configuredDueDay);
  const currentMonthLateUnits = getCurrentMonthUnpaidUnits(
    apartments,
    revenues,
    selectedMonth,
    configuredDueDay
  );
  const currentMonthLateTotal = currentMonthLateUnits.reduce((s, item) => s + item.remainingAmount, 0);
  const currentMonthLateIds = new Set(currentMonthLateUnits.map(u => u.apartment.id));

  // Scheduled & Periodic Maintenance Reminders
  const maintenanceReminders = getScheduledMaintenanceReminders(maintenanceNotes, '2026-10-15');

  // Building Occupancy Stats & 6-Month Occupancy History
  const occupancyStats = calculateOccupancyStats(apartments);
  const occupancyHistory6Months = calculate6MonthsOccupancyHistory(apartments, selectedMonth);

  // Interactive 10-Floor Collection Matrix Data
  const floorsMatrixData = buildFloorsExcelSheetData({
    apartments,
    revenues,
    settings,
    targetMonth: selectedMonth,
  });

  // Expense breakdown
  const expenseBreakdown = groupExpensesByCategory(monthExpenses);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addQuickTask(newTaskText, newTaskPriority);
    setNewTaskText('');
    setNewTaskPriority('normal');
  };

  const handleQuickChipAdd = (presetText: string, priority: 'normal' | 'high' = 'normal') => {
    addQuickTask(presetText, priority);
  };

  const handleAddScheduledMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle.trim()) return;
    const targetApt = apartments.find(a => a.id === schedUnitId) || apartments[0];
    addMaintenanceNote({
      apartmentId: targetApt?.id || 'apt-1',
      unitNumber: targetApt?.number || '1',
      title: schedTitle.trim(),
      category: schedCategory,
      priority: 'high',
      status: 'pending',
      assignedTo: schedAssignedTo.trim() || undefined,
      scheduledDate: schedDate,
      isPeriodic: true,
      recurrenceInterval: schedInterval,
    });
    setSchedTitle('');
    setSchedAssignedTo('');
    setShowScheduleForm(false);
    setAlertToast('تمت إضافة جدولة التذكير الدوري للصيانة بنجاح!');
    setTimeout(() => setAlertToast(null), 3500);
  };

  const handleSendBulkAlertNotification = () => {
    if (onOpenBulkWhatsApp) {
      onOpenBulkWhatsApp();
      return;
    }
    setAlertToast(
      `تم إرسال وتحديث إشعارات التنبيه لعدد (${currentMonthLateUnits.length}) شقق متأخرة عن سداد شهر ${selectedMonth} بنجاح!`
    );
    setTimeout(() => setAlertToast(null), 4000);
  };

  const filteredTasks = quickTasks.filter(t => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  // Recent 6 transactions combined
  const combinedRecent = [
    ...revenues.map(r => ({ ...r, type: 'revenue' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Executive Header Bar: Month Selector, Live Collection Progress & Non-Duplicate Report Shortcuts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              لوحة المتابعة والميزانية العامة
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>نسبة تحصيل الشهر: {floorsMatrixData.collectionRatePercent}%</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold font-mono">
              <span>مسدد: {floorsMatrixData.paidUnitsCount}</span>
              <span>•</span>
              <span>متأخر: {floorsMatrixData.unpaidUnitsCount}</span>
              <span>•</span>
              <span>معفى/مغلق: {floorsMatrixData.exemptOrClosedCount}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            متابعة تنفيذية موحدة للخزينة والإيرادات والمصروفات وخريطة تحصيل الأدوار في {settings.buildingName}
          </p>
        </div>

        {/* Month Picker & Specialized Report Actions (No duplication with Navbar primary buttons) */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="الشهر التالي"
              aria-label="الشهر التالي"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 font-bold text-sm text-slate-800 font-mono">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>شهر: {selectedMonth}</span>
            </div>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
              title="الشهر السابق"
              aria-label="الشهر السابق"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenFloorsExcelSheet && (
              <button
                type="button"
                data-testid="dashboard-floors-excel-sheet-btn"
                onClick={onOpenFloorsExcelSheet}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs"
                title="عرض وتحميل نموذج الإكسيل المصور بالأسماء والأدوار"
              >
                <FileImage className="w-4 h-4 text-amber-600" />
                <span>نموذج الإكسيل المصور</span>
              </button>
            )}

            {onOpenWhatsAppInvoice && (
              <button
                type="button"
                onClick={onOpenWhatsAppInvoice}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
                title="توليد صورة فاتورة بيضاء للتقرير المالي لإرسالها على واتساب"
              >
                <FileImage className="w-4 h-4 text-emerald-600" />
                <span>صورة فاتورة للواتساب</span>
              </button>
            )}

            <button
              type="button"
              data-testid="dashboard-bulk-overdue-whatsapp-btn"
              onClick={handleSendBulkAlertNotification}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-2xs cursor-pointer"
              title="إرسال تذكير واتساب موحد أو فردي لجميع المتأخرين بضغطة واحدة"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب جماعي للمتأخرين ({currentMonthLateUnits.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {alertToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertToast}</span>
          </div>
          <button
            onClick={() => setAlertToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] underline"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* 5 Executive KPI Metric Cards (Above the Fold) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Current Treasury Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">الرصيد الفعلي بالخزينة</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {formatMoney(allTimeTotals.currentBalance, settings.currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>شامل صندوق الطوارئ:</span>
            <span className="font-semibold text-slate-300 font-mono">{settings.emergencyFundBalance} {settings.currency}</span>
          </div>
        </div>

        {/* Monthly Revenues */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إيرادات الشهر ({selectedMonth})</span>
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatMoney(monthTotals.totalRevenues, settings.currency)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
            <span>{monthRevenues.length} إيصال محصّل</span>
            <span className="font-mono text-slate-500">من {floorsMatrixData.expectedMonthlyTotal}</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">مصروفات الشهر ({selectedMonth})</span>
            <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {formatMoney(monthTotals.totalExpenses, settings.currency)}
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-semibold">
            {monthExpenses.length} سند صرف وفاتورة
          </div>
        </div>

        {/* Monthly Net Surplus or Deficit */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">صافي حركة الشهر</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
              monthTotals.netFlow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {monthTotals.netFlow >= 0 ? 'فائض' : 'عجز'}
            </span>
          </div>
          <div className={`text-2xl font-black font-mono ${
            monthTotals.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {monthTotals.netFlow >= 0 ? '+' : ''}{formatMoney(monthTotals.netFlow, settings.currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            فارق الإيرادات عن المصروفات
          </div>
        </div>

        {/* Outstanding Arrears */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold">المتأخرات على السكان</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">
            {formatMoney(totalArrears, settings.currency)}
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold flex items-center justify-between">
            <span>على {unpaidUnits.length} شقق معلقة</span>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="underline text-[10px] hover:text-amber-900 cursor-pointer"
            >
              عرض الكشف
            </button>
          </div>
        </div>
      </div>

      {/* Single Unified Overdue & Collection Command Section (Zero Duplication) */}
      {lateRentAlertsEnabled ? (
        currentMonthLateUnits.length > 0 && (
          <div
            className={`rounded-2xl p-4 sm:p-5 border shadow-xs ${
              dueEvaluation.isPastDueDate
                ? 'bg-gradient-to-l from-rose-50/80 via-amber-50/50 to-white border-rose-200'
                : 'bg-gradient-to-l from-amber-50/80 via-indigo-50/40 to-white border-amber-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                    dueEvaluation.isPastDueDate ? 'bg-rose-600' : 'bg-amber-500'
                  }`}
                >
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      {dueEvaluation.isPastDueDate
                        ? `متابعة تحصيل الشقق المتأخرة لشهر (${selectedMonth})`
                        : `متابعة استحقاق اشتراكات شهر (${selectedMonth})`}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-white text-[11px] font-bold font-mono ${
                        dueEvaluation.isPastDueDate ? 'bg-rose-600' : 'bg-amber-600'
                      }`}
                    >
                      {currentMonthLateUnits.length} شقق ({formatMoney(currentMonthLateTotal, settings.currency)})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200 text-[10px] font-bold">
                      يوم الاستحقاق: {configuredDueDay} ({dueEvaluation.dueDateFormatted})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    يمكنك التحصيل المباشر أو مراسلة كل ساكن عبر واتساب، أو طيّ القائمة للحفاظ على مساحة الشاشة.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOverdueCardsGrid(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {showOverdueCardsGrid
                    ? `إخفاء البطاقات (${currentMonthLateUnits.length})`
                    : `عرض بطاقات المتأخرين (${currentMonthLateUnits.length})`}
                </button>
                {onNavigateToOverdueUnits && (
                  <button
                    type="button"
                    onClick={onNavigateToOverdueUnits}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-amber-700" />
                    <span>جدول المتأخرين</span>
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="ضبط يوم الاستحقاق الشهري وإعدادات التنبيهات"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>يوم ({configuredDueDay})</span>
                  </button>
                )}
              </div>
            </div>

            {showOverdueCardsGrid && (
              <div className="mt-4 pt-3 border-t border-rose-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {currentMonthLateUnits.map(item => {
                  const apt = item.apartment;
                  const cleanPhone = apt.phone.replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;
                  const waMsg = `السلام عليكم أستاذ ${apt.residentName} المحترم، إشعار تذكير من إدارة ${settings.buildingName} بسداد مستحقات شهر ${selectedMonth} لشقة رقم (${apt.number}) بقيمة ${item.remainingAmount} ${settings.currency}. شاكرين لتعاونكم.`;

                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 hover:border-rose-300 shadow-2xs flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ApartmentAvatar
                          unitNumber={apt.number}
                          avatarIcon={apt.avatarIcon}
                          avatarColor={apt.avatarColor}
                          size="sm"
                          isAlert={item.isPastDueDate}
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectUnit(apt.id)}
                            className="font-black text-xs text-slate-900 hover:text-indigo-600 transition text-right truncate block cursor-pointer"
                          >
                            شقة ({apt.number}) - {apt.residentName}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                            <span className="text-slate-500 font-semibold">الدور {apt.floor}</span>
                            <span className="text-rose-600 font-black font-mono">
                              مطلوب: {formatMoney(item.remainingAmount, settings.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {apt.phone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="إرسال رسالة تذكير عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => onOpenAddRevenue(apt.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>تحصيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-slate-400" />
            <span>تنبيهات الإيجار المتأخر للشهر الحالي متوقفة حالياً من الإعدادات.</span>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ enableLateRentAlerts: true })}
            className="font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            تفعيل التنبيهات الآن
          </button>
        </div>
      )}

      {/* Building Occupancy Rate Card & 6-Month Occupancy Trend Chart (نسبة إشغال العمارة والشقق المؤجرة لآخر 6 أشهر) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  نسبة إشغال العمارة والشقق المؤجرة (آخر 6 أشهر)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black font-mono">
                  إشغال كلي: {occupancyStats.totalOccupancyRatePercent}% ({occupancyStats.occupiedUnits}/{occupancyStats.totalUnits})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black font-mono">
                  نسبة التأجير: {occupancyStats.rentedRatePercent}% ({occupancyStats.rentedUnits}/{occupancyStats.totalUnits} مؤجرة)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                متابعة عدد الشقق المؤجرة مقابل إجمالي شقق العمارة وتطور نسبة الإشغال خلال الـ 6 أشهر الماضية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>سجلات المستأجرين المؤرشفة: {occupancyStats.archivedTenantsCount}</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTab('units')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>إدارة الشقق وسجل المستأجرين</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid: Left Summary Metrics + Right 6-Month Visual Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Current Occupancy & Rented Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Primary Rented vs Total Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-200 font-bold block">
                    عدد الشقق المؤجرة مقابل الإجمالي
                  </span>
                  <div className="text-2xl font-black font-mono mt-0.5 flex items-baseline gap-2">
                    <span>
                      {occupancyStats.rentedUnits} / {occupancyStats.totalUnits}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      شقة مؤجرة ({occupancyStats.rentedRatePercent}%)
                    </span>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-emerald-300 font-bold block">
                    نسبة الإشغال الكلي
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {occupancyStats.totalOccupancyRatePercent}%
                  </span>
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${
                        occupancyStats.totalUnits > 0
                          ? (occupancyStats.rentedUnits / occupancyStats.totalUnits) * 100
                          : 0
                      }%`,
                    }}
                    title={`شقق مؤجرة: ${occupancyStats.rentedUnits}`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${
                        occupancyStats.totalUnits > 0
                          ? (occupancyStats.ownerUnits / occupancyStats.totalUnits) * 100
                          : 0
                      }%`,
                    }}
                    title={`شقق ملاك: ${occupancyStats.ownerUnits}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                    <span>مؤجرة ({occupancyStats.rentedUnits})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                    <span>ملاك مقيمين ({occupancyStats.ownerUnits})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-600 inline-block" />
                    <span>شاغرة ({occupancyStats.vacantUnits})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Mini Breakdown Pills */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-700 block">الشقق المؤجرة</span>
                <span className="text-base font-black text-indigo-950 font-mono">
                  {occupancyStats.rentedUnits} شقق
                </span>
                <span className="text-[10px] text-indigo-600 font-mono block">
                  {occupancyStats.rentedRatePercent}% من العمارة
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 block">شقق الملاك</span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  {occupancyStats.ownerUnits} شقق
                </span>
                <span className="text-[10px] text-emerald-600 font-mono block">
                  {occupancyStats.totalUnits > 0
                    ? Math.round((occupancyStats.ownerUnits / occupancyStats.totalUnits) * 100)
                    : 0}
                  % من العمارة
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">إجمالي المشغول</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {occupancyStats.occupiedUnits} / {occupancyStats.totalUnits}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  شاغرة: {occupancyStats.vacantUnits}
                </span>
              </div>
            </div>
          </div>

          {/* Right: 6-Month Occupancy Rate & Rented Units Visual Chart (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h4 className="font-black text-xs text-slate-800">
                  التغير في نسبة الإشغال والشقق المؤجرة خلال الـ 6 أشهر الماضية
                </h4>
                <p className="text-[11px] text-slate-500">
                  العمود يوضح نسبة الإشغال الكلي (%) وحصة الشقق المؤجرة مقابل إجمالي الوحدات لكل شهر
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  نسبة الإشغال الكلي
                </span>
                <span className="flex items-center gap-1 text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                  نسبة الشقق المؤجرة
                </span>
              </div>
            </div>

            {/* 6-Month Columns Chart */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3 pt-2 items-end h-44">
              {occupancyHistory6Months.map(pt => {
                const isCurrentMonth = pt.month === selectedMonth;
                return (
                  <div
                    key={pt.month}
                    className={`flex flex-col items-center justify-end h-full rounded-xl p-1.5 transition ${
                      isCurrentMonth
                        ? 'bg-indigo-50/80 ring-1 ring-indigo-300'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    {/* Top Percentage Badges */}
                    <div className="text-center mb-1.5 space-y-0.5">
                      <span className="block text-[10px] font-black text-emerald-700 font-mono leading-none">
                        {pt.occupancyRatePercent}%
                      </span>
                      <span
                        className="inline-block px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold font-mono"
                        title={`عدد الشقق المؤجرة في ${pt.monthLabel}: ${pt.rentedUnits} من ${pt.totalUnits}`}
                      >
                        {pt.rentedUnits}/{pt.totalUnits} مؤجر
                      </span>
                    </div>

                    {/* Visual Dual Bar */}
                    <div className="w-full max-w-[42px] h-24 bg-slate-200/80 rounded-lg overflow-hidden flex flex-col justify-end p-0.5 relative">
                      <div
                        className="w-full rounded-md bg-emerald-500/85 flex flex-col justify-end overflow-hidden transition-all duration-500"
                        style={{ height: `${Math.max(15, pt.occupancyRatePercent)}%` }}
                        title={`إشغال كلي: ${pt.occupiedUnits}/${pt.totalUnits} (${pt.occupancyRatePercent}%)`}
                      >
                        <div
                          className="w-full bg-indigo-600 transition-all duration-500"
                          style={{
                            height: `${
                              pt.occupiedUnits > 0
                                ? Math.round((pt.rentedUnits / pt.occupiedUnits) * 100)
                                : 0
                            }%`,
                          }}
                          title={`شقق مؤجرة: ${pt.rentedUnits}/${pt.totalUnits} (${pt.rentedRatePercent}%)`}
                        />
                      </div>
                    </div>

                    {/* Month Label */}
                    <div className="mt-1.5 text-center">
                      <span
                        className={`text-[10px] block font-bold ${
                          isCurrentMonth ? 'text-indigo-900 font-black' : 'text-slate-700'
                        }`}
                      >
                        {pt.shortLabel}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        مؤجر: {pt.rentedRatePercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 10-Floor Collection Matrix & Periodic Maintenance Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Interactive 10-Floor Collection Matrix (خريطة تحصيل الأدوار التفاعلية - 10 أدوار × 27 شقة) */}
        <div
          data-testid="dashboard-interactive-floors-matrix"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    خريطة تحصيل الأدوار التفاعلية ({floorsMatrixData.monthHeaderFormatted})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    اضغط على أي شقة لفتح ملفها المالي أو تحصيل الاشتراك مباشرة
                  </p>
                </div>
              </div>

              {onOpenFloorsExcelSheet && (
                <button
                  type="button"
                  onClick={onOpenFloorsExcelSheet}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black transition cursor-pointer"
                >
                  تكبير جدول الأدوار المصور ←
                </button>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold mb-3 pb-2.5 border-b border-slate-100">
              <span className="inline-flex items-center gap-1 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                مسدد ({floorsMatrixData.paidUnitsCount - floorsMatrixData.partialUnitsCount})
              </span>
              <span className="inline-flex items-center gap-1 text-amber-800">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                جزئي ({floorsMatrixData.partialUnitsCount})
              </span>
              <span className="inline-flex items-center gap-1 text-rose-800">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                متأخر ({floorsMatrixData.unpaidUnitsCount})
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" />
                معفى / مغلق ({floorsMatrixData.exemptOrClosedCount})
              </span>
            </div>

            {/* 10 Floors Compact Interactive Grid */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {floorsMatrixData.floors.map(floorRow => (
                <div
                  key={floorRow.floor}
                  className="grid grid-cols-12 gap-1.5 items-center bg-slate-50/70 rounded-xl p-1.5 border border-slate-200/70"
                >
                  <div className="col-span-3 sm:col-span-2 px-2 py-1.5 rounded-lg bg-slate-900 text-white text-center">
                    <span className="text-[10px] font-black block leading-tight">
                      {floorRow.floorTitleArabic}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-mono block">
                      {floorRow.floorCollectedTotal} {settings.currency}
                    </span>
                  </div>

                  <div className="col-span-9 sm:col-span-10 grid grid-cols-6 gap-1.5">
                    {floorRow.cells.map(cell => {
                      const colSpanClass =
                        cell.colSpanHalfUnits === 4
                          ? 'col-span-4'
                          : cell.colSpanHalfUnits === 3
                          ? 'col-span-3'
                          : 'col-span-2';

                      const badgeStyle =
                        cell.status === 'required_paid' && !cell.isPartialPaid
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                          : cell.status === 'required_paid' && cell.isPartialPaid
                          ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                          : cell.status === 'required_unpaid'
                          ? 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100'
                          : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200';

                      return (
                        <button
                          key={cell.apartmentId}
                          type="button"
                          onClick={() => onSelectUnit(cell.apartmentId, 'finance')}
                          className={`${colSpanClass} ${badgeStyle} border rounded-lg px-2 py-1 text-right transition flex items-center justify-between gap-1 cursor-pointer`}
                          title={`شقة ${cell.unitNumber} - ${cell.fullResidentName} (المدفوع: ${cell.paidAmount})`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-black truncate block leading-tight">
                              {cell.displayLabel}
                            </span>
                            <span className="text-[9px] opacity-75 font-mono block">
                              شقة {cell.unitNumber}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded shrink-0 ${
                              cell.status === 'required_paid' && !cell.isPartialPaid
                                ? 'bg-emerald-600 text-white'
                                : cell.status === 'required_paid' && cell.isPartialPaid
                                ? 'bg-amber-500 text-slate-950'
                                : cell.status === 'required_unpaid'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {cell.paidAmount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Periodic Maintenance Scheduling & Reminders (نظام جدولة وتذكيرات الصيانة الدورية) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    جدولة وتذكيرات الصيانة الدورية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    مواعيد صيانة المصعد وتنظيف الخزانات والأعطال المجدولة بناءً على ملاحظات الشقق
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>جدولة صيانة</span>
              </button>
            </div>

            {/* Inline Form to Add Scheduled Periodic Maintenance */}
            {showScheduleForm && (
              <form
                onSubmit={handleAddScheduledMaintenance}
                className="mb-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5 text-xs"
              >
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-amber-700" />
                    إضافة موعد صيانة دورية مجدولة
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="text-slate-400 hover:text-slate-700 text-[11px]"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="بيان الصيانة (مثال: صيانة المصعد، تنظيف الخزانات)"
                    value={schedTitle}
                    onChange={e => setSchedTitle(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-medium"
                  />
                  <select
                    value={schedUnitId}
                    onChange={e => setSchedUnitId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                  >
                    {apartments.map(a => (
                      <option key={a.id} value={a.id}>
                        شقة ({a.number}) - {a.residentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    value={schedCategory}
                    onChange={e => setSchedCategory(e.target.value as MaintenanceCategory)}
                    className="px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold"
                  >
                    {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono"
                  />

                  <select
                    value={schedInterval}
                    onChange={e => setSchedInterval(e.target.value as RecurrenceInterval)}
                    className="px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold"
                  >
                    {Object.entries(RECURRENCE_INTERVAL_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    حفظ التذكير
                  </button>
                </div>
              </form>
            )}

            {/* Scheduled Maintenance Reminders List */}
            {maintenanceReminders.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                لا توجد مواعيد صيانة دورية مجدولة حالياً.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {maintenanceReminders.map(({ note, scheduledDate, daysUntilDue, urgency }) => (
                  <div
                    key={note.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 ${
                      urgency === 'overdue'
                        ? 'bg-rose-50/60 border-rose-200'
                        : urgency === 'due_soon'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{note.title}</span>
                          <button
                            type="button"
                            onClick={() => onSelectUnit(note.apartmentId)}
                            className="px-2 py-0.2 rounded bg-slate-900 text-white text-[10px] font-bold hover:bg-indigo-600 transition"
                          >
                            شقة {note.unitNumber || 'العمارة'}
                          </button>
                          {note.isPeriodic && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">
                              <Repeat className="w-2.5 h-2.5" />
                              {RECURRENCE_INTERVAL_LABELS[note.recurrenceInterval || 'monthly']}
                            </span>
                          )}
                        </div>
                        {note.description && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                            {note.description}
                          </p>
                        )}
                      </div>

                      {/* Urgency Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          urgency === 'overdue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : urgency === 'due_soon'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {urgency === 'overdue'
                          ? `متأخر بـ ${Math.abs(daysUntilDue)} يوم`
                          : urgency === 'due_soon'
                          ? `خلال ${daysUntilDue} أيام`
                          : `موعد قادم (${scheduledDate})`}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          الموعد: {scheduledDate}
                        </span>
                        {note.assignedTo && (
                          <span>
                            المسؤول: <strong className="text-slate-700">{note.assignedTo}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => advancePeriodicMaintenance(note.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                          title="تسجيل إتمام الصيانة وجدولة الموعد الدوري القادم"
                        >
                          {note.isPeriodic ? 'تم التنفيذ وجدولة القادم' : 'تم الإصلاح'}
                        </button>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => deleteMaintenanceNote(note.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف موعد الصيانة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 12-Month Financial Evolution Dashboard Chart (Recharts) */}
      <FinancialEvolutionChart
        revenues={revenues}
        expenses={expenses}
        referenceMonth={selectedMonth}
        currency={settings.currency}
      />

      {/* Main Grid: Left side Expenses Breakdown, Right side Delinquent residents & Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col (2 cols span): Expense Breakdown & Visual Distribution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Monthly Expense Breakdown Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  توزيع المصروفات حسب البنود ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-500">
                  تفصيل ما تم إنفاقه على الصيانة والخدمات خلال الشهر
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('expenses')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                عرض كل المصروفات ←
              </button>
            </div>

            {expenseBreakdown.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                لم يتم تسجيل أي مصروفات في شهر {selectedMonth} حتى الآن.
              </div>
            ) : (
              <div className="space-y-3.5">
                {expenseBreakdown.map(item => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">
                          {formatMoney(item.total, settings.currency)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Combined Transactions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                أحدث الحركات المالية (إيرادات ومصروفات)
              </h3>
              <span className="text-xs text-slate-400">آخر ٦ حركات مسجلة</span>
            </div>

            <div className="space-y-2.5">
              {combinedRecent.map((trx) => {
                if (trx.type === 'revenue') {
                  const rev = trx as Revenue;
                  return (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                            <span>تحصيل من: {rev.residentName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold">
                              شقة {rev.unitNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {REVENUE_CATEGORY_LABELS[rev.category] || rev.category} • {rev.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-emerald-600 font-mono ml-1">
                          +{formatMoney(rev.amount, settings.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewReceipt(rev)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="عرض الإيصال"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        {!isReadOnly && onEditRevenue && (
                          <button
                            type="button"
                            data-testid={`dashboard-edit-revenue-btn-${rev.id}`}
                            onClick={() => onEditRevenue(rev)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="تعديل الدفعة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isReadOnly && (
                          confirmDeleteTrxId === rev.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteRevenue(rev.id);
                                  setConfirmDeleteTrxId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded transition"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTrxId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTrxId(rev.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف الدفعة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const exp = trx as Expense;
                  return (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {exp.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category} • {exp.paidTo} • {exp.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-rose-600 font-mono ml-1">
                          -{formatMoney(exp.amount, settings.currency)}
                        </span>
                        {!isReadOnly && onEditExpense && (
                          <button
                            type="button"
                            data-testid={`dashboard-edit-expense-btn-${exp.id}`}
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="تعديل المصروف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isReadOnly && (
                          confirmDeleteTrxId === exp.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteExpense(exp.id);
                                  setConfirmDeleteTrxId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded transition"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTrxId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTrxId(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف المصروف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

        </div>

        {/* Right Col: Compact Quick Tasks Hub Shortcut & Building Info (Zero Duplication) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  المهام الإدارية السريعة ({quickTasks.filter(t => !t.completed).length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('quick_hub')}
                className="text-xs text-indigo-600 font-black hover:underline cursor-pointer"
              >
                شاشة الملخصات والمهام ←
              </button>
            </div>

            <form onSubmit={handleAddQuickTask} className="flex items-center gap-1.5 mb-3">
              <input
                type="text"
                placeholder="أضف مهمة سريعة..."
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إضافة
              </button>
            </form>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                لا توجد مهام معلقة حالياً.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {filteredTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs bg-slate-50/60"
                  >
                    {editingQuickTaskId === task.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingQuickTaskText}
                          onChange={e => setEditingQuickTaskText(e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg border border-indigo-300 bg-white text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingQuickTaskText.trim()) {
                              updateQuickTask(task.id, { text: editingQuickTaskText.trim() });
                            }
                            setEditingQuickTaskId(null);
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingQuickTaskId(null)}
                          className="px-1.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleQuickTask(task.id)}
                          className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`font-bold truncate ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.text}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuickTaskId(task.id);
                              setEditingQuickTaskText(task.text);
                            }}
                            className="text-slate-400 hover:text-amber-600 p-1"
                            title="تعديل المهمة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuickTask(task.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Building Summary Info */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
            <h4 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>معلومات إدارة العمارة</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">اسم العقار:</span>
                <span className="font-bold text-white">{settings.buildingName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">إجمالي الوحدات:</span>
                <span className="font-bold text-white font-mono">{apartments.length} شقة سكنية</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">أمين الصندوق:</span>
                <span className="font-bold text-white">{settings.treasurerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">تنبيهات الإيجار المتأخر:</span>
                <span className={`font-bold ${lateRentAlertsEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {lateRentAlertsEnabled ? 'مُفعّلة' : 'متوقفة'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الاشتراك الشهري:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {settings.defaultMonthlyFee} {settings.currency}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => onNavigateToTab('reports')}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              إصدار التقارير الشهرية والطباعة
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
