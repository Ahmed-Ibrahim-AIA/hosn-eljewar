import React, { useState, useEffect, useCallback } from 'react';
import {
  WhatsAppInvoiceReportData,
  formatMoney,
} from '../utils/finance';
import { exportOrSharePngImage, copyTextSafe, saveFileToDevice } from '../utils/apkBridge';
import {
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  Eye,
  FolderOpen,
} from 'lucide-react';
import { UnifiedExportSplitButton } from './UnifiedExportSplitButton';
import {
  transformAndOptimizeImage,
  buildMultiFormatZipBundle,
  copyImageToSystemClipboard,
  executeUnifiedSaveOperation,
} from '../services/fileMediaManager';

interface WhatsAppInvoiceImageCardProps {
  invoiceData: WhatsAppInvoiceReportData;
  onRefreshTimestamp?: () => void;
}

export type InvoiceSummaryScope = 'combined' | 'month_only' | 'all_time';

/**
 * Draws a helper rounded rectangle path on a 2D canvas context
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Renders the White Invoice Report onto a high-resolution HTML5 Canvas (2x Retina scale)
 * for instant PNG download, clipboard copy, or native WhatsApp image share.
 */
export function renderWhiteInvoiceToCanvas(
  data: WhatsAppInvoiceReportData,
  summaryScope: InvoiceSummaryScope = 'combined',
  loadedImages?: {
    appIconImg?: HTMLImageElement | null;
    stampImg?: HTMLImageElement | null;
  }
): HTMLCanvasElement {
  const scale = 2;
  const logicalWidth = 920;
  const padX = 36;
  const contentWidth = logicalWidth - padX * 2;

  // Calculate dynamic row counts
  const paidRowsCount = Math.max(1, Math.ceil(data.paidUnits.length / 2));
  const lateRowsCount = Math.max(1, Math.ceil(data.lateUnits.length / 2));
  const expenseRowsCount = Math.max(1, data.expensesList.length);

  // Calculate total logical height
  const headerHeight = 132;
  const summaryBoxesHeight = 130;
  const paidSectionHeight = 56 + paidRowsCount * 42 + 44;
  const lateSectionHeight = 56 + lateRowsCount * 42 + 44;
  const expenseSectionHeight = 56 + 34 + expenseRowsCount * 38 + 44;
  const footerHeight = 108;

  const logicalHeight =
    32 +
    headerHeight +
    20 +
    summaryBoxesHeight +
    22 +
    paidSectionHeight +
    20 +
    lateSectionHeight +
    20 +
    expenseSectionHeight +
    20 +
    footerHeight +
    28;

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);
  ctx.direction = 'rtl';
  const fontFamily = '"Cairo", "Segoe UI", Tahoma, sans-serif';

  // 1. Pure White Invoice Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Outer invoice border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 14, 14, logicalWidth - 28, logicalHeight - 28, 16);
  ctx.stroke();

  // Top decorative official invoice stripe
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, 14, 14, logicalWidth - 28, 10, 4);
  ctx.fill();

  let curY = 36;

  // 2. Invoice Header Box
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, padX, curY, contentWidth, headerHeight, 14);
  ctx.fill();
  ctx.stroke();

  // Right side: Optional App Icon + Building Name & Official Title
  const hasAppIcon = Boolean(loadedImages?.appIconImg);
  const textRightX = hasAppIcon ? logicalWidth - padX - 102 : logicalWidth - padX - 22;

  if (loadedImages?.appIconImg) {
    try {
      ctx.save();
      drawRoundedRect(ctx, logicalWidth - padX - 88, curY + 24, 68, 68, 14);
      ctx.clip();
      ctx.drawImage(loadedImages.appIconImg, logicalWidth - padX - 88, curY + 24, 68, 68);
      ctx.restore();
    } catch {
      // ignore image draw errors
    }
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#059669';
  ctx.font = `700 13px ${fontFamily}`;
  ctx.fillText('فاتورة وتقرير مالي رسمي للعمارة', textRightX, curY + 30);

  ctx.fillStyle = '#0F172A';
  ctx.font = `900 26px ${fontFamily}`;
  ctx.fillText(data.buildingName, textRightX, curY + 66);

  ctx.fillStyle = '#475569';
  ctx.font = `600 13px ${fontFamily}`;
  const subInfo = data.buildingAddress
    ? `${data.buildingAddress}  •  إشراف: ${data.treasurerName}`
    : `أمين الصندوق / إدارة العقار: ${data.treasurerName}`;
  ctx.fillText(subInfo, textRightX, curY + 96);

  // Left side: Target Month & Date Badge
  const badgeW = 240;
  const badgeH = 88;
  const badgeX = padX + 20;
  const badgeY = curY + 22;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#047857';
  ctx.font = `800 16px ${fontFamily}`;
  ctx.fillText(`شهر: ${data.monthLabelArabic}`, badgeX + badgeW / 2, badgeY + 32);

  ctx.fillStyle = '#334155';
  ctx.font = `700 12px ${fontFamily}`;
  ctx.fillText(`تاريخ التقرير: ${data.reportIssueDate}`, badgeX + badgeW / 2, badgeY + 56);

  ctx.fillStyle = '#64748B';
  ctx.font = `600 11px ${fontFamily}`;
  ctx.fillText(`الفترة المحاسبية: ${data.targetMonth}`, badgeX + badgeW / 2, badgeY + 76);

  curY += headerHeight + 20;

  // 3. Financial Totals Strip (3 Cards: Treasury Revenues, Total Expenses, Remaining Balance)
  const cardGap = 14;
  const cardW = (contentWidth - cardGap * 2) / 3;

  const primaryRev =
    summaryScope === 'month_only' ? data.totals.monthRevenues : data.totals.allTimeRevenues;
  const secondaryRevLabel =
    summaryScope === 'month_only'
      ? `إجمالي الخزينة الكلي: ${data.totals.allTimeRevenues.toLocaleString('en-US')} ${data.currency}`
      : `تحصيل شهر ${data.monthLabelArabic}: ${data.totals.monthRevenues.toLocaleString('en-US')} ${data.currency}`;

  const primaryExp =
    summaryScope === 'month_only' ? data.totals.monthExpenses : data.totals.allTimeExpenses;
  const secondaryExpLabel =
    summaryScope === 'month_only'
      ? `إجمالي المصروفات الكلي: ${data.totals.allTimeExpenses.toLocaleString('en-US')} ${data.currency}`
      : `مصروفات شهر ${data.monthLabelArabic}: ${data.totals.monthExpenses.toLocaleString('en-US')} ${data.currency}`;

  const primaryRem =
    summaryScope === 'month_only'
      ? data.totals.monthNetRemaining
      : data.totals.treasuryRemainingBalance;
  const secondaryRemLabel =
    summaryScope === 'month_only'
      ? `الرصيد الفعلي بالخزينة: ${data.totals.treasuryRemainingBalance.toLocaleString('en-US')} ${data.currency}`
      : `صافي حركة الشهر: ${data.totals.monthNetRemaining >= 0 ? '+' : ''}${data.totals.monthNetRemaining.toLocaleString('en-US')} ${data.currency}`;

  const summaryCards = [
    {
      // Card 1 (Rightmost in RTL)
      x: logicalWidth - padX - cardW,
      bg: '#ECFDF5',
      border: '#6EE7B7',
      titleColor: '#065F46',
      valColor: '#047857',
      subColor: '#065F46',
      title:
        summaryScope === 'month_only'
          ? 'إجمالي تحصيلات الشهر بالخزينة'
          : 'إجمالي المبالغ بالخزينة (الوارد)',
      value: `${primaryRev.toLocaleString('en-US')} ${data.currency}`,
      sub: secondaryRevLabel,
    },
    {
      // Card 2 (Middle)
      x: logicalWidth - padX - cardW * 2 - cardGap,
      bg: '#FFF1F2',
      border: '#FDA4AF',
      titleColor: '#9F1239',
      valColor: '#BE123C',
      subColor: '#881337',
      title:
        summaryScope === 'month_only'
          ? 'إجمالي مصروفات الشهر'
          : 'إجمالي مبالغ المصروفات',
      value: `${primaryExp.toLocaleString('en-US')} ${data.currency}`,
      sub: secondaryExpLabel,
    },
    {
      // Card 3 (Leftmost in RTL)
      x: padX,
      bg: '#EEF2FF',
      border: '#A5B4FC',
      titleColor: '#1E3A8A',
      valColor: '#1D4ED8',
      subColor: '#1E40AF',
      title: 'المتبقي الفعلي بالخزينة (الصافي)',
      value: `${primaryRem.toLocaleString('en-US')} ${data.currency}`,
      sub: secondaryRemLabel,
    },
  ];

  for (const card of summaryCards) {
    ctx.fillStyle = card.bg;
    ctx.strokeStyle = card.border;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, card.x, curY, cardW, summaryBoxesHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    const centerX = card.x + cardW / 2;

    ctx.fillStyle = card.titleColor;
    ctx.font = `800 13px ${fontFamily}`;
    ctx.fillText(card.title, centerX, curY + 30);

    ctx.fillStyle = card.valColor;
    ctx.font = `900 25px ${fontFamily}`;
    ctx.fillText(card.value, centerX, curY + 72);

    ctx.fillStyle = card.subColor;
    ctx.font = `700 11.5px ${fontFamily}`;
    ctx.fillText(card.sub, centerX, curY + 106);
  }

  curY += summaryBoxesHeight + 22;

  // ---------------------------------------------------------------------------
  // 4. SECTION 1: WHO PAID (من قام بالدفع)
  // ---------------------------------------------------------------------------
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, padX, curY, contentWidth, paidSectionHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Section 1 Header Bar
  ctx.fillStyle = '#059669';
  drawRoundedRect(ctx, padX, curY, contentWidth, 44, 10);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 15px ${fontFamily}`;
  ctx.fillText(
    `أولاً: كشف من قام بالدفع لشهر ${data.monthLabelArabic} (${data.paidUnits.length} شقة)`,
    logicalWidth - padX - 18,
    curY + 28
  );

  ctx.textAlign = 'left';
  ctx.font = `700 13px ${fontFamily}`;
  ctx.fillText(
    `إجمالي المحصل: ${data.totals.monthRevenues.toLocaleString('en-US')} ${data.currency}`,
    padX + 18,
    curY + 28
  );

  let rowY = curY + 54;
  const colW = (contentWidth - 28) / 2;

  if (data.paidUnits.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748B';
    ctx.font = `700 13px ${fontFamily}`;
    ctx.fillText('لا توجد دفعات مسجلة لهذا الشهر حتى الآن', logicalWidth / 2, rowY + 24);
  } else {
    data.paidUnits.forEach((u, idx) => {
      const isRightCol = idx % 2 === 0;
      const cellX = isRightCol ? logicalWidth - padX - 10 - colW : padX + 10;
      const cellY = rowY + Math.floor(idx / 2) * 42;

      ctx.fillStyle = idx % 4 < 2 ? '#F8FAFC' : '#F0FDF4';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cellX, cellY, colW, 36, 8);
      ctx.fill();
      ctx.stroke();

      // Unit Number Badge + Resident Name on Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#065F46';
      ctx.font = `800 12.5px ${fontFamily}`;
      ctx.fillText(`شقة (${u.unitNumber})`, cellX + colW - 10, cellY + 23);

      ctx.fillStyle = '#0F172A';
      ctx.font = `700 12.5px ${fontFamily}`;
      const truncatedName =
        u.residentName.length > 24 ? u.residentName.slice(0, 24) + '...' : u.residentName;
      ctx.fillText(truncatedName, cellX + colW - 72, cellY + 23);

      // Paid Amount on Left
      ctx.textAlign = 'left';
      ctx.fillStyle = '#047857';
      ctx.font = `800 13px ${fontFamily}`;
      ctx.fillText(
        `مسدد: ${u.paidAmount.toLocaleString('en-US')} ${data.currency}`,
        cellX + 10,
        cellY + 23
      );
    });
  }

  // Section 1 Footer Summary
  const paidFooterY = curY + paidSectionHeight - 36;
  ctx.fillStyle = '#ECFDF5';
  drawRoundedRect(ctx, padX + 8, paidFooterY, contentWidth - 16, 28, 6);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#065F46';
  ctx.font = `700 12px ${fontFamily}`;
  ctx.fillText(
    `إجمالي عدد الشقق المسددة: ${data.paidUnits.length} شقة`,
    logicalWidth - padX - 20,
    paidFooterY + 19
  );

  ctx.textAlign = 'left';
  ctx.font = `800 12.5px ${fontFamily}`;
  ctx.fillText(
    `إجمالي المسدد: ${data.totals.monthRevenues.toLocaleString('en-US')} ${data.currency}`,
    padX + 20,
    paidFooterY + 19
  );

  curY += paidSectionHeight + 20;

  // ---------------------------------------------------------------------------
  // 5. SECTION 2: WHO IS LATE (من تأخر عن الدفع)
  // ---------------------------------------------------------------------------
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FECDD3';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, padX, curY, contentWidth, lateSectionHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Section 2 Header Bar
  ctx.fillStyle = '#E11D48';
  drawRoundedRect(ctx, padX, curY, contentWidth, 44, 10);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 15px ${fontFamily}`;
  ctx.fillText(
    `ثانياً: كشف من تأخر عن الدفع لشهر ${data.monthLabelArabic} (${data.lateUnits.length} شقة)`,
    logicalWidth - padX - 18,
    curY + 28
  );

  ctx.textAlign = 'left';
  ctx.font = `700 13px ${fontFamily}`;
  ctx.fillText(
    `إجمالي المتأخرات: ${data.totals.totalLateAmount.toLocaleString('en-US')} ${data.currency}`,
    padX + 18,
    curY + 28
  );

  let lateRowY = curY + 54;

  if (data.lateUnits.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = `800 14px ${fontFamily}`;
    ctx.fillText(
      'جميع الوحدات النشطة مسددة بالكامل لهذا الشهر — شكراً لالتزامكم!',
      logicalWidth / 2,
      lateRowY + 24
    );
  } else {
    data.lateUnits.forEach((u, idx) => {
      const isRightCol = idx % 2 === 0;
      const cellX = isRightCol ? logicalWidth - padX - 10 - colW : padX + 10;
      const cellY = lateRowY + Math.floor(idx / 2) * 42;

      ctx.fillStyle = '#FFF1F2';
      ctx.strokeStyle = '#FECDD3';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cellX, cellY, colW, 36, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillStyle = '#9F1239';
      ctx.font = `800 12.5px ${fontFamily}`;
      ctx.fillText(`شقة (${u.unitNumber})`, cellX + colW - 10, cellY + 23);

      ctx.fillStyle = '#0F172A';
      ctx.font = `700 12.5px ${fontFamily}`;
      const truncatedName =
        u.residentName.length > 24 ? u.residentName.slice(0, 24) + '...' : u.residentName;
      ctx.fillText(truncatedName, cellX + colW - 72, cellY + 23);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#BE123C';
      ctx.font = `800 13px ${fontFamily}`;
      ctx.fillText(
        `مطلوب: ${u.remainingAmount.toLocaleString('en-US')} ${data.currency}`,
        cellX + 10,
        cellY + 23
      );
    });
  }

  // Section 2 Footer Summary
  const lateFooterY = curY + lateSectionHeight - 36;
  ctx.fillStyle = '#FFF1F2';
  drawRoundedRect(ctx, padX + 8, lateFooterY, contentWidth - 16, 28, 6);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9F1239';
  ctx.font = `700 12px ${fontFamily}`;
  ctx.fillText(
    `عدد الشقق المتأخرة: ${data.lateUnits.length} شقة (مع استثناء ${data.exemptUnitsCount} شقق غير مفعلة/شاغرة)`,
    logicalWidth - padX - 20,
    lateFooterY + 19
  );

  ctx.textAlign = 'left';
  ctx.font = `800 12.5px ${fontFamily}`;
  ctx.fillText(
    `إجمالي المتبقي لتحصيله: ${data.totals.totalLateAmount.toLocaleString('en-US')} ${data.currency}`,
    padX + 20,
    lateFooterY + 19
  );

  curY += lateSectionHeight + 20;

  // ---------------------------------------------------------------------------
  // 6. SECTION 3: EXPENSES (المصروفات)
  // ---------------------------------------------------------------------------
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, padX, curY, contentWidth, expenseSectionHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Section 3 Header Bar
  ctx.fillStyle = '#1E293B';
  drawRoundedRect(ctx, padX, curY, contentWidth, 44, 10);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 15px ${fontFamily}`;
  ctx.fillText(
    `ثالثاً: بيان المصروفات لشهر ${data.monthLabelArabic} (${data.expensesList.length} بنود)`,
    logicalWidth - padX - 18,
    curY + 28
  );

  ctx.textAlign = 'left';
  ctx.font = `700 13px ${fontFamily}`;
  ctx.fillText(
    `إجمالي مصروفات الشهر: ${data.totals.monthExpenses.toLocaleString('en-US')} ${data.currency}`,
    padX + 18,
    curY + 28
  );

  // Table Subheader
  const tableHeaderY = curY + 50;
  ctx.fillStyle = '#F1F5F9';
  drawRoundedRect(ctx, padX + 10, tableHeaderY, contentWidth - 20, 30, 6);
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.font = `800 12px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText('م', logicalWidth - padX - 24, tableHeaderY + 20);
  ctx.fillText('بيان المصروف / البند', logicalWidth - padX - 64, tableHeaderY + 20);
  ctx.fillText('التصنيف', logicalWidth - padX - 430, tableHeaderY + 20);
  ctx.fillText('التاريخ', logicalWidth - padX - 590, tableHeaderY + 20);
  ctx.textAlign = 'left';
  ctx.fillText('المبلغ المنصرف', padX + 24, tableHeaderY + 20);

  let expRowY = tableHeaderY + 36;

  if (data.expensesList.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748B';
    ctx.font = `700 13px ${fontFamily}`;
    ctx.fillText('لا توجد مصروفات مسجلة خلال هذا الشهر', logicalWidth / 2, expRowY + 22);
  } else {
    data.expensesList.forEach((exp, idx) => {
      const rY = expRowY + idx * 38;
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, padX + 10, rY, contentWidth - 20, 34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748B';
      ctx.font = `700 12px ${fontFamily}`;
      ctx.fillText(`${idx + 1}`, logicalWidth - padX - 24, rY + 22);

      ctx.fillStyle = '#0F172A';
      ctx.font = `800 13px ${fontFamily}`;
      ctx.fillText(exp.title, logicalWidth - padX - 64, rY + 22);

      ctx.fillStyle = '#475569';
      ctx.font = `600 12px ${fontFamily}`;
      ctx.fillText(exp.categoryLabel, logicalWidth - padX - 430, rY + 22);

      ctx.fillStyle = '#64748B';
      ctx.font = `700 12px ${fontFamily}`;
      ctx.fillText(exp.date, logicalWidth - padX - 590, rY + 22);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#BE123C';
      ctx.font = `800 13.5px ${fontFamily}`;
      ctx.fillText(
        `${exp.amount.toLocaleString('en-US')} ${data.currency}`,
        padX + 24,
        rY + 22
      );
    });
  }

  // Section 3 Footer Summary
  const expFooterY = curY + expenseSectionHeight - 36;
  ctx.fillStyle = '#F1F5F9';
  drawRoundedRect(ctx, padX + 8, expFooterY, contentWidth - 16, 28, 6);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1E293B';
  ctx.font = `700 12px ${fontFamily}`;
  ctx.fillText(
    `إجمالي مصروفات شهر ${data.monthLabelArabic}: ${data.totals.monthExpenses.toLocaleString('en-US')} ${data.currency}`,
    logicalWidth - padX - 20,
    expFooterY + 19
  );

  ctx.textAlign = 'left';
  ctx.font = `800 12.5px ${fontFamily}`;
  ctx.fillText(
    `إجمالي المصروفات التراكمي بالخزينة: ${data.totals.allTimeExpenses.toLocaleString('en-US')} ${data.currency}`,
    padX + 20,
    expFooterY + 19
  );

  curY += expenseSectionHeight + 20;

  // ---------------------------------------------------------------------------
  // 7. BOTTOM OFFICIAL FOOTER & IMAGE GENERATION TIMESTAMP (تاريخ عمل الصورة بالأسفل)
  // ---------------------------------------------------------------------------
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, padX, curY, contentWidth, footerHeight, 12);
  ctx.fill();
  ctx.stroke();

  // Top row inside footer: Final Balance Summary Bar
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = `800 13.5px ${fontFamily}`;
  ctx.fillText(
    `ملخص الخزينة النهائي: إجمالي الوارد (${data.totals.allTimeRevenues.toLocaleString('en-US')} ${data.currency}) - إجمالي المنصرف (${data.totals.allTimeExpenses.toLocaleString('en-US')} ${data.currency}) = المتبقي بالخزينة (${data.totals.treasuryRemainingBalance.toLocaleString('en-US')} ${data.currency})`,
    logicalWidth - padX - 18,
    curY + 32
  );

  // Dashed divider line
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.moveTo(padX + 18, curY + 50);
  ctx.lineTo(logicalWidth - padX - 18, curY + 50);
  ctx.stroke();
  ctx.restore();

  // Bottom row inside footer: Treasurer signature + Official Stamp + Image Generation Timestamp
  const hasStamp = Boolean(loadedImages?.stampImg);
  const sigRightX = hasStamp ? logicalWidth - padX - 78 : logicalWidth - padX - 18;

  if (loadedImages?.stampImg) {
    try {
      ctx.drawImage(loadedImages.stampImg, logicalWidth - padX - 70, curY + 52, 50, 50);
    } catch {
      // ignore stamp draw errors
    }
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = `700 12.5px ${fontFamily}`;
  ctx.fillText(
    `إعداد وإشراف: ${data.treasurerName} — ${data.buildingName}`,
    sigRightX,
    curY + 80
  );

  // Highlighted pill for Image Creation Date at the bottom
  const tsText = `تاريخ ووقت عمل الصورة: ${data.imageGeneratedAtFormatted}`;
  ctx.font = `800 12.5px ${fontFamily}`;
  const tsWidth = Math.max(330, ctx.measureText(tsText).width + 28);
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, padX + 16, curY + 60, tsWidth, 32, 8);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(tsText, padX + 16 + tsWidth / 2, curY + 81);

  return canvas;
}

export const WhatsAppInvoiceImageCard: React.FC<WhatsAppInvoiceImageCardProps> = ({
  invoiceData,
  onRefreshTimestamp,
}) => {
  const [summaryScope, setSummaryScope] = useState<InvoiceSummaryScope>('combined');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'invoice_card' | 'png_image'>('invoice_card');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [loadedAppIconImg, setLoadedAppIconImg] = useState<HTMLImageElement | null>(null);
  const [loadedStampImg, setLoadedStampImg] = useState<HTMLImageElement | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setStatusFeedback({ type, message });
    setTimeout(() => {
      setStatusFeedback(prev => (prev?.message === message ? null : prev));
    }, 5000);
  }, []);

  useEffect(() => {
    if (!invoiceData.appIconUrl) {
      setLoadedAppIconImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedAppIconImg(img);
    img.onerror = () => setLoadedAppIconImg(null);
    img.src = invoiceData.appIconUrl;
  }, [invoiceData.appIconUrl]);

  useEffect(() => {
    if (!invoiceData.officialStampUrl) {
      setLoadedStampImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedStampImg(img);
    img.onerror = () => setLoadedStampImg(null);
    img.src = invoiceData.officialStampUrl;
  }, [invoiceData.officialStampUrl]);

  // Re-generate high-res PNG whenever invoiceData, summaryScope, or branding images change
  useEffect(() => {
    try {
      const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
        appIconImg: loadedAppIconImg,
        stampImg: loadedStampImg,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setPngDataUrl(dataUrl);
    } catch {
      // Ignore in non-canvas environments
    }
  }, [invoiceData, summaryScope, loadedAppIconImg, loadedStampImg]);

  const fileName = `فاتورة-تقرير-${invoiceData.buildingName.replace(/\s+/g, '-')}-${invoiceData.targetMonth}.png`;

  const caption = `📄 فاتورة التقرير المالي الشهري - ${invoiceData.buildingName} (شهر ${invoiceData.monthLabelArabic})\n💰 إجمالي الخزينة: ${invoiceData.totals.allTimeRevenues} ${invoiceData.currency} | المصروفات: ${invoiceData.totals.allTimeExpenses} ${invoiceData.currency} | المتبقي بالخزينة: ${invoiceData.totals.treasuryRemainingBalance} ${invoiceData.currency}`;

  const handleDownloadPng = () => {
    const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
      appIconImg: loadedAppIconImg,
      stampImg: loadedStampImg,
    });
    const dataUrl = canvas.toDataURL('image/png');
    setPngDataUrl(dataUrl);

    void exportOrSharePngImage({
      dataUrl,
      fileName,
      title: `فاتورة التقرير المالي - ${invoiceData.buildingName} (${invoiceData.monthLabelArabic})`,
      captionText: caption,
      preferShare: false,
      openPreviewModal: true,
    });

    showToast(`تم فتح استوديو تجهيز وتحميل صورة الفاتورة (${fileName})!`);
  };

  const handleDirectDownloadToDownloads = async () => {
    const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
      appIconImg: loadedAppIconImg,
      stampImg: loadedStampImg,
    });
    const dataUrl = canvas.toDataURL('image/png');
    setPngDataUrl(dataUrl);

    const res = await executeUnifiedSaveOperation({
      base64OrDataUrl: dataUrl,
      fileName,
      mimeType: 'image/png',
      mode: 'direct_download',
      targetFolder: 'Download',
    });
    showToast(res.stepLabelArabic || `تم تنزيل صورة الفاتورة مباشرة في مجلد التحميلات (Downloads)!`);
  };

  const handleQuickFormatOrZipExport = async (
    fmt: 'png' | 'jpeg' | 'webp' | 'pdf' | 'zip',
    scale: 1 | 2 | 3
  ) => {
    const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
      appIconImg: loadedAppIconImg,
      stampImg: loadedStampImg,
    });
    const dataUrl = canvas.toDataURL('image/png');
    setPngDataUrl(dataUrl);

    if (fmt === 'zip') {
      const pngItem = await transformAndOptimizeImage(dataUrl, fileName, { format: 'png', scale });
      const jpgItem = await transformAndOptimizeImage(dataUrl, fileName, { format: 'jpeg', scale });
      const pdfItem = await transformAndOptimizeImage(dataUrl, fileName, { format: 'pdf', scale });
      const zipBundle = buildMultiFormatZipBundle(
        [
          { fileName: pngItem.fileName, data: pngItem.uint8Bytes },
          { fileName: jpgItem.fileName, data: jpgItem.uint8Bytes },
          { fileName: pdfItem.fileName, data: pdfItem.uint8Bytes },
        ],
        `فاتورة_${invoiceData.buildingName}_${invoiceData.targetMonth}`
      );
      const res = await executeUnifiedSaveOperation({
        base64OrDataUrl: zipBundle.zipBase64,
        fileName: zipBundle.zipFileName,
        mimeType: 'application/zip',
        mode: 'direct_download',
      });
      showToast(res.stepLabelArabic);
      return;
    }

    const transformed = await transformAndOptimizeImage(dataUrl, fileName, {
      format: fmt,
      scale,
    });
    const res = await executeUnifiedSaveOperation({
      base64OrDataUrl: transformed.base64Data,
      fileName: transformed.fileName,
      mimeType: transformed.mimeType,
      mode: 'direct_download',
    });
    showToast(res.stepLabelArabic);
  };

  const handleCopyImageToClipboard = async () => {
    const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
      appIconImg: loadedAppIconImg,
      stampImg: loadedStampImg,
    });
    const dataUrl = canvas.toDataURL('image/png');
    setPngDataUrl(dataUrl);

    const clipRes = await copyImageToSystemClipboard(dataUrl);
    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 3000);
    showToast(clipRes.message);
  };

  const handleShareToWhatsApp = async () => {
    const canvas = renderWhiteInvoiceToCanvas(invoiceData, summaryScope, {
      appIconImg: loadedAppIconImg,
      stampImg: loadedStampImg,
    });
    const dataUrl = canvas.toDataURL('image/png');
    setPngDataUrl(dataUrl);

    await exportOrSharePngImage({
      dataUrl,
      fileName,
      title: `فاتورة ${invoiceData.buildingName} - ${invoiceData.monthLabelArabic}`,
      captionText: caption,
      preferShare: true,
      openPreviewModal: true,
    });

    showToast(
      'تم تجهيز صورة الفاتورة البيضاء للمشاركة والإرسال على واتساب بنجاح!'
    );
  };

  const primaryRev =
    summaryScope === 'month_only'
      ? invoiceData.totals.monthRevenues
      : invoiceData.totals.allTimeRevenues;
  const primaryExp =
    summaryScope === 'month_only'
      ? invoiceData.totals.monthExpenses
      : invoiceData.totals.allTimeExpenses;
  const primaryRem =
    summaryScope === 'month_only'
      ? invoiceData.totals.monthNetRemaining
      : invoiceData.totals.treasuryRemainingBalance;

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-base text-slate-900">
              صورة الفاتورة البيضاء للتقرير المالي (جاهزة للإرسال على واتساب)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            فاتورة رسمية بيضاء عالية الدقة تشمل من قام بالدفع، المتأخرين، المصروفات، إجمالي الخزينة والمتبقي، وتاريخ عمل الصورة بالأسفل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Summary Mode Selector */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSummaryScope('combined')}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                summaryScope === 'combined'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              إجمالي الخزينة + الشهر
            </button>
            <button
              type="button"
              onClick={() => setSummaryScope('month_only')}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                summaryScope === 'month_only'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              أرقام الشهر فقط
            </button>
          </div>

          {onRefreshTimestamp && (
            <button
              type="button"
              onClick={onRefreshTimestamp}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition whitespace-nowrap shrink-0"
              title="تحديث تاريخ ووقت عمل الصورة بالأسفل للوقت الحالي"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>تحديث وقت الصورة</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'invoice_card' ? 'png_image' : 'invoice_card')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition whitespace-nowrap shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>{viewMode === 'invoice_card' ? 'عرض كصورة PNG مباشرة' : 'عرض التصميم التفاعلي'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareToWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            title="مشاركة صورة الفاتورة فوراً عبر واتساب والتطبيقات"
          >
            <Share2 className="w-4 h-4 text-emerald-100" />
            <span>مشاركة للواتساب</span>
          </button>

          <UnifiedExportSplitButton
            primaryLabel="تنزيل فوري"
            onPrimaryAction={handleDirectDownloadToDownloads}
            onShareWhatsApp={handleShareToWhatsApp}
            onSaveAsBrowse={handleDownloadPng}
            onCopyToClipboard={handleCopyImageToClipboard}
            onOpenStudioModal={handleDownloadPng}
            onQuickFormatExport={handleQuickFormatOrZipExport}
            kind="image"
            testIdPrefix="invoice-split"
          />

          <button
            type="button"
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            title="فتح نافذة خيارات الحفظ وتغيير الصيغ (PNG / JPG / WEBP / PDF / ZIP) وتصفح المجلدات"
          >
            <FolderOpen className="w-4 h-4 text-amber-300" />
            <span>استوديو الصيغ والحفظ</span>
          </button>

          <button
            type="button"
            onClick={handleCopyImageToClipboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedImage ? 'تم النسخ!' : 'نسخ (Ctrl+V)'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-indigo-50 border-indigo-300 text-indigo-900'
          }`}
        >
          <span>{statusFeedback.message}</span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-xs underline mr-4"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Mode 1: Direct Generated PNG Image View (for mobile long-press / visual proof of image output) */}
      {viewMode === 'png_image' && pngDataUrl && (
        <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-300 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>🖼️ المخرج النهائي كصورة PNG (يمكنك الضغط المطول على الصورة في الهاتف لحفظها أو مشاركتها مباشرة على واتساب):</span>
            <span className="font-mono text-slate-500">{fileName}</span>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 max-w-4xl mx-auto">
            <img
              src={pngDataUrl}
              alt={`فاتورة التقرير المالي - ${invoiceData.buildingName} - ${invoiceData.monthLabelArabic}`}
              className="w-full h-auto block"
            />
          </div>
        </div>
      )}

      {/* Mode 2: Crisp White Official Invoice Card (فاتورة بيضاء) */}
      {viewMode === 'invoice_card' && (
        <div
          id="whatsapp-white-invoice-sheet"
          className="bg-white text-slate-900 rounded-2xl border-2 border-slate-300 shadow-md max-w-4xl mx-auto overflow-hidden"
        >
          {/* Top Official Dark Stripe */}
          <div className="h-2.5 bg-slate-900 w-full" />

          <div className="p-6 sm:p-8 space-y-6 bg-white">
            {/* 1. Invoice Header */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {invoiceData.appIconUrl && (
                  <img
                    data-testid="invoice-card-app-icon"
                    src={invoiceData.appIconUrl}
                    alt={invoiceData.buildingName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <Receipt className="w-4 h-4" />
                    <span>فاتورة وتقرير مالي رسمي للعمارة</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    {!invoiceData.appIconUrl && <Building2 className="w-6 h-6 text-slate-800" />}
                    <span>{invoiceData.buildingName}</span>
                  </h2>
                  <p className="text-xs font-bold text-slate-600">
                    إشراف وأمانة الصندوق: <span className="text-slate-900">{invoiceData.treasurerName}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl px-5 py-3 border-2 border-emerald-500 text-center min-w-[220px] shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-black text-base">
                  <Calendar className="w-4 h-4" />
                  <span>شهر: {invoiceData.monthLabelArabic}</span>
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1 font-mono tabular-nums">
                  تاريخ التقرير: {invoiceData.reportIssueDate}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5 font-mono tabular-nums">
                  الفترة المحاسبية: {invoiceData.targetMonth}
                </div>
              </div>
            </div>

            {/* 2. Three Financial Summary Cards (إجمالي المبالغ بالخزينة / إجمالي المصروفات / المتبقي) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Treasury / Revenues */}
              <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-4 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-900">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>
                    {summaryScope === 'month_only'
                      ? 'إجمالي تحصيلات الشهر بالخزينة'
                      : 'إجمالي المبالغ بالخزينة (الوارد)'}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                  {formatMoney(primaryRev, invoiceData.currency)}
                </div>
                <div className="text-[11px] font-bold text-emerald-800 pt-1 border-t border-emerald-200/80 font-mono tabular-nums">
                  {summaryScope === 'month_only'
                    ? `إجمالي الخزينة الكلي: ${formatMoney(invoiceData.totals.allTimeRevenues, invoiceData.currency)}`
                    : `تحصيل شهر ${invoiceData.monthLabelArabic}: ${formatMoney(invoiceData.totals.monthRevenues, invoiceData.currency)}`}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-rose-50/90 border border-rose-300 rounded-xl p-4 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-rose-900">
                  <TrendingDown className="w-4 h-4 text-rose-700" />
                  <span>
                    {summaryScope === 'month_only'
                      ? 'إجمالي مبالغ مصروفات الشهر'
                      : 'إجمالي مبالغ المصروفات'}
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-700 font-mono tabular-nums">
                  {formatMoney(primaryExp, invoiceData.currency)}
                </div>
                <div className="text-[11px] font-bold text-rose-800 pt-1 border-t border-rose-200/80 font-mono tabular-nums">
                  {summaryScope === 'month_only'
                    ? `إجمالي المصروفات الكلي: ${formatMoney(invoiceData.totals.allTimeExpenses, invoiceData.currency)}`
                    : `مصروفات شهر ${invoiceData.monthLabelArabic}: ${formatMoney(invoiceData.totals.monthExpenses, invoiceData.currency)}`}
                </div>
              </div>

              {/* Remaining Balance */}
              <div className="bg-indigo-50/90 border border-indigo-300 rounded-xl p-4 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-indigo-950">
                  <Wallet className="w-4 h-4 text-indigo-700" />
                  <span>المتبقي الفعلي بالخزينة (الصافي)</span>
                </div>
                <div className="text-2xl font-black text-indigo-700 font-mono tabular-nums">
                  {formatMoney(primaryRem, invoiceData.currency)}
                </div>
                <div className="text-[11px] font-bold text-indigo-900 pt-1 border-t border-indigo-200/80 font-mono tabular-nums">
                  {summaryScope === 'month_only'
                    ? `الرصيد الفعلي بالخزينة: ${formatMoney(invoiceData.totals.treasuryRemainingBalance, invoiceData.currency)}`
                    : `صافي شهر ${invoiceData.monthLabelArabic}: ${invoiceData.totals.monthNetRemaining >= 0 ? '+' : ''}${formatMoney(invoiceData.totals.monthNetRemaining, invoiceData.currency)}`}
                </div>
              </div>
            </div>

            {/* 3. Section 1: Who Paid (من قام بالدفع) */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    أولاً: كشف من قام بالدفع لشهر {invoiceData.monthLabelArabic} ({invoiceData.paidUnits.length} شقة)
                  </span>
                </div>
                <span className="text-xs font-extrabold bg-emerald-700 px-2.5 py-1 rounded-lg font-mono tabular-nums">
                  إجمالي المحصل: {formatMoney(invoiceData.totals.monthRevenues, invoiceData.currency)}
                </span>
              </div>

              <div className="p-4">
                {invoiceData.paidUnits.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4 font-bold">
                    لا توجد دفعات مسجلة لهذا الشهر حتى الآن.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {invoiceData.paidUnits.map(unit => (
                      <div
                        key={unit.unitId}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black text-xs rounded-md shrink-0 font-mono tabular-nums">
                            شقة {unit.unitNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {unit.residentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums hidden sm:inline">
                            {unit.paymentDate}
                          </span>
                          <span className="font-black text-xs text-emerald-700 font-mono tabular-nums">
                            {formatMoney(unit.paidAmount, invoiceData.currency)} ✓
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs font-extrabold text-emerald-900 bg-emerald-50/60 px-3 py-2 rounded-lg">
                  <span>إجمالي عدد الشقق المسددة: {invoiceData.paidUnits.length} شقة</span>
                  <span className="font-mono tabular-nums">
                    إجمالي المسدد: {formatMoney(invoiceData.totals.monthRevenues, invoiceData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Section 2: Who is Late (من تأخر عن الدفع) */}
            <div className="border border-rose-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    ثانياً: كشف من تأخر عن الدفع لشهر {invoiceData.monthLabelArabic} ({invoiceData.lateUnits.length} شقة)
                  </span>
                </div>
                <span className="text-xs font-extrabold bg-rose-700 px-2.5 py-1 rounded-lg font-mono tabular-nums">
                  إجمالي المتأخرات: {formatMoney(invoiceData.totals.totalLateAmount, invoiceData.currency)}
                </span>
              </div>

              <div className="p-4">
                {invoiceData.lateUnits.length === 0 ? (
                  <div className="text-center py-4 text-emerald-700 font-extrabold text-xs bg-emerald-50 rounded-lg border border-emerald-200">
                    🎉 جميع الوحدات النشطة مسددة بالكامل لهذا الشهر — شكراً لالتزام جميع السكان!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {invoiceData.lateUnits.map(unit => (
                      <div
                        key={unit.unitId}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-black text-xs rounded-md shrink-0 font-mono tabular-nums">
                            شقة {unit.unitNumber}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {unit.residentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-xs text-rose-700 font-mono tabular-nums">
                            مطلوب: {formatMoney(unit.remainingAmount, invoiceData.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-extrabold text-rose-900 bg-rose-50/50 px-3 py-2 rounded-lg">
                  <span>
                    إجمالي المتأخرين عن الشهر: {invoiceData.lateUnits.length} شقة (مع استثناء {invoiceData.exemptUnitsCount} شقق غير مفعلة/شاغرة)
                  </span>
                  <span className="font-mono tabular-nums">
                    إجمالي المتبقي للتحصيل: {formatMoney(invoiceData.totals.totalLateAmount, invoiceData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Section 3: Expenses List (المصروفات) */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>
                    ثالثاً: بيان المصروفات لشهر {invoiceData.monthLabelArabic} ({invoiceData.expensesList.length} بنود)
                  </span>
                </div>
                <span className="text-xs font-extrabold bg-slate-700 px-2.5 py-1 rounded-lg font-mono tabular-nums">
                  إجمالي مصروفات الشهر: {formatMoney(invoiceData.totals.monthExpenses, invoiceData.currency)}
                </span>
              </div>

              <div className="p-4">
                {invoiceData.expensesList.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4 font-bold">
                    لا توجد مصروفات مسجلة خلال هذا الشهر.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10">م</th>
                          <th className="py-2.5 px-3">بيان المصروف / البند</th>
                          <th className="py-2.5 px-3">التصنيف</th>
                          <th className="py-2.5 px-3">التاريخ</th>
                          <th className="py-2.5 px-3 text-left">المبلغ المنصرف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {invoiceData.expensesList.map((exp, idx) => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500 font-bold tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-slate-900">{exp.title}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-semibold">
                              {exp.categoryLabel}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">
                              {exp.date}
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-black text-rose-700 tabular-nums">
                              {formatMoney(exp.amount, invoiceData.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">
                  <span className="font-mono tabular-nums">
                    إجمالي مصروفات شهر {invoiceData.monthLabelArabic}: {formatMoney(invoiceData.totals.monthExpenses, invoiceData.currency)}
                  </span>
                  <span className="font-mono tabular-nums">
                    إجمالي المصروفات التراكمي بالخزينة: {formatMoney(invoiceData.totals.allTimeExpenses, invoiceData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Official Invoice Bottom Footer & Image Generation Timestamp (تاريخ عمل الصورة بالأسفل) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-dashed border-slate-300">
                <span>📌 ملخص الخزينة النهائي ({invoiceData.buildingName}):</span>
                <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
                  <span className="text-emerald-700">
                    إجمالي الخزينة: {formatMoney(invoiceData.totals.allTimeRevenues, invoiceData.currency)}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-rose-700">
                    إجمالي المصروفات: {formatMoney(invoiceData.totals.allTimeExpenses, invoiceData.currency)}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    المتبقي بالخزينة: {formatMoney(invoiceData.totals.treasuryRemainingBalance, invoiceData.currency)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  {invoiceData.officialStampUrl ? (
                    <img
                      data-testid="invoice-card-official-stamp"
                      src={invoiceData.officialStampUrl}
                      alt="الختم الرسمي للعقار"
                      className="w-16 h-16 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-600/50 flex flex-col items-center justify-center text-[9px] text-emerald-800 font-black leading-tight text-center shrink-0">
                      <span>ختم الإدارة</span>
                      <span className="text-[7px] text-slate-500">معتمد</span>
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-700">
                    توقيع وختم إدارة العقار: <span className="font-black text-slate-900">{invoiceData.treasurerName}</span>
                  </div>
                </div>

                {/* Required Bottom Timestamp for Image Creation */}
                <div
                  data-testid="invoice-image-timestamp"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-extrabold font-mono tabular-nums"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تاريخ ووقت عمل الصورة: {invoiceData.imageGeneratedAtFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
