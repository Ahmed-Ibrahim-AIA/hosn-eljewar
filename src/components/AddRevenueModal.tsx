import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Revenue, RevenueCategory, PaymentMethod } from '../types';
import { REVENUE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '../utils/finance';
import { X, Receipt, CheckCircle, Mail, Edit3, Trash2 } from 'lucide-react';

interface AddRevenueModalProps {
  initialUnitId?: string;
  editingRevenue?: Revenue | null;
  onClose: () => void;
  onSuccess: (newRevenue: Revenue) => void;
}

export const AddRevenueModal: React.FC<AddRevenueModalProps> = ({
  initialUnitId,
  editingRevenue = null,
  onClose,
  onSuccess,
}) => {
  const {
    apartments,
    addRevenue,
    updateRevenue,
    deleteRevenue,
    updateApartment,
    settings,
    selectedMonth,
  } = useBuilding();

  const isEditing = Boolean(editingRevenue);

  const [unitId, setUnitId] = useState(
    editingRevenue?.unitId || initialUnitId || (apartments[0]?.id ?? '')
  );
  const selectedUnit = apartments.find(a => a.id === unitId) || apartments[0];

  const [amount, setAmount] = useState<number>(
    editingRevenue
      ? editingRevenue.amount
      : selectedUnit?.monthlyFee || settings.defaultMonthlyFee
  );
  const [date, setDate] = useState<string>(
    editingRevenue?.date || new Date().toISOString().split('T')[0]
  );
  const [monthTarget, setMonthTarget] = useState<string>(
    editingRevenue?.monthTarget || selectedMonth || '2026-10'
  );
  const [category, setCategory] = useState<RevenueCategory>(
    editingRevenue?.category || 'monthly_subscription'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingRevenue?.paymentMethod || 'cash'
  );
  const [transactionRef, setTransactionRef] = useState<string>(
    editingRevenue?.transactionRef || ''
  );
  const [collectorName, setCollectorName] = useState<string>(
    editingRevenue?.collectorName || settings.treasurerName || 'أمين الصندوق'
  );
  const [notes, setNotes] = useState<string>(editingRevenue?.notes || '');
  const [sendEmailReceipt, setSendEmailReceipt] = useState<boolean>(
    editingRevenue
      ? Boolean(editingRevenue.recipientEmail)
      : Boolean(selectedUnit?.email)
  );
  const [recipientEmail, setRecipientEmail] = useState<string>(
    editingRevenue?.recipientEmail || selectedUnit?.email || ''
  );
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const handleUnitChange = (id: string) => {
    setUnitId(id);
    const u = apartments.find(a => a.id === id);
    if (u) {
      if (!isEditing) {
        setAmount(u.monthlyFee || settings.defaultMonthlyFee);
      }
      setRecipientEmail(u.email || '');
      setSendEmailReceipt(Boolean(u.email));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    const cleanEmail = recipientEmail.trim();

    if (sendEmailReceipt && cleanEmail && selectedUnit.email !== cleanEmail) {
      updateApartment(selectedUnit.id, { email: cleanEmail });
    }

    if (isEditing && editingRevenue) {
      const updatedFields: Partial<Revenue> = {
        unitId: selectedUnit.id,
        unitNumber: selectedUnit.number,
        residentName: selectedUnit.residentName,
        amount: Number(amount),
        date,
        monthTarget,
        category,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        collectorName: collectorName.trim() || settings.treasurerName,
        notes: notes.trim() || undefined,
        recipientEmail: sendEmailReceipt && cleanEmail ? cleanEmail : undefined,
        emailSentAt:
          sendEmailReceipt && cleanEmail
            ? editingRevenue.emailSentAt || new Date().toISOString()
            : undefined,
      };
      updateRevenue(editingRevenue.id, updatedFields);
      onSuccess({
        ...editingRevenue,
        ...updatedFields,
      });
      return;
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRev = addRevenue({
      receiptNumber,
      unitId: selectedUnit.id,
      unitNumber: selectedUnit.number,
      residentName: selectedUnit.residentName,
      amount: Number(amount),
      date,
      monthTarget,
      category,
      paymentMethod,
      transactionRef: transactionRef.trim() || undefined,
      collectorName: collectorName.trim() || settings.treasurerName,
      notes: notes.trim() || undefined,
      recipientEmail: sendEmailReceipt && cleanEmail ? cleanEmail : undefined,
      emailSentAt: sendEmailReceipt && cleanEmail ? new Date().toISOString() : undefined,
    });

    onSuccess(newRev);
  };

  const handleDeleteCurrentRevenue = () => {
    if (!editingRevenue) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteRevenue(editingRevenue.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'تعديل دفعة وسند قبض' : 'تحصيل نقدية وإصدار سند قبض'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-amber-400" />
            ) : (
              <Receipt className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <h3 className="font-bold text-lg">
                {isEditing
                  ? `تعديل دفعة / سند قبض (${editingRevenue?.receiptNumber})`
                  : 'تحصيل نقدية وإصدار سند قبض'}
              </h3>
              {isEditing && (
                <p className="text-[11px] text-slate-300">
                  يمكنك تعديل قيمة الدفعة أو الشهر أو طريقة الدفع أو إلغاء الدفعة بالكامل
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اختر الشقة والساكن <span className="text-rose-500">*</span>
            </label>
            <select
              value={unitId}
              onChange={e => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium text-sm transition"
              required
            >
              {apartments.map(apt => (
                <option key={apt.id} value={apt.id}>
                  شقة {apt.number} (الدور {apt.floor}) - {apt.residentName} ({apt.residentType === 'owner' ? 'مالك' : 'مستأجر'})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المحصل ({settings.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                data-testid="revenue-modal-amount-input"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عن شهر استحقاق <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={monthTarget}
                onChange={e => setMonthTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                بند التحصيل <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as RevenueCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              >
                {Object.entries(REVENUE_CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة الدفع <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([methodKey, label]) => (
                  <option key={methodKey} value={methodKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Transaction Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الاستلام <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم العملية / الحوالة (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: IP-98234"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Collector Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المستلم / المحصل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={collectorName}
              onChange={e => setCollectorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              required
            />
          </div>

          {/* Optional Email Receipt Dispatch Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950 select-none">
              <input
                type="checkbox"
                checked={sendEmailReceipt}
                onChange={e => setSendEmailReceipt(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>إرسال نسخة من إيصال الدفع عبر البريد الإلكتروني للساكن (اختياري)</span>
            </label>

            {sendEmailReceipt && (
              <div className="pt-1">
                <input
                  type="email"
                  dir="ltr"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 text-xs font-mono text-left"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات أو تفاصيل إضافية
            </label>
            <textarea
              rows={2}
              data-testid="revenue-modal-notes-input"
              placeholder="أي ملاحظات حول السداد أو الرصيد..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
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
                      data-testid="revenue-modal-confirm-delete-btn"
                      onClick={handleDeleteCurrentRevenue}
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer"
                    >
                      تأكيد حذف وإلغاء الدفعة نهائياً
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
                    data-testid="revenue-modal-delete-btn"
                    onClick={handleDeleteCurrentRevenue}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف / إلغاء الدفعة</span>
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
                data-testid="revenue-modal-submit-btn"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'حفظ تعديلات الدفعة' : 'حفظ وإصدار سند القبض'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

