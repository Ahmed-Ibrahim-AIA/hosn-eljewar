import React, { useState, useEffect } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Apartment, Revenue } from '../types';
import {
  calculateApartmentsBalances,
  formatMoney,
  exportToCsv,
  getOverdueTenants,
  generateTenantReminderText,
  getApartmentsMonthStatusMap,
  evaluateMonthlyDueStatus,
} from '../utils/finance';
import { TenantReminderModal } from './TenantReminderModal';
import { ApartmentAvatar } from './ApartmentAvatar';
import { BuildingFloorsDiagram } from './BuildingFloorsDiagram';
import {
  Building2,
  Plus,
  Search,
  MessageCircle,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  BellRing,
  Clock,
  Send,
  Check,
  Wrench,
  Layers,
  LayoutGrid,
  Filter,
  Calendar,
  Archive,
  History as HistoryIcon,
  Mail,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { ApartmentDrawerTab } from './ApartmentDetailDrawer';
import { EmailDispatchModal } from './EmailDispatchModal';

export type UnitsFilterType =
  | 'all'
  | 'overdue_only'
  | 'overdue_tenants'
  | 'unpaid'
  | 'paid'
  | 'owner'
  | 'tenant'
  | 'maintenance_pending';

interface UnitsViewProps {
  initialFilter?: string;
  onOpenAddUnit: () => void;
  onEditUnit: (apt: Apartment) => void;
  onSelectUnit: (unitId: string, initialTab?: ApartmentDrawerTab) => void;
  onCollectPayment: (unitId: string) => void;
  onOpenBulkWhatsApp?: () => void;
  onEditRevenue?: (rev: Revenue) => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  initialFilter = 'all',
  onOpenAddUnit,
  onEditUnit,
  onSelectUnit,
  onCollectPayment,
  onOpenBulkWhatsApp,
  onEditRevenue,
}) => {
  const { apartments, revenues, settings, selectedMonth, updateApartment, deleteApartment, maintenanceNotes, isReadOnly } = useBuilding();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<UnitsFilterType>(
    (initialFilter as UnitsFilterType) || 'all'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'floors_diagram'>('cards');
  const [emailReportApartment, setEmailReportApartment] = useState<Apartment | null>(null);
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setFilterType(initialFilter as UnitsFilterType);
    }
  }, [initialFilter]);

  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [directWaNotice, setDirectWaNotice] = useState<string | null>(null);

  // Tenant Reminder Modal State
  const [reminderTarget, setReminderTarget] = useState<{
    apartment: Apartment;
    overdueAmount: number;
  } | null>(null);

  const configuredDueDay = settings.lateRentAlertDay ?? 10;
  const dueEvaluation = evaluateMonthlyDueStatus(selectedMonth, configuredDueDay);
  const monthStatusMap = getApartmentsMonthStatusMap(
    apartments,
    revenues,
    selectedMonth,
    configuredDueDay
  );

  const balances = calculateApartmentsBalances(apartments, revenues, 1);
  const overdueTenants = getOverdueTenants(apartments, balances);
  const totalOverdueTenantsAmount = overdueTenants.reduce((sum, item) => sum + item.overdueAmount, 0);

  // Count of apartments overdue for the current month or overall balance
  const overdueApartmentsList = apartments.filter(apt => {
    const mInfo = monthStatusMap[apt.id];
    const bal = balances.find(b => b.unitId === apt.id);
    return (mInfo && mInfo.isUnpaidForMonth) || (bal?.balance ?? 0) < 0;
  });

  const paidForCurrentMonthList = apartments.filter(apt => {
    const mInfo = monthStatusMap[apt.id];
    return mInfo && !mInfo.isUnpaidForMonth && (balances.find(b => b.unitId === apt.id)?.balance ?? 0) >= 0;
  });

  // Available floors
  const floors = Array.from(new Set(apartments.map(a => a.floor))).sort((a, b) => a - b);

  // Filtered apartments
  const filteredApartments = apartments.filter(apt => {
    const bal = balances.find(b => b.unitId === apt.id);
    const mInfo = monthStatusMap[apt.id];
    const isUnitOverdue = (mInfo && mInfo.isUnpaidForMonth) || (bal?.balance ?? 0) < 0;

    const matchesSearch =
      apt.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (selectedFloor !== 'all' && apt.floor !== selectedFloor) return false;

    if (filterType === 'overdue_only' || filterType === 'unpaid') return isUnitOverdue;
    if (filterType === 'paid') return !isUnitOverdue;
    if (filterType === 'overdue_tenants') return apt.residentType === 'tenant' && isUnitOverdue;
    if (filterType === 'owner') return apt.residentType === 'owner';
    if (filterType === 'tenant') return apt.residentType === 'tenant';
    if (filterType === 'maintenance_pending') {
      return maintenanceNotes.some(n => n.apartmentId === apt.id && n.status !== 'resolved');
    }

    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'رقم الشقة',
      'الدور',
      'اسم الساكن',
      'الصفة',
      'الهاتف',
      'الاشتراك الشهري',
      `حالة سداد شهر (${selectedMonth})`,
      'إجمالي المسدد',
      'الموقف المالي العام',
      'المتأخرات / الرصيد',
      'آخر تذكير تم إرساله',
      'ملاحظات',
    ];
    const rows = apartments.map(apt => {
      const b = balances.find(item => item.unitId === apt.id);
      const mInfo = monthStatusMap[apt.id];
      return [
        apt.number,
        apt.floor,
        apt.residentName,
        apt.residentType === 'owner' ? 'مالك' : 'مستأجر',
        apt.phone,
        apt.monthlyFee,
        mInfo?.paymentStatus === 'paid'
          ? 'مسدد للشهر الحالي'
          : mInfo?.paymentStatus === 'partial'
          ? `سداد جزئي (متبقي ${mInfo.remainingAmount})`
          : 'غير مسدد للشهر الحالي',
        b?.totalPaid ?? 0,
        (b?.balance ?? 0) >= 0 ? 'خالص السداد' : 'عليه متأخرات',
        b?.balance ?? 0,
        apt.lastReminderDate || 'لم يتم إرسال تذكير',
        apt.notes || '',
      ];
    });

    exportToCsv(`سجل_سكان_وشقق_${settings.buildingName}.csv`, headers, rows);
  };

  const handleOpenReminder = (apt: Apartment, overdueAmt: number) => {
    setReminderTarget({
      apartment: apt,
      overdueAmount: overdueAmt,
    });
  };

  const getWhatsAppUrl = (apt: Apartment, overdueAmount: number) => {
    const cleanPhone = apt.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;
    const message = generateTenantReminderText({
      residentName: apt.residentName,
      unitNumber: apt.number,
      overdueAmount,
      currency: settings.currency,
      buildingName: settings.buildingName,
      treasurerName: settings.treasurerName,
      monthTarget: selectedMonth,
      paymentDetails: settings.bankAccountDetails,
      tone: 'gentle',
    });
    return `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(message)}`;
  };

  const handleDirectWhatsAppClick = (apt: Apartment) => {
    const today = new Date().toISOString().split('T')[0];
    updateApartment(apt.id, { lastReminderDate: today });
    setDirectWaNotice(`تم فتح محادثة واتساب وإرفاق رسالة التذكير الفورية لشقة (${apt.number}) - ${apt.residentName} بنجاح!`);
    setTimeout(() => setDirectWaNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>دليل شقق وسكان العمارة ({apartments.length} وحدة)</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>شهر ({selectedMonth}) • يوم الاستحقاق: يوم {configuredDueDay}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل ومتابعة بيانات الملاك والمستأجرين، وقيم الاشتراكات، وشارات سداد كل شقة للشهر الحالي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher: Cards vs Building Floors Diagram */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>بطاقات الشقق</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('floors_diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'floors_diagram'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-indigo-700'
              }`}
              title="رسم توضيحي لأدوار العمارة برقم الشقة ونماذج السكان"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>رسم توضيحي لأدوار العمارة</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            تصدير إكسل (CSV)
          </button>
          {!isReadOnly ? (
            <button
              onClick={onOpenAddUnit}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة شقة جديدة
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>وضع القراءة فقط</span>
            </span>
          )}
        </div>
      </div>

      {/* Automatic Overdue Tenant Alert Banner */}
      {overdueTenants.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-300 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900">
                    تنبيه تلقائي: تأخر مستأجرين وشقق عن سداد الإيجار / الرسوم الشهرية ({selectedMonth})
                  </h3>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    {overdueApartmentsList.length} شقق متأخرة عن الدفع
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  يوجد {overdueTenants.length} مستأجرين متأخرين عن السداد بإجمالي مستحقات معلقة:{' '}
                  <span className="font-bold text-rose-600">
                    {formatMoney(totalOverdueTenantsAmount, settings.currency)}
                  </span>
                  . يمكنك إرسال إشعار تذكير فوري ومخصص لكل مستأجر عبر واتساب أو تصفية الشقق المتأخرة فقط.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onOpenBulkWhatsApp && (
                <button
                  type="button"
                  data-testid="units-bulk-overdue-whatsapp-btn"
                  onClick={onOpenBulkWhatsApp}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>إرسال واتساب لكل المتأخرين بضغطة واحدة</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === 'overdue_only' ? 'all' : 'overdue_only')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === 'overdue_only'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {filterType === 'overdue_only'
                  ? `إظهار كل الشقق (${apartments.length})`
                  : `إظهار الشقق المتأخرة عن الدفع فقط (${overdueApartmentsList.length})`}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFilterType(filterType === 'overdue_tenants' ? 'all' : 'overdue_tenants')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterType === 'overdue_tenants'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                عرض المستأجرين المتأخرين فقط ({overdueTenants.length})
              </button>
            </div>

          </div>

          {/* Quick Overdue Tenant Cards Ribbon */}
          <div className="mt-4 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {overdueTenants.map(item => (
              <div
                key={item.apartment.id}
                className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-amber-200 flex items-center justify-between shadow-2xs gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {item.apartment.number}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {item.apartment.residentName}
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-600 font-bold mt-1">
                    متأخر: {formatMoney(item.overdueAmount, settings.currency)}
                  </div>
                  {item.apartment.lastReminderDate ? (
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>آخر تذكير: {item.apartment.lastReminderDate}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      لم يتم إرسال تذكير بعد
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.apartment.phone && (
                    <a
                      href={getWhatsAppUrl(item.apartment, item.overdueAmount)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDirectWhatsAppClick(item.apartment)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-2xs"
                      title="إرسال تذكير واتساب مباشر (WhatsApp API/Web)"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenReminder(item.apartment, item.overdueAmount)}
                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-xs transition"
                    title="تخصيص نص التذكير والنبرة الرسمية أو الودية"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Direct WhatsApp feedback banner */}
      {directWaNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{directWaNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الشقة، اسم الساكن، الهاتف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({apartments.length})
            </button>

            {/* Primary Filter: الشقق المتأخرة عن الدفع فقط */}
            <button
              type="button"
              onClick={() =>
                setFilterType(filterType === 'overdue_only' ? 'all' : 'overdue_only')
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                filterType === 'overdue_only' || filterType === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>الشقق المتأخرة عن الدفع ({overdueApartmentsList.length})</span>
            </button>

            {/* Overdue Tenants Filter Badge */}
            <button
              type="button"
              onClick={() =>
                setFilterType(filterType === 'overdue_tenants' ? 'all' : 'overdue_tenants')
              }
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'overdue_tenants'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <BellRing className="w-3 h-3 text-amber-600" />
              <span>مستأجرين متأخرين ({overdueTenants.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType(filterType === 'paid' ? 'all' : 'paid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              <span>مسددة بالكامل ({paidForCurrentMonthList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType(filterType === 'tenant' ? 'all' : 'tenant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'tenant'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              مستأجرين ({apartments.filter(a => a.residentType === 'tenant').length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType(filterType === 'owner' ? 'all' : 'owner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'owner'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ملاك ({apartments.filter(a => a.residentType === 'owner').length})
            </button>

            {/* Maintenance Issues Filter Badge */}
            <button
              type="button"
              onClick={() =>
                setFilterType(
                  filterType === 'maintenance_pending' ? 'all' : 'maintenance_pending'
                )
              }
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'maintenance_pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>
                أعطال صيانة (
                {
                  apartments.filter(a =>
                    maintenanceNotes.some(
                      n => n.apartmentId === a.id && n.status !== 'resolved'
                    )
                  ).length
                }
                )
              </span>
            </button>

            {/* Floor selector */}
            <select
              value={selectedFloor}
              onChange={e =>
                setSelectedFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              aria-label="تصفية حسب الدور"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="all">جميع الأدوار</option>
              {floors.map(f => (
                <option key={f} value={f}>
                  الدور {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Overdue Filter Summary Bar */}
        {(filterType === 'overdue_only' || filterType === 'unpaid' || filterType === 'overdue_tenants') && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <Filter className="w-3.5 h-3.5 text-rose-600" />
              <span>
                وضع التصفية النشط:{' '}
                {filterType === 'overdue_tenants'
                  ? `المستأجرين المتأخرين عن الدفع (${filteredApartments.length} مستأجرين)`
                  : `الشقق المتأخرة عن الدفع فقط (${filteredApartments.length} شقق)`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-mono text-[11px]">
                يوم الاستحقاق الشهري: يوم {configuredDueDay} ({dueEvaluation.dueDateFormatted})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline text-right sm:text-left"
            >
              إلغاء التصفية وإظهار جميع الشقق ({apartments.length})
            </button>
          </div>
        )}
      </div>

      {/* View Mode: Building Floors Diagram OR Apartments Cards Grid */}
      {viewMode === 'floors_diagram' ? (
        <BuildingFloorsDiagram
          onSelectUnit={onSelectUnit}
          onCollectPayment={onCollectPayment}
        />
      ) : filteredApartments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-base mb-1">لا توجد نتائج مطابقة</h3>
          <p className="text-xs text-slate-500">جرب تعديل كلمات البحث أو فلتر التصفية</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApartments.map(apt => {
            const bal = balances.find(b => b.unitId === apt.id);
            const mInfo = monthStatusMap[apt.id];
            const isUnpaidThisMonth = mInfo ? mInfo.isUnpaidForMonth : false;
            const isDelinquent = (bal?.balance ?? 0) < 0 || isUnpaidThisMonth;
            const hasCredit = (bal?.balance ?? 0) > 0 && !isUnpaidThisMonth;
            const isOverdueTenant = apt.residentType === 'tenant' && isDelinquent;
            const overdueAmt =
              mInfo && mInfo.remainingAmount > 0
                ? mInfo.remainingAmount
                : (bal?.balance ?? 0) < 0
                ? Math.abs(bal!.balance)
                : 0;

            const cleanPhone = apt.phone.replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;
            const aptPendingNotes = maintenanceNotes.filter(
              n => n.apartmentId === apt.id && n.status !== 'resolved'
            );

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between group shadow-2xs ${
                  isUnpaidThisMonth
                    ? dueEvaluation.isPastDueDate
                      ? 'border-rose-300 bg-rose-50/15 ring-1 ring-rose-300/60 hover:border-rose-400'
                      : 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-300/60 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <ApartmentAvatar
                        unitNumber={apt.number}
                        avatarIcon={apt.avatarIcon}
                        avatarColor={apt.avatarColor}
                        size="md"
                        isAlert={isUnpaidThisMonth && settings.enableLateRentAlerts !== false}
                      />
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">
                          الدور {apt.floor}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            apt.residentType === 'owner'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {apt.residentType === 'owner' ? 'مالك' : 'مستأجر'}
                        </span>
                      </div>
                    </div>

                    {/* Financial & Maintenance status pills */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {(apt.previousTenants?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => onSelectUnit(apt.id, 'tenants_history')}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition"
                          title="عرض سجل المستأجرين التاريخي لهذه الوحدة"
                        >
                          <HistoryIcon className="w-3 h-3 text-indigo-600" />
                          <span>{apt.previousTenants?.length} مستأجر سابق</span>
                        </button>
                      )}

                      {aptPendingNotes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onSelectUnit(apt.id, 'maintenance')}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition"
                          title="عرض أعطال وملاحظات الصيانة لهذه الشقة"
                        >
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>{aptPendingNotes.length} صيانة</span>
                        </button>
                      )}

                      {apt.monthlyFee === 0 && !isDelinquent && !hasCredit ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                          <span>غير مشارك / خالية</span>
                        </span>
                      ) : isDelinquent ? (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                            dueEvaluation.isPastDueDate
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>
                            {dueEvaluation.isPastDueDate ? 'متأخر:' : 'مطلوب:'} {overdueAmt}{' '}
                            {settings.currency}
                          </span>
                        </span>
                      ) : hasCredit ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                          رصيد دائن: {bal!.balance} {settings.currency}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>خالص السداد</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Badge Ribbon for Current Month Payment Status (نظام الـ Badges للشهر الحالي) */}
                  <div className="mb-3">
                    {apt.monthlyFee === 0 && (mInfo?.paidThisMonth ?? 0) === 0 ? (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-600 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          <span>وحدة غير مشاركة بالدفع / شاغرة حالياً</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">0 {settings.currency}</span>
                      </div>
                    ) : isUnpaidThisMonth ? (
                      <div
                        className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${
                          dueEvaluation.isPastDueDate
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-black">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              dueEvaluation.isPastDueDate
                                ? 'bg-rose-600 animate-ping'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>
                            {mInfo?.paymentStatus === 'partial'
                              ? `سداد جزئي لشهر (${selectedMonth})`
                              : `لم يسدد إيجار شهر (${selectedMonth})`}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            dueEvaluation.isPastDueDate
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {dueEvaluation.isPastDueDate
                            ? `متأخرة (${dueEvaluation.daysPastDue} يوم)`
                            : `استحقاق يوم ${configuredDueDay}`}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>مسدد إيجار شهر ({selectedMonth}) بالكامل</span>
                        </div>
                        {mInfo?.lastPaymentDateThisMonth && (
                          <span className="text-[10px] text-emerald-700 font-mono">
                            {mInfo.lastPaymentDateThisMonth}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resident Info */}
                  <div className="space-y-1 mb-3">
                    <h3
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition"
                      onClick={() => onSelectUnit(apt.id)}
                    >
                      {apt.residentName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {apt.phone && (
                        <span className="font-semibold text-slate-600 font-mono" dir="ltr">
                          {apt.phone}
                        </span>
                      )}
                      {apt.email && (
                        <span className="text-[11px] text-indigo-600 font-mono truncate max-w-[180px]" dir="ltr">
                          {apt.email}
                        </span>
                      )}
                      {apt.parkingSlot && <span>• موقف {apt.parkingSlot}</span>}
                    </div>
                    {apt.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 mt-1.5 leading-relaxed">
                        📝 {apt.notes}
                      </p>
                    )}
                  </div>

                  {/* Subscription details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">الاشتراك الشهري</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatMoney(apt.monthlyFee, settings.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        مسدد لشهر ({selectedMonth})
                      </span>
                      <span
                        className={`font-bold font-mono ${
                          (mInfo?.paidThisMonth ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatMoney(mInfo?.paidThisMonth ?? 0, settings.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Overdue Quick WhatsApp Reminder Box inside Card */}
                  {isDelinquent && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1 text-amber-900">
                          <BellRing className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {isOverdueTenant
                              ? 'مستأجر متأخر عن السداد'
                              : 'وحدة متأخرة عن السداد'}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {apt.phone && (
                            <a
                              href={getWhatsAppUrl(apt, overdueAmt)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleDirectWhatsAppClick(apt)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                              title="إرسال رسالة تذكير سريعة عبر واتساب"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>تذكير واتساب</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenReminder(apt, overdueAmt)}
                            className="font-bold text-indigo-700 hover:text-indigo-900 underline text-[10px]"
                          >
                            تخصيص النص
                          </button>
                        </div>
                      </div>
                      {apt.lastReminderDate && (
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>آخر تذكير أرسل: {apt.lastReminderDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isDelinquent ? (
                      <div className="flex items-center gap-1">
                        {apt.phone && (
                          <a
                            href={getWhatsAppUrl(apt, overdueAmt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleDirectWhatsAppClick(apt)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                            title="إرسال تذكير بالدفع عبر واتساب مباشرة"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenReminder(apt, overdueAmt)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition"
                          title="تخصيص نص التذكير والنبرة"
                        >
                          <Send className="w-3 h-3 text-amber-700" />
                        </button>
                      </div>
                    ) : apt.phone ? (
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                        title="محادثة واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setEmailReportApartment(apt)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition"
                      title={`إرسال التقرير المالي وكشف الحساب بالبريد (${apt.email || 'إضافة بريد'})`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    {!isReadOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditUnit(apt)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          تعديل
                        </button>
                        {confirmDeleteUnitId === apt.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteApartment(apt.id);
                                setConfirmDeleteUnitId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold transition"
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUnitId(null)}
                              className="px-1.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUnitId(apt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف الشقة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectUnit(apt.id, 'finance')}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      ملف الشقة
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectUnit(apt.id, 'tenants_history')}
                      className="flex items-center gap-1 px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition"
                      title="عرض سجل المستأجرين التاريخي وأرشفة المستأجر عند الخروج"
                    >
                      <Archive className="w-3 h-3 text-amber-600" />
                      <span>سجل المستأجرين</span>
                    </button>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5">
                      {onEditRevenue && (() => {
                        const latestUnitRev = revenues.find(
                          r => r.unitId === apt.id && ((r.monthTarget && r.monthTarget === selectedMonth) || r.date.startsWith(selectedMonth))
                        );
                        if (!latestUnitRev) return null;
                        return (
                          <button
                            type="button"
                            data-testid={`unit-edit-payment-btn-${apt.id}`}
                            onClick={() => onEditRevenue(latestUnitRev)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition"
                            title="تعديل أو حذف الدفعة المسجلة لهذا الشهر"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل الدفعة</span>
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => onCollectPayment(apt.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>تحصيل</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tenant Reminder Notification Modal */}
      {reminderTarget && (
        <TenantReminderModal
          apartment={reminderTarget.apartment}
          overdueAmount={reminderTarget.overdueAmount}
          monthTarget={selectedMonth}
          onClose={() => setReminderTarget(null)}
          onReminderSent={() => {
            // Updated in context automatically
          }}
        />
      )}

      <EmailDispatchModal
        isOpen={Boolean(emailReportApartment)}
        onClose={() => setEmailReportApartment(null)}
        mode="report"
        initialApartment={emailReportApartment}
        targetMonth={selectedMonth}
      />

    </div>
  );
};
