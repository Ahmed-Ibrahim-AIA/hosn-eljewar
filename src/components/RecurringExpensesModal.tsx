import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { RecurringExpense, ExpenseCategory, PaymentMethod } from '../types';
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  formatMoney,
} from '../utils/finance';
import {
  Repeat,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Zap,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Edit2,
} from 'lucide-react';

interface RecurringExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: string;
}

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
  isOpen,
  onClose,
  targetMonth,
}) => {
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpenseActive,
    generateMonthlyRecurringExpenses,
    settings,
  } = useBuilding();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // New / Edit Recurring Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'guard_salary' as ExpenseCategory,
    amount: '',
    paidTo: '',
    billingDay: 1,
    paymentMethod: 'cash' as PaymentMethod,
    notes: '',
  });

  if (!isOpen) return null;

  const startEditRecurring = (rec: RecurringExpense) => {
    setEditingRecId(rec.id);
    setFormData({
      title: rec.title,
      category: rec.category,
      amount: String(rec.amount),
      paidTo: rec.paidTo,
      billingDay: rec.billingDay || 1,
      paymentMethod: rec.paymentMethod,
      notes: rec.notes || '',
    });
    setIsAddingNew(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'guard_salary',
      amount: '',
      paidTo: '',
      billingDay: 1,
      paymentMethod: 'cash',
      notes: '',
    });
    setEditingRecId(null);
    setIsAddingNew(false);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.paidTo) return;

    if (editingRecId) {
      updateRecurringExpense(editingRecId, {
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paidTo: formData.paidTo,
        billingDay: Number(formData.billingDay) || 1,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });
    } else {
      addRecurringExpense({
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        paidTo: formData.paidTo,
        billingDay: Number(formData.billingDay) || 1,
        paymentMethod: formData.paymentMethod,
        isActive: true,
        notes: formData.notes,
      });
    }

    resetForm();
  };

  const handleGenerateNow = () => {
    const res = generateMonthlyRecurringExpenses(targetMonth);
    if (res.generatedCount > 0) {
      setGenerationFeedback(`تمت إضافة ${res.generatedCount} مصروفات متكررة لشهر ${targetMonth} بنجاح!`);
    } else {
      setGenerationFeedback(`جميع المصروفات المتكررة مضافة مسبقاً لشهر ${targetMonth} (${res.skippedCount} بند مكرر تم تجاوزه).`);
    }
    setTimeout(() => {
      setGenerationFeedback(null);
    }, 4000);
  };

  const totalMonthlyCommitment = recurringExpenses
    .filter(r => r.isActive)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                إدارة المصروفات الشهرية المتكررة (التلقائية)
              </h3>
              <p className="text-xs text-slate-500">
                تعريف الرواتب الثابتة، فواتير الكهرباء، وعقود الصيانة الدورية التي تتكرر كل شهر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Summary Banner & Auto-Generate Trigger */}
          <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-emerald-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">إجمالي الالتزامات الشهرية الثابتة:</div>
              <div className="text-xl font-black text-rose-700 mt-0.5">
                {formatMoney(totalMonthlyCommitment, settings.currency)} / شهرياً
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {recurringExpenses.filter(r => r.isActive).length} بنود نشطة مجدولة شهرياً
              </div>
            </div>

            <button
              onClick={handleGenerateNow}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>تطبيق تلقائي لشهر {targetMonth}</span>
            </button>
          </div>

          {/* Feedback Message */}
          {generationFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{generationFeedback}</span>
            </div>
          )}

          {/* Add New Template Toggle Button */}
          {!isAddingNew ? (
            <button
              onClick={() => {
                resetForm();
                setIsAddingNew(true);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة مصروف متكرر جديد (راتب، فاتورة، صيانة...)</span>
            </button>
          ) : (
            /* Add / Edit Recurring Expense Form */
            <form onSubmit={handleAddNew} className="bg-slate-50 rounded-2xl p-4 border border-rose-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>{editingRecId ? 'تعديل بيانات المصروف المتكرر' : 'بيانات المصروف المتكرر الجديد'}</span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    بيان المصروف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: راتب الحارس، صيانة المصعد الدورية"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    التصنيف / البند <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  >
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([cat, label]) => (
                      <option key={cat} value={cat}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    المبلغ الشهري ({settings.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="1500"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    المدفوع له (المستفيد) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: الحارس عم رجب، شركة الأطلس"
                    value={formData.paidTo}
                    onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    يوم الاستحقاق الشهري (1 - 28)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.billingDay}
                    onChange={e => setFormData({ ...formData, billingDay: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    طريقة الدفع المعتادة
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                      <option key={method} value={method}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول طريقة التسليم أو رقم العداد"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {editingRecId ? 'حفظ التعديلات' : 'حفظ المصروف المتكرر'}
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Expenses */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-700 flex items-center justify-between">
              <span>قائمة المصروفات المتكررة المسجلة ({recurringExpenses.length}):</span>
              <span className="text-[11px] text-slate-400">انقر على المفتاح لتفعيل أو إيقاف التوليد التلقائي</span>
            </h4>

            {recurringExpenses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                لا توجد قوالب مصروفات متكررة بعد. يمكنك إضافة راتب الحارس أو فاتورة كهرباء السلم.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recurringExpenses.map(rec => (
                  <div
                    key={rec.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      rec.isActive
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRecurringExpenseActive(rec.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                          rec.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                        title={rec.isActive ? 'مفعل للتوليد التلقائي' : 'معطل مؤقتاً'}
                      >
                        {rec.isActive ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span>{rec.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {EXPENSE_CATEGORY_LABELS[rec.category] || rec.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="whitespace-nowrap">المدفوع له: {rec.paidTo}</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">يوم الاستحقاق: {rec.billingDay} من كل شهر</span>
                          {rec.lastGeneratedMonth && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold whitespace-nowrap">
                                آخر توليد: <span dir="ltr">{rec.lastGeneratedMonth}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right ml-1">
                        <div className="font-black text-xs text-rose-600">
                          {formatMoney(rec.amount, settings.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {PAYMENT_METHOD_LABELS[rec.paymentMethod] || rec.paymentMethod}
                        </div>
                      </div>

                      <button
                        type="button"
                        data-testid={`edit-recurring-btn-${rec.id}`}
                        onClick={() => startEditRecurring(rec)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="تعديل المصروف المتكرر"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === rec.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteRecurringExpense(rec.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg transition"
                          >
                            تأكيد
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف القالب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            تطبيق المصروفات يضيف سندات صرف رسمية ويمنع التكرار لنفس الشهر تلقائياً.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
