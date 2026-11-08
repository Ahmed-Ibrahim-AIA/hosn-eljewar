import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Revenue } from '../types';
import {
  formatMoney,
  exportToCsv,
  REVENUE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  Trash2,
  Mail,
  CheckCircle2,
  Lock,
  Edit2,
} from 'lucide-react';
import { EmailDispatchModal } from './EmailDispatchModal';

interface RevenuesViewProps {
  onOpenAddRevenue: () => void;
  onViewReceipt: (rev: Revenue) => void;
  onEditRevenue: (rev: Revenue) => void;
}

export const RevenuesView: React.FC<RevenuesViewProps> = ({
  onOpenAddRevenue,
  onViewReceipt,
  onEditRevenue,
}) => {
  const { revenues, deleteRevenue, settings, selectedMonth, isReadOnly } = useBuilding();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(selectedMonth);
  const [emailModalRevenue, setEmailModalRevenue] = useState<Revenue | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredRevenues = revenues.filter(rev => {
    const matchesSearch =
      rev.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.unitNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterMonth !== 'all' && !rev.date.startsWith(filterMonth)) return false;

    if (selectedCategory !== 'all' && rev.category !== selectedCategory) return false;

    return true;
  });

  const totalSum = filteredRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  const handleExportCsv = () => {
    const headers = [
      'رقم السند',
      'التاريخ',
      'رقم الشقة',
      'اسم الساكن',
      'شهر الاستحقاق',
      'البند',
      'المبلغ',
      'طريقة الدفع',
      'رقم العملية',
      'المحصل',
      'ملاحظات',
    ];
    const rows = filteredRevenues.map(r => [
      r.receiptNumber,
      r.date,
      r.unitNumber,
      r.residentName,
      r.monthTarget || '',
      REVENUE_CATEGORY_LABELS[r.category] || r.category,
      r.amount,
      PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod,
      r.transactionRef || '',
      r.collectorName,
      r.notes || '',
    ]);

    exportToCsv(`سجل_إيرادات_${filterMonth !== 'all' ? filterMonth : 'الكل'}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>سجل الإيرادات وسندات القبض</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق جميع المبالغ والاشتراكات المحصلة مع إصدار وطباعة أو إرسال إيصالات رسمية بالبريد الإلكتروني لكل ساكن
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            تصدير إكسل (CSV)
          </button>
          {!isReadOnly ? (
            <button
              onClick={onOpenAddRevenue}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إصدار سند قبض جديد
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>وضع القراءة فقط</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar & Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم السند، الشقة، الساكن..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 transition"
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
            <option value="all">جميع البنود</option>
            {Object.entries(REVENUE_CATEGORY_LABELS).map(([cat, label]) => (
              <option key={cat} value={cat}>{label}</option>
            ))}
          </select>

          {/* Tally Pill */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-black">
            إجمالي المعروض: {formatMoney(totalSum, settings.currency)} ({filteredRevenues.length} إيصال)
          </div>

        </div>

      </div>

      {/* Revenues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRevenues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-sm text-slate-700 mb-1">لا توجد إيرادات مسجلة مطابقة</p>
            <p>يمكنك تسجيل سند قبض جديد بالضغط على زر "إصدار سند قبض جديد" بالأعلى.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">الشقة</th>
                  <th className="py-3 px-4">اسم الساكن</th>
                  <th className="py-3 px-4">شهر الاستحقاق</th>
                  <th className="py-3 px-4">البند</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">المحصل</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRevenues.map(rev => (
                  <tr key={rev.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{rev.receiptNumber}</span>
                        {rev.emailSentAt && (
                          <span
                            className="inline-flex items-center text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]"
                            title={`تم إرسال الإيصال للبريد: ${rev.recipientEmail}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {rev.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {rev.unitNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rev.residentName}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {rev.monthTarget || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {REVENUE_CATEGORY_LABELS[rev.category] || rev.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {PAYMENT_METHOD_LABELS[rev.paymentMethod] || rev.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600 text-sm">
                      {formatMoney(rev.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {rev.collectorName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewReceipt(rev)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition"
                          title="عرض وطباعة سند القبض"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>إيصال</span>
                        </button>
                        <button
                          onClick={() => setEmailModalRevenue(rev)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                          title="إرسال إيصال الدفع عبر البريد الإلكتروني للساكن"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>بريد</span>
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              data-testid={`edit-revenue-btn-${rev.id}`}
                              onClick={() => onEditRevenue(rev)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition border border-amber-200/70"
                              title="تعديل بيانات سند القبض أو المبلغ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                            {confirmDeleteId === rev.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  data-testid={`confirm-delete-revenue-btn-${rev.id}`}
                                  onClick={() => {
                                    deleteRevenue(rev.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  تأكيد الحذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-testid={`delete-revenue-btn-${rev.id}`}
                                onClick={() => setConfirmDeleteId(rev.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف السند / إلغاء الدفعة"
                                aria-label="حذف السند"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmailDispatchModal
        isOpen={Boolean(emailModalRevenue)}
        onClose={() => setEmailModalRevenue(null)}
        mode="receipt"
        revenue={emailModalRevenue}
      />

    </div>
  );
};
