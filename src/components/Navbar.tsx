import React from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  calculateTotals,
  formatMoney,
  getCurrentMonthUnpaidUnits,
  buildSmartNotificationsFeed,
  AppDisplayMode,
  resolveAppDisplayModeConfig,
  resolveAppThemeConfig,
} from '../utils/finance';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Settings,
  Plus,
  Wallet,
  WifiOff,
  Layers,
  BellRing,
  Eye,
  Lock,
  ListChecks,
  Search,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddRevenue: () => void;
  onOpenAddExpense: () => void;
  onOpenSettings: () => void;
  onOpenFloorsDiagram: () => void;
  onOpenFloorsExcelSheet: () => void;
  onOpenSmartSearch?: () => void;
  onOpenSmartNotifications?: () => void;
  isOnline: boolean;
  displayMode: AppDisplayMode;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddRevenue,
  onOpenAddExpense,
  onOpenSettings,
  onOpenFloorsDiagram,
  onOpenFloorsExcelSheet,
  onOpenSmartSearch,
  onOpenSmartNotifications,
  isOnline,
  displayMode,
}) => {
  const {
    settings,
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    maintenanceNotes,
    quickTasks,
    specialTasks,
    selectedMonth,
    isReadOnly,
    setReadOnlyMode,
  } = useBuilding();
  const displayConfig = resolveAppDisplayModeConfig(displayMode);
  const isMobileMode = displayConfig.mode === 'mobile';
  const activeThemeConfig = resolveAppThemeConfig(settings.appTheme, settings.customAccentColor);

  const totals = calculateTotals(revenues, expenses, settings.emergencyFundBalance);
  const currentMonthLateUnits =
    settings.enableLateRentAlerts !== false
      ? getCurrentMonthUnpaidUnits(apartments, revenues, selectedMonth)
      : [];
  const pendingQuickTasksCount = quickTasks.filter(t => !t.completed).length;
  const activeSpecialTasksCount = specialTasks.filter(t => t.status === 'active').length;
  const smartSummary = buildSmartNotificationsFeed({
    apartments,
    revenues,
    expenses,
    recurringExpenses,
    maintenanceNotes,
    quickTasks,
    settings,
    selectedMonth,
  });

  const navItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badgeCount: currentMonthLateUnits.length > 0 ? currentMonthLateUnits.length : undefined,
    },
    {
      id: 'special_tasks',
      label: 'مهام خاصة',
      icon: Layers,
      badgeCount: activeSpecialTasksCount > 0 ? activeSpecialTasksCount : undefined,
    },
    {
      id: 'quick_hub',
      label: 'الملخصات والمهام السريعة',
      icon: ListChecks,
      badgeCount: pendingQuickTasksCount > 0 ? pendingQuickTasksCount : undefined,
    },
    { id: 'units', label: 'الشقق والسكان', icon: Users },
    { id: 'revenues', label: 'سجل الإيرادات', icon: Receipt },
    { id: 'expenses', label: 'سجل المصروفات', icon: CreditCard },
    { id: 'reports', label: 'التقارير والكشوفات', icon: FileSpreadsheet },
  ];

  return (
    <header
      data-testid="app-navbar-header"
      data-theme-id={activeThemeConfig.id}
      className={`no-print ${activeThemeConfig.navbarGradientClass} text-white border-b sticky top-0 z-40 shadow-md transition-colors duration-200`}
    >
      <div className={isMobileMode ? 'w-full px-3' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* Top Header Row */}
        <div
          className={`flex items-center justify-between gap-2 ${
            isMobileMode ? 'py-2.5 flex-wrap' : 'min-h-16 py-2 gap-3 flex-wrap'
          }`}
        >
          {/* Logo & Building Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onOpenSettings}
              title="اضغط لفتح قائمة الضبط وتغيير صورة أيقونة البرنامج أو الختم الرسمي"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center shadow-md overflow-hidden border border-white/15 shrink-0 cursor-pointer hover:opacity-90 transition"
            >
              <img
                data-testid="navbar-custom-app-icon"
                src={settings.appIconUrl || '/pwa-192x192.png'}
                alt={settings.buildingName}
                className="w-full h-full object-cover"
              />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-xs sm:text-base tracking-tight text-white flex items-center gap-1.5 truncate">
                <span
                  data-testid="navbar-app-name-badge"
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] sm:text-xs font-black shrink-0"
                >
                  حسن الجوار
                </span>
                <span className="truncate">{settings.buildingName}</span>
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    <span>وضع القراءة فقط</span>
                  </span>
                )}
              </h1>
              {!isMobileMode && (
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  تطبيق حسن الجوار لإدارة العمارة والمصروفات والتقارير المالية
                </p>
              )}
            </div>
          </div>

          {/* Right Action Controls: Smart Search, Live Treasury Balance, Quick Add & Settings Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Instant Smart Search Button (Ctrl+K) */}
            {onOpenSmartSearch && (
              <button
                type="button"
                data-testid="navbar-smart-search-btn"
                onClick={onOpenSmartSearch}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/95 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
                title="البحث الذكي الفوري في كل الشقق والإيصالات والمصروفات (Ctrl+K)"
                aria-label="البحث الذكي الفوري"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>بحث ذكي</span>
                {!isMobileMode && (
                  <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 text-[10px] font-mono">
                    Ctrl+K
                  </kbd>
                )}
              </button>
            )}

            {/* Smart Notifications Bell Button */}
            {onOpenSmartNotifications && (
              <button
                type="button"
                data-testid="navbar-smart-notifications-btn"
                onClick={onOpenSmartNotifications}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/90 hover:bg-indigo-900 text-amber-200 hover:text-white rounded-xl border border-amber-400/40 text-xs font-black transition cursor-pointer shadow-2xs"
                title="مركز الإشعارات الذكية الفورية (Smart Notifications)"
                aria-label="مركز الإشعارات الذكية"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>إشعارات ذكية</span>
                <span
                  data-testid="navbar-smart-notifications-badge"
                  className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black font-mono"
                >
                  {smartSummary.totalCount}
                </span>
              </button>
            )}

            {/* Live Vault Balance */}
            {!isMobileMode && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block leading-none">الخزينة:</span>
                  <span className="font-bold text-xs text-emerald-300 font-mono">
                    {formatMoney(totals.currentBalance, settings.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Offline Mode indicator */}
            {!isOnline && (
              <div
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold animate-pulse cursor-pointer"
                title="أنت تعمل الآن في وضع عدم الاتصال (Offline) - يتم حفظ البيانات على جهازك"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">أوفلاين</span>
              </div>
            )}

            {/* Building Floors Excel Sheet Icon Button */}
            <button
              type="button"
              data-testid="navbar-floors-excel-sheet-btn"
              onClick={onOpenFloorsExcelSheet}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-l from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition shadow-xs border border-amber-300/60 cursor-pointer"
              title="إخراج جدول الأدوار وأسماء وأرقام الشقق والمبالغ"
              aria-label="جدول الأدوار وأسماء وأرقام الشقق"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>جدول الأدوار والأسماء</span>
            </button>

            {/* Building Floors Diagram Icon Button */}
            <button
              onClick={onOpenFloorsDiagram}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs border border-indigo-400/30 cursor-pointer"
              title="رسم توضيحي لأدوار العمارة برقم الشقة ونماذج السكان"
              aria-label="رسم توضيحي لأدوار العمارة"
            >
              <Layers className="w-3.5 h-3.5" />
              {!isMobileMode && <span className="hidden md:inline">مخطط الأدوار</span>}
            </button>

            {/* Quick Add buttons (Hidden in Read-Only mode) */}
            {!isReadOnly ? (
              <>
                <button
                  onClick={onOpenAddRevenue}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="إصدار سند قبض جديد"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تحصيل قسط</span>
                </button>

                {!isMobileMode && (
                  <button
                    onClick={onOpenAddExpense}
                    className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="تسجيل سند صرف جديد"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل مصروف</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setReadOnlyMode(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="إلغاء وضع القراءة فقط وتفعيل صلاحيات التعديل"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>إلغاء القراءة فقط</span>
              </button>
            )}

            {/* Consolidated Settings Menu Button (قائمة الضبط) */}
            <button
              type="button"
              data-testid="navbar-settings-btn"
              onClick={onOpenSettings}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-black transition shadow-xs cursor-pointer"
              title="قائمة الضبط (إعدادات العمارة، طريقة العرض، تثبيت البرنامج، تحديثات ومعلومات الإصدار، المساعدة، والنسخ الاحتياطي)"
              aria-label="قائمة الضبط"
            >
              <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>قائمة الضبط</span>
              {settings.enableLateRentAlerts !== false && currentMonthLateUnits.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? activeThemeConfig.activeTabClass
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badgeCount !== undefined && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black font-mono"
                    title={`${item.badgeCount} تنبيهات نشطة`}
                  >
                    <BellRing className="w-2.5 h-2.5" />
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

