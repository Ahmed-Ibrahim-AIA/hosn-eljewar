import React from 'react';
import { Revenue, BuildingSettings } from '../types';
import {
  tafqeetArabic,
  formatMoney,
  PAYMENT_METHOD_LABELS,
  REVENUE_CATEGORY_LABELS,
} from '../utils/finance';
import { Printer, Copy, Check, X, Building2, ShieldCheck, Mail, CheckCircle2, FileImage, Download, Edit2, Trash2 } from 'lucide-react';
import { EmailDispatchModal } from './EmailDispatchModal';
import {
  copyTextSafe,
  exportOrSharePngImage,
  isRunningInsideApk,
  renderReceiptToPngDataUrl,
  saveFileToDevice,
} from '../utils/apkBridge';

interface ReceiptModalProps {
  revenue: Revenue | null;
  settings: BuildingSettings;
  onClose: () => void;
  onEditRevenue?: (rev: Revenue) => void;
  onDeleteRevenue?: (id: string) => void;
  isReadOnly?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  revenue,
  settings,
  onClose,
  onEditRevenue,
  onDeleteRevenue,
  isReadOnly = false,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!revenue) return null;

  const amountInWords = tafqeetArabic(
    revenue.amount,
    settings.currency === 'ج.م' ? 'جنيه مصري' : settings.currency
  );

  const receiptWhatsAppText = `🧾 *إيصال استلام نقدية (سند قبض)*
🏢 *${settings.buildingName}*
━━━━━━━━━━━━━━━━━━━━
▪️ رقم الإيصال: ${revenue.receiptNumber}
▪️ التاريخ: ${revenue.date}
▪️ استلمنا من الساكن: *${revenue.residentName}* (شقة ${revenue.unitNumber})
▪️ مبلغ وقدره: *${revenue.amount} ${settings.currency}*
▪️ فقط: ${amountInWords}
▪️ وذلك عن: *${REVENUE_CATEGORY_LABELS[revenue.category] || revenue.category}* (${revenue.monthTarget || 'رسوم عامة'})
▪️ طريقة السداد: ${PAYMENT_METHOD_LABELS[revenue.paymentMethod] || revenue.paymentMethod} ${revenue.transactionRef ? `(مرجع: ${revenue.transactionRef})` : ''}
▪️ المستلم: ${revenue.collectorName}
━━━━━━━━━━━━━━━━━━━━
نشكركم على حسن تعاونكم ودوام الالتزام.`;

  const handleExportReceiptImage = (preferShare = true) => {
    const dataUrl = renderReceiptToPngDataUrl({
      receiptNumber: revenue.receiptNumber,
      date: revenue.date,
      residentName: revenue.residentName,
      unitNumber: revenue.unitNumber,
      amountFormatted: formatMoney(revenue.amount, settings.currency),
      amountInWords,
      categoryLabel: REVENUE_CATEGORY_LABELS[revenue.category] || revenue.category,
      monthTarget: revenue.monthTarget || revenue.date.slice(0, 7),
      paymentMethodLabel: PAYMENT_METHOD_LABELS[revenue.paymentMethod] || revenue.paymentMethod,
      collectorName: revenue.collectorName,
      buildingName: settings.buildingName,
      buildingAddress: settings.buildingAddress,
      notes: revenue.notes,
    });
    if (!dataUrl) return;
    void exportOrSharePngImage({
      dataUrl,
      fileName: `إيصال-قبض-${revenue.receiptNumber}-شقة-${revenue.unitNumber}.png`,
      title: `إيصال قبض رقم ${revenue.receiptNumber} — شقة ${revenue.unitNumber}`,
      captionText: receiptWhatsAppText,
      preferShare,
      openPreviewModal: true,
    });
  };

  const handleDirectDownloadReceipt = async () => {
    if (!revenue) return;
    const dataUrl = renderReceiptToPngDataUrl({
      receiptNumber: revenue.receiptNumber,
      date: revenue.date,
      residentName: revenue.residentName,
      unitNumber: revenue.unitNumber,
      amountFormatted: formatMoney(revenue.amount, settings.currency),
      amountInWords,
      categoryLabel: REVENUE_CATEGORY_LABELS[revenue.category] || revenue.category,
      monthTarget: revenue.monthTarget || revenue.date.slice(0, 7),
      paymentMethodLabel: PAYMENT_METHOD_LABELS[revenue.paymentMethod] || revenue.paymentMethod,
      collectorName: revenue.collectorName,
      buildingName: settings.buildingName,
      buildingAddress: settings.buildingAddress,
      notes: revenue.notes,
    });
    if (!dataUrl) return;
    const cleanB64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const fileName = `إيصال-قبض-${revenue.receiptNumber}-شقة-${revenue.unitNumber}.png`;
    await saveFileToDevice(cleanB64, fileName, 'image/png', {
      targetFolder: 'Download',
    });
  };

  const handlePrint = () => {
    if (isRunningInsideApk()) {
      handleExportReceiptImage(true);
      return;
    }
    window.print();
  };

  const handleCopyText = () => {
    void copyTextSafe(receiptWhatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header Action Bar (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">سند قبض واستلام نقدية رسمي</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && onEditRevenue && (
              <button
                type="button"
                data-testid="receipt-edit-btn"
                onClick={() => onEditRevenue(revenue)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-xs cursor-pointer"
                title="تعديل بيانات سند القبض أو المبلغ أو الشهر"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل السند</span>
              </button>
            )}
            {!isReadOnly && onDeleteRevenue && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid="receipt-confirm-delete-btn"
                    onClick={() => {
                      onDeleteRevenue(revenue.id);
                      setConfirmDelete(false);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 text-xs font-black rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition"
                  >
                    تأكيد حذف السند
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="receipt-delete-btn"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-rose-950/80 hover:bg-rose-700 text-rose-200 hover:text-white border border-rose-700/60 transition"
                  title="حذف / إلغاء دفعة القسط"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              )
            )}
            <button
              type="button"
              data-testid="receipt-direct-download-btn"
              onClick={handleDirectDownloadReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition shadow-xs cursor-pointer border border-teal-400"
              title="داونلود مباشر وسريع للإيصال في مجلد التحميلات (Downloads)"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>داونلود مباشر (Downloads)</span>
            </button>
            <button
              type="button"
              data-testid="receipt-export-whatsapp-png-btn"
              onClick={() => handleExportReceiptImage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-xs cursor-pointer"
              title="تصدير الإيصال كصورة PNG لإرسالها على واتساب"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>صورة للواتساب</span>
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-xs"
              title="إرسال إيصال الدفع عبر البريد الإلكتروني للساكن"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>إرسال بالبريد الإلكتروني</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
              title="نسخ نص الإيصال للواتساب"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'تم النسخ!' : 'نسخ لواتساب'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الإيصال
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Official Receipt Area */}
        <div className="p-8 bg-white text-slate-800 print:p-4 print:text-black print:m-0" id="printable-receipt">
          
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-inner overflow-hidden print:border print:border-black">
                  {settings.appIconUrl ? (
                    <img
                      data-testid="receipt-custom-app-icon"
                      src={settings.appIconUrl}
                      alt={settings.buildingName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{settings.buildingName}</h1>
                  <p className="text-xs text-slate-500 font-medium">{settings.buildingAddress}</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">اتحاد شاغلي العقار ولجنة الإدارة المالية</p>
                </div>
              </div>
              <div className="text-left">
                <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded-md text-slate-900 font-bold text-sm">
                  {revenue.receiptNumber}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">التاريخ: {revenue.date}</div>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <span className="inline-block px-6 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 font-black text-lg rounded-full shadow-xs">
              إيـصـال اسـتـلام نـقـديـة (سـنـد قـبـض)
            </span>
          </div>

          {/* Receipt Body */}
          <div className="space-y-4 text-sm leading-relaxed bg-slate-50/70 p-5 rounded-xl border border-slate-200">
            <div className="flex items-baseline justify-between border-b border-dashed border-slate-300 pb-2">
              <span className="text-slate-600 font-semibold min-w-36">استلمنا من السيد/ة:</span>
              <span className="font-bold text-base text-slate-900 flex-1">{revenue.residentName}</span>
              <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded text-xs">
                شقة رقم: {revenue.unitNumber}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-b border-dashed border-slate-300 pb-2">
              <span className="text-slate-600 font-semibold min-w-36">مبلغ وقدره:</span>
              <div className="flex-1 flex items-baseline gap-2">
                <span className="font-black text-lg text-emerald-700">
                  {formatMoney(revenue.amount, settings.currency)}
                </span>
                <span className="text-xs text-slate-500">
                  ({amountInWords})
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-b border-dashed border-slate-300 pb-2">
              <span className="text-slate-600 font-semibold min-w-36">وذلك نظير / بيان:</span>
              <span className="font-semibold text-slate-900 flex-1">
                {REVENUE_CATEGORY_LABELS[revenue.category] || revenue.category}
                {revenue.monthTarget ? ` عن شهر (${revenue.monthTarget})` : ''}
                {revenue.notes ? ` - ${revenue.notes}` : ''}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-slate-600 font-semibold min-w-36">طريقة السداد:</span>
              <span className="font-medium text-slate-800 flex-1">
                {PAYMENT_METHOD_LABELS[revenue.paymentMethod] || revenue.paymentMethod}
                {revenue.transactionRef ? ` | رقم العملية: ${revenue.transactionRef}` : ''}
              </span>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 font-medium mb-10">توقيع الساكن / المسدد</p>
              <p className="font-bold text-slate-800">........................</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              {settings.officialStampUrl ? (
                <div className="w-24 h-24 flex items-center justify-center p-1">
                  <img
                    data-testid="receipt-custom-official-stamp"
                    src={settings.officialStampUrl}
                    alt="الختم الرسمي للعقار"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-600/40 flex flex-col items-center justify-center text-[10px] text-emerald-800 font-bold p-1 leading-tight transform -rotate-12">
                  <span>ختم الإدارة</span>
                  <span className="text-[8px] text-slate-500 font-mono">معتمد</span>
                  <span className="text-[9px] mt-0.5">{settings.buildingName.slice(0, 15)}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-10">توقيع أمين الصندوق / المستلم</p>
              <p className="font-bold text-slate-900">{revenue.collectorName || settings.treasurerName}</p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>تم إصدار هذا السند إلكترونياً من خلال منظومة إدارة العمارة والمصروفات</span>
            <span>{new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}</span>
          </div>

        </div>

        {/* Footer (No print) */}
        <div className="no-print px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>💡 يمكنك الطباعة كـ PDF أو إرسال الإيصال عبر البريد الإلكتروني أو الواتساب للساكن.</span>
            {revenue.emailSentAt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>أُرسل للبريد ({revenue.recipientEmail})</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            إغلاق
          </button>
        </div>

      </div>

      <EmailDispatchModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        mode="receipt"
        revenue={revenue}
      />
    </div>
  );
};
