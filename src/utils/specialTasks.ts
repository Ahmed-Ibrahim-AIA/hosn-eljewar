import {
  Apartment,
  BuildingSettings,
  PaymentMethod,
  SpecialTaskCustomColumn,
  SpecialTaskProject,
  SpecialTaskResidentRow,
} from '../types';
import {
  formatMoney,
  INSTAPAY_PAYMENT_URL,
  INSTAPAY_RECIPIENT_NAME,
  PAYMENT_METHOD_LABELS,
} from './finance';

export interface SpecialTaskRowComputedSummary {
  rowId: string;
  unitId: string;
  unitNumber: string;
  floor: number;
  residentName: string;
  phone: string;
  moneyColumnsTotal: number;
  countColumnsMonetaryTotal: number;
  totalRequired: number;
  totalCountItems: number;
  paidAmount: number;
  remainingAmount: number;
  overpaidAmount: number;
  status: 'paid' | 'partial' | 'unpaid' | 'zero';
  statusLabelArabic: string;
  progressPercent: number;
}

export interface SpecialTaskColumnStatistic {
  columnId: string;
  title: string;
  type: 'money' | 'count';
  unitLabel: string;
  unitPrice: number;
  totalSum: number;                  // مجموع الأرقام في العمود (سواء مبلغ مالي أو عدد قطع)
  totalMonetaryEquivalent: number;   // القيمة المالية الإجمالية للعمود (نفس totalSum للأموال، أو totalSum * unitPrice للعدد)
  averagePerRow: number;
  minValue: number;
  maxValue: number;
  activeRowsCount: number;           // عدد السكان الذين لديهم قيمة أكبر من صفر في هذا العمود
}

export interface SpecialTaskPaymentMethodStat {
  method: PaymentMethod;
  labelArabic: string;
  collectedAmount: number;
  rowsCount: number;
  percentageOfCollected: number;
}

export interface SpecialTaskAnalyticsSummary {
  taskId: string;
  title: string;
  totalResidentsCount: number;
  paidResidentsCount: number;
  partialResidentsCount: number;
  unpaidResidentsCount: number;
  zeroRequirementCount: number;
  grandTotalRequired: number;
  grandTotalCollected: number;
  grandTotalRemaining: number;
  grandTotalOverpaid: number;
  grandTotalCountItems: number;
  collectionRatePercent: number;
  averageRequiredPerResident: number;
  columnStats: SpecialTaskColumnStatistic[];
  rowSummaries: Record<string, SpecialTaskRowComputedSummary>;
  paymentMethodsBreakdown: SpecialTaskPaymentMethodStat[];
}

export interface SpecialTaskTemplatePreset {
  id: string;
  title: string;
  categoryLabel: string;
  targetGroupLabel: string;
  description: string;
  columns: Omit<SpecialTaskCustomColumn, 'id'>[];
}

export const SPECIAL_TASK_SMART_TEMPLATES: SpecialTaskTemplatePreset[] = [
  {
    id: 'tpl-cameras-remotes',
    title: 'تركيب منظومة كاميرات مراقبة وريموتات البوابة الإلكترونية',
    categoryLabel: 'تحسينات وأمن العقار',
    targetGroupLabel: 'السكان المشتركون في المنظومة',
    description: 'تجميع مساهمات شراء وتركيب كاميرات المراقبة مع حصر عدد الريموتات المطلوبة لكل شقة وتكلفة البرمجة.',
    columns: [
      { title: 'مساهمة الكاميرات (أساسي)', type: 'money', defaultValue: 300 },
      { title: 'عدد ريموتات البوابة', type: 'count', defaultValue: 1, unitLabel: 'ريموت', unitPrice: 150 },
      { title: 'تكلفة التركيب والبرمجة', type: 'money', defaultValue: 100 },
      { title: 'مساهمة كابلات إضافية', type: 'money', defaultValue: 50 },
    ],
  },
  {
    id: 'tpl-water-motor-valves',
    title: 'تجديد موتور المياه الرئيسي وتغيير محابس الشقق',
    categoryLabel: 'صيانة خاصة لمجموعة سكان',
    targetGroupLabel: 'شقق الأدوار المشتركة في خط المياه',
    description: 'حساب نصيب كل شقة من تكلفة موتور المياه الجديد مع عدد المحابس النحاسية المطلوبة لكل شقة ومصنعية السباك.',
    columns: [
      { title: 'حصة موتور المياه', type: 'money', defaultValue: 400 },
      { title: 'عدد المحابس المطلوبة', type: 'count', defaultValue: 2, unitLabel: 'محبس', unitPrice: 120 },
      { title: 'أجر المصنعية والتركيب', type: 'money', defaultValue: 110 },
    ],
  },
  {
    id: 'tpl-elevator-cards',
    title: 'تحديث لوحة الأسانسير وتجميعة الكروت الذكية والمفاتيح',
    categoryLabel: 'تجميعة مستلزمات ومصعد',
    targetGroupLabel: 'السكان المستخدمون للمصعد',
    description: 'تجميع رسوم تحديث كارتة المصعد مع تحديد عدد الكروت الممغنطة والمفاتيح المطلوبة لكل ساكن.',
    columns: [
      { title: 'حصة تحديث لوحة المصعد', type: 'money', defaultValue: 250 },
      { title: 'عدد الكروت الذكية', type: 'count', defaultValue: 3, unitLabel: 'كارت', unitPrice: 50 },
      { title: 'عدد مفاتيح الطوارئ', type: 'count', defaultValue: 1, unitLabel: 'مفتاح', unitPrice: 35 },
      { title: 'رسوم صيانة طارئة', type: 'money', defaultValue: 65 },
    ],
  },
  {
    id: 'tpl-roof-insulation',
    title: 'عزل وتبليط السطح وصيانة خزانات المياه العلوية',
    categoryLabel: 'صيانة إنشائية وعزل',
    targetGroupLabel: 'ملاك الشقق المشتركون',
    description: 'توزيع تكلفة مواد العزل الحراري والمائي وتنظيف الخزانات على الملاك والسكان المحددين.',
    columns: [
      { title: 'قيمة خامات العزل والأسمنت', type: 'money', defaultValue: 500 },
      { title: 'عدد شكاير المواد المخصصة', type: 'count', defaultValue: 2, unitLabel: 'شكارة', unitPrice: 0 },
      { title: 'مصنعية العزل والسباكة', type: 'money', defaultValue: 200 },
      { title: 'احتياطي طوارئ المشروع', type: 'money', defaultValue: 100 },
    ],
  },
];

export const INITIAL_SPECIAL_TASKS: SpecialTaskProject[] = [
  {
    id: 'sp-task-cameras-2026',
    title: 'تركيب منظومة كاميرات مراقبة وريموتات البوابة الإلكترونية',
    description:
      'تجميع تكلفة كاميرات المراقبة عالية الدقة بمدخل برج النور مع حصر عدد الريموتات المطلوبة لكل ساكن ورسوم التركيب.',
    categoryLabel: 'تحسينات وأمن العقار',
    targetGroupLabel: 'مجموعة السكان المشتركين (8 شقق)',
    status: 'active',
    createdAt: '2026-10-20',
    updatedAt: '2026-10-28',
    columns: [
      {
        id: 'col-cam-base',
        title: 'مساهمة الكاميرات',
        type: 'money',
        defaultValue: 300,
      },
      {
        id: 'col-remotes-qty',
        title: 'عدد الريموتات',
        type: 'count',
        defaultValue: 1,
        unitLabel: 'ريموت',
        unitPrice: 150,
      },
      {
        id: 'col-install-fee',
        title: 'رسوم التركيب والبرمجة',
        type: 'money',
        defaultValue: 100,
      },
      {
        id: 'col-extra-cable',
        title: 'مساهمة كابلات وشاشة',
        type: 'money',
        defaultValue: 50,
      },
    ],
    rows: [
      {
        id: 'row-sp-1',
        unitId: '48620815-154f-4450-8e75-09fdaf45bfac',
        unitNumber: '6',
        floor: 2,
        residentName: 'احمد ابراهيم عبدالهادي',
        phone: '01000322790',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 2,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 750,
        paymentMethod: 'instapay',
        paidAt: '2026-10-22',
        notes: 'تم السداد بالكامل عبر إنستاباي (٢ ريموت)',
      },
      {
        id: 'row-sp-2',
        unitId: '519a0680-737a-410c-8ced-42725d0c9aff',
        unitNumber: '3',
        floor: 1,
        residentName: 'هاني ابو ضيف',
        phone: '01129450006',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 1,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 600,
        paymentMethod: 'cash',
        paidAt: '2026-10-23',
        notes: 'تم السداد نقداً',
      },
      {
        id: 'row-sp-3',
        unitId: '2f08fb57-d2ac-4f47-afa3-1dd918a37348',
        unitNumber: '2',
        floor: 1,
        residentName: 'عم محمد دغيدي',
        phone: '01098103130',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 1,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 400,
        paymentMethod: 'vodafone_cash',
        paidAt: '2026-10-24',
        notes: 'دفع دفعة أولى ومتبقي ٢٠٠ ج.م',
      },
      {
        id: 'row-sp-4',
        unitId: 'apt-8',
        unitNumber: '8',
        floor: 3,
        residentName: 'تامر محمد',
        phone: '01005166021',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 2,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 750,
        paymentMethod: 'instapay',
        paidAt: '2026-10-25',
        notes: 'تم التحصيل بالكامل',
      },
      {
        id: 'row-sp-5',
        unitId: 'apt-11',
        unitNumber: '11',
        floor: 4,
        residentName: 'عمر',
        phone: '01223419553',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 1,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 0,
        paymentMethod: 'cash',
        notes: 'بانتظار التحصيل',
      },
      {
        id: 'row-sp-6',
        unitId: '715bfdcc-e23c-4710-a228-b90046d019a0',
        unitNumber: '26',
        floor: 10,
        residentName: 'محمود محمد محمد السعداوي',
        phone: '01227303748',
        values: {
          'col-cam-base': 300,
          'col-remotes-qty': 3,
          'col-install-fee': 100,
          'col-extra-cable': 50,
        },
        paidAmount: 600,
        paymentMethod: 'bank_transfer',
        paidAt: '2026-10-26',
        notes: 'طلب ٣ ريموتات للشقة المزدوجة',
      },
    ],
  },
  {
    id: 'sp-task-water-pump-2026',
    title: 'صيانة وتجديد موتور المياه الرئيسي وتركيب محابس نحاس',
    description:
      'تجميعة خاصة لإصلاح موتور المياه وتركيب محابس فرعية جديدة للشقق المشاركة.',
    categoryLabel: 'صيانة خاصة لمجموعة سكان',
    targetGroupLabel: 'السكان المشتركون في خط المياه (5 شقق)',
    status: 'active',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-27',
    columns: [
      {
        id: 'col-pump-share',
        title: 'حصة موتور المياه',
        type: 'money',
        defaultValue: 350,
      },
      {
        id: 'col-valves-count',
        title: 'عدد المحابس النحاس',
        type: 'count',
        defaultValue: 2,
        unitLabel: 'محبس',
        unitPrice: 100,
      },
      {
        id: 'col-plumber-fee',
        title: 'أجر السباكة والتركيب',
        type: 'money',
        defaultValue: 100,
      },
    ],
    rows: [
      {
        id: 'row-wp-1',
        unitId: '48620815-154f-4450-8e75-09fdaf45bfac',
        unitNumber: '6',
        floor: 2,
        residentName: 'احمد ابراهيم عبدالهادي',
        phone: '01000322790',
        values: {
          'col-pump-share': 350,
          'col-valves-count': 2,
          'col-plumber-fee': 100,
        },
        paidAmount: 650,
        paymentMethod: 'cash',
        paidAt: '2026-10-20',
      },
      {
        id: 'row-wp-2',
        unitId: '519a0680-737a-410c-8ced-42725d0c9aff',
        unitNumber: '3',
        floor: 1,
        residentName: 'هاني ابو ضيف',
        phone: '01129450006',
        values: {
          'col-pump-share': 350,
          'col-valves-count': 1,
          'col-plumber-fee': 100,
        },
        paidAmount: 550,
        paymentMethod: 'instapay',
        paidAt: '2026-10-21',
      },
      {
        id: 'row-wp-3',
        unitId: 'd9d97f90-7c47-4490-9f16-a03d22ec6074',
        unitNumber: '8',
        floor: 3,
        residentName: 'خالد محمد',
        phone: '01005166021',
        values: {
          'col-pump-share': 350,
          'col-valves-count': 2,
          'col-plumber-fee': 100,
        },
        paidAmount: 300,
        paymentMethod: 'cash',
        paidAt: '2026-10-22',
      },
    ],
  },
];

/**
 * Computes the financial and quantity summary for a single resident row in a Special Task.
 */
export function computeSpecialTaskRowSummary(
  row: SpecialTaskResidentRow,
  columns: SpecialTaskCustomColumn[]
): SpecialTaskRowComputedSummary {
  let moneyColumnsTotal = 0;
  let countColumnsMonetaryTotal = 0;
  let totalCountItems = 0;

  for (const col of columns) {
    const rawVal = Number(row.values?.[col.id] ?? 0);
    const val = Number.isFinite(rawVal) ? Math.max(0, rawVal) : 0;

    if (col.type === 'money') {
      moneyColumnsTotal += val;
    } else if (col.type === 'count') {
      totalCountItems += val;
      const unitPrice = Number(col.unitPrice || 0);
      if (unitPrice > 0) {
        countColumnsMonetaryTotal += val * unitPrice;
      }
    }
  }

  const totalRequired = Math.round((moneyColumnsTotal + countColumnsMonetaryTotal) * 100) / 100;
  const paidAmount = Math.max(0, Math.round(Number(row.paidAmount || 0) * 100) / 100);
  const remainingAmount = Math.max(0, Math.round((totalRequired - paidAmount) * 100) / 100);
  const overpaidAmount = Math.max(0, Math.round((paidAmount - totalRequired) * 100) / 100);

  let status: SpecialTaskRowComputedSummary['status'] = 'unpaid';
  let statusLabelArabic = 'لم يسدد';

  if (totalRequired <= 0 && paidAmount <= 0) {
    status = 'zero';
    statusLabelArabic = 'غير مطالب';
  } else if (paidAmount >= totalRequired && totalRequired > 0) {
    status = 'paid';
    statusLabelArabic = 'تم السداد بالكامل';
  } else if (paidAmount > 0 && paidAmount < totalRequired) {
    status = 'partial';
    statusLabelArabic = 'سداد جزئي';
  }

  const progressPercent =
    totalRequired > 0
      ? Math.min(100, Math.round((paidAmount / totalRequired) * 100))
      : paidAmount > 0
      ? 100
      : 0;

  return {
    rowId: row.id,
    unitId: row.unitId,
    unitNumber: row.unitNumber,
    floor: row.floor,
    residentName: row.residentName,
    phone: row.phone,
    moneyColumnsTotal,
    countColumnsMonetaryTotal,
    totalRequired,
    totalCountItems,
    paidAmount,
    remainingAmount,
    overpaidAmount,
    status,
    statusLabelArabic,
    progressPercent,
  };
}

/**
 * Computes full statistics across all rows and all dynamic columns of a Special Task.
 * Used for the top statistics dashboard above the table and for exports.
 */
export function calculateSpecialTaskAnalytics(
  task: SpecialTaskProject
): SpecialTaskAnalyticsSummary {
  const rowSummaries: Record<string, SpecialTaskRowComputedSummary> = {};
  let paidResidentsCount = 0;
  let partialResidentsCount = 0;
  let unpaidResidentsCount = 0;
  let zeroRequirementCount = 0;

  let grandTotalRequired = 0;
  let grandTotalCollected = 0;
  let grandTotalRemaining = 0;
  let grandTotalOverpaid = 0;
  let grandTotalCountItems = 0;

  const methodTotals: Record<PaymentMethod, { amount: number; count: number }> = {
    cash: { amount: 0, count: 0 },
    instapay: { amount: 0, count: 0 },
    vodafone_cash: { amount: 0, count: 0 },
    bank_transfer: { amount: 0, count: 0 },
    check: { amount: 0, count: 0 },
  };

  for (const row of task.rows) {
    const summary = computeSpecialTaskRowSummary(row, task.columns);
    rowSummaries[row.id] = summary;

    if (summary.status === 'paid') paidResidentsCount++;
    else if (summary.status === 'partial') partialResidentsCount++;
    else if (summary.status === 'unpaid') unpaidResidentsCount++;
    else zeroRequirementCount++;

    grandTotalRequired += summary.totalRequired;
    grandTotalCollected += summary.paidAmount;
    grandTotalRemaining += summary.remainingAmount;
    grandTotalOverpaid += summary.overpaidAmount;
    grandTotalCountItems += summary.totalCountItems;

    if (summary.paidAmount > 0) {
      const m = row.paymentMethod || 'cash';
      if (methodTotals[m]) {
        methodTotals[m].amount += summary.paidAmount;
        methodTotals[m].count += 1;
      }
    }
  }

  const columnStats: SpecialTaskColumnStatistic[] = task.columns.map(col => {
    let totalSum = 0;
    let minVal = Infinity;
    let maxVal = 0;
    let activeRowsCount = 0;

    for (const row of task.rows) {
      const rawVal = Number(row.values?.[col.id] ?? 0);
      const val = Number.isFinite(rawVal) ? Math.max(0, rawVal) : 0;
      totalSum += val;
      if (val > 0) activeRowsCount++;
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }

    if (task.rows.length === 0 || minVal === Infinity) {
      minVal = 0;
    }

    const unitPrice = col.type === 'count' ? Number(col.unitPrice || 0) : 1;
    const totalMonetaryEquivalent =
      col.type === 'money'
        ? totalSum
        : unitPrice > 0
        ? totalSum * unitPrice
        : 0;

    const averagePerRow =
      task.rows.length > 0 ? Math.round((totalSum / task.rows.length) * 100) / 100 : 0;

    return {
      columnId: col.id,
      title: col.title,
      type: col.type,
      unitLabel: col.unitLabel || (col.type === 'count' ? 'وحدة' : ''),
      unitPrice: col.type === 'count' ? Number(col.unitPrice || 0) : 0,
      totalSum: Math.round(totalSum * 100) / 100,
      totalMonetaryEquivalent: Math.round(totalMonetaryEquivalent * 100) / 100,
      averagePerRow,
      minValue: minVal,
      maxValue: maxVal,
      activeRowsCount,
    };
  });

  const collectionRatePercent =
    grandTotalRequired > 0
      ? Math.min(100, Math.round((grandTotalCollected / grandTotalRequired) * 100))
      : 0;

  const averageRequiredPerResident =
    task.rows.length > 0
      ? Math.round((grandTotalRequired / task.rows.length) * 100) / 100
      : 0;

  const paymentMethodsBreakdown: SpecialTaskPaymentMethodStat[] = (
    ['cash', 'instapay', 'vodafone_cash', 'bank_transfer', 'check'] as PaymentMethod[]
  ).map(method => {
    const entry = methodTotals[method];
    return {
      method,
      labelArabic: PAYMENT_METHOD_LABELS[method] || method,
      collectedAmount: Math.round(entry.amount * 100) / 100,
      rowsCount: entry.count,
      percentageOfCollected:
        grandTotalCollected > 0
          ? Math.round((entry.amount / grandTotalCollected) * 100)
          : 0,
    };
  });

  return {
    taskId: task.id,
    title: task.title,
    totalResidentsCount: task.rows.length,
    paidResidentsCount,
    partialResidentsCount,
    unpaidResidentsCount,
    zeroRequirementCount,
    grandTotalRequired: Math.round(grandTotalRequired * 100) / 100,
    grandTotalCollected: Math.round(grandTotalCollected * 100) / 100,
    grandTotalRemaining: Math.round(grandTotalRemaining * 100) / 100,
    grandTotalOverpaid: Math.round(grandTotalOverpaid * 100) / 100,
    grandTotalCountItems,
    collectionRatePercent,
    averageRequiredPerResident,
    columnStats,
    rowSummaries,
    paymentMethodsBreakdown,
  };
}

/**
 * Distributes a target total lump-sum amount equally across all rows of a chosen column.
 */
export function distributeAmountAcrossSpecialTaskRows(
  rows: SpecialTaskResidentRow[],
  columnId: string,
  totalAmountToSplit: number
): SpecialTaskResidentRow[] {
  if (rows.length === 0) return rows;
  const perRowShare = Math.round((Math.max(0, totalAmountToSplit) / rows.length) * 100) / 100;
  return rows.map(row => ({
    ...row,
    values: {
      ...row.values,
      [columnId]: perRowShare,
    },
  }));
}

/**
 * Creates a new SpecialTaskResidentRow from a selected Apartment (or custom fallback).
 */
export function createResidentRowFromApartment(
  apt: Apartment | null,
  columns: SpecialTaskCustomColumn[],
  customFallbackName: string = 'ساكن جديد'
): SpecialTaskResidentRow {
  const defaultValues: Record<string, number> = {};
  for (const col of columns) {
    defaultValues[col.id] = Number(col.defaultValue || 0);
  }

  return {
    id: `sprow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    unitId: apt ? apt.id : 'custom',
    unitNumber: apt ? apt.number : '-',
    floor: apt ? apt.floor : 1,
    residentName: apt ? apt.residentName : customFallbackName,
    phone: apt ? apt.phone || '' : '',
    values: defaultValues,
    paidAmount: 0,
    paymentMethod: 'cash',
    notes: '',
  };
}

/**
 * Formats a personalized Arabic WhatsApp message for a single resident in a Special Task.
 */
export function buildSpecialTaskRowWhatsAppMessage(params: {
  task: SpecialTaskProject;
  row: SpecialTaskResidentRow;
  settings: BuildingSettings;
}): string {
  const { task, row, settings } = params;
  const summary = computeSpecialTaskRowSummary(row, task.columns);
  const currency = settings.currency || 'ج.م';

  const lines: string[] = [];
  lines.push(`*${settings.buildingName} - إشعار مهمة خاصة*`);
  lines.push(`*الموضوع:* ${task.title}`);
  lines.push(`────────────────────`);
  lines.push(`أهلاً بحضرتك أ/ *${row.residentName}* (شقة ${row.unitNumber} - الدور ${row.floor})`);
  lines.push(`فيما يلي تفصيل مساهمة حضرتك في المهمة الخاصة:`);

  for (const col of task.columns) {
    const val = Number(row.values?.[col.id] ?? 0);
    if (col.type === 'money') {
      lines.push(`• ${col.title}: *${formatMoney(val, currency)}*`);
    } else {
      const uLabel = col.unitLabel || 'وحدة';
      const uPrice = Number(col.unitPrice || 0);
      if (uPrice > 0) {
        lines.push(
          `• ${col.title}: *${val} ${uLabel}* (× ${formatMoney(uPrice, currency)} = *${formatMoney(
            val * uPrice,
            currency
          )}*)`
        );
      } else {
        lines.push(`• ${col.title}: *${val} ${uLabel}*`);
      }
    }
  }

  lines.push(`────────────────────`);
  lines.push(`• *إجمالي المطلوب:* ${formatMoney(summary.totalRequired, currency)}`);
  lines.push(`• *المسدد حتى الآن:* ${formatMoney(summary.paidAmount, currency)}`);
  lines.push(`• *المتبقي للسداد:* ${formatMoney(summary.remainingAmount, currency)}`);
  lines.push(`• *الحالة:* ${summary.statusLabelArabic}`);

  if (summary.remainingAmount > 0) {
    lines.push(`────────────────────`);
    lines.push(`*طرق السداد المتاحة:*`);
    lines.push(`1. نقداً مع أمين الصندوق (${settings.treasurerName})`);
    lines.push(`2. عبر إنستاباي (InstaPay) على الرابط المباشر:`);
    lines.push(`${INSTAPAY_PAYMENT_URL}`);
    lines.push(`باسم: ${INSTAPAY_RECIPIENT_NAME}`);
  } else {
    lines.push(`────────────────────`);
    lines.push(`خالص الشكر والتقدير لحضرتك على التزامك وسداد المساهمة بالكامل.`);
  }

  return lines.join('\n');
}

/**
 * Generates a complete, group-ready written WhatsApp report for the entire Special Task.
 */
export function buildSpecialTaskFullWrittenReport(
  task: SpecialTaskProject,
  settings: BuildingSettings
): string {
  const analytics = calculateSpecialTaskAnalytics(task);
  const currency = settings.currency || 'ج.م';

  const lines: string[] = [];
  lines.push(`*تقرير مهمة خاصة - ${settings.buildingName}*`);
  lines.push(`*${task.title}*`);
  if (task.description) {
    lines.push(`${task.description}`);
  }
  lines.push(`════════════════════`);
  lines.push(`*أولاً: الإحصائية الإجمالية للمهمة*`);
  lines.push(`• عدد السكان المشتركين: *${analytics.totalResidentsCount} ساكن*`);
  lines.push(
    `• حالة السداد: (${analytics.paidResidentsCount} مسدد بالكامل | ${analytics.partialResidentsCount} سداد جزئي | ${analytics.unpaidResidentsCount} لم يسدد)`
  );
  lines.push(`• إجمالي المبالغ المطلوبة: *${formatMoney(analytics.grandTotalRequired, currency)}*`);
  lines.push(
    `• إجمالي المحصل الفعلي: *${formatMoney(analytics.grandTotalCollected, currency)}* (${analytics.collectionRatePercent}%)`
  );
  lines.push(`• إجمالي المتبقي للتحصيل: *${formatMoney(analytics.grandTotalRemaining, currency)}*`);

  lines.push(`────────────────────`);
  lines.push(`*ثانياً: إحصائية الأعمدة والبنود*`);
  for (const colStat of analytics.columnStats) {
    if (colStat.type === 'money') {
      lines.push(
        `• إجمالي (${colStat.title}): *${formatMoney(colStat.totalSum, currency)}* (متوسط الساكن: ${formatMoney(
          colStat.averagePerRow,
          currency
        )})`
      );
    } else {
      const priceNote =
        colStat.unitPrice > 0
          ? ` — بإجمالي مالي *${formatMoney(colStat.totalMonetaryEquivalent, currency)}*`
          : '';
      lines.push(
        `• إجمالي (${colStat.title}): *${colStat.totalSum} ${colStat.unitLabel}*${priceNote}`
      );
    }
  }

  lines.push(`────────────────────`);
  lines.push(`*ثالثاً: بيان السكان والمساهمات*`);
  task.rows.forEach((row, idx) => {
    const s = analytics.rowSummaries[row.id];
    const colDetails = task.columns
      .map(c => {
        const v = Number(row.values?.[c.id] ?? 0);
        return c.type === 'money'
          ? `${c.title}: ${v}`
          : `${c.title}: ${v} ${c.unitLabel || ''}`.trim();
      })
      .join(' | ');
    const statusIcon =
      s.status === 'paid' ? '✅' : s.status === 'partial' ? '⏳' : '⭕';
    lines.push(
      `${idx + 1}. ${statusIcon} *${row.residentName}* (شقة ${row.unitNumber}): مطلوب *${formatMoney(
        s.totalRequired,
        currency
      )}* | مسدد *${formatMoney(s.paidAmount, currency)}* | متبقي *${formatMoney(
        s.remainingAmount,
        currency
      )}* (${colDetails})`
    );
  });

  lines.push(`════════════════════`);
  lines.push(`*رابط السداد المباشر عبر إنستاباي (InstaPay):*`);
  lines.push(`${INSTAPAY_PAYMENT_URL}`);
  lines.push(`باسم: *${INSTAPAY_RECIPIENT_NAME}*`);
  lines.push(`إدارة ${settings.buildingName} — تطبيق حسن الجوار`);

  return lines.join('\n');
}

/**
 * Builds the 2D spreadsheet headers and rows for exporting the Special Task to Excel/CSV/ODS/XML/JSON.
 */
export function buildSpecialTaskSpreadsheetMatrix(
  task: SpecialTaskProject,
  settings: BuildingSettings
): {
  sheetTitle: string;
  headers: string[];
  rows: (string | number)[][];
  analytics: SpecialTaskAnalyticsSummary;
} {
  const analytics = calculateSpecialTaskAnalytics(task);
  const currency = settings.currency || 'ج.م';

  const headers: string[] = [
    'م',
    'رقم الشقة',
    'الدور',
    'اسم الساكن',
    'رقم الهاتف',
    ...task.columns.map(c =>
      c.type === 'money'
        ? `${c.title} (${currency})`
        : c.unitPrice && c.unitPrice > 0
        ? `${c.title} (${c.unitLabel || 'عدد'} × ${c.unitPrice} ${currency})`
        : `${c.title} (${c.unitLabel || 'عدد'})`
    ),
    `إجمالي المطلوب (${currency})`,
    `المبلغ المسدد (${currency})`,
    `المتبقي (${currency})`,
    'طريقة التحصيل',
    'حالة السداد',
    'تاريخ السداد',
    'ملاحظات',
  ];

  const rows: (string | number)[][] = task.rows.map((row, idx) => {
    const s = analytics.rowSummaries[row.id];
    const customCellValues = task.columns.map(col => Number(row.values?.[col.id] ?? 0));
    return [
      idx + 1,
      row.unitNumber,
      row.floor,
      row.residentName,
      row.phone || '-',
      ...customCellValues,
      s.totalRequired,
      s.paidAmount,
      s.remainingAmount,
      s.paidAmount > 0 ? PAYMENT_METHOD_LABELS[row.paymentMethod] || row.paymentMethod : '-',
      s.statusLabelArabic,
      row.paidAt || '-',
      row.notes || '',
    ];
  });

  // Append Totals Summary Row
  const footerCustomTotals = analytics.columnStats.map(cs =>
    cs.type === 'money' ? cs.totalSum : `${cs.totalSum} ${cs.unitLabel}`
  );
  rows.push([
    'الإجمالي',
    `${analytics.totalResidentsCount} شقة`,
    '-',
    'إجمالي المهمة الخاصة',
    '-',
    ...footerCustomTotals,
    analytics.grandTotalRequired,
    analytics.grandTotalCollected,
    analytics.grandTotalRemaining,
    `نسبة التحصيل ${analytics.collectionRatePercent}%`,
    `مسدد: ${analytics.paidResidentsCount} | متبقي: ${
      analytics.partialResidentsCount + analytics.unpaidResidentsCount
    }`,
    new Date().toISOString().split('T')[0],
    '',
  ]);

  return {
    sheetTitle: `${task.title} - ${settings.buildingName}`,
    headers,
    rows,
    analytics,
  };
}

/**
 * Renders a high-resolution visual financial sheet of the Special Task on an HTML5 Canvas
 * so it can be exported/shared as PNG, JPG, WebP, AVIF, SVG, PDF, or copied to clipboard (Ctrl+V).
 */
export async function renderSpecialTaskVisualCardDataUrl(
  task: SpecialTaskProject,
  settings: BuildingSettings
): Promise<string> {
  const analytics = calculateSpecialTaskAnalytics(task);
  const currency = settings.currency || 'ج.م';

  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  const colCount = task.columns.length;
  const width = Math.max(1180, 780 + colCount * 150);
  const headerHeight = 250;
  const colStatsHeight = 115;
  const tableHeaderHeight = 52;
  const rowHeight = 48;
  const footerHeight = 120;
  const height =
    headerHeight +
    colStatsHeight +
    tableHeaderHeight +
    Math.max(1, task.rows.length + 1) * rowHeight +
    footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean Crisp White Sheet Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top Header Banner
  const grad = ctx.createLinearGradient(0, 0, width, 120);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 125);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  // Title & Building Name
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
  ctx.fillText(
    `حسن الجوار — ${settings.buildingName} (${task.categoryLabel})`,
    width - 36,
    40
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Tahoma, Arial, sans-serif';
  ctx.fillText(task.title, width - 36, 78);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '15px Tahoma, Arial, sans-serif';
  ctx.fillText(
    task.description || `كشف تجميع المصروفات والمهام الخاصة — تاريخ الإصدار: ${new Date().toISOString().split('T')[0]}`,
    width - 36,
    108
  );

  // Top 4 KPI Summary Boxes
  const kpiY = 142;
  const kpiGap = 16;
  const kpiW = (width - 72 - kpiGap * 3) / 4;
  const kpis = [
    {
      label: 'عدد السكان المشتركين',
      value: `${analytics.totalResidentsCount} ساكن (مسدد: ${analytics.paidResidentsCount})`,
      bg: '#f8fafc',
      border: '#cbd5e1',
      color: '#0f172a',
    },
    {
      label: 'إجمالي المبالغ المطلوبة',
      value: formatMoney(analytics.grandTotalRequired, currency),
      bg: '#eff6ff',
      border: '#93c5fd',
      color: '#1e3a8a',
    },
    {
      label: `إجمالي المحصل (${analytics.collectionRatePercent}%)`,
      value: formatMoney(analytics.grandTotalCollected, currency),
      bg: '#ecfdf5',
      border: '#6ee7b7',
      color: '#065f46',
    },
    {
      label: 'إجمالي المتبقي للتحصيل',
      value: formatMoney(analytics.grandTotalRemaining, currency),
      bg: '#fff1f2',
      border: '#fda4af',
      color: '#9f1239',
    },
  ];

  kpis.forEach((k, idx) => {
    const xRight = width - 36 - idx * (kpiW + kpiGap);
    const xLeft = xRight - kpiW;
    ctx.fillStyle = k.bg;
    ctx.fillRect(xLeft, kpiY, kpiW, 88);
    ctx.strokeStyle = k.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(xLeft, kpiY, kpiW, 88);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
    ctx.fillText(k.label, xRight - 16, kpiY + 30);

    ctx.fillStyle = k.color;
    ctx.font = 'bold 21px Tahoma, Arial, sans-serif';
    ctx.fillText(k.value, xRight - 16, kpiY + 66);
  });

  // Per-Column Statistics Strip
  const stripY = 246;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(36, stripY, width - 72, 92);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(36, stripY, width - 72, 92);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
  ctx.fillText('إحصائيات الأعمدة المخصصة:', width - 52, stripY + 28);

  const colStatW = Math.max(180, (width - 104) / Math.max(1, analytics.columnStats.length));
  analytics.columnStats.forEach((cs, idx) => {
    const xRight = width - 52 - idx * colStatW;
    const summaryText =
      cs.type === 'money'
        ? `${cs.title}: ${formatMoney(cs.totalSum, currency)}`
        : cs.unitPrice > 0
        ? `${cs.title}: ${cs.totalSum} ${cs.unitLabel} (${formatMoney(cs.totalMonetaryEquivalent, currency)})`
        : `${cs.title}: ${cs.totalSum} ${cs.unitLabel}`;
    ctx.fillStyle = cs.type === 'money' ? '#047857' : '#4338ca';
    ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
    ctx.fillText(summaryText, xRight, stripY + 64);
  });

  // Table Header
  const tableTopY = stripY + 110;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(36, tableTopY, width - 72, tableHeaderHeight);

  const tableCols = [
    { label: 'م', w: 50 },
    { label: 'الشقة', w: 75 },
    { label: 'اسم الساكن', w: 220 },
    ...task.columns.map(c => ({
      label: c.type === 'money' ? `${c.title}` : `${c.title} (${c.unitLabel || 'عدد'})`,
      w: Math.max(130, Math.floor((width - 72 - 765) / Math.max(1, task.columns.length))),
    })),
    { label: 'إجمالي المطلوب', w: 140 },
    { label: 'المسدد', w: 130 },
    { label: 'المتبقي', w: 130 },
    { label: 'الحالة', w: 120 },
  ];

  let curRight = width - 36;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  tableCols.forEach(tc => {
    ctx.fillText(tc.label, curRight - 10, tableTopY + 32);
    curRight -= tc.w;
  });

  // Table Rows
  task.rows.forEach((row, rIdx) => {
    const rowY = tableTopY + tableHeaderHeight + rIdx * rowHeight;
    const s = analytics.rowSummaries[row.id];
    ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(36, rowY, width - 72, rowHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, rowY, width - 72, rowHeight);

    let cellRight = width - 36;
    const cells = [
      String(rIdx + 1),
      `شقة ${row.unitNumber}`,
      row.residentName,
      ...task.columns.map(c => {
        const v = Number(row.values?.[c.id] ?? 0);
        return c.type === 'money' ? formatMoney(v, currency) : `${v} ${c.unitLabel || ''}`.trim();
      }),
      formatMoney(s.totalRequired, currency),
      formatMoney(s.paidAmount, currency),
      formatMoney(s.remainingAmount, currency),
      s.statusLabelArabic,
    ];

    cells.forEach((cellText, cIdx) => {
      const colSpec = tableCols[cIdx];
      if (!colSpec) return;
      ctx.fillStyle =
        cIdx === cells.length - 1
          ? s.status === 'paid'
            ? '#047857'
            : s.status === 'partial'
            ? '#b45309'
            : '#be123c'
          : '#0f172a';
      ctx.font =
        cIdx >= 2 && cIdx === cells.length - 4
          ? 'bold 14px Tahoma, Arial, sans-serif'
          : '14px Tahoma, Arial, sans-serif';
      ctx.fillText(String(cellText), cellRight - 10, rowY + 30);
      cellRight -= colSpec.w;
    });
  });

  // Totals Footer Row
  const totalRowY = tableTopY + tableHeaderHeight + task.rows.length * rowHeight;
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(36, totalRowY, width - 72, rowHeight);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, totalRowY, width - 72, rowHeight);

  let footRight = width - 36;
  const footCells = [
    '∑',
    `${analytics.totalResidentsCount} شقق`,
    'الإجمالي العام للمهمة',
    ...analytics.columnStats.map(cs =>
      cs.type === 'money'
        ? formatMoney(cs.totalSum, currency)
        : `${cs.totalSum} ${cs.unitLabel}`
    ),
    formatMoney(analytics.grandTotalRequired, currency),
    formatMoney(analytics.grandTotalCollected, currency),
    formatMoney(analytics.grandTotalRemaining, currency),
    `${analytics.collectionRatePercent}% محصل`,
  ];

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  footCells.forEach((fc, idx) => {
    const colSpec = tableCols[idx];
    if (!colSpec) return;
    ctx.fillText(String(fc), footRight - 10, totalRowY + 30);
    footRight -= colSpec.w;
  });

  // Bottom Signature & InstaPay Footer
  const bottomY = totalRowY + rowHeight + 42;
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillText(
    `أمين الصندوق: ${settings.treasurerName} (${settings.treasurerPhone}) — السداد عبر إنستاباي: ${INSTAPAY_RECIPIENT_NAME}`,
    width - 36,
    bottomY
  );
  ctx.fillStyle = '#64748b';
  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillText(
    `تم استخراج هذا الكشف المجمع من نظام المهام الخاصة بتطبيق حسن الجوار (${settings.buildingName})`,
    width - 36,
    bottomY + 28
  );

  return canvas.toDataURL('image/png', 0.96);
}
