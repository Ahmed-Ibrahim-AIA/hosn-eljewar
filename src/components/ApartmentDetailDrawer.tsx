import React, { useState, useEffect } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Apartment, Revenue, MaintenanceCategory, MaintenancePriority, RecurrenceInterval } from '../types';
import {
  formatMoney,
  REVENUE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  RECURRENCE_INTERVAL_LABELS,
} from '../utils/finance';
import { TenantReminderModal } from './TenantReminderModal';
import { ApartmentAvatar } from './ApartmentAvatar';
import {
  X,
  Phone,
  MessageCircle,
  CreditCard,
  History as HistoryIcon,
  CheckCircle2,
  Receipt,
  User,
  Edit2,
  Trash2,
  BellRing,
  Wrench,
  Plus,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  Repeat,
  Archive,
  Users,
  ShieldCheck,
  UserCheck,
  ArrowLeftRight,
  Mail,
  Lock,
} from 'lucide-react';
import { EmailDispatchModal } from './EmailDispatchModal';

export type ApartmentDrawerTab = 'finance' | 'tenants_history' | 'maintenance' | 'info';

interface ApartmentDetailDrawerProps {
  apartment: Apartment | null;
  initialTab?: ApartmentDrawerTab;
  onClose: () => void;
  onEdit: (apt: Apartment) => void;
  onCollectPayment: (unitId: string) => void;
  onViewReceipt: (rev: Revenue) => void;
  onEditRevenue?: (rev: Revenue) => void;
}

export const ApartmentDetailDrawer: React.FC<ApartmentDetailDrawerProps> = ({
  apartment,
  initialTab = 'finance',
  onClose,
  onEdit,
  onCollectPayment,
  onViewReceipt,
  onEditRevenue,
}) => {
  const {
    revenues,
    deleteRevenue,
    deleteApartment,
    archiveCurrentTenant,
    addHistoricalTenantRecord,
    updateArchivedTenantRecord,
    deleteArchivedTenantRecord,
    settings,
    selectedMonth,
    maintenanceNotes,
    addMaintenanceNote,
    updateMaintenanceNote,
    deleteMaintenanceNote,
    toggleMaintenanceStatus,
    advancePeriodicMaintenance,
    isReadOnly,
  } = useBuilding();

  const [activeTab, setActiveTab] = useState<ApartmentDrawerTab>(initialTab);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isEmailReportOpen, setIsEmailReportOpen] = useState(false);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(false);
  const [confirmDeleteRevenueId, setConfirmDeleteRevenueId] = useState<string | null>(null);
  const [editingHistoryRecordId, setEditingHistoryRecordId] = useState<string | null>(null);
  const [confirmDeleteHistoryId, setConfirmDeleteHistoryId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [residentReceiptFilter, setResidentReceiptFilter] = useState<string>('all');

  // Archive Current Tenant on Move-Out State
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [archiveMoveInDate, setArchiveMoveInDate] = useState(
    apartment?.moveInDate || '2026-01-01'
  );
  const [archiveMoveOutDate, setArchiveMoveOutDate] = useState('2026-10-23');
  const [archiveExitReason, setArchiveExitReason] = useState(
    'انتهاء مدة عقد الإيجار بالتراضي وإخلاء الطرف المالي'
  );
  const [archiveNotes, setArchiveNotes] = useState('');
  const [nextResidentMode, setNextResidentMode] = useState<'new_tenant' | 'owner_return' | 'vacant'>(
    'new_tenant'
  );
  const [nextResidentName, setNextResidentName] = useState('');
  const [nextResidentPhone, setNextResidentPhone] = useState('');
  const [nextResidentNationalId, setNextResidentNationalId] = useState('');
  const [nextMonthlyFee, setNextMonthlyFee] = useState<number>(
    apartment?.monthlyFee ?? settings.defaultMonthlyFee
  );
  const [nextMoveInDate, setNextMoveInDate] = useState('2026-10-24');
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  // Manual Historical Tenant Record Form State
  const [showAddManualHistoryForm, setShowAddManualHistoryForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMoveIn, setManualMoveIn] = useState('2024-01-01');
  const [manualMoveOut, setManualMoveOut] = useState('2025-12-31');
  const [manualMonthlyFee, setManualMonthlyFee] = useState<number>(
    apartment?.monthlyFee ?? settings.defaultMonthlyFee
  );
  const [manualTotalPaid, setManualTotalPaid] = useState<number>(4200);
  const [manualExitReason, setManualExitReason] = useState('انتهاء مدة الإيجار');

  // New Maintenance Note Form State
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState<MaintenanceCategory>('plumbing');
  const [notePriority, setNotePriority] = useState<MaintenancePriority>('medium');
  const [noteCostEstimate, setNoteCostEstimate] = useState<string>('');
  const [noteAssignedTo, setNoteAssignedTo] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteScheduledDate, setNoteScheduledDate] = useState('2026-10-20');
  const [noteIsPeriodic, setNoteIsPeriodic] = useState(false);
  const [noteRecurrenceInterval, setNoteRecurrenceInterval] = useState<RecurrenceInterval>('monthly');
  const [maintFilter, setMaintFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (apartment) {
      setArchiveMoveInDate(apartment.moveInDate || '2026-01-01');
      setNextMonthlyFee(apartment.monthlyFee);
      setResidentReceiptFilter('all');
    }
  }, [apartment?.id]);

  if (!apartment) return null;

  const aptRevenues = revenues.filter(r => r.unitId === apartment.id);
  const totalPaid = aptRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0) + (apartment.initialBalance || 0);
  const previousTenants = apartment.previousTenants || [];

  const filteredAptRevenues =
    residentReceiptFilter === 'all'
      ? aptRevenues
      : aptRevenues.filter(r => r.residentName === residentReceiptFilter);

  // Filter maintenance notes for this apartment
  const aptNotes = maintenanceNotes.filter(n => n.apartmentId === apartment.id);
  const pendingNotesCount = aptNotes.filter(n => n.status !== 'resolved').length;

  const filteredNotes = aptNotes.filter(n => {
    if (maintFilter === 'pending') return n.status !== 'resolved';
    if (maintFilter === 'resolved') return n.status === 'resolved';
    return true;
  });

  // Clean phone number for WhatsApp
  const cleanPhone = apartment.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone;

  const handleDelete = () => {
    if (!confirmDeleteUnit) {
      setConfirmDeleteUnit(true);
      return;
    }
    deleteApartment(apartment.id);
    onClose();
  };

  const handleArchiveTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nextResidentMode !== 'vacant' && !nextResidentName.trim()) return;

    const outgoingName = apartment.residentName;
    const archived = archiveCurrentTenant(apartment.id, {
      moveInDate: archiveMoveInDate,
      moveOutDate: archiveMoveOutDate,
      exitReason: archiveExitReason,
      notes: archiveNotes,
      nextResidentMode,
      nextResidentName:
        nextResidentMode === 'vacant'
          ? `وحدة شاغرة (شقة ${apartment.number})`
          : nextResidentName.trim(),
      nextResidentPhone: nextResidentPhone.trim(),
      nextResidentNationalId: nextResidentNationalId.trim() || undefined,
      nextMonthlyFee: Number(nextMonthlyFee),
      nextMoveInDate,
    });

    if (archived) {
      setShowArchiveForm(false);
      setNextResidentName('');
      setNextResidentPhone('');
      setNextResidentNationalId('');
      setArchiveNotes('');
      setArchiveSuccessMsg(
        `تمت أرشفة سجل المستأجر السابق (${outgoingName}) بنجاح في السجل التاريخي لشقة (${apartment.number}) مع الاحتفاظ بكافة البيانات والإيصالات المالية مرتبطة بالشقة دون حذفها!`
      );
      setTimeout(() => setArchiveSuccessMsg(null), 6000);
    }
  };

  const handleAddManualHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const monthsDiff = Math.max(
      1,
      Math.round(
        (new Date(manualMoveOut).getTime() - new Date(manualMoveIn).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    );

    if (editingHistoryRecordId) {
      updateArchivedTenantRecord(apartment.id, editingHistoryRecordId, {
        residentName: manualName.trim(),
        phone: manualPhone.trim() || 'غير مسجل',
        moveInDate: manualMoveIn,
        moveOutDate: manualMoveOut,
        monthlyFee: Number(manualMonthlyFee) || apartment.monthlyFee,
        totalPaidDuringTenancy: Number(manualTotalPaid) || 0,
        receiptsCount: monthsDiff,
        exitReason: manualExitReason.trim() || 'انتهاء مدة الإيجار',
      });
    } else {
      addHistoricalTenantRecord(apartment.id, {
        residentName: manualName.trim(),
        phone: manualPhone.trim() || 'غير مسجل',
        moveInDate: manualMoveIn,
        moveOutDate: manualMoveOut,
        monthlyFee: Number(manualMonthlyFee) || apartment.monthlyFee,
        totalPaidDuringTenancy: Number(manualTotalPaid) || 0,
        receiptsCount: monthsDiff,
        exitReason: manualExitReason.trim() || 'انتهاء مدة الإيجار',
      });
    }

    setManualName('');
    setManualPhone('');
    setEditingHistoryRecordId(null);
    setShowAddManualHistoryForm(false);
    setArchiveSuccessMsg(
      editingHistoryRecordId
        ? `تم تحديث السجل التاريخي للمستأجر السابق بملف شقة (${apartment.number}) بنجاح.`
        : `تمت إضافة السجل التاريخي للمستأجر السابق بملف شقة (${apartment.number}) بنجاح.`
    );
    setTimeout(() => setArchiveSuccessMsg(null), 4000);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    if (editingNoteId) {
      updateMaintenanceNote(editingNoteId, {
        title: noteTitle.trim(),
        category: noteCategory,
        priority: notePriority,
        costEstimate: noteCostEstimate ? Number(noteCostEstimate) : undefined,
        assignedTo: noteAssignedTo.trim() || undefined,
        description: noteDescription.trim() || undefined,
        scheduledDate: noteScheduledDate || undefined,
        isPeriodic: noteIsPeriodic,
        recurrenceInterval: noteIsPeriodic ? noteRecurrenceInterval : undefined,
      });
    } else {
      addMaintenanceNote({
        apartmentId: apartment.id,
        unitNumber: apartment.number,
        title: noteTitle.trim(),
        category: noteCategory,
        priority: notePriority,
        status: 'pending',
        costEstimate: noteCostEstimate ? Number(noteCostEstimate) : undefined,
        assignedTo: noteAssignedTo.trim() || undefined,
        description: noteDescription.trim() || undefined,
        scheduledDate: noteScheduledDate || undefined,
        isPeriodic: noteIsPeriodic,
        recurrenceInterval: noteIsPeriodic ? noteRecurrenceInterval : undefined,
      });
    }

    // Reset Form
    setNoteTitle('');
    setNoteCategory('plumbing');
    setNotePriority('medium');
    setNoteCostEstimate('');
    setNoteAssignedTo('');
    setNoteDescription('');
    setNoteScheduledDate('2026-10-20');
    setNoteIsPeriodic(false);
    setNoteRecurrenceInterval('monthly');
    setEditingNoteId(null);
    setShowAddNoteForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-r border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <ApartmentAvatar
              unitNumber={apartment.number}
              avatarIcon={apartment.avatarIcon}
              avatarColor={apartment.avatarColor}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-bold text-xs border border-indigo-400/30">
                  الدور {apartment.floor}
                </span>
                <span className="text-xs text-slate-300">
                  {apartment.isVacant
                    ? '🏢 شاغرة حالياً'
                    : apartment.residentType === 'owner'
                    ? '👑 مالك'
                    : '🔑 مستأجر'}
                </span>
                {previousTenants.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                    {previousTenants.length} مستأجر سابق مؤرشف
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black mt-1">
                ملف تعريف شقة رقم ({apartment.number})
              </h2>
              <p className="text-sm text-slate-300 font-medium">{apartment.residentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {apartment.phone && (
              <>
                <a
                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`السلام عليكم أستاذ ${apartment.residentName}، تحياتنا من إدارة ${settings.buildingName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  واتساب
                </a>
                <a
                  href={`tel:${apartment.phone}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصال
                </a>
              </>
            )}

            {/* Send Financial Statement via Email */}
            <button
              type="button"
              onClick={() => setIsEmailReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              title="إرسال التقرير المالي وكشف الحساب عبر البريد الإلكتروني للساكن"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>إرسال كشف الحساب بالبريد</span>
            </button>

            {/* Quick button to Archive Outgoing Tenant */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tenants_history');
                  setShowArchiveForm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                title="أرشفة سجل المستأجر الحالي عند خروجه مع بقاء كافة البيانات المالية مرتبطة بالشقة"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>أرشفة المستأجر عند الخروج</span>
              </button>
            )}
          </div>
          {!isReadOnly ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(apartment)}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition"
                title="تعديل البيانات"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                title="حذف الشقة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
              <Lock className="w-3 h-3" />
              <span>للقراءة فقط</span>
            </span>
          )}
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-3 pt-2 gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('finance')}
            className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'finance'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>المالية والإيصالات</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants_history')}
            className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'tenants_history'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>سجل المستأجرين والأرشفة</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
              {previousTenants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'maintenance'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>الصيانة</span>
            {pendingNotesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingNotesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-2.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>بيانات الوحدة</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Feedback Banner for Tenant Archiving */}
          {archiveSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-start justify-between gap-2 shadow-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{archiveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setArchiveSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[11px] underline shrink-0"
              >
                إخفاء
              </button>
            </div>
          )}

          {/* TAB 1: FINANCIAL OVERVIEW */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Quick Financial Overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    الموقف المالي للشقة
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    البيانات المالية مرتبطة دائماً بالشقة ({apartment.number})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">الاشتراك الشهري</span>
                    <span className="font-bold text-slate-900 text-base">
                      {formatMoney(apartment.monthlyFee, settings.currency)}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">إجمالي ما تم سداده للشقة</span>
                    <span className="font-bold text-emerald-600 text-base">
                      {formatMoney(totalPaid, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Overdue Tenant Action in Drawer */}
                {apartment.residentType === 'tenant' && totalPaid < apartment.monthlyFee && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <BellRing className="w-4 h-4 text-amber-600" />
                        تنبيه: متأخر عن سداد الرسوم
                      </span>
                      <span className="text-rose-600 font-bold">
                        مطلوب: {formatMoney(apartment.monthlyFee - totalPaid, settings.currency)}
                      </span>
                    </div>
                    {apartment.lastReminderDate && (
                      <p className="text-[10px] text-slate-500">
                        آخر تذكير أرسل للساكن: {apartment.lastReminderDate}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsReminderOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition shadow-2xs"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      إرسال إشعار تذكير للمستأجر عبر واتساب
                    </button>
                  </div>
                )}

                <button
                  onClick={() => onCollectPayment(apartment.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  تسجيل دفعة / سند قبض جديد
                </button>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <HistoryIcon className="w-3.5 h-3.5" />
                    سجل إيصالات السداد المرتبطة بالشقة ({filteredAptRevenues.length})
                  </h4>
                  {previousTenants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('tenants_history')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>عرض سجل المستأجرين التاريخي ({previousTenants.length})</span>
                    </button>
                  )}
                </div>

                {/* Filter Receipts by Resident if unit has multiple resident names */}
                {Array.from(new Set(aptRevenues.map(r => r.residentName))).length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                    <span className="text-slate-400 font-bold">تصفية حسب الساكن:</span>
                    <button
                      type="button"
                      onClick={() => setResidentReceiptFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        residentReceiptFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      الكل ({aptRevenues.length})
                    </button>
                    {Array.from(new Set(aptRevenues.map(r => r.residentName))).map(rName => (
                      <button
                        key={rName}
                        type="button"
                        onClick={() => setResidentReceiptFilter(rName)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          residentReceiptFilter === rName
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {rName}
                      </button>
                    ))}
                  </div>
                )}

                {filteredAptRevenues.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    لا توجد مدفوعات مسجلة لهذه الشقة بعد.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAptRevenues.map(rev => (
                      <div
                        key={rev.id}
                        className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between transition group shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-800">{rev.receiptNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {rev.monthTarget || rev.date}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                              الساكن: {rev.residentName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {REVENUE_CATEGORY_LABELS[rev.category] || rev.category}
                            {rev.notes ? ` - ${rev.notes}` : ''}
                          </div>
                        </div>
                        <div className="text-left flex items-center gap-1.5">
                          <span className="font-black text-sm text-emerald-600 ml-1">
                            {formatMoney(rev.amount, settings.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onViewReceipt(rev)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="عرض وطباعة الإيصال"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {!isReadOnly && onEditRevenue && (
                            <button
                              type="button"
                              data-testid={`drawer-edit-revenue-btn-${rev.id}`}
                              onClick={() => onEditRevenue(rev)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="تعديل بيانات سند القبض أو المبلغ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isReadOnly && (
                            confirmDeleteRevenueId === rev.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  data-testid={`drawer-confirm-delete-revenue-btn-${rev.id}`}
                                  onClick={() => {
                                    deleteRevenue(rev.id);
                                    setConfirmDeleteRevenueId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  تأكيد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteRevenueId(null)}
                                  className="px-1.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-testid={`drawer-delete-revenue-btn-${rev.id}`}
                                onClick={() => setConfirmDeleteRevenueId(rev.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف السند / إلغاء الدفعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HISTORICAL TENANTS LOG & ARCHIVE ON MOVE-OUT (سجل المستأجرين التاريخي وأرشفة الخروج) */}
          {activeTab === 'tenants_history' && (
            <div className="space-y-5">
              {/* Current Resident & Archive Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                      <UserCheck className="w-3 h-3" />
                      الساكن المسجل حالياً بالوحدة
                    </span>
                    <h3 className="font-black text-base mt-1.5">{apartment.residentName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                      <span>
                        الصفة:{' '}
                        <strong className="text-white">
                          {apartment.isVacant
                            ? 'شاغرة حالياً'
                            : apartment.residentType === 'tenant'
                            ? 'مستأجر'
                            : 'مالك مقيم'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        تاريخ بداية السكن:{' '}
                        <strong className="text-amber-300 font-mono">
                          {apartment.moveInDate || apartment.createdAt}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {!showArchiveForm && (
                    <button
                      type="button"
                      onClick={() => setShowArchiveForm(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition shadow-sm shrink-0"
                    >
                      <Archive className="w-4 h-4" />
                      <span>أرشفة عند الخروج</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    عند خروج المستأجر وأرشفته، تبقى كافة البيانات والإيصالات المالية ({aptRevenues.length} إيصال بإجمالي{' '}
                    {formatMoney(totalPaid, settings.currency)}) مرتبطة بالشقة رقم ({apartment.number}) دون حذفها.
                  </span>
                </div>
              </div>

              {/* Archive Outgoing Tenant Interactive Form */}
              {showArchiveForm && (
                <form
                  onSubmit={handleArchiveTenantSubmit}
                  className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
                        <Archive className="w-4 h-4 text-amber-600" />
                        <span>أرشفة سجل المستأجر الحالي ({apartment.residentName}) عند الخروج</span>
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        سيتم نقل بيانات المستأجر الحالي إلى السجل التاريخي للشقة مع بقاء كافة الإيصالات المالية محفوظة باسم الشقة
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowArchiveForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Step 1: Outgoing Tenant Period & Exit Reason */}
                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      ١. بيانات فترة إقامة وإخلاء الساكن المغادر ({apartment.residentName}):
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          تاريخ بداية الإيجار / السكن
                        </label>
                        <input
                          type="date"
                          value={archiveMoveInDate}
                          onChange={e => setArchiveMoveInDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-slate-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          تاريخ الخروج والإخلاء *
                        </label>
                        <input
                          type="date"
                          value={archiveMoveOutDate}
                          onChange={e => setArchiveMoveOutDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        سبب الإخلاء / ملاحظة إنهاء التعاقد
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: انتهاء مدة عقد الإيجار بالتراضي وتصفية الحساب..."
                        value={archiveExitReason}
                        onChange={e => setArchiveExitReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ملاحظات إضافية في الأرشيف (اختياري)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: تم تسليم كافة المفاتيح ومراجعة عداد المياه والكهرباء"
                        value={archiveNotes}
                        onChange={e => setArchiveNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Step 2: What happens to the apartment after move-out? */}
                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span>٢. حالة الشقة بعد خروج المستأجر:</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setNextResidentMode('new_tenant')}
                        className={`py-2 px-2 rounded-xl font-bold border text-center transition ${
                          nextResidentMode === 'new_tenant'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🔑 تسكين مستأجر جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => setNextResidentMode('owner_return')}
                        className={`py-2 px-2 rounded-xl font-bold border text-center transition ${
                          nextResidentMode === 'owner_return'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        👑 عودة المالك للشقة
                      </button>
                      <button
                        type="button"
                        onClick={() => setNextResidentMode('vacant')}
                        className={`py-2 px-2 rounded-xl font-bold border text-center transition ${
                          nextResidentMode === 'vacant'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🏢 شاغرة مؤقتاً
                      </button>
                    </div>

                    {nextResidentMode !== 'vacant' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {nextResidentMode === 'new_tenant'
                              ? 'اسم المستأجر الجديد *'
                              : 'اسم المالك المقيم *'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: أ. خالد عبد العزيز"
                            value={nextResidentName}
                            onChange={e => setNextResidentName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            رقم الهاتف (واتساب)
                          </label>
                          <input
                            type="tel"
                            placeholder="010XXXXXXXX"
                            value={nextResidentPhone}
                            onChange={e => setNextResidentPhone(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            تاريخ استلام الشقة
                          </label>
                          <input
                            type="date"
                            value={nextMoveInDate}
                            onChange={e => setNextMoveInDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            الاشتراك الشهري ({settings.currency})
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={nextMonthlyFee}
                            onChange={e => setNextMonthlyFee(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowArchiveForm(false)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-sm"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>تأكيد أرشفة المستأجر وحفظ السجل التاريخي</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Historical Tenants Log Header & Add Manual Record */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <HistoryIcon className="w-4 h-4 text-indigo-600" />
                    <span>سجل المستأجرين التاريخي للوحدة ({previousTenants.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    أرشيف كامل للمستأجرين السابقين وفترات إقامتهم وإجمالي مساهماتهم المالية بالشقة
                  </p>
                </div>

                {!showAddManualHistoryForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddManualHistoryForm(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة سجل سابق</span>
                  </button>
                )}
              </div>

              {/* Manual Add Historical Tenant Form */}
              {showAddManualHistoryForm && (
                <form
                  onSubmit={handleAddManualHistorySubmit}
                  className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <span>إضافة سجل مستأجر سابق للأرشيف التاريخي</span>
                    <button
                      type="button"
                      onClick={() => setShowAddManualHistoryForm(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        اسم المستأجر السابق *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: أ. مصطفى كامل"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        رقم الهاتف
                      </label>
                      <input
                        type="text"
                        placeholder="010XXXXXXXX"
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        تاريخ الدخول
                      </label>
                      <input
                        type="date"
                        value={manualMoveIn}
                        onChange={e => setManualMoveIn(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        تاريخ الخروج
                      </label>
                      <input
                        type="date"
                        value={manualMoveOut}
                        onChange={e => setManualMoveOut(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الاشتراك الشهري ({settings.currency})
                      </label>
                      <input
                        type="number"
                        value={manualMonthlyFee}
                        onChange={e => setManualMonthlyFee(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        إجمالي ما سدده خلال إقامته ({settings.currency})
                      </label>
                      <input
                        type="number"
                        value={manualTotalPaid}
                        onChange={e => setManualTotalPaid(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      سبب الإخلاء / ملاحظات
                    </label>
                    <input
                      type="text"
                      value={manualExitReason}
                      onChange={e => setManualExitReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddManualHistoryForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                    >
                      حفظ في السجل التاريخي
                    </button>
                  </div>
                </form>
              )}

              {/* Historical Tenants Timeline List */}
              {previousTenants.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">
                    لا توجد سجلات مؤرشفة لمستأجرين سابقين في هذه الشقة حتى الآن.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    عند خروج المستأجر الحالي يمكنك الضغط على «أرشفة عند الخروج» أعلاه لحفظ سجله التاريخي دون حذف البيانات المالية.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {previousTenants.map((pt, idx) => (
                    <div
                      key={pt.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-black text-xs shrink-0">
                            #{previousTenants.length - idx}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-black text-sm text-slate-900">
                                {pt.residentName}
                              </h5>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                مستأجر سابق مؤرشف
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              {pt.phone && (
                                <span className="font-mono" dir="ltr">
                                  📞 {pt.phone}
                                </span>
                              )}
                              {pt.nationalId && (
                                <span className="font-mono">هوية: {pt.nationalId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isReadOnly && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              data-testid={`edit-archived-tenant-btn-${pt.id}`}
                              onClick={() => {
                                setEditingHistoryRecordId(pt.id);
                                setManualName(pt.residentName);
                                setManualPhone(pt.phone);
                                setManualMoveIn(pt.moveInDate);
                                setManualMoveOut(pt.moveOutDate);
                                setManualMonthlyFee(pt.monthlyFee);
                                setManualTotalPaid(pt.totalPaidDuringTenancy);
                                setManualExitReason(pt.exitReason || '');
                                setShowAddManualHistoryForm(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="تعديل بيانات هذا السجل المؤرشف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteHistoryId === pt.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteArchivedTenantRecord(apartment.id, pt.id);
                                    setConfirmDeleteHistoryId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  تأكيد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteHistoryId(null)}
                                  className="px-1.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteHistoryId(pt.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="حذف هذا السجل المؤرشف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tenancy Dates & Financial Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">فترة الإقامة والإيجار</span>
                          <span className="font-bold text-slate-800 font-mono text-[11px]">
                            من {pt.moveInDate} إلى {pt.moveOutDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">الاشتراك وقت الإقامة</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {formatMoney(pt.monthlyFee, settings.currency)} / شهرياً
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            إجمالي المسدد (مرتبط بالشقة)
                          </span>
                          <span className="font-black text-emerald-600 font-mono">
                            {formatMoney(pt.totalPaidDuringTenancy, settings.currency)} ({pt.receiptsCount} إيصال)
                          </span>
                        </div>
                      </div>

                      {(pt.exitReason || pt.notes) && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 space-y-1">
                          {pt.exitReason && (
                            <div>
                              <strong className="text-amber-900">سبب الخروج: </strong>
                              <span>{pt.exitReason}</span>
                            </div>
                          )}
                          {pt.notes && (
                            <div className="text-slate-500">
                              <strong>ملاحظات: </strong>
                              <span>{pt.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MAINTENANCE NOTES (ملاحظات الصيانة والأعطال) */}
          {activeTab === 'maintenance' && (
            <div className="space-y-5">
              {/* Header & Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <span>ملاحظات وأعطال صيانة الشقة</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    سجل الأعطال الداخلية، تسريبات المياه، طلبات الإصلاح والفنيين
                  </p>
                </div>
                {!showAddNoteForm && (
                  <button
                    onClick={() => setShowAddNoteForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    عطل جديد
                  </button>
                )}
              </div>

              {/* Form to Add Maintenance Note */}
              {showAddNoteForm && (
                <form
                  onSubmit={handleCreateNote}
                  className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-indigo-100">
                    <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                      تسجيل طلب صيانة / عطل بالوحدة
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddNoteForm(false)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      عنوان العطل / الإصلاح المطلوب *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تسريب مياه بمحبس الحمام، إصلاح زر الجرس..."
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  {/* Category & Priority */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        نوع العطل
                      </label>
                      <select
                        value={noteCategory}
                        onChange={e => setNoteCategory(e.target.value as MaintenanceCategory)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([cat, label]) => (
                          <option key={cat} value={cat}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        درجة الأولوية
                      </label>
                      <select
                        value={notePriority}
                        onChange={e => setNotePriority(e.target.value as MaintenancePriority)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="low">منخفضة</option>
                        <option value="medium">متوسطة</option>
                        <option value="high">عالية</option>
                        <option value="urgent">عاجلة / طارئة</option>
                      </select>
                    </div>
                  </div>

                  {/* Cost & Assigned Tech */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        التكلفة التقديرية ({settings.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="اختياري (مثال: 150)"
                        value={noteCostEstimate}
                        onChange={e => setNoteCostEstimate(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الفني أو المكلف بالإصلاح
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: السباك جمعة"
                        value={noteAssignedTo}
                        onChange={e => setNoteAssignedTo(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Scheduling & Periodic Maintenance Reminder */}
                  <div className="p-3 rounded-xl bg-white border border-indigo-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>موعد الصيانة المجدول / التذكير:</span>
                      </label>
                      <input
                        type="date"
                        value={noteScheduledDate}
                        onChange={e => setNoteScheduledDate(e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-indigo-900">
                        <input
                          type="checkbox"
                          checked={noteIsPeriodic}
                          onChange={e => setNoteIsPeriodic(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                        <span>جدولة كصيانة دورية متكررة (تذكير تلقائي)</span>
                      </label>

                      {noteIsPeriodic && (
                        <select
                          value={noteRecurrenceInterval}
                          onChange={e => setNoteRecurrenceInterval(e.target.value as RecurrenceInterval)}
                          className="text-[11px] px-2 py-1 rounded-lg border border-indigo-300 bg-indigo-50 font-bold text-indigo-900"
                        >
                          {Object.entries(RECURRENCE_INTERVAL_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تفاصيل إضافية عن العطل
                    </label>
                    <textarea
                      rows={2}
                      placeholder="مكان العطل بدقة وملاحظات الفحص..."
                      value={noteDescription}
                      onChange={e => setNoteDescription(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddNoteForm(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      حفظ وجدولة الصيانة
                    </button>
                  </div>
                </form>
              )}

              {/* Status Filter Pills */}
              {aptNotes.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-bold ml-1">عرض:</span>
                  <button
                    onClick={() => setMaintFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      maintFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    الكل ({aptNotes.length})
                  </button>
                  <button
                    onClick={() => setMaintFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      maintFilter === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    قيد المعالجة ({pendingNotesCount})
                  </button>
                  <button
                    onClick={() => setMaintFilter('resolved')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      maintFilter === 'resolved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    تم الإصلاح ({aptNotes.length - pendingNotesCount})
                  </button>
                </div>
              )}

              {/* Maintenance Notes List */}
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">لا توجد ملاحظات أو أعطال مسجلة لهذه الشقة.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يمكنك تدوين أي طلب صيانة بالضغط على زر "عطل جديد" أعلاه.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotes.map(note => {
                    const isResolved = note.status === 'resolved';
                    const isInProgress = note.status === 'in_progress';

                    // Priority styling
                    let priorityBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {MAINTENANCE_PRIORITY_LABELS[note.priority]}
                      </span>
                    );
                    if (note.priority === 'urgent') {
                      priorityBadge = (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          عاجلة جداً
                        </span>
                      );
                    } else if (note.priority === 'high') {
                      priorityBadge = (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                          أولوية عالية
                        </span>
                      );
                    }

                    // Status styling
                    let statusBadge = (
                      <button
                        type="button"
                        onClick={() => toggleMaintenanceStatus(note.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center gap-1 transition"
                        title="انقر لتغيير الحالة إلى: جاري الإصلاح"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>قيد الانتظار</span>
                      </button>
                    );
                    if (isInProgress) {
                      statusBadge = (
                        <button
                          type="button"
                          onClick={() => toggleMaintenanceStatus(note.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center gap-1 transition"
                          title="انقر لتغيير الحالة إلى: تم الإصلاح"
                        >
                          <Wrench className="w-3 h-3 text-blue-600 animate-spin" />
                          <span>جاري الإصلاح</span>
                        </button>
                      );
                    } else if (isResolved) {
                      statusBadge = (
                        <button
                          type="button"
                          onClick={() => toggleMaintenanceStatus(note.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center gap-1 transition"
                          title="انقر لإعادة فتح الطلب"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>تم الإصلاح</span>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={note.id}
                        className={`p-4 rounded-2xl border transition shadow-2xs ${
                          isResolved
                            ? 'bg-slate-50/70 border-slate-200 opacity-80'
                            : isInProgress
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-800">
                                {note.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {MAINTENANCE_CATEGORY_LABELS[note.category] || note.category}
                              </span>
                              {priorityBadge}
                            </div>
                            {note.description && (
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                                {note.description}
                              </p>
                            )}
                          </div>

                          {!isReadOnly && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                data-testid={`edit-maint-note-btn-${note.id}`}
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setNoteTitle(note.title);
                                  setNoteCategory(note.category);
                                  setNotePriority(note.priority);
                                  setNoteCostEstimate(note.costEstimate !== undefined ? String(note.costEstimate) : '');
                                  setNoteAssignedTo(note.assignedTo || '');
                                  setNoteDescription(note.description || '');
                                  setNoteScheduledDate(note.scheduledDate || '2026-10-20');
                                  setNoteIsPeriodic(Boolean(note.isPeriodic));
                                  setNoteRecurrenceInterval(note.recurrenceInterval || 'monthly');
                                  setShowAddNoteForm(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                                title="تعديل بيانات طلب الصيانة"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteNoteId === note.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      deleteMaintenanceNote(note.id);
                                      setConfirmDeleteNoteId(null);
                                    }}
                                    className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg transition"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteNoteId(null)}
                                    className="px-1.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg transition"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNoteId(note.id)}
                                  className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition"
                                  title="حذف العطل"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Note Metadata Bar */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {note.costEstimate !== undefined && (
                              <span className="font-bold text-slate-700 flex items-center gap-0.5">
                                <DollarSign className="w-3 h-3 text-emerald-600" />
                                التقدير: {formatMoney(note.costEstimate, settings.currency)}
                              </span>
                            )}
                            {note.assignedTo && (
                              <span className="text-slate-600">
                                الفني: <span className="font-semibold text-slate-800">{note.assignedTo}</span>
                              </span>
                            )}
                            {note.scheduledDate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-[10px]">
                                <Calendar className="w-3 h-3 text-indigo-600" />
                                موعد الصيانة: {note.scheduledDate}
                              </span>
                            )}
                            {note.isPeriodic && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 text-[10px] font-bold">
                                <Repeat className="w-3 h-3 text-violet-600" />
                                دورية ({RECURRENCE_INTERVAL_LABELS[note.recurrenceInterval || 'monthly']})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {note.isPeriodic && note.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => advancePeriodicMaintenance(note.id)}
                                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition"
                                title="إتمام الدورة الحالية وجدولة الموعد القادم تلقائياً"
                              >
                                جدولة الدورة القادمة
                              </button>
                            )}
                            {statusBadge}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESIDENT & UNIT INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  بيانات التواصل وملف تعريف الشقة
                </h4>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">حالة إشغال الوحدة:</span>
                    <span className="font-bold text-slate-900">
                      {apartment.isVacant
                        ? 'شاغرة حالياً'
                        : apartment.residentType === 'tenant'
                        ? 'مؤجرة (مستأجر مقيم)'
                        : 'مملوكة (مالك مقيم)'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">تاريخ بداية السكن الحالي:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {apartment.moveInDate || apartment.createdAt}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="font-semibold text-slate-800" dir="ltr">{apartment.phone || 'غير مسجل'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">البريد الإلكتروني:</span>
                    <span className="font-semibold text-indigo-700 font-mono text-xs" dir="ltr">
                      {apartment.email || 'غير مسجل'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">الرقم القومي:</span>
                    <span className="font-semibold text-slate-800" dir="ltr">{apartment.nationalId || 'غير مسجل'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">عدد المقيمين:</span>
                    <span className="font-semibold text-slate-800">{apartment.occupantsCount || 1} أفراد</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">موقف السيارة:</span>
                    <span className="font-semibold text-slate-800">{apartment.parkingSlot || 'بدون موقف'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">سجل المستأجرين السابقين:</span>
                    <span className="font-bold text-indigo-700">
                      {previousTenants.length} سجل مؤرشف
                    </span>
                  </div>
                  {apartment.notes && (
                    <div className="py-2.5">
                      <span className="text-slate-500 block mb-1">ملاحظات عامة:</span>
                      <p className="text-xs text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        {apartment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Archive & History Card inside Unit Info Tab */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-indigo-600" />
                      <span>أرشفة المستأجرين وسجل الوحدة التاريخي</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      يمكنك أرشفة بيانات المستأجر الحالي عند خروجه واستعراض السجل التاريخي للمستأجرين السابقين مع بقاء البيانات المالية مرتبطة بالشقة.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('tenants_history');
                        setShowArchiveForm(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition text-center"
                    >
                      أرشفة المستأجر عند الخروج
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('tenants_history')}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold transition text-center"
                  >
                    عرض السجل التاريخي ({previousTenants.length})
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {isReminderOpen && (
        <TenantReminderModal
          apartment={apartment}
          overdueAmount={apartment.monthlyFee - totalPaid}
          monthTarget={selectedMonth}
          onClose={() => setIsReminderOpen(false)}
        />
      )}

      <EmailDispatchModal
        isOpen={isEmailReportOpen}
        onClose={() => setIsEmailReportOpen(false)}
        mode="report"
        initialApartment={apartment}
        targetMonth={selectedMonth}
      />

    </div>
  );
};
