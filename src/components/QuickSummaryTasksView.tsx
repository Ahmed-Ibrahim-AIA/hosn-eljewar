import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  buildQuickSummaryHubData,
  QUICK_TASK_SMART_TEMPLATES,
  formatMoney,
  INSTAPAY_PAYMENT_URL,
  INSTAPAY_RECIPIENT_NAME,
} from '../utils/finance';
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Users,
  FileSpreadsheet,
  MessageCircle,
  Sparkles,
  Layers,
  Calendar,
  ArrowUpRight,
  CreditCard,
  Receipt,
  ListChecks,
  Flame,
  Building2,
  Edit2,
} from 'lucide-react';

interface QuickSummaryTasksViewProps {
  onOpenAddRevenue: (unitId?: string) => void;
  onOpenAddExpense: () => void;
  onOpenFloorsExcelSheet: () => void;
  onOpenFloorsDiagram: () => void;
  onOpenBulkWhatsApp: () => void;
  onOpenWhatsAppInvoice: () => void;
  onSelectUnit: (unitId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const QuickSummaryTasksView: React.FC<QuickSummaryTasksViewProps> = ({
  onOpenAddRevenue,
  onOpenAddExpense,
  onOpenFloorsExcelSheet,
  onOpenFloorsDiagram,
  onOpenBulkWhatsApp,
  onOpenWhatsAppInvoice,
  onSelectUnit,
  onNavigateToTab,
}) => {
  const {
    apartments,
    revenues,
    expenses,
    quickTasks,
    addQuickTask,
    updateQuickTask,
    toggleQuickTask,
    deleteQuickTask,
    clearCompletedQuickTasks,
    maintenanceNotes,
    settings,
    selectedMonth,
    setSelectedMonth,
    isReadOnly,
  } = useBuilding();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'normal'>('high');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  const [justAddedPresetId, setJustAddedPresetId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<'high' | 'normal'>('normal');

  const hubData = useMemo(
    () =>
      buildQuickSummaryHubData({
        apartments,
        revenues,
        expenses,
        quickTasks,
        maintenanceNotes,
        settings,
        targetMonth: selectedMonth,
      }),
    [apartments, revenues, expenses, quickTasks, maintenanceNotes, settings, selectedMonth]
  );

  const filteredTasks = useMemo(() => {
    return quickTasks.filter(task => {
      if (taskFilter === 'pending') return !task.completed;
      if (taskFilter === 'completed') return Boolean(task.completed);
      if (taskFilter === 'high') return task.priority === 'high' && !task.completed;
      return true;
    });
  }, [quickTasks, taskFilter]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newTaskTitle.trim()) return;
    addQuickTask(newTaskTitle.trim(), newTaskPriority);
    setNewTaskTitle('');
  };

  const handleAddSmartPreset = (preset: {
    id: string;
    title: string;
    priority: 'high' | 'normal';
  }) => {
    if (isReadOnly) return;
    addQuickTask(preset.title, preset.priority);
    setJustAddedPresetId(preset.id);
    setTimeout(() => setJustAddedPresetId(null), 1800);
  };

  const buildDirectResidentWhatsAppUrl = (unit: {
    residentName: string;
    phone: string;
    remainingAmount: number;
  }) => {
    const cleanPhone = unit.phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0')
      ? `20${cleanPhone.slice(1)}`
      : cleanPhone.startsWith('20')
      ? cleanPhone
      : `20${cleanPhone}`;

    const msg =
      `السلام عليكم أ/ *${unit.residentName}* المحترم،\n` +
      `تحية طيبة من إدارة *${settings.buildingName}* 🏢\n` +
      `نود تذكيركم بسداد اشتراك الصيانة والمصروفات عن شهر *${hubData.monthLabelArabic}* بقيمة *${formatMoney(
        unit.remainingAmount,
        settings.currency
      )}*.\n\n` +
      `📲 *للدفع السريع عبر إنستاباي (InstaPay):*\n` +
      `${INSTAPAY_PAYMENT_URL}\n` +
      `👤 *اسم المستلم:* ${INSTAPAY_RECIPIENT_NAME}\n` +
      `شاكرين حسن تعاونكم الدائم 🌹`;

    return `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`;
  };

  const availableMonths = [
    { value: '2026-09', label: 'سبتمبر 2026 (2026-09)' },
    { value: '2026-10', label: 'أكتوبر 2026 (2026-10)' },
    { value: '2026-11', label: 'نوفمبر 2026 (2026-11)' },
    { value: '2026-12', label: 'ديسمبر 2026 (2026-12)' },
  ];

  const getPriorityBadge = (priority: 'high' | 'normal') => {
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black">
          <Flame className="w-3 h-3 text-rose-600" />
          <span>أولوية عاجلة</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>مهمة اعتيادية</span>
      </span>
    );
  };

  return (
    <div data-testid="quick-summary-tasks-view" className="space-y-6 pb-8">
      {/* 1. Hero Command Center Header */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <ListChecks className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  شاشة الملخصات التنفيذية والمهام السريعة
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
                  مركز الإدارة الفورية
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                رؤية شاملة ومختصرة لحالة الخزينة والشقق والأدوار الـ 10 مع إدارة المهام اليومية والأوامر السريعة بضغطة واحدة
              </p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl px-3.5 py-2 self-stretch lg:self-auto justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">ملخص شهر:</span>
            </div>
            <select
              aria-label="اختيار الشهر في شاشة الملخصات والمهام"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Quick Executive Action Bar */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>اختصارات ومهام تنفيذية فورية بضغطة واحدة:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              data-testid="quick-hub-open-excel-sheet-btn"
              onClick={onOpenFloorsExcelSheet}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>نموذج الإكسيل المصور الملون</span>
            </button>

            <button
              type="button"
              data-testid="quick-hub-collect-btn"
              onClick={() => onOpenAddRevenue()}
              disabled={isReadOnly}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>تحصيل قسط سريع</span>
            </button>

            <button
              type="button"
              data-testid="quick-hub-expense-btn"
              onClick={onOpenAddExpense}
              disabled={isReadOnly}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>تسجيل مصروف جديد</span>
            </button>

            <button
              type="button"
              data-testid="quick-hub-bulk-whatsapp-btn"
              onClick={onOpenBulkWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white border border-teal-500/40 font-black text-xs shadow-md transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>تذكير المتأخرين ({hubData.topOverdueUnits.length}) واتساب</span>
            </button>

            <button
              type="button"
              onClick={onOpenWhatsAppInvoice}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition cursor-pointer col-span-2 sm:col-span-1"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>التقرير المالي للواتساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary Cards Grid (4 Color-Coded Summary Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Treasury & All-Time Balance */}
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 block">
                ملخص الخزينة الفعلي المتاح
              </span>
              <div
                data-testid="quick-hub-treasury-balance"
                className="text-2xl font-black text-emerald-700 font-mono mt-1"
              >
                {formatMoney(hubData.treasuryBalance, settings.currency)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-500 block">إجمالي الإيرادات</span>
              <span className="font-black text-emerald-800 font-mono">
                {formatMoney(hubData.allTimeRevenues, settings.currency)}
              </span>
            </div>
            <div className="bg-rose-50/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-500 block">إجمالي المصروفات</span>
              <span className="font-black text-rose-800 font-mono">
                {formatMoney(hubData.allTimeExpenses, settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Current Month Financial Summary */}
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 block">
                حركة شهر ({hubData.monthLabelArabic})
              </span>
              <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
                {formatMoney(hubData.monthRevenues, settings.currency)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-2">
              <span className="text-[10px] text-slate-500 block">مصروفات الشهر</span>
              <span className="font-black text-rose-700 font-mono">
                {formatMoney(hubData.monthExpenses, settings.currency)}
              </span>
            </div>
            <div className="bg-indigo-50/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-500 block">صافي الشهر</span>
              <span className="font-black text-indigo-900 font-mono">
                {formatMoney(hubData.monthNetFlow, settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Apartments Collection Status Summary */}
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-500/35 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 block">
                ملخص تحصيل الـ {hubData.unitsSummary.totalUnits} شقة
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {hubData.collectionRatePercent}%
                </span>
                <span className="text-xs font-bold text-emerald-700">نسبة التحصيل</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full transition-all"
                style={{ width: `${hubData.collectionRatePercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
              <div className="bg-emerald-50 text-emerald-800 rounded-lg py-1 border border-emerald-200">
                مسدد: {hubData.unitsSummary.fullyPaidCount + hubData.unitsSummary.partialPaidCount}
              </div>
              <div className="bg-rose-50 text-rose-800 rounded-lg py-1 border border-rose-200">
                متأخر: {hubData.unitsSummary.unpaidRequiredCount}
              </div>
              <div className="bg-amber-50 text-amber-800 rounded-lg py-1 border border-amber-200">
                معفى/X: {hubData.unitsSummary.exemptOrClosedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Quick Tasks & Operations Completion */}
        <div className="bg-white rounded-3xl p-5 border-2 border-cyan-500/35 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 block">
                إنجاز المهام السريعة
              </span>
              <div
                data-testid="quick-hub-tasks-progress"
                className="text-2xl font-black text-cyan-800 font-mono mt-1"
              >
                {hubData.tasksSummary.completedTasks} / {hubData.tasksSummary.totalTasks}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-cyan-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${hubData.tasksSummary.completionRatePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">
                قيد التنفيذ: {hubData.tasksSummary.pendingTasks}
              </span>
              {hubData.tasksSummary.highPriorityPendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-[11px] font-black">
                  {hubData.tasksSummary.highPriorityPendingCount} عاجلة
                </span>
              ) : (
                <span className="text-emerald-600 text-[11px]">لا توجد مهام عاجلة متأخرة</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Grid: Interactive Quick Tasks Manager + Overdue Units & Floors Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right/Main Column (7 cols): Interactive Quick Tasks Center */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  قائمة المهام السريعة وخطة العمل اليومية
                </h3>
                <p className="text-xs text-slate-500">
                  أضف مهام إدارة العمارة أو اختر من القوالب الذكية الجاهزة وتابع إنجازها بضغطة زر
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: `الكل (${quickTasks.length})` },
                { id: 'pending', label: `قيد التنفيذ (${hubData.tasksSummary.pendingTasks})` },
                { id: 'high', label: `عاجلة (${hubData.tasksSummary.highPriorityPendingCount})` },
                { id: 'completed', label: `مكتملة (${hubData.tasksSummary.completedTasks})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskFilter(tab.id as typeof taskFilter)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    taskFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Quick Task Form */}
          {!isReadOnly && (
            <form
              onSubmit={handleCreateTask}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  data-testid="quick-task-title-input"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="اكتب مهمة جديدة... (مثال: تحصيل اشتراك شقة 15 أو صيانة موتور المياه)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  data-testid="quick-task-submit-btn"
                  disabled={!newTaskTitle.trim()}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs shadow-sm transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مهمة</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">الأولوية:</span>
                  {(
                    [
                      { value: 'high', label: 'عاجلة جداً', activeClass: 'bg-rose-600 text-white' },
                      { value: 'normal', label: 'اعتيادية', activeClass: 'bg-slate-700 text-white' },
                    ] as const
                  ).map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setNewTaskPriority(p.value)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        newTaskPriority === p.value
                          ? p.activeClass
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {hubData.tasksSummary.completedTasks > 0 && (
                  <button
                    type="button"
                    onClick={clearCompletedQuickTasks}
                    className="text-slate-500 hover:text-rose-600 font-bold underline text-[11px] cursor-pointer"
                  >
                    مسح المهام المكتملة ({hubData.tasksSummary.completedTasks})
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 1-Click Smart Preset Templates */}
          {!isReadOnly && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>قوالب مهام ذكية جاهزة للإضافة بضغطة واحدة:</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_TASK_SMART_TEMPLATES.map(preset => {
                  const isAdded = justAddedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`preset-task-btn-${preset.id}`}
                      onClick={() => handleAddSmartPreset(preset)}
                      className={`text-right p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-slate-50/70 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-indigo-600 block">
                          {preset.categoryLabel}
                        </span>
                        <span className="text-xs font-bold truncate block">
                          {preset.title}
                        </span>
                      </div>
                      <span className="shrink-0 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                        {isAdded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-2.5 pt-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold">
                لا توجد مهام مطابقة للفلتر المحدد حالياً. يمكنك إضافة مهمة جديدة من الأعلى.
              </div>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  data-testid={`quick-task-item-${task.id}`}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-500'
                      : task.priority === 'high'
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      data-testid={`toggle-task-btn-${task.id}`}
                      onClick={() => toggleQuickTask(task.id)}
                      disabled={isReadOnly}
                      aria-label={task.completed ? `إلغاء إكمال ${task.text}` : `إكمال ${task.text}`}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      {editingTaskId === task.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            data-testid={`edit-task-input-${task.id}`}
                            value={editingTaskText}
                            onChange={e => setEditingTaskText(e.target.value)}
                            className="flex-1 min-w-44 px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold text-slate-900"
                          />
                          <select
                            value={editingTaskPriority}
                            onChange={e => setEditingTaskPriority(e.target.value as 'high' | 'normal')}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                          >
                            <option value="high">عاجل</option>
                            <option value="normal">عادي</option>
                          </select>
                          <button
                            type="button"
                            data-testid={`save-task-edit-btn-${task.id}`}
                            onClick={() => {
                              if (editingTaskText.trim()) {
                                updateQuickTask(task.id, {
                                  text: editingTaskText.trim(),
                                  priority: editingTaskPriority,
                                });
                              }
                              setEditingTaskId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-xs sm:text-sm font-black leading-snug ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getPriorityBadge(task.priority)}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                              <Calendar className="w-3 h-3" />
                              <span>{task.createdAt}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && editingTaskId !== task.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-task-btn-${task.id}`}
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingTaskText(task.text);
                          setEditingTaskPriority(task.priority);
                        }}
                        aria-label={`تعديل المهمة ${task.text}`}
                        title="تعديل المهمة"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuickTask(task.id)}
                        aria-label={`حذف المهمة ${task.text}`}
                        title="حذف المهمة"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Left Column (5 cols): Quick Unpaid/Overdue Units + 10 Floors Matrix */}
        <div className="lg:col-span-5 space-y-6">
          {/* Box A: Quick Overdue / Unpaid Units Action List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    وحدات مطالبة بالسداد ({hubData.monthLabelArabic})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    متبقي للتحصيل هذا الشهر:{' '}
                    <span className="font-black text-rose-600 font-mono">
                      {formatMoney(hubData.remainingMonthToCollect, settings.currency)}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenBulkWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>تذكير الكل</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {hubData.topOverdueUnits.length === 0 ? (
                <div className="text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 font-bold text-xs">
                  تم تحصيل جميع اشتراكات الشقق المطالبة بالكامل لهذا الشهر!
                </div>
              ) : (
                hubData.topOverdueUnits.map(unit => (
                  <div
                    key={unit.apartmentId}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 flex items-center justify-between gap-2 transition"
                  >
                    <div
                      onClick={() => onSelectUnit(unit.apartmentId)}
                      className="min-w-0 cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[11px]">
                          شقة {unit.unitNumber}
                        </span>
                        <span className="font-black text-xs text-slate-900 truncate">
                          {unit.residentName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                        <span className="text-rose-700 font-mono">
                          المتبقي: {formatMoney(unit.remainingAmount, settings.currency)}
                        </span>
                        {unit.isPartial && (
                          <span className="px-1.5 py-0.2 rounded-md bg-cyan-100 text-cyan-800 text-[10px]">
                            سدد {unit.paidAmount} ج.م
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => onOpenAddRevenue(unit.apartmentId)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition cursor-pointer"
                        >
                          تحصيل
                        </button>
                      )}
                      <a
                        href={buildDirectResidentWhatsAppUrl(unit)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition"
                        title={`إرسال تذكير واتساب إلى ${unit.residentName}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Box B: 10 Floors Quick Visual Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    ملخص الأدوار السكنية (10 أدوار)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    حالة التحصيل السريعة لكل دور في العمارة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenFloorsExcelSheet}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <span>الكشف المصور</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {hubData.floorsQuickStatus.map(fl => (
                <div
                  key={fl.floor}
                  onClick={onOpenFloorsExcelSheet}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">
                      {fl.floorTitleArabic}
                    </span>
                    <span className="font-mono font-black text-xs text-emerald-700">
                      {fl.collectedAmount} ج.م
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      سدد: {fl.paidCount}
                    </span>
                    {fl.unpaidCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        لم يدفع: {fl.unpaidCount}
                      </span>
                    )}
                    {fl.exemptCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        معفى/X: {fl.exemptCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
