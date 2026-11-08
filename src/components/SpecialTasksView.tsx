import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  PaymentMethod,
  Revenue,
  SpecialTaskColumnType,
  SpecialTaskCustomColumn,
  SpecialTaskProject,
  SpecialTaskResidentRow,
} from '../types';
import {
  formatMoney,
  INSTAPAY_PAYMENT_URL,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';
import {
  SPECIAL_TASK_SMART_TEMPLATES,
  SpecialTaskTemplatePreset,
  calculateSpecialTaskAnalytics,
  computeSpecialTaskRowSummary,
  createResidentRowFromApartment,
  distributeAmountAcrossSpecialTaskRows,
  buildSpecialTaskRowWhatsAppMessage,
  buildSpecialTaskFullWrittenReport,
  buildSpecialTaskSpreadsheetMatrix,
  renderSpecialTaskVisualCardDataUrl,
} from '../utils/specialTasks';
import {
  exportOrSharePngImage,
  openExternalUrlOrWhatsApp,
  copyTextSafe,
  exportOrShareExcelFile,
  generateAllExcelFormatPayloads,
  convertWhatsAppUrlForApk,
  base64ToUint8Array,
} from '../utils/apkBridge';
import {
  ExportScaleMultiplier,
  transformAndOptimizeImage,
} from '../services/fileMediaManager';
import { useFileMediaManager } from '../hooks/useFileMediaManager';
import { UnifiedExportSplitButton } from './UnifiedExportSplitButton';
import {
  Plus,
  Trash2,
  Users,
  Columns3,
  Calculator,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  FileSpreadsheet,
  Copy,
  Check,
  Receipt,
  Layers,
  CreditCard,
  Search,
  CopyPlus,
  Edit3,
  X,
  Share2,
} from 'lucide-react';

interface SpecialTasksViewProps {
  onViewReceipt?: (revenue: Revenue) => void;
  onSelectUnit?: (unitId: string) => void;
}

export const SpecialTasksView: React.FC<SpecialTasksViewProps> = ({
  onViewReceipt,
}) => {
  const {
    apartments,
    settings,
    isReadOnly,
    specialTasks,
    addSpecialTask,
    updateSpecialTask,
    deleteSpecialTask,
    duplicateSpecialTask,
    addRevenue,
  } = useBuilding();

  const mediaManager = useFileMediaManager();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    () => specialTasks[0]?.id || ''
  );
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modals / Panels state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('مهمة وتجميعة خاصة');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-cameras-remotes');

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColType, setNewColType] = useState<SpecialTaskColumnType>('money');
  const [newColDefaultVal, setNewColDefaultVal] = useState<number>(200);
  const [newColUnitLabel, setNewColUnitLabel] = useState<string>('قطعة');
  const [newColUnitPrice, setNewColUnitPrice] = useState<number>(0);

  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [editColDefaultVal, setEditColDefaultVal] = useState<number>(0);
  const [editColUnitLabel, setEditColUnitLabel] = useState('');
  const [editColUnitPrice, setEditColUnitPrice] = useState<number>(0);

  const [isMultiResidentPickerOpen, setIsMultiResidentPickerOpen] = useState(false);
  const [pickedUnitIds, setPickedUnitIds] = useState<string[]>([]);
  const [pickerFloorFilter, setPickerFloorFilter] = useState<string>('all');

  const [isSplitToolOpen, setIsSplitToolOpen] = useState(false);
  const [splitTargetColId, setSplitTargetColId] = useState<string>('');
  const [splitTotalAmount, setSplitTotalAmount] = useState<number>(3000);

  const [isWrittenReportPreviewOpen, setIsWrittenReportPreviewOpen] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [copiedReportFlag, setCopiedReportFlag] = useState(false);
  const [copiedInstaPayFlag, setCopiedInstaPayFlag] = useState(false);
  const [isEditingTaskMeta, setIsEditingTaskMeta] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

  const activeTask: SpecialTaskProject | null = useMemo(() => {
    if (specialTasks.length === 0) return null;
    return specialTasks.find(t => t.id === selectedTaskId) || specialTasks[0];
  }, [specialTasks, selectedTaskId]);

  const analytics = useMemo(() => {
    if (!activeTask) return null;
    return calculateSpecialTaskAnalytics(activeTask);
  }, [activeTask]);

  const showBanner = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => {
      setActionBanner(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    if (!activeTask || !analytics) return [];
    return activeTask.rows.filter(row => {
      const summary = analytics.rowSummaries[row.id];
      if (statusFilter !== 'all' && summary?.status !== statusFilter) {
        return false;
      }
      if (rowSearchQuery.trim()) {
        const q = rowSearchQuery.trim().toLowerCase();
        const hay = `${row.residentName} شقة ${row.unitNumber} الدور ${row.floor} ${row.phone || ''} ${row.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeTask, analytics, statusFilter, rowSearchQuery]);

  // Distinct floors for resident picker
  const buildingFloors = useMemo(() => {
    const set = new Set<number>();
    apartments.forEach(a => set.add(a.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [apartments]);

  // Handlers for Task Management
  const handleCreateTaskFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const tpl: SpecialTaskTemplatePreset | undefined =
      SPECIAL_TASK_SMART_TEMPLATES.find(t => t.id === selectedTemplateId);

    const title =
      newTaskTitle.trim() ||
      tpl?.title ||
      'مهمة خاصة جديدة لتجميع مصروفات السكان';

    const columns: SpecialTaskCustomColumn[] = tpl
      ? tpl.columns.map((c, idx) => ({
          ...c,
          id: `col-${Date.now()}-${idx}`,
        }))
      : [
          {
            id: `col-${Date.now()}-1`,
            title: 'المبلغ الأساسي المطلوب',
            type: 'money',
            defaultValue: 250,
          },
          {
            id: `col-${Date.now()}-2`,
            title: 'العدد المطلوب',
            type: 'count',
            defaultValue: 1,
            unitLabel: 'وحدة',
            unitPrice: 100,
          },
        ];

    // Pre-populate with first 4 active apartments so user sees immediate rows
    const activeApts = apartments.filter(a => !a.isVacant && a.monthlyFee > 0).slice(0, 4);
    const initialRows = activeApts.map(apt =>
      createResidentRowFromApartment(apt, columns)
    );

    const created = addSpecialTask({
      title,
      categoryLabel: newTaskCategory.trim() || tpl?.categoryLabel || 'مهمة خاصة',
      targetGroupLabel: tpl?.targetGroupLabel || 'مجموعة سكان محددة',
      description: newTaskDescription.trim() || tpl?.description || '',
      status: 'active',
      columns,
      rows: initialRows,
    });

    setSelectedTaskId(created.id);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsNewTaskModalOpen(false);
    showBanner(`تم إنشاء المهمة الخاصة "${created.title}" بنجاح!`);
  };

  // Column Handlers
  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || isReadOnly) return;
    const title =
      newColTitle.trim() ||
      (newColType === 'money'
        ? `عمود أموال (${activeTask.columns.filter(c => c.type === 'money').length + 1})`
        : `عمود عدد (${activeTask.columns.filter(c => c.type === 'count').length + 1})`);

    const newCol: SpecialTaskCustomColumn = {
      id: `col-${Date.now()}`,
      title,
      type: newColType,
      defaultValue: Number(newColDefaultVal) || 0,
      unitLabel: newColType === 'count' ? newColUnitLabel.trim() || 'قطعة' : undefined,
      unitPrice: newColType === 'count' ? Math.max(0, Number(newColUnitPrice) || 0) : undefined,
    };

    const updatedColumns = [...activeTask.columns, newCol];
    const updatedRows = activeTask.rows.map(row => ({
      ...row,
      values: {
        ...row.values,
        [newCol.id]: newCol.defaultValue,
      },
    }));

    updateSpecialTask(activeTask.id, {
      columns: updatedColumns,
      rows: updatedRows,
    });

    setNewColTitle('');
    setIsAddColumnOpen(false);
    showBanner(`تم إضافة العمود "${newCol.title}" (${newCol.type === 'money' ? 'عمود أموال' : 'عمود عدد'}) إلى الجدول!`);
  };

  const handleStartEditColumn = (col: SpecialTaskCustomColumn) => {
    setEditingColId(col.id);
    setEditColTitle(col.title);
    setEditColDefaultVal(col.defaultValue);
    setEditColUnitLabel(col.unitLabel || 'قطعة');
    setEditColUnitPrice(col.unitPrice || 0);
  };

  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !editingColId || isReadOnly) return;
    const updatedCols = activeTask.columns.map(col => {
      if (col.id !== editingColId) return col;
      return {
        ...col,
        title: editColTitle.trim() || col.title,
        defaultValue: Number(editColDefaultVal) || 0,
        unitLabel: col.type === 'count' ? editColUnitLabel.trim() || 'قطعة' : undefined,
        unitPrice: col.type === 'count' ? Math.max(0, Number(editColUnitPrice) || 0) : undefined,
      };
    });
    updateSpecialTask(activeTask.id, { columns: updatedCols });
    setEditingColId(null);
    showBanner('تم تحديث إعدادات العمود وإعادة حساب الجدول تلقائياً.');
  };

  const handleDeleteColumn = (colId: string) => {
    if (!activeTask || isReadOnly) return;
    if (activeTask.columns.length <= 1) {
      showBanner('يجب أن يحتوي الجدول على عمود واحد على الأقل.');
      return;
    }
    const targetCol = activeTask.columns.find(c => c.id === colId);
    const updatedColumns = activeTask.columns.filter(c => c.id !== colId);
    updateSpecialTask(activeTask.id, { columns: updatedColumns });
    showBanner(`تم حذف العمود "${targetCol?.title || ''}" من الجدول.`);
  };

  // Row & Resident Selection Handlers
  const handleAddSingleResidentRow = () => {
    if (!activeTask || isReadOnly) return;
    const existingUnitIds = new Set(activeTask.rows.map(r => r.unitId));
    const nextAvailableApt =
      apartments.find(a => !existingUnitIds.has(a.id) && !a.isVacant) ||
      apartments[0] ||
      null;

    const newRow = createResidentRowFromApartment(
      nextAvailableApt,
      activeTask.columns
    );
    updateSpecialTask(activeTask.id, {
      rows: [...activeTask.rows, newRow],
    });
    showBanner(
      `تم إضافة صف جديد (${newRow.residentName} - شقة ${newRow.unitNumber})، يمكنك تغيير الساكن من القائمة داخل الصف.`
    );
  };

  const handleOpenMultiResidentPicker = () => {
    if (!activeTask) return;
    setPickedUnitIds(
      activeTask.rows.filter(r => r.unitId !== 'custom').map(r => r.unitId)
    );
    setIsMultiResidentPickerOpen(true);
  };

  const handleApplyMultiResidentSelection = () => {
    if (!activeTask || isReadOnly) return;
    const existingByUnitId = new Map<string, SpecialTaskResidentRow>();
    activeTask.rows.forEach(r => {
      if (r.unitId !== 'custom') {
        existingByUnitId.set(r.unitId, r);
      }
    });

    const customRows = activeTask.rows.filter(r => r.unitId === 'custom');
    const newSyncedRows: SpecialTaskResidentRow[] = [];

    pickedUnitIds.forEach(unitId => {
      const existing = existingByUnitId.get(unitId);
      if (existing) {
        newSyncedRows.push(existing);
      } else {
        const apt = apartments.find(a => a.id === unitId);
        if (apt) {
          newSyncedRows.push(createResidentRowFromApartment(apt, activeTask.columns));
        }
      }
    });

    updateSpecialTask(activeTask.id, {
      rows: [...newSyncedRows, ...customRows],
    });
    setIsMultiResidentPickerOpen(false);
    showBanner(`تم تحديث جدول السكان ليضم (${newSyncedRows.length + customRows.length}) ساكن!`);
  };

  const handleChangeRowResident = (rowId: string, newUnitId: string) => {
    if (!activeTask || isReadOnly) return;
    const apt = apartments.find(a => a.id === newUnitId);
    const updatedRows = activeTask.rows.map(row => {
      if (row.id !== rowId) return row;
      if (apt) {
        return {
          ...row,
          unitId: apt.id,
          unitNumber: apt.number,
          floor: apt.floor,
          residentName: apt.residentName,
          phone: apt.phone || '',
        };
      }
      return {
        ...row,
        unitId: 'custom',
      };
    });
    updateSpecialTask(activeTask.id, { rows: updatedRows });
  };

  const handleUpdateCellValue = (rowId: string, colId: string, rawValue: number) => {
    if (!activeTask || isReadOnly) return;
    const safeVal = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    const updatedRows = activeTask.rows.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        values: {
          ...row.values,
          [colId]: safeVal,
        },
      };
    });
    updateSpecialTask(activeTask.id, { rows: updatedRows });
  };

  const handleUpdateRowPayment = (
    rowId: string,
    updates: Partial<Pick<SpecialTaskResidentRow, 'paidAmount' | 'paymentMethod' | 'paidAt' | 'notes' | 'residentName' | 'unitNumber'>>
  ) => {
    if (!activeTask || isReadOnly) return;
    const updatedRows = activeTask.rows.map(row =>
      row.id === rowId ? { ...row, ...updates } : row
    );
    updateSpecialTask(activeTask.id, { rows: updatedRows });
  };

  const handleQuickCollectFullRow = (row: SpecialTaskResidentRow) => {
    if (!activeTask || !analytics || isReadOnly) return;
    const summary = analytics.rowSummaries[row.id];
    if (!summary) return;
    const today = new Date().toISOString().split('T')[0];
    handleUpdateRowPayment(row.id, {
      paidAmount: summary.totalRequired,
      paidAt: today,
    });
    showBanner(
      `تم تحصيل المبلغ بالكامل (${formatMoney(summary.totalRequired, settings.currency)}) من أ/ ${row.residentName} (شقة ${row.unitNumber})!`
    );
  };

  const handleCollectAllRemainingRows = () => {
    if (!activeTask || !analytics || isReadOnly) return;
    const today = new Date().toISOString().split('T')[0];
    const updatedRows = activeTask.rows.map(row => {
      const s = analytics.rowSummaries[row.id];
      return {
        ...row,
        paidAmount: s ? s.totalRequired : row.paidAmount,
        paidAt: row.paidAt || today,
      };
    });
    updateSpecialTask(activeTask.id, { rows: updatedRows });
    showBanner('تم تسجيل التحصيل الكامل لجميع السكان المشتركين في الجدول!');
  };

  const handleIssueOfficialTreasuryReceipt = (row: SpecialTaskResidentRow) => {
    if (!activeTask || !analytics || isReadOnly) return;
    const summary = analytics.rowSummaries[row.id];
    const amountToRecord = summary.paidAmount > 0 ? summary.paidAmount : summary.totalRequired;
    if (amountToRecord <= 0) {
      showBanner('يرجى تحديد مبلغ أكبر من صفر لإصدار سند قبض رسمي.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const receiptNum = `SP-${Date.now().toString().slice(-5)}`;
    const newRev = addRevenue({
      receiptNumber: receiptNum,
      unitId: row.unitId !== 'custom' ? row.unitId : apartments[0]?.id || 'custom',
      unitNumber: row.unitNumber,
      residentName: row.residentName,
      amount: amountToRecord,
      date: today,
      monthTarget: today.slice(0, 7),
      category: 'building_improvement',
      paymentMethod: row.paymentMethod || 'cash',
      collectorName: settings.treasurerName,
      notes: `تحصيل مهمة خاصة: ${activeTask.title}`,
    });

    const updatedRows = activeTask.rows.map(r =>
      r.id === row.id
        ? {
            ...r,
            paidAmount: amountToRecord,
            paidAt: today,
            syncedRevenueId: newRev.id,
          }
        : r
    );
    updateSpecialTask(activeTask.id, { rows: updatedRows });
    showBanner(`تم ترحيل المبلغ للخزينة وإصدار سند قبض رسمي رقم (${receiptNum})!`);
    if (onViewReceipt) {
      onViewReceipt(newRev);
    }
  };

  const handleDeleteRow = (rowId: string) => {
    if (!activeTask || isReadOnly) return;
    updateSpecialTask(activeTask.id, {
      rows: activeTask.rows.filter(r => r.id !== rowId),
    });
  };

  const handleDistributeEqualSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || isReadOnly) return;
    const colId =
      splitTargetColId ||
      activeTask.columns.find(c => c.type === 'money')?.id ||
      activeTask.columns[0]?.id;
    if (!colId) return;

    const updatedRows = distributeAmountAcrossSpecialTaskRows(
      activeTask.rows,
      colId,
      splitTotalAmount
    );
    updateSpecialTask(activeTask.id, { rows: updatedRows });
    setIsSplitToolOpen(false);
    const perResident =
      activeTask.rows.length > 0
        ? Math.round((splitTotalAmount / activeTask.rows.length) * 100) / 100
        : 0;
    showBanner(
      `تم توزيع مبلغ ${formatMoney(splitTotalAmount, settings.currency)} بالتساوي (${formatMoney(
        perResident,
        settings.currency
      )} لكل ساكن)!`
    );
  };

  // Sharing & Exporting Handlers (Unified File & Media Manager)
  const handleSendRowWhatsApp = (row: SpecialTaskResidentRow) => {
    if (!activeTask) return;
    const msg = buildSpecialTaskRowWhatsAppMessage({
      task: activeTask,
      row,
      settings,
    });
    const cleanPhone = (row.phone || '').replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0')
      ? `2${cleanPhone}`
      : cleanPhone;
    const rawUrl = intlPhone
      ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    openExternalUrlOrWhatsApp(convertWhatsAppUrlForApk(rawUrl));
  };

  const handleExportTaskVisualFormat = async (
    format: 'png' | 'jpeg' | 'webp' | 'pdf' | 'zip',
    scale: ExportScaleMultiplier
  ) => {
    if (!activeTask) return;
    if (format === 'zip') {
      await handleExportTaskZipBundle(scale);
      return;
    }
    const rawDataUrl = await renderSpecialTaskVisualCardDataUrl(activeTask, settings);
    const saveMode =
      (settings.defaultSaveFolder || 'custom_ask') === 'custom_ask'
        ? 'save_as_picker'
        : 'model_folder';
    const res = await mediaManager.exportAndSaveImage({
      sourceDataUrl: rawDataUrl,
      baseFileName: `مهمة_خاصة_${activeTask.title}`,
      format,
      scale,
      mode: saveMode,
      targetFolder: settings.defaultSaveFolder || 'custom_ask',
      customSubfolder: settings.defaultCustomSubfolder || 'حسن_الجوار',
    });
    if (res.stepLabelArabic) {
      showBanner(res.stepLabelArabic);
    }
  };

  const handleExportTaskZipBundle = async (scale: ExportScaleMultiplier) => {
    if (!activeTask) return;
    const rawDataUrl = await renderSpecialTaskVisualCardDataUrl(activeTask, settings);
    const matrix = buildSpecialTaskSpreadsheetMatrix(activeTask, settings);
    const excelPayloads = generateAllExcelFormatPayloads(
      matrix.sheetTitle,
      `جدول_${activeTask.title}`,
      matrix.headers,
      matrix.rows
    );
    const pngImg = await transformAndOptimizeImage(rawDataUrl, activeTask.title, {
      format: 'png',
      scale,
    });
    const pdfDoc = await transformAndOptimizeImage(rawDataUrl, activeTask.title, {
      format: 'pdf',
      scale,
    });
    const writtenReport = buildSpecialTaskFullWrittenReport(activeTask, settings);

    const res = await mediaManager.exportMultipleAsZip({
      entries: [
        { fileName: pngImg.fileName, data: pngImg.uint8Bytes },
        { fileName: pdfDoc.fileName, data: pdfDoc.uint8Bytes },
        {
          fileName: excelPayloads.xlsx.fileName,
          data: base64ToUint8Array(excelPayloads.xlsx.base64Data),
        },
        {
          fileName: excelPayloads.csv.fileName,
          data: base64ToUint8Array(excelPayloads.csv.base64Data),
        },
        { fileName: `${activeTask.title}_تقرير_واتساب.txt`, data: writtenReport },
      ],
      bundleBaseName: `حزمة_مهمة_خاصة_${activeTask.title}`,
      targetFolder: settings.defaultSaveFolder || 'custom_ask',
      customSubfolder: settings.defaultCustomSubfolder || 'حسن_الجوار',
    });
    if (res.stepLabelArabic) {
      showBanner(res.stepLabelArabic);
    }
  };

  const handleCopyTaskImageToClipboard = async () => {
    if (!activeTask) return;
    const rawDataUrl = await renderSpecialTaskVisualCardDataUrl(activeTask, settings);
    await mediaManager.copyImageToClipboard(rawDataUrl);
    showBanner('تم نسخ صورة كشف المهمة الخاصة إلى الحافظة — يمكنك لصقها فوراً (Ctrl+V)!');
  };

  const handleShareTaskWhatsAppImage = async () => {
    if (!activeTask) return;
    const rawDataUrl = await renderSpecialTaskVisualCardDataUrl(activeTask, settings);
    const caption = `*${activeTask.title}* — ${settings.buildingName}`;
    const res = await mediaManager.shareWhatsAppReady(
      rawDataUrl,
      `مهمة_خاصة_${activeTask.title}.png`,
      caption,
      'share'
    );
    if (res.stepLabelArabic) {
      showBanner(res.stepLabelArabic);
    }
  };

  const handleOpenUnifiedExportModalForImage = async () => {
    if (!activeTask) return;
    const rawDataUrl = await renderSpecialTaskVisualCardDataUrl(activeTask, settings);
    await exportOrSharePngImage({
      dataUrl: rawDataUrl,
      fileName: `مهمة_خاصة_${activeTask.title}.png`,
      title: `تصدير ومشاركة كشف المهمة الخاصة (${activeTask.title})`,
      captionText: `${activeTask.title} - ${settings.buildingName}`,
      openPreviewModal: true,
    });
  };

  const handleOpenUnifiedExportModalForExcel = () => {
    if (!activeTask) return;
    const matrix = buildSpecialTaskSpreadsheetMatrix(activeTask, settings);
    void exportOrShareExcelFile({
      fileName: `جدول_مهمة_خاصة_${activeTask.title}.xlsx`,
      sheetTitle: matrix.sheetTitle,
      headers: matrix.headers,
      rows: matrix.rows,
    });
  };

  if (!activeTask || !analytics) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Layers className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900 mb-2">
          لا توجد مهام خاصة مسجلة حالياً
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          أنشئ مهمة خاصة جديدة لتجميع مصروفات أو مستلزمات لمجموعة معينة من السكان بجدول وأعمدة مخصصة.
        </p>
        <button
          type="button"
          onClick={() => setIsNewTaskModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء أول مهمة خاصة</span>
        </button>
      </div>
    );
  }

  return (
    <div data-testid="special-tasks-view" className="space-y-5">
      {/* Top Action Feedback Banner */}
      {actionBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950 text-emerald-100 border border-emerald-500/40 text-xs font-bold shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-emerald-300 hover:text-white"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER & SPECIAL TASK PROJECT SWITCHER */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-bold text-emerald-700">مهام خاصة وتجميعات مخصصة</span>
              <span aria-hidden="true">·</span>
              <span>{activeTask.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>آخر تحديث: {activeTask.updatedAt}</span>
            </div>
            <h2
              data-testid="active-special-task-title"
              className="text-lg sm:text-xl font-black text-slate-900"
            >
              {activeTask.title}
            </h2>
            {activeTask.description && (
              <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                {activeTask.description}
              </p>
            )}
          </div>

          {/* Export, Save & Share Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <UnifiedExportSplitButton
              primaryLabel="حفظ وتصدير الكشف"
              onPrimaryAction={handleOpenUnifiedExportModalForImage}
              onQuickFormatExport={handleExportTaskVisualFormat}
              onCopyToClipboard={handleCopyTaskImageToClipboard}
              onShareWhatsApp={handleShareTaskWhatsAppImage}
              onOpenStudioModal={handleOpenUnifiedExportModalForImage}
              isBusy={mediaManager.isBusy}
              testIdPrefix="special-task-export"
            />

            <button
              type="button"
              data-testid="special-task-export-excel-btn"
              onClick={handleOpenUnifiedExportModalForExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير إكسيل (XLSX / CSV)</span>
            </button>

            <button
              type="button"
              data-testid="special-task-written-report-btn"
              onClick={() => setIsWrittenReportPreviewOpen(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>تقرير واتساب المجمع</span>
            </button>
          </div>
        </div>

        {/* Task Switcher Tabs & Create New Task Button */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {specialTasks.map(task => {
              const isSelected = task.id === activeTask.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  data-testid={`switch-special-task-${task.id}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{task.title}</span>
                  <span className="mr-1.5 font-mono text-[11px] opacity-75">
                    ({task.rows.length})
                  </span>
                </button>
              );
            })}
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                data-testid="open-new-special-task-modal-btn"
                onClick={() => setIsNewTaskModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>مهمة خاصة جديدة</span>
              </button>

              <button
                type="button"
                data-testid="edit-special-task-meta-btn"
                onClick={() => {
                  setEditTaskTitle(activeTask.title);
                  setEditTaskCategory(activeTask.categoryLabel || 'مهمة وتجميعة خاصة');
                  setEditTaskDescription(activeTask.description || '');
                  setIsEditingTaskMeta(prev => !prev);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
                title="تعديل عنوان ووصف المهمة الخاصة الحالية"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل المهمة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const cloned = duplicateSpecialTask(activeTask.id);
                  if (cloned) {
                    setSelectedTaskId(cloned.id);
                    showBanner(`تم نسخ المهمة إلى "${cloned.title}" بنجاح.`);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="تكرار هذه المهمة بنفس الأعمدة والسكان"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                <span>تكرار</span>
              </button>

              {specialTasks.length > 1 && (
                confirmDeleteTaskId === activeTask.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = specialTasks.filter(t => t.id !== activeTask.id);
                        deleteSpecialTask(activeTask.id);
                        setConfirmDeleteTaskId(null);
                        if (remaining[0]) setSelectedTaskId(remaining[0].id);
                        showBanner('تم حذف المهمة الخاصة.');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteTaskId(null)}
                      className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteTaskId(activeTask.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                    title="حذف هذه المهمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Inline Edit Task Metadata Form */}
        {isEditingTaskMeta && !isReadOnly && (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!editTaskTitle.trim()) return;
              updateSpecialTask(activeTask.id, {
                title: editTaskTitle.trim(),
                categoryLabel: editTaskCategory.trim() || 'مهمة وتجميعة خاصة',
                description: editTaskDescription.trim(),
              });
              setIsEditingTaskMeta(false);
              showBanner('تم حفظ تعديلات بيانات المهمة الخاصة بنجاح.');
            }}
            className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان المهمة الخاصة</label>
              <input
                type="text"
                data-testid="edit-special-task-title-input"
                value={editTaskTitle}
                onChange={e => setEditTaskTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">التصنيف</label>
              <input
                type="text"
                value={editTaskCategory}
                onChange={e => setEditTaskCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الوصف / الملاحظات</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editTaskDescription}
                  onChange={e => setEditTaskDescription(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800"
                />
                <button
                  type="submit"
                  data-testid="save-special-task-meta-btn"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shrink-0"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTaskMeta(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition shrink-0"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Written WhatsApp Report Drawer (Optional toggle) */}
      {isWrittenReportPreviewOpen && (
        <section className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-emerald-400">
                معاينة التقرير المكتوب الشامل للمهمة الخاصة (جاهز لجروب الواتساب)
              </h3>
              <p className="text-xs text-slate-400">
                يتضمن الإحصائيات الكلية، إجماليات كل عمود، وبيان السكان وطرق الدفع
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const text = buildSpecialTaskFullWrittenReport(activeTask, settings);
                  await copyTextSafe(text);
                  setCopiedReportFlag(true);
                  setTimeout(() => setCopiedReportFlag(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                {copiedReportFlag ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReportFlag ? 'تم نسخ التقرير!' : 'نسخ التقرير النصي'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = buildSpecialTaskFullWrittenReport(activeTask, settings);
                  const rawUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  openExternalUrlOrWhatsApp(convertWhatsAppUrlForApk(rawUrl));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>إرسال مباشرة للواتساب</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWrittenReportPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                aria-label="إغلاق معاينة التقرير"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <pre className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
            {buildSpecialTaskFullWrittenReport(activeTask, settings)}
          </pre>
        </section>
      )}

      {/* 2. TOP LIVE STATISTICS DASHBOARD ABOVE THE TABLE (أعلى الجدول إحصائية لكل شيء) */}
      <section
        aria-label="إحصائيات المهمة الخاصة والأعمدة"
        className="space-y-3"
      >
        {/* Executive 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Residents Count & Status Breakdown */}
          <div
            data-testid="special-task-stat-residents"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">السكان المطلوب منهم</span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {analytics.totalResidentsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">ساكن / شقة</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-bold">
                {analytics.paidResidentsCount} مسدد
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-bold">
                {analytics.partialResidentsCount} جزئي
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-700 font-bold">
                {analytics.unpaidResidentsCount} لم يسدد
              </span>
            </div>
          </div>

          {/* Card 2: Grand Total Required */}
          <div
            data-testid="special-task-stat-required"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">إجمالي المبالغ المطلوبة</span>
              <Calculator className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-indigo-950 font-mono tabular-nums">
                {formatMoney(analytics.grandTotalRequired, settings.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>متوسط الساكن الواحد:</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {formatMoney(analytics.averageRequiredPerResident, settings.currency)}
              </span>
            </div>
          </div>

          {/* Card 3: Grand Total Collected & Progress Bar */}
          <div
            data-testid="special-task-stat-collected"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">إجمالي المحصل الفعلي</span>
              <span className="font-mono font-black text-emerald-700 tabular-nums">
                {analytics.collectionRatePercent}%
              </span>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                {formatMoney(analytics.grandTotalCollected, settings.currency)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-200"
                style={{ width: `${analytics.collectionRatePercent}%` }}
              />
            </div>
          </div>

          {/* Card 4: Grand Total Remaining */}
          <div
            data-testid="special-task-stat-remaining"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">إجمالي المتبقي للتحصيل</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-rose-700 font-mono tabular-nums">
                {formatMoney(analytics.grandTotalRemaining, settings.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>إجمالي عدد الوحدات/الأشياء:</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {analytics.grandTotalCountItems} وحدة
              </span>
            </div>
          </div>
        </div>

        {/* Per-Column Live Statistics Grid (إحصائية مخصصة لكل عمود من أعمدة الجدول) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Columns3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                إحصائية تفصيلية لكل عمود في الجدول ({analytics.columnStats.length} أعمدة مخصصة)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              تتحدث تلقائياً فور تعديل أي رقم أو اختيار أي ساكن في الجدول
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {analytics.columnStats.map(colStat => (
              <div
                key={colStat.columnId}
                data-testid={`column-stat-card-${colStat.columnId}`}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 truncate">
                    {colStat.title}
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {colStat.type === 'money' ? 'عمود أموال' : `عمود عدد (${colStat.unitLabel})`}
                  </span>
                </div>

                <div className="my-2 flex items-baseline justify-between gap-2">
                  {colStat.type === 'money' ? (
                    <span className="text-lg font-black text-emerald-700 font-mono tabular-nums">
                      {formatMoney(colStat.totalSum, settings.currency)}
                    </span>
                  ) : (
                    <div>
                      <span className="text-lg font-black text-indigo-700 font-mono tabular-nums">
                        {colStat.totalSum} {colStat.unitLabel}
                      </span>
                      {colStat.unitPrice > 0 && (
                        <span className="block text-[11px] font-bold text-emerald-700 font-mono tabular-nums">
                          = {formatMoney(colStat.totalMonetaryEquivalent, settings.currency)} (× {colStat.unitPrice})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                  <span>
                    المتوسط:{' '}
                    <strong className="font-mono tabular-nums text-slate-700">
                      {colStat.type === 'money'
                        ? formatMoney(colStat.averagePerRow, settings.currency)
                        : `${colStat.averagePerRow} ${colStat.unitLabel}`}
                    </strong>
                  </span>
                  <span>{colStat.activeRowsCount} ساكن مشارك</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Collection Channels Strip (طرق التحصيل الاحترافية) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>محصلات طرق الدفع:</span>
            </span>
            {analytics.paymentMethodsBreakdown.map(pm => (
              <div
                key={pm.method}
                className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80"
              >
                <span className="font-bold text-slate-800">{pm.labelArabic}:</span>
                <span className="font-mono font-black text-emerald-700 tabular-nums">
                  {formatMoney(pm.collectedAmount, settings.currency)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({pm.rowsCount})
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await copyTextSafe(INSTAPAY_PAYMENT_URL);
                setCopiedInstaPayFlag(true);
                setTimeout(() => setCopiedInstaPayFlag(false), 2500);
                showBanner('تم نسخ رابط الدفع المباشر عبر إنستاباي (InstaPay)!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {copiedInstaPayFlag ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>نسخ رابط إنستاباي للسكان</span>
            </button>

            {!isReadOnly && analytics.grandTotalRemaining > 0 && (
              <button
                type="button"
                data-testid="collect-all-special-task-rows-btn"
                onClick={handleCollectAllRemainingRows}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تحصيل الكل بضغطة واحدة</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. TABLE TOOLBAR: ADD COLUMNS, PICK RESIDENTS, SMART SPLIT, SEARCH & FILTER */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Action Buttons to Customize Columns & Rows */}
          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="add-single-resident-row-btn"
                onClick={handleAddSingleResidentRow}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>إضافة صف ساكن</span>
              </button>

              <button
                type="button"
                data-testid="open-multi-resident-picker-btn"
                onClick={handleOpenMultiResidentPicker}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>تحديد السكان المطلوب منهم ({activeTask.rows.length})</span>
              </button>

              <button
                type="button"
                data-testid="open-add-custom-column-btn"
                onClick={() => setIsAddColumnOpen(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition cursor-pointer"
              >
                <Columns3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ إضافة عمود (أموال / عدد)</span>
              </button>

              <button
                type="button"
                data-testid="open-equal-split-tool-btn"
                onClick={() => {
                  setSplitTargetColId(
                    activeTask.columns.find(c => c.type === 'money')?.id ||
                      activeTask.columns[0]?.id ||
                      ''
                  );
                  setIsSplitToolOpen(prev => !prev);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold transition cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                <span>توزيع مبلغ بالتساوي</span>
              </button>
            </div>
          )}

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={rowSearchQuery}
                onChange={e => setRowSearchQuery(e.target.value)}
                placeholder="بحث باسم الساكن أو الشقة..."
                aria-label="بحث باسم الساكن أو الشقة في الجدول"
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'paid', label: 'مسدد' },
                  { id: 'partial', label: 'جزئي' },
                  { id: 'unpaid', label: 'غير مسدد' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inline Add Custom Column Builder */}
        {isAddColumnOpen && !isReadOnly && (
          <form
            onSubmit={handleAddCustomColumn}
            data-testid="add-custom-column-form"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900">
                إضافة عمود مخصص جديد للجدول (عمود أموال أو عمود عدد شيء معين)
              </h4>
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  نوع العمود المطلوب
                </label>
                <select
                  value={newColType}
                  onChange={e => setNewColType(e.target.value as SpecialTaskColumnType)}
                  data-testid="new-col-type-select"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                >
                  <option value="money">عمود أموال ({settings.currency})</option>
                  <option value="count">عمود عدد شيء معين (كمية / وحدات)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم العمود في الجدول
                </label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={e => setNewColTitle(e.target.value)}
                  data-testid="new-col-title-input"
                  placeholder={
                    newColType === 'money'
                      ? 'مثال: دفعة ثانية / مصنعية'
                      : 'مثال: عدد الريموتات / المفاتيح'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  القيمة الافتراضية لكل ساكن
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={newColDefaultVal}
                  onChange={e => setNewColDefaultVal(Number(e.target.value))}
                  data-testid="new-col-default-input"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold tabular-nums"
                />
              </div>

              {newColType === 'count' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      تسمية الشيء المعدود
                    </label>
                    <input
                      type="text"
                      value={newColUnitLabel}
                      onChange={e => setNewColUnitLabel(e.target.value)}
                      placeholder="ريموت / مفتاح / كارت / فرد"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      سعر الوحدة الواحدة (اختياري)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={newColUnitPrice}
                      onChange={e => setNewColUnitPrice(Number(e.target.value))}
                      placeholder="0 = إحصاء عدد فقط بدون ضرب في سعر"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold tabular-nums"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                data-testid="submit-add-custom-column-btn"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
              >
                إضافة العمود للجدول الآن
              </button>
            </div>
          </form>
        )}

        {/* Inline Equal Split Calculator */}
        {isSplitToolOpen && !isReadOnly && (
          <form
            onSubmit={handleDistributeEqualSplit}
            className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-end justify-between gap-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اختر العمود المراد توزيع المبلغ عليه
                </label>
                <select
                  value={splitTargetColId}
                  onChange={e => setSplitTargetColId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                >
                  {activeTask.columns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.type === 'money' ? 'عمود أموال' : 'عمود عدد'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  إجمالي المبلغ الكلي المراد تقسيمه بالتساوي على ({activeTask.rows.length}) ساكن
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={splitTotalAmount}
                  onChange={e => setSplitTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer whitespace-nowrap"
              >
                توزيع بالتساوي ({activeTask.rows.length > 0 ? formatMoney(splitTotalAmount / activeTask.rows.length, settings.currency) : '0'} للساكن)
              </button>
              <button
                type="button"
                onClick={() => setIsSplitToolOpen(false)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* Inline Edit Column Form */}
        {editingColId && !isReadOnly && (
          <form
            onSubmit={handleSaveEditColumn}
            className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                اسم العمود
              </label>
              <input
                type="text"
                value={editColTitle}
                onChange={e => setEditColTitle(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold"
              />
            </div>
            {activeTask.columns.find(c => c.id === editingColId)?.type === 'count' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اسم الوحدة
                  </label>
                  <input
                    type="text"
                    value={editColUnitLabel}
                    onChange={e => setEditColUnitLabel(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    سعر الوحدة ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={editColUnitPrice}
                    onChange={e => setEditColUnitPrice(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 rounded-xl border border-indigo-300 bg-white text-xs font-mono font-bold tabular-nums"
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
            >
              حفظ تعديل العمود
            </button>
            <button
              type="button"
              onClick={() => setEditingColId(null)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
            >
              إلغاء
            </button>
          </form>
        )}

        {/* 4. THE INTERACTIVE MATRIX SPREADSHEET TABLE (الجدول التفاعلي المجمع) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table
            data-testid="special-task-matrix-table"
            className="w-full text-right border-collapse"
          >
            <thead>
              <tr className="bg-slate-900 text-white text-xs">
                <th className="py-3 px-2.5 font-bold border-l border-slate-800 w-10 text-center">
                  #
                </th>
                <th className="py-3 px-3 font-bold border-l border-slate-800 min-w-[230px]">
                  الساكن والشقة (اختيار مباشر)
                </th>

                {/* Dynamic Custom Columns Headers */}
                {activeTask.columns.map(col => (
                  <th
                    key={col.id}
                    className="py-2.5 px-3 font-bold border-l border-slate-800 min-w-[145px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{col.title}</span>
                      {!isReadOnly && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditColumn(col)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title={`تعديل عمود ${col.title}`}
                            aria-label={`تعديل عمود ${col.title}`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {activeTask.columns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col.id)}
                              className="text-rose-400 hover:text-rose-200 p-0.5"
                              title={`حذف عمود ${col.title}`}
                              aria-label={`حذف عمود ${col.title}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-300 mt-0.5">
                      {col.type === 'money' ? (
                        <span className="text-emerald-300">
                          عمود أموال ({settings.currency})
                        </span>
                      ) : (
                        <span className="text-indigo-300">
                          عمود عدد ({col.unitLabel || 'وحدة'}
                          {col.unitPrice && col.unitPrice > 0
                            ? ` × ${col.unitPrice} ${settings.currency}`
                            : ''}
                          )
                        </span>
                      )}
                    </div>
                  </th>
                ))}

                <th className="py-3 px-3 font-bold border-l border-slate-800 min-w-[130px] bg-slate-950">
                  إجمالي المطلوب
                </th>
                <th className="py-3 px-3 font-bold border-l border-slate-800 min-w-[185px]">
                  المبلغ المسدد وطريقة التحصيل
                </th>
                <th className="py-3 px-3 font-bold border-l border-slate-800 min-w-[125px]">
                  المتبقي والحالة
                </th>
                <th className="py-3 px-3 font-bold min-w-[175px] text-center">
                  أدوات التحصيل والمشاركة
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6 + activeTask.columns.length}
                    className="py-8 text-center text-slate-500 font-bold"
                  >
                    لا توجد صفوف مطابقة للبحث أو الفلتر الحالي.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const summary =
                    analytics.rowSummaries[row.id] ||
                    computeSpecialTaskRowSummary(row, activeTask.columns);

                  const matchedApt = apartments.find(
                    a => a.id === row.unitId || (row.unitId !== 'custom' && a.number === row.unitNumber)
                  );
                  const resolvedSelectValue = matchedApt ? matchedApt.id : 'custom';

                  return (
                    <tr
                      key={row.id}
                      data-testid={`special-task-row-${row.id}`}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 border-l border-slate-100 tabular-nums">
                        {idx + 1}
                      </td>

                      {/* Resident Selector Dropdown in Every Row */}
                      <td className="py-2.5 px-3 border-l border-slate-100">
                        <div className="space-y-1">
                          <select
                            aria-label={`اختيار الساكن للصف رقم ${idx + 1}`}
                            disabled={isReadOnly}
                            value={resolvedSelectValue}
                            onChange={e => handleChangeRowResident(row.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                          >
                            {apartments.map(apt => (
                              <option key={apt.id} value={apt.id}>
                                شقة {apt.number} — {apt.residentName} (الدور {apt.floor})
                              </option>
                            ))}
                            <option value="custom">ساكن / مساهم مخصص...</option>
                          </select>

                          {row.unitId === 'custom' ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={row.residentName}
                                disabled={isReadOnly}
                                onChange={e =>
                                  handleUpdateRowPayment(row.id, {
                                    residentName: e.target.value,
                                  })
                                }
                                placeholder="اسم المساهم..."
                                className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                              />
                              <input
                                type="text"
                                value={row.unitNumber}
                                disabled={isReadOnly}
                                onChange={e =>
                                  handleUpdateRowPayment(row.id, {
                                    unitNumber: e.target.value,
                                  })
                                }
                                placeholder="شقة"
                                className="w-14 px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>شقة {row.unitNumber}</span>
                              <span aria-hidden="true">·</span>
                              <span>الدور {row.floor}</span>
                              {row.phone && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">{row.phone}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dynamic Custom Column Cells (Money or Count) */}
                      {activeTask.columns.map(col => {
                        const cellVal = Number(row.values?.[col.id] ?? 0);
                        return (
                          <td
                            key={col.id}
                            className="py-2.5 px-2.5 border-l border-slate-100 align-middle"
                          >
                            {col.type === 'count' ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isReadOnly || cellVal <= 0}
                                    onClick={() =>
                                      handleUpdateCellValue(row.id, col.id, Math.max(0, cellVal - 1))
                                    }
                                    aria-label={`إنقاص ${col.title} لـ ${row.residentName}`}
                                    className="w-6 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    disabled={isReadOnly}
                                    aria-label={`${col.title} لـ ${row.residentName}`}
                                    value={cellVal}
                                    onChange={e =>
                                      handleUpdateCellValue(row.id, col.id, Number(e.target.value))
                                    }
                                    className="w-16 text-center px-1.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/40 font-mono font-black text-indigo-950 text-xs tabular-nums"
                                  />
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() =>
                                      handleUpdateCellValue(row.id, col.id, cellVal + 1)
                                    }
                                    aria-label={`زيادة ${col.title} لـ ${row.residentName}`}
                                    className="w-6 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                                {col.unitPrice && col.unitPrice > 0 ? (
                                  <div className="text-[10px] text-slate-500 font-mono tabular-nums text-center">
                                    = {formatMoney(cellVal * col.unitPrice, settings.currency)}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  disabled={isReadOnly}
                                  aria-label={`${col.title} لـ ${row.residentName}`}
                                  value={cellVal}
                                  onChange={e =>
                                    handleUpdateCellValue(row.id, col.id, Number(e.target.value))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs tabular-nums focus:outline-none focus:border-emerald-600"
                                />
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total Required */}
                      <td className="py-2.5 px-3 border-l border-slate-100 bg-slate-50/80 font-mono font-black text-slate-900 text-sm tabular-nums">
                        {formatMoney(summary.totalRequired, settings.currency)}
                      </td>

                      {/* Paid Amount & Payment Method */}
                      <td className="py-2.5 px-3 border-l border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled={isReadOnly}
                            aria-label={`المبلغ المسدد من ${row.residentName}`}
                            value={row.paidAmount}
                            onChange={e =>
                              handleUpdateRowPayment(row.id, {
                                paidAmount: Math.max(0, Number(e.target.value) || 0),
                                paidAt: new Date().toISOString().split('T')[0],
                              })
                            }
                            className="w-24 px-2 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/40 font-mono font-black text-emerald-900 text-xs tabular-nums"
                          />
                          <select
                            aria-label={`طريقة تحصيل ${row.residentName}`}
                            disabled={isReadOnly}
                            value={row.paymentMethod}
                            onChange={e =>
                              handleUpdateRowPayment(row.id, {
                                paymentMethod: e.target.value as PaymentMethod,
                              })
                            }
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700"
                          >
                            <option value="cash">نقدي (كاش)</option>
                            <option value="instapay">إنستاباي</option>
                            <option value="vodafone_cash">فودافون كاش</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="check">شيك</option>
                          </select>
                        </div>
                      </td>

                      {/* Remaining & Status */}
                      <td className="py-2.5 px-3 border-l border-slate-100">
                        <div className="font-mono font-black text-xs tabular-nums">
                          {summary.remainingAmount > 0 ? (
                            <span className="text-rose-700">
                              متبقي {formatMoney(summary.remainingAmount, settings.currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-700">خالص السداد</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {summary.status === 'paid' && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          )}
                          {summary.status === 'partial' && (
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          )}
                          {summary.status === 'unpaid' && (
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          )}
                          <span>{summary.statusLabelArabic}</span>
                        </div>
                      </td>

                      {/* Professional Row Collection & Share Actions */}
                      <td className="py-2.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {!isReadOnly && summary.remainingAmount > 0 && (
                            <button
                              type="button"
                              data-testid={`collect-full-row-${row.id}`}
                              onClick={() => handleQuickCollectFullRow(row)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                              title="تحصيل المبلغ المطلوب بالكامل بضغطة واحدة"
                            >
                              تحصيل كامل ✓
                            </button>
                          )}

                          {!isReadOnly && row.paidAmount > 0 && (
                            <button
                              type="button"
                              data-testid={`cancel-row-payment-${row.id}`}
                              onClick={() => {
                                handleUpdateRow(row.id, { paidAmount: 0, lastPaidAt: undefined });
                                showBanner(`تم إلغاء دفعة ${row.residentName} وإعادة المبلغ المدفوع إلى صفر.`);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition cursor-pointer"
                              title="إلغاء الدفعة المسجلة لهذا الساكن وتصفير المسدد"
                            >
                              إلغاء الدفعة
                            </button>
                          )}

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleIssueOfficialTreasuryReceipt(row)}
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold transition cursor-pointer"
                              title="ترحيل المبلغ للخزينة وإصدار سند قبض رسمي قابل للطباعة"
                            >
                              <Receipt className="w-3.5 h-3.5 inline ml-0.5" />
                              <span>سند رسمي</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendRowWhatsApp(row)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-700 transition cursor-pointer"
                            title={`إرسال تفصيل المساهمة ورابط الدفع عبر واتساب إلى ${row.residentName}`}
                            aria-label={`واتساب ${row.residentName}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title={`حذف صف ${row.residentName}`}
                              aria-label={`حذف صف ${row.residentName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Totals Footer Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-xs">
                <td className="py-3 px-2.5 text-center font-mono">∑</td>
                <td className="py-3 px-3">
                  الإجمالي العام ({analytics.totalResidentsCount} ساكن)
                </td>
                {analytics.columnStats.map(cs => (
                  <td
                    key={cs.columnId}
                    data-testid={`footer-col-total-${cs.columnId}`}
                    className="py-3 px-3 font-mono tabular-nums"
                  >
                    {cs.type === 'money' ? (
                      <span className="text-emerald-300">
                        {formatMoney(cs.totalSum, settings.currency)}
                      </span>
                    ) : (
                      <div>
                        <span className="text-indigo-200">
                          {cs.totalSum} {cs.unitLabel}
                        </span>
                        {cs.unitPrice > 0 && (
                          <span className="block text-[10px] text-emerald-300">
                            ({formatMoney(cs.totalMonetaryEquivalent, settings.currency)})
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td
                  data-testid="footer-grand-total-required"
                  className="py-3 px-3 font-mono text-sm text-amber-300 tabular-nums bg-slate-950"
                >
                  {formatMoney(analytics.grandTotalRequired, settings.currency)}
                </td>
                <td
                  data-testid="footer-grand-total-collected"
                  className="py-3 px-3 font-mono text-sm text-emerald-300 tabular-nums"
                >
                  {formatMoney(analytics.grandTotalCollected, settings.currency)}
                </td>
                <td
                  data-testid="footer-grand-total-remaining"
                  className="py-3 px-3 font-mono text-sm text-rose-300 tabular-nums"
                >
                  {formatMoney(analytics.grandTotalRemaining, settings.currency)}
                </td>
                <td className="py-3 px-3 text-center text-emerald-300 font-mono tabular-nums">
                  نسبة التحصيل {analytics.collectionRatePercent}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* MODAL 1: CREATE NEW SPECIAL TASK (إنشاء مهمة خاصة جديدة أو اختيار قالب ذكي) */}
      {isNewTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="إنشاء مهمة خاصة جديدة"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                إنشاء مهمة خاصة وتجميعة مصروفات جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskFromModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اختر قالباً جاهزاً للأعمدة (أو عدّل الأعمدة لاحقاً بحرية)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SPECIAL_TASK_SMART_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setNewTaskTitle(tpl.title);
                        setNewTaskCategory(tpl.categoryLabel);
                        setNewTaskDescription(tpl.description);
                      }}
                      className={`text-right p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        selectedTemplateId === tpl.id
                          ? 'border-emerald-600 bg-emerald-50/60 font-black text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold truncate">{tpl.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tpl.columns.length} أعمدة مجهزة مسبقاً
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان المهمة الخاصة
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: تجميعة صيانة وتجديد مدخل العمارة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التصنيف
                </label>
                <input
                  type="text"
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value)}
                  placeholder="مثال: تحسينات وأمن / صيانة مشتركة"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وصف وتفاصيل المهمة (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={newTaskDescription}
                  onChange={e => setNewTaskDescription(e.target.value)}
                  placeholder="تفاصيل البنود المطلوبة من السكان المشتركين..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  data-testid="confirm-create-special-task-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                >
                  إنشاء المهمة وفتح الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MULTI-RESIDENT PICKER (تحديد السكان المطلوب منهم الدفع دفعة واحدة) */}
      {isMultiResidentPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تحديد السكان المطلوب منهم الدفع"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  تحديد السكان المطلوب منهم المشاركة في هذه المهمة
                </h3>
                <p className="text-xs text-slate-500">
                  اختر السكان المطلوب إضافتهم كصفوف في الجدول ({pickedUnitIds.length} شقة محددة حالياً)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiResidentPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Selection Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setPickedUnitIds(apartments.filter(a => !a.isVacant).map(a => a.id))
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                تحديد كل السكان النشطين
              </button>
              <button
                type="button"
                onClick={() =>
                  setPickedUnitIds(
                    apartments
                      .filter(a => a.residentType === 'owner' && !a.isVacant)
                      .map(a => a.id)
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold cursor-pointer"
              >
                الملاك فقط
              </button>
              <button
                type="button"
                onClick={() =>
                  setPickedUnitIds(
                    apartments
                      .filter(a => a.residentType === 'tenant' && !a.isVacant)
                      .map(a => a.id)
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold cursor-pointer"
              >
                المستأجرين فقط
              </button>
              <button
                type="button"
                onClick={() => setPickedUnitIds([])}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
              >
                إلغاء تحديد الكل
              </button>

              <select
                value={pickerFloorFilter}
                onChange={e => setPickerFloorFilter(e.target.value)}
                aria-label="تصفية الشقق حسب الدور"
                className="mr-auto px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
              >
                <option value="all">كل الأدوار</option>
                {buildingFloors.map(fl => (
                  <option key={fl} value={String(fl)}>
                    الدور {fl}
                  </option>
                ))}
              </select>
            </div>

            {/* Apartments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 max-h-80">
              {apartments
                .filter(a =>
                  pickerFloorFilter === 'all'
                    ? true
                    : String(a.floor) === pickerFloorFilter
                )
                .map(apt => {
                  const isChecked = pickedUnitIds.includes(apt.id);
                  return (
                    <label
                      key={apt.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setPickedUnitIds(prev => [...prev, apt.id]);
                            } else {
                              setPickedUnitIds(prev => prev.filter(id => id !== apt.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <div className="truncate">
                          <span className="font-black">شقة {apt.number}</span>
                          <span className="mx-1">—</span>
                          <span>{apt.residentName}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        الدور {apt.floor} · {apt.residentType === 'owner' ? 'مالك' : 'مستأجر'}
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMultiResidentPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                data-testid="apply-multi-resident-selection-btn"
                onClick={handleApplyMultiResidentSelection}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
              >
                اعتماد السكان المحددين ({pickedUnitIds.length} شقة)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
