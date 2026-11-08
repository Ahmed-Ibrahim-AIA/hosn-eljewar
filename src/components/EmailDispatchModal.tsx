import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Receipt,
  User,
  Building2,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Apartment, Revenue } from '../types';
import { useBuilding } from '../context/BuildingContext';
import {
  generateReceiptEmailPayload,
  generateFinancialReportEmailPayload,
  calculateTotals,
  groupExpensesByCategory,
  filterByMonth,
  formatMonthYearArabic,
  formatMoney,
} from '../utils/finance';

export interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'receipt' | 'report';
  revenue?: Revenue | null;
  initialApartment?: Apartment | null;
  targetMonth?: string;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  isOpen,
  onClose,
  mode,
  revenue,
  initialApartment,
  targetMonth,
}) => {
  const {
    settings,
    apartments,
    revenues,
    expenses,
    markReceiptEmailSent,
    updateApartment,
    selectedMonth,
    isReadOnly,
  } = useBuilding();

  const activeMonth = targetMonth || revenue?.monthTarget || selectedMonth || '2026-10';
  const monthLabel = formatMonthYearArabic(activeMonth);

  const [selectedRecipientScope, setSelectedRecipientScope] = useState<string>('single');
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [saveEmailToTenantProfile, setSaveEmailToTenantProfile] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [dispatchedState, setDispatchedState] = useState<{
    sent: boolean;
    timestamp: string;
    recipients: string;
  } | null>(null);

  // Determine the linked apartment
  const linkedApartment = useMemo(() => {
    if (mode === 'receipt' && revenue) {
      return apartments.find(a => a.id === revenue.unitId) || null;
    }
    if (selectedApartmentId) {
      return apartments.find(a => a.id === selectedApartmentId) || null;
    }
    return initialApartment || null;
  }, [mode, revenue, selectedApartmentId, initialApartment, apartments]);

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDispatchedState(null);
    setCopied(false);

    if (mode === 'receipt' && revenue) {
      const apt = apartments.find(a => a.id === revenue.unitId) || null;
      setSelectedRecipientScope('single');
      setSelectedApartmentId(apt?.id || '');
      const defaultEmail = revenue.recipientEmail || apt?.email || '';
      setRecipientEmail(defaultEmail);
    } else {
      if (initialApartment) {
        setSelectedRecipientScope('single');
        setSelectedApartmentId(initialApartment.id);
        setRecipientEmail(initialApartment.email || '');
      } else {
        // Default to first tenant with email or 'all_tenants'
        const firstTenant = apartments.find(a => a.residentType === 'tenant') || apartments[0];
        setSelectedRecipientScope('all_tenants');
        setSelectedApartmentId(firstTenant?.id || '');
        const allTenantEmails = apartments
          .filter(a => a.residentType === 'tenant' && a.email)
          .map(a => a.email!.trim())
          .filter(Boolean)
          .join(', ');
        setRecipientEmail(allTenantEmails);
      }
    }
  }, [isOpen, mode, revenue, initialApartment, apartments]);

  // Recompute email payload whenever selection changes
  const generatedPayload = useMemo(() => {
    if (mode === 'receipt' && revenue) {
      return generateReceiptEmailPayload({
        revenue,
        apartment: linkedApartment,
        settings,
        recipientEmail,
      });
    }

    // Report mode
    const monthRevs = filterByMonth(revenues, activeMonth);
    const monthExps = filterByMonth(expenses, activeMonth);
    const monthTotals = calculateTotals(monthRevs, monthExps, 0);
    const allTimeTotals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);
    const catGroups = groupExpensesByCategory(monthExps);

    if (selectedRecipientScope === 'single' && linkedApartment) {
      const unitPaidThisMonth = monthRevs
        .filter(r => r.unitId === linkedApartment.id)
        .reduce((s, r) => s + r.amount, 0);
      const unitRemainingAmount = Math.max(0, linkedApartment.monthlyFee - unitPaidThisMonth);

      return generateFinancialReportEmailPayload({
        settings,
        monthLabel,
        totalRevenues: monthTotals.totalRevenues,
        totalExpenses: monthTotals.totalExpenses,
        netFlow: monthTotals.netFlow,
        treasuryBalance: allTimeTotals.currentBalance,
        recipientEmail,
        recipientName: linkedApartment.residentName,
        unitNumber: linkedApartment.number,
        unitMonthlyFee: linkedApartment.monthlyFee,
        unitPaidThisMonth,
        unitRemainingAmount,
        keyExpenses: catGroups.map(c => ({ label: c.label, total: c.total })),
      });
    }

    return generateFinancialReportEmailPayload({
      settings,
      monthLabel,
      totalRevenues: monthTotals.totalRevenues,
      totalExpenses: monthTotals.totalExpenses,
      netFlow: monthTotals.netFlow,
      treasuryBalance: allTimeTotals.currentBalance,
      recipientEmail,
      keyExpenses: catGroups.map(c => ({ label: c.label, total: c.total })),
    });
  }, [
    mode,
    revenue,
    linkedApartment,
    settings,
    recipientEmail,
    revenues,
    expenses,
    activeMonth,
    monthLabel,
    selectedRecipientScope,
  ]);

  useEffect(() => {
    setCustomSubject(generatedPayload.subject);
    setCustomBody(generatedPayload.body);
  }, [generatedPayload.subject, generatedPayload.body]);

  if (!isOpen) return null;

  const handleScopeChange = (scope: string) => {
    setSelectedRecipientScope(scope);
    setDispatchedState(null);
    if (scope === 'all_tenants') {
      const emails = apartments
        .filter(a => a.residentType === 'tenant' && a.email)
        .map(a => a.email!.trim())
        .filter(Boolean)
        .join(', ');
      setRecipientEmail(emails);
    } else if (scope === 'all_residents') {
      const emails = apartments
        .filter(a => a.email)
        .map(a => a.email!.trim())
        .filter(Boolean)
        .join(', ');
      setRecipientEmail(emails);
    } else if (scope === 'single') {
      const apt = apartments.find(a => a.id === selectedApartmentId) || apartments[0];
      if (apt) {
        setSelectedApartmentId(apt.id);
        setRecipientEmail(apt.email || '');
      }
    }
  };

  const handleApartmentSelect = (aptId: string) => {
    setSelectedApartmentId(aptId);
    setDispatchedState(null);
    const apt = apartments.find(a => a.id === aptId);
    if (apt) {
      setRecipientEmail(apt.email || '');
    }
  };

  const handleSendInApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = recipientEmail.trim();
    if (!cleanEmail) return;

    // Save email to apartment if requested and in single scope
    if (!isReadOnly && saveEmailToTenantProfile && linkedApartment && selectedRecipientScope === 'single') {
      if (linkedApartment.email !== cleanEmail) {
        updateApartment(linkedApartment.id, { email: cleanEmail });
      }
    }

    if (mode === 'receipt' && revenue) {
      markReceiptEmailSent(revenue.id, cleanEmail);
    }

    const nowFormatted = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setDispatchedState({
      sent: true,
      timestamp: `اليوم الساعة ${nowFormatted}`,
      recipients: cleanEmail,
    });
  };

  const handleCopyContent = () => {
    const fullText = `إلى: ${recipientEmail}\nالموضوع: ${customSubject}\n\n${customBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoHref = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
    customSubject
  )}&body=${encodeURIComponent(customBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/25 p-2.5 rounded-xl border border-indigo-400/30">
              <Mail className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {mode === 'receipt'
                  ? 'إرسال إيصال الدفع عبر البريد الإلكتروني'
                  : 'إرسال التقرير المالي عبر البريد الإلكتروني'}
                <span className="text-[11px] bg-indigo-500/30 text-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-medium">
                  ميزة اختيارية
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                {mode === 'receipt' && revenue
                  ? `سند قبض رقم ${revenue.receiptNumber} — شقة ${revenue.unitNumber} (${revenue.residentName})`
                  : `مشاركة التقرير المالي وكشف الحساب لشهر ${monthLabel} مع المستأجرين`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendInApp} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Dispatched Confirmation Banner */}
          {dispatchedState?.sent && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-600 text-white p-2 rounded-xl shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">
                    {mode === 'receipt'
                      ? 'تم تسجيل وإرسال نسخة إيصال السداد للبريد الإلكتروني بنجاح!'
                      : 'تم تجهيز وإرسال التقرير المالي إلى البريد الإلكتروني بنجاح!'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    المرسل إليه: <span className="font-mono font-bold" dir="ltr">{dispatchedState.recipients}</span> • {dispatchedState.timestamp}
                  </p>
                </div>
              </div>
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح برنامج البريد</span>
              </a>
            </div>
          )}

          {/* Mode Summary Pill */}
          {mode === 'receipt' && revenue ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    إيصال سداد رقم <span className="font-mono">{revenue.receiptNumber}</span> — شقة ({revenue.unitNumber})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    الساكن: {revenue.residentName} • تاريخ السداد: {revenue.date}
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-left">
                <span className="text-[10px] text-emerald-700 block font-bold">المبلغ المسدد</span>
                <span className="text-sm font-black text-emerald-800">
                  {formatMoney(revenue.amount, settings.currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>نطاق إرسال التقرير المالي:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleScopeChange('all_tenants')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedRecipientScope === 'all_tenants'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    جميع المستأجرين ({apartments.filter(a => a.residentType === 'tenant' && a.email).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeChange('all_residents')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedRecipientScope === 'all_residents'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    كل سكان العمارة ({apartments.filter(a => a.email).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeChange('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedRecipientScope === 'single'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    كشف حساب شقة محددة
                  </button>
                </div>
              </div>

              {selectedRecipientScope === 'single' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اختر الشقة / المستأجر لإرسال كشف الحساب المخصص:
                  </label>
                  <select
                    value={selectedApartmentId}
                    onChange={e => handleApartmentSelect(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
                  >
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>
                        شقة {apt.number} — {apt.residentName} ({apt.residentType === 'tenant' ? 'مستأجر' : 'مالك'})
                        {apt.email ? ` — ${apt.email}` : ' (بدون بريد مسجل)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Recipient Email Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-slate-700">
                البريد الإلكتروني للمستلم (المستأجر / الساكن) <span className="text-rose-500">*</span>
              </label>
              {linkedApartment?.email && selectedRecipientScope === 'single' && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                  مسجل في ملف الشقة ({linkedApartment.number})
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                dir="ltr"
                value={recipientEmail}
                onChange={e => {
                  setRecipientEmail(e.target.value);
                  setDispatchedState(null);
                }}
                placeholder="tenant@example.com"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-left font-mono text-sm"
              />
            </div>
            {!isReadOnly && selectedRecipientScope === 'single' && linkedApartment && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveEmailToTenantProfile}
                  onChange={e => setSaveEmailToTenantProfile(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-600">
                  تحديث وحفظ هذا البريد الإلكتروني في ملف تعريف شقة ({linkedApartment.number})
                </span>
              </label>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان الرسالة (Subject)
            </label>
            <input
              type="text"
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-800 bg-slate-50/60"
            />
          </div>

          {/* Body Preview / Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>محتوى الرسالة وتفاصيل الإيصال / التقرير المالي</span>
              </label>
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم نسخ النص!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص بالكامل</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={8}
              value={customBody}
              onChange={e => setCustomBody(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs leading-relaxed text-slate-700 bg-slate-50/70 font-sans"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح في تطبيق البريد (Mail / Outlook)</span>
            </a>

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
              <button
                type="submit"
                disabled={!recipientEmail.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
                <span>
                  {mode === 'receipt'
                    ? 'إرسال الإيصال عبر البريد الإلكتروني'
                    : 'إرسال التقرير المالي الآن'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
