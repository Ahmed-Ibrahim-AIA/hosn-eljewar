import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  searchBuildingRecords,
  formatMoney,
  REVENUE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '../utils/finance';
import { Revenue } from '../types';
import { ApartmentDrawerTab } from './ApartmentDetailDrawer';
import {
  Search,
  X,
  Building2,
  Receipt,
  CreditCard,
  Plus,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Layers,
  ListChecks,
  Settings,
  ArrowLeft,
} from 'lucide-react';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit: (unitId: string, tab?: ApartmentDrawerTab) => void;
  onCollectPayment: (unitId?: string) => void;
  onViewReceipt: (revenue: Revenue) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenFloorsExcelSheet: () => void;
  onOpenFloorsDiagram: () => void;
  onOpenSettings: () => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUnit,
  onCollectPayment,
  onViewReceipt,
  onNavigateToTab,
  onOpenFloorsExcelSheet,
  onOpenFloorsDiagram,
  onOpenSettings,
}) => {
  const { apartments, revenues, expenses, settings, selectedMonth, isReadOnly } = useBuilding();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'apartments' | 'revenues' | 'expenses'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    return searchBuildingRecords({
      query,
      apartments,
      revenues,
      expenses,
      targetMonth: selectedMonth,
    });
  }, [query, apartments, revenues, expenses, selectedMonth]);

  if (!isOpen) return null;

  const showApartments = activeCategory === 'all' || activeCategory === 'apartments';
  const showRevenues = activeCategory === 'all' || activeCategory === 'revenues';
  const showExpenses = activeCategory === 'all' || activeCategory === 'expenses';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        data-testid="smart-search-modal"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mt-4 sm:mt-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Search Input Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Search className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  البحث الذكي الفوري والوصول السريع ({settings.buildingName})
                </h3>
                <p className="text-[11px] text-slate-400">
                  ابحث باسم الساكن، رقم الشقة، الدور، رقم الإيصال، أو بند المصروفات
                </p>
              </div>
            </div>
            <button
              type="button"
              data-testid="smart-search-close-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إغلاق (Esc)</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              data-testid="smart-search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="اكتب اسم الساكن (مثال: السعداوي، هاني، الشيخ) أو رقم الشقة (مثال: 6، 26) أو مصعد..."
              className="w-full pr-11 pl-10 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 focus:border-emerald-400 focus:bg-slate-800 text-white placeholder-slate-400 text-sm font-bold outline-hidden transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Quick Search Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                الكل ({results.totalHits})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('apartments')}
                className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                  activeCategory === 'apartments'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                الشقق والسكان ({results.apartments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('revenues')}
                className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                  activeCategory === 'revenues'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                الإيصالات ({results.revenues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('expenses')}
                className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
                  activeCategory === 'expenses'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                المصروفات ({results.expenses.length})
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>بحث سريع:</span>
              {['السعداوي', 'هاني', 'الشيخ', 'مصعد'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Shortcuts Strip when query is empty */}
        {!query.trim() && (
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-600">اختصارات سريعة:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFloorsExcelSheet();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
                <span>جدول الأدوار والأسماء</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFloorsDiagram();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-700" />
                <span>مخطط الأدوار</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('quick_hub');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition cursor-pointer"
              >
                <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                <span>الملخصات والمهام</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-700" />
                <span>قائمة الضبط</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Body */}
        <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-5">
          {results.totalHits === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="font-bold text-sm text-slate-700">
                لا توجد نتائج مطابقة لـ «{query}»
              </p>
              <p className="text-xs text-slate-500 mt-1">
                جرّب البحث بجزء من اسم الساكن أو رقم الشقة أو رقم الإيصال
              </p>
            </div>
          )}

          {/* 1. Apartments Section */}
          {showApartments && results.apartments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-black text-xs text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>
                    الشقق والسكان ({results.apartments.length}) — حالة شهر {selectedMonth}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('units');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>عرض كل الشقق</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.apartments.map(({ apartment: apt, paidThisMonth, remainingThisMonth, monthStatus }) => {
                  const cleanPhone = (apt.phone || '').replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;

                  return (
                    <div
                      key={apt.id}
                      data-testid={`smart-search-apt-${apt.number}`}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white shadow-2xs flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-black text-xs font-mono">
                            شقة {apt.number}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            الدور {apt.floor}
                          </span>
                          {monthStatus === 'paid' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="w-3 h-3" />
                              مسدد ({paidThisMonth})
                            </span>
                          )}
                          {monthStatus === 'partial' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                              <Clock className="w-3 h-3" />
                              جزئي (متبقي {remainingThisMonth})
                            </span>
                          )}
                          {monthStatus === 'unpaid' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">
                              <AlertTriangle className="w-3 h-3" />
                              مطلوب {remainingThisMonth}
                            </span>
                          )}
                          {monthStatus === 'exempt' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              معفى / مغلق
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectUnit(apt.id, 'finance');
                          }}
                          className="font-black text-xs text-slate-900 hover:text-indigo-600 truncate block mt-1 text-right cursor-pointer"
                        >
                          {apt.residentName}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {apt.phone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="مراسلة عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!isReadOnly && monthStatus !== 'paid' && monthStatus !== 'exempt' && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onCollectPayment(apt.id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>تحصيل</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectUnit(apt.id, 'finance');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          ملف الشقة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Revenues / Receipts Section */}
          {showRevenues && results.revenues.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-xs text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>سندات القبض والإيصالات ({results.revenues.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {results.revenues.slice(0, 8).map(rev => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <span>{rev.residentName}</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 text-[10px] font-mono">
                          شقة {rev.unitNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {rev.receiptNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {REVENUE_CATEGORY_LABELS[rev.category] || rev.category} • شهر {rev.monthTarget} • بتاريخ {rev.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-emerald-700 font-mono">
                        +{formatMoney(rev.amount, settings.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewReceipt(rev);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        عرض الإيصال
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Expenses Section */}
          {showExpenses && results.expenses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-xs text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <span>المصروفات المسجلة ({results.expenses.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {results.expenses.slice(0, 6).map(exp => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-rose-50/40 border border-rose-200/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-900">{exp.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category} • المستفيد: {exp.paidTo} • {exp.date}
                      </div>
                    </div>
                    <span className="font-black text-rose-700 font-mono shrink-0">
                      -{formatMoney(exp.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
