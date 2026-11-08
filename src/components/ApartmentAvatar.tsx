import React from 'react';
import {
  Home,
  Crown,
  Key,
  Users,
  Stethoscope,
  HardHat,
  Scale,
  Building2,
  Star,
  Shield,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export interface ApartmentIconOption {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export const APARTMENT_ICONS: ApartmentIconOption[] = [
  { id: 'home', label: 'منزل عائلي', Icon: Home },
  { id: 'crown', label: 'مالك مميز', Icon: Crown },
  { id: 'key', label: 'مستأجر', Icon: Key },
  { id: 'family', label: 'أسرة سكنية', Icon: Users },
  { id: 'doctor', label: 'طبيب / عيادة', Icon: Stethoscope },
  { id: 'engineer', label: 'مهندس', Icon: HardHat },
  { id: 'judge', label: 'مستشار / قانوني', Icon: Scale },
  { id: 'penthouse', label: 'شقة روف / علوية', Icon: Sparkles },
  { id: 'star', label: 'وحدة نجمة', Icon: Star },
  { id: 'shield', label: 'لجنة العمارة', Icon: Shield },
  { id: 'briefcase', label: 'أعمال / إداري', Icon: Briefcase },
  { id: 'building', label: 'وحدة سكنية', Icon: Building2 },
];

export interface ApartmentColorOption {
  id: string;
  label: string;
  bgClass: string;
  ringClass: string;
}

export const APARTMENT_COLORS: ApartmentColorOption[] = [
  { id: 'emerald', label: 'زمردي', bgClass: 'bg-emerald-600 text-white', ringClass: 'ring-emerald-300' },
  { id: 'indigo', label: 'نيلي', bgClass: 'bg-indigo-600 text-white', ringClass: 'ring-indigo-300' },
  { id: 'amber', label: 'كهرماني', bgClass: 'bg-amber-600 text-white', ringClass: 'ring-amber-300' },
  { id: 'cyan', label: 'سماوي', bgClass: 'bg-cyan-600 text-white', ringClass: 'ring-cyan-300' },
  { id: 'violet', label: 'بنفسجي', bgClass: 'bg-violet-600 text-white', ringClass: 'ring-violet-300' },
  { id: 'rose', label: 'ياقوتي', bgClass: 'bg-rose-600 text-white', ringClass: 'ring-rose-300' },
  { id: 'slate', label: 'داكن رسمي', bgClass: 'bg-slate-900 text-white', ringClass: 'ring-slate-400' },
];

interface ApartmentAvatarProps {
  unitNumber: string;
  avatarIcon?: string;
  avatarColor?: string;
  size?: 'sm' | 'md' | 'lg';
  isAlert?: boolean;
}

export const ApartmentAvatar: React.FC<ApartmentAvatarProps> = ({
  unitNumber,
  avatarIcon = 'home',
  avatarColor = 'slate',
  size = 'md',
  isAlert = false,
}) => {
  const isCustomImage =
    avatarIcon?.startsWith('data:image') || avatarIcon?.startsWith('http');

  const colorObj =
    APARTMENT_COLORS.find(c => c.id === avatarColor) || APARTMENT_COLORS[6];
  const iconObj =
    APARTMENT_ICONS.find(i => i.id === avatarIcon) || APARTMENT_ICONS[0];
  const IconComp = iconObj.Icon;

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-sm',
    lg: 'w-14 h-14 rounded-2xl text-base',
  }[size];

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (isCustomImage) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border-2 ${
          isAlert ? 'border-rose-500 ring-2 ring-rose-300' : 'border-slate-200'
        } ${sizeClasses} bg-slate-100 flex items-center justify-center shadow-2xs`}
        title={`شقة ${unitNumber}`}
      >
        <img
          src={avatarIcon}
          alt={`شقة ${unitNumber}`}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-black font-mono text-center leading-tight py-0.5">
          #{unitNumber}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex flex-col items-center justify-center font-mono font-black shadow-2xs transition ${sizeClasses} ${
        isAlert ? 'bg-rose-600 text-white ring-2 ring-rose-300' : colorObj.bgClass
      }`}
      title={`شقة ${unitNumber} - ${iconObj.label}`}
    >
      <IconComp className={`${iconSizeClasses} opacity-95`} />
      <span className="text-[10px] leading-none mt-0.5 font-mono font-black">
        {unitNumber}
      </span>
    </div>
  );
};
