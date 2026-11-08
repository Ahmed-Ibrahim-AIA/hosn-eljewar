import React, { useState, useRef } from 'react';
import { useBuilding } from '../context/BuildingContext';
import { Apartment, ResidentType } from '../types';
import { X, Building, CheckCircle, Upload, Image as ImageIcon, RotateCcw, Archive, History as HistoryIcon } from 'lucide-react';
import { APARTMENT_ICONS, APARTMENT_COLORS, ApartmentAvatar } from './ApartmentAvatar';
import { createArchivedTenantRecord } from '../utils/finance';

interface ApartmentModalProps {
  apartmentToEdit?: Apartment | null;
  onClose: () => void;
}

export const ApartmentModal: React.FC<ApartmentModalProps> = ({
  apartmentToEdit,
  onClose,
}) => {
  const { addApartment, updateApartment, revenues, settings } = useBuilding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [number, setNumber] = useState(apartmentToEdit?.number || '');
  const [floor, setFloor] = useState<number>(apartmentToEdit?.floor ?? 1);
  const [residentName, setResidentName] = useState(apartmentToEdit?.residentName || '');
  const [residentType, setResidentType] = useState<ResidentType>(apartmentToEdit?.residentType || 'owner');
  const [phone, setPhone] = useState(apartmentToEdit?.phone || '');
  const [email, setEmail] = useState(apartmentToEdit?.email || '');
  const [nationalId, setNationalId] = useState(apartmentToEdit?.nationalId || '');
  const [occupantsCount, setOccupantsCount] = useState<number>(apartmentToEdit?.occupantsCount ?? 3);
  const [parkingSlot, setParkingSlot] = useState(apartmentToEdit?.parkingSlot || '');
  const [monthlyFee, setMonthlyFee] = useState<number>(apartmentToEdit?.monthlyFee ?? settings.defaultMonthlyFee);
  const [initialBalance, setInitialBalance] = useState<number>(apartmentToEdit?.initialBalance ?? 0);
  const [notes, setNotes] = useState(apartmentToEdit?.notes || '');
  const [moveInDate, setMoveInDate] = useState(apartmentToEdit?.moveInDate || '2026-01-01');
  const [archiveOutgoingTenant, setArchiveOutgoingTenant] = useState(false);
  const [outgoingMoveOutDate, setOutgoingMoveOutDate] = useState('2026-10-23');
  const [outgoingExitReason, setOutgoingExitReason] = useState('انتهاء مدة الإيجار وإخلاء الوحدة');
  const [avatarIcon, setAvatarIcon] = useState<string>(
    apartmentToEdit?.avatarIcon || (apartmentToEdit?.residentType === 'tenant' ? 'key' : 'crown')
  );
  const [avatarColor, setAvatarColor] = useState<string>(
    apartmentToEdit?.avatarColor || (apartmentToEdit?.residentType === 'tenant' ? 'tenant' : 'emerald')
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (result) {
        setAvatarIcon(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !residentName.trim()) return;

    let updatedPreviousTenants = apartmentToEdit?.previousTenants || [];
    if (apartmentToEdit && archiveOutgoingTenant) {
      const archived = createArchivedTenantRecord(apartmentToEdit, revenues, {
        moveInDate: apartmentToEdit.moveInDate || '2025-01-01',
        moveOutDate: outgoingMoveOutDate,
        exitReason: outgoingExitReason,
      });
      updatedPreviousTenants = [archived, ...updatedPreviousTenants];
    }

    const payload = {
      number: number.trim(),
      floor: Number(floor),
      residentName: residentName.trim(),
      residentType,
      phone: phone.trim(),
      email: email.trim() || undefined,
      nationalId: nationalId.trim() || undefined,
      occupantsCount: Number(occupantsCount),
      parkingSlot: parkingSlot.trim() || undefined,
      monthlyFee: Number(monthlyFee),
      initialBalance: Number(initialBalance),
      notes: notes.trim() || undefined,
      moveInDate: archiveOutgoingTenant ? outgoingMoveOutDate : moveInDate,
      previousTenants: updatedPreviousTenants,
      isVacant: false,
      avatarIcon,
      avatarColor,
    };

    if (apartmentToEdit) {
      updateApartment(apartmentToEdit.id, payload);
    } else {
      addApartment(payload);
    }

    onClose();
  };

  const isCustomImage = avatarIcon?.startsWith('data:image') || avatarIcon?.startsWith('http');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">
              {apartmentToEdit ? 'تعديل بيانات الشقة والساكن' : 'إضافة شقة وسكان جدد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Visual Icon / Image Selector Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ApartmentAvatar
                  unitNumber={number || '؟'}
                  avatarIcon={avatarIcon}
                  avatarColor={avatarColor}
                  size="lg"
                />
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>أيقونة أو صورة تمييز الشقة بصرياً</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    اختر رمزاً مميزاً ولوناً للشقة أو ارفع صورة مخصصة لتمييزها في واجهة العمارة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة</span>
                </button>
                {isCustomImage && (
                  <button
                    type="button"
                    onClick={() => setAvatarIcon('home')}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] transition"
                    title="استعادة الأيقونة الافتراضية"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Preset Icons Grid */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                رموز وأيقونات الشقق الجاهزة:
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {APARTMENT_ICONS.map(item => {
                  const IconComp = item.Icon;
                  const isSelected = avatarIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAvatarIcon(item.id)}
                      title={item.label}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Selector */}
            {!isCustomImage && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-slate-500">لون الشارة المميز:</span>
                <div className="flex items-center gap-1.5">
                  {APARTMENT_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAvatarColor(c.id)}
                      title={c.label}
                      className={`w-6 h-6 rounded-full ${c.bgClass} transition transform ${
                        avatarColor === c.id ? 'scale-115 ring-2 ring-offset-1 ring-indigo-500' : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unit Number & Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الشقة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: 5 أو 102"
                value={number}
                onChange={e => setNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الدور / الطابق <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={floor}
                onChange={e => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-semibold font-mono"
                required
              />
            </div>
          </div>

          {/* Archive Outgoing Tenant Option when Editing an Existing Apartment */}
          {apartmentToEdit && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={archiveOutgoingTenant}
                    onChange={e => setArchiveOutgoingTenant(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        أرشفة سجل المستأجر / الساكن الحالي ({apartmentToEdit.residentName}) عند خروجه
                      </span>
                    </span>
                    <span className="text-[11px] font-normal text-amber-800 block mt-0.5">
                      يحفظ بيانات الساكن السابق في السجل التاريخي للشقة مع بقاء كافة البيانات والإيصالات المالية مرتبطة بالشقة دون حذفها
                    </span>
                  </div>
                </label>

                {(apartmentToEdit.previousTenants?.length ?? 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <HistoryIcon className="w-3 h-3 text-amber-600" />
                    <span>{apartmentToEdit.previousTenants?.length} سجل سابق</span>
                  </span>
                )}
              </div>

              {archiveOutgoingTenant && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/80 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تاريخ إخلاء الساكن السابق ({apartmentToEdit.residentName})
                    </label>
                    <input
                      type="date"
                      value={outgoingMoveOutDate}
                      onChange={e => setOutgoingMoveOutDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      سبب الإخلاء / ملاحظة الأرشيف
                    </label>
                    <input
                      type="text"
                      value={outgoingExitReason}
                      onChange={e => setOutgoingExitReason(e.target.value)}
                      placeholder="انتهاء مدة الإيجار وإخلاء الوحدة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resident Name & Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {archiveOutgoingTenant ? 'اسم المستأجر / الساكن الجديد *' : 'اسم الساكن بالكامل *'}
              </label>
              <input
                type="text"
                placeholder="مثال: أ. محمود عزت"
                value={residentName}
                onChange={e => setResidentName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                صفة الساكن <span className="text-rose-500">*</span>
              </label>
              <select
                value={residentType}
                onChange={e => setResidentType(e.target.value as ResidentType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              >
                <option value="owner">مالك</option>
                <option value="tenant">مستأجر</option>
              </select>
            </div>
          </div>

          {/* Phone & Email & National ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف المحمول (واتساب)
              </label>
              <input
                type="tel"
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني (لإرسال الإيصالات والتقارير)
              </label>
              <input
                type="email"
                dir="ltr"
                placeholder="tenant@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-left"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الرقم القومي (اختياري)
            </label>
            <input
              type="text"
              placeholder="14 رقم"
              value={nationalId}
              onChange={e => setNationalId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
            />
          </div>

          {/* Monthly Fee & Parking */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاشتراك الشهري ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                value={monthlyFee}
                onChange={e => setMonthlyFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-emerald-700 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عدد الأفراد
              </label>
              <input
                type="number"
                min="1"
                value={occupantsCount}
                onChange={e => setOccupantsCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                موقف الجراج
              </label>
              <input
                type="text"
                placeholder="P-01"
                value={parkingSlot}
                onChange={e => setParkingSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الرصيد الافتتاحي السابـق ({settings.currency})
              <span className="text-slate-400 font-normal mr-1">(قيمة موجبة = رصيد دائن له، سالبة = متأخرات سابقة عليه)</span>
            </label>
            <input
              type="number"
              step="any"
              value={initialBalance}
              onChange={e => setInitialBalance(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-semibold font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات
            </label>
            <textarea
              rows={2}
              placeholder="مثال: بيانات المالك الأصلي في حالة الإيجار، أو أوقات التواجد..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              <CheckCircle className="w-4 h-4" />
              {apartmentToEdit ? 'حفظ التعديلات' : 'إضافة الشقة والساكن'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

