import React, { useState } from 'react';
import { Apartment } from '../types';
import { useBuilding } from '../context/BuildingContext';
import {
  generateTenantReminderText,
  formatMoney,
  ReminderTone,
} from '../utils/finance';
import {
  X,
  BellRing,
  MessageCircle,
  Copy,
  Check,
  Phone,
  AlertTriangle,
  Calendar,
  Sparkles,
  Send,
  Clock,
} from 'lucide-react';

interface TenantReminderModalProps {
  apartment: Apartment;
  overdueAmount: number;
  monthTarget?: string;
  onClose: () => void;
  onReminderSent?: (apartmentId: string) => void;
}

export const TenantReminderModal: React.FC<TenantReminderModalProps> = ({
  apartment,
  overdueAmount,
  monthTarget = 'أكتوبر 2026',
  onClose,
  onReminderSent,
}) => {
  const { settings, updateApartment } = useBuilding();

  const [tone, setTone] = useState<ReminderTone>('gentle');
  const [copied, setCopied] = useState(false);
  const [sentMarked, setSentMarked] = useState(false);

  // Generate initial reminder text based on tone
  const initialText = generateTenantReminderText({
    residentName: apartment.residentName,
    unitNumber: apartment.number,
    overdueAmount,
    currency: settings.currency,
    buildingName: settings.buildingName,
    treasurerName: settings.treasurerName,
    monthTarget,
    paymentDetails: settings.bankAccountDetails,
    tone,
  });

  const [customMessage, setCustomMessage] = useState(initialText);

  // Re-generate message when tone changes if user hasn't heavily customized
  const handleToneChange = (newTone: ReminderTone) => {
    setTone(newTone);
    const newText = generateTenantReminderText({
      residentName: apartment.residentName,
      unitNumber: apartment.number,
      overdueAmount,
      currency: settings.currency,
      buildingName: settings.buildingName,
      treasurerName: settings.treasurerName,
      monthTarget,
      paymentDetails: settings.bankAccountDetails,
      tone: newTone,
    });
    setCustomMessage(newText);
  };

  // Clean phone number for WhatsApp
  const cleanPhone = apartment.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    markReminderAsSent();
    setTimeout(() => setCopied(false), 2500);
  };

  const markReminderAsSent = () => {
    const today = new Date().toISOString().split('T')[0];
    updateApartment(apartment.id, { lastReminderDate: today });
    setSentMarked(true);
    if (onReminderSent) {
      onReminderSent(apartment.id);
    }
  };

  const handleSendWhatsApp = () => {
    markReminderAsSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">إرسال إشعار تذكير للمستأجر بالسداد</h3>
              <p className="text-[11px] text-slate-400">تنبيه ذكي وموجه عبر واتساب أو الرسائل النصية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Target Tenant Profile Summary Card */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-900">
                  شقة ({apartment.number}) - {apartment.residentName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  مستأجر
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-3">
                <span>الدور: {apartment.floor}</span>
                <span>•</span>
                <span dir="ltr" className="font-semibold text-slate-800">{apartment.phone || 'بدون هاتف'}</span>
                {apartment.lastReminderDate && (
                  <>
                    <span>•</span>
                    <span className="text-amber-800 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      آخر تذكير: {apartment.lastReminderDate}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right sm:text-left bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block">المبلغ المتأخر</span>
              <span className="font-bold text-sm text-rose-600">
                {formatMoney(overdueAmount, settings.currency)}
              </span>
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              اختر صيغة ونبرة الإشعار:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleToneChange('gentle')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  tone === 'gentle'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">تذكير ودي لطيف</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange('official')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  tone === 'official'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs">مطالبة رسمية</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange('urgent')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  tone === 'urgent'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-xs">إشعار عاجل</span>
              </button>
            </div>
          </div>

          {/* Message Textarea (Editable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">
                نص الرسالة (يمكنك تعديل أي تفاصيل قبل الإرسال):
              </label>
              <span className="text-[10px] text-slate-400">منسق للواتساب والرسائل</span>
            </div>
            <textarea
              rows={7}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 text-xs leading-relaxed font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Sent Status Badge */}
          {sentMarked && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم تسجيل تاريخ إرسال هذا التذكير في سجل الشقة بنجاح.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition border border-slate-200 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              {apartment.phone && (
                <a
                  href={`tel:${apartment.phone}`}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition border border-slate-200 text-xs"
                  title="اتصال هاتفي"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition text-xs"
              >
                إغلاق
              </button>

              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(customMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال التذكير عبر واتساب الآن</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
