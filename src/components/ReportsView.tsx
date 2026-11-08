import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  calculateTotals,
  calculateApartmentsBalances,
  groupExpensesByCategory,
  filterByMonth,
  filterTransactionsByDateRange,
  filterByCategory,
  formatMoney,
  exportToCsv,
  generateDetailedWrittenWhatsAppReport,
  calculateBudgetForecast,
  buildWhatsAppInvoiceReportData,
  INSTAPAY_PAYMENT_URL,
  INSTAPAY_RECIPIENT_NAME,
  REVENUE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Table,
  PieChart,
  MessageCircle,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  History as HistoryIcon,
  Mail,
  FileImage,
} from 'lucide-react';


import { RevenueCategory, ExpenseCategory } from '../types';
import { EmailDispatchModal } from './EmailDispatchModal';
import { WhatsAppInvoiceImageCard } from './WhatsAppInvoiceImageCard';
import { FloorsExcelSheetModal } from './FloorsExcelSheetModal';

export type ReportTabKey =
  | 'financial_statement'
  | 'arrears_matrix'
  | 'category_breakdown'
  | 'budget_forecast'
  | 'whatsapp_broadcast'
  | 'whatsapp_invoice_image'
  | 'floors_excel_sheet';

interface ReportsViewProps {
  initialReportTab?: ReportTabKey;
  onOpenBulkWhatsApp?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportTab,
  onOpenBulkWhatsApp,
}) => {
  const {
    settings,
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    selectedMonth,
    setSelectedMonth,
    exportBackup,
  } = useBuilding();

  const [activeReportTab, setActiveReportTab] = useState<ReportTabKey>(
    initialReportTab || 'financial_statement'
  );

  const [copiedWa, setCopiedWa] = useState(false);
  const [customWaNotes, setCustomWaNotes] = useState('');
  const [isEmailReportModalOpen, setIsEmailReportModalOpen] = useState(false);
  const [invoiceGeneratedAt, setInvoiceGeneratedAt] = useState<Date>(() => new Date());

  // ----------------------------------------------------------------------
  // ADVANCED FILTERING STATE (الفلترة المتقدمة للتقارير)
  // ----------------------------------------------------------------------
  const [filterMode, setFilterMode] = useState<'month' | 'custom_range'>('month');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ----------------------------------------------------------------------
  // BUDGET FORECASTING STATE (إعدادات الميزانية التقديرية)
  // ----------------------------------------------------------------------
  const [forecastHorizon, setForecastHorizon] = useState<number>(6); // 1, 3, 6, 12 months
  const [safetyMarginPercent, setSafetyMarginPercent] = useState<number>(5); // 0, 5, 10, 15%
  const [reserveAllocationPercent, setReserveAllocationPercent] = useState<number>(10); // 5, 10, 15, 20%

  // ----------------------------------------------------------------------
  // FILTERED DATA COMPUTATION
  // ----------------------------------------------------------------------
  const { filteredRevenues, filteredExpenses, isFilterActive } = useMemo(() => {
    let revs = [...revenues];
    let exps = [...expenses];

    // 1. Date Filtering
    if (filterMode === 'month') {
      revs = filterByMonth(revs, selectedMonth);
      exps = filterByMonth(exps, selectedMonth);
    } else {
      revs = filterTransactionsByDateRange(revs, startDate, endDate);
      exps = filterTransactionsByDateRange(exps, startDate, endDate);
    }

    // 2. Transaction Type Filtering
    if (transactionType === 'revenue') {
      exps = [];
    } else if (transactionType === 'expense') {
      revs = [];
    }

    // 3. Category Filtering
    if (selectedCategory !== 'all') {
      revs = revs.filter(r => r.category === selectedCategory);
      exps = exps.filter(e => e.category === selectedCategory);
    }

    // 4. Unit / Apartment Filtering
    if (unitFilter !== 'all') {
      revs = revs.filter(r => r.unitId === unitFilter);
      // Expenses don't typically belong to a single unit, keep or filter by title if applicable
    }

    // 5. Search Query Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      revs = revs.filter(
        r =>
          r.residentName.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.unitNumber.includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
      exps = exps.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.voucherNumber.toLowerCase().includes(q) ||
          e.paidTo.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    const hasActiveFilters =
      filterMode === 'custom_range' ||
      selectedCategory !== 'all' ||
      transactionType !== 'all' ||
      unitFilter !== 'all' ||
      searchQuery.trim() !== '';

    return {
      filteredRevenues: revs,
      filteredExpenses: exps,
      isFilterActive: hasActiveFilters,
    };
  }, [
    revenues,
    expenses,
    filterMode,
    selectedMonth,
    startDate,
    endDate,
    transactionType,
    selectedCategory,
    unitFilter,
    searchQuery,
  ]);

  const resetFilters = () => {
    setFilterMode('month');
    setSelectedCategory('all');
    setTransactionType('all');
    setUnitFilter('all');
    setSearchQuery('');
  };

  // Calculations for filtered period
  const periodTotals = calculateTotals(filteredRevenues, filteredExpenses, 0);
  const allTimeTotals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);

  // Balances of all apartments
  const aptBalances = calculateApartmentsBalances(apartments, revenues, 1);
  const delinquentUnits = aptBalances.filter(b => b.balance < 0);
  const totalArrears = Math.abs(delinquentUnits.reduce((acc, b) => acc + b.balance, 0));

  // Expense breakdown for filtered expenses
  const expenseBreakdown = groupExpensesByCategory(filteredExpenses);

  // ----------------------------------------------------------------------
  // BUDGET FORECAST COMPUTATION (حساب الميزانية التقديرية بناءً على ٦ أشهر)
  // ----------------------------------------------------------------------
  const forecastResult = useMemo(() => {
    return calculateBudgetForecast(
      apartments,
      revenues,
      expenses,
      recurringExpenses,
      settings,
      {
        historyMonthsCount: 6,
        referenceMonth: selectedMonth,
        targetProjectionMonths: forecastHorizon,
        safetyMarginPercent,
        reserveAllocationPercent,
      }
    );
  }, [
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    settings,
    selectedMonth,
    forecastHorizon,
    safetyMarginPercent,
    reserveAllocationPercent,
  ]);

  // White Invoice Image & Written WhatsApp Report Data
  const whatsappInvoiceData = useMemo(() => {
    return buildWhatsAppInvoiceReportData({
      apartments,
      revenues,
      expenses,
      settings,
      targetMonth: selectedMonth,
      generatedAt: invoiceGeneratedAt,
    });
  }, [apartments, revenues, expenses, settings, selectedMonth, invoiceGeneratedAt]);

  // Written WhatsApp report text with all requested components and InstaPay footer
  const waReportText = useMemo(() => {
    return generateDetailedWrittenWhatsAppReport(whatsappInvoiceData, {
      customNotes: customWaNotes,
      instapayUrl: INSTAPAY_PAYMENT_URL,
      instapayRecipient: INSTAPAY_RECIPIENT_NAME,
    });
  }, [whatsappInvoiceData, customWaNotes]);

  const handleCopyWhatsApp = async (switchToTab = false) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(waReportText);
      } else {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = waReportText;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
      }
    } catch {
      // Fallback if clipboard API is restricted
    }
    setCopiedWa(true);
    if (switchToTab) {
      setActiveReportTab('whatsapp_broadcast');
    }
    setTimeout(() => setCopiedWa(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportStatementCsv = () => {
    const headers = ['النوع', 'رقم السند', 'التاريخ', 'البيان / الساكن', 'البند / التصنيف', 'المبلغ', 'طريقة الدفع'];
    const rows: (string | number)[][] = [
      ...filteredRevenues.map(r => [
        'إيراد',
        r.receiptNumber,
        r.date,
        `شقة ${r.unitNumber} - ${r.residentName}`,
        REVENUE_CATEGORY_LABELS[r.category] || r.category,
        r.amount,
        PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod,
      ]),
      ...filteredExpenses.map(e => [
        'مصروف',
        e.voucherNumber,
        e.date,
        `${e.title} (${e.paidTo})`,
        EXPENSE_CATEGORY_LABELS[e.category] || e.category,
        e.amount,
        PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod,
      ]),
    ];

    const filename =
      filterMode === 'month'
        ? `كشف_حساب_${selectedMonth}_${settings.buildingName}.csv`
        : `كشف_حساب_مخصص_${startDate}_إلى_${endDate}.csv`;

    exportToCsv(filename, headers, rows);
  };

  const handleExportArrearsCsv = () => {
    const headers = ['رقم الشقة', 'الدور', 'اسم الساكن', 'الهاتف', 'الاشتراك الشهري', 'المسدد', 'المتأخرات المطلوبة', 'الحالة'];
    const rows = aptBalances.map(b => [
      b.unitNumber,
      b.floor,
      b.residentName,
      b.phone,
      b.monthlyFee,
      b.totalPaid,
      b.balance < 0 ? Math.abs(b.balance) : 0,
      b.balance >= 0 ? 'خالص السداد' : 'عليه متأخرات',
    ]);

    exportToCsv(`كشف_متأخرات_وسداد_${selectedMonth}.csv`, headers, rows);
  };

  const handleExportForecastCsv = () => {
    const headers = ['بند المصروف', 'المتوسط الشهري التاريخي', 'المبلغ المقدر للفترة', 'النسبة %', 'النوع', 'اتجاه الصرف'];
    const rows = forecastResult.categoryEstimates.map(cat => [
      cat.label,
      cat.avgMonthlyAmount,
      cat.projectedTotal,
      `${cat.percentageOfExpenses}%`,
      cat.isRecurringFixed ? 'ثابت متكرر' : 'متغير / طارئ',
      cat.trend === 'increasing' ? 'صاعد' : cat.trend === 'decreasing' ? 'هابط' : 'مستقر',
    ]);

    exportToCsv(`الميزانية_التقديرية_${forecastHorizon}_أشهر_${settings.buildingName}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Export Controls Bar (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>التقارير المالية المتقدمة والميزانية التقديرية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            كشوف حسابات مفلترة، نطاقات تواريخ مخصصة، وتخطيط مالي تنبؤي للأشهر القادمة
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenBulkWhatsApp && (
            <button
              type="button"
              data-testid="reports-bulk-overdue-whatsapp-btn"
              onClick={onOpenBulkWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              title="إرسال رسالة واتساب لكل المتأخرين بضغطة زر واحدة"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب لكل المتأخرين بضغطة واحدة</span>
            </button>
          )}

          <button
            type="button"
            data-testid="copy-written-whatsapp-report-btn"
            onClick={() => handleCopyWhatsApp(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-xs ring-2 ring-emerald-500/20"
            title="نسخ التقرير المكتوب الكامل تمهيداً لنشره على واتساب مع الأسماء والمصروفات والمتأخرات وعنوان انستا باي"
          >
            {copiedWa ? <Check className="w-4 h-4 text-emerald-200" /> : <MessageCircle className="w-4 h-4" />}
            <span>{copiedWa ? 'تم نسخ تقرير واتساب مكتوب!' : 'تقرير واتساب مكتوب (نسخ)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInvoiceGeneratedAt(new Date());
              setActiveReportTab('whatsapp_invoice_image');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="توليد التقرير المالي على شكل صورة فاتورة بيضاء لإرسالها على واتساب"
          >
            <FileImage className="w-4 h-4" />
            <span>صورة فاتورة للواتساب</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmailReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="إرسال التقرير المالي أو كشف الحساب عبر البريد الإلكتروني للمستأجرين"
          >
            <Mail className="w-4 h-4" />
            <span>إرسال التقرير بالبريد للمستأجرين</span>
          </button>

          <button
            type="button"
            onClick={() => exportBackup()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
            title="تحميل نسخة احتياطية كاملة من قاعدة البيانات بصيغة JSON"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            نسخة احتياطية
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            طباعة التقرير (A4 / PDF)
          </button>
        </div>
      </div>

      {/* Confirmation Banner when Written WhatsApp Report is Copied */}
      {copiedWa && (
        <div
          data-testid="written-whatsapp-copied-banner"
          className="no-print bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-950 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              تم نسخ <strong>تقرير واتساب المكتوب لشهر {whatsappInvoiceData.monthLabelArabic}</strong> إلى الحافظة بنجاح! يمكنك الآن لصقه ونشره مباشرة في جروب الواتساب.
            </span>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white shrink-0">
            جاهز للصق (Ctrl+V)
          </span>
        </div>
      )}

      {/* ADVANCED FILTERING PANEL (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="font-black text-sm text-slate-800">خيارات الفلترة والتصفية المتقدمة</span>
            {isFilterActive && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                فلاتر مفعلة
              </span>
            )}
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* 1. Filter Mode & Date Picker */}
          <div className="space-y-1.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                النطاق الزمني:
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('month')}
                  className={`px-2 py-0.5 rounded ${
                    filterMode === 'month' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  بالشهر
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('custom_range')}
                  className={`px-2 py-0.5 rounded ${
                    filterMode === 'custom_range' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  نطاق مخصص
                </button>
              </div>
            </div>

            {filterMode === 'month' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block mb-0.5">من تاريخ:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block mb-0.5">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Transaction Type Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">نوع العملية:</label>
            <select
              value={transactionType}
              onChange={e => setTransactionType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">الكل (إيرادات ومصروفات)</option>
              <option value="revenue">إيرادات فقط (سندات قبض)</option>
              <option value="expense">مصروفات فقط (سندات صرف)</option>
            </select>
          </div>

          {/* 3. Category Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">التصنيف أو البند:</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل التصنيفات</option>
              <optgroup label="بنود المصروفات">
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="بنود الإيرادات">
                {Object.entries(REVENUE_CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. Unit / Apartment Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">تصفية بالشقة:</label>
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">جميع الشقق</option>
              {apartments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  شقة {apt.number} ({apt.residentName})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Search Bar Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم السند، أو بيان الفاتورة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            النتائج: <span className="font-bold text-slate-900">{filteredRevenues.length}</span> إيراد،{' '}
            <span className="font-bold text-slate-900">{filteredExpenses.length}</span> مصروف
          </div>
        </div>
      </div>

      {/* Report Formats Tabs Navigation (Hidden in Print) */}
      <div className="no-print flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('financial_statement')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'financial_statement'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          ١. كشف الحساب المعتمد (رسمي)
        </button>

        <button
          onClick={() => setActiveReportTab('budget_forecast')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'budget_forecast'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          ٢. الميزانية التقديرية (Budget Forecasting)
        </button>

        <button
          onClick={() => setActiveReportTab('arrears_matrix')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'arrears_matrix'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-4 h-4" />
          ٣. موقف سداد السكان والمتأخرات
        </button>

        <button
          onClick={() => setActiveReportTab('category_breakdown')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'category_breakdown'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          ٤. تحليل بنود المصروفات
        </button>

        <button
          type="button"
          data-testid="tab-whatsapp-written-report"
          onClick={() => setActiveReportTab('whatsapp_broadcast')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'whatsapp_broadcast'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          ٥. تقرير واتساب مكتوب
        </button>

        <button
          type="button"
          onClick={() => {
            setInvoiceGeneratedAt(new Date());
            setActiveReportTab('whatsapp_invoice_image');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'whatsapp_invoice_image'
              ? 'border-emerald-600 text-emerald-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileImage className="w-4 h-4 text-emerald-600" />
          ٦. صورة فاتورة واتساب (فاتورة بيضاء)
        </button>

        <button
          type="button"
          data-testid="tab-floors-excel-sheet"
          onClick={() => setActiveReportTab('floors_excel_sheet')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeReportTab === 'floors_excel_sheet'
              ? 'border-amber-600 text-amber-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-4 h-4 text-amber-600" />
          ٧. جدول الأدوار والأسماء والأرقام (نموذج الإكسيل)
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: FINANCIAL STATEMENT (كشف الحساب المعتمد مع الفلترة المتقدمة) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'financial_statement' && (
        <div className="bg-white rounded-b-2xl p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          
          {/* Quick CSV Export button (Hidden in Print) */}
          <div className="no-print flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500">
              {filterMode === 'month'
                ? `بيانات شهر: ${selectedMonth}`
                : `بيانات الفترة: من ${startDate} إلى ${endDate}`}
              {selectedCategory !== 'all' && ` (تصنيف: ${EXPENSE_CATEGORY_LABELS[selectedCategory as ExpenseCategory] || REVENUE_CATEGORY_LABELS[selectedCategory as RevenueCategory] || selectedCategory})`}
            </span>
            <button
              onClick={handleExportStatementCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير هذا الكشف Excel (CSV)
            </button>
          </div>

          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-800 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {settings.appIconUrl && (
                  <img
                    data-testid="report-letterhead-app-icon"
                    src={settings.appIconUrl}
                    alt={settings.buildingName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-2xs shrink-0"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{settings.buildingName}</h1>
                  <p className="text-xs text-slate-600 font-medium mt-1">{settings.buildingAddress}</p>
                  <p className="text-xs text-slate-500">لجنة إدارة العقار واتحاد الشاغلين</p>
                </div>
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-900 text-sm">
                  كشف الحساب المالي المعتمد
                </div>
                <div className="text-slate-600 mt-1">
                  الفترة: <span className="font-bold text-indigo-700">
                    {filterMode === 'month' ? selectedMonth : `من ${startDate} إلى ${endDate}`}
                  </span>
                </div>
                <div className="text-slate-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          </div>

          {/* Financial Reconciliation Summary Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-slate-500 block mb-1">إجمالي الإيرادات المحصلة (+)</span>
              <span className="font-black text-base text-emerald-600">
                {formatMoney(periodTotals.totalRevenues, settings.currency)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-slate-500 block mb-1">إجمالي المصروفات المدفوعة (-)</span>
              <span className="font-black text-base text-rose-600">
                {formatMoney(periodTotals.totalExpenses, settings.currency)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-slate-500 block mb-1">صافي حركة الفترة (فائض / عجز)</span>
              <span className={`font-black text-base ${periodTotals.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {periodTotals.netFlow >= 0 ? '+' : ''}{formatMoney(periodTotals.netFlow, settings.currency)}
              </span>
            </div>
            <div className="p-3 bg-slate-900 text-white rounded-lg">
              <span className="text-slate-400 block mb-1">الرصيد الفعلي الختامي بالخزينة</span>
              <span className="font-black text-base text-emerald-400">
                {formatMoney(allTimeTotals.currentBalance, settings.currency)}
              </span>
            </div>
          </div>

          {/* Section 1: Itemized Revenues */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200 mb-3 flex items-center justify-between">
              <span>أولاً: بيان الإيرادات والتحصيلات خلال الفترة ({filteredRevenues.length} عملية)</span>
              <span className="font-bold text-emerald-700">{formatMoney(periodTotals.totalRevenues, settings.currency)}</span>
            </h3>

            {filteredRevenues.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                لا توجد إيرادات مطابقة لمعايير الفلترة المحددة.
              </p>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2 px-3">رقم السند</th>
                    <th className="py-2 px-3">التاريخ</th>
                    <th className="py-2 px-3">الشقة والساكن</th>
                    <th className="py-2 px-3">البيان</th>
                    <th className="py-2 px-3">طريقة الدفع</th>
                    <th className="py-2 px-3 text-left">المبلغ ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRevenues.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 text-slate-600 font-bold">{r.receiptNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{r.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">شقة {r.unitNumber} - {r.residentName}</td>
                      <td className="py-2 px-3 text-slate-600">{REVENUE_CATEGORY_LABELS[r.category] || r.category}</td>
                      <td className="py-2 px-3 text-slate-500">{PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</td>
                      <td className="py-2 px-3 text-left font-bold text-slate-900">{formatMoney(r.amount, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 2: Itemized Expenses */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200 mb-3 flex items-center justify-between">
              <span>ثانياً: بيان المصروفات والمدفوعات خلال الفترة ({filteredExpenses.length} عملية)</span>
              <span className="font-bold text-rose-700">{formatMoney(periodTotals.totalExpenses, settings.currency)}</span>
            </h3>

            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                لا توجد مصروفات مطابقة لمعايير الفلترة المحددة.
              </p>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2 px-3">رقم السند</th>
                    <th className="py-2 px-3">التاريخ</th>
                    <th className="py-2 px-3">بيان وتفاصيل المصروف</th>
                    <th className="py-2 px-3">التصنيف</th>
                    <th className="py-2 px-3">المدفوع له</th>
                    <th className="py-2 px-3 text-left">المبلغ ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(e => (
                    <tr key={e.id}>
                      <td className="py-2 px-3 text-slate-600 font-bold">{e.voucherNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{e.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{e.title}</td>
                      <td className="py-2 px-3 text-slate-600">{EXPENSE_CATEGORY_LABELS[e.category] || e.category}</td>
                      <td className="py-2 px-3 text-slate-500">{e.paidTo}</td>
                      <td className="py-2 px-3 text-left font-bold text-slate-900">{formatMoney(e.amount, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Official Signatures Bar */}
          <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-3 items-center text-center text-xs mt-12">
            <div>
              <p className="font-bold text-slate-800">أمين الصندوق</p>
              <p className="mt-8 text-slate-600 font-bold">{settings.treasurerName}</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="font-bold text-slate-800 mb-2">الختم الرسمي المعتمد</p>
              {settings.officialStampUrl ? (
                <img
                  data-testid="report-official-stamp-img"
                  src={settings.officialStampUrl}
                  alt="الختم الرسمي"
                  className="w-24 h-24 object-contain mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600/50 flex flex-col items-center justify-center text-[10px] text-emerald-800 font-bold p-1 leading-tight">
                  <span>ختم الإدارة</span>
                  <span className="text-[8px] text-slate-500">معتمد</span>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800">رئيس اتحاد الشاغلين</p>
              <p className="mt-8 text-slate-400">.......................</p>
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: BUDGET FORECASTING (الميزانية التقديرية والتخطيط المالي) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'budget_forecast' && (
        <div className="bg-white rounded-b-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-8">
          
          {/* Header & Controls Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    نموذج الميزانية التقديرية والتخطيط المالي (Budget Forecasting)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تنبؤ مالي دقيق مستند إلى متوسط إيرادات ومصروفات الـ ٦ أشهر الماضية
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportForecastCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير الميزانية CSV
              </button>
            </div>
          </div>

          {/* Interactive Forecasting Parameter Controls */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              محددات ومعايير بناء النموذج التقديري:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Parameter 1: Projection Horizon */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="font-bold text-slate-700 block">فترة التنبؤ والتخطيط القادمة:</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'شهر', val: 1 },
                    { label: '٣ أشهر', val: 3 },
                    { label: '٦ أشهر', val: 6 },
                    { label: 'سنة (١٢)', val: 12 },
                  ].map(h => (
                    <button
                      key={h.val}
                      type="button"
                      onClick={() => setForecastHorizon(h.val)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition text-center ${
                        forecastHorizon === h.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 2: Safety & Price Inflation Margin */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="font-bold text-slate-700 block">هامش الأمان وتحوط الأسعار:</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '0%', val: 0 },
                    { label: '5%', val: 5 },
                    { label: '10%', val: 10 },
                    { label: '15%', val: 15 },
                  ].map(m => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setSafetyMarginPercent(m.val)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition text-center ${
                        safetyMarginPercent === m.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 3: Emergency Reserve Allocation Rate */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="font-bold text-slate-700 block">نسبة الادخار لصندوق الطوارئ:</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '5%', val: 5 },
                    { label: '10%', val: 10 },
                    { label: '15%', val: 15 },
                    { label: '20%', val: 20 },
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setReserveAllocationPercent(r.val)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition text-center ${
                        reserveAllocationPercent === r.val
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Historical 6-Month Baseline Summary Box */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <HistoryIcon className="w-4 h-4 text-indigo-600" />
                الأساس التاريخي المعتمد (متوسط آخر ٦ أشهر: {forecastResult.historyMonthsKeys.join(' ، ')})
              </span>

              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                كفاءة التحصيل: {forecastResult.collectionEfficiencyRate}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">متوسط التحصيل الشهري الفعلي</span>
                <span className="text-base font-black text-emerald-600">
                  {formatMoney(forecastResult.averageMonthlyRevenue, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  من إجمالي طاقة اشتراكات {formatMoney(forecastResult.potentialMonthlyRent, settings.currency)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">متوسط الإنفاق الشهري الفعلي</span>
                <span className="text-base font-black text-rose-600">
                  {formatMoney(forecastResult.averageMonthlyExpense, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  شامل الرواتب، فواتير الكهرباء، والصيانة
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">متوسط الفائض التشغيلي الشهري</span>
                <span className={`text-base font-black ${forecastResult.averageMonthlyNetSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {forecastResult.averageMonthlyNetSurplus >= 0 ? '+' : ''}{formatMoney(forecastResult.averageMonthlyNetSurplus, settings.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {forecastResult.averageMonthlyNetSurplus >= 0 ? 'فائض نقدي منتظم' : 'عجز يحتاج معالجة'}
                </span>
              </div>
            </div>
          </div>

          {/* High-Level Projections (KPIs for Forecast Horizon) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900">
                تقديرات الميزانية لفترة الـ ({forecastHorizon}) أشهر القادمة:
              </h4>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-500">تقييم الملاءة المالية:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  {forecastResult.financialHealthGrade} ({forecastResult.financialHealthScore}/100)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="font-bold">الإيرادات المقدرة (+)</span>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {formatMoney(forecastResult.projectedTotalRevenues, settings.currency)}
                </div>
                <p className="text-[10px] text-emerald-800/80 mt-1 font-medium">
                  {formatMoney(forecastResult.averageMonthlyRevenue, settings.currency)} × {forecastHorizon} شهر
                </p>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                <div className="flex items-center justify-between text-rose-800 mb-1">
                  <span className="font-bold">المصروفات المقدرة (-)</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl font-black text-rose-700 mt-1">
                  {formatMoney(forecastResult.projectedTotalExpenses, settings.currency)}
                </div>
                <p className="text-[10px] text-rose-800/80 mt-1 font-medium">
                  متضمنة هامش أمان {safetyMarginPercent}% (+{formatMoney(forecastResult.projectedTotalExpenses - forecastResult.baseProjectedExpenses, settings.currency)})
                </p>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <div className="flex items-center justify-between text-blue-800 mb-1">
                  <span className="font-bold">مخصص الطوارئ (الوديعة)</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-black text-blue-700 mt-1">
                  {formatMoney(forecastResult.projectedEmergencyFundAddition, settings.currency)}
                </div>
                <p className="text-[10px] text-blue-800/80 mt-1 font-medium">
                  اقتطاع بنسبة {reserveAllocationPercent}% لصالح صندوق الاحتياطي
                </p>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl">
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="font-bold">صافي الفائض التشغيلي الحر</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className={`text-xl font-black mt-1 ${forecastResult.projectedDiscretionarySurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {forecastResult.projectedDiscretionarySurplus >= 0 ? '+' : ''}{formatMoney(forecastResult.projectedDiscretionarySurplus, settings.currency)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  المتبقي المتاح بعد تجنيب احتياطي الطوارئ
                </p>
              </div>

            </div>
          </div>

          {/* Forecasted Category Breakdown Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">
              جدول الميزانية التقديرية حسب بنود الإنفاق (Expense Budget Allocation):
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">البند / التصنيف</th>
                    <th className="py-3 px-4">المتوسط الشهري التاريخي</th>
                    <th className="py-3 px-4">المبلغ المقدر للفترة ({forecastHorizon} أشهر)</th>
                    <th className="py-3 px-4">النسبة من الميزانية</th>
                    <th className="py-3 px-4">طبيعة البند</th>
                    <th className="py-3 px-4">الاتجاه التاريخي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecastResult.categoryEstimates.map(cat => (
                    <tr key={cat.category} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {cat.label}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatMoney(cat.avgMonthlyAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-rose-700">
                        {formatMoney(cat.projectedTotal, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, cat.percentageOfExpenses)}%` }}
                            />
                          </div>
                          <span>{cat.percentageOfExpenses}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {cat.isRecurringFixed ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            مصروف ثابت دوري
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            متغير / صيانة طارئة
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {cat.trend === 'increasing' ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                            <TrendingUp className="w-3.5 h-3.5" />
                            صاعد (+10%)
                          </span>
                        ) : cat.trend === 'decreasing' ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                            <TrendingDown className="w-3.5 h-3.5" />
                            هابط (-10%)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium text-[11px]">
                            ↔ مستقر
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic Automated Recommendations Cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>التوصيات والتحليلات الاستراتيجية لإدارة العقار:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {forecastResult.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                    rec.type === 'success'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : rec.type === 'warning'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="font-black flex items-center gap-1.5">
                    {rec.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {rec.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {rec.type === 'info' && <Info className="w-4 h-4 text-indigo-600" />}
                    <span>{rec.title}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: ARREARS MATRIX (كشف موقف سداد السكان والمتأخرات) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'arrears_matrix' && (
        <div className="bg-white rounded-b-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900">
                كشف موقف سداد اشتراكات الشقق وحصر المتأخرات
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                حالة كل شقة، إجمالي المسدد، والمبالغ المطلوبة والمستحقة
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenBulkWhatsApp && (
                <button
                  type="button"
                  onClick={onOpenBulkWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب لكل المتأخرين بضغطة واحدة</span>
                </button>
              )}
              <button
                onClick={handleExportArrearsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير كشف المتأخرات Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">رقم الشقة</th>
                  <th className="py-3 px-3">الدور</th>
                  <th className="py-3 px-3">اسم الساكن</th>
                  <th className="py-3 px-3">النوع</th>
                  <th className="py-3 px-3">الاشتراك</th>
                  <th className="py-3 px-3">المسدد</th>
                  <th className="py-3 px-3">الموقف المالي</th>
                  <th className="py-3 px-3">تاريخ آخر دفعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aptBalances.map(b => (
                  <tr key={b.unitId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">شقة ({b.unitNumber})</td>
                    <td className="py-3 px-3 text-slate-600">{b.floor}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.residentName}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {b.residentType === 'owner' ? '👑 مالك' : '🔑 مستأجر'}
                    </td>
                    <td className="py-3 px-3 font-mono">{formatMoney(b.monthlyFee, settings.currency)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                      {formatMoney(b.totalPaid, settings.currency)}
                    </td>
                    <td className="py-3 px-3">
                      {b.balance < 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                          متأخر: {Math.abs(b.balance)} {settings.currency}
                        </span>
                      ) : b.balance > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                          له رصيد: {b.balance} {settings.currency}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          خالص السداد
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {b.lastPaymentDate || 'لم يسدد'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: CATEGORY BREAKDOWN (تحليل بنود المصروفات) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'category_breakdown' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              تحليل وتوزيع بنود المصروفات خلال الفترة المحددة
            </h3>
            <p className="text-xs text-slate-500">
              بيان تفصيلي لكل بند مصروف، نسبته المئوية من إجمالي الإنفاق، وعدد الفواتير
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Table of categories */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">البند / التصنيف</th>
                    <th className="py-3 px-4">عدد العمليات</th>
                    <th className="py-3 px-4">المبلغ المنصرف</th>
                    <th className="py-3 px-4">النسبة %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseBreakdown.map(item => (
                    <tr key={item.category} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.label}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{item.count}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {formatMoney(item.total, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 font-mono">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual Bars Breakdown */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider mb-2">
                الرسم البياني للتوزيع النسبي للمصروفات
              </h4>
              {expenseBreakdown.map(item => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-slate-900 font-mono">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 5: WRITTEN WHATSAPP REPORT (تقرير واتساب مكتوب جاهز للنسخ والنشر) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'whatsapp_broadcast' && (
        <div
          id="written-whatsapp-report-section"
          className="bg-white rounded-b-2xl p-6 border border-slate-200 shadow-sm space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>تقرير واتساب مكتوب — شهر {whatsappInvoiceData.monthLabelArabic} ({whatsappInvoiceData.targetMonth})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يتضمن الشهر بالأعلى، إجمالي الخزنة الحالية والمرحلة من الشهر الماضي، المصروفات والمتبقي، المسددين والمتأخرين هذا الشهر في صفوف، بنود المصروفات، وملاحظات متأخرات الشهور الماضية، وعنوان الدفع انستا باي بالأسفل
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                data-testid="copy-written-whatsapp-tab-btn"
                onClick={() => handleCopyWhatsApp(false)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs"
              >
                {copiedWa ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWa ? 'تم نسخ التقرير المكتوب!' : 'نسخ تقرير واتساب مكتوب'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(waReportText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>إرسال مباشر عبر واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setInvoiceGeneratedAt(new Date());
                  setActiveReportTab('whatsapp_invoice_image');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <FileImage className="w-4 h-4 text-emerald-400" />
                <span>صورة الفاتورة البيضاء</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Strip matching the Written Report Sections */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold">المرحل من الشهر الماضي</span>
              <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                {formatMoney(whatsappInvoiceData.totals.previousCarryOver, settings.currency)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">إجمالي الخزنة الحالية والمرحلة</span>
              <span className="text-sm font-black text-emerald-700 font-mono mt-0.5 block">
                {formatMoney(whatsappInvoiceData.totals.totalTreasuryAvailable, settings.currency)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-rose-800 block text-[11px] font-semibold">إجمالي المصروفات هذا الشهر</span>
              <span className="text-sm font-black text-rose-700 font-mono mt-0.5 block">
                {formatMoney(whatsappInvoiceData.totals.monthExpenses, settings.currency)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-white">
              <span className="text-slate-300 block text-[11px] font-semibold">المتبقي في الخزنة الحالية</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                {formatMoney(whatsappInvoiceData.totals.treasuryRemainingBalance, settings.currency)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 col-span-2 sm:col-span-1">
              <span className="text-amber-900 block text-[11px] font-semibold">متأخرات شهور ماضية (ملاحظات)</span>
              <span className="text-sm font-black text-amber-800 font-mono mt-0.5 block">
                {whatsappInvoiceData.pastMonthsArrears.length} حالة ({formatMoney(whatsappInvoiceData.totals.totalPastMonthsArrears, settings.currency)})
              </span>
            </div>
          </div>

          {/* Optional Custom Note Input for the Notes (ملاحظات) Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label htmlFor="custom-wa-notes-input" className="text-xs font-bold text-slate-700 whitespace-nowrap">
              إضافة سطر تنبيه في قسم الملاحظات (اختياري):
            </label>
            <input
              id="custom-wa-notes-input"
              type="text"
              value={customWaNotes}
              onChange={e => setCustomWaNotes(e.target.value)}
              placeholder="مثال: يرجى سرعة سداد الاشتراكات المتأخرة قبل يوم 5 بالشهر..."
              className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {customWaNotes && (
              <button
                type="button"
                onClick={() => setCustomWaNotes('')}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2"
              >
                مسح
              </button>
            )}
          </div>

          {/* Formatted Written WhatsApp Report Textarea */}
          <div className="relative">
            <textarea
              data-testid="written-whatsapp-report-textarea"
              readOnly
              rows={24}
              value={waReportText}
              className="w-full p-5 text-xs font-semibold leading-relaxed bg-slate-900 text-emerald-300 rounded-2xl border border-slate-700 select-all focus:outline-hidden font-mono"
            />
          </div>

          {/* InstaPay Footer Verification Bar */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-black text-emerald-900">
                💳 عنوان الدفع المرفق أسفل التقرير (InstaPay):
              </div>
              <div className="font-mono text-[11px] text-emerald-800 break-all">
                {INSTAPAY_PAYMENT_URL} — باسم: <strong>{INSTAPAY_RECIPIENT_NAME}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopyWhatsApp(false)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shrink-0"
            >
              {copiedWa ? 'تم النسخ للحافظة ✓' : 'نسخ التقرير المكتوب الآن'}
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 6: WHATSAPP WHITE INVOICE IMAGE (صورة فاتورة بيضاء للواتساب) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'whatsapp_invoice_image' && (
        <div className="bg-white rounded-b-2xl p-6 border border-slate-200 shadow-sm">
          <WhatsAppInvoiceImageCard
            invoiceData={whatsappInvoiceData}
            onRefreshTimestamp={() => setInvoiceGeneratedAt(new Date())}
          />
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 7: FLOORS EXCEL SHEET (جدول الأدوار والأسماء والأرقام مطابق للصورة) */}
      {/* ---------------------------------------------------------------------- */}
      {activeReportTab === 'floors_excel_sheet' && (
        <div className="bg-white rounded-b-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
          <FloorsExcelSheetModal isEmbedded={true} />
        </div>
      )}

      <EmailDispatchModal
        isOpen={isEmailReportModalOpen}
        onClose={() => setIsEmailReportModalOpen(false)}
        mode="report"
        initialApartment={unitFilter !== 'all' ? apartments.find(a => a.id === unitFilter) || null : null}
        targetMonth={selectedMonth}
      />

    </div>
  );
};
