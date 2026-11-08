export type ResidentType = 'owner' | 'tenant'; // مالك أو مستأجر

export type PaymentMethod = 'cash' | 'instapay' | 'bank_transfer' | 'vodafone_cash' | 'check';

export type RevenueCategory = 
  | 'monthly_subscription'  // اشتراك صيانة دوري
  | 'elevator_maintenance'   // صيانة المصعد
  | 'emergency_repair'      // إصلاحات طارئة
  | 'reserve_fund'          // صندوق الطوارئ / وديعة
  | 'building_improvement'  // تحسينات وتجديدات
  | 'other';                // إيرادات أخرى

export type ExpenseCategory = 
  | 'elevator'              // صيانة وقطع غيار المصعد
  | 'electricity'           // فواتير الكهرباء (المصعد، السلم، الموتور)
  | 'water'                 // فواتير المياه المشتركة
  | 'guard_salary'          // راتب الحارس / البواب
  | 'cleaner_salary'        // راتب / إكرامية عامل النظافة
  | 'general_maintenance'   // صيانة عامة (سباكة، إنارة، أبواب)
  | 'cleaning_supplies'     // أدوات نظافة ومبيدات
  | 'emergency'             // طوارئ وأعطال مفاجئة
  | 'administrative'        // مصاريف إدارية ونثرية
  | 'other';                // مصاريف أخرى

export type RecurrenceInterval = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface PreviousTenantRecord {
  id: string;
  residentName: string;           // اسم المستأجر السابق
  phone: string;                  // رقم الهاتف
  email?: string;                 // البريد الإلكتروني للمستأجر السابق
  nationalId?: string;            // الرقم القومي
  moveInDate: string;             // تاريخ بداية الإيجار YYYY-MM-DD
  moveOutDate: string;            // تاريخ إخلاء الشقة YYYY-MM-DD
  monthlyFee: number;             // قيمة الإيجار / الاشتراك الشهري وقت الإقامة
  totalPaidDuringTenancy: number; // إجمالي ما سدده خلال فترة إقامته (تبقى الإيصالات مرتبطة بالشقة)
  receiptsCount: number;          // عدد إيصالات السداد المسجلة
  exitReason?: string;            // سبب الإخلاء / ملاحظات الخروج
  notes?: string;
  archivedAt: string;             // تاريخ الأرشفة YYYY-MM-DD
}

export interface Apartment {
  id: string;
  number: string;           // رقم الشقة
  floor: number;            // الدور
  residentName: string;     // اسم الساكن الحالي
  residentType: ResidentType;
  phone: string;            // رقم الهاتف
  email?: string;           // البريد الإلكتروني لإرسال الإيصالات والتقارير المالية
  nationalId?: string;      // الرقم القومي
  occupantsCount?: number;  // عدد الأفراد
  parkingSlot?: string;     // رقم الموقف / الجراج
  monthlyFee: number;       // قيمة الاشتراك الشهري المعتمدة للشقة
  initialBalance: number;   // رصيد افتتاحي (موجب = له، سالب = عليه)
  notes?: string;           // ملاحظات
  lastReminderDate?: string; // تاريخ آخر تذكير تم إرساله
  avatarIcon?: string;      // أيقونة أو صورة مخصصة لتمييز الشقة بصرياً
  avatarColor?: string;     // لون خلفية أيقونة الشقة
  moveInDate?: string;      // تاريخ بدء إقامة الساكن الحالي YYYY-MM-DD
  isVacant?: boolean;       // هل الوحدة شاغرة حالياً؟
  previousTenants?: PreviousTenantRecord[]; // سجل المستأجرين السابقين المؤرشف
  createdAt: string;
}

export interface Revenue {
  id: string;
  receiptNumber: string;    // رقم السند (سند قبض)
  unitId: string;           // معرف الشقة
  unitNumber: string;       // رقم الشقة
  residentName: string;     // اسم الساكن
  amount: number;           // المبلغ
  date: string;             // YYYY-MM-DD
  monthTarget: string;      // شهر الاستحقاق (مثلاً 2026-10)
  category: RevenueCategory;
  paymentMethod: PaymentMethod;
  transactionRef?: string;  // رقم الحوالة / العملية
  collectorName: string;    // اسم المحصل
  notes?: string;
  emailSentAt?: string;     // تاريخ إرسال الإيصال عبر البريد الإلكتروني إن وجد
  recipientEmail?: string;  // البريد الإلكتروني المرسل إليه الإيصال
  createdAt: string;
}

export interface Expense {
  id: string;
  voucherNumber: string;    // رقم السند (سند صرف)
  category: ExpenseCategory;
  title: string;            // بيان المصروف
  amount: number;           // المبلغ
  date: string;             // YYYY-MM-DD
  paidTo: string;           // المدفوع له (الجهة / الفني / الحارس)
  invoiceNumber?: string;   // رقم الفاتورة إن وجد
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type AppThemeId =
  | 'emerald'
  | 'royal_blue'
  | 'indigo_violet'
  | 'amber_gold'
  | 'rose_crimson'
  | 'dark_slate';

export type SaveLocationFolder =
  | 'Download'
  | 'Pictures'
  | 'DCIM'
  | 'Documents'
  | 'custom_ask';

export type ImageExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export type ExcelExportFormat = 'xlsx' | 'xls' | 'csv' | 'xml' | 'ods' | 'tsv';

export interface BuildingSettings {
  buildingName: string;
  buildingAddress: string;
  treasurerName: string;     // أمين الصندوق / رئيس الاتحاد
  treasurerPhone: string;
  treasurerEmail?: string;   // البريد الإلكتروني لإدارة العقار
  currency: string;          // ج.م / ر.س / د.ك
  defaultMonthlyFee: number; // الاشتراك الافتراضي
  emergencyFundBalance: number; // رصيد صندوق الطوارئ
  emergencyFundTarget: number;  // المستهدف
  bankAccountDetails?: string;  // تفاصيل الحساب البنكي أو إنستاباي
  notes?: string;
  enableLateRentAlerts?: boolean; // تفعيل تنبيهات الإيجار المتأخر في لوحة التحكم
  lateRentAlertDay?: number;      // يوم الشهر لبدء التنبيه (مثال: يوم 10)
  enablePreDueBrowserReminder?: boolean; // تفعيل جدولة تذكيرات المتصفح قبل موعد الاستحقاق بـ 3 أيام
  preDueReminderDays?: number;    // عدد الأيام قبل الاستحقاق للتذكير المسبق (افتراضياً 3 أيام)
  enableEmailNotifications?: boolean; // تفعيل ميزة إرسال الإيصالات والتقارير عبر البريد الإلكتروني
  readOnlyMode?: boolean;         // وضع القراءة فقط (Read-only mode) لمشاركة ومشاهدة التقارير فقط
  appIconUrl?: string;            // صورة مخصصة لأيقونة البرنامج (Data URL أو رابط صورة)
  officialStampUrl?: string;      // صورة مخصصة للختم الرسمي للعقار (Data URL أو رابط صورة)
  appTheme?: AppThemeId;          // ثيم البرنامج المعتمد (الألوان والمظهر)
  customAccentColor?: string;     // لون مخصص للأزرار والعناصر النشطة
  apkFilePermissionsGranted?: boolean; // تفعيل صلاحيات ملف الـ APK للتعامل مع الملفات والصور
  defaultSaveFolder?: SaveLocationFolder; // مكان الحفظ الافتراضي على الجهاز (Download / Pictures / DCIM / Documents / custom_ask)
  defaultCustomSubfolder?: string;        // اسم المجلد الفرعي المخصص للحفظ (مثل: حسن_الجوار)
  defaultImageFormat?: ImageExportFormat; // الصيغة الافتراضية لحفظ الصور (png / jpeg / webp / svg)
  defaultExcelFormat?: ExcelExportFormat; // الصيغة الافتراضية لحفظ ملفات الإكسيل (xlsx / xls / csv / xml / ods / tsv)
  alwaysPreviewBeforeSave?: boolean;      // عرض نافذة معاينة الصورة واختيار الصيغة ومكان الحفظ أثناء الحفظ
  enableSmartNotifications?: boolean;     // تفعيل مركز الإشعارات الذكية والتنبيهات التلقائية
  smartNotificationOnLaunch?: boolean;    // إظهار ملخص الإشعار الذكي عند فتح التطبيق
  smartNotificationSound?: boolean;       // تفعيل التنبيه الصوتي الخفيف للإشعارات الذكية
}

export interface MonthlyBudget {
  [category: string]: number;
}

export interface RecurringExpense {
  id: string;
  title: string;             // بيان المصروف (مثال: راتب الحارس، صيانة المصعد)
  category: ExpenseCategory; // التصنيف
  amount: number;            // المبلغ الشهري
  paidTo: string;            // الجهة أو الشخص المستفيد
  billingDay: number;        // يوم الاستحقاق الشهري (1 - 28)
  paymentMethod: PaymentMethod;
  isActive: boolean;         // مفعل للتوليد التلقائي
  notes?: string;
  lastGeneratedMonth?: string; // آخر شهر تم التوليد له YYYY-MM
  createdAt: string;
}

export type MaintenanceStatus = 'pending' | 'in_progress' | 'resolved'; // قيد الانتظار | جاري الإصلاح | تم الإصلاح
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'; // منخفضة | متوسطة | عالية | طارئة
export type MaintenanceCategory = 'plumbing' | 'electricity' | 'elevator' | 'intercom' | 'carpentry' | 'building' | 'water_tank' | 'other';

export interface MaintenanceNote {
  id: string;
  apartmentId: string;
  unitNumber?: string;       // رقم الشقة للمرجع السريع
  title: string;              // عنوان العطل أو الإصلاح المطلوب
  description?: string;        // تفاصيل العطل والموقع
  costEstimate?: number;       // التكلفة التقديرية للإصلاح
  status: MaintenanceStatus;   // الحالة
  priority: MaintenancePriority; // الأولوية
  category: MaintenanceCategory; // نوع العطل
  assignedTo?: string;         // الفني أو المسؤول (سباك، فني كهرباء، شركة المصاعد)
  scheduledDate?: string;      // موعد الصيانة المجدول أو التذكير القادم YYYY-MM-DD
  isPeriodic?: boolean;        // هل هي صيانة دورية متكررة؟
  recurrenceInterval?: RecurrenceInterval; // دورية التكرار (شهري، ربع سنوي، نصف سنوي، سنوي)
  createdAt: string;           // YYYY-MM-DD
  resolvedAt?: string;
}

export interface QuickTask {
  id: string;
  text: string;               // نص المهمة السريعة (مثل: شراء منظفات للعمارة، الاتصال بكهربائي)
  completed: boolean;
  priority: 'normal' | 'high';
  createdAt: string;
}

export type SpecialTaskColumnType = 'money' | 'count';

export interface SpecialTaskCustomColumn {
  id: string;
  title: string;              // اسم العمود (مثل: مساهمة الكاميرات، عدد الريموتات، مصنعية التركيب)
  type: SpecialTaskColumnType; // 'money' = عمود أموال | 'count' = عمود عدد شيء معين
  defaultValue: number;       // القيمة الافتراضية عند إضافة صف جديد
  unitLabel?: string;         // تسمية الوحدة لعمود العدد (مثل: ريموت، مفتاح، قطعة)
  unitPrice?: number;         // سعر الوحدة الاختياري لعمود العدد (إذا وُجد يُحسب العدد × السعر ضمن إجمالي المطلوب)
}

export interface SpecialTaskResidentRow {
  id: string;
  unitId: string;             // معرف الشقة من قائمة الشقق أو 'custom'
  unitNumber: string;         // رقم الشقة
  floor: number;              // رقم الدور
  residentName: string;       // اسم الساكن
  phone: string;              // رقم الهاتف
  values: Record<string, number>; // القيم المدخلة لكل عمود مخصص (columnId -> number)
  paidAmount: number;         // المبلغ المسدد فعلياً
  paymentMethod: PaymentMethod; // طريقة التحصيل المعتمدة
  paidAt?: string;            // تاريخ السداد YYYY-MM-DD
  transactionRef?: string;    // رقم المرجع أو التحويل
  syncedRevenueId?: string;   // معرف سند القبض الرسمي في حال ترحيله لخزينة العمارة
  notes?: string;             // ملاحظات الصف
}

export interface SpecialTaskProject {
  id: string;
  title: string;              // عنوان المهمة الخاصة أو التجميعة
  description?: string;       // تفاصيل المهمة والغرض منها
  categoryLabel: string;      // تصنيف المهمة (مثل: تحسينات وأمن، صيانة مشتركة، مستلزمات ومفاتيح)
  targetGroupLabel?: string;  // وصف المجموعة المستهدفة
  status: 'active' | 'completed' | 'archived';
  columns: SpecialTaskCustomColumn[];
  rows: SpecialTaskResidentRow[];
  createdAt: string;
  updatedAt: string;
}
