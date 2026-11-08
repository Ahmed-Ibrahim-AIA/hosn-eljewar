import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  buildBulkOverdueWhatsAppQueue,
  formatMoney,
  ReminderTone,
  INSTAPAY_PAYMENT_URL,
  INSTAPAY_RECIPIENT_NAME,
} from '../utils/finance';
import {
  X,
  MessageCircle,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Users,
  Phone,
  Sparkles,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

interface BulkOverdueWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkOverdueWhatsAppModal: React.FC<BulkOverdueWhatsAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { apartments, revenues, settings, selectedMonth, updateApartment } = useBuilding();

  const [tone, setTone] = useState<ReminderTone>('gentle');
  const [sentUnitIds, setSentUnitIds] = useState<string[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [copiedGroupMsg, setCopiedGroupMsg] = useState(false);
  const [copiedSingleId, setCopiedSingleId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const bulkPayload = useMemo(() => {
    return buildBulkOverdueWhatsAppQueue({
      apartments,
      revenues,
      settings,
      targetMonth: selectedMonth,
      tone,
    });
  }, [apartments, revenues, settings, selectedMonth, tone]);

  if (!isOpen) return null;

  const recipients = bulkPayload.recipients;
  const safeQueueIndex = Math.min(currentQueueIndex, Math.max(0, recipients.length - 1));
  const currentRecipient = recipients[safeQueueIndex] || null;

  const markUnitSent = (unitId: string, residentName: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateApartment(unitId, { lastReminderDate: today });
    setSentUnitIds(prev => (prev.includes(unitId) ? prev : [...prev, unitId]));
    setStatusBanner(`تم فتح واتساب وإعداد رسالة التذكير للأستاذ / ${residentName}`);
  };

  const handleMarkAllRemindedAndCopyGroup = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bulkPayload.unifiedGroupOverdueMessage);
      }
    } catch {
      // ignore clipboard errors
    }
    const today = new Date().toISOString().split('T')[0];
    recipients.forEach(r => {
      updateApartment(r.unitId, { lastReminderDate: today });
    });
    setSentUnitIds(recipients.map(r => r.unitId));
    setCopiedGroupMsg(true);
    setStatusBanner(
      `تم نسخ رسالة المتأخرين الموحدة وتحديث سجل التذكير لجميع المتأخرين (${recipients.length} سكان) بضغطة واحدة!`
    );
    setTimeout(() => setCopiedGroupMsg(false), 3500);
  };

  const handleSequentialNextClick = () => {
    if (!currentRecipient) return;
    markUnitSent(currentRecipient.unitId, currentRecipient.residentName);
    if (safeQueueIndex < recipients.length - 1) {
      setCurrentQueueIndex(safeQueueIndex + 1);
    }
  };

  const handleCopySingleMessage = async (unitId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    setCopiedSingleId(unitId);
    setTimeout(() => setCopiedSingleId(null), 2500);
  };

  return (
    <div
      data-testid="bulk-overdue-whatsapp-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border-2 border-emerald-500/40 my-6">
        {/* Top Header */}
        <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white">
                  إرسال رسالة واتساب لكل المتأخرين بضغطة زر واحدة
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black">
                  {bulkPayload.totalOverdueRecipientsCount} متأخرين ({formatMoney(bulkPayload.totalOverdueAmountAll, bulkPayload.currency)})
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                شهر {bulkPayload.monthLabelArabic} ({bulkPayload.targetMonth}) • شاملة المتأخرات وعنوان الدفع انستا باي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {statusBanner && (
            <div
              data-testid="bulk-whatsapp-status-banner"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-[11px] text-emerald-700 underline"
              >
                إخفاء
              </button>
            </div>
          )}

          {recipients.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-black text-base text-emerald-950">
                جميع السكان مسددون بالكامل لشهر {bulkPayload.monthLabelArabic}!
              </h4>
              <p className="text-xs text-emerald-800">
                لا يوجد أي متأخرين عن الدفع في هذا الشهر أو الشهور السابقة.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Primary 1-Click Unified Group Send & Copy Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <h4 className="font-black text-sm text-white">
                      أولاً: إرسال رسالة موحدة لكل المتأخرين معاً بضغطة واحدة (لجروب الواتساب)
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-200 font-bold">
                    تشمل أسماء الـ {recipients.length} متأخرين + رابط InstaPay
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={bulkPayload.generalWhatsAppShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="one-click-send-all-overdue-wa-link"
                    onClick={handleMarkAllRemindedAndCopyGroup}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition text-center"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>إرسال رسالة المتأخرين الجماعية عبر واتساب الآن</span>
                  </a>

                  <button
                    type="button"
                    data-testid="one-click-copy-all-overdue-wa-btn"
                    onClick={handleMarkAllRemindedAndCopyGroup}
                    className="py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedGroupMsg ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>تم نسخ الرسالة وتحديث سجل المتأخرين!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-300" />
                        <span>نسخ رسالة كل المتأخرين بضغطة واحدة</span>
                      </>
                    )}
                  </button>
                </div>

                <details className="bg-slate-950/60 rounded-xl border border-white/10 p-3">
                  <summary className="cursor-pointer font-bold text-emerald-300 text-xs select-none">
                    معاينة نص الرسالة الموحدة لكل المتأخرين ({recipients.length} أسماء + رابط انستا باي)
                  </summary>
                  <pre
                    data-testid="unified-overdue-whatsapp-preview"
                    className="mt-2.5 text-[11px] text-emerald-100 font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto"
                  >
                    {bulkPayload.unifiedGroupOverdueMessage}
                  </pre>
                </details>
              </div>

              {/* 2. One-Click Sequential Private Sender (إرسال متتالي سريع لكل ساكن على رقمه الخاص) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-700" />
                      <span>ثانياً: الإرسال المتتالي السريع لكل متأخر على رقمه الخاص بضغطة زر</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اضغط على الزر الأخضر لإرسال التذكير للساكن الحالي عبر واتساب وسينتقل المؤشر تلقائياً للساكن المتأخر التالي دون عناء:
                    </p>
                  </div>

                  {/* Tone Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 shrink-0">
                    {(
                      [
                        { id: 'gentle', label: '🌸 ودي' },
                        { id: 'official', label: '📋 رسمي' },
                        { id: 'urgent', label: '⚠️ عاجل' },
                      ] as const
                    ).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          tone === t.id
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {currentRecipient && (
                  <div className="bg-white rounded-xl p-4 border-2 border-amber-400 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-black text-[11px]">
                          الدور في الإرسال: {safeQueueIndex + 1} من {recipients.length}
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {currentRecipient.residentName}
                        </span>
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          مطلوب: {formatMoney(currentRecipient.totalOverdueAmount, bulkPayload.currency)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 font-mono">
                        <span>📞 الهاتف: {currentRecipient.phone || 'غير مسجل'}</span>
                        <span>•</span>
                        <span>شقة ({currentRecipient.unitNumber})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={currentRecipient.directWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="sequential-next-whatsapp-btn"
                        onClick={handleSequentialNextClick}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          إرسال واتساب لـ ({currentRecipient.residentName.split(' ').slice(0, 2).join(' ')}) والانتقال للتالي
                        </span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </a>

                      {safeQueueIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentQueueIndex(0);
                            setSentUnitIds([]);
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="إعادة المؤشر لأول ساكن متأخر"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>
                    تم الإرسال إلى: <strong className="text-emerald-700">{sentUnitIds.length}</strong> من إجمالي{' '}
                    <strong>{recipients.length}</strong> متأخرين
                  </span>
                  <span className="font-mono text-slate-500">
                    InstaPay: {INSTAPAY_RECIPIENT_NAME}
                  </span>
                </div>
              </div>

              {/* 3. Complete Overdue Recipients Queue Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-600" />
                    <span>قائمة جميع السكان المتأخرين وروابط الواتساب الفردية ({recipients.length}):</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    اضغط «إرسال واتساب» أمام أي ساكن لفتح محادثته فوراً
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {recipients.map((item, idx) => {
                    const isSent = sentUnitIds.includes(item.unitId);
                    const isCurrent = idx === safeQueueIndex;

                    return (
                      <div
                        key={item.unitId}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                          isCurrent
                            ? 'bg-amber-50/70'
                            : isSent
                            ? 'bg-emerald-50/40'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                              isSent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {isSent ? '✓' : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-xs text-slate-900">
                                {item.residentName}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-700">
                                شقة {item.unitNumber}
                              </span>
                              <span className="text-[11px] font-black text-rose-700 font-mono">
                                متأخر: {formatMoney(item.totalOverdueAmount, bulkPayload.currency)}
                              </span>
                              {item.pastMonthsOverdue > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                  منها متأخرات سابقة: {formatMoney(item.pastMonthsOverdue, bulkPayload.currency)}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.phone || 'بدون رقم هاتف'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopySingleMessage(item.unitId, item.personalizedMessage)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="نسخ نص الرسالة الفردية لهذا الساكن"
                          >
                            {copiedSingleId === item.unitId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>

                          <a
                            href={item.directWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`direct-overdue-wa-row-${item.unitNumber}`}
                            onClick={() => {
                              markUnitSent(item.unitId, item.residentName);
                              setCurrentQueueIndex(Math.min(idx + 1, recipients.length - 1));
                            }}
                            className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 transition shadow-2xs ${
                              isSent
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{isSent ? 'إعادة إرسال واتساب ✓' : 'إرسال واتساب'}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-semibold">
            💳 جميع الرسائل مرفق بها تلقائياً رابط الدفع انستا باي ({INSTAPAY_PAYMENT_URL}) باسم {INSTAPAY_RECIPIENT_NAME}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
