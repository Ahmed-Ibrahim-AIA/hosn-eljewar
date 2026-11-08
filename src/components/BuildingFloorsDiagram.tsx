import React, { useState } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  calculateApartmentsBalances,
  getCurrentMonthUnpaidUnits,
  buildFloorsDiagramData,
  formatMoney,
} from '../utils/finance';
import { ApartmentAvatar } from './ApartmentAvatar';
import {
  Building2,
  Crown,
  Key,
  Users,
  Car,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  CreditCard,
  Eye,
  X,
  ArrowUpDown,
  Layers,
  Droplets,
  ShieldCheck,
} from 'lucide-react';

interface BuildingFloorsDiagramProps {
  onSelectUnit: (unitId: string) => void;
  onCollectPayment: (unitId: string) => void;
  onCloseModal?: () => void;
  isModal?: boolean;
}

export const BuildingFloorsDiagram: React.FC<BuildingFloorsDiagramProps> = ({
  onSelectUnit,
  onCollectPayment,
  onCloseModal,
  isModal = false,
}) => {
  const { apartments, revenues, settings, selectedMonth, maintenanceNotes } = useBuilding();
  const [highlightFilter, setHighlightFilter] = useState<'all' | 'owner' | 'tenant' | 'late'>('all');

  const balances = calculateApartmentsBalances(apartments, revenues, 1);
  const currentMonthLateAlerts = getCurrentMonthUnpaidUnits(apartments, revenues, selectedMonth);
  const lateUnitIds = new Set(currentMonthLateAlerts.map(a => a.apartment.id));

  const floorRows = buildFloorsDiagramData(apartments, balances, lateUnitIds);

  const totalOwners = apartments.filter(a => a.residentType === 'owner').length;
  const totalTenants = apartments.filter(a => a.residentType === 'tenant').length;
  const totalOccupants = apartments.reduce((s, a) => s + (a.occupantsCount || 0), 0);

  const content = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Diagram Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
              <span>الرسم التوضيحي لأدوار العمارة ونماذج السكان</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                {floorRows.length} طوابق • {apartments.length} شقة
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              مخطط هندسي تفاعلي يوضح توزيع الشقق في كل دور ونماذج الإشغال (ملاك / مستأجرين / روف) وحالة سداد شهر {selectedMonth}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="إغلاق المخطط"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Legend & Resident Models Filter Bar */}
      <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-600 ml-1">تصفية نماذج السكان:</span>
          <button
            type="button"
            onClick={() => setHighlightFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              highlightFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            كل الوحدات ({apartments.length})
          </button>
          <button
            type="button"
            onClick={() => setHighlightFilter('owner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              highlightFilter === 'owner'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>نموذج مالك ({totalOwners})</span>
          </button>
          <button
            type="button"
            onClick={() => setHighlightFilter('tenant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              highlightFilter === 'tenant'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>نموذج مستأجر ({totalTenants})</span>
          </button>
          <button
            type="button"
            onClick={() => setHighlightFilter('late')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              highlightFilter === 'late'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>لم يسدد شهر {selectedMonth} ({currentMonthLateAlerts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            إجمالي السكان: <strong className="text-slate-800 font-mono">{totalOccupants}</strong> فرد
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            مسدد ({apartments.length - currentMonthLateAlerts.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            متأخر ({currentMonthLateAlerts.length})
          </span>
        </div>
      </div>

      {/* Architectural Building Cross-Section */}
      <div className="p-6 bg-gradient-to-b from-sky-50/50 via-slate-50/40 to-slate-100/70 space-y-3">
        
        {/* Roof / Water Tanks & Elevator Room Crown */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800 text-white rounded-t-3xl px-5 py-3 border-b-4 border-amber-500 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>السطح العلوي (الروف) • خزانات المياه العلوية • غرفة ماكينة المصعد</span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono">
              {settings.buildingName}
            </span>
          </div>
        </div>

        {/* Floors Stack (From Top Floor down to Floor 1) */}
        <div className="max-w-5xl mx-auto space-y-3">
          {floorRows.map(floorRow => (
            <div
              key={floorRow.floor}
              className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden transition hover:border-slate-400"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Floor Label Column (Right side in RTL) */}
                <div className="lg:col-span-3 bg-slate-900 text-white p-4 flex flex-row lg:flex-col items-center lg:items-start justify-between border-b lg:border-b-0 lg:border-l border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center font-mono">
                        {floorRow.floor}
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-white">{floorRow.floorLabel}</h4>
                        <span className="text-[10px] text-slate-400 block">
                          {floorRow.apartments.length} وحدات سكنية
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floor Models Summary */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-0 lg:mt-3 text-[10px] font-bold">
                    {floorRow.ownersCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        {floorRow.ownersCount} مالك
                      </span>
                    )}
                    {floorRow.tenantsCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        {floorRow.tenantsCount} مستأجر
                      </span>
                    )}
                    {floorRow.lateCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/40">
                        {floorRow.lateCount} غير مسدد
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        مكتمل السداد
                      </span>
                    )}
                  </div>
                </div>

                {/* Floor Apartments & Elevator Shaft */}
                <div className="lg:col-span-9 p-4 bg-slate-50/60">
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-stretch">
                    
                    {/* First Apartment(s) on the Floor */}
                    <div className="md:col-span-5 space-y-3">
                      {floorRow.apartments
                        .filter((_, idx) => idx % 2 === 0)
                        .map(({ apartment, isLateForCurrentMonth }) => {
                          const isDimmed =
                            (highlightFilter === 'owner' && apartment.residentType !== 'owner') ||
                            (highlightFilter === 'tenant' && apartment.residentType !== 'tenant') ||
                            (highlightFilter === 'late' && !isLateForCurrentMonth);

                          const pendingMaintCount = maintenanceNotes.filter(
                            n => n.apartmentId === apartment.id && n.status !== 'resolved'
                          ).length;

                          return (
                            <FloorUnitCard
                              key={apartment.id}
                              apartment={apartment}
                              isLate={isLateForCurrentMonth && settings.enableLateRentAlerts !== false}
                              isDimmed={isDimmed}
                              pendingMaintCount={pendingMaintCount}
                              currency={settings.currency}
                              selectedMonth={selectedMonth}
                              onSelect={() => {
                                onSelectUnit(apartment.id);
                                if (isModal && onCloseModal) onCloseModal();
                              }}
                              onCollect={() => {
                                onCollectPayment(apartment.id);
                                if (isModal && onCloseModal) onCloseModal();
                              }}
                            />
                          );
                        })}
                    </div>

                    {/* Central Elevator & Stairs Core */}
                    <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center bg-slate-200/80 rounded-xl border border-slate-300 py-2 px-1 text-slate-600">
                      <ArrowUpDown className="w-4 h-4 text-indigo-600 mb-1" />
                      <span className="text-[9px] font-black text-center leading-tight">
                        المصعد
                        <br />
                        والسلم
                      </span>
                    </div>

                    {/* Second Apartment(s) on the Floor */}
                    <div className="md:col-span-5 space-y-3">
                      {floorRow.apartments
                        .filter((_, idx) => idx % 2 === 1)
                        .map(({ apartment, isLateForCurrentMonth }) => {
                          const isDimmed =
                            (highlightFilter === 'owner' && apartment.residentType !== 'owner') ||
                            (highlightFilter === 'tenant' && apartment.residentType !== 'tenant') ||
                            (highlightFilter === 'late' && !isLateForCurrentMonth);

                          const pendingMaintCount = maintenanceNotes.filter(
                            n => n.apartmentId === apartment.id && n.status !== 'resolved'
                          ).length;

                          return (
                            <FloorUnitCard
                              key={apartment.id}
                              apartment={apartment}
                              isLate={isLateForCurrentMonth && settings.enableLateRentAlerts !== false}
                              isDimmed={isDimmed}
                              pendingMaintCount={pendingMaintCount}
                              currency={settings.currency}
                              selectedMonth={selectedMonth}
                              onSelect={() => {
                                onSelectUnit(apartment.id);
                                if (isModal && onCloseModal) onCloseModal();
                              }}
                              onCollect={() => {
                                onCollectPayment(apartment.id);
                                if (isModal && onCloseModal) onCloseModal();
                              }}
                            />
                          );
                        })}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Ground Floor / Entrance & Garage Foundation */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 text-white rounded-b-2xl px-6 py-4 border-t-4 border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>الدور الأرضي: البوابة الرئيسية • غرفة الحارس (عم رجب) • لوحة عدادات الكهرباء والمياه</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Car className="w-4 h-4 text-amber-400" />
              <span>الجراج السكني: باكية P-01 إلى P-{String(apartments.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

interface FloorUnitCardProps {
  apartment: any;
  isLate: boolean;
  isDimmed: boolean;
  pendingMaintCount: number;
  currency: string;
  selectedMonth: string;
  onSelect: () => void;
  onCollect: () => void;
}

const FloorUnitCard: React.FC<FloorUnitCardProps> = ({
  apartment,
  isLate,
  isDimmed,
  pendingMaintCount,
  currency,
  selectedMonth,
  onSelect,
  onCollect,
}) => {
  const isOwner = apartment.residentType === 'owner';
  const isRoof = apartment.residentName.includes('روف') || apartment.notes?.includes('روف');

  return (
    <div
      className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
        isDimmed ? 'opacity-30 scale-[0.98]' : 'opacity-100'
      } ${
        isLate
          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300/60 shadow-2xs'
          : isOwner
          ? 'bg-white border-slate-200 hover:border-emerald-400 shadow-2xs'
          : 'bg-indigo-50/30 border-indigo-200 hover:border-indigo-400 shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ApartmentAvatar
            unitNumber={apartment.number}
            avatarIcon={apartment.avatarIcon}
            avatarColor={apartment.avatarColor}
            size="md"
            isAlert={isLate}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={onSelect}
                className="font-black text-xs text-slate-900 hover:text-indigo-600 cursor-pointer transition"
              >
                شقة ({apartment.number}) - {apartment.residentName}
              </span>
            </div>

            {/* Resident Model Pill */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isOwner
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                {isOwner ? <Crown className="w-3 h-3 text-amber-600" /> : <Key className="w-3 h-3 text-indigo-600" />}
                <span>{isOwner ? 'نموذج مالك' : 'نموذج مستأجر'}</span>
              </span>

              {isRoof && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  🏡 روف
                </span>
              )}

              {apartment.occupantsCount && (
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  {apartment.occupantsCount} أفراد
                </span>
              )}

              {apartment.parkingSlot && (
                <span className="text-[10px] text-slate-500 font-mono">
                  • {apartment.parkingSlot}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {apartment.monthlyFee === 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
              غير نشط / خالية
            </span>
          ) : isLate ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              متأخر ({selectedMonth})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              مسدد
            </span>
          )}

          {pendingMaintCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              <Wrench className="w-2.5 h-2.5 text-amber-700" />
              {pendingMaintCount} صيانة
            </span>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">
          الاشتراك: <strong className="text-slate-800 font-mono">{formatMoney(apartment.monthlyFee, currency)}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
          >
            <Eye className="w-3 h-3" />
            ملف الشقة
          </button>
          {isLate && (
            <button
              type="button"
              onClick={onCollect}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition shadow-2xs"
            >
              <CreditCard className="w-3 h-3" />
              تحصيل
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
