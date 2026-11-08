import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Apartment,
  PreviousTenantRecord,
  Revenue,
  Expense,
  BuildingSettings,
  RecurringExpense,
  MaintenanceNote,
  QuickTask,
  SpecialTaskProject,
} from '../types';
import {
  calculateNextPeriodicDate,
  createArchivedTenantRecord,
  canMutateFinancialData,
  normalizeImportedBackupData,
  applyRevenueUpdate,
  applyExpenseUpdate,
  applyQuickTaskUpdate,
  applyArchivedTenantUpdate,
} from '../utils/finance';
import { exportOrShareJsonBackup } from '../utils/apkBridge';
import { INITIAL_SPECIAL_TASKS } from '../utils/specialTasks';

import {
  DEFAULT_SETTINGS,
  INITIAL_APARTMENTS,
  INITIAL_REVENUES,
  INITIAL_EXPENSES,
  INITIAL_RECURRING_EXPENSES,
  INITIAL_MAINTENANCE_NOTES,
  INITIAL_QUICK_TASKS,
} from '../data/initialData';

export interface ArchiveCurrentTenantOptions {
  moveInDate?: string;
  moveOutDate: string;
  exitReason?: string;
  notes?: string;
  nextResidentMode: 'new_tenant' | 'owner_return' | 'vacant';
  nextResidentName?: string;
  nextResidentPhone?: string;
  nextResidentEmail?: string;
  nextResidentNationalId?: string;
  nextMonthlyFee?: number;
  nextMoveInDate?: string;
}

interface BuildingContextType {
  settings: BuildingSettings;
  isReadOnly: boolean;
  setReadOnlyMode: (enabled: boolean) => void;
  updateSettings: (newSettings: Partial<BuildingSettings>) => void;
  apartments: Apartment[];
  addApartment: (apt: Omit<Apartment, 'id' | 'createdAt'>) => void;
  updateApartment: (id: string, apt: Partial<Apartment>) => void;
  deleteApartment: (id: string) => void;
  archiveCurrentTenant: (
    apartmentId: string,
    options: ArchiveCurrentTenantOptions
  ) => PreviousTenantRecord | null;
  addHistoricalTenantRecord: (
    apartmentId: string,
    record: Omit<PreviousTenantRecord, 'id' | 'archivedAt'>
  ) => void;
  updateArchivedTenantRecord: (
    apartmentId: string,
    recordId: string,
    updates: Partial<PreviousTenantRecord>
  ) => void;
  deleteArchivedTenantRecord: (apartmentId: string, recordId: string) => void;
  revenues: Revenue[];
  addRevenue: (rev: Omit<Revenue, 'id' | 'createdAt'>) => Revenue;
  updateRevenue: (id: string, updates: Partial<Revenue>) => void;
  deleteRevenue: (id: string) => void;
  markReceiptEmailSent: (revenueId: string, recipientEmail: string) => void;
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (rec: Omit<RecurringExpense, 'id' | 'createdAt'>) => RecurringExpense;
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  toggleRecurringExpenseActive: (id: string) => void;
  generateMonthlyRecurringExpenses: (targetMonth: string) => {
    generatedCount: number;
    skippedCount: number;
    newExpenses: Expense[];
  };
  maintenanceNotes: MaintenanceNote[];
  addMaintenanceNote: (note: Omit<MaintenanceNote, 'id' | 'createdAt'>) => MaintenanceNote;
  updateMaintenanceNote: (id: string, updates: Partial<MaintenanceNote>) => void;
  deleteMaintenanceNote: (id: string) => void;
  toggleMaintenanceStatus: (id: string) => void;
  advancePeriodicMaintenance: (id: string) => void;
  quickTasks: QuickTask[];
  addQuickTask: (text: string, priority?: 'normal' | 'high') => QuickTask;
  updateQuickTask: (id: string, updates: Partial<QuickTask>) => void;
  toggleQuickTask: (id: string) => void;
  deleteQuickTask: (id: string) => void;
  clearCompletedQuickTasks: () => void;
  specialTasks: SpecialTaskProject[];
  addSpecialTask: (
    task: Omit<SpecialTaskProject, 'id' | 'createdAt' | 'updatedAt'>
  ) => SpecialTaskProject;
  updateSpecialTask: (id: string, updates: Partial<SpecialTaskProject>) => void;
  deleteSpecialTask: (id: string) => void;
  duplicateSpecialTask: (id: string) => SpecialTaskProject | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  exportBackup: () => void;
  importBackup: (jsonContent: string) => { success: boolean; message: string };
  resetToDefault: () => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'building_mgmt_settings_v2',
  APARTMENTS: 'building_mgmt_apartments_v2',
  REVENUES: 'building_mgmt_revenues_v2',
  EXPENSES: 'building_mgmt_expenses_v2',
  RECURRING_EXPENSES: 'building_mgmt_recurring_expenses_v2',
  MAINTENANCE_NOTES: 'building_mgmt_maintenance_notes_v2',
  QUICK_TASKS: 'building_mgmt_quick_tasks_v2',
  SPECIAL_TASKS: 'building_mgmt_special_tasks_v2',
};


const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export const BuildingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BuildingSettings>(() => {
    let urlReadOnly = false;
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'readonly' || params.get('readonly') === '1' || params.get('readonly') === 'true') {
          urlReadOnly = true;
        }
      }
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          appIconUrl: parsed.appIconUrl || DEFAULT_SETTINGS.appIconUrl || '/pwa-192x192.png',
          enableLateRentAlerts: parsed.enableLateRentAlerts ?? DEFAULT_SETTINGS.enableLateRentAlerts ?? true,
          lateRentAlertDay: parsed.lateRentAlertDay ?? DEFAULT_SETTINGS.lateRentAlertDay ?? 10,
          enablePreDueBrowserReminder: parsed.enablePreDueBrowserReminder ?? DEFAULT_SETTINGS.enablePreDueBrowserReminder ?? true,
          preDueReminderDays: parsed.preDueReminderDays ?? DEFAULT_SETTINGS.preDueReminderDays ?? 3,
          enableEmailNotifications: parsed.enableEmailNotifications ?? DEFAULT_SETTINGS.enableEmailNotifications ?? true,
          enableSmartNotifications: parsed.enableSmartNotifications ?? DEFAULT_SETTINGS.enableSmartNotifications ?? true,
          smartNotificationOnLaunch: parsed.smartNotificationOnLaunch ?? DEFAULT_SETTINGS.smartNotificationOnLaunch ?? true,
          smartNotificationSound: parsed.smartNotificationSound ?? DEFAULT_SETTINGS.smartNotificationSound ?? true,
          treasurerEmail: parsed.treasurerEmail ?? DEFAULT_SETTINGS.treasurerEmail,
          readOnlyMode: urlReadOnly ? true : Boolean(parsed.readOnlyMode),
        };
      }
      return {
        ...DEFAULT_SETTINGS,
        readOnlyMode: urlReadOnly ? true : Boolean(DEFAULT_SETTINGS.readOnlyMode),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const isReadOnly = !canMutateFinancialData(settings);

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APARTMENTS);
      if (saved) {
        const parsed: Apartment[] = JSON.parse(saved);
        // Backfill email, avatarIcon, avatarColor, moveInDate, and previousTenants from INITIAL_APARTMENTS if missing
        return parsed.map(apt => {
          const initialMatch = INITIAL_APARTMENTS.find(ia => ia.id === apt.id);
          return {
            ...apt,
            email: apt.email ?? initialMatch?.email ?? '',
            avatarIcon: apt.avatarIcon || initialMatch?.avatarIcon || (apt.residentType === 'owner' ? 'crown' : 'key'),
            avatarColor: apt.avatarColor || initialMatch?.avatarColor || (apt.residentType === 'owner' ? 'emerald' : 'amber'),
            moveInDate: apt.moveInDate || initialMatch?.moveInDate || '2026-01-01',
            previousTenants: Array.isArray(apt.previousTenants)
              ? apt.previousTenants
              : initialMatch?.previousTenants || [],
          };
        });
      }
      return INITIAL_APARTMENTS;
    } catch {
      return INITIAL_APARTMENTS;
    }
  });

  const [revenues, setRevenues] = useState<Revenue[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVENUES);
      return saved ? JSON.parse(saved) : INITIAL_REVENUES;
    } catch {
      return INITIAL_REVENUES;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING_EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_RECURRING_EXPENSES;
    } catch {
      return INITIAL_RECURRING_EXPENSES;
    }
  });

  const [maintenanceNotes, setMaintenanceNotes] = useState<MaintenanceNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_NOTES);
      if (saved) {
        const parsed: MaintenanceNote[] = JSON.parse(saved);
        // Ensure periodic scheduled seeds exist if upgrading from earlier schema
        const existingIds = new Set(parsed.map(n => n.id));
        const missingInitial = INITIAL_MAINTENANCE_NOTES.filter(n => !existingIds.has(n.id) && n.isPeriodic);
        const enriched = parsed.map(n => {
          const initMatch = INITIAL_MAINTENANCE_NOTES.find(im => im.id === n.id);
          return {
            ...n,
            scheduledDate: n.scheduledDate ?? initMatch?.scheduledDate,
            isPeriodic: n.isPeriodic ?? initMatch?.isPeriodic,
            recurrenceInterval: n.recurrenceInterval ?? initMatch?.recurrenceInterval,
          };
        });
        return [...enriched, ...missingInitial];
      }
      return INITIAL_MAINTENANCE_NOTES;
    } catch {
      return INITIAL_MAINTENANCE_NOTES;
    }
  });

  const [quickTasks, setQuickTasks] = useState<QuickTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUICK_TASKS);
      return saved ? JSON.parse(saved) : INITIAL_QUICK_TASKS;
    } catch {
      return INITIAL_QUICK_TASKS;
    }
  });

  const [specialTasks, setSpecialTasks] = useState<SpecialTaskProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPECIAL_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_SPECIAL_TASKS;
    } catch {
      return INITIAL_SPECIAL_TASKS;
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APARTMENTS, JSON.stringify(apartments));
    } catch (e) {
      console.error('Failed to save apartments to localStorage', e);
    }
  }, [apartments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(revenues));
    } catch (e) {
      console.error('Failed to save revenues to localStorage', e);
    }
  }, [revenues]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECURRING_EXPENSES, JSON.stringify(recurringExpenses));
    } catch (e) {
      console.error('Failed to save recurring expenses to localStorage', e);
    }
  }, [recurringExpenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE_NOTES, JSON.stringify(maintenanceNotes));
    } catch (e) {
      console.error('Failed to save maintenance notes to localStorage', e);
    }
  }, [maintenanceNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_TASKS, JSON.stringify(quickTasks));
    } catch (e) {
      console.error('Failed to save quick tasks to localStorage', e);
    }
  }, [quickTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPECIAL_TASKS, JSON.stringify(specialTasks));
    } catch (e) {
      console.error('Failed to save special tasks to localStorage', e);
    }
  }, [specialTasks]);


  const updateSettings = (newSettings: Partial<BuildingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const setReadOnlyMode = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, readOnlyMode: enabled }));
  };

  const addApartment = (apt: Omit<Apartment, 'id' | 'createdAt'>) => {
    if (isReadOnly) return;
    const newApt: Apartment = {
      ...apt,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setApartments(prev => [...prev, newApt].sort((a, b) => Number(a.number) - Number(b.number)));
  };

  const updateApartment = (id: string, aptUpdates: Partial<Apartment>) => {
    if (isReadOnly) return;
    setApartments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, ...aptUpdates } : apt))
    );
  };

  const deleteApartment = (id: string) => {
    if (isReadOnly) return;
    setApartments(prev => prev.filter(apt => apt.id !== id));
  };

  const archiveCurrentTenant = (
    apartmentId: string,
    options: ArchiveCurrentTenantOptions
  ): PreviousTenantRecord | null => {
    if (isReadOnly) return null;
    const targetApt = apartments.find(a => a.id === apartmentId);
    if (!targetApt) return null;

    const archivedRecord = createArchivedTenantRecord(targetApt, revenues, {
      moveInDate: options.moveInDate,
      moveOutDate: options.moveOutDate,
      exitReason: options.exitReason,
      notes: options.notes,
    });

    setApartments(prev =>
      prev.map(apt => {
        if (apt.id !== apartmentId) return apt;
        const existingHistory = Array.isArray(apt.previousTenants) ? apt.previousTenants : [];
        const updatedHistory = [archivedRecord, ...existingHistory];

        if (options.nextResidentMode === 'new_tenant') {
          return {
            ...apt,
            residentName: options.nextResidentName?.trim() || 'مستأجر جديد',
            residentType: 'tenant',
            phone: options.nextResidentPhone?.trim() || '',
            email: options.nextResidentEmail?.trim() || '',
            nationalId: options.nextResidentNationalId?.trim() || undefined,
            monthlyFee:
              options.nextMonthlyFee !== undefined ? Number(options.nextMonthlyFee) : apt.monthlyFee,
            moveInDate: options.nextMoveInDate || options.moveOutDate,
            isVacant: false,
            previousTenants: updatedHistory,
          };
        }

        if (options.nextResidentMode === 'vacant') {
          return {
            ...apt,
            residentName: options.nextResidentName?.trim() || `وحدة شاغرة (شقة ${apt.number})`,
            residentType: 'owner',
            phone: options.nextResidentPhone?.trim() || apt.phone,
            email: options.nextResidentEmail?.trim() || apt.email,
            moveInDate: options.nextMoveInDate || options.moveOutDate,
            isVacant: true,
            previousTenants: updatedHistory,
          };
        }

        // owner_return
        return {
          ...apt,
          residentName: options.nextResidentName?.trim() || `مالك شقة (${apt.number})`,
          residentType: 'owner',
          phone: options.nextResidentPhone?.trim() || apt.phone,
          email: options.nextResidentEmail?.trim() || apt.email,
          nationalId: options.nextResidentNationalId?.trim() || undefined,
          monthlyFee:
            options.nextMonthlyFee !== undefined ? Number(options.nextMonthlyFee) : apt.monthlyFee,
          moveInDate: options.nextMoveInDate || options.moveOutDate,
          isVacant: false,
          previousTenants: updatedHistory,
        };
      })
    );

    return archivedRecord;
  };

  const addHistoricalTenantRecord = (
    apartmentId: string,
    record: Omit<PreviousTenantRecord, 'id' | 'archivedAt'>
  ) => {
    if (isReadOnly) return;
    const newRecord: PreviousTenantRecord = {
      ...record,
      id: `prev-${apartmentId}-${Date.now()}`,
      archivedAt: new Date().toISOString().split('T')[0],
    };
    setApartments(prev =>
      prev.map(apt =>
        apt.id === apartmentId
          ? {
              ...apt,
              previousTenants: [newRecord, ...(apt.previousTenants || [])],
            }
          : apt
      )
    );
  };

  const updateArchivedTenantRecord = (
    apartmentId: string,
    recordId: string,
    updates: Partial<PreviousTenantRecord>
  ) => {
    if (isReadOnly) return;
    setApartments(prev => applyArchivedTenantUpdate(prev, apartmentId, recordId, updates));
  };

  const deleteArchivedTenantRecord = (apartmentId: string, recordId: string) => {
    if (isReadOnly) return;
    setApartments(prev =>
      prev.map(apt =>
        apt.id === apartmentId
          ? {
              ...apt,
              previousTenants: (apt.previousTenants || []).filter(r => r.id !== recordId),
            }
          : apt
      )
    );
  };

  const addRevenue = (rev: Omit<Revenue, 'id' | 'createdAt'>): Revenue => {
    const newRev: Revenue = {
      ...rev,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (isReadOnly) return newRev;
    setRevenues(prev => [newRev, ...prev]);
    return newRev;
  };

  const updateRevenue = (id: string, updates: Partial<Revenue>) => {
    if (isReadOnly) return;
    setRevenues(prev => applyRevenueUpdate(prev, apartments, id, updates));
  };

  const deleteRevenue = (id: string) => {
    if (isReadOnly) return;
    setRevenues(prev => prev.filter(r => r.id !== id));
  };

  const markReceiptEmailSent = (revenueId: string, recipientEmail: string) => {
    const nowStr = new Date().toISOString();
    setRevenues(prev =>
      prev.map(r =>
        r.id === revenueId
          ? { ...r, emailSentAt: nowStr, recipientEmail }
          : r
      )
    );
  };

  const addExpense = (exp: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (isReadOnly) return newExp;
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    if (isReadOnly) return;
    setExpenses(prev => applyExpenseUpdate(prev, id, updates));
  };

  const deleteExpense = (id: string) => {
    if (isReadOnly) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addRecurringExpense = (rec: Omit<RecurringExpense, 'id' | 'createdAt'>): RecurringExpense => {
    const newRec: RecurringExpense = {
      ...rec,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (isReadOnly) return newRec;
    setRecurringExpenses(prev => [...prev, newRec]);
    return newRec;
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    if (isReadOnly) return;
    setRecurringExpenses(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecurringExpense = (id: string) => {
    if (isReadOnly) return;
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const toggleRecurringExpenseActive = (id: string) => {
    if (isReadOnly) return;
    setRecurringExpenses(prev =>
      prev.map(r => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const generateMonthlyRecurringExpenses = (targetMonth: string) => {
    if (isReadOnly) {
      return { generatedCount: 0, skippedCount: 0, newExpenses: [] };
    }
    const activeTemplates = recurringExpenses.filter(r => r.isActive);
    const newVouchers: Expense[] = [];
    let generatedCount = 0;
    let skippedCount = 0;

    activeTemplates.forEach((template, idx) => {
      // Check if an expense with matching title or prefix exists for targetMonth
      const alreadyExists = expenses.some(
        e => e.date.startsWith(targetMonth) && (
          e.title.includes(template.title) || 
          (e.category === template.category && e.paidTo === template.paidTo)
        )
      );

      if (alreadyExists) {
        skippedCount++;
        return;
      }

      const dayStr = String(Math.min(28, Math.max(1, template.billingDay))).padStart(2, '0');
      const voucherNum = `EXP-${targetMonth.replace('-', '')}-${String(100 + idx + 1)}`;
      const newExp: Expense = {
        id: `exp-rec-${targetMonth}-${template.id}-${Date.now()}`,
        voucherNumber: voucherNum,
        category: template.category,
        title: `${template.title} (عن شهر ${targetMonth})`,
        amount: template.amount,
        date: `${targetMonth}-${dayStr}`,
        paidTo: template.paidTo,
        paymentMethod: template.paymentMethod,
        notes: `مصروف شهري متكرر مضاف تلقائياً: ${template.notes || ''}`,
        createdAt: new Date().toISOString(),
      };

      newVouchers.push(newExp);
      generatedCount++;
    });

    if (newVouchers.length > 0) {
      setExpenses(prev => [...newVouchers, ...prev]);
      setRecurringExpenses(prev =>
        prev.map(r => (r.isActive ? { ...r, lastGeneratedMonth: targetMonth } : r))
      );
    }

    return {
      generatedCount,
      skippedCount,
      newExpenses: newVouchers,
    };
  };

  const addMaintenanceNote = (note: Omit<MaintenanceNote, 'id' | 'createdAt'>): MaintenanceNote => {
    const newNote: MaintenanceNote = {
      ...note,
      id: `maint-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (isReadOnly) return newNote;
    setMaintenanceNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateMaintenanceNote = (id: string, updates: Partial<MaintenanceNote>) => {
    if (isReadOnly) return;
    setMaintenanceNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const deleteMaintenanceNote = (id: string) => {
    if (isReadOnly) return;
    setMaintenanceNotes(prev => prev.filter(n => n.id !== id));
  };

  const toggleMaintenanceStatus = (id: string) => {
    if (isReadOnly) return;
    setMaintenanceNotes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        let nextStatus: MaintenanceNote['status'] = 'pending';
        let resolvedAt: string | undefined = undefined;
        if (n.status === 'pending') {
          nextStatus = 'in_progress';
        } else if (n.status === 'in_progress') {
          nextStatus = 'resolved';
          resolvedAt = new Date().toISOString().split('T')[0];
        } else {
          nextStatus = 'pending';
          resolvedAt = undefined;
        }
        return { ...n, status: nextStatus, resolvedAt };
      })
    );
  };

  const advancePeriodicMaintenance = (id: string) => {
    if (isReadOnly) return;
    setMaintenanceNotes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        if (n.isPeriodic) {
          const baseDate = n.scheduledDate || new Date().toISOString().split('T')[0];
          const nextDate = calculateNextPeriodicDate(baseDate, n.recurrenceInterval || 'monthly');
          return {
            ...n,
            scheduledDate: nextDate,
            status: 'pending',
            resolvedAt: new Date().toISOString().split('T')[0],
          };
        }
        return {
          ...n,
          status: 'resolved',
          resolvedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addQuickTask = (text: string, priority: 'normal' | 'high' = 'normal'): QuickTask => {
    const newTask: QuickTask = {
      id: `qt-${Date.now()}`,
      text: text.trim(),
      completed: false,
      priority,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (isReadOnly) return newTask;
    setQuickTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateQuickTask = (id: string, updates: Partial<QuickTask>) => {
    if (isReadOnly) return;
    setQuickTasks(prev => applyQuickTaskUpdate(prev, id, updates));
  };

  const toggleQuickTask = (id: string) => {
    if (isReadOnly) return;
    setQuickTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteQuickTask = (id: string) => {
    if (isReadOnly) return;
    setQuickTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompletedQuickTasks = () => {
    if (isReadOnly) return;
    setQuickTasks(prev => prev.filter(t => !t.completed));
  };

  const addSpecialTask = (
    task: Omit<SpecialTaskProject, 'id' | 'createdAt' | 'updatedAt'>
  ): SpecialTaskProject => {
    const today = new Date().toISOString().split('T')[0];
    const newTask: SpecialTaskProject = {
      ...task,
      id: `sp-task-${Date.now()}`,
      createdAt: today,
      updatedAt: today,
    };
    if (isReadOnly) return newTask;
    setSpecialTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateSpecialTask = (id: string, updates: Partial<SpecialTaskProject>) => {
    if (isReadOnly) return;
    const today = new Date().toISOString().split('T')[0];
    setSpecialTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: today } : t))
    );
  };

  const deleteSpecialTask = (id: string) => {
    if (isReadOnly) return;
    setSpecialTasks(prev => prev.filter(t => t.id !== id));
  };

  const duplicateSpecialTask = (id: string): SpecialTaskProject | null => {
    if (isReadOnly) return null;
    const target = specialTasks.find(t => t.id === id);
    if (!target) return null;
    const today = new Date().toISOString().split('T')[0];
    const cloned: SpecialTaskProject = {
      ...target,
      id: `sp-task-${Date.now()}`,
      title: `${target.title} (نسخة)`,
      rows: target.rows.map((r, idx) => ({
        ...r,
        id: `sprow-dup-${Date.now()}-${idx}`,
        paidAmount: 0,
        paidAt: undefined,
        syncedRevenueId: undefined,
      })),
      createdAt: today,
      updatedAt: today,
    };
    setSpecialTasks(prev => [cloned, ...prev]);
    return cloned;
  };

  const exportBackup = () => {
    const data = {
      exportDate: new Date().toISOString(),
      app: 'BuildingFinanceApp',
      version: '1.0',
      settings,
      apartments,
      revenues,
      expenses,
      recurringExpenses,
      maintenanceNotes,
      quickTasks,
      specialTasks,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const filename = `building_backup_${new Date().toISOString().split('T')[0]}.json`;
    exportOrShareJsonBackup(jsonStr, filename, true);
  };

  const importBackup = (jsonContent: string) => {
    if (isReadOnly) {
      return { success: false, message: 'وضع القراءة فقط مفعل حالياً، لا يمكن استيراد أو تعديل البيانات المالية.' };
    }
    try {
      const parsed = JSON.parse(jsonContent);
      const normalized = normalizeImportedBackupData(parsed);
      let aptCount = 0;
      let revCount = 0;
      let expCount = 0;
      let recCount = 0;
      let maintCount = 0;

      if (normalized.settings && typeof normalized.settings === 'object') {
        setSettings(prev => ({ ...prev, ...normalized.settings }));
      }
      if (Array.isArray(normalized.apartments)) {
        setApartments(normalized.apartments);
        aptCount = normalized.apartments.length;
      }
      if (Array.isArray(normalized.revenues)) {
        setRevenues(normalized.revenues);
        revCount = normalized.revenues.length;
      }
      if (Array.isArray(normalized.expenses)) {
        setExpenses(normalized.expenses);
        expCount = normalized.expenses.length;
      }
      if (Array.isArray(normalized.recurringExpenses)) {
        setRecurringExpenses(normalized.recurringExpenses);
        recCount = normalized.recurringExpenses.length;
      }
      if (Array.isArray(normalized.maintenanceNotes)) {
        setMaintenanceNotes(normalized.maintenanceNotes);
        maintCount = normalized.maintenanceNotes.length;
      }
      if (Array.isArray(normalized.quickTasks)) {
        setQuickTasks(normalized.quickTasks);
      }
      if (Array.isArray(parsed.specialTasks)) {
        setSpecialTasks(parsed.specialTasks);
      }

      return {
        success: true,
        message: `تمت استعادة قاعدة البيانات بنجاح! (${aptCount} شقة، ${revCount} سند قبض، ${expCount} سند صرف، ${recCount} مصروف متكرر، ${maintCount} ملاحظة صيانة)`,
      };
    } catch {
      return { success: false, message: 'الملف غير صالح أو به خطأ في التنسيق البرمجي (JSON).' };
    }
  };

  const resetToDefault = () => {
    if (isReadOnly) return;
    setSettings(DEFAULT_SETTINGS);
    setApartments(INITIAL_APARTMENTS);
    setRevenues(INITIAL_REVENUES);
    setExpenses(INITIAL_EXPENSES);
    setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
    setMaintenanceNotes(INITIAL_MAINTENANCE_NOTES);
    setQuickTasks(INITIAL_QUICK_TASKS);
    setSpecialTasks(INITIAL_SPECIAL_TASKS);
    setSelectedMonth('2026-10');
  };

  return (
    <BuildingContext.Provider
      value={{
        settings,
        isReadOnly,
        setReadOnlyMode,
        updateSettings,
        apartments,
        addApartment,
        updateApartment,
        deleteApartment,
        archiveCurrentTenant,
        addHistoricalTenantRecord,
        updateArchivedTenantRecord,
        deleteArchivedTenantRecord,
        revenues,
        addRevenue,
        updateRevenue,
        deleteRevenue,
        markReceiptEmailSent,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        recurringExpenses,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        toggleRecurringExpenseActive,
        generateMonthlyRecurringExpenses,
        maintenanceNotes,
        addMaintenanceNote,
        updateMaintenanceNote,
        deleteMaintenanceNote,
        toggleMaintenanceStatus,
        advancePeriodicMaintenance,
        quickTasks,
        addQuickTask,
        updateQuickTask,
        toggleQuickTask,
        deleteQuickTask,
        clearCompletedQuickTasks,
        specialTasks,
        addSpecialTask,
        updateSpecialTask,
        deleteSpecialTask,
        duplicateSpecialTask,
        selectedMonth,
        setSelectedMonth,
        exportBackup,
        importBackup,
        resetToDefault,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
};

export function useBuilding() {
  const context = useContext(BuildingContext);
  if (!context) {
    throw new Error('useBuilding must be used within a BuildingProvider');
  }
  return context;
}
