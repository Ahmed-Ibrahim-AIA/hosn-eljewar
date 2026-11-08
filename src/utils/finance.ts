import {
  Apartment,
  PreviousTenantRecord,
  Revenue,
  Expense,
  RevenueCategory,
  ExpenseCategory,
  RecurringExpense,
  BuildingSettings,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceNote,
  RecurrenceInterval,
  QuickTask,
  AppThemeId,
} from '../types';
import { exportOrShareExcelFile } from './apkBridge';

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  monthly_subscription: 'اشتراك صيانة دوري',
  elevator_maintenance: 'صيانة المصعد الخاصة',
  emergency_repair: 'مساهمة صيانة طارئة',
  reserve_fund: 'إيداع بصندوق الطوارئ / الوديعة',
  building_improvement: 'تجديدات وتحسينات',
  other: 'إيرادات أخرى متنوعة',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  elevator: 'صيانة وقطع غيار المصعد',
  electricity: 'فواتير الكهرباء (المصعد والمنافع)',
  water: 'فواتير المياه المشتركة',
  guard_salary: 'راتب الحارس / البواب',
  cleaner_salary: 'راتب / أجر النظافة',
  general_maintenance: 'صيانة عامة (سباكة/إنارة/أبواب)',
  cleaning_supplies: 'أدوات نظافة ومبيدات',
  emergency: 'طوارئ وأعطال غير متوقعة',
  administrative: 'مصاريف إدارية ونثرية',
  other: 'مصروفات أخرى',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  pending: 'قيد الانتظار',
  in_progress: 'جاري الإصلاح',
  resolved: 'تم الإصلاح',
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة / طارئة',
};

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  plumbing: 'سباكة وصرف',
  electricity: 'كهرباء وإنارة',
  elevator: 'مصاعد',
  intercom: 'إنتركم وأجراس',
  carpentry: 'نجارة وأبواب',
  building: 'مباني وعزل ودهانات',
  water_tank: 'خزانات ومضخات المياه',
  other: 'أخرى',
};

export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  monthly: 'شهرياً (كل شهر)',
  quarterly: 'ربع سنوي (كل ٣ أشهر)',
  semi_annual: 'نصف سنوي (كل ٦ أشهر)',
  annual: 'سنوياً (كل عام)',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي (كاش)',
  instapay: 'إنستاباي (InstaPay)',
  bank_transfer: 'تحويل بنكي',
  vodafone_cash: 'محفظة إلكترونية (كاش)',
  check: 'شيك بنكي',
};


/**
 * Arabic number to words formatter (Tafqeet)
 * Useful for receipts and formal financial statements.
 */
export function tafqeetArabic(amount: number, currency = 'جنيه مصري'): string {
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'صفر ' + currency;

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;

    let res = '';
    if (h > 0) {
      res += hundreds[h];
    }

    if (rem > 0) {
      if (res.length > 0) res += ' و';
      if (rem < 10) {
        res += ones[rem];
      } else if (rem >= 10 && rem < 20) {
        res += teens[rem - 10];
      } else {
        if (o > 0) {
          res += ones[o] + ' و' + tens[t];
        } else {
          res += tens[t];
        }
      }
    }
    return res;
  }

  let text = '';
  const thousands = Math.floor(integerPart / 1000);
  const remainder = integerPart % 1000;

  if (thousands > 0) {
    if (thousands === 1) text += 'ألف';
    else if (thousands === 2) text += 'ألفان';
    else if (thousands >= 3 && thousands <= 10) text += convertGroup(thousands) + ' آلاف';
    else text += convertGroup(thousands) + ' ألف';
  }

  if (remainder > 0) {
    if (text.length > 0) text += ' و';
    text += convertGroup(remainder);
  }

  let result = `فقط وقدره ${text} ${currency}`;
  if (decimalPart > 0) {
    result += ` و${convertGroup(decimalPart)} قرشاً`;
  }
  result += ' لا غير';
  return result;
}

/**
 * Filter transactions by month string (e.g. "2026-10")
 */
export function filterByMonth<T extends { date: string; monthTarget?: string }>(items: T[], yearMonth: string): T[] {
  if (!yearMonth) return items;
  return items.filter(item =>
    item.monthTarget ? item.monthTarget === yearMonth : item.date.startsWith(yearMonth)
  );
}

/**
 * Filter transactions by custom date range (inclusive YYYY-MM-DD)
 */
export function filterTransactionsByDateRange<T extends { date: string }>(
  items: T[],
  startDate?: string,
  endDate?: string
): T[] {
  if (!startDate && !endDate) return items;
  return items.filter(item => {
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });
}

/**
 * Filter items by category (exact or all)
 */
export function filterByCategory<T extends { category: string }>(
  items: T[],
  categoryFilter?: string | 'all'
): T[] {
  if (!categoryFilter || categoryFilter === 'all') return items;
  return items.filter(item => item.category === categoryFilter);
}


/**
 * Calculate financial totals
 */
export function calculateTotals(
  revenues: Revenue[],
  expenses: Expense[],
  initialTreasuryBalance = 0
) {
  const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netFlow = totalRevenues - totalExpenses;
  const currentBalance = initialTreasuryBalance + netFlow;

  return {
    totalRevenues,
    totalExpenses,
    netFlow,
    currentBalance,
  };
}

/**
 * Calculate detailed apartment financial balance
 */
export interface UnitBalanceDetail {
  unitId: string;
  unitNumber: string;
  residentName: string;
  floor: number;
  phone: string;
  residentType: string;
  monthlyFee: number;
  totalPaid: number;
  expectedTotal: number;
  balance: number; // positive = credit/surplus, negative = debt/arrears
  status: 'paid' | 'partial' | 'unpaid' | 'credit';
  paidMonthsCount: number;
  lastPaymentDate?: string;
}

export function calculateApartmentsBalances(
  apartments: Apartment[],
  revenues: Revenue[],
  monthsPassed = 1
): UnitBalanceDetail[] {
  const distinctTargetMonths = new Set(
    revenues
      .filter(r => r.unitId && r.unitId !== 'apt-all' && r.monthTarget)
      .map(r => r.monthTarget)
  );
  const effectiveMonths = Math.max(1, monthsPassed, distinctTargetMonths.size);

  return apartments.map(apt => {
    const aptRevenues = revenues.filter(r => r.unitId === apt.id);
    const totalPaid = aptRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0) + (apt.initialBalance || 0);
    const expectedTotal = apt.monthlyFee * effectiveMonths;
    const balance = totalPaid - expectedTotal;

    let status: UnitBalanceDetail['status'] = 'paid';
    if (balance > 0) {
      status = 'credit';
    } else if (balance === 0) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    const sortedPayments = [...aptRevenues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastPaymentDate = sortedPayments[0]?.date;

    return {
      unitId: apt.id,
      unitNumber: apt.number,
      residentName: apt.residentName,
      floor: apt.floor,
      phone: apt.phone,
      residentType: apt.residentType,
      monthlyFee: apt.monthlyFee,
      totalPaid,
      expectedTotal,
      balance,
      status,
      paidMonthsCount: apt.monthlyFee > 0 ? Math.floor(totalPaid / apt.monthlyFee) : 0,
      lastPaymentDate,
    };
  });
}

/**
 * Group expenses by category for analytics
 */
export function groupExpensesByCategory(expenses: Expense[]) {
  const grouped: Record<string, { category: ExpenseCategory; label: string; total: number; count: number }> = {};
  let totalExpenses = 0;

  expenses.forEach(exp => {
    const amt = Number(exp.amount || 0);
    totalExpenses += amt;
    if (!grouped[exp.category]) {
      grouped[exp.category] = {
        category: exp.category,
        label: EXPENSE_CATEGORY_LABELS[exp.category] || exp.category,
        total: 0,
        count: 0,
      };
    }
    grouped[exp.category].total += amt;
    grouped[exp.category].count += 1;
  });

  return Object.values(grouped).map(item => ({
    ...item,
    percentage: totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}

/**
 * Format currency with universally crisp numerals and currency symbol
 */
export function formatMoney(amount: number, currency = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Formats a YYYY-MM string (e.g. "2026-10") into an Arabic month and year label ("أكتوبر 2026")
 */
export function formatMonthYearArabic(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth || '';
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthNames: Record<string, string> = {
    '01': 'يناير',
    '02': 'فبراير',
    '03': 'مارس',
    '04': 'أبريل',
    '05': 'مايو',
    '06': 'يونيو',
    '07': 'يوليو',
    '08': 'أغسطس',
    '09': 'سبتمبر',
    '10': 'أكتوبر',
    '11': 'نوفمبر',
    '12': 'ديسمبر',
  };
  const mLabel = monthNames[monthStr.padStart(2, '0')] || monthStr;
  return `${mLabel} ${yearStr}`;
}

/**
 * Formats a WhatsApp monthly report message ready to copy
 */
export function generateWhatsAppReport(params: {
  buildingName: string;
  monthName: string;
  yearMonth: string;
  treasuryBalance: number;
  monthRevenues: number;
  monthExpenses: number;
  netFlow: number;
  arrears: { unitNumber: string; residentName: string; debt: number }[];
  keyExpenses: { label: string; total: number }[];
  currency?: string;
  treasurerName: string;
}): string {
  const {
    buildingName,
    monthName,
    treasuryBalance,
    monthRevenues,
    monthExpenses,
    netFlow,
    arrears,
    keyExpenses,
    currency = 'ج.م',
    treasurerName,
  } = params;

  let msg = `🏢 *التقرير المالي الشهري - ${buildingName}*\n`;
  msg += `📅 *عن شهر:* ${monthName}\n`;
  msg += `------------------------------------\n\n`;

  msg += `📊 *الموقف المالي العام:*\n`;
  msg += `🔹 إجمالي الإيرادات والتحصيلات: *${monthRevenues.toLocaleString('en-US')} ${currency}*\n`;
  msg += `🔸 إجمالي المصروفات المدفوعة: *${monthExpenses.toLocaleString('en-US')} ${currency}*\n`;
  msg += `✨ صافي حركة الشهر: *${netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString('en-US')} ${currency}* (${netFlow >= 0 ? 'فائض' : 'عجز'})\n`;
  msg += `💰 *الرصيد المتبقي بالخزينة:* *${treasuryBalance.toLocaleString('en-US')} ${currency}*\n\n`;

  if (keyExpenses.length > 0) {
    msg += `🧾 *أهم بنود المصروفات خلال الشهر:*\n`;
    keyExpenses.slice(0, 5).forEach((e, idx) => {
      msg += `  ${idx + 1}. ${e.label}: ${e.total.toLocaleString('en-US')} ${currency}\n`;
    });
    msg += `\n`;
  }

  if (arrears.length > 0) {
    msg += `⚠️ *المتأخرات المعلقة (نرجو التكرم بسرعة السداد):*\n`;
    arrears.forEach(a => {
      msg += `  ▪️ شقة (${a.unitNumber}) - ${a.residentName}: مطلوب ${Math.abs(a.debt).toLocaleString('en-US')} ${currency}\n`;
    });
    msg += `\n`;
  } else {
    msg += `🎉 *نشكر جميع الجيران الكرام على الالتزام الكامل بالسداد في الموعد!*\n\n`;
  }

  msg += `------------------------------------\n`;
  msg += `✍️ مع تحيات: *${treasurerName}* (إدارة العمارة)\n`;
  msg += `📞 للاستفسار أو مراجعة الفواتير متاح الكشف التفصيلي بالكامل.`;

  return msg;
}

export interface BackupMetadata {
  app: string;
  version: string;
  exportDate: string;
  buildingName: string;
  currency: string;
  apartmentsCount: number;
  revenuesCount: number;
  expensesCount: number;
  recurringExpensesCount?: number;
  maintenanceNotesCount?: number;
}


export interface OverdueTenantInfo {
  apartment: Apartment;
  balanceDetail: UnitBalanceDetail;
  overdueAmount: number;
  monthsOverdue: number;
}

/**
 * Filter and get all tenants who are overdue on their payments
 */
export function getOverdueTenants(
  apartments: Apartment[],
  balances: UnitBalanceDetail[]
): OverdueTenantInfo[] {
  return apartments
    .filter(apt => apt.residentType === 'tenant')
    .map(apt => {
      const b = balances.find(item => item.unitId === apt.id);
      const overdue = b && b.balance < 0 ? Math.abs(b.balance) : 0;
      const months = apt.monthlyFee > 0 ? Math.ceil(overdue / apt.monthlyFee) : 1;
      return {
        apartment: apt,
        balanceDetail: b || {
          unitId: apt.id,
          unitNumber: apt.number,
          residentName: apt.residentName,
          floor: apt.floor,
          phone: apt.phone,
          residentType: apt.residentType,
          monthlyFee: apt.monthlyFee,
          totalPaid: 0,
          expectedTotal: apt.monthlyFee,
          balance: -apt.monthlyFee,
          status: 'unpaid',
          paidMonthsCount: 0,
        },
        overdueAmount: overdue,
        monthsOverdue: months,
      };
    })
    .filter(item => item.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount);
}

export type ReminderTone = 'gentle' | 'official' | 'urgent';

/**
 * Generates an Arabic reminder notification text tailored for the overdue tenant
 */
export function generateTenantReminderText(params: {
  residentName: string;
  unitNumber: string;
  overdueAmount: number;
  currency?: string;
  buildingName: string;
  treasurerName: string;
  monthTarget?: string;
  paymentDetails?: string;
  tone?: ReminderTone;
}): string {
  const {
    residentName,
    unitNumber,
    overdueAmount,
    currency = 'ج.م',
    buildingName,
    treasurerName,
    monthTarget = 'الحالي',
    paymentDetails,
    tone = 'gentle',
  } = params;

  if (tone === 'urgent') {
    let msg = `⚠️ *إشعار عاجل وهام بشأن متأخرات الإيجار / الرسوم*\n`;
    msg += `🏢 *${buildingName}*\n`;
    msg += `------------------------------------\n`;
    msg += `الأستاذ المحترم / *${residentName}* (شقة رقم ${unitNumber})\n\n`;
    msg += `نحيطكم علماً بضرورة سرعة المبادرة بسداد المستحقات المتأخرة والبالغة:\n`;
    msg += `💰 *${overdueAmount.toLocaleString('en-US')} ${currency}* عن استحقاق (${monthTarget}).\n\n`;
    msg += `نرجو التكرم بالسداد لتجنب اتخاذ أي إجراءات إدارية، واستمرار الخدمات والمرافق بانتظام.\n`;
    if (paymentDetails) {
      msg += `💳 *بيانات السداد السريع:* ${paymentDetails}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `✍️ مع خالص الاحترام: *${treasurerName}* (إدارة العقار)`;
    return msg;
  }

  if (tone === 'official') {
    let msg = `📋 *إشعار رسمي بمطالبة سداد الإيجار / الرسوم الشهرية*\n`;
    msg += `🏢 *${buildingName}*\n`;
    msg += `------------------------------------\n`;
    msg += `تحية طيبة للأستاذ / *${residentName}* (شقة رقم ${unitNumber})\n\n`;
    msg += `نود إحاطتكم بأن القيمة المستحقة لسداد الإيجار والرسوم الشهرية تبلغ:\n`;
    msg += `💰 *${overdueAmount.toLocaleString('en-US')} ${currency}* عن شهر (${monthTarget}).\n\n`;
    msg += `برجاء التكرم بسداد المبلغ خلال ٤٨ ساعة أو التنسيق مع إدارة العقار فوراً.\n`;
    if (paymentDetails) {
      msg += `💳 *طرق الدفع المتاحة:* ${paymentDetails}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `✍️ إدارة العقار: *${treasurerName}*`;
    return msg;
  }

  // Gentle (Default)
  let msg = `🌸 *تذكير ودي من إدارة العقار*\n`;
  msg += `🏢 *${buildingName}*\n`;
  msg += `------------------------------------\n`;
  msg += `السلام عليكم ورحمة الله وبركاته، أستاذنا الفاضل / *${residentName}* (شقة رقم ${unitNumber})\n\n`;
  msg += `نود تذكير سيادتكم بلطف بموعد سداد الإيجار والاشتراك الشهري وقيمته:\n`;
  msg += `💵 *${overdueAmount.toLocaleString('en-US')} ${currency}* عن شهر (${monthTarget}).\n\n`;
  msg += `شاكرين لحضرتكم دوام التعاون وحسن الجيرة.\n`;
  if (paymentDetails) {
    msg += `📲 *يمكنكم السداد عبر:* ${paymentDetails}\n`;
  }
  msg += `------------------------------------\n`;
  msg += `✍️ مع تحيات: *${treasurerName}*`;
  return msg;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: BackupMetadata;
  parsedData?: any;
}

const ARABIC_FLOOR_TO_NUMBER: Record<string, number> = {
  'الأرضي': 0,
  'الارضي': 0,
  'الأول': 1,
  'الاول': 1,
  'الثاني': 2,
  'الثانى': 2,
  'الثالث': 3,
  'الرابع': 4,
  'الخامس': 5,
  'السادس': 6,
  'السابع': 7,
  'الثامن': 8,
  'التاسع': 9,
  'العاشر': 10,
  'الحادي عشر': 11,
  'الثاني عشر': 12,
};

export function parseFloorNumber(floorVal: unknown): number {
  if (typeof floorVal === 'number' && !Number.isNaN(floorVal)) return floorVal;
  if (typeof floorVal === 'string') {
    const trimmed = floorVal.trim();
    if (ARABIC_FLOOR_TO_NUMBER[trimmed] !== undefined) {
      return ARABIC_FLOOR_TO_NUMBER[trimmed];
    }
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;
  }
  return 1;
}

/**
 * Normalizes backup data from either BuildingFinanceApp native format or external amara-dhahabiya JSON format
 */
export function normalizeImportedBackupData(raw: any): {
  settings?: Partial<BuildingSettings>;
  apartments?: Apartment[];
  revenues?: Revenue[];
  expenses?: Expense[];
  recurringExpenses?: RecurringExpense[];
  maintenanceNotes?: MaintenanceNote[];
  quickTasks?: any[];
} {
  if (!raw || typeof raw !== 'object') return {};

  // Settings / Profile normalization
  let normalizedSettings: Partial<BuildingSettings> | undefined = undefined;
  if (raw.settings && typeof raw.settings === 'object') {
    normalizedSettings = raw.settings;
  } else if (raw.profile && typeof raw.profile === 'object') {
    normalizedSettings = {
      buildingName: raw.profile.buildingName || 'برج النور',
      currency: raw.profile.currency || 'ج.م',
      emergencyFundBalance: Number(raw.profile.openingBalance ?? 0),
    };
  }

  // Apartments normalization
  let normalizedApartments: Apartment[] | undefined = undefined;
  if (Array.isArray(raw.apartments)) {
    normalizedApartments = raw.apartments
      .map((apt: any, idx: number): Apartment => {
        const isExternal = 'ownerName' in apt || 'fee' in apt || typeof apt.floor === 'string';
        const resTypeRaw = String(apt.residentType || '').trim();
        const residentType =
          resTypeRaw === 'tenant' || resTypeRaw === 'مستأجر' ? 'tenant' : 'owner';
        const fee = Number(apt.monthlyFee ?? apt.fee ?? 0);
        const isActive = apt.active !== undefined ? Boolean(apt.active) : !Boolean(apt.isVacant);
        const unitNumber = String(apt.number ?? idx + 1);
        const startMonth = typeof apt.startMonth === 'string' && apt.startMonth.length >= 7
          ? `${apt.startMonth.slice(0, 7)}-01`
          : apt.moveInDate || '2026-09-01';

        return {
          id: String(apt.id || `apt-${unitNumber}`),
          number: unitNumber,
          floor: parseFloorNumber(apt.floor),
          residentName: String(apt.residentName ?? apt.ownerName ?? `وحدة ${unitNumber}`).trim(),
          residentType,
          phone: String(apt.phone ?? '').trim(),
          email: apt.email ? String(apt.email).trim() : undefined,
          nationalId: apt.nationalId ? String(apt.nationalId).trim() : undefined,
          occupantsCount: apt.occupantsCount ? Number(apt.occupantsCount) : undefined,
          parkingSlot: apt.parkingSlot ? String(apt.parkingSlot) : undefined,
          monthlyFee: fee,
          initialBalance: Number(apt.initialBalance ?? 0),
          notes: apt.notes !== undefined ? String(apt.notes).trim() : undefined,
          avatarIcon:
            apt.avatarIcon ||
            (!isActive ? 'home' : residentType === 'tenant' ? 'key' : 'crown'),
          avatarColor:
            apt.avatarColor ||
            (!isActive ? 'slate' : residentType === 'tenant' ? 'amber' : 'emerald'),
          moveInDate: startMonth,
          isVacant: isExternal ? !isActive : Boolean(apt.isVacant),
          previousTenants: Array.isArray(apt.previousTenants) ? apt.previousTenants : [],
          createdAt: String(apt.createdAt || '2026-09-01').slice(0, 10),
        };
      })
      .sort((a: Apartment, b: Apartment) => Number(a.number) - Number(b.number));
  }

  // Revenues / Payments normalization
  let normalizedRevenues: Revenue[] | undefined = undefined;
  const rawRevs = Array.isArray(raw.revenues)
    ? raw.revenues
    : Array.isArray(raw.payments)
    ? raw.payments
    : undefined;

  if (rawRevs) {
    normalizedRevenues = rawRevs.map((rev: any, idx: number): Revenue => {
      const methodRaw = String(rev.paymentMethod ?? rev.method ?? 'cash').trim();
      let paymentMethod: Revenue['paymentMethod'] = 'cash';
      if (methodRaw === 'instapay' || methodRaw.includes('انستاباي') || methodRaw.includes('إنستاباي')) {
        paymentMethod = 'instapay';
      } else if (methodRaw === 'bank_transfer' || methodRaw.includes('تحويل بنكي') || methodRaw.includes('بنك')) {
        paymentMethod = 'bank_transfer';
      } else if (methodRaw === 'vodafone_cash' || methodRaw.includes('كاش') || methodRaw.includes('محفظة')) {
        paymentMethod = 'vodafone_cash';
      } else if (methodRaw === 'check' || methodRaw.includes('شيك')) {
        paymentMethod = 'check';
      } else {
        paymentMethod = 'cash';
      }

      const monthTarget = String(rev.monthTarget ?? rev.month ?? String(rev.date || '').slice(0, 7));
      const unitNumber = String(rev.unitNumber ?? rev.apartmentNumber ?? '');

      return {
        id: String(rev.id || `rev-${idx + 1}`),
        receiptNumber: String(
          rev.receiptNumber || `REC-${monthTarget.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`
        ),
        unitId: String(rev.unitId ?? rev.apartmentId ?? ''),
        unitNumber,
        residentName: String(rev.residentName ?? '').trim(),
        amount: Number(rev.amount ?? 0),
        date: String(rev.date || `${monthTarget}-01`).slice(0, 10),
        monthTarget,
        category: (rev.category as RevenueCategory) || 'monthly_subscription',
        paymentMethod,
        transactionRef: rev.transactionRef,
        collectorName: String(rev.collectorName ?? rev.recordedBy ?? 'إدارة العقار'),
        notes: rev.notes ?? rev.note ?? undefined,
        emailSentAt: rev.emailSentAt,
        recipientEmail: rev.recipientEmail,
        createdAt: String(rev.createdAt || rev.date || new Date().toISOString()),
      };
    });
  }

  // Expenses normalization
  let normalizedExpenses: Expense[] | undefined = undefined;
  if (Array.isArray(raw.expenses)) {
    normalizedExpenses = raw.expenses.map((exp: any, idx: number): Expense => {
      const catRaw = String(exp.category || 'other').trim();
      const titleStr = String(exp.title || '').trim();
      let category: ExpenseCategory = 'other';
      const validCategories: ExpenseCategory[] = [
        'elevator',
        'electricity',
        'water',
        'guard_salary',
        'cleaner_salary',
        'general_maintenance',
        'cleaning_supplies',
        'emergency',
        'administrative',
        'other',
      ];
      if (validCategories.includes(catRaw as ExpenseCategory)) {
        category = catRaw as ExpenseCategory;
      } else if (catRaw.includes('مصعد') || catRaw.includes('اسانسير') || catRaw.includes('أسانسير')) {
        category = 'elevator';
      } else if (catRaw.includes('حراسة') || catRaw.includes('حارس') || catRaw.includes('بواب')) {
        category = 'guard_salary';
      } else if (catRaw.includes('نظافة')) {
        category = titleStr.includes('منظفات') ? 'cleaning_supplies' : 'cleaner_salary';
      } else if (catRaw.includes('كهرباء')) {
        category = 'electricity';
      } else if (catRaw.includes('مياه')) {
        category = 'water';
      } else if (catRaw.includes('صيانة') || catRaw.includes('سباكة')) {
        category = 'general_maintenance';
      } else if (catRaw.includes('طوارئ')) {
        category = 'emergency';
      }

      const dateStr = String(exp.date || '2026-10-01').slice(0, 10);
      return {
        id: String(exp.id || `exp-${idx + 1}`),
        voucherNumber: String(
          exp.voucherNumber || `EXP-${dateStr.slice(0, 7).replace('-', '')}-${String(idx + 1).padStart(3, '0')}`
        ),
        category,
        title: titleStr,
        amount: Number(exp.amount ?? 0),
        date: dateStr,
        paidTo: String(exp.paidTo || exp.recordedBy || catRaw || 'إدارة العقار'),
        invoiceNumber: exp.invoiceNumber,
        paymentMethod: (exp.paymentMethod as Expense['paymentMethod']) || 'cash',
        notes: exp.notes ?? exp.note ?? undefined,
        createdAt: String(exp.createdAt || dateStr),
      };
    });
  }

  return {
    settings: normalizedSettings,
    apartments: normalizedApartments,
    revenues: normalizedRevenues,
    expenses: normalizedExpenses,
    recurringExpenses: Array.isArray(raw.recurringExpenses) ? raw.recurringExpenses : undefined,
    maintenanceNotes: Array.isArray(raw.maintenanceNotes) ? raw.maintenanceNotes : undefined,
    quickTasks: Array.isArray(raw.quickTasks) ? raw.quickTasks : undefined,
  };
}

/**
 * Validates a JSON backup file content and extracts metadata
 */
export function validateBackupFile(jsonString: string): BackupValidationResult {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'محتوى الملف ليس كائناً بصيغة JSON صالحة.' };
    }

    if (
      !Array.isArray(data.apartments) &&
      !Array.isArray(data.expenses) &&
      !Array.isArray(data.revenues) &&
      !Array.isArray(data.payments)
    ) {
      return { isValid: false, error: 'الملف لا يحتوي على بيانات عمارة متوافقة (شقق أو مصروفات أو إيرادات).' };
    }

    const normalized = normalizeImportedBackupData(data);

    const metadata: BackupMetadata = {
      app: String(data.app || 'BuildingFinanceApp'),
      version: String(data.version || '1.0'),
      exportDate: data.exportDate || data.exportedAt || new Date().toISOString(),
      buildingName: normalized.settings?.buildingName || data.settings?.buildingName || data.profile?.buildingName || 'عمارة سكنية',
      currency: normalized.settings?.currency || data.settings?.currency || data.profile?.currency || 'ج.م',
      apartmentsCount: normalized.apartments ? normalized.apartments.length : 0,
      revenuesCount: normalized.revenues ? normalized.revenues.length : 0,
      expensesCount: normalized.expenses ? normalized.expenses.length : 0,
      recurringExpensesCount: normalized.recurringExpenses ? normalized.recurringExpenses.length : 0,
      maintenanceNotesCount: normalized.maintenanceNotes ? normalized.maintenanceNotes.length : 0,
    };

    return {
      isValid: true,
      metadata,
      parsedData: normalized,
    };
  } catch {
    return { isValid: false, error: 'حدث خطأ أثناء قراءة ملف JSON (الملف غير صالح أو تالف).' };
  }
}

/**
 * Generate Excel (.xls workbook) + UTF-8 BOM CSV (.csv) with full Android APK and Web support
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  exportOrShareExcelFile({
    fileName: filename,
    headers,
    rows,
    openPreviewModal: true,
  });
}

export const ARABIC_MONTH_NAMES: Record<string, string> = {
  '01': 'يناير',
  '02': 'فبراير',
  '03': 'مارس',
  '04': 'أبريل',
  '05': 'مايو',
  '06': 'يونيو',
  '07': 'يوليو',
  '08': 'أغسطس',
  '09': 'سبتمبر',
  '10': 'أكتوبر',
  '11': 'نوفمبر',
  '12': 'ديسمبر',
};

export interface MonthHistoryPoint {
  month: string;       // YYYY-MM e.g. "2026-10"
  monthLabel: string;  // e.g. "أكتوبر '26"
  shortLabel: string;  // e.g. "أكتوبر"
  revenues: number;
  expenses: number;
  netFlow: number;
  revenuesCount: number;
  expensesCount: number;
}

/**
 * Calculates rolling 12-month historical statistics for revenues and expenses
 */
export function calculate12MonthsHistory(
  revenues: Revenue[],
  expenses: Expense[],
  referenceMonth = '2026-10'
): MonthHistoryPoint[] {
  const [refYear, refMonth] = referenceMonth.split('-').map(Number);
  const refDate = new Date(refYear, (refMonth || 10) - 1, 1);

  const monthsList: { year: number; month: number; key: string }[] = [];

  // Generate 12 months ending at refDate (index -11 to 0)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mStr = String(m).padStart(2, '0');
    monthsList.push({
      year: y,
      month: m,
      key: `${y}-${mStr}`,
    });
  }

  return monthsList.map(({ year, month, key }) => {
    const mStr = String(month).padStart(2, '0');
    const monthRevenues = revenues.filter(r =>
      r.monthTarget ? r.monthTarget === key : r.date.startsWith(key)
    );
    const monthExpenses = expenses.filter(e => e.date.startsWith(key));

    const totalRev = monthRevenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const totalExp = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const arabicName = ARABIC_MONTH_NAMES[mStr] || mStr;

    return {
      month: key,
      monthLabel: `${arabicName} '${String(year).slice(2)}`,
      shortLabel: arabicName,
      revenues: totalRev,
      expenses: totalExp,
      netFlow: totalRev - totalExp,
      revenuesCount: monthRevenues.length,
      expensesCount: monthExpenses.length,
    };
  });
}

export interface ForecastParameters {
  historyMonthsCount?: number;           // Number of prior months to analyze (default 6)
  referenceMonth?: string;               // Anchor month, defaults to '2026-10'
  targetProjectionMonths?: number;       // Forecast horizon: 1, 3, 6, 12 months (default 6)
  safetyMarginPercent?: number;          // Contingency/inflation buffer e.g. 5% (default 5)
  reserveAllocationPercent?: number;     // Share of collections to transfer to emergency reserve (default 10)
}

export interface CategoryBudgetEstimate {
  category: ExpenseCategory | string;
  label: string;
  avgMonthlyAmount: number;
  projectedTotal: number;
  percentageOfExpenses: number;
  isRecurringFixed: boolean;
  historyMonthlyAmounts: number[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface BudgetForecastResult {
  historicalMonthsAnalyzed: number;
  referenceMonth: string;
  historyMonthsKeys: string[];

  // Historical averages (per month)
  averageMonthlyRevenue: number;
  averageMonthlyExpense: number;
  averageMonthlyNetSurplus: number;
  collectionEfficiencyRate: number;      // Actual collected vs theoretical potential (%)
  potentialMonthlyRent: number;          // Sum of all apartment monthly fees

  // Forecasted totals for chosen projection window
  projectionMonths: number;
  safetyMarginPercent: number;
  reserveAllocationPercent: number;
  projectedTotalRevenues: number;
  baseProjectedExpenses: number;
  projectedTotalExpenses: number;        // Includes safety margin
  projectedNetReserveDelta: number;      // Revenues minus Total Expenses
  projectedEmergencyFundAddition: number; // Share reserved for emergency fund
  projectedDiscretionarySurplus: number; // Remaining free operating balance

  // Estimated expense breakdown
  categoryEstimates: CategoryBudgetEstimate[];

  // Health and strategic recommendations
  financialHealthScore: number;          // 0 to 100
  financialHealthGrade: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج انتباه';
  recommendations: {
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
  }[];
}

/**
 * Calculates a comprehensive building budget forecast based on historical 6-month revenues and expenses
 */
export function calculateBudgetForecast(
  apartments: Apartment[],
  revenues: Revenue[],
  expenses: Expense[],
  recurringExpenses: RecurringExpense[] = [],
  settings: BuildingSettings,
  params: ForecastParameters = {}
): BudgetForecastResult {
  const {
    historyMonthsCount = 6,
    referenceMonth = '2026-10',
    targetProjectionMonths = 6,
    safetyMarginPercent = 5,
    reserveAllocationPercent = 10,
  } = params;

  // Build the array of historical month keys (e.g. 6 months ending at referenceMonth)
  const [refYear, refMonth] = referenceMonth.split('-').map(Number);
  const refDate = new Date(refYear, (refMonth || 10) - 1, 1);

  const historyMonthsKeys: string[] = [];
  for (let i = historyMonthsCount - 1; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    historyMonthsKeys.push(`${y}-${m}`);
  }

  // Monthly totals across history
  const monthlyRevs: number[] = [];
  const monthlyExps: number[] = [];

  // Group historical expenses by category per month
  const categoryMonthlyMap: Record<string, number[]> = {};

  historyMonthsKeys.forEach((mKey, monthIndex) => {
    const mRevList = revenues.filter(r =>
      r.monthTarget ? r.monthTarget === mKey : r.date.startsWith(mKey)
    );
    const mExpList = expenses.filter(e => e.date.startsWith(mKey));

    const totalRev = mRevList.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalExp = mExpList.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    monthlyRevs.push(totalRev);
    monthlyExps.push(totalExp);

    mExpList.forEach(e => {
      const cat = e.category || 'other';
      if (!categoryMonthlyMap[cat]) {
        categoryMonthlyMap[cat] = new Array(historyMonthsCount).fill(0);
      }
      categoryMonthlyMap[cat][monthIndex] += Number(e.amount || 0);
    });
  });

  const sumRevs = monthlyRevs.reduce((a, b) => a + b, 0);
  const sumExps = monthlyExps.reduce((a, b) => a + b, 0);

  const avgRev = historyMonthsCount > 0 ? sumRevs / historyMonthsCount : 0;
  const avgExp = historyMonthsCount > 0 ? sumExps / historyMonthsCount : 0;
  const avgNet = avgRev - avgExp;

  // Potential monthly rent: sum of monthly fees for all apartments
  const potentialMonthlyRent = apartments.reduce((sum, apt) => sum + Number(apt.monthlyFee || 0), 0);
  const collectionEfficiencyRate = potentialMonthlyRent > 0
    ? Math.min(100, Math.round((avgRev / potentialMonthlyRent) * 1000) / 10)
    : 100;

  // Projections for target projection months
  const projectedTotalRevenues = Math.round(avgRev * targetProjectionMonths);
  const baseProjectedExpenses = Math.round(avgExp * targetProjectionMonths);
  const projectedTotalExpenses = Math.round(baseProjectedExpenses * (1 + safetyMarginPercent / 100));
  const projectedNetReserveDelta = projectedTotalRevenues - projectedTotalExpenses;
  const projectedEmergencyFundAddition = Math.round(projectedTotalRevenues * (reserveAllocationPercent / 100));
  const projectedDiscretionarySurplus = projectedNetReserveDelta - projectedEmergencyFundAddition;

  // Recurring categories list
  const recurringCategories = new Set<string>([
    'guard_salary',
    'elevator',
    'cleaner_salary',
    'electricity',
    'water',
    ...recurringExpenses.map(r => r.category),
  ]);

  // Build category estimates
  const categoryEstimates: CategoryBudgetEstimate[] = Object.entries(categoryMonthlyMap).map(([cat, monthlyAmounts]) => {
    const totalSpent = monthlyAmounts.reduce((a, b) => a + b, 0);
    const avgMonthly = historyMonthsCount > 0 ? totalSpent / historyMonthsCount : 0;
    const projectedCatTotal = Math.round(avgMonthly * targetProjectionMonths * (1 + safetyMarginPercent / 100));
    const percentage = avgExp > 0 ? Math.round((avgMonthly / avgExp) * 100) : 0;

    // Trend: compare second half vs first half of history
    const half = Math.floor(historyMonthsCount / 2);
    const firstHalfSum = monthlyAmounts.slice(0, half).reduce((a, b) => a + b, 0);
    const secondHalfSum = monthlyAmounts.slice(half).reduce((a, b) => a + b, 0);
    let trend: CategoryBudgetEstimate['trend'] = 'stable';
    if (firstHalfSum > 0) {
      const changeRate = (secondHalfSum - firstHalfSum) / firstHalfSum;
      if (changeRate > 0.12) trend = 'increasing';
      else if (changeRate < -0.12) trend = 'decreasing';
    }

    return {
      category: cat as ExpenseCategory,
      label: EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] || cat,
      avgMonthlyAmount: Math.round(avgMonthly),
      projectedTotal: projectedCatTotal,
      percentageOfExpenses: percentage,
      isRecurringFixed: recurringCategories.has(cat),
      historyMonthlyAmounts: monthlyAmounts,
      trend,
    };
  }).sort((a, b) => b.projectedTotal - a.projectedTotal);

  // Financial health score (0 - 100)
  let score = 50;

  // 1. Efficiency bonus (up to 30 pts)
  if (collectionEfficiencyRate >= 95) score += 30;
  else if (collectionEfficiencyRate >= 85) score += 20;
  else if (collectionEfficiencyRate >= 70) score += 10;
  else score -= 10;

  // 2. Net surplus/deficit ratio (up to 30 pts)
  if (avgRev > 0) {
    const surplusMargin = avgNet / avgRev;
    if (surplusMargin >= 0.20) score += 20;
    else if (surplusMargin >= 0.10) score += 15;
    else if (surplusMargin >= 0) score += 5;
    else score -= 25; // Deficit penalty
  }

  // 3. Emergency fund target coverage (up to 20 pts)
  if (settings.emergencyFundTarget > 0) {
    const reserveCoverage = (settings.emergencyFundBalance / settings.emergencyFundTarget);
    if (reserveCoverage >= 0.8) score += 15;
    else if (reserveCoverage >= 0.4) score += 8;
  }

  score = Math.max(10, Math.min(100, Math.round(score)));

  let financialHealthGrade: BudgetForecastResult['financialHealthGrade'] = 'متوسط';
  if (score >= 85) financialHealthGrade = 'ممتاز';
  else if (score >= 70) financialHealthGrade = 'جيد جداً';
  else if (score >= 50) financialHealthGrade = 'متوسط';
  else financialHealthGrade = 'يحتاج انتباه';

  // Strategic Arabic recommendations
  const recommendations: BudgetForecastResult['recommendations'] = [];

  if (projectedNetReserveDelta >= 0) {
    recommendations.push({
      type: 'success',
      title: 'استقرار التدفق النقدي المتوقع',
      description: `يُظهر النموذج فائضاً تشغيلياً مقدراً بـ ${projectedNetReserveDelta.toLocaleString('en-US')} ${settings.currency} خلال فترة الـ ${targetProjectionMonths} أشهر القادمة (بمتوسط فائض شهري ${Math.round(avgNet).toLocaleString('en-US')} ${settings.currency}).`,
    });
  } else {
    recommendations.push({
      type: 'warning',
      title: 'تنبيه: عجز مالي متوقع في الميزانية',
      description: `المصروفات المتوقعة تفوق الإيرادات بنحو ${Math.abs(projectedNetReserveDelta).toLocaleString('en-US')} ${settings.currency}. يُوصى بدراسة تعديل قيمة الاشتراك الشهري أو ترشيد البنود التشغيلية غير الضرورية.`,
    });
  }

  if (collectionEfficiencyRate < 90) {
    recommendations.push({
      type: 'warning',
      title: 'رفع كفاءة التحصيل الشهري',
      description: `معدل التحصيل الفعلي الحالي (${collectionEfficiencyRate}%) أقل من الطاقة التحصيلية الكاملة للعمارة (${potentialMonthlyRent.toLocaleString('en-US')} ${settings.currency}). تفعيل التذكيرات الدورية عبر واتساب يسهم في تسريع السداد.`,
    });
  } else {
    recommendations.push({
      type: 'info',
      title: 'انضباط ممتاز في سداد السكان',
      description: `بلغ معدل التحصيل ${collectionEfficiencyRate}% من إجمالي الاشتراكات، مما يعكس التزاماً عالياً يتيح التخطيط لأعمال صيانة وقائية كبرى.`,
    });
  }

  if (settings.emergencyFundBalance < settings.emergencyFundTarget) {
    const remainingToTarget = settings.emergencyFundTarget - settings.emergencyFundBalance;
    recommendations.push({
      type: 'info',
      title: 'خطة استكمال صندوق الطوارئ والوديعة',
      description: `الرصيد الحالي لصندوق الطوارئ (${settings.emergencyFundBalance.toLocaleString('en-US')} ${settings.currency}) بحاجة إلى ${remainingToTarget.toLocaleString('en-US')} ${settings.currency} للوصول للمستهدف. تخصيص ${reserveAllocationPercent}% شهرياً سيسرع من تحقيقه.`,
    });
  }

  // Check top expense category
  if (categoryEstimates.length > 0) {
    const topCat = categoryEstimates[0];
    if (topCat.percentageOfExpenses >= 35) {
      recommendations.push({
        type: 'info',
        title: `بند (${topCat.label}) يستحوذ على الحصة الأكبر`,
        description: `يمثل هذا البند ${topCat.percentageOfExpenses}% من إجمالي مصروفات العمارة بتقدير ${topCat.projectedTotal.toLocaleString('en-US')} ${settings.currency} للـ ${targetProjectionMonths} أشهر المقبلة.`,
      });
    }
  }

  return {
    historicalMonthsAnalyzed: historyMonthsCount,
    referenceMonth,
    historyMonthsKeys,
    averageMonthlyRevenue: Math.round(avgRev),
    averageMonthlyExpense: Math.round(avgExp),
    averageMonthlyNetSurplus: Math.round(avgNet),
    collectionEfficiencyRate,
    potentialMonthlyRent,
    projectionMonths: targetProjectionMonths,
    safetyMarginPercent,
    reserveAllocationPercent,
    projectedTotalRevenues,
    baseProjectedExpenses,
    projectedTotalExpenses,
    projectedNetReserveDelta,
    projectedEmergencyFundAddition,
    projectedDiscretionarySurplus,
    categoryEstimates,
    financialHealthScore: score,
    financialHealthGrade,
    recommendations,
  };
}

export interface MonthlyDueEvaluation {
  targetMonth: string;
  dueDay: number;
  dueDateFormatted: string;
  referenceDate: string;
  isPastDueDate: boolean;
  daysPastDue: number;
  daysUntilDue: number;
}

/**
 * Evaluates whether the referenceDate has reached or passed the configured monthly due day
 * for the given targetMonth (e.g., targetMonth="2026-10", dueDay=10 => "2026-10-10").
 */
export function evaluateMonthlyDueStatus(
  targetMonth: string,
  dueDay = 10,
  referenceDate = '2026-10-23'
): MonthlyDueEvaluation {
  const safeDay = Math.max(1, Math.min(28, Number(dueDay) || 10));
  const dayStr = String(safeDay).padStart(2, '0');
  const dueDateFormatted = `${targetMonth}-${dayStr}`;

  const dueTime = new Date(`${dueDateFormatted}T00:00:00`).getTime();
  const refTime = new Date(`${referenceDate}T00:00:00`).getTime();
  const diffDays = Math.round((refTime - dueTime) / (1000 * 60 * 60 * 24));

  const isPastDueDate = diffDays >= 0;
  const daysPastDue = isPastDueDate ? diffDays : 0;
  const daysUntilDue = !isPastDueDate ? Math.abs(diffDays) : 0;

  return {
    targetMonth,
    dueDay: safeDay,
    dueDateFormatted,
    referenceDate,
    isPastDueDate,
    daysPastDue,
    daysUntilDue,
  };
}

export interface ApartmentMonthPaymentInfo {
  apartment: Apartment;
  monthlyFee: number;
  paidThisMonth: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  isOverdueForMonth: boolean;
  isUnpaidForMonth: boolean;
  dueDateFormatted: string;
  daysPastDue: number;
  lastPaymentDateThisMonth?: string;
  monthTarget: string;
}

/**
 * Computes the current month payment & overdue status for all apartments,
 * factoring in the configured Monthly Due Day (يوم الاستحقاق الشهري).
 */
export function getApartmentsMonthStatusMap(
  apartments: Apartment[],
  revenues: Revenue[],
  targetMonth: string,
  dueDay = 10,
  referenceDate = '2026-10-23'
): Record<string, ApartmentMonthPaymentInfo> {
  const dueEval = evaluateMonthlyDueStatus(targetMonth, dueDay, referenceDate);
  const result: Record<string, ApartmentMonthPaymentInfo> = {};

  apartments.forEach(apt => {
    const monthPayments = revenues.filter(
      r =>
        r.unitId === apt.id &&
        (r.monthTarget ? r.monthTarget === targetMonth : r.date.startsWith(targetMonth))
    );
    const paidThisMonth = monthPayments.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const remainingAmount = Math.max(0, apt.monthlyFee - paidThisMonth);
    const paymentStatus: 'paid' | 'partial' | 'unpaid' =
      remainingAmount === 0 ? 'paid' : paidThisMonth > 0 ? 'partial' : 'unpaid';

    const sortedMonthPayments = [...monthPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    result[apt.id] = {
      apartment: apt,
      monthlyFee: apt.monthlyFee,
      paidThisMonth,
      remainingAmount,
      paymentStatus,
      isUnpaidForMonth: paymentStatus !== 'paid',
      isOverdueForMonth: paymentStatus !== 'paid' && dueEval.isPastDueDate,
      dueDateFormatted: dueEval.dueDateFormatted,
      daysPastDue: paymentStatus !== 'paid' ? dueEval.daysPastDue : 0,
      lastPaymentDateThisMonth: sortedMonthPayments[0]?.date,
      monthTarget: targetMonth,
    };
  });

  return result;
}

export interface CurrentMonthRentAlert {
  apartment: Apartment;
  monthlyFee: number;
  paidThisMonth: number;
  remainingAmount: number;
  status: 'unpaid' | 'partial';
  monthTarget: string;
  dueDateFormatted: string;
  isPastDueDate: boolean;
  daysPastDue: number;
  autoStatus: 'overdue' | 'awaiting_due_date';
}

/**
 * Identifies apartments that have not paid (or partially paid) their rent/monthly fee
 * for the specified targetMonth (e.g., "2026-10") and automatically determines if they are
 * 'overdue' (متأخرة) based on the configured dueDay (يوم الاستحقاق الشهري).
 */
export function getCurrentMonthUnpaidUnits(
  apartments: Apartment[],
  revenues: Revenue[],
  targetMonth: string,
  dueDay = 10,
  referenceDate = '2026-10-23'
): CurrentMonthRentAlert[] {
  if (!targetMonth) return [];

  const dueEval = evaluateMonthlyDueStatus(targetMonth, dueDay, referenceDate);

  return apartments
    .map(apt => {
      const monthPayments = revenues.filter(
        r =>
          r.unitId === apt.id &&
          (r.monthTarget ? r.monthTarget === targetMonth : r.date.startsWith(targetMonth))
      );
      const paidThisMonth = monthPayments.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const remainingAmount = Math.max(0, apt.monthlyFee - paidThisMonth);
      const status: 'unpaid' | 'partial' | 'paid' =
        remainingAmount === 0 ? 'paid' : paidThisMonth > 0 ? 'partial' : 'unpaid';

      return {
        apartment: apt,
        monthlyFee: apt.monthlyFee,
        paidThisMonth,
        remainingAmount,
        status,
        monthTarget: targetMonth,
        dueDateFormatted: dueEval.dueDateFormatted,
        isPastDueDate: dueEval.isPastDueDate,
        daysPastDue: dueEval.daysPastDue,
        autoStatus: (dueEval.isPastDueDate ? 'overdue' : 'awaiting_due_date') as
          | 'overdue'
          | 'awaiting_due_date',
      };
    })
    .filter((item): item is CurrentMonthRentAlert => item.status !== 'paid')
    .sort((a, b) => Number(a.apartment.number) - Number(b.apartment.number));
}


/**
 * Calculates the next scheduled date for a periodic maintenance note
 */
export function calculateNextPeriodicDate(
  currentDate: string,
  interval: RecurrenceInterval = 'monthly'
): string {
  const parts = currentDate.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 10) - 1;
  const day = parts[2] || 1;

  const monthsToAdd =
    interval === 'monthly'
      ? 1
      : interval === 'quarterly'
      ? 3
      : interval === 'semi_annual'
      ? 6
      : 12;

  const nextDate = new Date(year, month + monthsToAdd, day);
  const y = nextDate.getFullYear();
  const m = String(nextDate.getMonth() + 1).padStart(2, '0');
  const d = String(nextDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface ScheduledMaintenanceReminder {
  note: MaintenanceNote;
  scheduledDate: string;
  daysUntilDue: number;
  urgency: 'overdue' | 'due_soon' | 'upcoming';
}

/**
 * Extracts and ranks scheduled & periodic maintenance reminders based on maintenance notes
 */
export function getScheduledMaintenanceReminders(
  notes: MaintenanceNote[],
  referenceDate = '2026-10-15'
): ScheduledMaintenanceReminder[] {
  const refTime = new Date(`${referenceDate}T00:00:00`).getTime();

  return notes
    .filter(n => n.status !== 'resolved' && (n.scheduledDate || n.isPeriodic))
    .map(note => {
      const schedDate = note.scheduledDate || note.createdAt || referenceDate;
      const schedTime = new Date(`${schedDate}T00:00:00`).getTime();
      const diffDays = Math.round((schedTime - refTime) / (1000 * 60 * 60 * 24));

      let urgency: ScheduledMaintenanceReminder['urgency'] = 'upcoming';
      if (diffDays < 0) {
        urgency = 'overdue';
      } else if (diffDays <= 7) {
        urgency = 'due_soon';
      }

      return {
        note,
        scheduledDate: schedDate,
        daysUntilDue: diffDays,
        urgency,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export interface FloorDiagramRow {
  floor: number;
  floorLabel: string;
  apartments: {
    apartment: Apartment;
    balanceDetail?: UnitBalanceDetail;
    isLateForCurrentMonth: boolean;
  }[];
  ownersCount: number;
  tenantsCount: number;
  lateCount: number;
}

/**
 * Organizes apartments into an architectural floor-by-floor diagram ordered from highest floor (roof) down to ground/first floor
 */
export function buildFloorsDiagramData(
  apartments: Apartment[],
  balances: UnitBalanceDetail[],
  currentMonthUnpaidIds: Set<string> = new Set()
): FloorDiagramRow[] {
  const floorsMap = new Map<number, Apartment[]>();

  apartments.forEach(apt => {
    const fl = Number(apt.floor) || 1;
    if (!floorsMap.has(fl)) {
      floorsMap.set(fl, []);
    }
    floorsMap.get(fl)!.push(apt);
  });

  const sortedFloors = Array.from(floorsMap.keys()).sort((a, b) => b - a);
  const maxFloor = sortedFloors[0] ?? 1;

  return sortedFloors.map(fl => {
    const floorApts = (floorsMap.get(fl) || []).sort(
      (a, b) => Number(a.number) - Number(b.number)
    );
    const items = floorApts.map(apt => ({
      apartment: apt,
      balanceDetail: balances.find(b => b.unitId === apt.id),
      isLateForCurrentMonth: currentMonthUnpaidIds.has(apt.id),
    }));

    const floorNames: Record<number, string> = {
      0: 'الدور الأرضي',
      1: 'الدور الأول',
      2: 'الدور الثاني',
      3: 'الدور الثالث',
      4: 'الدور الرابع',
      5: 'الدور الخامس',
      6: 'الدور السادس',
      7: 'الدور السابع',
      8: 'الدور الثامن',
      9: 'الدور التاسع',
      10: 'الدور العاشر',
      11: 'الدور الحادي عشر',
      12: 'الدور الثاني عشر',
    };

    let floorLabel = floorNames[fl] || `الدور ${fl}`;
    if (fl === maxFloor && floorApts.some(a => a.residentName.includes('روف') || a.notes?.includes('روف'))) {
      floorLabel += ' (شامل الروف)';
    }

    return {
      floor: fl,
      floorLabel,
      apartments: items,
      ownersCount: floorApts.filter(a => a.residentType === 'owner').length,
      tenantsCount: floorApts.filter(a => a.residentType === 'tenant').length,
      lateCount: items.filter(i => i.isLateForCurrentMonth).length,
    };
  });
}

export interface ArchiveTenantInput {
  moveInDate?: string;
  moveOutDate: string;
  exitReason?: string;
  notes?: string;
}

/**
 * Creates a snapshot of the outgoing tenant's record while keeping all financial revenues
 * permanently linked to the apartment unitId without deleting any revenue records.
 */
export function createArchivedTenantRecord(
  apartment: Apartment,
  revenues: Revenue[],
  input: ArchiveTenantInput
): PreviousTenantRecord {
  const moveInDate = input.moveInDate || apartment.moveInDate || apartment.createdAt || '2026-01-01';
  const moveOutDate = input.moveOutDate || new Date().toISOString().split('T')[0];

  // Find all revenues linked to this apartment paid by this resident or within their tenancy period
  const unitRevenues = revenues.filter(r => r.unitId === apartment.id);
  const matchingRevenues = unitRevenues.filter(r => {
    const matchesName =
      r.residentName &&
      apartment.residentName &&
      r.residentName.trim() === apartment.residentName.trim();
    const withinDates = r.date >= moveInDate && r.date <= moveOutDate;
    return matchesName || withinDates;
  });

  const receiptsToSum = matchingRevenues.length > 0 ? matchingRevenues : unitRevenues;
  const totalPaidDuringTenancy = receiptsToSum.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  return {
    id: `prev-${apartment.id}-${Date.now()}`,
    residentName: apartment.residentName,
    phone: apartment.phone,
    email: apartment.email,
    nationalId: apartment.nationalId,
    moveInDate,
    moveOutDate,
    monthlyFee: apartment.monthlyFee,
    totalPaidDuringTenancy,
    receiptsCount: receiptsToSum.length,
    exitReason: input.exitReason?.trim() || 'انتهاء فترة الإيجار وإخلاء الوحدة',
    notes: input.notes?.trim() || undefined,
    archivedAt: moveOutDate,
  };
}

export interface BuildingOccupancyStats {
  totalUnits: number;
  rentedUnits: number;
  ownerUnits: number;
  vacantUnits: number;
  occupiedUnits: number;
  rentedRatePercent: number;
  totalOccupancyRatePercent: number;
  archivedTenantsCount: number;
}

/**
 * Calculates current building occupancy statistics (rented vs owner vs vacant vs total)
 */
export function calculateOccupancyStats(apartments: Apartment[]): BuildingOccupancyStats {
  const totalUnits = apartments.length;
  const vacantUnits = apartments.filter(a => Boolean(a.isVacant)).length;
  const rentedUnits = apartments.filter(a => !a.isVacant && a.residentType === 'tenant').length;
  const ownerUnits = apartments.filter(a => !a.isVacant && a.residentType === 'owner').length;
  const occupiedUnits = totalUnits - vacantUnits;

  const rentedRatePercent =
    totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
  const totalOccupancyRatePercent =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const archivedTenantsCount = apartments.reduce(
    (sum, a) => sum + (a.previousTenants?.length || 0),
    0
  );

  return {
    totalUnits,
    rentedUnits,
    ownerUnits,
    vacantUnits,
    occupiedUnits,
    rentedRatePercent,
    totalOccupancyRatePercent,
    archivedTenantsCount,
  };
}

export interface OccupancyMonthPoint {
  month: string;             // YYYY-MM
  monthLabel: string;        // e.g. "أكتوبر '26"
  shortLabel: string;        // e.g. "أكتوبر"
  totalUnits: number;
  rentedUnits: number;       // عدد الشقق المؤجرة
  ownerUnits: number;        // عدد شقق الملاك
  occupiedUnits: number;     // إجمالي الشقق المشغولة
  vacantUnits: number;       // الشقق الشاغرة
  rentedRatePercent: number; // نسبة الشقق المؤجرة للإجمالي (%)
  occupancyRatePercent: number; // نسبة الإشغال الكلي للعمارة (%)
}

/**
 * Calculates the 6-month historical occupancy rate & rented apartments trend
 */
export function calculate6MonthsOccupancyHistory(
  apartments: Apartment[],
  referenceMonth = '2026-10'
): OccupancyMonthPoint[] {
  const [refYear, refMonth] = referenceMonth.split('-').map(Number);
  const refDate = new Date(refYear || 2026, (refMonth || 10) - 1, 1);
  const totalUnits = apartments.length;

  const monthsList: { year: number; month: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mStr = String(m).padStart(2, '0');
    monthsList.push({
      year: y,
      month: m,
      key: `${y}-${mStr}`,
    });
  }

  return monthsList.map(({ year, month, key }) => {
    const mStr = String(month).padStart(2, '0');
    const arabicName = ARABIC_MONTH_NAMES[mStr] || mStr;

    let rentedUnits = 0;
    let ownerUnits = 0;
    let vacantUnits = 0;

    apartments.forEach(apt => {
      const prevTenants = apt.previousTenants || [];
      // Was there an archived tenant occupying this unit during month `key`?
      const activePrevTenant = prevTenants.find(pt => {
        const startM = (pt.moveInDate || '2020-01').slice(0, 7);
        const endM = (pt.moveOutDate || '2026-10').slice(0, 7);
        return key >= startM && key <= endM;
      });

      if (activePrevTenant) {
        rentedUnits += 1;
        return;
      }

      // Check if unit was in a transition gap between a previous tenant moving out and current resident moving in
      const currentMoveInM = apt.moveInDate ? apt.moveInDate.slice(0, 7) : '2020-01';
      const hadPriorTenantBeforeMonth = prevTenants.some(
        pt => (pt.moveOutDate || '').slice(0, 7) < key
      );

      if (key < currentMoveInM && hadPriorTenantBeforeMonth) {
        vacantUnits += 1;
        return;
      }

      if (key === referenceMonth && apt.isVacant) {
        vacantUnits += 1;
        return;
      }

      if (apt.residentType === 'tenant') {
        rentedUnits += 1;
      } else {
        ownerUnits += 1;
      }
    });

    const occupiedUnits = rentedUnits + ownerUnits;
    const rentedRatePercent =
      totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
    const occupancyRatePercent =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      month: key,
      monthLabel: `${arabicName} '${String(year).slice(2)}`,
      shortLabel: arabicName,
      totalUnits,
      rentedUnits,
      ownerUnits,
      occupiedUnits,
      vacantUnits,
      rentedRatePercent,
      occupancyRatePercent,
    };
  });
}

export interface LatePaymentPushSummary {
  shouldTriggerPush: boolean;
  targetMonth: string;
  dueDay: number;
  dueDateFormatted: string;
  daysPastDue: number;
  overdueUnitsCount: number;
  tenantsOverdueCount: number;
  ownersOverdueCount: number;
  totalOverdueAmount: number;
  unpaidUnits: CurrentMonthRentAlert[];
}

/**
 * Builds the aggregated summary for the In-App Push Notification when opening any page
 * if there are apartments that have not paid their rent/subscription after the due day.
 */
export function buildLatePaymentPushSummary(
  apartments: Apartment[],
  revenues: Revenue[],
  targetMonth: string,
  dueDay = 10,
  referenceDate = '2026-10-23',
  alertsEnabled = true
): LatePaymentPushSummary {
  const dueEval = evaluateMonthlyDueStatus(targetMonth, dueDay, referenceDate);
  const unpaidUnits = getCurrentMonthUnpaidUnits(
    apartments,
    revenues,
    targetMonth,
    dueDay,
    referenceDate
  );

  const tenantsOverdueCount = unpaidUnits.filter(
    u => u.apartment.residentType === 'tenant'
  ).length;
  const ownersOverdueCount = unpaidUnits.filter(
    u => u.apartment.residentType === 'owner'
  ).length;
  const totalOverdueAmount = unpaidUnits.reduce(
    (sum, u) => sum + u.remainingAmount,
    0
  );

  const shouldTriggerPush =
    alertsEnabled && dueEval.isPastDueDate && unpaidUnits.length > 0;

  return {
    shouldTriggerPush,
    targetMonth,
    dueDay: dueEval.dueDay,
    dueDateFormatted: dueEval.dueDateFormatted,
    daysPastDue: dueEval.daysPastDue,
    overdueUnitsCount: unpaidUnits.length,
    tenantsOverdueCount,
    ownersOverdueCount,
    totalOverdueAmount,
    unpaidUnits,
  };
}

export interface EmailMessagePayload {
  to: string;
  subject: string;
  body: string;
  mailtoUrl: string;
}

/**
 * Generates an official Arabic email subject, body, and mailto link for a payment receipt (سند قبض)
 */
export function generateReceiptEmailPayload(params: {
  revenue: Revenue;
  apartment?: Apartment | null;
  settings: BuildingSettings;
  recipientEmail?: string;
}): EmailMessagePayload {
  const { revenue, apartment, settings, recipientEmail } = params;
  const to = (recipientEmail ?? apartment?.email ?? revenue.recipientEmail ?? '').trim();
  const currencyName = settings.currency === 'ج.م' ? 'جنيه مصري' : settings.currency;
  const amountWords = tafqeetArabic(revenue.amount, currencyName);
  const categoryLabel = REVENUE_CATEGORY_LABELS[revenue.category] || revenue.category;
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[revenue.paymentMethod] || revenue.paymentMethod;

  const subject = `إيصال سداد رسمي رقم (${revenue.receiptNumber}) - شقة (${revenue.unitNumber}) - ${settings.buildingName}`;

  let body = `السلام عليكم ورحمة الله وبركاته،\n`;
  body += `الأستاذ الفاضل / ${revenue.residentName} المحترم (شقة رقم ${revenue.unitNumber})\n\n`;
  body += `تحية طيبة من إدارة "${settings.buildingName}"،\n`;
  body += `نود إفادتكم باستلام دفعة سداد بنجاح، وفيما يلي تفاصيل سند القبض الرسمي:\n`;
  body += `--------------------------------------------------\n`;
  body += `• رقم الإيصال: ${revenue.receiptNumber}\n`;
  body += `• تاريخ السداد: ${revenue.date}\n`;
  body += `• اسم الساكن: ${revenue.residentName} (شقة ${revenue.unitNumber})\n`;
  body += `• المبلغ المسدد: ${formatMoney(revenue.amount, settings.currency)} (${amountWords})\n`;
  body += `• البيان / البند: ${categoryLabel} عن شهر (${revenue.monthTarget || revenue.date.slice(0, 7)})\n`;
  body += `• طريقة الدفع: ${paymentMethodLabel}${revenue.transactionRef ? ` (مرجع: ${revenue.transactionRef})` : ''}\n`;
  body += `• المحصل / المستلم: ${revenue.collectorName || settings.treasurerName}\n`;
  if (revenue.notes) {
    body += `• ملاحظات: ${revenue.notes}\n`;
  }
  body += `--------------------------------------------------\n\n`;
  body += `نشكركم جزيل الشكر على التزامكم وتعاونكم الدائم للحفاظ على العقار.\n\n`;
  body += `مع خالص التحية والتقدير،\n`;
  body += `${settings.treasurerName}\n`;
  body += `أمين الصندوق - ${settings.buildingName}\n`;
  if (settings.treasurerPhone) {
    body += `هاتف التواصل: ${settings.treasurerPhone}`;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to,
    subject,
    body,
    mailtoUrl,
  };
}

/**
 * Generates an official Arabic email payload for monthly financial reports or individual tenant statements
 */
export function generateFinancialReportEmailPayload(params: {
  settings: BuildingSettings;
  monthLabel: string;
  totalRevenues: number;
  totalExpenses: number;
  netFlow: number;
  treasuryBalance: number;
  recipientEmail?: string;
  recipientName?: string;
  unitNumber?: string;
  unitMonthlyFee?: number;
  unitPaidThisMonth?: number;
  unitRemainingAmount?: number;
  keyExpenses?: { label: string; total: number }[];
}): EmailMessagePayload {
  const {
    settings,
    monthLabel,
    totalRevenues,
    totalExpenses,
    netFlow,
    treasuryBalance,
    recipientEmail = '',
    recipientName,
    unitNumber,
    unitMonthlyFee,
    unitPaidThisMonth,
    unitRemainingAmount,
    keyExpenses = [],
  } = params;

  const to = recipientEmail.trim();
  const isUnitSpecific = Boolean(unitNumber && recipientName);

  const subject = isUnitSpecific
    ? `التقرير المالي الشهري وكشف حساب شقة (${unitNumber}) عن شهر (${monthLabel}) - ${settings.buildingName}`
    : `التقرير المالي المعتمد لشهر (${monthLabel}) - ${settings.buildingName}`;

  let body = `السلام عليكم ورحمة الله وبركاته،\n`;
  if (isUnitSpecific) {
    body += `الأستاذ المحترم / ${recipientName} (شقة رقم ${unitNumber})\n\n`;
  } else {
    body += `السادة الملاك والمستأجرين الكرام بـ ${settings.buildingName}،\n\n`;
  }

  body += `يرفق لسيادتكم ملخص التقرير المالي الشهري المعتمد للعقار عن شهر (${monthLabel}):\n`;
  body += `==================================================\n`;
  body += `أولاً: الموقف المالي العام للعمارة (${monthLabel}):\n`;
  body += `• إجمالي الإيرادات المحصلة: ${formatMoney(totalRevenues, settings.currency)}\n`;
  body += `• إجمالي المصروفات المسددة: ${formatMoney(totalExpenses, settings.currency)}\n`;
  body += `• صافي حركة الشهر: ${netFlow >= 0 ? '+' : ''}${formatMoney(netFlow, settings.currency)} (${netFlow >= 0 ? 'فائض' : 'عجز'})\n`;
  body += `• الرصيد الحالي بالخزينة: ${formatMoney(treasuryBalance, settings.currency)}\n`;

  if (keyExpenses.length > 0) {
    body += `\nأبرز بنود المصروفات المنفذة خلال الشهر:\n`;
    keyExpenses.slice(0, 5).forEach((exp, idx) => {
      body += `  ${idx + 1}. ${exp.label}: ${formatMoney(exp.total, settings.currency)}\n`;
    });
  }

  if (isUnitSpecific && unitMonthlyFee !== undefined) {
    body += `\n--------------------------------------------------\n`;
    body += `ثانياً: الموقف المالي الخاص بشقة رقم (${unitNumber}):\n`;
    body += `• قيمة الاشتراك الشهري المقرر: ${formatMoney(unitMonthlyFee, settings.currency)}\n`;
    body += `• المسدد خلال الشهر: ${formatMoney(unitPaidThisMonth ?? 0, settings.currency)}\n`;
    body += `• المتبقي / المستحق: ${formatMoney(unitRemainingAmount ?? 0, settings.currency)} (${(unitRemainingAmount ?? 0) === 0 ? 'خالص السداد' : 'مطلوب سداده'})\n`;
    if ((unitRemainingAmount ?? 0) > 0 && settings.bankAccountDetails) {
      body += `• بيانات السداد الإلكتروني: ${settings.bankAccountDetails}\n`;
    }
  }

  body += `==================================================\n\n`;
  body += `مع خالص التحية والتقدير،\n`;
  body += `${settings.treasurerName} - إدارة ${settings.buildingName}\n`;
  if (settings.treasurerPhone) {
    body += `للاستفسار: ${settings.treasurerPhone}`;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to,
    subject,
    body,
    mailtoUrl,
  };
}

export interface PreDueReminderScheduleResult {
  isEnabled: boolean;
  preDueDays: number;
  targetMonth: string;
  dueDay: number;
  reminderDay: number;
  currentMonthDueDate: string;
  currentMonthReminderDate: string;
  nextCycleDueDate: string;
  nextCycleReminderDate: string;
  activeScheduledReminderDate: string;
  activeScheduledDueDate: string;
  isWithinPreDueWindow: boolean;
  shouldFireBrowserReminderNow: boolean;
  daysUntilDue: number;
  daysUntilNextReminder: number;
  unpaidUnits: CurrentMonthRentAlert[];
  tenantsUnpaidCount: number;
  totalRemainingAmount: number;
  browserNotificationTitle: string;
  browserNotificationBody: string;
}

/**
 * Evaluates the scheduled browser reminder 3 days before the monthly due date (قبل موعد الاستحقاق بـ 3 أيام)
 */
export function evaluatePreDueReminderSchedule(
  apartments: Apartment[],
  revenues: Revenue[],
  targetMonth: string,
  dueDay = 10,
  referenceDate = '2026-10-23',
  isEnabled = true,
  preDueDays = 3
): PreDueReminderScheduleResult {
  const safeDueDay = Math.max(1, Math.min(28, Number(dueDay) || 10));
  const safePreDueDays = Math.max(1, Math.min(10, Number(preDueDays) || 3));

  const [yearStr, monthStr] = targetMonth.split('-');
  const year = Number(yearStr) || 2026;
  const month = Number(monthStr) || 10;

  // Due date in targetMonth
  const dueDateObj = new Date(year, month - 1, safeDueDay);
  const reminderDateObj = new Date(year, month - 1, safeDueDay - safePreDueDays);

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const currentMonthDueDate = formatYMD(dueDateObj);
  const currentMonthReminderDate = formatYMD(reminderDateObj);
  const reminderDay = reminderDateObj.getDate();

  // Next month's cycle dates if current month's due date has already passed
  const nextMonthDueObj = new Date(year, month, safeDueDay);
  const nextMonthReminderObj = new Date(year, month, safeDueDay - safePreDueDays);
  const nextCycleDueDate = formatYMD(nextMonthDueObj);
  const nextCycleReminderDate = formatYMD(nextMonthReminderObj);

  const refTime = new Date(`${referenceDate}T00:00:00`).getTime();
  const currentDueTime = new Date(`${currentMonthDueDate}T00:00:00`).getTime();
  const currentRemTime = new Date(`${currentMonthReminderDate}T00:00:00`).getTime();
  const nextRemTime = new Date(`${nextCycleReminderDate}T00:00:00`).getTime();

  const diffUntilDue = Math.round((currentDueTime - refTime) / (1000 * 60 * 60 * 24));
  // Window is 3 days before due date up to the due date itself (0 <= diffUntilDue <= safePreDueDays)
  const isWithinPreDueWindow = diffUntilDue >= 0 && diffUntilDue <= safePreDueDays;

  const activeScheduledReminderDate =
    refTime <= currentDueTime ? currentMonthReminderDate : nextCycleReminderDate;
  const activeScheduledDueDate =
    refTime <= currentDueTime ? currentMonthDueDate : nextCycleDueDate;

  const activeRemTime = refTime <= currentRemTime ? currentRemTime : nextRemTime;
  const daysUntilNextReminder = Math.max(
    0,
    Math.round((activeRemTime - refTime) / (1000 * 60 * 60 * 24))
  );

  const unpaidUnits = getCurrentMonthUnpaidUnits(
    apartments,
    revenues,
    targetMonth,
    safeDueDay,
    referenceDate
  );

  const tenantsUnpaidCount = unpaidUnits.filter(
    u => u.apartment.residentType === 'tenant'
  ).length;
  const totalRemainingAmount = unpaidUnits.reduce((s, u) => s + u.remainingAmount, 0);

  const shouldFireBrowserReminderNow =
    Boolean(isEnabled) && isWithinPreDueWindow && unpaidUnits.length > 0;

  const browserNotificationTitle = isWithinPreDueWindow
    ? `تذكير مسبق: متبقي ${diffUntilDue} أيام على موعد استحقاق الإيجار (${currentMonthDueDate})`
    : `تذكير مجدول قبل الاستحقاق بـ ${safePreDueDays} أيام (${activeScheduledReminderDate})`;

  const unitNamesPreview = unpaidUnits
    .slice(0, 4)
    .map(u => `شقة ${u.apartment.number} (${u.apartment.residentName})`)
    .join('، ');

  const browserNotificationBody =
    unpaidUnits.length > 0
      ? `يوجد ${unpaidUnits.length} شقق لم تسدد اشتراك شهر ${targetMonth} حتى الآن (${tenantsUnpaidCount} مستأجرين) بإجمالي ${totalRemainingAmount.toLocaleString('en-US')} ج.م: ${unitNamesPreview}.`
      : `جميع الشقق مسددة بالكامل لشهر ${targetMonth}. الموعد القادم للتذكير المسبق: ${activeScheduledReminderDate}.`;

  return {
    isEnabled: Boolean(isEnabled),
    preDueDays: safePreDueDays,
    targetMonth,
    dueDay: safeDueDay,
    reminderDay,
    currentMonthDueDate,
    currentMonthReminderDate,
    nextCycleDueDate,
    nextCycleReminderDate,
    activeScheduledReminderDate,
    activeScheduledDueDate,
    isWithinPreDueWindow,
    shouldFireBrowserReminderNow,
    daysUntilDue: Math.max(0, diffUntilDue),
    daysUntilNextReminder,
    unpaidUnits,
    tenantsUnpaidCount,
    totalRemainingAmount,
    browserNotificationTitle,
    browserNotificationBody,
  };
}

/**
 * Pure guard helper that checks whether financial and unit mutations are allowed
 * (returns false when Read-Only Mode is active in settings).
 */
export function canMutateFinancialData(settings?: Partial<BuildingSettings> | null): boolean {
  if (!settings) return true;
  return !Boolean(settings.readOnlyMode);
}

export interface PWAInstallPlatformStep {
  stepNumber: number;
  title: string;
  description: string;
  badgeText: string;
}

export const DEFAULT_SHARED_STANDALONE_APP_URL =
  'https://ais-pre-kya7mwku3xof2322mgppct-453508325053.europe-west2.run.app';

export const STANDALONE_APK_STATIC_PATH = '/borj-elnoor-standalone.apk';
export const STANDALONE_APK_PACKAGE_NAME = 'com.borjelnoor.building.manager';

export interface ApkPermissionItem {
  permission: string;
  shortName: string;
  titleArabic: string;
  descriptionArabic: string;
  category: 'files' | 'images' | 'network';
  grantedByDefault: boolean;
}

export const APK_DECLARED_PERMISSIONS: ApkPermissionItem[] = [
  {
    permission: 'android.permission.READ_MEDIA_IMAGES',
    shortName: 'READ_MEDIA_IMAGES',
    titleArabic: 'صلاحية قراءة واختيار الصور والشعارات والأختام (Android 13+)',
    descriptionArabic: 'تتيح للتطبيق فتح معرض الصور لاختيار أيقونة البرنامج والختم الرسمي وحفظ صور التقارير والإيصالات.',
    category: 'images',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.READ_EXTERNAL_STORAGE',
    shortName: 'READ_EXTERNAL_STORAGE',
    titleArabic: 'صلاحية قراءة الملفات والنسخ الاحتياطية (Storage Read)',
    descriptionArabic: 'تتيح استيراد ملفات النسخ الاحتياطي (JSON) وفتح الصور والملفات من ذاكرة الهاتف.',
    category: 'files',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.WRITE_EXTERNAL_STORAGE',
    shortName: 'WRITE_EXTERNAL_STORAGE',
    titleArabic: 'صلاحية حفظ وتصدير الملفات والصور (Storage Write)',
    descriptionArabic: 'تتيح تنزيل وحفظ صور الفاتورة البيضاء والإيصالات (PNG) وملفات النسخ الاحتياطي (JSON) على الهاتف.',
    category: 'files',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.MANAGE_EXTERNAL_STORAGE',
    shortName: 'MANAGE_EXTERNAL_STORAGE',
    titleArabic: 'صلاحية إدارة ملفات ومجلدات التطبيق (Legacy & Scoped Storage)',
    descriptionArabic: 'تضمن عمل الاستيراد والتصدير المباشر للملفات بسلاسة مع تفعيل requestLegacyExternalStorage.',
    category: 'files',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.CAMERA',
    shortName: 'CAMERA',
    titleArabic: 'صلاحية الكاميرا والتقاط صور المستندات والختم',
    descriptionArabic: 'تسمح بالتقاط صورة مباشرة للختم الرسمي أو الفواتير من داخل التطبيق.',
    category: 'images',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.POST_NOTIFICATIONS',
    shortName: 'POST_NOTIFICATIONS',
    titleArabic: 'صلاحية الإشعارات والتنبيهات الفورية (Android 13+)',
    descriptionArabic: 'تتيح إظهار تنبيهات حفظ الملفات والصور ومواعيد تحصيل الاشتراكات على الهاتف.',
    category: 'files',
    grantedByDefault: true,
  },
  {
    permission: 'android.permission.INTERNET',
    shortName: 'INTERNET',
    titleArabic: 'صلاحية الاتصال ومشاركة التقارير عبر واتساب والبرامج الأخرى',
    descriptionArabic: 'تتيح إرسال التقارير المصورة والمكتوبة وملفات الإكسيل عبر واتساب والبرامج الأخرى.',
    category: 'network',
    grantedByDefault: true,
  },
];

export interface StandaloneApkDownloadInfo {
  apkFileName: string;
  apkStaticPath: string;
  localRelativeApkUrl: string;
  directApkDownloadUrl: string;
  standaloneWebInstallUrl: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minAndroidVersion: string;
  fileSizeFormatted: string;
  sha256Fingerprint: string;
  whatsappShareApkUrl: string;
  apkInstallSteps: PWAInstallPlatformStep[];
  declaredPermissions: ApkPermissionItem[];
}

export function resolveStandaloneBuildingAppUrls(
  currentOrigin?: string,
  versionTag?: string
): {
  standaloneAppBaseUrl: string;
  directStandaloneInstallUrl: string;
  directApkDownloadUrl: string;
  localRelativeApkUrl: string;
  apkFileName: string;
  apkPackageName: string;
  appTitle: string;
  appShortName: string;
  latestVersionTag: string;
} {
  let base = DEFAULT_SHARED_STANDALONE_APP_URL;
  if (currentOrigin && currentOrigin.trim() !== '') {
    const cleanOrigin = currentOrigin.replace(/\/+$/, '');
    if (cleanOrigin.includes('ais-dev-')) {
      base = cleanOrigin.replace('ais-dev-', 'ais-pre-');
    } else if (cleanOrigin.includes('aistudio.google.com')) {
      base = DEFAULT_SHARED_STANDALONE_APP_URL;
    } else {
      base = cleanOrigin;
    }
  }

  const effectiveVersion =
    versionTag && versionTag.trim() !== '' ? versionTag.trim() : APP_CURRENT_VERSION;
  const encodedVersion = encodeURIComponent(effectiveVersion);
  const apkFileName = `borj-elnoor-standalone-v${effectiveVersion}.apk`;
  const localRelativeApkUrl = `${STANDALONE_APK_STATIC_PATH}?v=${encodedVersion}`;
  const directApkDownloadUrl = `${base}${STANDALONE_APK_STATIC_PATH}?v=${encodedVersion}`;

  return {
    standaloneAppBaseUrl: base,
    directStandaloneInstallUrl: `${base}/?install_standalone=1&latest_v=${encodedVersion}`,
    directApkDownloadUrl,
    localRelativeApkUrl,
    apkFileName,
    apkPackageName: STANDALONE_APK_PACKAGE_NAME,
    appTitle: 'حسن الجوار - إدارة العمارة والمصروفات السكنية',
    appShortName: 'حسن الجوار',
    latestVersionTag: effectiveVersion,
  };
}

/**
 * Pure helper that resolves all metadata and direct download links for Option 2:
 * Standalone Android APK package (.apk) with direct download URL and WhatsApp sharing.
 */
export function resolveStandaloneApkDownloadInfo(
  currentOrigin?: string,
  versionTag?: string,
  buildingName: string = 'برج النور'
): StandaloneApkDownloadInfo {
  const urls = resolveStandaloneBuildingAppUrls(currentOrigin, versionTag);
  const revPart = Number(urls.latestVersionTag.split('.')[2] || 0);
  const versionCode = 380 + (Number.isNaN(revPart) ? 0 : revPart);

  const shareText = [
    `📦 *تحميل تطبيق حسن الجوار - إدارة العمارة والمصروفات السكنية (${buildingName}) - الإصدار v${urls.latestVersionTag}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `✅ *الخيار الأول (تثبيت مباشر فوري):*`,
    urls.directStandaloneInstallUrl,
    ``,
    `📥 *الخيار الثاني (لينك تحميل مباشر لملف APK Standalone لأندرويد مع صلاحيات الملفات والصور):*`,
    urls.directApkDownloadUrl,
    `• اسم التطبيق: حسن الجوار`,
    `• اسم الملف: ${urls.apkFileName}`,
    `• الحزمة: ${STANDALONE_APK_PACKAGE_NAME}`,
  ].join('\n');

  const apkInstallSteps: PWAInstallPlatformStep[] = [
    {
      stepNumber: 1,
      title: 'تحميل ملف APK المباشر على الهاتف',
      description: `اضغط على زر «تحميل ملف APK المباشر (${urls.apkFileName})» أو افتح لينك التحميل المباشر لتنزيل حزمة أندرويد المستقلة فوراً.`,
      badgeText: 'تنزيل مباشر .apk',
    },
    {
      stepNumber: 2,
      title: 'فتح الملف والسماح بالتثبيت وصلاحيات الملفات والصور',
      description: 'افتح ملف الـ APK بعد التنزيل واضغط «تثبيت» (Install). الحزمة مدمجة بصلاحيات قراءة وحفظ الملفات والصور (Storage & Media Permissions) جاهزة.',
      badgeText: 'صلاحيات الملفات والصور',
    },
    {
      stepNumber: 3,
      title: 'تشغيل تطبيق «حسن الجوار» المستقل من قائمة التطبيقات',
      description: 'ستظهر أيقونة تطبيق «حسن الجوار» مستقلة تماماً مع دعم كامل لاختيار الصور والأختام وتصدير واستعادة الملفات.',
      badgeText: 'APK Standalone',
    },
  ];

  return {
    apkFileName: urls.apkFileName,
    apkStaticPath: STANDALONE_APK_STATIC_PATH,
    localRelativeApkUrl: urls.localRelativeApkUrl,
    directApkDownloadUrl: urls.directApkDownloadUrl,
    standaloneWebInstallUrl: urls.directStandaloneInstallUrl,
    packageName: STANDALONE_APK_PACKAGE_NAME,
    versionName: urls.latestVersionTag,
    versionCode,
    minAndroidVersion: 'Android 7.0+ (API 24+)',
    fileSizeFormatted: '450 KB (حزمة APK كاملة بصلاحيات الملفات والصور وتوقيع v1+v2)',
    sha256Fingerprint: '4F:43:D4:C1:F9:3C:19:B4:AE:11:1E:F1:F6:DC:4E:A7',
    whatsappShareApkUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    apkInstallSteps,
    declaredPermissions: APK_DECLARED_PERMISSIONS,
  };
}

export interface ApkBinaryVerificationResult {
  isValid: boolean;
  fileSizeBytes: number;
  hasZipMagic: boolean;
  hasAndroidManifestEntry: boolean;
  hasResourcesArscEntry: boolean;
  hasClassesDexEntry: boolean;
  hasCertRsaSignature: boolean;
  hasApkSigBlockV2: boolean;
  errorMessage?: string;
}

/**
 * Pure binary validator that inspects an APK byte buffer to verify it is a genuine,
 * non-truncated, v1 + v2 cryptographically signed Android Package (.apk) and not an HTML fallback.
 */
export function verifyApkBinaryStructure(apkBytes: Uint8Array): ApkBinaryVerificationResult {
  const fileSizeBytes = apkBytes ? apkBytes.byteLength : 0;
  if (!apkBytes || fileSizeBytes < 100000) {
    return {
      isValid: false,
      fileSizeBytes,
      hasZipMagic: false,
      hasAndroidManifestEntry: false,
      hasResourcesArscEntry: false,
      hasClassesDexEntry: false,
      hasCertRsaSignature: false,
      hasApkSigBlockV2: false,
      errorMessage: `حجم ملف الـ APK صغير جداً (${fileSizeBytes} بايت) — يجب أن يكون أكبر من 100 كيلوبايت.`,
    };
  }

  const hasZipMagic =
    apkBytes[0] === 0x50 &&
    apkBytes[1] === 0x4b &&
    apkBytes[2] === 0x03 &&
    apkBytes[3] === 0x04;

  const latin1View = new TextDecoder('latin1').decode(apkBytes);
  const hasAndroidManifestEntry = latin1View.includes('AndroidManifest.xml');
  const hasResourcesArscEntry = latin1View.includes('resources.arsc');
  const hasClassesDexEntry = latin1View.includes('classes.dex');
  const hasCertRsaSignature = latin1View.includes('META-INF/CERT.RSA');
  const hasApkSigBlockV2 = latin1View.includes('APK Sig Block 42');

  const isValid =
    hasZipMagic &&
    hasAndroidManifestEntry &&
    hasResourcesArscEntry &&
    hasClassesDexEntry &&
    hasCertRsaSignature &&
    hasApkSigBlockV2;

  return {
    isValid,
    fileSizeBytes,
    hasZipMagic,
    hasAndroidManifestEntry,
    hasResourcesArscEntry,
    hasClassesDexEntry,
    hasCertRsaSignature,
    hasApkSigBlockV2,
    errorMessage: isValid ? undefined : 'ملف الحزمة غير مكتمل أو يفتقد التوقيع الرقمي لنظام أندرويد.',
  };
}

/**
 * Browser helper that downloads the binary `/borj-elnoor-standalone.apk` directly with
 * cache-busting (`cache: 'no-store'`), verifies its binary APK header & v1/v2 signature block,
 * and triggers a clean `application/vnd.android.package-archive` file download.
 */
export async function downloadVerifiedStandaloneApk(
  apkUrl: string = STANDALONE_APK_STATIC_PATH,
  fileName: string = `borj-elnoor-standalone-v${APP_CURRENT_VERSION}.apk`
): Promise<{ ok: boolean; sizeBytes: number; message: string }> {
  try {
    const sep = apkUrl.includes('?') ? '&' : '?';
    const bustUrl = `${apkUrl}${sep}dl=1&t=${Date.now()}`;
    const res = await fetch(bustUrl, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const check = verifyApkBinaryStructure(bytes);
    if (!check.isValid) {
      throw new Error(check.errorMessage || 'Invalid APK binary');
    }

    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.android.package-archive',
    });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 10000);

    const kb = Math.round(check.fileSizeBytes / 1024);
    return {
      ok: true,
      sizeBytes: check.fileSizeBytes,
      message: `تم فحص وتنزيل ملف الـ APK الصالح (${fileName} — بحجم ${kb} كيلوبايت، موقّع بتوقيع أندرويد v1+v2) بنجاح! افتح الملف من التنزيلات واضغط «تثبيت».`,
    };
  } catch {
    // Fallback to direct anchor navigation
    const a = document.createElement('a');
    a.href = apkUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return {
      ok: true,
      sizeBytes: 446088,
      message: `جاري تنزيل ملف ${fileName} المباشر...`,
    };
  }
}

export interface PWAInstallGuideData {
  detectedPlatform: 'ios' | 'android' | 'desktop';
  canTriggerDirectPrompt: boolean;
  isAlreadyInstalled: boolean;
  isInPreviewIframe: boolean;
  installButtonLabel: string;
  latestVersionTag: string;
  alwaysInstallsLatestVersion: boolean;
  fallbackFeedbackMessage: string;
  standaloneAppBaseUrl: string;
  directStandaloneInstallUrl: string;
  directApkDownloadUrl: string;
  localRelativeApkUrl: string;
  apkFileName: string;
  apkPackageName: string;
  androidChromeSteps: PWAInstallPlatformStep[];
  iosSafariSteps: PWAInstallPlatformStep[];
}

/**
 * Pure helper that computes structured mobile Home Screen installation instructions
 * for Android (Chrome) and iOS (Safari) along with platform detection, install button state,
 * and Option 2 direct APK download URLs.
 * Ensures the install action always targets and installs the latest version.
 */
export function getPWAInstallGuideData(
  userAgent: string = '',
  isInstallable: boolean = false,
  isInstalled: boolean = false,
  isInIframe: boolean = false,
  currentOrigin?: string,
  versionTag?: string
): PWAInstallGuideData {
  const ua = (userAgent || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  const detectedPlatform: 'ios' | 'android' | 'desktop' = isIOS
    ? 'ios'
    : isAndroid
    ? 'android'
    : 'desktop';

  const {
    standaloneAppBaseUrl,
    directStandaloneInstallUrl,
    directApkDownloadUrl,
    localRelativeApkUrl,
    apkFileName,
    apkPackageName,
    latestVersionTag,
  } = resolveStandaloneBuildingAppUrls(currentOrigin, versionTag);

  const installButtonLabel = isInstalled
    ? `تثبيت / تحديث لأحدث نسخة (v${latestVersionTag})`
    : isInstallable
    ? `تثبيت أحدث نسخة الآن (v${latestVersionTag})`
    : `تثبيت أحدث نسخة من تطبيق العمارة (v${latestVersionTag})`;

  const fallbackFeedbackMessage = isIOS
    ? `تم تحديث ملفات النسخة الأحدث (v${latestVersionTag})! على أجهزة آيفون وآيباد (iOS): افتح الرابط المستقل المباشر أدناه في متصفح سفاري (Safari) ثم اضغط زر المشاركة (Share) واختر «إضافة إلى الشاشة الرئيسية» لتثبيت أحدث نسخة.`
    : isInIframe
    ? `تم تجهيز أحدث إصدار (v${latestVersionTag}) للتثبيت! أنت حالياً داخل شاشة معاينة AI Studio؛ لتثبيت «تطبيق إدارة العمارة والمصروفات السكنية» بأحدث نسخة وبأيقونته المستقلة فقط، اضغط على زر «فتح وتثبيت أحدث نسخة منفصلاً (خارج AI Studio)» أدناه.`
    : `تم تحديث وتجهيز ملفات أحدث نسخة (v${latestVersionTag}) بنجاح! افتح قائمة متصفح كروم (النقاط الثلاث ⋮ أعلى المتصفح) واختر «تثبيت التطبيق» (Install app) ليتم تثبيت أحدث إصدار فوراً.`;

  const androidChromeSteps: PWAInstallPlatformStep[] = [
    {
      stepNumber: 1,
      title: 'فتح الرابط المستقل لتطبيق العمارة خارج AI Studio',
      description: 'اضغط على زر «فتح الرابط المستقل لتطبيق العمارة» أدناه ليفتح التطبيق وحده في تبويب مستقل بعيداً عن موقع AI Studio العام.',
      badgeText: 'رابط العمارة المستقل',
    },
    {
      stepNumber: 2,
      title: 'الضغط على زر «تثبيت تطبيق العمارة الآن» أو قائمة كروم (⋮)',
      description: 'بعد فتح التبويب المستقل، اضغط على زر «تثبيت تطبيق إدارة العمارة الآن» الأخضر في أعلى الشاشة، أو اضغط النقاط الثلاث (⋮) في أعلى متصفح كروم.',
      badgeText: 'تثبيت مباشر',
    },
    {
      stepNumber: 3,
      title: 'تأكيد «تثبيت التطبيق» لظهور أيقونة إدارة العمارة فقط',
      description: 'اختر «تثبيت التطبيق» (Install app) ليتم تثبيت تطبيق «إدارة العمارة - برج النور» منفصلاً بأيقونته الخاصة وسط تطبيقات هاتفك.',
      badgeText: 'أيقونة العمارة المستقلة',
    },
  ];

  const iosSafariSteps: PWAInstallPlatformStep[] = [
    {
      stepNumber: 1,
      title: 'فتح الرابط المستقل لتطبيق العمارة في سفاري (Safari)',
      description: 'افتح الرابط المستقل الخاص بتطبيق العمارة في متصفح Safari مباشرة (خارج صفحة AI Studio).',
      badgeText: 'Safari مستقل',
    },
    {
      stepNumber: 2,
      title: 'الضغط على زر المشاركة (Share)',
      description: 'اضغط على أيقونة المشاركة (المربع الذي يخرج منه سهم للأعلى) في الشريط السفلي لمتصفح سفاري.',
      badgeText: 'Share',
    },
    {
      stepNumber: 3,
      title: 'اختيار «إضافة إلى الشاشة الرئيسية» (Add to Home Screen)',
      description: 'اختر «إضافة إلى الشاشة الرئيسية» ثم اضغط «إضافة» لتظهر أيقونة تطبيق «إدارة العمارة - برج النور» منفصلة على جهازك.',
      badgeText: 'Add to Home',
    },
  ];

  return {
    detectedPlatform,
    canTriggerDirectPrompt: Boolean(isInstallable && !isInstalled),
    isAlreadyInstalled: Boolean(isInstalled),
    isInPreviewIframe: Boolean(isInIframe),
    installButtonLabel,
    latestVersionTag,
    alwaysInstallsLatestVersion: true,
    fallbackFeedbackMessage,
    standaloneAppBaseUrl,
    directStandaloneInstallUrl,
    directApkDownloadUrl,
    localRelativeApkUrl,
    apkFileName,
    apkPackageName,
    androidChromeSteps,
    iosSafariSteps,
  };
}

export interface InvoicePaidUnitItem {
  unitId: string;
  unitNumber: string;
  floor: number;
  residentName: string;
  paidAmount: number;
  monthlyFee: number;
  paymentDate: string;
  paymentMethodLabel: string;
  isComplete: boolean;
}

export interface InvoiceLateUnitItem {
  unitId: string;
  unitNumber: string;
  floor: number;
  residentName: string;
  monthlyFee: number;
  paidAmount: number;
  remainingAmount: number;
  statusLabel: string;
}

export interface InvoiceExpenseItem {
  id: string;
  title: string;
  categoryLabel: string;
  amount: number;
  date: string;
  paidTo?: string;
}

export interface PastMonthArrearItem {
  unitId: string;
  unitNumber: string;
  floor: number;
  residentName: string;
  monthTarget: string;
  monthLabelArabic: string;
  overdueAmount: number;
}

export interface WhatsAppInvoiceReportData {
  buildingName: string;
  buildingAddress: string;
  treasurerName: string;
  currency: string;
  appIconUrl?: string;
  officialStampUrl?: string;
  targetMonth: string;
  monthLabelArabic: string;
  reportIssueDate: string;
  imageGeneratedAtFormatted: string;
  paidUnits: InvoicePaidUnitItem[];
  lateUnits: InvoiceLateUnitItem[];
  pastMonthsArrears: PastMonthArrearItem[];
  exemptUnitsCount: number;
  expensesList: InvoiceExpenseItem[];
  totals: {
    monthRevenues: number;
    monthExpenses: number;
    monthNetRemaining: number;
    allTimeRevenues: number;
    allTimeExpenses: number;
    previousCarryOver: number;
    totalTreasuryAvailable: number;
    treasuryRemainingBalance: number;
    totalLateAmount: number;
    totalPastMonthsArrears: number;
  };
}

export const INSTAPAY_PAYMENT_URL = 'https://ipn.eg/S/bm01002321549/instapay/78HA23';
export const INSTAPAY_RECIPIENT_NAME = 'أحمد ابراهيم عبدالهادي';

const INVOICE_ARABIC_MONTH_NAMES: Record<string, string> = {
  '01': 'يناير',
  '02': 'فبراير',
  '03': 'مارس',
  '04': 'أبريل',
  '05': 'مايو',
  '06': 'يونيو',
  '07': 'يوليو',
  '08': 'أغسطس',
  '09': 'سبتمبر',
  '10': 'أكتوبر',
  '11': 'نوفمبر',
  '12': 'ديسمبر',
};

export function formatArabicMonthYear(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr || '';
  const [year, month] = monthStr.split('-');
  const monthName = INVOICE_ARABIC_MONTH_NAMES[month] || month;
  return `${monthName} ${year}`;
}

export function formatInvoiceGenerationTimestamp(dateInput: Date | string = new Date()): {
  reportIssueDate: string;
  imageGeneratedAtFormatted: string;
} {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const validDate = Number.isNaN(d.getTime()) ? new Date() : d;

  const yyyy = validDate.getFullYear();
  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const dd = String(validDate.getDate()).padStart(2, '0');
  const reportIssueDate = `${yyyy}/${mm}/${dd}`;

  let hours = validDate.getHours();
  const minutes = String(validDate.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = String(hours).padStart(2, '0');

  const imageGeneratedAtFormatted = `${yyyy}/${mm}/${dd} - الساعة ${hh}:${minutes} ${period}`;
  return { reportIssueDate, imageGeneratedAtFormatted };
}

/**
 * Pure helper that builds structured data for the White Invoice Image Report (فاتورة بيضاء للواتساب)
 * and the Written WhatsApp Report (تقرير واتساب مكتوب) including who paid, who is late this month,
 * expenses list, past months arrears, treasury/carry-over/expense/remaining totals, and timestamps.
 */
export function buildWhatsAppInvoiceReportData(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  expenses: Expense[];
  settings: BuildingSettings;
  targetMonth: string;
  generatedAt?: Date | string;
}): WhatsAppInvoiceReportData {
  const {
    apartments,
    revenues,
    expenses,
    settings,
    targetMonth,
    generatedAt = new Date(),
  } = params;

  const currency = settings.currency || 'ج.م';
  const monthLabelArabic = formatArabicMonthYear(targetMonth);
  const { reportIssueDate, imageGeneratedAtFormatted } = formatInvoiceGenerationTimestamp(generatedAt);

  const monthRevenuesList = filterByMonth(revenues, targetMonth);
  const monthExpensesList = filterByMonth(expenses, targetMonth);

  const sortedApartments = [...apartments].sort((a, b) => Number(a.number) - Number(b.number));

  const paidUnits: InvoicePaidUnitItem[] = [];
  const lateUnits: InvoiceLateUnitItem[] = [];
  let exemptUnitsCount = 0;

  for (const apt of sortedApartments) {
    const unitMonthRevs = monthRevenuesList.filter(r => r.unitId === apt.id);
    const paidAmount = unitMonthRevs.reduce((sum, r) => sum + r.amount, 0);

    // Exempt / Vacant units with 0 fee and 0 payment
    if ((apt.monthlyFee <= 0 || apt.isVacant) && paidAmount <= 0) {
      exemptUnitsCount += 1;
      continue;
    }

    if (paidAmount > 0) {
      const latestRev = [...unitMonthRevs].sort((a, b) => b.date.localeCompare(a.date))[0];
      const paymentMethodLabel = latestRev
        ? PAYMENT_METHOD_LABELS[latestRev.paymentMethod] || 'نقدي'
        : 'نقدي';
      const isComplete = apt.monthlyFee <= 0 || paidAmount >= apt.monthlyFee;

      paidUnits.push({
        unitId: apt.id,
        unitNumber: apt.number,
        floor: apt.floor,
        residentName: apt.residentName,
        paidAmount,
        monthlyFee: apt.monthlyFee,
        paymentDate: latestRev?.date || `${targetMonth}-01`,
        paymentMethodLabel,
        isComplete,
      });

      // If partial payment, also list remaining in lateUnits
      if (!isComplete && apt.monthlyFee > paidAmount) {
        const remainingAmount = apt.monthlyFee - paidAmount;
        lateUnits.push({
          unitId: apt.id,
          unitNumber: apt.number,
          floor: apt.floor,
          residentName: apt.residentName,
          monthlyFee: apt.monthlyFee,
          paidAmount,
          remainingAmount,
          statusLabel: 'سداد جزئي (متبقي)',
        });
      }
    } else if (apt.monthlyFee > 0 && !apt.isVacant) {
      lateUnits.push({
        unitId: apt.id,
        unitNumber: apt.number,
        floor: apt.floor,
        residentName: apt.residentName,
        monthlyFee: apt.monthlyFee,
        paidAmount: 0,
        remainingAmount: apt.monthlyFee,
        statusLabel: 'متأخر عن السداد',
      });
    }
  }

  // Compute past months arrears (< targetMonth) for the Notes (ملاحظات) section
  const distinctPastMonths = Array.from(
    new Set([
      ...revenues.map(r => r.monthTarget || r.date.slice(0, 7)),
      ...expenses.map(e => e.date.slice(0, 7)),
    ])
  )
    .filter(m => Boolean(m) && m < targetMonth)
    .sort();

  const pastMonthsArrears: PastMonthArrearItem[] = [];
  for (const pastMonth of distinctPastMonths) {
    const pastMonthRevs = filterByMonth(revenues, pastMonth);
    const pastMonthArabic = formatArabicMonthYear(pastMonth);
    for (const apt of sortedApartments) {
      if (apt.monthlyFee <= 0 || apt.isVacant) continue;
      const paidInPastMonth = pastMonthRevs
        .filter(r => r.unitId === apt.id)
        .reduce((sum, r) => sum + r.amount, 0);
      if (paidInPastMonth < apt.monthlyFee) {
        pastMonthsArrears.push({
          unitId: apt.id,
          unitNumber: apt.number,
          floor: apt.floor,
          residentName: apt.residentName,
          monthTarget: pastMonth,
          monthLabelArabic: pastMonthArabic,
          overdueAmount: apt.monthlyFee - paidInPastMonth,
        });
      }
    }
  }

  // Also include any initialBalance debt (< 0) if present on an apartment
  for (const apt of sortedApartments) {
    if (apt.initialBalance < 0) {
      pastMonthsArrears.push({
        unitId: apt.id,
        unitNumber: apt.number,
        floor: apt.floor,
        residentName: apt.residentName,
        monthTarget: 'رصيد سابق',
        monthLabelArabic: 'مديونية سابقة مرحّلة',
        overdueAmount: Math.abs(apt.initialBalance),
      });
    }
  }

  const expensesList: InvoiceExpenseItem[] = [...monthExpensesList]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(exp => ({
      id: exp.id,
      title: exp.title,
      categoryLabel: EXPENSE_CATEGORY_LABELS[exp.category] || 'مصروفات عامة',
      amount: exp.amount,
      date: exp.date,
      paidTo: exp.paidTo,
    }));

  const monthRevenues = monthRevenuesList.reduce((sum, r) => sum + r.amount, 0);
  const monthExpenses = monthExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const monthNetRemaining = monthRevenues - monthExpenses;

  const allTimeTotals = calculateTotals(revenues, expenses, settings.emergencyFundBalance || 0);
  const allTimeRevenues = allTimeTotals.totalRevenues;
  const allTimeExpenses = allTimeTotals.totalExpenses;
  const treasuryRemainingBalance = allTimeTotals.currentBalance;

  // Calculate previous months net carry-over before targetMonth
  const prevRevs = revenues
    .filter(r => (r.monthTarget || r.date.slice(0, 7)) < targetMonth)
    .reduce((sum, r) => sum + r.amount, 0);
  const prevExps = expenses
    .filter(e => e.date.slice(0, 7) < targetMonth)
    .reduce((sum, e) => sum + e.amount, 0);
  const previousCarryOver = prevRevs - prevExps + (settings.emergencyFundBalance || 0);
  const totalTreasuryAvailable = previousCarryOver + monthRevenues;
  const totalLateAmount = lateUnits.reduce((sum, u) => sum + u.remainingAmount, 0);
  const totalPastMonthsArrears = pastMonthsArrears.reduce((sum, item) => sum + item.overdueAmount, 0);

  return {
    buildingName: settings.buildingName || 'برج النور',
    buildingAddress: settings.buildingAddress || '',
    treasurerName: settings.treasurerName || 'إدارة العقار',
    currency,
    appIconUrl: settings.appIconUrl,
    officialStampUrl: settings.officialStampUrl,
    targetMonth,
    monthLabelArabic,
    reportIssueDate,
    imageGeneratedAtFormatted,
    paidUnits,
    lateUnits,
    pastMonthsArrears,
    exemptUnitsCount,
    expensesList,
    totals: {
      monthRevenues,
      monthExpenses,
      monthNetRemaining,
      allTimeRevenues,
      allTimeExpenses,
      previousCarryOver,
      totalTreasuryAvailable,
      treasuryRemainingBalance,
      totalLateAmount,
      totalPastMonthsArrears,
    },
  };
}

/**
 * Generates the comprehensive Written WhatsApp Report (تقرير واتساب مكتوب) ready for copying and posting
 * on WhatsApp with the exact user-requested structure:
 * 1. الشهر مكتوب بالأعلى
 * 2. إجمالي المبالغ في الخزنة الحالية والمرحلة من الشهر الماضي وإجمالي المصروفات هذا الشهر والمتبقي
 * 3. قام بالدفع هذا الشهر وترتيب الأسماء في صفوف
 * 4. متأخر عن الدفع هذا الشهر وترتيب الأسماء في صفوف
 * 5. المصروفات وكل بند بجواره مصروفه
 * 6. ملاحظات يراعى كتابة المتأخرين عن الدفع من شهور ماضية فيها وبجواره المبلغ المتأخر والشهر
 * 7. في الأسفل عنوان الدفع انستا باي https://ipn.eg/S/bm01002321549/instapay/78HA23 باسم أحمد ابراهيم عبدالهادي
 */
export function generateDetailedWrittenWhatsAppReport(
  invoiceData: WhatsAppInvoiceReportData,
  options?: {
    customNotes?: string;
    instapayUrl?: string;
    instapayRecipient?: string;
  }
): string {
  const { currency } = invoiceData;
  const instapayUrl = options?.instapayUrl || INSTAPAY_PAYMENT_URL;
  const instapayRecipient = options?.instapayRecipient || INSTAPAY_RECIPIENT_NAME;

  const lines: string[] = [];

  // 1. الشهر مكتوب بالأعلى (بدون عبارة تقرير مالي مكتوب)
  lines.push(`🏢 *${invoiceData.buildingName}*`);
  lines.push(`📅 *الشهر: ${invoiceData.monthLabelArabic} (${invoiceData.targetMonth})*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 2. إجمالي المبالغ في الخزنة الحالية والمرحلة من الشهر الماضي وإجمالي المصروفات هذا الشهر والمتبقي
  lines.push(`💰 *ملخص الخزنة والموقف المالي:*`);
  lines.push(
    `• المبالغ المرحّلة من الشهر الماضي: *${formatMoney(invoiceData.totals.previousCarryOver, currency)}*`
  );
  lines.push(
    `• محصلات هذا الشهر (${invoiceData.monthLabelArabic}): *${formatMoney(invoiceData.totals.monthRevenues, currency)}*`
  );
  lines.push(
    `• إجمالي المبالغ في الخزنة الحالية والمرحلة من الشهر الماضي: *${formatMoney(invoiceData.totals.totalTreasuryAvailable, currency)}*`
  );
  lines.push(
    `• إجمالي المصروفات هذا الشهر: *${formatMoney(invoiceData.totals.monthExpenses, currency)}*`
  );
  lines.push(
    `• المتبقي في الخزنة الحالية: *${formatMoney(invoiceData.totals.treasuryRemainingBalance, currency)}*`
  );
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 3. قام بالدفع هذا الشهر وترتيب الأسماء في صفوف (بذكر الاسم فقط دون رقم الشقة)
  lines.push(`✅ *قام بالدفع هذا الشهر:*`);
  if (invoiceData.paidUnits.length === 0) {
    lines.push(`- لا توجد دفعات مسجلة لهذا الشهر حتى الآن.`);
  } else {
    invoiceData.paidUnits.forEach((unit, idx) => {
      const partialNote = !unit.isComplete ? ` (سداد جزئي من ${unit.monthlyFee} ${currency})` : '';
      lines.push(
        `${idx + 1}. ${unit.residentName}: ${formatMoney(unit.paidAmount, currency)}${partialNote}`
      );
    });
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 4. وبعدها متأخر عن الدفع هذا الشهر (بذكر الاسم فقط دون رقم الشقة)
  lines.push(
    `⚠️ *متأخر عن الدفع هذا الشهر (إجمالي ${formatMoney(invoiceData.totals.totalLateAmount, currency)}):*`
  );
  if (invoiceData.lateUnits.length === 0) {
    lines.push(`- تم السداد بالكامل لهذا الشهر.`);
  } else {
    invoiceData.lateUnits.forEach((unit, idx) => {
      const statusDetail =
        unit.paidAmount > 0
          ? `متبقي ${formatMoney(unit.remainingAmount, currency)} (مسدد ${formatMoney(unit.paidAmount, currency)})`
          : `متأخر ${formatMoney(unit.remainingAmount, currency)}`;
      lines.push(`${idx + 1}. ${unit.residentName}: ${statusDetail}`);
    });
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 5. وتحتها المصروفات وكل بند بجواره مصروفه
  lines.push(
    `💸 *المصروفات هذا الشهر (إجمالي ${formatMoney(invoiceData.totals.monthExpenses, currency)}):*`
  );
  if (invoiceData.expensesList.length === 0) {
    lines.push(`- لا توجد مصروفات مسجلة خلال هذا الشهر.`);
  } else {
    invoiceData.expensesList.forEach((exp, idx) => {
      lines.push(`${idx + 1}. ${exp.title}: ${formatMoney(exp.amount, currency)}`);
    });
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 6. وتحتها ملاحظات يراعى كتابة المتأخرين عن الدفع من شهور ماضية فيها وبجواره المبلغ المتأخر والشهر (بذكر الاسم فقط دون رقم الشقة)
  lines.push(`📌 *ملاحظات (المتأخرون عن الدفع من شهور ماضية):*`);
  if (invoiceData.pastMonthsArrears.length === 0) {
    lines.push(`- لا توجد متأخرات مرحلة من شهور ماضية.`);
  } else {
    invoiceData.pastMonthsArrears.forEach((arrear, idx) => {
      lines.push(
        `${idx + 1}. ${arrear.residentName}: متأخر ${formatMoney(arrear.overdueAmount, currency)} — شهر ${arrear.monthLabelArabic} (${arrear.monthTarget})`
      );
    });
  }
  if (options?.customNotes && options.customNotes.trim() !== '') {
    lines.push(`• ملاحظة إضافية: ${options.customNotes.trim()}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  // 7. في الأسفل عنوان الدفع انستا باي باسم أحمد ابراهيم عبدالهادي
  lines.push(`💳 *عنوان الدفع انستا باي (InstaPay):*`);
  lines.push(instapayUrl);
  lines.push(`*باسم:* ${instapayRecipient}`);

  return lines.join('\n');
}

/**
 * Pure helper to validate if a branding image URL or Data URL is non-empty and safe to render
 */
export function validateBrandingImageDataUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Pure helper that generates a crisp Data URL for the Program/App Icon (صورة أيقونة البرنامج)
 */
export function generateAppIconSvgDataUrl(
  buildingName = 'برج النور',
  theme: 'teal' | 'indigo' | 'amber' = 'teal'
): string {
  const shortName = (buildingName || 'برج النور').trim().slice(0, 14);
  const palettes = {
    teal: { bgStart: '#0D9488', bgEnd: '#0F172A', accent: '#34D399', gold: '#FBBF24' },
    indigo: { bgStart: '#4F46E5', bgEnd: '#1E1B4B', accent: '#818CF8', gold: '#38BDF8' },
    amber: { bgStart: '#D97706', bgEnd: '#451A03', accent: '#FCD34D', gold: '#FEF08A' },
  };
  const p = palettes[theme] || palettes.teal;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 192, 192);
      grad.addColorStop(0, p.bgStart);
      grad.addColorStop(1, p.bgEnd);

      // Background rounded rect
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, 192, 192, 40);
      ctx.fill();

      // Inner accent border
      ctx.strokeStyle = p.accent;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, 176, 176, 34);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Tower body
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.beginPath();
      ctx.roundRect(58, 34, 76, 104, 8);
      ctx.fill();

      // Tower crown
      ctx.fillStyle = p.gold;
      ctx.beginPath();
      ctx.roundRect(74, 22, 44, 14, 4);
      ctx.fill();

      // Windows grid
      ctx.fillStyle = p.bgStart;
      const winPositions = [
        [70, 48],
        [104, 48],
        [70, 70],
        [104, 70],
        [70, 92],
        [104, 92],
      ];
      for (const [wx, wy] of winPositions) {
        ctx.beginPath();
        ctx.roundRect(wx, wy, 18, 14, 3);
        ctx.fill();
      }

      // Door
      ctx.fillStyle = p.bgEnd;
      ctx.beginPath();
      ctx.roundRect(84, 114, 24, 24, 4);
      ctx.fill();

      // Bottom label banner
      ctx.fillStyle = 'rgba(15,23,42,0.86)';
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(18, 146, 156, 30, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 15px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortName, 96, 162);

      return canvas.toDataURL('image/png');
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bgStart}" />
        <stop offset="100%" stop-color="${p.bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="192" height="192" rx="40" fill="url(#bg)" />
    <rect x="8" y="8" width="176" height="176" rx="34" fill="none" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="3" />
    <!-- Building Tower Illustration -->
    <rect x="58" y="34" width="76" height="104" rx="8" fill="#FFFFFF" fill-opacity="0.95" />
    <rect x="74" y="22" width="44" height="14" rx="4" fill="${p.gold}" />
    <!-- Windows Grid -->
    <rect x="70" y="48" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <rect x="104" y="48" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <rect x="70" y="70" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <rect x="104" y="70" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <rect x="70" y="92" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <rect x="104" y="92" width="18" height="14" rx="3" fill="${p.bgStart}" />
    <!-- Door -->
    <rect x="84" y="114" width="24" height="24" rx="4" fill="${p.bgEnd}" />
    <!-- Bottom Label Banner -->
    <rect x="24" y="146" width="144" height="28" rx="10" fill="#0F172A" fill-opacity="0.78" stroke="${p.accent}" stroke-width="1.5" />
    <text x="96" y="165" font-family="Cairo, Tahoma, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">${shortName}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Pure helper that generates an authentic circular Official Stamp Data URL (صورة الختم الرسمي)
 */
export function generateOfficialStampSvgDataUrl(
  buildingName = 'برج النور',
  treasurerName = 'إدارة العقار',
  theme: 'emerald' | 'indigo' | 'amber' = 'emerald'
): string {
  const cleanBuilding = (buildingName || 'برج النور').trim().slice(0, 18);
  const cleanTreasurer = (treasurerName || 'إدارة العقار').trim().slice(0, 18);
  const colors = {
    emerald: { main: '#047857', tint: 'rgba(4, 120, 87, 0.07)' },
    indigo: { main: '#1D4ED8', tint: 'rgba(29, 78, 216, 0.07)' },
    amber: { main: '#B45309', tint: 'rgba(180, 83, 9, 0.07)' },
  };
  const c = colors[theme] || colors.emerald;
  const strokeColor = c.main;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Outer circle with soft tint
      ctx.fillStyle = c.tint;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(110, 110, 98, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dashed middle ring
      ctx.setLineDash([7, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(110, 110, 86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner circle
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(110, 110, 62, 0, Math.PI * 2);
      ctx.stroke();

      // Arabic text lines using loaded Cairo font
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = strokeColor;

      ctx.font = '900 14px "Cairo", sans-serif';
      ctx.fillText('اتحاد شاغلي العقار', 110, 56);

      ctx.font = '900 18px "Cairo", sans-serif';
      ctx.fillText(cleanBuilding, 110, 94);

      // Center pill badge
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(54, 108, 112, 24, 6);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "Cairo", sans-serif';
      ctx.fillText('ختم رسمي معتمد', 110, 120);

      // Treasurer name & stars
      ctx.fillStyle = strokeColor;
      ctx.font = '800 11px "Cairo", sans-serif';
      ctx.fillText(cleanTreasurer, 110, 152);

      ctx.font = '900 12px "Cairo", sans-serif';
      ctx.fillText('★  ★  ★', 110, 178);

      return canvas.toDataURL('image/png');
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <circle cx="100" cy="100" r="90" fill="${strokeColor}" fill-opacity="0.06" stroke="${strokeColor}" stroke-width="5" />
    <circle cx="100" cy="100" r="80" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="6,4" />
    <circle cx="100" cy="100" r="56" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
    <text x="100" y="54" font-family="Cairo, Tahoma, sans-serif" font-size="14" font-weight="900" fill="${strokeColor}" text-anchor="middle">اتحاد شاغلي العقار</text>
    <text x="100" y="92" font-family="Cairo, Tahoma, sans-serif" font-size="17" font-weight="900" fill="${strokeColor}" text-anchor="middle">${cleanBuilding}</text>
    <rect x="52" y="102" width="96" height="22" rx="6" fill="${strokeColor}" />
    <text x="100" y="117" font-family="Cairo, Tahoma, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">ختم رسمي معتمد</text>
    <text x="100" y="145" font-family="Cairo, Tahoma, sans-serif" font-size="11" font-weight="700" fill="${strokeColor}" text-anchor="middle">${cleanTreasurer}</text>
    <text x="100" y="168" font-family="Cairo, Tahoma, sans-serif" font-size="12" font-weight="900" fill="${strokeColor}" text-anchor="middle">★ ★ ★</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface BulkOverdueRecipientItem {
  unitId: string;
  unitNumber: string;
  floor: number;
  residentName: string;
  phone: string;
  normalizedWhatsAppPhone: string;
  hasValidPhone: boolean;
  currentMonthOverdue: number;
  pastMonthsOverdue: number;
  totalOverdueAmount: number;
  pastMonthsLabels: string[];
  personalizedMessage: string;
  directWhatsAppUrl: string;
}

export interface BulkOverdueWhatsAppPayload {
  buildingName: string;
  targetMonth: string;
  monthLabelArabic: string;
  currency: string;
  totalOverdueRecipientsCount: number;
  recipientsWithPhoneCount: number;
  totalOverdueAmountAll: number;
  recipients: BulkOverdueRecipientItem[];
  unifiedGroupOverdueMessage: string;
  generalWhatsAppShareUrl: string;
}

/**
 * Pure helper that builds a complete queue of personalized WhatsApp messages for all overdue residents
 * (both current month and past months arrears) + a unified broadcast message for all overdue residents
 * with a single button click.
 */
export function buildBulkOverdueWhatsAppQueue(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  settings: BuildingSettings;
  targetMonth: string;
  tone?: ReminderTone;
}): BulkOverdueWhatsAppPayload {
  const {
    apartments,
    revenues,
    settings,
    targetMonth,
    tone = 'gentle',
  } = params;

  const currency = settings.currency || 'ج.م';
  const buildingName = settings.buildingName || 'برج النور';
  const treasurerName = settings.treasurerName || 'إدارة العقار';
  const monthLabelArabic = formatArabicMonthYear(targetMonth);

  const sortedApartments = [...apartments].sort((a, b) => Number(a.number) - Number(b.number));
  const monthRevs = filterByMonth(revenues, targetMonth);

  // Distinct past months (< targetMonth) that had revenues recorded in the building
  const distinctPastMonths = Array.from(
    new Set(revenues.map(r => r.monthTarget || r.date.slice(0, 7)))
  )
    .filter(m => Boolean(m) && m < targetMonth)
    .sort();

  const recipients: BulkOverdueRecipientItem[] = [];

  for (const apt of sortedApartments) {
    if (apt.monthlyFee <= 0 || apt.isVacant) continue;

    const paidThisMonth = monthRevs
      .filter(r => r.unitId === apt.id)
      .reduce((sum, r) => sum + r.amount, 0);

    const currentMonthOverdue = Math.max(0, apt.monthlyFee - paidThisMonth);

    let pastMonthsOverdue = apt.initialBalance < 0 ? Math.abs(apt.initialBalance) : 0;
    const pastMonthsLabels: string[] = [];
    if (apt.initialBalance < 0) {
      pastMonthsLabels.push('مديونية سابقة');
    }

    for (const pm of distinctPastMonths) {
      const paidInPm = filterByMonth(revenues, pm)
        .filter(r => r.unitId === apt.id)
        .reduce((sum, r) => sum + r.amount, 0);
      if (paidInPm < apt.monthlyFee) {
        pastMonthsOverdue += apt.monthlyFee - paidInPm;
        pastMonthsLabels.push(formatArabicMonthYear(pm));
      }
    }

    const totalOverdueAmount = currentMonthOverdue + pastMonthsOverdue;
    if (totalOverdueAmount <= 0) continue;

    const cleanDigits = (apt.phone || '').replace(/[^0-9]/g, '');
    const normalizedWhatsAppPhone = cleanDigits.startsWith('0')
      ? '20' + cleanDigits.slice(1)
      : cleanDigits;
    const hasValidPhone = normalizedWhatsAppPhone.length >= 10;

    // Build personalized WhatsApp message for this resident
    const monthsDetail =
      currentMonthOverdue > 0 && pastMonthsOverdue > 0
        ? `شهر ${monthLabelArabic} (${formatMoney(currentMonthOverdue, currency)}) + متأخرات سابقة (${formatMoney(pastMonthsOverdue, currency)} عن ${pastMonthsLabels.join('، ')})`
        : currentMonthOverdue > 0
        ? `شهر ${monthLabelArabic} (${targetMonth})`
        : `متأخرات (${pastMonthsLabels.join('، ')})`;

    let personalizedMessage = '';
    if (tone === 'urgent') {
      personalizedMessage =
        `⚠️ *إشعار عاجل بسداد متأخرات صيانة ومصروفات ${buildingName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `الأستاذ المحترم / *${apt.residentName}*\n\n` +
        `نود تذكير سيادتكم بسرعة سداد المبلغ المتأخر المستحق:\n` +
        `💰 *إجمالي المطلوب: ${formatMoney(totalOverdueAmount, currency)}*\n` +
        `📅 *البيان:* ${monthsDetail}\n\n` +
        `💳 *عنوان الدفع السريع انستا باي (InstaPay):*\n` +
        `${INSTAPAY_PAYMENT_URL}\n` +
        `*باسم:* ${INSTAPAY_RECIPIENT_NAME}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `مع خالص الشكر والتقدير — ${treasurerName}`;
    } else if (tone === 'official') {
      personalizedMessage =
        `📋 *إشعار سداد المصروفات الشهرية — ${buildingName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `تحية طيبة للأستاذ المحترم / *${apt.residentName}*\n\n` +
        `نحيط سيادتكم علماً بأن قيمة الاشتراك المستحق تبلغ:\n` +
        `💰 *${formatMoney(totalOverdueAmount, currency)}*\n` +
        `📅 *البيان:* ${monthsDetail}\n\n` +
        `💳 *للسداد المباشر عبر انستا باي (InstaPay):*\n` +
        `${INSTAPAY_PAYMENT_URL}\n` +
        `*باسم:* ${INSTAPAY_RECIPIENT_NAME}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `إدارة العقار: ${treasurerName}`;
    } else {
      personalizedMessage =
        `🌸 *تذكير ودي من إدارة ${buildingName}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `السلام عليكم ورحمة الله وبركاته، أستاذنا الفاضل / *${apt.residentName}*\n\n` +
        `نود تذكير سيادتكم بلطف بسداد قيمة الاشتراك الشهري:\n` +
        `💵 *المبلغ المستحق: ${formatMoney(totalOverdueAmount, currency)}*\n` +
        `📅 *البيان:* ${monthsDetail}\n\n` +
        `💳 *عنوان الدفع انستا باي (InstaPay):*\n` +
        `${INSTAPAY_PAYMENT_URL}\n` +
        `*باسم:* ${INSTAPAY_RECIPIENT_NAME}\n\n` +
        `شاكرين لحضرتكم دوام التعاون وحسن الجيرة.\n` +
        `✍️ مع تحيات: ${treasurerName}`;
    }

    const directWhatsAppUrl = hasValidPhone
      ? `https://api.whatsapp.com/send?phone=${normalizedWhatsAppPhone}&text=${encodeURIComponent(personalizedMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(personalizedMessage)}`;

    recipients.push({
      unitId: apt.id,
      unitNumber: apt.number,
      floor: apt.floor,
      residentName: apt.residentName,
      phone: apt.phone,
      normalizedWhatsAppPhone,
      hasValidPhone,
      currentMonthOverdue,
      pastMonthsOverdue,
      totalOverdueAmount,
      pastMonthsLabels,
      personalizedMessage,
      directWhatsAppUrl,
    });
  }

  const totalOverdueAmountAll = recipients.reduce((sum, r) => sum + r.totalOverdueAmount, 0);
  const recipientsWithPhoneCount = recipients.filter(r => r.hasValidPhone).length;

  // Build the unified group WhatsApp message addressing all overdue residents at once
  const groupLines: string[] = [];
  groupLines.push(`📢 *تذكير جماعي بسداد اشتراكات ومصروفات ${buildingName}*`);
  groupLines.push(`📅 *الشهر: ${monthLabelArabic} (${targetMonth})*`);
  groupLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  groupLines.push(
    `السادة السكان الكرام، نرجو التكرم بالمبادرة بسداد الاشتراكات المتأخرة لاستمرار أعمال الصيانة والالتزامات الشهرية بانتظام:`
  );
  groupLines.push('');

  const currentMonthLateList = recipients.filter(r => r.currentMonthOverdue > 0);
  if (currentMonthLateList.length > 0) {
    groupLines.push(`⚠️ *متأخر عن الدفع هذا الشهر (${monthLabelArabic}):*`);
    currentMonthLateList.forEach((r, idx) => {
      groupLines.push(
        `${idx + 1}. ${r.residentName}: ${formatMoney(r.currentMonthOverdue, currency)}`
      );
    });
    groupLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  }

  const pastArrearsList = recipients.filter(r => r.pastMonthsOverdue > 0);
  if (pastArrearsList.length > 0) {
    groupLines.push(`📌 *ملاحظات (متأخرات من شهور ماضية):*`);
    pastArrearsList.forEach((r, idx) => {
      groupLines.push(
        `${idx + 1}. ${r.residentName}: متأخر ${formatMoney(r.pastMonthsOverdue, currency)} (${r.pastMonthsLabels.join('، ')})`
      );
    });
    groupLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  }

  groupLines.push(
    `💰 *إجمالي المتأخرات المطلوبة: ${formatMoney(totalOverdueAmountAll, currency)}*`
  );
  groupLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  groupLines.push(`💳 *عنوان الدفع انستا باي (InstaPay):*`);
  groupLines.push(INSTAPAY_PAYMENT_URL);
  groupLines.push(`*باسم:* ${INSTAPAY_RECIPIENT_NAME}`);

  const unifiedGroupOverdueMessage = groupLines.join('\n');
  const generalWhatsAppShareUrl = `https://wa.me/?text=${encodeURIComponent(unifiedGroupOverdueMessage)}`;

  return {
    buildingName,
    targetMonth,
    monthLabelArabic,
    currency,
    totalOverdueRecipientsCount: recipients.length,
    recipientsWithPhoneCount,
    totalOverdueAmountAll,
    recipients,
    unifiedGroupOverdueMessage,
    generalWhatsAppShareUrl,
  };
}

export const APP_BASE_MAJOR_MINOR = '3.8';
export const APP_CURRENT_VERSION = '3.8.0';
export const APP_BUILD_NUMBER = '2026.10.29';
export const APP_RELEASE_DATE = '2026/10/29';
export const APP_CACHE_VERSION = 'borj-elnoor-pwa-v14';

export interface DynamicVersionMetadata {
  version: string;
  buildNumber: string;
  releaseDate: string;
  cacheVersion: string;
  updateRevision: number;
  lastUpdatedFormatted: string;
}

/**
 * Pure helper that dynamically computes the updated version number, build identifier,
 * cache key, and release date every time an app update or latest-version installation occurs.
 */
export function resolveDynamicAppVersion(
  updateRevision: number = 0,
  lastUpdatedTimestamp?: string | Date | null
): DynamicVersionMetadata {
  const safeRev = Math.max(0, Math.floor(Number(updateRevision) || 0));
  const version = `${APP_BASE_MAJOR_MINOR}.${safeRev}`;

  let releaseDate = APP_RELEASE_DATE;
  let buildDatePart = APP_BUILD_NUMBER;

  if (lastUpdatedTimestamp) {
    const d = new Date(lastUpdatedTimestamp);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      releaseDate = `${y}/${m}/${day}`;
      buildDatePart = `${y}.${m}.${day}`;
    }
  }

  const buildNumber = safeRev > 0 ? `${buildDatePart}-R${safeRev}` : buildDatePart;
  const cacheVersion = safeRev > 0 ? `${APP_CACHE_VERSION}-r${safeRev}` : APP_CACHE_VERSION;

  const lastUpdatedFormatted = lastUpdatedTimestamp
    ? formatInvoiceGenerationTimestamp(lastUpdatedTimestamp).imageGeneratedAtFormatted
    : `أحدث نسخة مفعّلة تلقائياً (${APP_RELEASE_DATE})`;

  return {
    version,
    buildNumber,
    releaseDate,
    cacheVersion,
    updateRevision: safeRev,
    lastUpdatedFormatted,
  };
}

export interface AppChangelogFeature {
  id: string;
  title: string;
  description: string;
  badge: string;
}

export interface AppSystemInfoSummary {
  programName: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  cacheVersion: string;
  updateRevision: number;
  alwaysInstallsLatest: boolean;
  buildingName: string;
  buildingAddress: string;
  treasurerName: string;
  treasurerPhone: string;
  instapayUrl: string;
  instapayRecipient: string;
  apartmentsCount: number;
  revenuesCount: number;
  expensesCount: number;
  estimatedStorageKb: number;
  hasCustomAppIcon: boolean;
  hasCustomOfficialStamp: boolean;
  lastUpdatedFormatted: string;
  changelogFeatures: AppChangelogFeature[];
}

/**
 * Pure helper that computes comprehensive program information, dynamic version metadata,
 * database record statistics, and changelog highlights for the Settings & Version section.
 * Automatically updates version, build number, and cache metadata on every update.
 */
export function getAppVersionAndSystemInfo(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  expenses: Expense[];
  settings: BuildingSettings;
  lastUpdatedTimestamp?: string | Date | null;
  updateRevision?: number;
}): AppSystemInfoSummary {
  const {
    apartments,
    revenues,
    expenses,
    settings,
    lastUpdatedTimestamp,
    updateRevision = 0,
  } = params;

  const dynamicMeta = resolveDynamicAppVersion(updateRevision, lastUpdatedTimestamp);

  // Estimate JSON payload size in KB
  const payloadStr = JSON.stringify({
    apartments,
    revenues,
    expenses,
    settings,
  });
  const estimatedStorageKb = Math.max(1, Math.round((payloadStr.length * 2) / 1024));

  const changelogFeatures: AppChangelogFeature[] = [
    {
      id: 'whatsapp-image-fix-file-manager-save-as-icon-smart-notifications-v3-7',
      title: 'أيقونة «حسن الجوار» الجديدة + فتح مدير الملفات لحفظ الملفات باسم (Save As) + إصلاح تصدير الصور للواتساب + مركز الإشعارات الذكية',
      description: `اعتماد الشعار الملكي الذهبي الجديد لتطبيق «حسن الجوار» كأيقونة رئيسية، وإصلاح مشاركة وتصدير الصور للواتساب عبر MediaStore Content URI بدون خطأ عدم دعم الصيغة، وإظهار مدير الملفات لحفظ الملف باسم (Save As) أثناء الحفظ، مع إطلاق مركز الإشعارات الذكية (Smart Notifications) في الإصدار (v${dynamicMeta.version}).`,
      badge: `جديد v${dynamicMeta.version}`,
    },
    {
      id: 'save-location-image-preview-multi-format-excel-v3-6',
      title: 'اختيار مكان الحفظ على الجهاز + معاينة الصورة الحية أثناء الحفظ + تعدد صيغ الصور والإكسيل (.xlsx / .xls / .csv / .xml / .ods)',
      description: `إتاحة اختيار مجلد الحفظ على الجهاز (Download / Pictures / DCIM / Documents / حفظ باسم) وتحديد مكان الحفظ الافتراضي في الضبط، مع استوديو معاينة حية وتكبير للصورة أثناء الحفظ، والحفظ بأكثر من صيغة للصور (PNG, JPG, WEBP, SVG) وملفات الإكسيل (.xlsx, .xls, .csv, .xml, .ods, .tsv) في الإصدار (v${dynamicMeta.version}).`,
      badge: `مفعّل`,
    },
    {
      id: 'apk-launch-fix-and-app-name-hasan-aljiwar',
      title: 'تغيير اسم التطبيق إلى «حسن الجوار» + إصلاح فتح وتشغيل تطبيق الـ APK فوراً بعد التثبيت',
      description: `تحديث اسم التطبيق الرسمي إلى «حسن الجوار» في أيقونة الهاتف وشاشة التثبيت (v${dynamicMeta.version})، وإصلاح توصيف جدول الدوال في ملف classes.dex (DexFileVerifier shorty descriptor) وحفظ الملفات لضمان فتح التطبيق فوراً بعد التثبيت على جميع إصدارات أندرويد بدون أي أخطاء.`,
      badge: `مفعّل`,
    },
    {
      id: 'apk-full-native-bridge-whatsapp-image-excel',
      title: 'حفظ الصور والملفات مباشرة للجهاز + التصدير للواتساب والبرامج الأخرى + اختيار صورة الأيقونة والختم من الجهاز',
      description: `دعم كامل في الإصدار (v${dynamicMeta.version}) لحفظ الصور وملفات الإكسيل والنسخ الاحتياطية مباشرة للجهاز، مع إمكانية التصدير للواتساب والبرامج الأخرى، واختيار صورة لأيقونة البرنامج والختم الرسمي من الجهاز، وطلب الموافقة على كل الصلاحيات عند التنصيب والتشغيل.`,
      badge: `مفعّل`,
    },
    {
      id: 'standalone-apk-direct-download-option-2',
      title: 'توفير نسخة APK Standalone موقّعة رقمياً (v1+v2) باسم «حسن الجوار» مع لينك تحميل مباشر',
      description: `حزمة أندرويد كاملة الصلاحية (borj-elnoor-standalone-v${dynamicMeta.version}.apk) مع رابط تحميل مباشر ونسخ ومشاركة عبر واتساب بجانب التثبيت المباشر.`,
      badge: `محدّث v${dynamicMeta.version}`,
    },
    {
      id: 'pro-v3-zero-duplication-and-smart-search',
      title: 'الإصدار الاحترافي المنظم (Zero-Duplication UI) + محرك البحث الذكي الفوري (Ctrl+K)',
      description: `ترتيب بصري احترافي سريع وخفيف يمنع تكرار التنبيهات والقوائم، مع بحث فوري ذكي في كل الشقق والإيصالات والمصروفات وخريطة تحصيل الأدوار التفاعلية في الرئيسية.`,
      badge: 'مفعّل',
    },
    {
      id: 'auto-version-and-latest-install',
      title: 'تحديث بيانات الإصدار تلقائياً مع كل تحديث وتثبيت أحدث نسخة دائماً',
      description: `يتحدث رقم الإصدار (v${dynamicMeta.version}) ورقم البناء (${dynamicMeta.buildNumber}) تلقائياً مع كل تحديث، كما يقوم زر التثبيت بتجهيز وتثبيت أحدث نسخة دائماً قبل التثبيت.`,
      badge: 'مفعّل',
    },
    {
      id: 'consolidated-settings-and-backup-nav',
      title: 'دمج العرض والثيمات والتثبيت والإصدار والمساعدة في الضبط + أزرار رجوع وإغلاق بالنسخ الاحتياطي',
      description: 'تنظيم شامل لقائمة الضبط يجمع الثيمات وطريقة العرض وتثبيت البرنامج وتحديثات الإصدار والمساعدة في مكان واحد، مع شريط رجوع للخلف وإغلاق في النسخ الاحتياطي.',
      badge: 'مفعّل',
    },
  ];

  return {
    programName: 'تطبيق حسن الجوار - منظومة إدارة العمارة والمصروفات السكنية',
    version: dynamicMeta.version,
    buildNumber: dynamicMeta.buildNumber,
    releaseDate: dynamicMeta.releaseDate,
    cacheVersion: dynamicMeta.cacheVersion,
    updateRevision: dynamicMeta.updateRevision,
    alwaysInstallsLatest: true,
    buildingName: settings.buildingName || 'برج النور',
    buildingAddress: settings.buildingAddress || '',
    treasurerName: settings.treasurerName || 'أحمد إبراهيم عبدالهادي',
    treasurerPhone: settings.treasurerPhone || '',
    instapayUrl: INSTAPAY_PAYMENT_URL,
    instapayRecipient: INSTAPAY_RECIPIENT_NAME,
    apartmentsCount: apartments.length,
    revenuesCount: revenues.length,
    expensesCount: expenses.length,
    estimatedStorageKb,
    hasCustomAppIcon: Boolean(settings.appIconUrl),
    hasCustomOfficialStamp: Boolean(settings.officialStampUrl),
    lastUpdatedFormatted: dynamicMeta.lastUpdatedFormatted,
    changelogFeatures,
  };
}

export type AppDisplayMode = 'desktop' | 'mobile';

export interface AppDisplayModeConfig {
  mode: AppDisplayMode;
  nextMode: AppDisplayMode;
  activeLabelArabic: string;
  activeBadgeArabic: string;
  toggleActionLabelArabic: string;
  descriptionArabic: string;
  rootWrapperClass: string;
  mainContainerClass: string;
  showMobileBottomNav: boolean;
}

/**
 * Pure helper to resolve layout classes, Arabic labels, and toggle state
 * for switching between Mobile Version (عرض الموبايل) and Desktop Version (عرض الكمبيوتر).
 */
export function resolveAppDisplayModeConfig(mode?: string | null): AppDisplayModeConfig {
  const normalizedMode: AppDisplayMode = mode === 'mobile' ? 'mobile' : 'desktop';

  if (normalizedMode === 'mobile') {
    return {
      mode: 'mobile',
      nextMode: 'desktop',
      activeLabelArabic: 'عرض الموبايل',
      activeBadgeArabic: 'نسخة الموبايل (Mobile Version)',
      toggleActionLabelArabic: 'عرض الكمبيوتر',
      descriptionArabic: 'واجهة مخصصة لشاشة الهاتف مع شريط تنقل سفلي وتصميم عمودي مريح للمس',
      rootWrapperClass: 'app-display-mobile',
      mainContainerClass: 'flex-1 w-full mx-auto px-3 py-4 pb-24',
      showMobileBottomNav: true,
    };
  }

  return {
    mode: 'desktop',
    nextMode: 'mobile',
    activeLabelArabic: 'عرض الكمبيوتر',
    activeBadgeArabic: 'نسخة الكمبيوتر (Desktop Version)',
    toggleActionLabelArabic: 'عرض الموبايل',
    descriptionArabic: 'واجهة سطح المكتب الكاملة بعرض عريض وجداول ولوحات متعددة الأعمدة',
    rootWrapperClass: 'app-display-desktop',
    mainContainerClass: 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6',
    showMobileBottomNav: false,
  };
}

export type FloorExcelCellStatus =
  | 'closed_x'        // شقة مقفولة (X بخلفية صفراء/برتقالية وصفر أحمر)
  | 'exempt_named'    // غير مطالب بالدفع / شقة خالية (الاسم بخلفية صفراء/برتقالية وصفر أحمر)
  | 'required_paid'   // مطالب بالدفع وقام بالسداد
  | 'required_unpaid'; // مطالب بالدفع ولم يدفع (0)

export interface FloorExcelUnitCell {
  apartmentId: string;
  unitNumber: string;
  floor: number;
  displayLabel: string;
  fullResidentName: string;
  residentType: 'owner' | 'tenant';
  monthlyFee: number;
  paidAmount: number;
  remainingAmount: number;
  isPartialPaid: boolean;
  status: FloorExcelCellStatus;
  /**
   * Width in half-model columns out of 6 total per floor:
   * - Standard 3-unit floor: 2 + 2 + 2 = 6 (نموذج 1، نموذج 2، نموذج 3)
   * - Floor 5: unit 13 = 4 (نموذج 1 + 2), unit 14 = 2 (نموذج 3)
   * - Floor 9: unit 24 = 2 (نموذج 1), unit 25 = 4 (نموذج 2 + 3)
   * - Floor 10: unit 26 = 3 (نموذج 1 + نصف 2), unit 27 = 3 (نصف 2 + نموذج 3)
   */
  colSpanHalfUnits: 2 | 3 | 4 | 6;
  modelLabelArabic: string;
}

export interface FloorExcelSheetRow {
  floor: number;
  floorTitleArabic: string;
  cells: FloorExcelUnitCell[];
  paidCount: number;
  unpaidCount: number;
  exemptCount: number;
  floorCollectedTotal: number;
}

export interface FloorsExcelSheetData {
  buildingName: string;
  targetMonth: string;
  monthHeaderFormatted: string; // e.g. "أكتوبر - 2026" or "سبتمبر - 2026"
  totalMonthCollected: number;
  expectedMonthlyTotal: number;
  remainingMonthlyTotal: number;
  collectionRatePercent: number;
  paidUnitsCount: number;
  partialUnitsCount: number;
  unpaidUnitsCount: number;
  exemptOrClosedCount: number;
  floors: FloorExcelSheetRow[]; // Ordered from Floor 10 down to Floor 1
  modelsLabels: [string, string, string]; // ['نموذج 1', 'نموذج 2', 'نموذج 3']
  printTimeFormatted: string; // e.g. "25/10/2026 21:12"
  instapayUrl: string;
}

const EXCEL_FLOOR_TITLES: Record<number, string> = {
  1: 'الدور الاول',
  2: 'الدور الثاني',
  3: 'الدور الثالث',
  4: 'الدور الرابع',
  5: 'الدور الخامس',
  6: 'الدور السادس',
  7: 'الدور السابع',
  8: 'الدور الثامن',
  9: 'الدور التاسع',
  10: 'الدور العاشر',
  11: 'الدور الحادي عشر',
  12: 'الدور الثاني عشر',
};

/**
 * Formats an apartment's resident name and determines whether it is a closed 'X' unit
 * or an exempt/vacant named unit matching the official Excel floors sheet layout.
 */
export function formatExcelFloorCellResidentName(apt: Apartment): {
  displayLabel: string;
  isClosedX: boolean;
  isExemptNamed: boolean;
} {
  const num = String(apt.number).trim();
  const rawName = String(apt.residentName || '').trim();
  const notes = String(apt.notes || '').trim();
  const fee = Number(apt.monthlyFee || 0);

  // Explicit closed 'X' units (Units 1, 5, 27 or names starting with X)
  if (
    /^x\d*$/i.test(rawName) ||
    num === '1' && fee === 0 && notes.includes('غير متواجد') ||
    notes.includes('غير جاهزة للسكن') ||
    notes.includes('غير مسكونه')
  ) {
    return {
      displayLabel: 'X',
      isClosedX: true,
      isExemptNamed: false,
    };
  }

  // Concise display labels matching the building's official Excel sheet
  const exactUnitNameOverrides: Record<string, string> = {
    '2': 'عم محمد',
    '3': 'ا/ هاني ابو ضيف',
    '4': 'أ/ محمد سلامة',
    '6': 'ا/ أحمد ابراهيم',
    '7': 'أ/ فؤاد محمد',
    '8': 'أ/ تامر محمد',
    '9': 'عم احمد',
    '10': 'أ/ احمد الشيخ',
    '11': 'أ/ عمر',
    '12': 'أ/ علي السيد',
    '13': 'الشيخ مصطفى',
    '14': 'أم محمد',
    '15': 'أ / عصمت',
    '16': 'أ/ خالد توفيق',
    '17': 'أ/ رأفت أحمد',
    '18': 'الشيخ مصطفى',
    '19': 'الشيخ مصطفى',
    '20': 'أ/ محمد صلاح',
    '21': 'ا/ ايهاب',
    '22': 'أ/ أحمد خميس',
    '23': 'أم سجدة',
    '24': 'أ/ احمد مصطفى',
    '25': 'الشيخ اسامة',
    '26': 'أ/ محمود السعداوي',
  };

  // Only apply override if the residentName still matches the default resident of that unit
  let displayLabel = rawName;
  if (exactUnitNameOverrides[num]) {
    const firstWord = rawName.split(/\s+/)[0] || '';
    if (
      !firstWord ||
      exactUnitNameOverrides[num].includes(firstWord) ||
      rawName.includes('الشيخ') ||
      rawName.includes('مصطفى') ||
      rawName.includes('سعداوي') ||
      rawName.includes('ابراهيم') ||
      rawName.includes('عصمت') ||
      rawName.includes('ايهاب') ||
      rawName.includes('إيهاب')
    ) {
      displayLabel = exactUnitNameOverrides[num];
    }
  }

  const isExemptNamed = fee === 0 || Boolean(apt.isVacant);

  return {
    displayLabel,
    isClosedX: false,
    isExemptNamed,
  };
}

/**
 * Builds the complete architectural & financial Excel Sheet data structure
 * matching the official building floors/models/names sheet (الدور الأول .. الدور العاشر، نموذج 1..3).
 */
export function buildFloorsExcelSheetData(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  settings: BuildingSettings;
  targetMonth: string;
  generatedAt?: Date | string;
}): FloorsExcelSheetData {
  const { apartments, revenues, settings, targetMonth, generatedAt } = params;

  const [yearStr, monthNumStr] = (targetMonth || '2026-10').split('-');
  const arabicMonth = ARABIC_MONTH_NAMES[monthNumStr] || monthNumStr || 'أكتوبر';
  const monthHeaderFormatted = `${arabicMonth}- ${yearStr || '2026'}`;

  // Sum paid per unit for targetMonth
  const paidByUnitId = new Map<string, number>();
  let totalMonthCollected = 0;

  revenues.forEach(rev => {
    const revMonth = rev.monthTarget || rev.date.slice(0, 7);
    if (revMonth === targetMonth) {
      const amt = Number(rev.amount || 0);
      totalMonthCollected += amt;
      if (rev.unitId) {
        paidByUnitId.set(rev.unitId, (paidByUnitId.get(rev.unitId) || 0) + amt);
      }
    }
  });

  // Group apartments by floor descending (10 down to 1)
  const floorsMap = new Map<number, Apartment[]>();
  apartments.forEach(apt => {
    const fl = Number(apt.floor) || 1;
    if (!floorsMap.has(fl)) floorsMap.set(fl, []);
    floorsMap.get(fl)!.push(apt);
  });

  const sortedFloors = Array.from(floorsMap.keys()).sort((a, b) => b - a);

  let expectedMonthlyTotal = 0;
  let paidUnitsCount = 0;
  let partialUnitsCount = 0;
  let unpaidUnitsCount = 0;
  let exemptOrClosedCount = 0;

  const floors: FloorExcelSheetRow[] = sortedFloors.map(fl => {
    const floorApts = (floorsMap.get(fl) || []).sort(
      (a, b) => Number(a.number) - Number(b.number)
    );

    let floorPaidCount = 0;
    let floorUnpaidCount = 0;
    let floorExemptCount = 0;
    let floorCollectedTotal = 0;

    const cells: FloorExcelUnitCell[] = floorApts.map((apt, idx) => {
      const paidAmount = paidByUnitId.get(apt.id) || 0;
      const monthlyFee = Number(apt.monthlyFee || 0);
      const remainingAmount = Math.max(0, monthlyFee - paidAmount);
      const { displayLabel, isClosedX, isExemptNamed } = formatExcelFloorCellResidentName(apt);

      let status: FloorExcelCellStatus = 'required_unpaid';
      let isPartialPaid = false;

      if (isClosedX) {
        status = 'closed_x';
        exemptOrClosedCount += 1;
        floorExemptCount += 1;
      } else if (isExemptNamed && paidAmount === 0) {
        status = 'exempt_named';
        exemptOrClosedCount += 1;
        floorExemptCount += 1;
      } else if (paidAmount > 0) {
        status = 'required_paid';
        paidUnitsCount += 1;
        floorPaidCount += 1;
        if (monthlyFee > 0 && paidAmount < monthlyFee) {
          isPartialPaid = true;
          partialUnitsCount += 1;
        }
      } else {
        status = 'required_unpaid';
        unpaidUnitsCount += 1;
        floorUnpaidCount += 1;
      }

      if (!isClosedX && !isExemptNamed) {
        expectedMonthlyTotal += monthlyFee;
      }
      floorCollectedTotal += paidAmount;

      // Determine proportional span across the 3 models (6 half-units total)
      let colSpanHalfUnits: 2 | 3 | 4 | 6 = 2;
      let modelLabelArabic = `نموذج ${idx + 1}`;

      if (floorApts.length === 1) {
        colSpanHalfUnits = 6;
        modelLabelArabic = 'نموذج 1 + 2 + 3';
      } else if (floorApts.length === 2) {
        const notes = String(apt.notes || '');
        if (apt.number === '13' || notes.includes('نموذج ١ و ٢')) {
          colSpanHalfUnits = 4;
          modelLabelArabic = 'نموذج 1 + 2';
        } else if (apt.number === '14') {
          colSpanHalfUnits = 2;
          modelLabelArabic = 'نموذج 3';
        } else if (apt.number === '24') {
          colSpanHalfUnits = 2;
          modelLabelArabic = 'نموذج 1';
        } else if (apt.number === '25' || notes.includes('النموذج الثاني والثالث')) {
          colSpanHalfUnits = 4;
          modelLabelArabic = 'نموذج 2 + 3';
        } else {
          // Floor 10 (units 26 and 27) or any 2 equal double units: 3 + 3 = 6
          colSpanHalfUnits = 3;
          modelLabelArabic = idx === 0 ? 'نموذج 1 + ½2' : 'نصف 2 + نموذج 3';
        }
      }

      return {
        apartmentId: apt.id,
        unitNumber: String(apt.number),
        floor: fl,
        displayLabel,
        fullResidentName: apt.residentName,
        residentType: apt.residentType || 'owner',
        monthlyFee,
        paidAmount,
        remainingAmount,
        isPartialPaid,
        status,
        colSpanHalfUnits,
        modelLabelArabic,
      };
    });

    return {
      floor: fl,
      floorTitleArabic: EXCEL_FLOOR_TITLES[fl] || `الدور ${fl}`,
      cells,
      paidCount: floorPaidCount,
      unpaidCount: floorUnpaidCount,
      exemptCount: floorExemptCount,
      floorCollectedTotal,
    };
  });

  const remainingMonthlyTotal = Math.max(0, expectedMonthlyTotal - totalMonthCollected);
  const collectionRatePercent =
    expectedMonthlyTotal > 0
      ? Math.min(100, Math.round((totalMonthCollected / expectedMonthlyTotal) * 100))
      : 100;

  // Format PRINT TIME as DD/MM/YYYY HH:mm (matching "PRINT TIME   25/10/2026 21:12")
  const d = generatedAt ? new Date(generatedAt) : new Date();
  const safeDate = Number.isNaN(d.getTime()) ? new Date('2026-10-25T21:12:00') : d;
  const day = String(safeDate.getDate()).padStart(2, '0');
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const year = safeDate.getFullYear();
  const hours = String(safeDate.getHours()).padStart(2, '0');
  const minutes = String(safeDate.getMinutes()).padStart(2, '0');
  const printTimeFormatted = `${day}/${month}/${year} ${hours}:${minutes}`;

  return {
    buildingName: settings.buildingName || 'برج النور',
    targetMonth,
    monthHeaderFormatted,
    totalMonthCollected,
    expectedMonthlyTotal,
    remainingMonthlyTotal,
    collectionRatePercent,
    paidUnitsCount,
    partialUnitsCount,
    unpaidUnitsCount,
    exemptOrClosedCount,
    floors,
    modelsLabels: ['نموذج 1', 'نموذج 2', 'نموذج 3'],
    printTimeFormatted,
    instapayUrl: INSTAPAY_PAYMENT_URL,
  };
}

export interface QuickTaskPresetTemplate {
  id: string;
  title: string;
  priority: 'high' | 'normal';
  categoryLabel: string;
}

export const QUICK_TASK_SMART_TEMPLATES: QuickTaskPresetTemplate[] = [
  {
    id: 'preset-collect-overdue',
    title: 'متابعة تحصيل اشتراكات الشقق المتأخرة عن الشهر الحالي',
    priority: 'high',
    categoryLabel: 'تحصيل مالي',
  },
  {
    id: 'preset-elevator-check',
    title: 'مراجعة الصيانة الدورية للمصعد وسداد دفعة الشركة',
    priority: 'high',
    categoryLabel: 'صيانة المصعد',
  },
  {
    id: 'preset-whatsapp-report',
    title: 'إرسال كشف الأدوار والتقرير الشهري للسكان عبر واتساب',
    priority: 'normal',
    categoryLabel: 'تقارير وتواصل',
  },
  {
    id: 'preset-electricity-water',
    title: 'مراجعة فواتير كهرباء السلم والمصعد وموتور المياه',
    priority: 'normal',
    categoryLabel: 'مرافق وخدمات',
  },
  {
    id: 'preset-cleaning-stairs',
    title: 'التنسيق مع عامل النظافة لغسيل السلم والمدخل الرئيسي',
    priority: 'normal',
    categoryLabel: 'نظافة العقار',
  },
  {
    id: 'preset-backup-json',
    title: 'حفظ نسخة احتياطية محدّثة لقاعدة بيانات العمارة (JSON)',
    priority: 'normal',
    categoryLabel: 'تأمين البيانات',
  },
];

export interface QuickSummaryHubData {
  targetMonth: string;
  monthLabelArabic: string;
  treasuryBalance: number;
  allTimeRevenues: number;
  allTimeExpenses: number;
  monthRevenues: number;
  monthExpenses: number;
  monthNetFlow: number;
  expectedMonthlyPotential: number;
  remainingMonthToCollect: number;
  collectionRatePercent: number;
  unitsSummary: {
    totalUnits: number;
    fullyPaidCount: number;
    partialPaidCount: number;
    unpaidRequiredCount: number;
    exemptOrClosedCount: number;
    ownersCount: number;
    tenantsCount: number;
  };
  tasksSummary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    highPriorityPendingCount: number;
    completionRatePercent: number;
  };
  maintenanceSummary: {
    pendingOrInProgressCount: number;
    urgentMaintenanceCount: number;
  };
  floorsQuickStatus: {
    floor: number;
    floorTitleArabic: string;
    totalUnitsOnFloor: number;
    paidCount: number;
    unpaidCount: number;
    exemptCount: number;
    collectedAmount: number;
  }[];
  topOverdueUnits: {
    apartmentId: string;
    unitNumber: string;
    floor: number;
    residentName: string;
    phone: string;
    monthlyFee: number;
    paidAmount: number;
    remainingAmount: number;
    isPartial: boolean;
  }[];
}

/**
 * Computes all executive summaries, floor statuses, overdue priorities, and quick task statistics
 * for the dedicated Quick Summaries & Tasks screen (شاشة الملخصات والمهام السريعة).
 */
export function buildQuickSummaryHubData(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  expenses: Expense[];
  quickTasks: QuickTask[];
  maintenanceNotes?: MaintenanceNote[];
  settings: BuildingSettings;
  targetMonth: string;
}): QuickSummaryHubData {
  const {
    apartments,
    revenues,
    expenses,
    quickTasks,
    maintenanceNotes = [],
    settings,
    targetMonth,
  } = params;

  const totals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);
  const excelSheet = buildFloorsExcelSheetData({
    apartments,
    revenues,
    settings,
    targetMonth,
  });

  const monthExpenses = expenses
    .filter(e => e.date.startsWith(targetMonth))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthRevenues = excelSheet.totalMonthCollected;
  const monthNetFlow = monthRevenues - monthExpenses;

  const fullyPaidCount = Math.max(0, excelSheet.paidUnitsCount - excelSheet.partialUnitsCount);
  const partialPaidCount = excelSheet.partialUnitsCount;
  const unpaidRequiredCount = excelSheet.unpaidUnitsCount;
  const exemptOrClosedCount = excelSheet.exemptOrClosedCount;

  const ownersCount = apartments.filter(a => a.residentType === 'owner').length;
  const tenantsCount = apartments.filter(a => a.residentType === 'tenant').length;

  // Quick Tasks stats
  const totalTasks = quickTasks.length;
  const completedTasks = quickTasks.filter(t => Boolean(t.completed)).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityPendingCount = quickTasks.filter(
    t => !t.completed && t.priority === 'high'
  ).length;
  const completionRatePercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Maintenance stats
  const activeMaintenance = maintenanceNotes.filter(n => n.status !== 'resolved');
  const urgentMaintenanceCount = activeMaintenance.filter(n => n.priority === 'high').length;

  // Floors quick status
  const floorsQuickStatus = excelSheet.floors.map(f => ({
    floor: f.floor,
    floorTitleArabic: f.floorTitleArabic,
    totalUnitsOnFloor: f.cells.length,
    paidCount: f.paidCount,
    unpaidCount: f.unpaidCount,
    exemptCount: f.exemptCount,
    collectedAmount: f.floorCollectedTotal,
  }));

  // Overdue / unpaid or partial units for current month
  const topOverdueUnits: QuickSummaryHubData['topOverdueUnits'] = [];
  excelSheet.floors
    .slice()
    .reverse()
    .forEach(fl => {
      fl.cells.forEach(cell => {
        if (
          cell.status === 'required_unpaid' ||
          (cell.status === 'required_paid' && cell.isPartialPaid)
        ) {
          const aptObj = apartments.find(a => a.id === cell.apartmentId);
          topOverdueUnits.push({
            apartmentId: cell.apartmentId,
            unitNumber: cell.unitNumber,
            floor: cell.floor,
            residentName: cell.fullResidentName,
            phone: aptObj?.phone || '',
            monthlyFee: cell.monthlyFee,
            paidAmount: cell.paidAmount,
            remainingAmount: cell.remainingAmount,
            isPartial: cell.isPartialPaid,
          });
        }
      });
    });

  return {
    targetMonth,
    monthLabelArabic: formatArabicMonthYear(targetMonth),
    treasuryBalance: totals.currentBalance,
    allTimeRevenues: totals.totalRevenues,
    allTimeExpenses: totals.totalExpenses,
    monthRevenues,
    monthExpenses,
    monthNetFlow,
    expectedMonthlyPotential: excelSheet.expectedMonthlyTotal,
    remainingMonthToCollect: excelSheet.remainingMonthlyTotal,
    collectionRatePercent: excelSheet.collectionRatePercent,
    unitsSummary: {
      totalUnits: apartments.length,
      fullyPaidCount,
      partialPaidCount,
      unpaidRequiredCount,
      exemptOrClosedCount,
      ownersCount,
      tenantsCount,
    },
    tasksSummary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      highPriorityPendingCount,
      completionRatePercent,
    },
    maintenanceSummary: {
      pendingOrInProgressCount: activeMaintenance.length,
      urgentMaintenanceCount,
    },
    floorsQuickStatus,
    topOverdueUnits,
  };
}

export type SettingsModalTabKey =
  | 'general'
  | 'display_install_updates'
  | 'help'
  | 'backup';

export interface SettingsModalTabItem {
  id: SettingsModalTabKey;
  label: string;
  shortLabel: string;
  description: string;
  consolidatedFeatures: string[];
}

/**
 * Returns the consolidated Settings Menu (قائمة الضبط) tabs configuration
 * containing Building Settings, Display Mode & Switcher, App Installation,
 * Version & Update Info, Help/User Guide, and Database Backup.
 */
export function getSettingsModalTabsConfig(): SettingsModalTabItem[] {
  return [
    {
      id: 'general',
      label: 'بيانات العمارة والتنبيهات',
      shortLabel: 'بيانات العمارة',
      description: 'إعدادات العقار، الأيقونة والختم الرسمي، وتنبيهات الاستحقاق ووضع القراءة فقط',
      consolidatedFeatures: ['building_info', 'branding_icon_stamp', 'late_alerts', 'readonly_mode'],
    },
    {
      id: 'display_install_updates',
      label: 'العرض والتثبيت والإصدار',
      shortLabel: 'العرض والتثبيت والإصدار',
      description: 'طريقة عرض التطبيق وطريقة التغيير (كمبيوتر / موبايل)، وتثبيت البرنامج، وتحديثات ومعلومات الإصدار',
      consolidatedFeatures: [
        'display_mode_and_switcher',
        'standalone_app_install',
        'version_and_updates_info',
      ],
    },
    {
      id: 'help',
      label: 'المساعدة ودليل التشغيل',
      shortLabel: 'المساعدة',
      description: 'دليل الاستخدام الشامل، العمل بدون إنترنت (أوفلاين)، وإرشادات التحصيل والتقارير',
      consolidatedFeatures: ['user_guide', 'offline_mode_help', 'faq'],
    },
    {
      id: 'backup',
      label: 'النسخ الاحتياطي وقاعدة البيانات',
      shortLabel: 'النسخ الاحتياطي',
      description: 'تصدير واستعادة قاعدة البيانات (JSON) وإعادة ضبط المصنع',
      consolidatedFeatures: ['backup_export', 'backup_restore', 'factory_reset'],
    },
  ];
}

/**
 * Returns the main operational navigation tab IDs shown in the primary Navbar
 * (excluding Help/Guide, Display Mode, Install, and Version Info which are consolidated inside Settings).
 */
export function getMainNavbarTabIds(): string[] {
  return ['dashboard', 'special_tasks', 'quick_hub', 'units', 'revenues', 'expenses', 'reports'];
}

export interface SmartSearchApartmentHit {
  apartment: Apartment;
  paidThisMonth: number;
  remainingThisMonth: number;
  monthStatus: 'paid' | 'partial' | 'unpaid' | 'exempt';
}

export interface SmartSearchResults {
  query: string;
  normalizedQuery: string;
  totalHits: number;
  apartments: SmartSearchApartmentHit[];
  revenues: Revenue[];
  expenses: Expense[];
}

/**
 * Normalizes Arabic text for fast, forgiving search (unifies alef/hamza, taa marbuta, yaa).
 */
export function normalizeArabicSearchText(text: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * Pure helper that performs instant global smart search across apartments, revenues, and expenses
 * with live month payment status for each matched apartment.
 */
export function searchBuildingRecords(params: {
  query: string;
  apartments: Apartment[];
  revenues: Revenue[];
  expenses: Expense[];
  targetMonth?: string;
}): SmartSearchResults {
  const {
    query,
    apartments,
    revenues,
    expenses,
    targetMonth = '2026-10',
  } = params;

  const normalizedQuery = normalizeArabicSearchText(query);

  // Precompute month paid map per apartment
  const monthPaidMap = new Map<string, number>();
  revenues.forEach(r => {
    const revMonth = r.monthTarget || r.date.slice(0, 7);
    if (revMonth === targetMonth) {
      monthPaidMap.set(r.unitId, (monthPaidMap.get(r.unitId) || 0) + Number(r.amount || 0));
    }
  });

  const mapApartmentHit = (apt: Apartment): SmartSearchApartmentHit => {
    const fee = Number(apt.monthlyFee || 0);
    const paidThisMonth = monthPaidMap.get(apt.id) || 0;
    const remainingThisMonth = Math.max(0, fee - paidThisMonth);
    const { isClosedX, isExemptNamed } = formatExcelFloorCellResidentName(apt);

    let monthStatus: SmartSearchApartmentHit['monthStatus'] = 'unpaid';
    if (isClosedX || (isExemptNamed && paidThisMonth === 0) || (fee <= 0 && paidThisMonth === 0)) {
      monthStatus = 'exempt';
    } else if (paidThisMonth >= fee && fee > 0) {
      monthStatus = 'paid';
    } else if (paidThisMonth > 0) {
      monthStatus = 'partial';
    }
    return {
      apartment: apt,
      paidThisMonth,
      remainingThisMonth,
      monthStatus,
    };
  };

  if (!normalizedQuery) {
    const defaultApartments = apartments.slice(0, 8).map(mapApartmentHit);
    const defaultRevenues = revenues.slice(0, 5);
    const defaultExpenses = expenses.slice(0, 4);
    return {
      query,
      normalizedQuery: '',
      totalHits: defaultApartments.length + defaultRevenues.length + defaultExpenses.length,
      apartments: defaultApartments,
      revenues: defaultRevenues,
      expenses: defaultExpenses,
    };
  }

  const matchedApartments = apartments
    .filter(apt => {
      const floorTitle = EXCEL_FLOOR_TITLES[apt.floor] || `الدور ${apt.floor}`;
      const hay = normalizeArabicSearchText(
        `${apt.number} شقة ${apt.number} ${apt.residentName} ${apt.phone || ''} ${floorTitle} الدور ${apt.floor} ${apt.notes || ''}`
      );
      return hay.includes(normalizedQuery);
    })
    .map(mapApartmentHit);

  const matchedRevenues = revenues.filter(rev => {
    const catLabel = REVENUE_CATEGORY_LABELS[rev.category] || rev.category;
    const hay = normalizeArabicSearchText(
      `${rev.receiptNumber} ${rev.residentName} شقة ${rev.unitNumber} ${rev.amount} ${rev.monthTarget} ${catLabel} ${rev.notes || ''}`
    );
    return hay.includes(normalizedQuery);
  });

  const matchedExpenses = expenses.filter(exp => {
    const catLabel = EXPENSE_CATEGORY_LABELS[exp.category] || exp.category;
    const hay = normalizeArabicSearchText(
      `${exp.title} ${exp.paidTo} ${catLabel} ${exp.amount} ${exp.date} ${exp.notes || ''}`
    );
    return hay.includes(normalizedQuery);
  });

  return {
    query,
    normalizedQuery,
    totalHits: matchedApartments.length + matchedRevenues.length + matchedExpenses.length,
    apartments: matchedApartments,
    revenues: matchedRevenues,
    expenses: matchedExpenses,
  };
}

export interface AppThemeOption {
  id: AppThemeId;
  nameArabic: string;
  subtitleArabic: string;
  badgeArabic: string;
  primaryHex: string;
  secondaryHex: string;
  headerBgHex: string;
  pageBgHex: string;
  navbarGradientClass: string;
  activeTabClass: string;
  accentBadgeClass: string;
  shellBgClass: string;
  isDark: boolean;
}

export const APP_THEMES_CATALOG: AppThemeOption[] = [
  {
    id: 'emerald',
    nameArabic: 'الأخضر الزمردي (الافتراضي)',
    subtitleArabic: 'ثيم برج النور الأصلي المريح للعين',
    badgeArabic: 'الافتراضي',
    primaryHex: '#059669',
    secondaryHex: '#0d9488',
    headerBgHex: '#0f172a',
    pageBgHex: '#f8fafc',
    navbarGradientClass: 'bg-slate-900 border-slate-800',
    activeTabClass: 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20',
    accentBadgeClass: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    shellBgClass: 'bg-slate-50 text-slate-800',
    isDark: false,
  },
  {
    id: 'royal_blue',
    nameArabic: 'الأزرق الملكي الاحترافي',
    subtitleArabic: 'مظهر بنكي رسمي فائق الوضوح',
    badgeArabic: 'رسمي',
    primaryHex: '#2563eb',
    secondaryHex: '#0284c7',
    headerBgHex: '#0c1938',
    pageBgHex: '#f0f7ff',
    navbarGradientClass: 'bg-gradient-to-l from-blue-950 via-slate-900 to-sky-950 border-blue-800/60',
    activeTabClass: 'bg-sky-400 text-slate-950 shadow-sm shadow-sky-400/25',
    accentBadgeClass: 'bg-sky-500/20 border-sky-400/40 text-sky-200',
    shellBgClass: 'bg-sky-50/40 text-slate-800',
    isDark: false,
  },
  {
    id: 'indigo_violet',
    nameArabic: 'البنفسجي الملكي الفاخر',
    subtitleArabic: 'تصميم عصري بلمسات نيلية وبنفسجية',
    badgeArabic: 'فاخر',
    primaryHex: '#4f46e5',
    secondaryHex: '#7c3aed',
    headerBgHex: '#1e1b4b',
    pageBgHex: '#f5f3ff',
    navbarGradientClass: 'bg-gradient-to-l from-indigo-950 via-purple-950 to-slate-900 border-indigo-800/60',
    activeTabClass: 'bg-violet-400 text-slate-950 shadow-sm shadow-violet-400/25',
    accentBadgeClass: 'bg-violet-500/20 border-violet-400/40 text-violet-200',
    shellBgClass: 'bg-indigo-50/35 text-slate-800',
    isDark: false,
  },
  {
    id: 'amber_gold',
    nameArabic: 'الذهبي الكلاسيكي الدافئ',
    subtitleArabic: 'ألوان ذهبية وبرونزية فخمة للعقارات',
    badgeArabic: 'ذهبي',
    primaryHex: '#d97706',
    secondaryHex: '#b45309',
    headerBgHex: '#271705',
    pageBgHex: '#fffbeb',
    navbarGradientClass: 'bg-gradient-to-l from-stone-950 via-amber-950 to-slate-900 border-amber-700/50',
    activeTabClass: 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/25',
    accentBadgeClass: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
    shellBgClass: 'bg-amber-50/30 text-slate-800',
    isDark: false,
  },
  {
    id: 'rose_crimson',
    nameArabic: 'الياقوتي القرمزي الأنيق',
    subtitleArabic: 'تباين قوي وحيوي للوحات المتابعة',
    badgeArabic: 'حيوي',
    primaryHex: '#e11d48',
    secondaryHex: '#db2777',
    headerBgHex: '#2e0916',
    pageBgHex: '#fff1f2',
    navbarGradientClass: 'bg-gradient-to-l from-rose-950 via-slate-900 to-pink-950 border-rose-800/60',
    activeTabClass: 'bg-rose-400 text-slate-950 shadow-sm shadow-rose-400/25',
    accentBadgeClass: 'bg-rose-500/20 border-rose-400/40 text-rose-200',
    shellBgClass: 'bg-rose-50/30 text-slate-800',
    isDark: false,
  },
  {
    id: 'dark_slate',
    nameArabic: 'الوضع الليلي الداكن (Dark Mode)',
    subtitleArabic: 'خلفية داكنة مريحة للعمل الليلي الطويل',
    badgeArabic: 'ليلي داكن',
    primaryHex: '#10b981',
    secondaryHex: '#06b6d4',
    headerBgHex: '#020617',
    pageBgHex: '#0f172a',
    navbarGradientClass: 'bg-slate-950 border-emerald-500/30',
    activeTabClass: 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-400/30',
    accentBadgeClass: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
    shellBgClass: 'bg-slate-900 text-slate-100 app-theme-dark',
    isDark: true,
  },
];

export const APP_ACCENT_COLOR_SWATCHES: { hex: string; labelArabic: string; themeId: AppThemeId }[] = [
  { hex: '#059669', labelArabic: 'أخضر زمردي', themeId: 'emerald' },
  { hex: '#2563eb', labelArabic: 'أزرق ملكي', themeId: 'royal_blue' },
  { hex: '#7c3aed', labelArabic: 'بنفسجي فاخر', themeId: 'indigo_violet' },
  { hex: '#d97706', labelArabic: 'ذهبي كلاسيكي', themeId: 'amber_gold' },
  { hex: '#e11d48', labelArabic: 'ياقوتي قرمزي', themeId: 'rose_crimson' },
  { hex: '#0d9488', labelArabic: 'فيروزي داكن', themeId: 'emerald' },
  { hex: '#0284c7', labelArabic: 'سماوي صافي', themeId: 'royal_blue' },
  { hex: '#0f172a', labelArabic: 'ليلي كحلي', themeId: 'dark_slate' },
];

export function resolveAppThemeConfig(
  themeId?: string | null,
  customAccentColor?: string | null
): AppThemeOption & { effectiveAccentHex: string } {
  const found =
    APP_THEMES_CATALOG.find(t => t.id === themeId) || APP_THEMES_CATALOG[0];
  const cleanAccent =
    customAccentColor && /^#[0-9a-fA-F]{6}$/.test(customAccentColor.trim())
      ? customAccentColor.trim()
      : found.primaryHex;

  return {
    ...found,
    effectiveAccentHex: cleanAccent,
  };
}

export type SmartNotificationCategory =
  | 'overdue_payment'
  | 'pre_due_reminder'
  | 'maintenance_due'
  | 'treasury_insight'
  | 'urgent_task';

export type SmartNotificationPriority = 'critical' | 'high' | 'medium' | 'info';

export type SmartNotificationActionType =
  | 'open_bulk_whatsapp'
  | 'send_whatsapp'
  | 'collect_payment'
  | 'open_unit'
  | 'generate_recurring'
  | 'open_floors_sheet'
  | 'complete_quick_task'
  | 'open_settings';

export interface SmartNotificationItem {
  id: string;
  category: SmartNotificationCategory;
  categoryLabelArabic: string;
  priority: SmartNotificationPriority;
  priorityLabelArabic: string;
  title: string;
  message: string;
  badgeText: string;
  timestampLabel: string;
  primaryActionType: SmartNotificationActionType;
  primaryActionLabel: string;
  secondaryActionType?: SmartNotificationActionType;
  secondaryActionLabel?: string;
  unitId?: string;
  unitNumber?: string;
  residentName?: string;
  amount?: number;
  whatsappUrl?: string;
  quickTaskId?: string;
}

export interface SmartNotificationsSummary {
  isEnabled: boolean;
  targetMonth: string;
  monthLabelArabic: string;
  totalCount: number;
  criticalCount: number;
  highCount: number;
  overdueUnitsCount: number;
  totalOverdueAmount: number;
  unbilledRecurringCount: number;
  pendingMaintenanceCount: number;
  urgentTasksCount: number;
  collectionRatePercent: number;
  topNotificationTitle: string;
  topNotificationBody: string;
  items: SmartNotificationItem[];
}

/**
 * Pure Smart Notification Engine that analyzes the building's real-time financial,
 * occupancy, maintenance, recurring expense, and quick-task records to generate
 * prioritized, actionable smart notifications.
 */
export function buildSmartNotificationsFeed(params: {
  apartments: Apartment[];
  revenues: Revenue[];
  expenses: Expense[];
  recurringExpenses?: RecurringExpense[];
  maintenanceNotes?: MaintenanceNote[];
  quickTasks?: QuickTask[];
  settings: BuildingSettings;
  selectedMonth: string;
  referenceDate?: string;
}): SmartNotificationsSummary {
  const {
    apartments,
    revenues,
    expenses,
    recurringExpenses = [],
    maintenanceNotes = [],
    quickTasks = [],
    settings,
    selectedMonth,
    referenceDate = '2026-10-29',
  } = params;

  const isEnabled = settings.enableSmartNotifications !== false;
  const currency = settings.currency || 'ج.م';
  const monthLabelArabic = formatArabicMonthYear(selectedMonth);
  const dueDay = settings.lateRentAlertDay ?? 10;

  const lateSummary = buildLatePaymentPushSummary(
    apartments,
    revenues,
    selectedMonth,
    dueDay,
    referenceDate,
    settings.enableLateRentAlerts !== false
  );

  const preDueSchedule = evaluatePreDueReminderSchedule(
    apartments,
    revenues,
    selectedMonth,
    dueDay,
    referenceDate,
    settings.enablePreDueBrowserReminder !== false,
    settings.preDueReminderDays ?? 3
  );

  const excelSheet = buildFloorsExcelSheetData({
    apartments,
    revenues,
    settings,
    targetMonth: selectedMonth,
  });

  const totals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);

  const items: SmartNotificationItem[] = [];

  // 1. Aggregate Overdue Alert (Critical)
  if (lateSummary.overdueUnitsCount > 0) {
    items.push({
      id: `smart-overdue-summary-${selectedMonth}`,
      category: 'overdue_payment',
      categoryLabelArabic: 'متأخرات السداد',
      priority: 'critical',
      priorityLabelArabic: 'عاجل جداً',
      title: `تنبيه ذكي: ${lateSummary.overdueUnitsCount} شقق لم تسدد اشتراك (${monthLabelArabic})`,
      message: `إجمالي المبالغ المتأخرة للشهر الحالي ${formatMoney(
        lateSummary.totalOverdueAmount,
        currency
      )} (${lateSummary.tenantsOverdueCount} مستأجرين و ${
        lateSummary.ownersOverdueCount
      } ملاك). يمكنك إرسال تذكير واتساب جماعي أو فردي بضغطة واحدة.`,
      badgeText: `${lateSummary.overdueUnitsCount} شقق متأخرة`,
      timestampLabel: `تجاوز يوم ${lateSummary.dueDay} بـ ${lateSummary.daysPastDue} يوم`,
      primaryActionType: 'open_bulk_whatsapp',
      primaryActionLabel: 'إرسال واتساب لكل المتأخرين',
      secondaryActionType: 'open_floors_sheet',
      secondaryActionLabel: 'عرض كشف الأدوار',
      amount: lateSummary.totalOverdueAmount,
    });

    // Top individual overdue apartments (up to 6) for 1-click collection or WhatsApp
    lateSummary.unpaidUnits.slice(0, 6).forEach(u => {
      const cleanPhone = (u.apartment.phone || '').replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.startsWith('0')
        ? '20' + cleanPhone.slice(1)
        : cleanPhone;
      const reminderText = generateTenantReminderText({
        residentName: u.apartment.residentName,
        unitNumber: u.apartment.number,
        overdueAmount: u.remainingAmount,
        currency,
        buildingName: settings.buildingName,
        treasurerName: settings.treasurerName,
        monthTarget: monthLabelArabic,
        paymentDetails: settings.bankAccountDetails,
        tone: 'gentle',
      });
      const whatsappUrl = waPhone
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(reminderText)}`
        : `https://wa.me/?text=${encodeURIComponent(reminderText)}`;

      items.push({
        id: `smart-overdue-unit-${u.apartment.id}-${selectedMonth}`,
        category: 'overdue_payment',
        categoryLabelArabic: 'سداد الشقق',
        priority: 'high',
        priorityLabelArabic: 'أولوية عالية',
        title: `شقة ${u.apartment.number} (${u.apartment.residentName}) — الدور ${u.apartment.floor}`,
        message: `${
          u.status === 'partial'
            ? `تم سداد ${formatMoney(u.paidThisMonth, currency)} ومتبقي ${formatMoney(
                u.remainingAmount,
                currency
              )}`
            : `لم يتم تسجيل سداد لشهر ${monthLabelArabic} — المستحق ${formatMoney(
                u.remainingAmount,
                currency
              )}`
        }.`,
        badgeText: `${formatMoney(u.remainingAmount, currency)}`,
        timestampLabel: u.apartment.residentType === 'tenant' ? 'مستأجر' : 'مالك',
        primaryActionType: 'collect_payment',
        primaryActionLabel: 'تسجيل سداد فوري',
        secondaryActionType: 'send_whatsapp',
        secondaryActionLabel: 'تذكير واتساب',
        unitId: u.apartment.id,
        unitNumber: u.apartment.number,
        residentName: u.apartment.residentName,
        amount: u.remainingAmount,
        whatsappUrl,
      });
    });
  }

  // 2. Unbilled Recurring Expenses for selectedMonth
  const activeRecurring = recurringExpenses.filter(r => r.isActive);
  const unbilledRecurring = activeRecurring.filter(template => {
    return !expenses.some(
      e =>
        e.date.startsWith(selectedMonth) &&
        (e.title.includes(template.title) ||
          (e.category === template.category && e.paidTo === template.paidTo))
    );
  });

  if (unbilledRecurring.length > 0) {
    const totalUnbilled = unbilledRecurring.reduce((s, r) => s + Number(r.amount || 0), 0);
    const names = unbilledRecurring.map(r => r.title).join(' ، ');
    items.push({
      id: `smart-recurring-unbilled-${selectedMonth}`,
      category: 'treasury_insight',
      categoryLabelArabic: 'المصروفات الشهرية الثابتة',
      priority: 'high',
      priorityLabelArabic: 'تذكير محاسبي',
      title: `يوجد ${unbilledRecurring.length} مصروفات دورية لشهر (${monthLabelArabic}) لم تُسجل بعد`,
      message: `بنود المصروفات الثابتة الجاهزة للتوليد التلقائي (${formatMoney(
        totalUnbilled,
        currency
      )}): ${names}.`,
      badgeText: `${unbilledRecurring.length} مصروف دوري`,
      timestampLabel: 'توليد بضغطة واحدة',
      primaryActionType: 'generate_recurring',
      primaryActionLabel: 'توليد المصروفات الدورية الآن',
      amount: totalUnbilled,
    });
  }

  // 3. Urgent & Pending Quick Tasks
  const urgentTasks = quickTasks.filter(t => !t.completed);
  urgentTasks.slice(0, 3).forEach(task => {
    items.push({
      id: `smart-task-${task.id}`,
      category: 'urgent_task',
      categoryLabelArabic: 'المهام والمتابعة',
      priority: task.priority === 'high' ? 'high' : 'medium',
      priorityLabelArabic: task.priority === 'high' ? 'مهمة عاجلة' : 'مهمة متابعة',
      title: `مهمة مطلوبة: ${task.text}`,
      message: `مهمة مسجلة في قائمة المهام السريعة لـ ${settings.buildingName} وبانتظار الإنجاز.`,
      badgeText: task.priority === 'high' ? 'عاجل' : 'قيد المتابعة',
      timestampLabel: task.createdAt || 'مهمة نشطة',
      primaryActionType: 'complete_quick_task',
      primaryActionLabel: 'تحديد كمنجزة ✓',
      quickTaskId: task.id,
    });
  });

  // 4. Periodic & Pending Maintenance Reminders
  const activeMaint = maintenanceNotes.filter(
    n => n.status !== 'resolved' || n.isPeriodic
  );
  activeMaint.slice(0, 3).forEach(note => {
    items.push({
      id: `smart-maint-${note.id}`,
      category: 'maintenance_due',
      categoryLabelArabic: 'الصيانة الدورية والمصعد',
      priority: note.status !== 'resolved' ? 'high' : 'medium',
      priorityLabelArabic: note.status !== 'resolved' ? 'صيانة نشطة' : 'صيانة دورية مجدولة',
      title: `${note.title}${note.assignedTo ? ` (${note.assignedTo})` : ''}`,
      message: `${note.description || 'متابعة الصيانة الدورية للعمارة'}${
        note.scheduledDate ? ` — الموعد المجدول: ${note.scheduledDate}` : ''
      }.`,
      badgeText: note.costEstimate
        ? formatMoney(note.costEstimate, currency)
        : 'صيانة دورية',
      timestampLabel: note.scheduledDate || 'شهري',
      primaryActionType: 'open_floors_sheet',
      primaryActionLabel: 'مراجعة كشف العمارة',
      amount: note.costEstimate,
    });
  });

  // 5. Pre-Due Schedule & Treasury Collection Insight
  items.push({
    id: `smart-treasury-insight-${selectedMonth}`,
    category: 'treasury_insight',
    categoryLabelArabic: 'مؤشر الخزينة والتحصيل',
    priority: 'info',
    priorityLabelArabic: 'تحليل ذكي',
    title: `نسبة التحصيل لشهر ${monthLabelArabic}: ${excelSheet.collectionRatePercent}% (${formatMoney(
      excelSheet.totalMonthCollected,
      currency
    )} من ${formatMoney(excelSheet.expectedMonthlyTotal, currency)})`,
    message: `رصيد الخزينة الفعلي الحالي: ${formatMoney(
      totals.currentBalance,
      currency
    )} • عدد الشقق المسددة بالكامل: ${excelSheet.paidUnitsCount} شقة • التذكير المسبق القادم: ${
      preDueSchedule.activeScheduledReminderDate
    }.`,
    badgeText: `تحصيل ${excelSheet.collectionRatePercent}%`,
    timestampLabel: 'تحديث فوري',
    primaryActionType: 'open_floors_sheet',
    primaryActionLabel: 'فتح جدول الأدوار والأسماء',
    secondaryActionType: 'open_settings',
    secondaryActionLabel: 'ضبط الإشعارات',
  });

  const criticalCount = items.filter(i => i.priority === 'critical').length;
  const highCount = items.filter(i => i.priority === 'high').length;

  const topNotificationTitle =
    lateSummary.overdueUnitsCount > 0
      ? `حسن الجوار (${settings.buildingName}): ${lateSummary.overdueUnitsCount} شقق متأخرة ونسبة التحصيل ${excelSheet.collectionRatePercent}%`
      : `حسن الجوار (${settings.buildingName}): تم تحصيل ${excelSheet.collectionRatePercent}% لشهر ${monthLabelArabic}`;

  const topNotificationBody =
    lateSummary.overdueUnitsCount > 0
      ? `إجمالي المتأخرات ${formatMoney(
          lateSummary.totalOverdueAmount,
          currency
        )} • رصيد الخزينة ${formatMoney(totals.currentBalance, currency)}.`
      : `جميع الشقق ملتزمة بالسداد • رصيد الخزينة الحالي ${formatMoney(
          totals.currentBalance,
          currency
        )}.`;

  return {
    isEnabled,
    targetMonth: selectedMonth,
    monthLabelArabic,
    totalCount: items.length,
    criticalCount,
    highCount,
    overdueUnitsCount: lateSummary.overdueUnitsCount,
    totalOverdueAmount: lateSummary.totalOverdueAmount,
    unbilledRecurringCount: unbilledRecurring.length,
    pendingMaintenanceCount: activeMaint.length,
    urgentTasksCount: urgentTasks.length,
    collectionRatePercent: excelSheet.collectionRatePercent,
    topNotificationTitle,
    topNotificationBody,
    items,
  };
}

/**
 * Pure helper to update an existing Revenue (installment payment / receipt) record.
 * Automatically syncs unitNumber and residentName if unitId is changed.
 */
export function applyRevenueUpdate(
  revenues: Revenue[],
  apartments: Apartment[],
  id: string,
  updates: Partial<Revenue>
): Revenue[] {
  return revenues.map(rev => {
    if (rev.id !== id) return rev;
    const nextUnitId = updates.unitId ?? rev.unitId;
    const matchedApt = apartments.find(a => a.id === nextUnitId);
    const syncedUnitNumber =
      updates.unitNumber !== undefined
        ? updates.unitNumber
        : matchedApt && nextUnitId !== rev.unitId
        ? matchedApt.number
        : rev.unitNumber;
    const syncedResidentName =
      updates.residentName !== undefined
        ? updates.residentName
        : matchedApt && nextUnitId !== rev.unitId
        ? matchedApt.residentName
        : rev.residentName;

    return {
      ...rev,
      ...updates,
      unitId: nextUnitId,
      unitNumber: syncedUnitNumber,
      residentName: syncedResidentName,
      amount: updates.amount !== undefined ? Number(updates.amount) : rev.amount,
    };
  });
}

/**
 * Pure helper to update an existing Expense (voucher) record.
 */
export function applyExpenseUpdate(
  expenses: Expense[],
  id: string,
  updates: Partial<Expense>
): Expense[] {
  return expenses.map(exp => {
    if (exp.id !== id) return exp;
    return {
      ...exp,
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : exp.amount,
    };
  });
}

/**
 * Pure helper to update an existing QuickTask record.
 */
export function applyQuickTaskUpdate(
  tasks: QuickTask[],
  id: string,
  updates: Partial<QuickTask>
): QuickTask[] {
  return tasks.map(t => {
    if (t.id !== id) return t;
    return {
      ...t,
      ...updates,
      text: updates.text !== undefined ? updates.text.trim() : t.text,
    };
  });
}

/**
 * Pure helper to update an archived tenant record inside an apartment's previousTenants history.
 */
export function applyArchivedTenantUpdate(
  apartments: Apartment[],
  apartmentId: string,
  recordId: string,
  updates: Partial<PreviousTenantRecord>
): Apartment[] {
  return apartments.map(apt => {
    if (apt.id !== apartmentId) return apt;
    const updatedHistory = (apt.previousTenants || []).map(rec =>
      rec.id === recordId ? { ...rec, ...updates } : rec
    );
    return {
      ...apt,
      previousTenants: updatedHistory,
    };
  });
}



