import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '../utils/finance';
import { X, CreditCard, CheckCircle, Sparkles, Edit3, Trash2 } from 'lucide-react';

interface AddExpenseModalProps {
  editingExpense?: Expense | null;
  onClose: () => void;
  onSuccess: (newExpense: Expense) => void;
}

const COMMON_PRESETS = [
  { title: 'راتب الحارس الشهري', category: 'guard_salary', defaultAmount: 1500 },
  { title: 'صيانة دورية للمصعد وتزييت', category: 'elevator', defaultAmount: 450 },
  { title: 'فاتورة كهرباء السلم والمصعد', category: 'electricity', defaultAmount: 450 },
  { title: 'غسيل ونظافة السلالم أسبوعياً', category: 'cleaner_salary', defaultAmount: 300 },
  { title: 'شراء أدوات نظافة ومطهرات للمدخل', category: 'cleaning_supplies', defaultAmount: 150 },
  { title: 'تغيير لمبات إنارة وصيانة كهرباء', category: 'general_maintenance', defaultAmount: 200 },
  { title: 'صيانة طارئة لموتور المياه أو الخزان', category: 'emergency', defaultAmount: 350 },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  editingExpense = null,
  onClose,
  onSuccess,
}) => {
  const { addExpense, updateExpense, deleteExpense, settings } = useBuilding();

  const isEditing = Boolean(editingExpense);

  const [title, setTitle] = useState<string>(editingExpense?.title || '');
  const [category, setCategory] = useState<ExpenseCategory>(
    editingExpense?.category || 'elevator'
  );
  const [amount, setAmount] = useState<number | ''>(
    editingExpense ? editingExpense.amount : ''
  );
  const [date, setDate] = useState<string>(
    editingExpense?.date || new Date().toISOString().split('T')[0]
  );
  const [paidTo, setPaidTo] = useState<string>(editingExpense?.paidTo || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    editingExpense?.invoiceNumber || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingExpense?.paymentMethod || 'cash'
  );
  const [notes, setNotes] = useState<string>(editingExpense?.notes || '');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category as ExpenseCategory);
    setAmount(preset.defaultAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0 || !paidTo.trim()) return;

    if (isEditing && editingExpense) {
      const updatedFields: Partial<Expense> = {
        category,
        title: title.trim(),
        amount: Number(amount),
        date,
        paidTo: paidTo.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      };
      updateExpense(editingExpense.id, updatedFields);
      onSuccess({
        ...editingExpense,
        ...updatedFields,
      });
      return;
    }

    const voucherNumber = `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newExp = addExpense({
      voucherNumber,
      category,
      title: title.trim(),
      amount: Number(amount),
      date,
      paidTo: paidTo.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onSuccess(newExp);
  };

  const handleDeleteCurrentExpense = () => {
    if (!editingExpense) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteExpense(editingExpense.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'تعديل مصروف وسند صرف' : 'تسجيل مصروف جديد (سند صرف)'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-amber-400" />
            ) : (
              <CreditCard className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <h3 className="font-bold text-lg">
                {isEditing
                  ? `تعديل مصروف / سند صرف (${editingExpense?.voucherNumber})`
                  : 'تسجيل مصروف جديد (سند صرف)'}
              </h3>
              {isEditing && (
                <p className="text-[11px] text-slate-300">
                  يمكنك تعديل البيان أو القيمة أو المستفيد أو حذف سند الصرف
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Quick presets badges */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>بنود سريعة شائعة:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium border border-slate-200"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              بيان وتفاصيل المصروف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              data-testid="expense-modal-title-input"
              placeholder="مثال: فاتورة كهرباء السلم والمصعد عن شهر أكتوبر"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              required
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                بند / تصنيف المصروف <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المدفوع ({settings.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                data-testid="expense-modal-amount-input"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 font-bold text-rose-700 text-base"
                required
              />
            </div>
          </div>

          {/* Paid To & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المدفوع له (الجهة / الفني / الحارس) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: شركة المصاعد / فني الكهرباء"
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الصرف <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Payment Method & Invoice Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة الدفع <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([methodKey, label]) => (
                  <option key={methodKey} value={methodKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الفاتورة أو الإيصال
              </label>
              <input
                type="text"
                placeholder="مثال: INV-1092"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل تخص أعمال الصيانة أو حالة الضمان..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                {confirmDelete ? (
                  <>
                    <button
                      type="button"
                      data-testid="expense-modal-confirm-delete-btn"
                      onClick={handleDeleteCurrentExpense}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer"
                    >
                      تأكيد حذف سند الصرف
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      تراجع
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    data-testid="expense-modal-delete-btn"
                    onClick={handleDeleteCurrentExpense}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف المصروف</span>
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                data-testid="expense-modal-submit-btn"
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'حفظ تعديلات سند الصرف' : 'تسجيل سند الصرف'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

