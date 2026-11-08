import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Expense, ExpenseCategory } from '../types';
import {
  formatMoney,
  exportToCsv,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Trash2,
  Calendar,
  Layers,
  Repeat,
  Zap,
  CheckCircle2,
  Settings,
  Edit2,
} from 'lucide-react';
import { RecurringExpensesModal } from './RecurringExpensesModal';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
  onEditExpense: (exp: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenAddExpense,
  onEditExpense,
}) => {
  const {
    expenses,
    deleteExpense,
    settings,
    selectedMonth,
    recurringExpenses,
    generateMonthlyRecurringExpenses,
    isReadOnly,
  } = useBuilding();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(selectedMonth);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch =
      exp.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMonth !== 'all' && !exp.date.startsWith(filterMonth)) return false;

    if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;

    return true;
  });

  const totalSum = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const handleExportCsv = () => {
    const headers = [
      'رقم السند',
      'التاريخ',
      'بيان المصروف',
      'التصنيف / البند',
      'المدفوع له',
      'رقم الفاتورة',
      'المبلغ',
      'طريقة الدفع',
      'ملاحظات',
    ];
    const rows = filteredExpenses.map(e => [
      e.voucherNumber,
      e.date,
      e.title,
      EXPENSE_CATEGORY_LABELS[e.category] || e.category,
      e.paidTo,
      e.invoiceNumber || '',
      e.amount,
      PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod,
      e.notes || '',
    ]);

    exportToCsv(`سجل_مصروفات_${filterMonth !== 'all' ? filterMonth : 'الكل'}.csv`, headers, rows);
  };

  const handleDelete = (exp: Expense) => {
    if (isReadOnly) return;
    deleteExpense(exp.id);
    setConfirmDeleteId(null);
  };

  const effectiveMonth = filterMonth !== 'all' ? filterMonth : selectedMonth;
  const activeRecurringCount = recurringExpenses.filter(r => r.isActive).length;
  const activeRecurringTotal = recurringExpenses.filter(r => r.isActive).reduce((sum, r) => sum + r.amount, 0);

  const handleQuickAutoGenerate = () => {
    if (isReadOnly) return;
    const res = generateMonthlyRecurringExpenses(effectiveMonth);
    if (res.generatedCount > 0) {
      setQuickFeedback(`تمت إضافة ${res.generatedCount} مصروفات متكررة لشهر ${effectiveMonth} بنجاح!`);
    } else {
      setQuickFeedback(`جميع المصروفات المتكررة مسجلة بالفعل لشهر ${effectiveMonth} (${res.skippedCount} بند مضاف مسبقاً).`);
    }
    setTimeout(() => setQuickFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <span>سجل المصروفات وسندات الصرف</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق جميع النفقات، فواتير الكهرباء والمياه، رواتب الحراسة والنظافة، وصيانة المصعد
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!isReadOnly && (
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200"
            >
              <Repeat className="w-4 h-4 text-indigo-600" />
              <span>المصروفات المتكررة ({activeRecurringCount})</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            تصدير إكسل (CSV)
          </button>
          {!isReadOnly && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              تسجيل سند صرف جديد
            </button>
          )}
        </div>
      </div>

      {/* Recurring Monthly Expenses Automation Bar */}
      {!isReadOnly && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 rounded-2xl p-4 border border-indigo-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">
                  المصروفات الشهرية المتكررة لشهر ({effectiveMonth})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {activeRecurringCount} بنود دورية نشطة ({formatMoney(activeRecurringTotal, settings.currency)})
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                مثل راتب الحارس، صيانة المصعد الشهرية، وفواتير كهرباء السلم. يمكنك توليدها بنقرة واحدة لتسجيلها تلقائياً بدون تكرار.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleQuickAutoGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>توليد مصروفات {effectiveMonth} تلقائياً</span>
            </button>
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition text-xs font-bold"
              title="تعديل قوالب المصروفات المتكررة"
            >
              <Settings className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Quick feedback banner */}
      {quickFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{quickFeedback}</span>
        </div>
      )}

      {/* Filter Bar & Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم السند، البيان، المدفوع له..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Month filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">الشهر:</span>
            <input
              type="month"
              value={filterMonth === 'all' ? '' : filterMonth}
              onChange={e => setFilterMonth(e.target.value || 'all')}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            />
            {filterMonth !== 'all' && (
              <button
                onClick={() => setFilterMonth('all')}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
              >
                الكل
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">جميع البنود والتصنيفات</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([cat, label]) => (
              <option key={cat} value={cat}>{label}</option>
            ))}
          </select>

          {/* Tally Pill */}
          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3 py-1.5 rounded-xl text-xs font-black">
            إجمالي المصروفات: {formatMoney(totalSum, settings.currency)} ({filteredExpenses.length} سند)
          </div>

        </div>

      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-sm text-slate-700 mb-1">لا توجد مصروفات مسجلة مطابقة</p>
            <p>يمكنك تسجيل سند صرف جديد بالضغط على زر "تسجيل سند صرف جديد" بالأعلى.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">بيان وتفاصيل المصروف</th>
                  <th className="py-3 px-4">البند والتصنيف</th>
                  <th className="py-3 px-4">المدفوع له</th>
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {exp.voucherNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {exp.paidTo}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {exp.invoiceNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600 text-sm">
                      {formatMoney(exp.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isReadOnly ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            data-testid={`edit-expense-btn-${exp.id}`}
                            onClick={() => onEditExpense(exp)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition border border-amber-200/70"
                            title="تعديل بيانات سند الصرف أو المبلغ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          {confirmDeleteId === exp.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                data-testid={`confirm-delete-expense-btn-${exp.id}`}
                                onClick={() => handleDelete(exp)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition"
                              >
                                تأكيد الحذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-testid={`delete-expense-btn-${exp.id}`}
                              onClick={() => setConfirmDeleteId(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف المصروف"
                              aria-label="حذف المصروف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">قراءة فقط</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recurring Expenses Management Modal */}
      <RecurringExpensesModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        targetMonth={effectiveMonth}
      />

    </div>
  );
};
