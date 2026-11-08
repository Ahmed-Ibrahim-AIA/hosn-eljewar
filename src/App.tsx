import React, { useState, useEffect } from 'react';
import { BuildingProvider, useBuilding } from './context/BuildingContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UnitsView } from './components/UnitsView';
import { RevenuesView } from './components/RevenuesView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView, ReportTabKey } from './components/ReportsView';
import { AddRevenueModal } from './components/AddRevenueModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ApartmentModal } from './components/ApartmentModal';
import { ApartmentDetailDrawer, ApartmentDrawerTab } from './components/ApartmentDetailDrawer';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { Apartment, Revenue, Expense } from './types';
import { usePWA } from './hooks/usePWA';
import { BuildingFloorsDiagram } from './components/BuildingFloorsDiagram';
import { LatePaymentPushNotification } from './components/LatePaymentPushNotification';
import { PreDueBrowserReminderBanner } from './components/PreDueBrowserReminderBanner';
import { StandaloneBuildingAppInstallModal } from './components/StandaloneBuildingAppInstaller';
import { BulkOverdueWhatsAppModal } from './components/BulkOverdueWhatsAppModal';
import { FloorsExcelSheetModal } from './components/FloorsExcelSheetModal';
import { QuickSummaryTasksView } from './components/QuickSummaryTasksView';
import { SpecialTasksView } from './components/SpecialTasksView';
import { SmartSearchModal } from './components/SmartSearchModal';
import { SmartNotificationCenterModal } from './components/SmartNotificationCenterModal';
import { ApkExportShareModal } from './components/ApkExportShareModal';
import {
  setupApkWebRuntimePolyfills,
  copyTextSafe,
  hasNativeApkBridge,
  areApkPermissionsApproved,
  requestAllApkPermissions,
} from './utils/apkBridge';
import {
  AppDisplayMode,
  resolveAppDisplayModeConfig,
  SettingsModalTabKey,
  resolveAppThemeConfig,
} from './utils/finance';
import {
  Eye,
  Lock,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  Plus,
  ListChecks,
  Settings,
} from 'lucide-react';

const DISPLAY_MODE_STORAGE_KEY = 'borj_elnoor_display_mode';

function MainApp() {
  const { apartments, deleteRevenue, settings, isReadOnly, setReadOnlyMode } = useBuilding();
  const {
    isInstallable,
    isInstalled,
    isServiceWorkerReady,
    isOnline,
    isUpdatingApp,
    updateRevision,
    lastUpdatedAt,
    installApp,
    updateInstalledApp,
  } = usePWA();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [reportsInitialTab, setReportsInitialTab] = useState<ReportTabKey>('financial_statement');
  const [unitsFilterPreset, setUnitsFilterPreset] = useState<string>('all');
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [revenueInitialUnitId, setRevenueInitialUnitId] = useState<string | undefined>(undefined);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsModalTabKey>('general');
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
  const [apartmentToEdit, setApartmentToEdit] = useState<Apartment | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitInitialTab, setSelectedUnitInitialTab] = useState<ApartmentDrawerTab>('finance');
  const [viewingReceipt, setViewingReceipt] = useState<Revenue | null>(null);
  const [isStandaloneInstallModalOpen, setIsStandaloneInstallModalOpen] = useState(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [isFloorsDiagramOpen, setIsFloorsDiagramOpen] = useState(false);
  const [isFloorsExcelSheetOpen, setIsFloorsExcelSheetOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [isSmartNotificationsOpen, setIsSmartNotificationsOpen] = useState(false);
  const [copiedReadOnlyUrl, setCopiedReadOnlyUrl] = useState(false);
  const [displayMode, setDisplayMode] = useState<AppDisplayMode>(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
      if (saved === 'mobile' || saved === 'desktop') return saved;
    } catch {
      // ignore storage errors
    }
    return 'desktop';
  });

  const handleChangeDisplayMode = (nextMode: AppDisplayMode) => {
    setDisplayMode(nextMode);
    try {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, nextMode);
    } catch {
      // ignore storage errors
    }
  };

  const displayConfig = resolveAppDisplayModeConfig(displayMode);
  const activeThemeConfig = resolveAppThemeConfig(settings.appTheme, settings.customAccentColor);

  // Active selected apartment for detail drawer
  const activeApartment = apartments.find(a => a.id === selectedUnitId) || null;

  // Initialize APK & Web runtime polyfills (clipboard, external WhatsApp/phone/email intents, and auto-request APK permissions)
  useEffect(() => {
    setupApkWebRuntimePolyfills();
    if (hasNativeApkBridge() && !areApkPermissionsApproved()) {
      void requestAllApkPermissions();
    }
  }, []);

  // Dynamically sync browser favicon & apple-touch-icon when user selects a custom Program Icon
  useEffect(() => {
    const iconHref = settings.appIconUrl || '/pwa-192x192.png';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    iconLinks.forEach(link => {
      link.href = iconHref;
    });
  }, [settings.appIconUrl]);

  // Global Ctrl+K / Cmd+K shortcut for Instant Smart Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSmartSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectUnit = (unitId: string, initialTab: ApartmentDrawerTab = 'finance') => {
    setSelectedUnitInitialTab(initialTab);
    setSelectedUnitId(unitId);
  };

  const handleOpenAddRevenue = (unitId?: string) => {
    if (isReadOnly) return;
    setEditingRevenue(null);
    setRevenueInitialUnitId(unitId);
    setIsAddRevenueOpen(true);
  };

  const handleOpenEditRevenue = (rev: Revenue) => {
    if (isReadOnly) return;
    setEditingRevenue(rev);
    setRevenueInitialUnitId(rev.unitId);
    setIsAddRevenueOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    if (isReadOnly) return;
    setEditingExpense(exp);
    setIsAddExpenseOpen(true);
  };

  const handleOpenSettings = (tab: SettingsModalTabKey = 'general') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  const handleNavigateToUnitsWithFilter = (filterKey = 'overdue_only') => {
    setUnitsFilterPreset(filterKey);
    setActiveTab('units');
  };

  const handleRevenueSuccess = (newRev: Revenue) => {
    const wasEditing = Boolean(editingRevenue);
    setIsAddRevenueOpen(false);
    setEditingRevenue(null);
    if (wasEditing) {
      if (viewingReceipt && viewingReceipt.id === newRev.id) {
        setViewingReceipt(newRev);
      }
    } else {
      setViewingReceipt(newRev); // Automatically show official receipt!
    }
  };

  const handleOpenAddUnit = () => {
    if (isReadOnly) return;
    setApartmentToEdit(null);
    setIsApartmentModalOpen(true);
  };

  const handleEditUnit = (apt: Apartment) => {
    if (isReadOnly) return;
    setApartmentToEdit(apt);
    setIsApartmentModalOpen(true);
  };

  const handleCopyReadOnlyShareLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'readonly');
      void copyTextSafe(url.toString());
      setCopiedReadOnlyUrl(true);
      setTimeout(() => setCopiedReadOnlyUrl(false), 3000);
    } catch {
      setCopiedReadOnlyUrl(true);
      setTimeout(() => setCopiedReadOnlyUrl(false), 3000);
    }
  };

  return (
    <div
      data-testid="app-root-shell"
      data-display-mode={displayConfig.mode}
      data-app-theme={activeThemeConfig.id}
      data-accent-color={activeThemeConfig.effectiveAccentHex}
      className={
        displayConfig.mode === 'mobile'
          ? 'min-h-screen bg-slate-900/95 py-0 sm:py-3 px-0 sm:px-2 selection:bg-emerald-500 selection:text-white'
          : `min-h-screen ${activeThemeConfig.shellBgClass} flex flex-col selection:bg-emerald-500 selection:text-white`
      }
    >
      <div
        data-app-theme={activeThemeConfig.id}
        className={`${displayConfig.rootWrapperClass} flex flex-col`}
      >
        {/* Top Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={tab => {
            if (tab === 'units') setUnitsFilterPreset('all');
            if (tab === 'reports') setReportsInitialTab('financial_statement');
            setActiveTab(tab);
          }}
          onOpenAddRevenue={() => handleOpenAddRevenue()}
          onOpenAddExpense={() => {
            if (!isReadOnly) {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }
          }}
          onOpenSettings={() => handleOpenSettings('general')}
          onOpenFloorsDiagram={() => setIsFloorsDiagramOpen(true)}
          onOpenFloorsExcelSheet={() => setIsFloorsExcelSheetOpen(true)}
          onOpenSmartSearch={() => setIsSmartSearchOpen(true)}
          onOpenSmartNotifications={() => setIsSmartNotificationsOpen(true)}
          isOnline={isOnline}
          displayMode={displayConfig.mode}
        />

        {/* Read-Only Mode Global Banner */}
        {isReadOnly && (
          <div
            role="status"
            aria-label="وضع القراءة فقط مفعل"
            className="no-print bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-400 text-slate-950 border-b border-amber-600/30 shadow-xs"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span className="p-1.5 rounded-lg bg-slate-950 text-amber-300 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <span>
                  وضع القراءة فقط (Read-only Mode) مُفعّل حالياً: يمكنك استعراض التقارير والكشوفات المالية فقط دون إمكانية إضافة أو تعديل أو حذف أي بيانات.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/15 hover:bg-slate-900/25 text-slate-950 font-black transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>التقارير المالية</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyReadOnlyShareLink}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold transition shadow-2xs"
                >
                  {copiedReadOnlyUrl ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم نسخ الرابط!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-600" />
                      <span>نسخ رابط المشاركة</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReadOnlyMode(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold transition shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>إيقاف وضع القراءة فقط</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <main className={displayConfig.mainContainerClass}>
          {activeTab !== 'dashboard' && activeTab !== 'quick_hub' && activeTab !== 'special_tasks' && (
            <>
              {/* 3-Day Pre-Due Browser Reminder Banner */}
              <PreDueBrowserReminderBanner
                onSelectUnit={(unitId, tab) => handleSelectUnit(unitId, tab)}
                onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
                onOpenSettings={() => handleOpenSettings('general')}
              />

              {/* Global Push Notification for Overdue Apartments on Secondary Pages */}
              <LatePaymentPushNotification
                activeTab={activeTab as 'dashboard' | 'units' | 'revenues' | 'expenses' | 'reports' | 'guide'}
                onSelectUnit={(unitId, tab) => handleSelectUnit(unitId, tab)}
                onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
                onNavigateToOverdueUnits={() => handleNavigateToUnitsWithFilter('overdue_only')}
                onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
              />
            </>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddRevenue={unitId => handleOpenAddRevenue(unitId)}
              onOpenAddExpense={() => {
                if (!isReadOnly) {
                  setEditingExpense(null);
                  setIsAddExpenseOpen(true);
                }
              }}
              onViewReceipt={rev => setViewingReceipt(rev)}
              onSelectUnit={(unitId, tab) => handleSelectUnit(unitId, tab)}
              onNavigateToTab={tab => setActiveTab(tab)}
              onNavigateToOverdueUnits={() => handleNavigateToUnitsWithFilter('overdue_only')}
              onOpenSettings={() => handleOpenSettings('general')}
              onOpenFloorsDiagram={() => setIsFloorsDiagramOpen(true)}
              onOpenFloorsExcelSheet={() => setIsFloorsExcelSheetOpen(true)}
              onOpenWhatsAppInvoice={() => {
                setReportsInitialTab('whatsapp_invoice_image');
                setActiveTab('reports');
              }}
              onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
              onEditRevenue={handleOpenEditRevenue}
              onEditExpense={handleOpenEditExpense}
            />
          )}

          {activeTab === 'special_tasks' && (
            <SpecialTasksView
              onViewReceipt={rev => setViewingReceipt(rev)}
              onSelectUnit={unitId => handleSelectUnit(unitId, 'finance')}
            />
          )}

          {activeTab === 'quick_hub' && (
            <QuickSummaryTasksView
              onOpenAddRevenue={unitId => handleOpenAddRevenue(unitId)}
              onOpenAddExpense={() => {
                if (!isReadOnly) {
                  setEditingExpense(null);
                  setIsAddExpenseOpen(true);
                }
              }}
              onOpenFloorsExcelSheet={() => setIsFloorsExcelSheetOpen(true)}
              onOpenFloorsDiagram={() => setIsFloorsDiagramOpen(true)}
              onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
              onOpenWhatsAppInvoice={() => {
                setReportsInitialTab('whatsapp_invoice_image');
                setActiveTab('reports');
              }}
              onSelectUnit={unitId => handleSelectUnit(unitId, 'finance')}
              onNavigateToTab={tab => setActiveTab(tab)}
            />
          )}

          {activeTab === 'units' && (
            <UnitsView
              initialFilter={unitsFilterPreset}
              onOpenAddUnit={handleOpenAddUnit}
              onEditUnit={handleEditUnit}
              onSelectUnit={(unitId, tab) => handleSelectUnit(unitId, tab)}
              onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
              onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
              onEditRevenue={handleOpenEditRevenue}
            />
          )}

          {activeTab === 'revenues' && (
            <RevenuesView
              onOpenAddRevenue={() => handleOpenAddRevenue()}
              onViewReceipt={rev => setViewingReceipt(rev)}
              onEditRevenue={handleOpenEditRevenue}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setIsAddExpenseOpen(true);
              }}
              onEditExpense={handleOpenEditExpense}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              initialReportTab={reportsInitialTab}
              onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
            />
          )}
        </main>

        {/* Modals & Drawers */}
        <SmartSearchModal
          isOpen={isSmartSearchOpen}
          onClose={() => setIsSmartSearchOpen(false)}
          onSelectUnit={(unitId, tab) => handleSelectUnit(unitId, tab || 'finance')}
          onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
          onViewReceipt={rev => setViewingReceipt(rev)}
          onNavigateToTab={tab => setActiveTab(tab)}
          onOpenFloorsExcelSheet={() => setIsFloorsExcelSheetOpen(true)}
          onOpenFloorsDiagram={() => setIsFloorsDiagramOpen(true)}
          onOpenSettings={() => handleOpenSettings('general')}
        />

        <SmartNotificationCenterModal
          isOpen={isSmartNotificationsOpen}
          onClose={() => setIsSmartNotificationsOpen(false)}
          onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
          onSelectUnit={unitId => handleSelectUnit(unitId, 'finance')}
          onOpenBulkWhatsApp={() => setIsBulkWhatsAppOpen(true)}
          onOpenFloorsExcelSheet={() => setIsFloorsExcelSheetOpen(true)}
          onNavigateToTab={tab => setActiveTab(tab)}
        />

        {isFloorsExcelSheetOpen && (
          <FloorsExcelSheetModal
            isOpen={isFloorsExcelSheetOpen}
            onClose={() => setIsFloorsExcelSheetOpen(false)}
            onSelectUnit={unitId => {
              setIsFloorsExcelSheetOpen(false);
              handleSelectUnit(unitId, 'finance');
            }}
          />
        )}

        {isFloorsDiagramOpen && (
          <BuildingFloorsDiagram
            isModal={true}
            onCloseModal={() => setIsFloorsDiagramOpen(false)}
            onSelectUnit={unitId => handleSelectUnit(unitId, 'finance')}
            onCollectPayment={unitId => handleOpenAddRevenue(unitId)}
          />
        )}

        {isAddRevenueOpen && (
          <AddRevenueModal
            initialUnitId={revenueInitialUnitId}
            editingRevenue={editingRevenue}
            onClose={() => {
              setIsAddRevenueOpen(false);
              setEditingRevenue(null);
            }}
            onSuccess={handleRevenueSuccess}
          />
        )}

        {isAddExpenseOpen && (
          <AddExpenseModal
            editingExpense={editingExpense}
            onClose={() => {
              setIsAddExpenseOpen(false);
              setEditingExpense(null);
            }}
            onSuccess={() => {
              setIsAddExpenseOpen(false);
              setEditingExpense(null);
            }}
          />
        )}

        {isApartmentModalOpen && (
          <ApartmentModal
            apartmentToEdit={apartmentToEdit}
            onClose={() => setIsApartmentModalOpen(false)}
          />
        )}

        {selectedUnitId && (
          <ApartmentDetailDrawer
            apartment={activeApartment}
            initialTab={selectedUnitInitialTab}
            onClose={() => setSelectedUnitId(null)}
            onEdit={apt => {
              setSelectedUnitId(null);
              handleEditUnit(apt);
            }}
            onCollectPayment={unitId => {
              setSelectedUnitId(null);
              handleOpenAddRevenue(unitId);
            }}
            onViewReceipt={rev => {
              setViewingReceipt(rev);
            }}
            onEditRevenue={rev => {
              handleOpenEditRevenue(rev);
            }}
          />
        )}

        {viewingReceipt && (
          <ReceiptModal
            revenue={viewingReceipt}
            settings={settings}
            onClose={() => setViewingReceipt(null)}
            onEditRevenue={rev => {
              handleOpenEditRevenue(rev);
            }}
            onDeleteRevenue={id => {
              deleteRevenue(id);
            }}
            isReadOnly={isReadOnly}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            initialTab={settingsInitialTab}
            onClose={() => setIsSettingsOpen(false)}
            displayMode={displayConfig.mode}
            onChangeDisplayMode={handleChangeDisplayMode}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isOnline={isOnline}
            isServiceWorkerReady={isServiceWorkerReady}
            isUpdatingApp={isUpdatingApp}
            updateRevision={updateRevision}
            lastUpdatedAt={lastUpdatedAt}
            onInstall={installApp}
            onUpdateApp={updateInstalledApp}
            onOpenStandaloneInstallModal={() => setIsStandaloneInstallModalOpen(true)}
          />
        )}

        {/* Dedicated Standalone Building App Installer Modal (opened from inside Settings) */}
        <StandaloneBuildingAppInstallModal
          isOpen={isStandaloneInstallModalOpen}
          onClose={() => setIsStandaloneInstallModalOpen(false)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstall={installApp}
          buildingName={settings.buildingName}
          appIconUrl={settings.appIconUrl}
          updateRevision={updateRevision}
        />

        {/* Bulk Overdue WhatsApp Dispatcher Modal (إرسال رسالة واتساب لكل المتأخرين بضغطة زر واحدة) */}
        <BulkOverdueWhatsAppModal
          isOpen={isBulkWhatsAppOpen}
          onClose={() => setIsBulkWhatsAppOpen(false)}
        />

        {/* Footer */}
        <footer
          className={`no-print mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 ${
            displayConfig.showMobileBottomNav ? 'pb-24' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} {settings.buildingName} - منظومة إدارة الخزينة والمصروفات السكنية</p>
            <button
              type="button"
              onClick={() => handleOpenSettings('general')}
              className="text-slate-700 hover:text-indigo-700 font-bold hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>قائمة الضبط والإعدادات الشاملة</span>
            </button>
          </div>
        </footer>

        {/* Dedicated Fixed Mobile Bottom Navigation Bar (شريط تنقل سفلي مخصص لنسخة الموبايل) */}
        {displayConfig.showMobileBottomNav && (
          <nav
            data-testid="mobile-bottom-nav"
            aria-label="شريط التنقل السفلي للموبايل"
            className="no-print fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50 bg-slate-900/98 backdrop-blur-md text-white border-t border-slate-700/80 px-2 py-1.5 shadow-2xl"
          >
            <div className="mobile-bottom-nav-grid grid grid-cols-5 items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnitsFilterPreset('all');
                  setActiveTab('units');
                }}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'units'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span>الشقق</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddRevenue()}
                disabled={isReadOnly}
                className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-[10px] font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mb-0.5" />
                <span>تحصيل قسط</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('special_tasks')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  activeTab === 'special_tasks'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-4 h-4 mb-0.5" />
                <span>مهام خاصة</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSettings('general')}
                className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Settings className="w-4 h-4 mb-0.5 text-indigo-400" />
                <span>الضبط</span>
              </button>
            </div>
          </nav>
        )}

        {/* Universal APK & Web Export, Share & Preview Hub Modal */}
        <ApkExportShareModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BuildingProvider>
      <MainApp />
    </BuildingProvider>
  );
}
