import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  tafqeetArabic,

  calculateTotals,
  calculateApartmentsBalances,
  groupExpensesByCategory,
  filterByMonth,
  filterTransactionsByDateRange,
  filterByCategory,
  validateBackupFile,
  getOverdueTenants,
  generateTenantReminderText,
  calculate12MonthsHistory,
  calculateBudgetForecast,
  getCurrentMonthUnpaidUnits,
  evaluateMonthlyDueStatus,
  getApartmentsMonthStatusMap,
  calculateNextPeriodicDate,
  getScheduledMaintenanceReminders,
  buildFloorsDiagramData,
  createArchivedTenantRecord,
  calculateOccupancyStats,
  calculate6MonthsOccupancyHistory,
  buildLatePaymentPushSummary,
  generateReceiptEmailPayload,
  generateFinancialReportEmailPayload,
  evaluatePreDueReminderSchedule,
  canMutateFinancialData,
  getPWAInstallGuideData,
  normalizeImportedBackupData,
  buildWhatsAppInvoiceReportData,
  generateDetailedWrittenWhatsAppReport,
  INSTAPAY_PAYMENT_URL,
  INSTAPAY_RECIPIENT_NAME,
  formatArabicMonthYear,
  generateAppIconSvgDataUrl,
  generateOfficialStampSvgDataUrl,
  validateBrandingImageDataUrl,
  buildBulkOverdueWhatsAppQueue,
  getAppVersionAndSystemInfo,
  resolveDynamicAppVersion,
  resolveStandaloneBuildingAppUrls,
  resolveAppDisplayModeConfig,
  buildFloorsExcelSheetData,
  buildQuickSummaryHubData,
  QUICK_TASK_SMART_TEMPLATES,
  getSettingsModalTabsConfig,
  getMainNavbarTabIds,
  searchBuildingRecords,
  normalizeArabicSearchText,
  resolveStandaloneApkDownloadInfo,
  verifyApkBinaryStructure,
  STANDALONE_APK_STATIC_PATH,
  STANDALONE_APK_PACKAGE_NAME,
  APP_THEMES_CATALOG,
  resolveAppThemeConfig,
  APK_DECLARED_PERMISSIONS,
  buildSmartNotificationsFeed,
  applyRevenueUpdate,
  applyExpenseUpdate,
  applyQuickTaskUpdate,
  applyArchivedTenantUpdate,
} from './finance';
import {
  buildCsvWithBom,
  buildTsvString,
  buildExcelWorkbookHtml,
  buildXlsxWorkbookBytes,
  buildExcelXml2003Workbook,
  buildOdsSpreadsheetBytes,
  generateAllExcelFormatPayloads,
  convertImageDataUrlToFormat,
  resolveTargetSavePathInfo,
  normalizeImageForWhatsAppShare,
  getDefaultSavePreferences,
  SAVE_LOCATION_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  EXCEL_FORMAT_OPTIONS,
  convertWhatsAppUrlForApk,
  extractBase64FromDataUrl,
  utf8ToBase64,
} from './apkBridge';
import { Apartment, Revenue, Expense, BuildingSettings, RecurringExpense, MaintenanceNote, QuickTask } from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_APARTMENTS,
  INITIAL_REVENUES,
  INITIAL_EXPENSES,
} from '../data/initialData';


test('tafqeetArabic converts numbers to correct Arabic wording', () => {
  assert.equal(tafqeetArabic(350, 'جنيه مصري'), 'فقط وقدره ثلاثمائة وخمسون جنيه مصري لا غير');
  assert.equal(tafqeetArabic(1000, 'جنيه'), 'فقط وقدره ألف جنيه لا غير');
  assert.equal(tafqeetArabic(2500, 'ريال'), 'فقط وقدره ألفان وخمسمائة ريال لا غير');
  assert.equal(tafqeetArabic(0, 'جنيه'), 'صفر جنيه');
});

test('calculateTotals computes correct financial revenues, expenses and balance', () => {
  const dummyRevenues: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-001',
      unitId: 'u1',
      unitNumber: '101',
      residentName: 'أحمد محمود',
      amount: 400,
      date: '2026-10-01',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-01',
    },
    {
      id: 'r2',
      receiptNumber: 'REC-002',
      unitId: 'u2',
      unitNumber: '102',
      residentName: 'سارة خالد',
      amount: 400,
      date: '2026-10-02',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'instapay',
      collectorName: 'أمين الصندوق',
      createdAt: '2026-10-02',
    },
  ];

  const dummyExpenses: Expense[] = [
    {
      id: 'e1',
      voucherNumber: 'EXP-001',
      category: 'elevator',
      title: 'صيانة شهرية للمصعد شركة الأهرام',
      amount: 300,
      date: '2026-10-03',
      paidTo: 'شركة المصاعد',
      paymentMethod: 'cash',
      createdAt: '2026-10-03',
    },
    {
      id: 'e2',
      voucherNumber: 'EXP-002',
      category: 'electricity',
      title: 'فاتورة كهرباء السلم والمصعد',
      amount: 250,
      date: '2026-10-04',
      paidTo: 'شركة الكهرباء',
      paymentMethod: 'bank_transfer',
      createdAt: '2026-10-04',
    },
  ];

  const result = calculateTotals(dummyRevenues, dummyExpenses, 1000);
  assert.equal(result.totalRevenues, 800);
  assert.equal(result.totalExpenses, 550);
  assert.equal(result.netFlow, 250);
  assert.equal(result.currentBalance, 1250);
});

test('calculateApartmentsBalances identifies paid, debt, and credit', () => {
  const apts: Apartment[] = [
    {
      id: 'u1',
      number: '1',
      floor: 1,
      residentName: 'محمد علي',
      residentType: 'owner',
      phone: '01012345678',
      monthlyFee: 300,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'u2',
      number: '2',
      floor: 1,
      residentName: 'طارق حسام',
      residentType: 'tenant',
      phone: '01198765432',
      monthlyFee: 300,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  const revs: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-001',
      unitId: 'u1',
      unitNumber: '1',
      residentName: 'محمد علي',
      amount: 300,
      date: '2026-10-01',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-01',
    },
  ];

  const balances = calculateApartmentsBalances(apts, revs, 1);
  const u1Bal = balances.find(b => b.unitId === 'u1')!;
  const u2Bal = balances.find(b => b.unitId === 'u2')!;

  assert.equal(u1Bal.totalPaid, 300);
  assert.equal(u1Bal.balance, 0);
  assert.equal(u1Bal.status, 'paid');

  assert.equal(u2Bal.totalPaid, 0);
  assert.equal(u2Bal.balance, -300);
  assert.equal(u2Bal.status, 'unpaid');
});

test('groupExpensesByCategory aggregates categories and calculates percentage', () => {
  const expenses: Expense[] = [
    {
      id: 'e1',
      voucherNumber: 'EXP-1',
      category: 'guard_salary',
      title: 'راتب الحارس',
      amount: 600,
      date: '2026-10-01',
      paidTo: 'عم رجب',
      paymentMethod: 'cash',
      createdAt: '2026-10-01',
    },
    {
      id: 'e2',
      voucherNumber: 'EXP-2',
      category: 'electricity',
      title: 'فاتورة الكهرباء',
      amount: 400,
      date: '2026-10-02',
      paidTo: 'شركة الكهرباء',
      paymentMethod: 'cash',
      createdAt: '2026-10-02',
    },
  ];

  const breakdown = groupExpensesByCategory(expenses);
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'guard_salary');
  assert.equal(breakdown[0].total, 600);
  assert.equal(breakdown[0].percentage, 60);
  assert.equal(breakdown[1].category, 'electricity');
  assert.equal(breakdown[1].percentage, 40);
});

test('filterByMonth filters transactions properly', () => {
  const items = [
    { date: '2026-10-01', val: 1 },
    { date: '2026-10-15', val: 2 },
    { date: '2026-09-28', val: 3 },
  ];
  const octItems = filterByMonth(items, '2026-10');
  assert.equal(octItems.length, 2);
});

test('validateBackupFile checks valid and invalid JSON backups', () => {
  const validJson = JSON.stringify({
    app: 'BuildingFinanceApp',
    version: '1.0',
    exportDate: '2026-10-23T09:00:00Z',
    settings: { buildingName: 'برج الأندلس', currency: 'ج.م' },
    apartments: [{ id: '1', number: '101' }],
    revenues: [{ id: 'r1', amount: 500 }],
    expenses: [{ id: 'e1', amount: 300 }],
  });

  const validResult = validateBackupFile(validJson);
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.metadata?.buildingName, 'برج الأندلس');
  assert.equal(validResult.metadata?.apartmentsCount, 1);
  assert.equal(validResult.metadata?.revenuesCount, 1);
  assert.equal(validResult.metadata?.expensesCount, 1);

  const invalidJson = '{"foo": "bar"}';
  const invalidResult = validateBackupFile(invalidJson);
  assert.equal(invalidResult.isValid, false);

  const brokenSyntax = '{broken';
  const brokenResult = validateBackupFile(brokenSyntax);
  assert.equal(brokenResult.isValid, false);
});

test('getOverdueTenants accurately identifies only tenants with negative balance', () => {
  const apts: Apartment[] = [
    {
      id: 'apt-t1',
      number: '3',
      floor: 2,
      residentName: 'سامح مستأجر',
      residentType: 'tenant',
      phone: '0101111111',
      monthlyFee: 400,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-o1',
      number: '4',
      floor: 2,
      residentName: 'هاني مالك',
      residentType: 'owner',
      phone: '0102222222',
      monthlyFee: 400,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  const balances = [
    {
      unitId: 'apt-t1',
      unitNumber: '3',
      residentName: 'سامح مستأجر',
      floor: 2,
      phone: '0101111111',
      residentType: 'tenant',
      monthlyFee: 400,
      totalPaid: 0,
      expectedTotal: 400,
      balance: -400,
      status: 'unpaid' as const,
      paidMonthsCount: 0,
    },
    {
      unitId: 'apt-o1',
      unitNumber: '4',
      residentName: 'هاني مالك',
      floor: 2,
      phone: '0102222222',
      residentType: 'owner',
      monthlyFee: 400,
      totalPaid: 0,
      expectedTotal: 400,
      balance: -400,
      status: 'unpaid' as const,
      paidMonthsCount: 0,
    },
  ];

  const overdueTenants = getOverdueTenants(apts, balances);
  assert.equal(overdueTenants.length, 1);
  assert.equal(overdueTenants[0].apartment.id, 'apt-t1');
  assert.equal(overdueTenants[0].overdueAmount, 400);
});

test('generateTenantReminderText formats Arabic reminder with proper tone', () => {
  const text = generateTenantReminderText({
    residentName: 'سامح عبد الرازق',
    unitNumber: '3',
    overdueAmount: 350,
    currency: 'ج.م',
    buildingName: 'عمارة النور',
    treasurerName: 'م. حسام الدين',
    tone: 'gentle',
  });

  assert.ok(text.includes('سامح عبد الرازق'));
  assert.ok(text.includes('350 ج.م'));
  assert.ok(text.includes('عمارة النور'));
});

test('calculate12MonthsHistory generates 12 sequential months and aggregates revenues and expenses', () => {
  const revs: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'R1',
      unitId: 'u1',
      unitNumber: '1',
      residentName: 'ساكن',
      amount: 1000,
      date: '2026-10-05',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'أمين',
      createdAt: '2026-10-05',
    },
    {
      id: 'r2',
      receiptNumber: 'R2',
      unitId: 'u2',
      unitNumber: '2',
      residentName: 'ساكن',
      amount: 800,
      date: '2026-09-12',
      monthTarget: '2026-09',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'أمين',
      createdAt: '2026-09-12',
    },
  ];

  const exps: Expense[] = [
    {
      id: 'e1',
      voucherNumber: 'E1',
      category: 'guard_salary',
      title: 'راتب',
      amount: 400,
      date: '2026-10-01',
      paidTo: 'حارس',
      paymentMethod: 'cash',
      createdAt: '2026-10-01',
    },
    {
      id: 'e2',
      voucherNumber: 'E2',
      category: 'electricity',
      title: 'كهرباء',
      amount: 300,
      date: '2026-09-08',
      paidTo: 'كهرباء',
      paymentMethod: 'cash',
      createdAt: '2026-09-08',
    },
  ];

  const history = calculate12MonthsHistory(revs, exps, '2026-10');
  assert.equal(history.length, 12);

  // Last month should be 2026-10
  const lastMonth = history[11];
  assert.equal(lastMonth.month, '2026-10');
  assert.equal(lastMonth.revenues, 1000);
  assert.equal(lastMonth.expenses, 400);
  assert.equal(lastMonth.netFlow, 600);

  // Penultimate month should be 2026-09
  const penultMonth = history[10];
  assert.equal(penultMonth.month, '2026-09');
  assert.equal(penultMonth.revenues, 800);
  assert.equal(penultMonth.expenses, 300);
  assert.equal(penultMonth.netFlow, 500);

  // First month should be 2025-11 (11 months before 2026-10)
  assert.equal(history[0].month, '2025-11');
});

test('filterTransactionsByDateRange filters transactions within start and end date inclusive', () => {
  const items = [
    { id: '1', date: '2026-10-01', amount: 100 },
    { id: '2', date: '2026-10-05', amount: 200 },
    { id: '3', date: '2026-10-10', amount: 300 },
    { id: '4', date: '2026-10-20', amount: 400 },
  ];

  const range1 = filterTransactionsByDateRange(items, '2026-10-05', '2026-10-10');
  assert.equal(range1.length, 2);
  assert.equal(range1[0].id, '2');
  assert.equal(range1[1].id, '3');

  const startOnly = filterTransactionsByDateRange(items, '2026-10-10');
  assert.equal(startOnly.length, 2);

  const endOnly = filterTransactionsByDateRange(items, undefined, '2026-10-05');
  assert.equal(endOnly.length, 2);

  const noFilter = filterTransactionsByDateRange(items);
  assert.equal(noFilter.length, 4);
});

test('filterByCategory filters items by specified category or allows all', () => {
  const items = [
    { id: '1', category: 'elevator' },
    { id: '2', category: 'electricity' },
    { id: '3', category: 'elevator' },
  ];

  assert.equal(filterByCategory(items, 'elevator').length, 2);
  assert.equal(filterByCategory(items, 'electricity').length, 1);
  assert.equal(filterByCategory(items, 'all').length, 3);
  assert.equal(filterByCategory(items, undefined).length, 3);
});

test('calculateBudgetForecast accurately computes historical 6-month averages and future projections', () => {
  const apartments: Apartment[] = [
    {
      id: 'apt-1',
      number: '1',
      floor: 1,
      residentName: 'أحمد',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 1000,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-2',
      number: '2',
      floor: 1,
      residentName: 'محمود',
      residentType: 'owner',
      phone: '011',
      monthlyFee: 1000,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  // 6 months of revenues (each month 2000 total)
  const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const revenues: Revenue[] = months.flatMap((m, idx) => [
    {
      id: `r-${idx}-1`,
      receiptNumber: `REC-${idx}-1`,
      unitId: 'apt-1',
      unitNumber: '1',
      residentName: 'أحمد',
      amount: 1000,
      date: `${m}-02`,
      monthTarget: m,
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: `${m}-02`,
    },
    {
      id: `r-${idx}-2`,
      receiptNumber: `REC-${idx}-2`,
      unitId: 'apt-2',
      unitNumber: '2',
      residentName: 'محمود',
      amount: 1000,
      date: `${m}-03`,
      monthTarget: m,
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: `${m}-03`,
    },
  ]);

  // 6 months of expenses (each month 1000 total: 600 guard, 400 elevator)
  const expenses: Expense[] = months.flatMap((m, idx) => [
    {
      id: `e-${idx}-1`,
      voucherNumber: `EXP-${idx}-1`,
      category: 'guard_salary',
      title: 'راتب الحارس',
      amount: 600,
      date: `${m}-01`,
      paidTo: 'رجب',
      paymentMethod: 'cash',
      createdAt: `${m}-01`,
    },
    {
      id: `e-${idx}-2`,
      voucherNumber: `EXP-${idx}-2`,
      category: 'elevator',
      title: 'صيانة المصعد',
      amount: 400,
      date: `${m}-05`,
      paidTo: 'شركة الأطلس',
      paymentMethod: 'cash',
      createdAt: `${m}-05`,
    },
  ]);

  const recurringExpenses: RecurringExpense[] = [
    {
      id: 'rec-1',
      title: 'راتب الحارس',
      category: 'guard_salary',
      amount: 600,
      paidTo: 'رجب',
      billingDay: 1,
      paymentMethod: 'cash',
      isActive: true,
      createdAt: '2026-01-01',
    },
  ];

  const settings: BuildingSettings = {
    buildingName: 'برج التجربة',
    buildingAddress: 'القاهرة',
    treasurerName: 'أمين',
    treasurerPhone: '010',
    currency: 'ج.م',
    defaultMonthlyFee: 1000,
    emergencyFundBalance: 5000,
    emergencyFundTarget: 10000,
  };

  const forecast = calculateBudgetForecast(apartments, revenues, expenses, recurringExpenses, settings, {
    historyMonthsCount: 6,
    referenceMonth: '2026-10',
    targetProjectionMonths: 6,
    safetyMarginPercent: 5,
    reserveAllocationPercent: 10,
  });

  // Verify historical averages
  assert.equal(forecast.historicalMonthsAnalyzed, 6);
  assert.equal(forecast.averageMonthlyRevenue, 2000);
  assert.equal(forecast.averageMonthlyExpense, 1000);
  assert.equal(forecast.averageMonthlyNetSurplus, 1000);
  assert.equal(forecast.potentialMonthlyRent, 2000);
  assert.equal(forecast.collectionEfficiencyRate, 100);

  // Projections for 6 months ahead
  // Projected Rev = 2000 * 6 = 12000
  assert.equal(forecast.projectedTotalRevenues, 12000);
  // Base Exp = 1000 * 6 = 6000; with 5% safety margin = 6300
  assert.equal(forecast.baseProjectedExpenses, 6000);
  assert.equal(forecast.projectedTotalExpenses, 6300);
  // Net Reserve Delta = 12000 - 6300 = 5700
  assert.equal(forecast.projectedNetReserveDelta, 5700);
  // Emergency Fund Addition (10% of 12000) = 1200
  assert.equal(forecast.projectedEmergencyFundAddition, 1200);
  // Discretionary Surplus = 5700 - 1200 = 4500
  assert.equal(forecast.projectedDiscretionarySurplus, 4500);

  // Category Estimates
  assert.equal(forecast.categoryEstimates.length, 2);
  const guardCat = forecast.categoryEstimates.find(c => c.category === 'guard_salary')!;
  assert.equal(guardCat.avgMonthlyAmount, 600);
  assert.equal(guardCat.percentageOfExpenses, 60);
  assert.equal(guardCat.isRecurringFixed, true);

  // Health and recommendations
  assert.ok(forecast.financialHealthScore >= 70);
  assert.ok(forecast.recommendations.length > 0);
  assert.ok(forecast.recommendations.some(r => r.type === 'success'));
});

test('getCurrentMonthUnpaidUnits identifies unpaid and partial units for targetMonth', () => {
  const apartments: Apartment[] = [
    {
      id: 'apt-1',
      number: '1',
      floor: 1,
      residentName: 'أحمد',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-2',
      number: '2',
      floor: 1,
      residentName: 'سامح',
      residentType: 'tenant',
      phone: '011',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-3',
      number: '3',
      floor: 2,
      residentName: 'هاني',
      residentType: 'owner',
      phone: '012',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  const revenues: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-1',
      unitId: 'apt-1',
      unitNumber: '1',
      residentName: 'أحمد',
      amount: 350,
      date: '2026-10-02',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-02',
    },
    {
      id: 'r2',
      receiptNumber: 'REC-2',
      unitId: 'apt-3',
      unitNumber: '3',
      residentName: 'هاني',
      amount: 150,
      date: '2026-10-04',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-04',
    },
  ];

  const alerts = getCurrentMonthUnpaidUnits(apartments, revenues, '2026-10');
  assert.equal(alerts.length, 2);

  const apt2Alert = alerts.find(a => a.apartment.id === 'apt-2')!;
  assert.equal(apt2Alert.status, 'unpaid');
  assert.equal(apt2Alert.paidThisMonth, 0);
  assert.equal(apt2Alert.remainingAmount, 350);

  const apt3Alert = alerts.find(a => a.apartment.id === 'apt-3')!;
  assert.equal(apt3Alert.status, 'partial');
  assert.equal(apt3Alert.paidThisMonth, 150);
  assert.equal(apt3Alert.remainingAmount, 200);
});

test('calculateNextPeriodicDate and getScheduledMaintenanceReminders schedule and rank maintenance notes', () => {
  assert.equal(calculateNextPeriodicDate('2026-10-03', 'monthly'), '2026-11-03');
  assert.equal(calculateNextPeriodicDate('2026-10-17', 'quarterly'), '2027-01-17');
  assert.equal(calculateNextPeriodicDate('2026-10-17', 'semi_annual'), '2027-04-17');
  assert.equal(calculateNextPeriodicDate('2026-10-17', 'annual'), '2027-10-17');

  const notes: MaintenanceNote[] = [
    {
      id: 'm1',
      apartmentId: 'apt-1',
      unitNumber: '1',
      title: 'صيانة متأخرة',
      status: 'pending',
      priority: 'high',
      category: 'elevator',
      scheduledDate: '2026-10-10',
      isPeriodic: true,
      recurrenceInterval: 'monthly',
      createdAt: '2026-10-01',
    },
    {
      id: 'm2',
      apartmentId: 'apt-2',
      unitNumber: '2',
      title: 'تنظيف خزانات قريب',
      status: 'pending',
      priority: 'medium',
      category: 'water_tank',
      scheduledDate: '2026-10-18',
      isPeriodic: true,
      recurrenceInterval: 'quarterly',
      createdAt: '2026-10-01',
    },
    {
      id: 'm3',
      apartmentId: 'apt-3',
      unitNumber: '3',
      title: 'تم إصلاحه',
      status: 'resolved',
      priority: 'low',
      category: 'plumbing',
      scheduledDate: '2026-10-12',
      createdAt: '2026-10-01',
    },
  ];

  const reminders = getScheduledMaintenanceReminders(notes, '2026-10-15');
  assert.equal(reminders.length, 2);
  assert.equal(reminders[0].note.id, 'm1');
  assert.equal(reminders[0].urgency, 'overdue');
  assert.equal(reminders[0].daysUntilDue, -5);

  assert.equal(reminders[1].note.id, 'm2');
  assert.equal(reminders[1].urgency, 'due_soon');
  assert.equal(reminders[1].daysUntilDue, 3);
});

test('buildFloorsDiagramData orders floors descending from roof to ground and counts models', () => {
  const apartments: Apartment[] = [
    {
      id: 'a1',
      number: '1',
      floor: 1,
      residentName: 'أحمد',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'a3',
      number: '3',
      floor: 2,
      residentName: 'سامح',
      residentType: 'tenant',
      phone: '011',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'a12',
      number: '12',
      floor: 6,
      residentName: 'وائل (شقة روف)',
      residentType: 'owner',
      phone: '012',
      monthlyFee: 400,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  const rows = buildFloorsDiagramData(apartments, [], new Set(['a3']));
  assert.equal(rows.length, 3);
  assert.equal(rows[0].floor, 6);
  assert.ok(rows[0].floorLabel.includes('الروف'));
  assert.equal(rows[1].floor, 2);
  assert.equal(rows[1].tenantsCount, 1);
  assert.equal(rows[1].lateCount, 1);
  assert.equal(rows[2].floor, 1);
  assert.equal(rows[2].ownersCount, 1);
});

test('evaluateMonthlyDueStatus and getApartmentsMonthStatusMap automatically mark unpaid apartments as overdue after dueDay', () => {
  // When referenceDate (2026-10-23) is after dueDay (10)
  const pastDue = evaluateMonthlyDueStatus('2026-10', 10, '2026-10-23');
  assert.equal(pastDue.dueDateFormatted, '2026-10-10');
  assert.equal(pastDue.isPastDueDate, true);
  assert.equal(pastDue.daysPastDue, 13);

  // When referenceDate (2026-10-05) is before dueDay (15)
  const beforeDue = evaluateMonthlyDueStatus('2026-10', 15, '2026-10-05');
  assert.equal(beforeDue.dueDateFormatted, '2026-10-15');
  assert.equal(beforeDue.isPastDueDate, false);
  assert.equal(beforeDue.daysUntilDue, 10);

  const apartments: Apartment[] = [
    {
      id: 'apt-paid',
      number: '1',
      floor: 1,
      residentName: 'أحمد المسدد',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-overdue',
      number: '3',
      floor: 2,
      residentName: 'سامح المتأخر',
      residentType: 'tenant',
      phone: '011',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];

  const revenues: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-1',
      unitId: 'apt-paid',
      unitNumber: '1',
      residentName: 'أحمد المسدد',
      amount: 350,
      date: '2026-10-03',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-03',
    },
  ];

  const statusMapAfterDue = getApartmentsMonthStatusMap(apartments, revenues, '2026-10', 10, '2026-10-23');
  assert.equal(statusMapAfterDue['apt-paid'].paymentStatus, 'paid');
  assert.equal(statusMapAfterDue['apt-paid'].isOverdueForMonth, false);

  assert.equal(statusMapAfterDue['apt-overdue'].paymentStatus, 'unpaid');
  assert.equal(statusMapAfterDue['apt-overdue'].isOverdueForMonth, true);
  assert.equal(statusMapAfterDue['apt-overdue'].daysPastDue, 13);

  const alertsBeforeDue = getCurrentMonthUnpaidUnits(apartments, revenues, '2026-10', 25, '2026-10-23');
  assert.equal(alertsBeforeDue.length, 1);
  assert.equal(alertsBeforeDue[0].autoStatus, 'awaiting_due_date');
});

test('createArchivedTenantRecord archives outgoing tenant while keeping revenues linked to apartment', () => {
  const apt: Apartment = {
    id: 'apt-3',
    number: '3',
    floor: 2,
    residentName: 'أ. سامح عبد الرازق',
    residentType: 'tenant',
    phone: '01144556677',
    nationalId: '28801010101234',
    monthlyFee: 350,
    initialBalance: 0,
    moveInDate: '2026-06-01',
    createdAt: '2026-01-01',
  };

  const revenues: Revenue[] = [
    {
      id: 'rev-1',
      receiptNumber: 'REC-1',
      unitId: 'apt-3',
      unitNumber: '3',
      residentName: 'أ. سامح عبد الرازق',
      amount: 350,
      date: '2026-08-05',
      monthTarget: '2026-08',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-08-05',
    },
    {
      id: 'rev-2',
      receiptNumber: 'REC-2',
      unitId: 'apt-3',
      unitNumber: '3',
      residentName: 'أ. سامح عبد الرازق',
      amount: 350,
      date: '2026-09-05',
      monthTarget: '2026-09',
      category: 'monthly_subscription',
      paymentMethod: 'instapay',
      collectorName: 'أمين الصندوق',
      createdAt: '2026-09-05',
    },
  ];

  const archived = createArchivedTenantRecord(apt, revenues, {
    moveInDate: '2026-06-01',
    moveOutDate: '2026-10-20',
    exitReason: 'انتهاء مدة العقد بالتراضي',
    notes: 'تم سداد كافة الفواتير',
  });

  assert.equal(archived.residentName, 'أ. سامح عبد الرازق');
  assert.equal(archived.phone, '01144556677');
  assert.equal(archived.moveInDate, '2026-06-01');
  assert.equal(archived.moveOutDate, '2026-10-20');
  assert.equal(archived.totalPaidDuringTenancy, 700);
  assert.equal(archived.receiptsCount, 2);
  assert.equal(archived.exitReason, 'انتهاء مدة العقد بالتراضي');
  // Original revenues remain untouched and linked to apt-3
  assert.equal(revenues.length, 2);
  assert.equal(revenues[0].unitId, 'apt-3');
});

test('calculateOccupancyStats and calculate6MonthsOccupancyHistory compute rented vs total and 6-month trend', () => {
  const apartments: Apartment[] = [
    {
      id: 'apt-1',
      number: '1',
      floor: 1,
      residentName: 'مالك ١',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 350,
      initialBalance: 0,
      moveInDate: '2023-01-01',
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-2',
      number: '2',
      floor: 1,
      residentName: 'مستأجر حالي',
      residentType: 'tenant',
      phone: '011',
      monthlyFee: 350,
      initialBalance: 0,
      moveInDate: '2026-07-01',
      previousTenants: [
        {
          id: 'prev-1',
          residentName: 'مستأجر سابق',
          phone: '012',
          moveInDate: '2025-01-01',
          moveOutDate: '2026-05-30',
          monthlyFee: 350,
          totalPaidDuringTenancy: 5000,
          receiptsCount: 15,
          archivedAt: '2026-05-30',
        },
      ],
      createdAt: '2026-01-01',
    },
  ];

  const stats = calculateOccupancyStats(apartments);
  assert.equal(stats.totalUnits, 2);
  assert.equal(stats.rentedUnits, 1);
  assert.equal(stats.ownerUnits, 1);
  assert.equal(stats.vacantUnits, 0);
  assert.equal(stats.rentedRatePercent, 50);
  assert.equal(stats.totalOccupancyRatePercent, 100);
  assert.equal(stats.archivedTenantsCount, 1);

  const history = calculate6MonthsOccupancyHistory(apartments, '2026-10');
  assert.equal(history.length, 6);
  // 2026-05: prev tenant was active => rentedUnits = 1, vacantUnits = 0, occupancy = 100%
  assert.equal(history[0].month, '2026-05');
  assert.equal(history[0].rentedUnits, 1);
  assert.equal(history[0].occupancyRatePercent, 100);

  // 2026-06: gap between 2026-05-30 moveOut and 2026-07-01 moveIn => vacantUnits = 1, occupancy = 50%
  assert.equal(history[1].month, '2026-06');
  assert.equal(history[1].vacantUnits, 1);
  assert.equal(history[1].occupancyRatePercent, 50);

  // 2026-10: current tenant active => rentedUnits = 1, occupancy = 100%
  assert.equal(history[5].month, '2026-10');
  assert.equal(history[5].rentedUnits, 1);
  assert.equal(history[5].occupancyRatePercent, 100);
});

test('buildLatePaymentPushSummary aggregates overdue apartments past the monthly due day', () => {
  const apartments: Apartment[] = [
    {
      id: 'apt-1',
      number: '1',
      floor: 1,
      residentName: 'مالك مسدد',
      residentType: 'owner',
      phone: '010',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-3',
      number: '3',
      floor: 2,
      residentName: 'مستأجر متأخر',
      residentType: 'tenant',
      phone: '011',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];
  const revenues: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-1',
      unitId: 'apt-1',
      unitNumber: '1',
      residentName: 'مالك مسدد',
      amount: 350,
      date: '2026-10-02',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-02',
    },
  ];

  const summary = buildLatePaymentPushSummary(apartments, revenues, '2026-10', 10, '2026-10-23', true);
  assert.equal(summary.shouldTriggerPush, true);
  assert.equal(summary.overdueUnitsCount, 1);
  assert.equal(summary.tenantsOverdueCount, 1);
  assert.equal(summary.totalOverdueAmount, 350);
  assert.equal(summary.daysPastDue, 13);
});

test('generateReceiptEmailPayload and generateFinancialReportEmailPayload format Arabic email subjects, bodies and mailto links', () => {
  const settings: BuildingSettings = {
    buildingName: 'برج النور السكني',
    buildingAddress: 'القاهرة',
    treasurerName: 'أ. حسام الدين',
    treasurerPhone: '01098765432',
    treasurerEmail: 'hossam@alnoor.eg',
    currency: 'ج.م',
    defaultMonthlyFee: 350,
    emergencyFundBalance: 5000,
    emergencyFundTarget: 20000,
  };

  const revenue: Revenue = {
    id: 'rev-101',
    receiptNumber: 'REC-2026-101',
    unitId: 'apt-3',
    unitNumber: '3',
    residentName: 'أ. سامح عبد الرازق',
    amount: 350,
    date: '2026-10-05',
    monthTarget: '2026-10',
    category: 'monthly_subscription',
    paymentMethod: 'instapay',
    collectorName: 'أ. حسام الدين',
    createdAt: '2026-10-05',
  };

  const receiptPayload = generateReceiptEmailPayload({
    revenue,
    settings,
    recipientEmail: 'sameh@tenant-mail.eg',
  });
  assert.equal(receiptPayload.to, 'sameh@tenant-mail.eg');
  assert.ok(receiptPayload.subject.includes('REC-2026-101'));
  assert.ok(receiptPayload.subject.includes('شقة (3)'));
  assert.ok(receiptPayload.body.includes('ثلاثمائة وخمسون'));
  assert.ok(receiptPayload.mailtoUrl.startsWith('mailto:sameh%40tenant-mail.eg?subject='));

  const reportPayload = generateFinancialReportEmailPayload({
    settings,
    monthLabel: 'أكتوبر 2026',
    totalRevenues: 4200,
    totalExpenses: 3100,
    netFlow: 1100,
    treasuryBalance: 15800,
    recipientEmail: 'sameh@tenant-mail.eg',
    recipientName: 'أ. سامح عبد الرازق',
    unitNumber: '3',
    unitMonthlyFee: 350,
    unitPaidThisMonth: 350,
    unitRemainingAmount: 0,
  });
  assert.equal(reportPayload.to, 'sameh@tenant-mail.eg');
  assert.ok(reportPayload.subject.includes('شقة (3)'));
  assert.ok(reportPayload.body.includes('أكتوبر 2026'));
  assert.ok(reportPayload.body.includes('خالص السداد'));
});

test('evaluatePreDueReminderSchedule computes 3-day advance browser reminder window and unpaid apartments', () => {
  const apartments: Apartment[] = [
    {
      id: 'apt-1',
      number: '1',
      floor: 1,
      residentName: 'مالك مسدد',
      residentType: 'owner',
      phone: '010',
      email: 'owner1@mail.eg',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
    {
      id: 'apt-3',
      number: '3',
      floor: 2,
      residentName: 'مستأجر قادم استحقاقه',
      residentType: 'tenant',
      phone: '011',
      email: 'tenant3@mail.eg',
      monthlyFee: 350,
      initialBalance: 0,
      createdAt: '2026-01-01',
    },
  ];
  const revenues: Revenue[] = [
    {
      id: 'r1',
      receiptNumber: 'REC-1',
      unitId: 'apt-1',
      unitNumber: '1',
      residentName: 'مالك مسدد',
      amount: 350,
      date: '2026-10-02',
      monthTarget: '2026-10',
      category: 'monthly_subscription',
      paymentMethod: 'cash',
      collectorName: 'الحارس',
      createdAt: '2026-10-02',
    },
  ];

  // Case 1: Due day is 10, reference date is 2026-10-07 (exactly 3 days before due date)
  const activeReminder = evaluatePreDueReminderSchedule(
    apartments,
    revenues,
    '2026-10',
    10,
    '2026-10-07',
    true,
    3
  );
  assert.equal(activeReminder.isEnabled, true);
  assert.equal(activeReminder.dueDay, 10);
  assert.equal(activeReminder.reminderDay, 7);
  assert.equal(activeReminder.daysUntilDue, 3);
  assert.equal(activeReminder.isWithinPreDueWindow, true);
  assert.equal(activeReminder.shouldFireBrowserReminderNow, true);
  assert.equal(activeReminder.unpaidUnits.length, 1);
  assert.equal(activeReminder.totalRemainingAmount, 350);
  assert.ok(activeReminder.browserNotificationTitle.includes('متبقي 3 أيام'));

  // Case 2: Reference date is 2026-10-23 (past due day 10), next scheduled reminder is 2026-11-07
  const scheduledNextMonth = evaluatePreDueReminderSchedule(
    apartments,
    revenues,
    '2026-10',
    10,
    '2026-10-23',
    true,
    3
  );
  assert.equal(scheduledNextMonth.isWithinPreDueWindow, false);
  assert.equal(scheduledNextMonth.shouldFireBrowserReminderNow, false);
  assert.equal(scheduledNextMonth.activeScheduledReminderDate, '2026-11-07');

  // Case 3: Disabled in settings
  const disabledSchedule = evaluatePreDueReminderSchedule(
    apartments,
    revenues,
    '2026-10',
    10,
    '2026-10-07',
    false,
    3
  );
  assert.equal(disabledSchedule.isEnabled, false);
  assert.equal(disabledSchedule.shouldFireBrowserReminderNow, false);
});

test('canMutateFinancialData blocks mutations when readOnlyMode is enabled', () => {
  assert.equal(canMutateFinancialData({ readOnlyMode: false }), true);
  assert.equal(canMutateFinancialData({ readOnlyMode: undefined }), true);
  assert.equal(canMutateFinancialData({ readOnlyMode: true }), false);
});

test('getPWAInstallGuideData detects platform and returns Android Chrome and iOS Safari 3-step guides', () => {
  const iosGuide = getPWAInstallGuideData(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    false,
    false,
    false
  );
  assert.equal(iosGuide.detectedPlatform, 'ios');
  assert.equal(iosGuide.canTriggerDirectPrompt, false);
  assert.equal(iosGuide.androidChromeSteps.length, 3);
  assert.equal(iosGuide.iosSafariSteps.length, 3);
  assert.ok(iosGuide.fallbackFeedbackMessage.includes('آيفون'));

  const androidReadyGuide = getPWAInstallGuideData(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    true,
    false,
    false
  );
  assert.equal(androidReadyGuide.detectedPlatform, 'android');
  assert.equal(androidReadyGuide.canTriggerDirectPrompt, true);
  assert.equal(androidReadyGuide.installButtonLabel, 'تثبيت أحدث نسخة الآن (v3.8.0)');
  assert.ok(androidReadyGuide.directApkDownloadUrl.includes('/borj-elnoor-standalone.apk?v=3.8.0'));
  assert.equal(androidReadyGuide.apkFileName, 'borj-elnoor-standalone-v3.8.0.apk');
  assert.equal(androidReadyGuide.apkPackageName, STANDALONE_APK_PACKAGE_NAME);

  const installedGuide = getPWAInstallGuideData('Mozilla/5.0', false, true, false);
  assert.equal(installedGuide.isAlreadyInstalled, true);
  assert.equal(installedGuide.canTriggerDirectPrompt, false);
});

test('normalizeImportedBackupData and validateBackupFile parse amara-dhahabiya JSON backup format', () => {
  const externalBackup = JSON.stringify({
    app: 'amara-dhahabiya',
    version: 1,
    exportedAt: '2026-10-25T11:26:19.144Z',
    profile: {
      buildingName: 'برج النور',
      currency: 'ج.م',
      openingBalance: 0,
    },
    apartments: [
      {
        id: '48620815-154f-4450-8e75-09fdaf45bfac',
        fee: 200,
        floor: 'الثاني',
        notes: '',
        phone: '01000322790',
        active: true,
        number: '6',
        ownerName: 'احمد ابراهيم عبدالهادي',
        startMonth: '2026-09',
        residentType: 'مالك',
      },
      {
        id: '715bfdcc-e23c-4710-a228-b90046d019a0',
        fee: 200,
        floor: 'العاشر',
        notes: 'شقة مزوجه',
        phone: '01227303748',
        active: true,
        number: '26',
        ownerName: 'محمود محمد محمد السعداوي',
        startMonth: '2026-09',
        residentType: 'مالك',
      },
    ],
    payments: [
      {
        id: 'p1',
        date: '2026-09-30',
        month: '2026-09',
        amount: 200,
        method: 'تحويل بنكي',
        recordedBy: 'Ahmed Ibrahim',
        apartmentId: '48620815-154f-4450-8e75-09fdaf45bfac',
        residentName: 'احمد ابراهيم عبدالهادي',
        apartmentNumber: '6',
      },
    ],
    expenses: [
      {
        id: 'e1',
        date: '2026-10-25',
        month: '2026-10',
        title: 'صيانة دورية للمصعد شهر اكتوبر',
        amount: 385,
        category: 'مصعد',
        recordedBy: 'Ahmed Ibrahim',
      },
    ],
  });

  const validation = validateBackupFile(externalBackup);
  assert.equal(validation.isValid, true);
  assert.equal(validation.metadata?.buildingName, 'برج النور');
  assert.equal(validation.metadata?.apartmentsCount, 2);
  assert.equal(validation.metadata?.revenuesCount, 1);
  assert.equal(validation.metadata?.expensesCount, 1);

  const normalized = normalizeImportedBackupData(JSON.parse(externalBackup));
  assert.equal(normalized.apartments?.[0].number, '6');
  assert.equal(normalized.apartments?.[0].floor, 2);
  assert.equal(normalized.apartments?.[0].residentType, 'owner');
  assert.equal(normalized.apartments?.[1].floor, 10);
  assert.equal(normalized.revenues?.[0].paymentMethod, 'bank_transfer');
  assert.equal(normalized.expenses?.[0].category, 'elevator');
});

test('INITIAL_APARTMENTS, INITIAL_REVENUES, and INITIAL_EXPENSES match برج النور real backup data', () => {
  assert.equal(DEFAULT_SETTINGS.buildingName, 'برج النور');
  assert.equal(INITIAL_APARTMENTS.length, 27);
  assert.equal(INITIAL_REVENUES.length, 33);
  assert.equal(INITIAL_EXPENSES.length, 8);

  const totals = calculateTotals(INITIAL_REVENUES, INITIAL_EXPENSES, DEFAULT_SETTINGS.emergencyFundBalance);
  assert.equal(totals.totalRevenues, 6400);
  assert.equal(totals.totalExpenses, 4690);
  assert.equal(totals.currentBalance, 1710);
});

test('buildWhatsAppInvoiceReportData builds complete white invoice data with paid, late, expenses, totals, and bottom timestamp', () => {
  assert.equal(formatArabicMonthYear('2026-10'), 'أكتوبر 2026');

  const invoiceData = buildWhatsAppInvoiceReportData({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    settings: DEFAULT_SETTINGS,
    targetMonth: '2026-10',
    generatedAt: '2026-10-25T14:30:00',
  });

  assert.equal(invoiceData.buildingName, 'برج النور');
  assert.equal(invoiceData.monthLabelArabic, 'أكتوبر 2026');
  assert.equal(invoiceData.reportIssueDate, '2026/10/25');
  assert.ok(invoiceData.imageGeneratedAtFormatted.includes('2026/10/25'));
  assert.equal(invoiceData.paidUnits.length, 13);
  assert.equal(invoiceData.lateUnits.length, 9);
  assert.equal(invoiceData.exemptUnitsCount, 6);
  assert.ok(invoiceData.lateUnits.some(u => u.residentName.includes('محمد صلاح سلامه')));
  assert.equal(invoiceData.expensesList.length, 2);
  assert.equal(invoiceData.totals.monthRevenues, 2400);
  assert.equal(invoiceData.totals.monthExpenses, 770);
  assert.equal(invoiceData.totals.monthNetRemaining, 1630);
  assert.equal(invoiceData.totals.allTimeRevenues, 6400);
  assert.equal(invoiceData.totals.allTimeExpenses, 4690);
  assert.equal(invoiceData.totals.treasuryRemainingBalance, 1710);
  assert.equal(invoiceData.totals.previousCarryOver, 80);
  assert.equal(invoiceData.totals.totalTreasuryAvailable, 2480);
  assert.equal(invoiceData.pastMonthsArrears.length, 1);
  assert.equal(invoiceData.pastMonthsArrears[0].unitNumber, '10');
  assert.equal(invoiceData.pastMonthsArrears[0].residentName, 'أحمد الشيخ');
  assert.equal(invoiceData.totals.totalPastMonthsArrears, 200);
});

test('generateDetailedWrittenWhatsAppReport formats month at top without تقرير مالي مكتوب, resident names without apartment numbers, treasury & carry-over totals, expenses, past-month arrears in notes, and InstaPay footer', () => {
  const invoiceData = buildWhatsAppInvoiceReportData({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    settings: DEFAULT_SETTINGS,
    targetMonth: '2026-10',
    generatedAt: '2026-10-25T14:30:00',
  });

  const reportText = generateDetailedWrittenWhatsAppReport(invoiceData, {
    customNotes: 'يرجى سرعة السداد',
  });

  // 1. Month at the top, and does NOT include 'تقرير مالي مكتوب' or 'شقة'
  assert.ok(!reportText.includes('تقرير مالي مكتوب'));
  assert.ok(!reportText.includes('شقة'));
  assert.ok(reportText.startsWith('🏢 *برج النور*\n📅 *الشهر: أكتوبر 2026 (2026-10)*'));

  // 2. Treasury & carry-over & expenses & remaining
  assert.ok(reportText.includes('المبالغ المرحّلة من الشهر الماضي'));
  assert.ok(reportText.includes('إجمالي المبالغ في الخزنة الحالية والمرحلة من الشهر الماضي'));
  assert.ok(reportText.includes('إجمالي المصروفات هذا الشهر'));
  assert.ok(reportText.includes('المتبقي في الخزنة الحالية'));

  // 3. Paid this month in rows by resident name only
  assert.ok(reportText.includes('✅ *قام بالدفع هذا الشهر:*'));
  assert.ok(reportText.includes('1. عم محمد دغيدي:'));
  assert.ok(reportText.includes('2. احمد ابراهيم عبدالهادي:'));

  // 4. Late this month in rows by resident name only
  assert.ok(reportText.includes('⚠️ *متأخر عن الدفع هذا الشهر'));
  assert.ok(reportText.includes('1. هاني ابو ضيف:'));
  assert.ok(reportText.includes('3. ا عصمت:'));

  // 5. Expenses with amount next to each item
  assert.ok(reportText.includes('💸 *المصروفات هذا الشهر'));
  assert.ok(reportText.includes('1. صيانة مصعد شهر سبتمبر متأخرات:'));
  assert.ok(reportText.includes('2. صيانة دورية للمصعد شهر اكتوبر:'));

  // 6. Notes with past months arrears by resident name only, amount, and month
  assert.ok(reportText.includes('📌 *ملاحظات (المتأخرون عن الدفع من شهور ماضية):*'));
  assert.ok(reportText.includes('1. أحمد الشيخ:'));
  assert.ok(reportText.includes('سبتمبر 2026 (2026-09)'));
  assert.ok(reportText.includes('يرجى سرعة السداد'));

  // 7. Bottom InstaPay link and recipient name
  assert.ok(reportText.includes(INSTAPAY_PAYMENT_URL));
  assert.ok(reportText.includes(INSTAPAY_RECIPIENT_NAME));
});

test('generateAppIconSvgDataUrl, generateOfficialStampSvgDataUrl, and validateBrandingImageDataUrl support custom program icon and official stamp', () => {
  const iconDataUrl = generateAppIconSvgDataUrl('برج النور', 'teal');
  assert.ok(iconDataUrl.startsWith('data:image/svg+xml;utf8,'));
  assert.equal(validateBrandingImageDataUrl(iconDataUrl), true);

  const stampDataUrl = generateOfficialStampSvgDataUrl('برج النور', 'أحمد ابراهيم', 'emerald');
  assert.ok(stampDataUrl.startsWith('data:image/svg+xml;utf8,'));
  assert.equal(validateBrandingImageDataUrl(stampDataUrl), true);

  assert.equal(validateBrandingImageDataUrl(''), false);
  assert.equal(validateBrandingImageDataUrl(undefined), false);
  assert.equal(validateBrandingImageDataUrl('javascript:alert(1)'), false);

  const invoiceWithBranding = buildWhatsAppInvoiceReportData({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    settings: {
      ...DEFAULT_SETTINGS,
      appIconUrl: iconDataUrl,
      officialStampUrl: stampDataUrl,
    },
    targetMonth: '2026-10',
  });

  assert.equal(invoiceWithBranding.appIconUrl, iconDataUrl);
  assert.equal(invoiceWithBranding.officialStampUrl, stampDataUrl);
});

test('buildBulkOverdueWhatsAppQueue generates 1-click unified and individual WhatsApp reminders for all overdue residents', () => {
  const queue = buildBulkOverdueWhatsAppQueue({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    settings: DEFAULT_SETTINGS,
    targetMonth: '2026-10',
    tone: 'gentle',
  });

  // In 2026-10, 9 distinct units are overdue (including apt-10 أحمد الشيخ who has both 2026-10 and 2026-09 arrears) => 9 total overdue recipients totaling 1900 EGP
  assert.equal(queue.totalOverdueRecipientsCount, 9);
  assert.equal(queue.totalOverdueAmountAll, 1900);
  assert.ok(queue.unifiedGroupOverdueMessage.includes('تذكير جماعي بسداد اشتراكات ومصروفات برج النور'));
  assert.ok(queue.unifiedGroupOverdueMessage.includes('هاني ابو ضيف'));
  assert.ok(queue.unifiedGroupOverdueMessage.includes('أحمد الشيخ'));
  assert.ok(queue.unifiedGroupOverdueMessage.includes(INSTAPAY_PAYMENT_URL));
  assert.ok(queue.unifiedGroupOverdueMessage.includes(INSTAPAY_RECIPIENT_NAME));
  assert.ok(queue.generalWhatsAppShareUrl.startsWith('https://wa.me/?text='));

  const firstRecipient = queue.recipients[0];
  assert.equal(firstRecipient.residentName, 'هاني ابو ضيف');
  assert.equal(firstRecipient.totalOverdueAmount, 200);
  assert.ok(firstRecipient.personalizedMessage.includes('هاني ابو ضيف'));
  assert.ok(firstRecipient.personalizedMessage.includes(INSTAPAY_PAYMENT_URL));
  assert.ok(firstRecipient.directWhatsAppUrl.includes('api.whatsapp.com/send?phone=20'));
});

test('getAppVersionAndSystemInfo returns version metadata, record counts, and changelog highlights', () => {
  const info = getAppVersionAndSystemInfo({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    settings: DEFAULT_SETTINGS,
    lastUpdatedTimestamp: '2026-10-28T15:00:00',
    updateRevision: 0,
  });

  assert.equal(info.version, '3.8.0');
  assert.equal(info.buildNumber, '2026.10.28');
  assert.equal(info.cacheVersion, 'borj-elnoor-pwa-v14');
  assert.equal(info.alwaysInstallsLatest, true);
  assert.equal(info.buildingName, 'برج النور');
  assert.ok(info.programName.includes('حسن الجوار'));
  assert.equal(info.apartmentsCount, 27);
  assert.equal(info.revenuesCount, 33);
  assert.equal(info.expensesCount, 8);
  assert.ok(info.estimatedStorageKb >= 1);
  assert.ok(info.lastUpdatedFormatted.includes('2026/10/28'));
  assert.ok(info.changelogFeatures.length >= 5);
  assert.equal(info.instapayUrl, INSTAPAY_PAYMENT_URL);
});

test('resolveAppDisplayModeConfig switches cleanly between desktop and mobile display modes', () => {
  const desktopCfg = resolveAppDisplayModeConfig('desktop');
  assert.equal(desktopCfg.mode, 'desktop');
  assert.equal(desktopCfg.nextMode, 'mobile');
  assert.equal(desktopCfg.activeLabelArabic, 'عرض الكمبيوتر');
  assert.equal(desktopCfg.toggleActionLabelArabic, 'عرض الموبايل');
  assert.equal(desktopCfg.showMobileBottomNav, false);
  assert.equal(desktopCfg.rootWrapperClass, 'app-display-desktop');

  const mobileCfg = resolveAppDisplayModeConfig('mobile');
  assert.equal(mobileCfg.mode, 'mobile');
  assert.equal(mobileCfg.nextMode, 'desktop');
  assert.equal(mobileCfg.activeLabelArabic, 'عرض الموبايل');
  assert.equal(mobileCfg.toggleActionLabelArabic, 'عرض الكمبيوتر');
  assert.equal(mobileCfg.showMobileBottomNav, true);
  assert.equal(mobileCfg.rootWrapperClass, 'app-display-mobile');

  // Fallback for unknown or null values defaults to desktop
  const fallbackCfg = resolveAppDisplayModeConfig(null);
  assert.equal(fallbackCfg.mode, 'desktop');
});

test('buildFloorsExcelSheetData builds 10 floors from الدور العاشر down to الدور الاول with exact names, spans, statuses, and 2400 total', () => {
  const sheet = buildFloorsExcelSheetData({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    settings: DEFAULT_SETTINGS,
    targetMonth: '2026-10',
    generatedAt: '2026-10-25T21:12:00',
  });

  assert.equal(sheet.totalMonthCollected, 2400);
  assert.equal(sheet.floors.length, 10);
  assert.equal(sheet.floors[0].floor, 10);
  assert.equal(sheet.floors[0].floorTitleArabic, 'الدور العاشر');
  assert.equal(sheet.floors[9].floor, 1);
  assert.equal(sheet.floors[9].floorTitleArabic, 'الدور الاول');
  assert.equal(sheet.printTimeFormatted, '25/10/2026 21:12');

  // Check Floor 10: unit 26 (أ/ محمود السعداوي, span 3) and unit 27 (X, span 3, closed_x)
  const floor10 = sheet.floors[0];
  assert.equal(floor10.cells.length, 2);
  assert.equal(floor10.cells[0].unitNumber, '26');
  assert.equal(floor10.cells[0].displayLabel, 'أ/ محمود السعداوي');
  assert.equal(floor10.cells[0].colSpanHalfUnits, 3);
  assert.equal(floor10.cells[1].unitNumber, '27');
  assert.equal(floor10.cells[1].displayLabel, 'X');
  assert.equal(floor10.cells[1].status, 'closed_x');
  assert.equal(floor10.cells[1].colSpanHalfUnits, 3);

  // Check Floor 5: unit 13 (الشيخ مصطفى, span 4, exempt_named) and unit 14 (أم محمد, span 2, exempt_named)
  const floor5 = sheet.floors.find(f => f.floor === 5)!;
  assert.equal(floor5.cells[0].unitNumber, '13');
  assert.equal(floor5.cells[0].displayLabel, 'الشيخ مصطفى');
  assert.equal(floor5.cells[0].colSpanHalfUnits, 4);
  assert.equal(floor5.cells[0].status, 'exempt_named');
  assert.equal(floor5.cells[1].unitNumber, '14');
  assert.equal(floor5.cells[1].displayLabel, 'أم محمد');
  assert.equal(floor5.cells[1].colSpanHalfUnits, 2);
  assert.equal(floor5.cells[1].status, 'exempt_named');

  // Check Floor 1: unit 1 (X), unit 2 (عم محمد, 200), unit 3 (ا/ هاني ابو ضيف, 0)
  const floor1 = sheet.floors[9];
  assert.equal(floor1.cells[0].unitNumber, '1');
  assert.equal(floor1.cells[0].displayLabel, 'X');
  assert.equal(floor1.cells[0].status, 'closed_x');
  assert.equal(floor1.cells[1].unitNumber, '2');
  assert.equal(floor1.cells[1].displayLabel, 'عم محمد');
  assert.equal(floor1.cells[1].paidAmount, 200);
  assert.equal(floor1.cells[2].unitNumber, '3');
  assert.equal(floor1.cells[2].displayLabel, 'ا/ هاني ابو ضيف');
  assert.equal(floor1.cells[2].paidAmount, 0);

  // Check visual KPI metrics
  assert.equal(sheet.paidUnitsCount, 13);
  assert.equal(sheet.partialUnitsCount, 1); // Unit 20 paid 100 out of 200
  assert.equal(sheet.unpaidUnitsCount, 8);
  assert.equal(sheet.exemptOrClosedCount, 6);
  assert.equal(sheet.expectedMonthlyTotal, 4100);
  assert.equal(sheet.remainingMonthlyTotal, 1700);
  assert.equal(sheet.collectionRatePercent, 59);
});

test('buildQuickSummaryHubData computes executive summaries, floor statuses, overdue units, and quick task completion stats', () => {
  const sampleTasks: QuickTask[] = [
    {
      id: 't1',
      text: 'تحصيل متأخرات المصعد',
      completed: true,
      priority: 'high',
      createdAt: '2026-10-01',
    },
    {
      id: 't2',
      text: 'مراجعة فواتير الكهرباء',
      completed: false,
      priority: 'high',
      createdAt: '2026-10-05',
    },
    {
      id: 't3',
      text: 'غسيل السلم',
      completed: false,
      priority: 'normal',
      createdAt: '2026-10-10',
    },
  ];

  const hub = buildQuickSummaryHubData({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    quickTasks: sampleTasks,
    settings: DEFAULT_SETTINGS,
    targetMonth: '2026-10',
  });

  assert.equal(hub.targetMonth, '2026-10');
  assert.equal(hub.monthLabelArabic, 'أكتوبر 2026');
  assert.equal(hub.treasuryBalance, 1710);
  assert.equal(hub.monthRevenues, 2400);
  assert.equal(hub.monthExpenses, 770);
  assert.equal(hub.monthNetFlow, 1630);
  assert.equal(hub.collectionRatePercent, 59);

  assert.equal(hub.unitsSummary.totalUnits, 27);
  assert.equal(hub.unitsSummary.fullyPaidCount, 12);
  assert.equal(hub.unitsSummary.partialPaidCount, 1);
  assert.equal(hub.unitsSummary.unpaidRequiredCount, 8);
  assert.equal(hub.unitsSummary.exemptOrClosedCount, 6);

  assert.equal(hub.tasksSummary.totalTasks, 3);
  assert.equal(hub.tasksSummary.completedTasks, 1);
  assert.equal(hub.tasksSummary.pendingTasks, 2);
  assert.equal(hub.tasksSummary.highPriorityPendingCount, 1);
  assert.equal(hub.tasksSummary.completionRatePercent, 33);

  assert.equal(hub.floorsQuickStatus.length, 10);
  assert.equal(hub.topOverdueUnits.length, 9); // 8 unpaid + 1 partial (unit 20)
  assert.ok(QUICK_TASK_SMART_TEMPLATES.length >= 6);
});

test('getSettingsModalTabsConfig and getMainNavbarTabIds consolidate Display Mode, Install, Version/Updates, and Help inside Settings', () => {
  const settingsTabs = getSettingsModalTabsConfig();
  assert.equal(settingsTabs.length, 4);
  assert.deepEqual(
    settingsTabs.map(t => t.id),
    ['general', 'display_install_updates', 'help', 'backup']
  );

  const displayTab = settingsTabs.find(t => t.id === 'display_install_updates')!;
  assert.ok(displayTab.consolidatedFeatures.includes('display_mode_and_switcher'));
  assert.ok(displayTab.consolidatedFeatures.includes('standalone_app_install'));
  assert.ok(displayTab.consolidatedFeatures.includes('version_and_updates_info'));

  const helpTab = settingsTabs.find(t => t.id === 'help')!;
  assert.ok(helpTab.consolidatedFeatures.includes('user_guide'));
  assert.ok(helpTab.consolidatedFeatures.includes('offline_mode_help'));

  // Main Navbar tabs exclude 'guide' because Help/Guide is now inside Settings
  const mainNavIds = getMainNavbarTabIds();
  assert.ok(!mainNavIds.includes('guide'));
  assert.deepEqual(mainNavIds, [
    'dashboard',
    'special_tasks',
    'quick_hub',
    'units',
    'revenues',
    'expenses',
    'reports',
  ]);
});

test('resolveDynamicAppVersion and getPWAInstallGuideData update version on every update and always install latest version', () => {
  const rev0 = resolveDynamicAppVersion(0, '2026-10-28T10:00:00');
  assert.equal(rev0.version, '3.8.0');
  assert.equal(rev0.buildNumber, '2026.10.28');
  assert.equal(rev0.cacheVersion, 'borj-elnoor-pwa-v14');

  const rev1 = resolveDynamicAppVersion(1, '2026-10-26T11:30:00');
  assert.equal(rev1.version, '3.8.1');
  assert.equal(rev1.buildNumber, '2026.10.26-R1');
  assert.equal(rev1.cacheVersion, 'borj-elnoor-pwa-v14-r1');

  const rev2 = resolveDynamicAppVersion(2, '2026-10-26T12:45:00');
  assert.equal(rev2.version, '3.8.2');
  assert.equal(rev2.buildNumber, '2026.10.26-R2');
  assert.equal(rev2.cacheVersion, 'borj-elnoor-pwa-v14-r2');

  const sysInfoRev2 = getAppVersionAndSystemInfo({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    settings: DEFAULT_SETTINGS,
    lastUpdatedTimestamp: '2026-10-26T12:45:00',
    updateRevision: 2,
  });
  assert.equal(sysInfoRev2.version, '3.8.2');
  assert.equal(sysInfoRev2.buildNumber, '2026.10.26-R2');
  assert.equal(sysInfoRev2.updateRevision, 2);
  assert.equal(sysInfoRev2.alwaysInstallsLatest, true);
  assert.ok(sysInfoRev2.changelogFeatures[0].badge.includes('3.8.2'));

  const urls = resolveStandaloneBuildingAppUrls('https://localhost:3000', '3.8.2');
  assert.equal(urls.latestVersionTag, '3.8.2');
  assert.equal(urls.appShortName, 'حسن الجوار');
  assert.ok(urls.directStandaloneInstallUrl.includes('latest_v=3.8.2'));
  assert.equal(urls.directApkDownloadUrl, 'https://localhost:3000/borj-elnoor-standalone.apk?v=3.8.2');
  assert.equal(urls.localRelativeApkUrl, '/borj-elnoor-standalone.apk?v=3.8.2');
  assert.equal(urls.apkFileName, 'borj-elnoor-standalone-v3.8.2.apk');

  const guide = getPWAInstallGuideData('Mozilla/5.0 (Linux; Android 14)', true, false, false, 'https://localhost:3000', '3.8.2');
  assert.equal(guide.alwaysInstallsLatestVersion, true);
  assert.equal(guide.latestVersionTag, '3.8.2');
  assert.ok(guide.installButtonLabel.includes('أحدث نسخة'));
  assert.ok(guide.installButtonLabel.includes('v3.8.2'));
});

test('searchBuildingRecords performs instant Arabic-normalized search across apartments, revenues, and expenses', () => {
  assert.equal(normalizeArabicSearchText('أحمد إبراهيم السعداوى'), 'احمد ابراهيم السعداوي');

  // Search for resident 'السعداوي' (Apartment 26 on Floor 10: paid in 2026-09, unpaid in 2026-10)
  const resSept = searchBuildingRecords({
    query: 'السعداوي',
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    targetMonth: '2026-09',
  });
  assert.equal(resSept.apartments.length, 1);
  assert.equal(resSept.apartments[0].apartment.number, '26');
  assert.equal(resSept.apartments[0].monthStatus, 'paid');
  assert.ok(resSept.revenues.length >= 1);

  // Search for resident 'عبدالهادي' (Apartment 6: paid in 2026-10)
  const resOct = searchBuildingRecords({
    query: 'عبدالهادي',
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    targetMonth: '2026-10',
  });
  assert.equal(resOct.apartments.length, 1);
  assert.equal(resOct.apartments[0].apartment.number, '6');
  assert.equal(resOct.apartments[0].monthStatus, 'paid');

  // Search for expense 'مصعد'
  const res2 = searchBuildingRecords({
    query: 'مصعد',
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    targetMonth: '2026-10',
  });
  assert.ok(res2.expenses.length >= 2);
});

test('resolveStandaloneApkDownloadInfo returns Option 2 Standalone APK metadata, direct download URLs, declared permissions, and 3-step install guide', () => {
  const apkInfo = resolveStandaloneApkDownloadInfo('', '3.8.0', 'برج النور');
  assert.equal(apkInfo.apkFileName, 'borj-elnoor-standalone-v3.8.0.apk');
  assert.equal(apkInfo.packageName, STANDALONE_APK_PACKAGE_NAME);
  assert.equal(apkInfo.versionName, '3.8.0');
  assert.equal(apkInfo.versionCode, 380);
  assert.equal(apkInfo.localRelativeApkUrl, `${STANDALONE_APK_STATIC_PATH}?v=3.8.0`);
  assert.ok(apkInfo.directApkDownloadUrl.endsWith('/borj-elnoor-standalone.apk?v=3.8.0'));
  assert.equal(apkInfo.minAndroidVersion, 'Android 7.0+ (API 24+)');
  assert.equal(apkInfo.apkInstallSteps.length, 3);
  assert.equal(apkInfo.declaredPermissions.length, 7);
  assert.ok(apkInfo.declaredPermissions.some(p => p.shortName === 'READ_MEDIA_IMAGES'));
  assert.ok(apkInfo.declaredPermissions.some(p => p.shortName === 'READ_EXTERNAL_STORAGE'));
  assert.ok(apkInfo.declaredPermissions.some(p => p.shortName === 'WRITE_EXTERNAL_STORAGE'));
  assert.ok(apkInfo.declaredPermissions.some(p => p.shortName === 'POST_NOTIFICATIONS'));
  assert.ok(apkInfo.whatsappShareApkUrl.startsWith('https://wa.me/?text='));
});

test('resolveAppThemeConfig and APP_THEMES_CATALOG provide 6 themes and custom accent color resolution', () => {
  assert.equal(APP_THEMES_CATALOG.length, 6);
  assert.equal(APK_DECLARED_PERMISSIONS.length, 7);

  const defaultTheme = resolveAppThemeConfig(null, null);
  assert.equal(defaultTheme.id, 'emerald');
  assert.equal(defaultTheme.effectiveAccentHex, '#059669');

  const royalBlue = resolveAppThemeConfig('royal_blue', '#2563eb');
  assert.equal(royalBlue.id, 'royal_blue');
  assert.equal(royalBlue.effectiveAccentHex, '#2563eb');

  const darkTheme = resolveAppThemeConfig('dark_slate', '#10b981');
  assert.equal(darkTheme.id, 'dark_slate');
  assert.equal(darkTheme.isDark, true);
});

test('verifyApkBinaryStructure validates that public/borj-elnoor-standalone.apk is a complete, v1+v2 signed binary Android APK (>400KB)', () => {
  const apkBuffer = fs.readFileSync('public/borj-elnoor-standalone.apk');
  const bytes = new Uint8Array(apkBuffer);
  const check = verifyApkBinaryStructure(bytes);

  assert.equal(check.isValid, true);
  assert.ok(check.fileSizeBytes > 400000, `Expected APK > 400KB, got ${check.fileSizeBytes}`);
  assert.equal(check.hasZipMagic, true);
  assert.equal(check.hasAndroidManifestEntry, true);
  assert.equal(check.hasResourcesArscEntry, true);
  assert.equal(check.hasClassesDexEntry, true);
  assert.equal(check.hasCertRsaSignature, true);
  assert.equal(check.hasApkSigBlockV2, true);

  // Verify UTF-16LE encoded app label «حسن الجوار» and permissions inside the uncompressed binary AndroidManifest.xml in the APK
  assert.ok(apkBuffer.includes(Buffer.from('حسن الجوار', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.READ_EXTERNAL_STORAGE', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.WRITE_EXTERNAL_STORAGE', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.READ_MEDIA_IMAGES', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.MANAGE_EXTERNAL_STORAGE', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.CAMERA', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('android.permission.POST_NOTIFICATIONS', 'utf16le')));
  assert.ok(apkBuffer.includes(Buffer.from('requestLegacyExternalStorage', 'utf16le')));

  // Verify AndroidApkBridge native JavaScriptInterface methods inside classes.dex
  assert.ok(apkBuffer.includes(Buffer.from('AndroidApkBridge', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('saveBase64FileToDevice', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('saveFileWithFileManager', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('shareOrSaveBase64File', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('pickFileFromDevice', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('requestAllAppPermissions', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('copyTextNative', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('openExternalUri', 'utf8')));
  // Verify MediaStore WhatsApp image sharing and File Manager CREATE_DOCUMENT intent inside classes.dex
  assert.ok(apkBuffer.includes(Buffer.from('insertImage', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('decodeByteArray', 'utf8')));
  assert.ok(apkBuffer.includes(Buffer.from('android.intent.action.CREATE_DOCUMENT', 'utf8')));
  // Verify valid DEX shorty descriptor "IL" for InputStream.read([B)I is present in classes.dex string pool
  assert.ok(apkBuffer.includes(Buffer.from('\x02IL\x00', 'utf8')));

  // Also verify small/corrupted buffers are rejected
  const smallCheck = verifyApkBinaryStructure(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));
  assert.equal(smallCheck.isValid, false);
});

test('apkBridge helpers generate valid Arabic RTL Excel (.xls) workbooks, UTF-8 BOM CSVs, TSVs, and native WhatsApp intent URLs', () => {
  const headers = ['الدور', 'اسم الساكن', 'المبلغ المسدد', 'الحالة'];
  const rows = [
    ['الدور الأول', 'عم محمد دغيدي', 200, 'مسدد بالكامل'],
    ['الدور الأول', 'هاني ابو ضيف', 0, 'لم يسدد'],
  ];

  const csv = buildCsvWithBom(headers, rows);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"عم محمد دغيدي"'));
  assert.ok(csv.includes('200'));

  const tsv = buildTsvString(headers, rows);
  assert.ok(tsv.includes('الدور\tاسم الساكن\tالمبلغ المسدد\tالحالة'));
  assert.ok(tsv.includes('عم محمد دغيدي\t200\tمسدد بالكامل'));

  const xlsHtml = buildExcelWorkbookHtml('شيت_ادوار_برج_النور_2026-10', headers, rows);
  assert.ok(xlsHtml.includes('urn:schemas-microsoft-com:office:excel'));
  assert.ok(xlsHtml.includes('<x:DisplayRightToLeft/>'));
  assert.ok(xlsHtml.includes('عم محمد دغيدي'));
  assert.ok(xlsHtml.includes('#d1fae5')); // Green background for paid status

  const extractedB64 = extractBase64FromDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
  assert.equal(extractedB64, 'iVBORw0KGgoAAAANSUhEUg==');

  const b64Arabic = utf8ToBase64('برج النور 2026');
  assert.ok(b64Arabic.length > 8);

  // When not in APK mode, URLs stay web URLs; check conversion logic
  assert.equal(convertWhatsAppUrlForApk('whatsapp://send?text=hello'), 'whatsapp://send?text=hello');
});

test('multi-format Excel (.xlsx, .xls, .csv, .xml, .ods, .tsv), multi-format images (PNG, JPG, WEBP, SVG), and device save locations work accurately', async () => {
  assert.equal(SAVE_LOCATION_OPTIONS.length, 5);
  assert.equal(IMAGE_FORMAT_OPTIONS.length, 4);
  assert.equal(EXCEL_FORMAT_OPTIONS.length, 6);

  const headers = ['الدور', 'اسم الساكن', 'المبلغ المسدد', 'الحالة'];
  const rows: (string | number)[][] = [
    ['الدور الأول', 'عم محمد دغيدي', 200, 'مسدد بالكامل'],
    ['الدور الثاني', 'هاني ابو ضيف', 0, 'لم يسدد'],
  ];

  // 1. Verify genuine .xlsx Office Open XML ZIP generation
  const xlsxBytes = buildXlsxWorkbookBytes('كشف تحصيل أكتوبر 2026', headers, rows);
  assert.equal(xlsxBytes[0], 0x50); // 'P'
  assert.equal(xlsxBytes[1], 0x4b); // 'K'
  assert.equal(xlsxBytes[2], 0x03);
  assert.equal(xlsxBytes[3], 0x04);
  const xlsxText = new TextDecoder('utf-8', { fatal: false }).decode(xlsxBytes);
  assert.ok(xlsxText.includes('[Content_Types].xml'));
  assert.ok(xlsxText.includes('xl/workbook.xml'));
  assert.ok(xlsxText.includes('xl/worksheets/sheet1.xml'));
  assert.ok(xlsxText.includes('rightToLeft="1"'));
  assert.ok(xlsxText.includes('عم محمد دغيدي'));

  // 2. Verify Excel 2003 SpreadsheetML (.xml)
  const xmlWorkbook = buildExcelXml2003Workbook('كشف تحصيل أكتوبر 2026', headers, rows);
  assert.ok(xmlWorkbook.includes('<?mso-application progid="Excel.Sheet"?>'));
  assert.ok(xmlWorkbook.includes('ss:RightToLeft="1"'));
  assert.ok(xmlWorkbook.includes('عم محمد دغيدي'));

  // 3. Verify OpenDocument Spreadsheet (.ods) ZIP generation
  const odsBytes = buildOdsSpreadsheetBytes('كشف تحصيل أكتوبر 2026', headers, rows);
  assert.equal(odsBytes[0], 0x50);
  assert.equal(odsBytes[1], 0x4b);
  const odsText = new TextDecoder('utf-8', { fatal: false }).decode(odsBytes);
  assert.ok(odsText.includes('application/vnd.oasis.opendocument.spreadsheet'));
  assert.ok(odsText.includes('content.xml'));
  assert.ok(odsText.includes('عم محمد دغيدي'));

  // 4. Verify all 6 Excel formats map
  const allExcel = generateAllExcelFormatPayloads(
    'كشف تحصيل أكتوبر 2026',
    'شيت_ادوار_حسن_الجوار',
    headers,
    rows
  );
  assert.equal(allExcel.xlsx.fileName, 'شيت_ادوار_حسن_الجوار.xlsx');
  assert.equal(allExcel.xls.fileName, 'شيت_ادوار_حسن_الجوار.xls');
  assert.equal(allExcel.csv.fileName, 'شيت_ادوار_حسن_الجوار.csv');
  assert.equal(allExcel.xml.fileName, 'شيت_ادوار_حسن_الجوار.xml');
  assert.equal(allExcel.ods.fileName, 'شيت_ادوار_حسن_الجوار.ods');
  assert.equal(allExcel.tsv.fileName, 'شيت_ادوار_حسن_الجوار.tsv');
  assert.ok(allExcel.xlsx.sizeBytes > 500);

  // 5. Verify image conversion across PNG, JPEG, WEBP, SVG
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const svgRes = await convertImageDataUrlToFormat(dummyPng, 'svg', { backgroundColor: '#ffffff' });
  assert.equal(svgRes.format, 'svg');
  assert.equal(svgRes.extension, 'svg');
  assert.ok(svgRes.dataUrl.startsWith('data:image/svg+xml;base64,'));

  const jpgRes = await convertImageDataUrlToFormat(dummyPng, 'jpeg');
  assert.equal(jpgRes.format, 'jpeg');
  assert.equal(jpgRes.extension, 'jpg');

  // 6. Verify device save path resolution
  const picPath = resolveTargetSavePathInfo('Pictures', 'حسن_الجوار', 'فاتورة_أكتوبر.png');
  assert.equal(picPath.folderOption.id, 'Pictures');
  assert.equal(picPath.displayFullPath, '/storage/emulated/0/Pictures/حسن_الجوار/فاتورة_أكتوبر.png');
  assert.equal(picPath.effectiveAndroidFileName, 'حسن_الجوار_فاتورة_أكتوبر.png');
});

test('buildSmartNotificationsFeed, normalizeImageForWhatsAppShare, and File Manager Save-As default work accurately', async () => {
  // 1. Default save preferences default to 'custom_ask' (File Manager Save-As) and attached app icon
  assert.equal(DEFAULT_SETTINGS.appIconUrl, '/pwa-192x192.png');
  assert.equal(DEFAULT_SETTINGS.defaultSaveFolder, 'custom_ask');
  const prefs = getDefaultSavePreferences();
  assert.equal(prefs.defaultSaveFolder, 'custom_ask');

  // 2. WhatsApp image share normalization converts SVG/WEBP to raster image/png and strips ;charset=utf-8
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const normSvg = await normalizeImageForWhatsAppShare(
    dummyPng,
    'فاتورة_أكتوبر.svg',
    'image/svg+xml;charset=utf-8'
  );
  assert.equal(normSvg.wasConvertedForWhatsApp, true);
  assert.equal(normSvg.mimeType, 'image/png');
  assert.equal(normSvg.fileName, 'فاتورة_أكتوبر.png');

  const normJpg = await normalizeImageForWhatsAppShare(
    dummyPng,
    'كشف_أدوار.jpg',
    'image/jpeg;charset=utf-8'
  );
  assert.equal(normJpg.mimeType, 'image/jpeg');
  assert.equal(normJpg.fileName, 'كشف_أدوار.jpg');

  // 3. Smart Notifications Feed analyzes overdue units, recurring bills, quick tasks, and collection %
  const sampleTasks: QuickTask[] = [
    {
      id: 'qt-urgent-1',
      text: 'فحص موتور المياه الرئيسي',
      completed: false,
      priority: 'high',
      createdAt: '2026-10-05',
    },
  ];
  const smartFeed = buildSmartNotificationsFeed({
    apartments: INITIAL_APARTMENTS,
    revenues: INITIAL_REVENUES,
    expenses: INITIAL_EXPENSES,
    quickTasks: sampleTasks,
    selectedMonth: '2026-10',
    settings: DEFAULT_SETTINGS,
  });
  assert.ok(smartFeed.totalCount >= 4);
  assert.ok(smartFeed.criticalCount >= 1);
  assert.ok(smartFeed.items.some(i => i.category === 'overdue_payment'));
  assert.ok(smartFeed.items.some(i => i.category === 'urgent_task'));
  assert.ok(smartFeed.items.some(i => i.category === 'treasury_insight'));
  assert.ok(smartFeed.topNotificationTitle.includes('حسن الجوار'));
});

test('Unified File & Media Manager Service: checksums, duplicate guard, standardized naming, PDF builder, ZIP streaming, and memory cleanup', async () => {
  const {
    computeContentChecksum,
    checkIsDuplicateSave,
    recordSuccessfulSaveHash,
    clearDuplicateSaveHistory,
    buildStandardizedFileName,
    buildPdfDocumentFromJpegBytes,
    buildMultiFormatZipBundle,
    transformAndOptimizeImage,
    mediaMemoryRegistry,
  } = await import('../services/fileMediaManager');

  // 1. Checksum & duplicate save guard
  clearDuplicateSaveHistory();
  const samplePayload = 'تقرير برج النور المالي - أكتوبر 2026';
  const hash1 = computeContentChecksum(samplePayload);
  const hash2 = computeContentChecksum(samplePayload);
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 8);

  const dupCheckBefore = checkIsDuplicateSave(hash1, 'test_scope');
  assert.equal(dupCheckBefore.isDuplicate, false);
  recordSuccessfulSaveHash(hash1, 'test_scope', 'فاتورة_أكتوبر.png', '/storage/emulated/0/Download/فاتورة_أكتوبر.png');

  const dupCheckAfter = checkIsDuplicateSave(hash1, 'test_scope');
  assert.equal(dupCheckAfter.isDuplicate, true);
  assert.equal(dupCheckAfter.previousSave?.fileName, 'فاتورة_أكتوبر.png');

  // 2. Standardized File Name generator (`project-name-YYYY-MM-DD-hash.ext`)
  const stdName = buildStandardizedFileName({
    projectPrefix: 'حسن الجوار',
    titleOrSlug: 'فاتورة أكتوبر',
    extension: 'webp',
    contentHash: hash1,
    scale: 2,
    includeDate: true,
  });
  assert.ok(stdName.startsWith('حسن_الجوار-فاتورة_أكتوبر-'));
  assert.ok(stdName.endsWith('@2x.webp'));

  // 3. Self-contained PDF 1.4 generator from JPEG bytes
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
  const pdfBytes = buildPdfDocumentFromJpegBytes(fakeJpeg, 800, 1200, 'AlNoor Invoice');
  const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 8));
  assert.equal(pdfHeader, '%PDF-1.4');

  // 4. Transform & optimize image (including PDF & SVG fallback in Node environment)
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pdfTransformed = await transformAndOptimizeImage(dummyPng, 'فاتورة_أكتوبر', {
    format: 'pdf',
    scale: 2,
  });
  assert.equal(pdfTransformed.format, 'pdf');
  assert.equal(pdfTransformed.extension, 'pdf');
  assert.equal(pdfTransformed.mimeType, 'application/pdf');
  assert.ok(pdfTransformed.sizeBytes > 100);

  // 5. Multi-File ZIP Streaming Bundler
  const zipBundle = buildMultiFormatZipBundle(
    [
      { fileName: 'report.json', data: JSON.stringify({ ok: true }) },
      { fileName: 'document.pdf', data: pdfBytes },
    ],
    'حزمة_تصدير_برج_النور'
  );
  assert.equal(zipBundle.fileCount, 2);
  assert.ok(zipBundle.zipFileName.endsWith('.zip'));
  // PK\x03\x04 local file header signature
  assert.equal(zipBundle.zipBytes[0], 0x50);
  assert.equal(zipBundle.zipBytes[1], 0x4b);

  // 6. ObjectURL Memory Registry cleanup
  assert.equal(mediaMemoryRegistry.getActiveCount(), 0);
  mediaMemoryRegistry.revokeAll();
  assert.equal(mediaMemoryRegistry.getActiveCount(), 0);
});

test('Special Tasks (مهام خاصة): dynamic money & count columns, per-column analytics, equal split distribution, WhatsApp messages, and spreadsheet matrix work accurately', async () => {
  const {
    INITIAL_SPECIAL_TASKS,
    computeSpecialTaskRowSummary,
    calculateSpecialTaskAnalytics,
    distributeAmountAcrossSpecialTaskRows,
    buildSpecialTaskRowWhatsAppMessage,
    buildSpecialTaskFullWrittenReport,
    buildSpecialTaskSpreadsheetMatrix,
  } = await import('./specialTasks');

  const camerasTask = INITIAL_SPECIAL_TASKS[0];
  assert.equal(camerasTask.columns.length, 4);
  assert.equal(camerasTask.rows.length, 6);

  // Row 1 (Apartment 6): 300 + (2 remotes * 150) + 100 + 50 = 750 required, 750 paid => 'paid'
  const row1Summary = computeSpecialTaskRowSummary(camerasTask.rows[0], camerasTask.columns);
  assert.equal(row1Summary.moneyColumnsTotal, 450);
  assert.equal(row1Summary.countColumnsMonetaryTotal, 300);
  assert.equal(row1Summary.totalRequired, 750);
  assert.equal(row1Summary.totalCountItems, 2);
  assert.equal(row1Summary.paidAmount, 750);
  assert.equal(row1Summary.remainingAmount, 0);
  assert.equal(row1Summary.status, 'paid');

  // Full Task Analytics & Per-Column Statistics
  const analytics = calculateSpecialTaskAnalytics(camerasTask);
  assert.equal(analytics.totalResidentsCount, 6);
  assert.equal(analytics.paidResidentsCount, 3);
  assert.equal(analytics.partialResidentsCount, 2);
  assert.equal(analytics.unpaidResidentsCount, 1);
  // Total remotes across the 6 rows: 2 + 1 + 1 + 2 + 1 + 3 = 10 remotes
  assert.equal(analytics.grandTotalCountItems, 10);
  const remotesColStat = analytics.columnStats.find(c => c.columnId === 'col-remotes-qty')!;
  assert.equal(remotesColStat.type, 'count');
  assert.equal(remotesColStat.totalSum, 10);
  assert.equal(remotesColStat.totalMonetaryEquivalent, 1500);

  // Equal Split Distribution
  const splitRows = distributeAmountAcrossSpecialTaskRows(
    camerasTask.rows,
    'col-cam-base',
    6000
  );
  assert.equal(splitRows[0].values['col-cam-base'], 1000);
  assert.equal(splitRows[5].values['col-cam-base'], 1000);

  // WhatsApp & Written Report & Excel Matrix
  const rowWa = buildSpecialTaskRowWhatsAppMessage({
    task: camerasTask,
    row: camerasTask.rows[2], // partial resident
    settings: DEFAULT_SETTINGS,
  });
  assert.ok(rowWa.includes('عم محمد دغيدي'));
  assert.ok(rowWa.includes('عدد الريموتات'));
  assert.ok(rowWa.includes(INSTAPAY_PAYMENT_URL));

  const fullReport = buildSpecialTaskFullWrittenReport(camerasTask, DEFAULT_SETTINGS);
  assert.ok(fullReport.includes(camerasTask.title));
  assert.ok(fullReport.includes('10 ريموت'));

  const matrix = buildSpecialTaskSpreadsheetMatrix(camerasTask, DEFAULT_SETTINGS);
  assert.equal(matrix.rows.length, 7); // 6 resident rows + 1 totals row
  assert.equal(matrix.rows[6][0], 'الإجمالي');
});

test('applyRevenueUpdate, applyExpenseUpdate, applyQuickTaskUpdate, and applyArchivedTenantUpdate update records accurately', () => {
  // 1. Revenue update including unitId change
  const updatedRevs = applyRevenueUpdate(INITIAL_REVENUES, INITIAL_APARTMENTS, INITIAL_REVENUES[0].id, {
    amount: 999,
    unitId: INITIAL_APARTMENTS[2].id,
    notes: 'تعديل دفعة القسط',
  });
  const rev0 = updatedRevs.find(r => r.id === INITIAL_REVENUES[0].id)!;
  assert.equal(rev0.amount, 999);
  assert.equal(rev0.unitId, INITIAL_APARTMENTS[2].id);
  assert.equal(rev0.unitNumber, INITIAL_APARTMENTS[2].number);
  assert.equal(rev0.residentName, INITIAL_APARTMENTS[2].residentName);
  assert.equal(rev0.notes, 'تعديل دفعة القسط');

  // 2. Expense update
  const updatedExps = applyExpenseUpdate(INITIAL_EXPENSES, INITIAL_EXPENSES[0].id, {
    amount: 750,
    title: 'تعديل مصروف الصيانة',
  });
  const exp0 = updatedExps.find(e => e.id === INITIAL_EXPENSES[0].id)!;
  assert.equal(exp0.amount, 750);
  assert.equal(exp0.title, 'تعديل مصروف الصيانة');

  // 3. Quick task update
  const sampleTasks: QuickTask[] = [
    { id: 't1', text: 'مهمة أولى', completed: false, priority: 'normal', createdAt: '2026-10-01' },
  ];
  const updatedTasks = applyQuickTaskUpdate(sampleTasks, 't1', {
    text: 'مهمة معدلة',
    priority: 'high',
  });
  assert.equal(updatedTasks[0].text, 'مهمة معدلة');
  assert.equal(updatedTasks[0].priority, 'high');

  // 4. Archived tenant record update
  const aptWithHistory: Apartment = {
    ...INITIAL_APARTMENTS[0],
    previousTenants: [
      {
        id: 'arch-1',
        residentName: 'مستأجر قديم',
        phone: '01000000000',
        moveInDate: '2024-01-01',
        moveOutDate: '2025-01-01',
        monthlyFee: 300,
        totalPaidDuringTenancy: 3600,
        receiptsCount: 12,
        exitReason: 'انتهاء العقد',
        archivedAt: '2025-01-02',
      },
    ],
  };
  const updatedApts = applyArchivedTenantUpdate([aptWithHistory], aptWithHistory.id, 'arch-1', {
    residentName: 'مستأجر معدل',
    totalPaidDuringTenancy: 4000,
  });
  assert.equal(updatedApts[0].previousTenants![0].residentName, 'مستأجر معدل');
  assert.equal(updatedApts[0].previousTenants![0].totalPaidDuringTenancy, 4000);
});

