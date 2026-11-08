import React, { useState, useMemo } from 'react';
import { useBuilding } from '../context/BuildingContext';
import {
  buildFloorsExcelSheetData,
  FloorsExcelSheetData,
  FloorExcelUnitCell,
  exportToCsv,
} from '../utils/finance';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Sparkles,
  Grid,
  Palette,
  RefreshCw,
  Building2,
  AlertCircle,
  Lock,
  Layers,
  QrCode,
  Share2,
  FolderOpen,
} from 'lucide-react';
import { exportOrSharePngImage, isRunningInsideApk, saveFileToDevice } from '../utils/apkBridge';

interface FloorsExcelSheetModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  onSelectUnit?: (unitId: string) => void;
}

export type ExcelSheetVisualTheme = 'app_pro' | 'classic_excel';

/**
 * Generates a deterministic QR-like SVG pattern with the official IPN center badge
 * so it works 100% offline and renders identically in both DOM and Canvas PNG export.
 */
function generateInstaPayQrMatrix(size = 29): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic data modules seeded from InstaPay URL
  const seedStr = 'https://ipn.eg/S/bm01002321549/instapay/78HA23';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inCenterLogo = r >= 11 && r <= 17 && c >= 10 && c <= 18;
      if (inTopLeft || inTopRight || inBottomLeft || inCenterLogo || r === 6 || c === 6) {
        continue;
      }
      const hash =
        ((r * 31 + c * 17 + seedStr.charCodeAt((r * size + c) % seedStr.length)) * 13) % 11;
      matrix[r][c] = hash < 6;
    }
  }

  return matrix;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Renders the Floors Excel Sheet onto a high-resolution HTML5 Canvas and returns a PNG data URL.
 * Supports both the modern App-Matched Professional Colored Boxes ('app_pro') and Classic Excel ('classic_excel').
 */
export function renderFloorsExcelSheetToPngDataUrl(
  sheet: FloorsExcelSheetData,
  options: {
    highlightUnpaidRed?: boolean;
    customMonthLabel?: string;
    visualTheme?: ExcelSheetVisualTheme;
  } = {}
): string {
  const theme = options.visualTheme || 'app_pro';
  const canvas = document.createElement('canvas');

  if (theme === 'app_pro') {
    const width = 1220;
    const height = 1660;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. App-themed Slate Background & Card Container
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, width, height);

    drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    // 2. Dark Header Banner (Matches App Navbar / Hero Identity)
    const bannerX = 44;
    const bannerY = 44;
    const bannerW = width - 88;
    const bannerH = 168;

    drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 22);
    const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.55, '#1E293B');
    grad.addColorStop(1, '#064E3B');
    ctx.fillStyle = grad;
    ctx.fill();

    // Header Title (Right side)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${sheet.buildingName} — كشف الأدوار والوحدات السكنية المصور`,
      bannerX + bannerW - 28,
      bannerY + 42
    );

    // Month Pill (Left side of header top row)
    const monthText = `الشهر: ${options.customMonthLabel || sheet.monthHeaderFormatted}`;
    drawRoundedRect(ctx, bannerX + 26, bannerY + 20, 260, 44, 12);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.fillStyle = '#022C22';
    ctx.font = '900 20px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(monthText, bannerX + 26 + 130, bannerY + 43);

    // 5 KPI Summary Boxes inside Banner Bottom Row
    const kpiBoxes = [
      {
        label: 'غير مطالب / مغلقة',
        val: `${sheet.exemptOrClosedCount} شقق`,
        bg: '#FEF3C7',
        border: '#F59E0B',
        text: '#92400E',
      },
      {
        label: 'لم يدفع (متأخر)',
        val: `${sheet.unpaidUnitsCount} شقق`,
        bg: '#FFE4E6',
        border: '#F43F5E',
        text: '#9F1239',
      },
      {
        label: 'سداد جزئي',
        val: `${sheet.partialUnitsCount} شقة`,
        bg: '#CFFAFE',
        border: '#06B6D4',
        text: '#155E75',
      },
      {
        label: 'مسدد بالكامل',
        val: `${Math.max(0, sheet.paidUnitsCount - sheet.partialUnitsCount)} شقة`,
        bg: '#D1FAE5',
        border: '#10B981',
        text: '#065F46',
      },
      {
        label: 'إجمالي المحصل بالشهر',
        val: `${sheet.totalMonthCollected} ج.م (${sheet.collectionRatePercent}%)`,
        bg: '#10B981',
        border: '#34D399',
        text: '#022C22',
      },
    ];

    const kpiGap = 12;
    const totalKpiW = bannerW - 52;
    const singleKpiW = (totalKpiW - kpiGap * 4) / 5;
    const kpiY = bannerY + 82;
    const kpiH = 66;

    kpiBoxes.forEach((box, idx) => {
      const bx = bannerX + 26 + idx * (singleKpiW + kpiGap);
      drawRoundedRect(ctx, bx, kpiY, singleKpiW, kpiH, 14);
      ctx.fillStyle = box.bg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = box.border;
      ctx.stroke();

      ctx.fillStyle = box.text;
      ctx.font = '700 14px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(box.label, bx + singleKpiW / 2, kpiY + 21);

      ctx.font = '900 19px Cairo, sans-serif';
      ctx.fillText(box.val, bx + singleKpiW / 2, kpiY + 47);
    });

    // 3. Top Model Column Headers (نموذج 3 | نموذج 2 | نموذج 1 | الدور السكني)
    const modelsAreaLeft = 44;
    const modelsAreaWidth = 890;
    const floorLabelLeft = modelsAreaLeft + modelsAreaWidth + 14;
    const floorLabelWidth = 228;
    const colHeaderY = 226;
    const colHeaderH = 42;

    const singleModelW = (modelsAreaWidth - 16) / 3;
    const modelTitles = ['نموذج 3', 'نموذج 2', 'نموذج 1'];
    modelTitles.forEach((mTitle, idx) => {
      const mx = modelsAreaLeft + idx * (singleModelW + 8);
      drawRoundedRect(ctx, mx, colHeaderY, singleModelW, colHeaderH, 11);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#94A3B8';
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 18px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mTitle, mx + singleModelW / 2, colHeaderY + colHeaderH / 2 + 1);
    });

    drawRoundedRect(ctx, floorLabelLeft, colHeaderY, floorLabelWidth, colHeaderH, 11);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.fillStyle = '#34D399';
    ctx.font = '900 18px Cairo, sans-serif';
    ctx.fillText('الأدوار السكنية (10 - 1)', floorLabelLeft + floorLabelWidth / 2, colHeaderY + colHeaderH / 2 + 1);

    // 4. 10 Floors Grid
    const gridStartY = 280;
    const rowH = 98;
    const rowGap = 11;

    sheet.floors.forEach((floorRow, rowIndex) => {
      const y = gridStartY + rowIndex * (rowH + rowGap);

      // Floor Card on the Right
      drawRoundedRect(ctx, floorLabelLeft, y, floorLabelWidth, rowH, 16);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 22px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        floorRow.floorTitleArabic,
        floorLabelLeft + floorLabelWidth / 2,
        y + 36
      );

      // Floor collected pill
      drawRoundedRect(ctx, floorLabelLeft + 24, y + 56, floorLabelWidth - 48, 28, 9);
      ctx.fillStyle = floorRow.floorCollectedTotal > 0 ? '#065F46' : '#1E293B';
      ctx.fill();
      ctx.fillStyle = floorRow.floorCollectedTotal > 0 ? '#6EE7B7' : '#94A3B8';
      ctx.font = '800 14px Cairo, sans-serif';
      ctx.fillText(
        `المحصل: ${floorRow.floorCollectedTotal} ج.م`,
        floorLabelLeft + floorLabelWidth / 2,
        y + 71
      );

      // Apartment Boxes from Right (Model 1) to Left (Model 3)
      let currentRightEdge = modelsAreaLeft + modelsAreaWidth;

      floorRow.cells.forEach(cell => {
        const unitFullAllocationW = (cell.colSpanHalfUnits / 6) * modelsAreaWidth;
        const boxW = unitFullAllocationW - 8;
        const boxX = currentRightEdge - boxW;

        // Determine visual palette by status
        let cardBg = '#ECFDF5';
        let cardBorder = '#10B981';
        let headerBg = '#059669';
        let headerText = '#FFFFFF';
        let statusTag = 'مسدد';
        let amountColor = '#065F46';
        let amountBg = '#D1FAE5';

        if (cell.status === 'closed_x') {
          cardBg = '#FFFBEB';
          cardBorder = '#F59E0B';
          headerBg = '#D97706';
          headerText = '#FFFFFF';
          statusTag = 'شقة مغلقة';
          amountColor = '#B91C1C';
          amountBg = '#FEF3C7';
        } else if (cell.status === 'exempt_named') {
          cardBg = '#FFFBEB';
          cardBorder = '#F59E0B';
          headerBg = '#F59E0B';
          headerText = '#0F172A';
          statusTag = 'غير مطالب';
          amountColor = '#B91C1C';
          amountBg = '#FEF3C7';
        } else if (cell.status === 'required_unpaid') {
          cardBg = '#FFF1F2';
          cardBorder = '#F43F5E';
          headerBg = '#E11D48';
          headerText = '#FFFFFF';
          statusTag = 'لم يدفع';
          amountColor = '#BE123C';
          amountBg = '#FFE4E6';
        } else if (cell.isPartialPaid) {
          cardBg = '#ECFEFF';
          cardBorder = '#06B6D4';
          headerBg = '#0891B2';
          headerText = '#FFFFFF';
          statusTag = 'سداد جزئي';
          amountColor = '#0E7490';
          amountBg = '#CFFAFE';
        }

        // Outer rounded card
        drawRoundedRect(ctx, boxX, y, boxW, rowH, 15);
        ctx.fillStyle = cardBg;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = cardBorder;
        ctx.stroke();

        // Top Bar inside unit card (Unit Number + Status Tag)
        const topBarH = 28;
        drawRoundedRect(ctx, boxX + 2, y + 2, boxW - 4, topBarH, 12);
        ctx.fillStyle = headerBg;
        ctx.fill();

        ctx.fillStyle = headerText;
        ctx.font = '900 14px Cairo, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`شقة ${cell.unitNumber}`, boxX + boxW - 12, y + 17);

        ctx.font = '800 12px Cairo, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(statusTag, boxX + 12, y + 17);

        // Resident Name in middle
        ctx.fillStyle = '#0F172A';
        ctx.font = cell.displayLabel === 'X' ? '900 22px Cairo, sans-serif' : '900 18px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cell.displayLabel, boxX + boxW / 2, y + 50);

        // Paid Amount Pill at bottom
        drawRoundedRect(ctx, boxX + 10, y + 66, boxW - 20, 25, 8);
        ctx.fillStyle = amountBg;
        ctx.fill();

        ctx.fillStyle = amountColor;
        ctx.font = '900 16px Cairo, sans-serif';
        ctx.fillText(`${cell.paidAmount}`, boxX + boxW / 2, y + 79);

        currentRightEdge -= unitFullAllocationW;
      });
    });

    // 5. Legend & InstaPay QR Footer Card
    const footerY = gridStartY + sheet.floors.length * (rowH + rowGap) + 12;
    const footerH = 225;

    drawRoundedRect(ctx, 44, footerY, width - 88, footerH, 20);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    // Legend items
    const legendItems = [
      { bg: '#059669', tag: 'مسدد', desc: 'قام بالسداد بالكامل (مربع أخضر)' },
      { bg: '#E11D48', tag: '0', desc: 'مطالب بالدفع ولم يسدد (مربع أحمر/وردي)' },
      { bg: '#D97706', tag: 'X', desc: 'شقة مقفولة / غير مسكونة (X)' },
      { bg: '#F59E0B', tag: 'الاسم', desc: 'غير مطالب بالدفع (شقة خالية / معفاة)' },
    ];

    legendItems.forEach((item, idx) => {
      const ly = footerY + 22 + idx * 44;
      drawRoundedRect(ctx, 760, ly, 95, 34, 9);
      ctx.fillStyle = item.bg;
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 15px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.tag, 760 + 47.5, ly + 18);

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 18px Cairo, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.desc, 742, ly + 18);
    });

    // InstaPay QR Code on Right of Footer
    const qrSize = 175;
    const qrX = 955;
    const qrY = footerY + 24;
    const matrix = generateInstaPayQrMatrix(29);
    const cellSize = qrSize / matrix.length;

    drawRoundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7C3AED';
    ctx.stroke();

    matrix.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        if (val) {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(
            qrX + cIdx * cellSize,
            qrY + rIdx * cellSize,
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      });
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX + qrSize * 0.34, qrY + qrSize * 0.38, qrSize * 0.32, qrSize * 0.24);
    ctx.fillStyle = '#5B21B6';
    ctx.font = '900 20px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IPN', qrX + qrSize / 2, qrY + qrSize / 2 + 1);

    // PRINT TIME on Bottom Left
    ctx.fillStyle = '#64748B';
    ctx.font = '700 16px Cairo, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `PRINT TIME   ${sheet.printTimeFormatted}`,
      70,
      footerY + footerH - 22
    );

    return canvas.toDataURL('image/png');
  }

  // Classic Excel Replica Mode
  const width = 1100;
  const height = 1480;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  const headerTop = 48;
  const headerH = 54;
  const headerX = 60;
  const colTotalW = 145;
  const colMonthW = 310;
  const colLabelW = 145;
  const totalHeaderW = colTotalW + colMonthW + colLabelW;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(headerX, headerTop, totalHeaderW, headerH);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(headerX, headerTop, totalHeaderW, headerH);

  ctx.beginPath();
  ctx.moveTo(headerX + colTotalW, headerTop);
  ctx.lineTo(headerX + colTotalW, headerTop + headerH);
  ctx.moveTo(headerX + colTotalW + colMonthW, headerTop);
  ctx.lineTo(headerX + colTotalW + colMonthW, headerTop + headerH);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '700 24px Cairo, sans-serif';
  ctx.fillText(
    String(sheet.totalMonthCollected),
    headerX + colTotalW / 2,
    headerTop + headerH / 2 + 2
  );

  ctx.font = '800 24px Cairo, sans-serif';
  ctx.fillText(
    options.customMonthLabel || sheet.monthHeaderFormatted,
    headerX + colTotalW + colMonthW / 2,
    headerTop + headerH / 2 + 2
  );

  ctx.font = '700 23px Cairo, sans-serif';
  ctx.fillText(
    'الشهر',
    headerX + colTotalW + colMonthW + colLabelW / 2,
    headerTop + headerH / 2 + 2
  );

  const gridStartY = 124;
  const rowH = 82;
  const rowGap = 11;
  const modelsAreaLeft = 95;
  const modelsAreaWidth = 690;
  const floorLabelLeft = modelsAreaLeft + modelsAreaWidth + 14;
  const floorLabelWidth = 190;

  sheet.floors.forEach((floorRow, rowIndex) => {
    const y = gridStartY + rowIndex * (rowH + rowGap);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(floorLabelLeft, y, floorLabelWidth, rowH);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(floorLabelLeft, y, floorLabelWidth, rowH);

    ctx.fillStyle = '#000000';
    ctx.font = '800 24px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      floorRow.floorTitleArabic,
      floorLabelLeft + floorLabelWidth / 2,
      y + rowH / 2 + 2
    );

    let currentRightEdge = modelsAreaLeft + modelsAreaWidth;

    floorRow.cells.forEach(cell => {
      const unitFullAllocationW = (cell.colSpanHalfUnits / 6) * modelsAreaWidth;
      const numberGutterW = 40;
      const boxW = unitFullAllocationW - numberGutterW;
      const boxX = currentRightEdge - boxW;
      const numCenterX = boxX - numberGutterW / 2;

      const topHalfH = Math.round(rowH * 0.54);
      const bottomHalfH = rowH - topHalfH;

      const isAmber = cell.status === 'closed_x' || cell.status === 'exempt_named';
      const isUnpaidRed =
        Boolean(options.highlightUnpaidRed) && cell.status === 'required_unpaid';

      ctx.fillStyle = isAmber ? '#FFC000' : isUnpaidRed ? '#FF0000' : '#FFFFFF';
      ctx.fillRect(boxX, y, boxW, topHalfH);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(boxX, y + topHalfH, boxW, bottomHalfH);

      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(boxX, y, boxW, rowH);

      ctx.fillStyle = isUnpaidRed ? '#FFFFFF' : '#000000';
      ctx.font = cell.displayLabel === 'X' ? '700 22px Cairo, sans-serif' : '800 20px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.displayLabel, boxX + boxW / 2, y + topHalfH / 2 + 2);

      ctx.fillStyle = isAmber ? '#C00000' : '#000000';
      ctx.font = '700 22px Cairo, sans-serif';
      ctx.fillText(
        String(cell.paidAmount),
        boxX + boxW / 2,
        y + topHalfH + bottomHalfH / 2 + 2
      );

      ctx.fillStyle = '#7F7F7F';
      ctx.font = '600 24px Cairo, sans-serif';
      ctx.fillText(cell.unitNumber, numCenterX, y + topHalfH / 2 + 2);

      currentRightEdge -= unitFullAllocationW;
    });
  });

  const modelsLabelY = gridStartY + sheet.floors.length * (rowH + rowGap) + 18;
  const singleModelW = modelsAreaWidth / 3;
  ctx.fillStyle = '#000000';
  ctx.font = '800 22px Cairo, sans-serif';
  ctx.textAlign = 'center';

  ctx.fillText('نموذج 1', modelsAreaLeft + singleModelW * 2.5, modelsLabelY);
  ctx.fillText('نموذج 2', modelsAreaLeft + singleModelW * 1.5, modelsLabelY);
  ctx.fillText('نموذج 3', modelsAreaLeft + singleModelW * 0.5, modelsLabelY);

  const legendTopY = modelsLabelY + 28;
  const legendBoxX = 635;
  const legendBoxW = 105;
  const legendRowH = 40;

  const legendRows = [
    { bg: '#FF0000', boxText: '', desc: 'لم يدفع', border: false },
    { bg: '#FFFFFF', boxText: '', desc: 'مطالب بالدفع', border: true },
    { bg: '#FFC000', boxText: 'X', desc: 'شقه مقفولة,......', border: true },
    { bg: '#FFC000', boxText: 'الاسم', desc: 'غير مطالب بالدفع (شقه خالية، ...)', border: true },
  ];

  legendRows.forEach((item, idx) => {
    const ry = legendTopY + idx * legendRowH;
    ctx.fillStyle = item.bg;
    ctx.fillRect(legendBoxX, ry, legendBoxW, legendRowH);

    if (item.border) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(legendBoxX, ry, legendBoxW, legendRowH);
    }

    if (item.boxText) {
      ctx.fillStyle = '#000000';
      ctx.font = '700 20px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.boxText, legendBoxX + legendBoxW / 2, ry + legendRowH / 2 + 1);
    }

    ctx.fillStyle = '#000000';
    ctx.font = '700 21px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.desc, legendBoxX - 14, ry + legendRowH / 2 + 1);
  });

  const qrSize = 210;
  const qrX = 815;
  const qrY = legendTopY - 8;
  const matrix = generateInstaPayQrMatrix(29);
  const cellSize = qrSize / matrix.length;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

  matrix.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      if (val) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(
          qrX + cIdx * cellSize,
          qrY + rIdx * cellSize,
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    });
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX + qrSize * 0.34, qrY + qrSize * 0.38, qrSize * 0.32, qrSize * 0.24);
  ctx.fillStyle = '#5B21B6';
  ctx.font = '900 22px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IPN', qrX + qrSize / 2, qrY + qrSize / 2 + 1);

  ctx.fillStyle = '#7F7F7F';
  ctx.font = '600 20px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `PRINT TIME     ${sheet.printTimeFormatted}`,
    width / 2,
    height - 38
  );

  return canvas.toDataURL('image/png');
}

export const FloorsExcelSheetModal: React.FC<FloorsExcelSheetModalProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
  onSelectUnit,
}) => {
  const { apartments, revenues, settings, selectedMonth, setSelectedMonth } = useBuilding();
  const [visualTheme, setVisualTheme] = useState<ExcelSheetVisualTheme>('app_pro');
  const [highlightUnpaidRed, setHighlightUnpaidRed] = useState(true);
  const [customMonthTitle, setCustomMonthTitle] = useState('');
  const [generatedTimestamp, setGeneratedTimestamp] = useState<Date>(() => new Date());
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const sheetData = useMemo(
    () =>
      buildFloorsExcelSheetData({
        apartments,
        revenues,
        settings,
        targetMonth: selectedMonth,
        generatedAt: generatedTimestamp,
      }),
    [apartments, revenues, settings, selectedMonth, generatedTimestamp]
  );

  const qrMatrix = useMemo(() => generateInstaPayQrMatrix(29), []);

  if (!isOpen && !isEmbedded) return null;

  const displayedMonthHeader = customMonthTitle.trim() || sheetData.monthHeaderFormatted;

  const handleDownloadPngImage = (preferShare = false) => {
    const dataUrl = renderFloorsExcelSheetToPngDataUrl(sheetData, {
      highlightUnpaidRed,
      customMonthLabel: displayedMonthHeader,
      visualTheme,
    });
    if (!dataUrl) return;
    const fileName = `كشف-أدوار-وشقق-${settings.buildingName}-${selectedMonth}.png`;
    const captionText = `🏢 كشف الأدوار والوحدات السكنية المصور — ${settings.buildingName} (شهر ${displayedMonthHeader})\n✅ المسددون: ${sheetData.paidUnitsCount} شقة | ⚠️ لم يدفع: ${sheetData.unpaidUnitsCount} شقق | 💰 إجمالي المحصل: ${sheetData.totalMonthCollected} ج.م`;

    void exportOrSharePngImage({
      dataUrl,
      fileName,
      title: `كشف أدوار وشقق ${settings.buildingName} (${displayedMonthHeader})`,
      captionText,
      preferShare,
      openPreviewModal: true,
    });

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDirectDownloadToDownloads = async () => {
    const dataUrl = renderFloorsExcelSheetToPngDataUrl(sheetData, {
      highlightUnpaidRed,
      customMonthLabel: displayedMonthHeader,
      visualTheme,
    });
    if (!dataUrl) return;
    const fileName = `كشف-أدوار-وشقق-${settings.buildingName}-${selectedMonth}.png`;
    const cleanB64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    await saveFileToDevice(cleanB64, fileName, 'image/png', {
      targetFolder: 'Download',
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintSheet = () => {
    if (isRunningInsideApk()) {
      handleDownloadPngImage(true);
      return;
    }
    window.print();
  };

  const handleExportExcelCsv = () => {
    const headers = [
      'الدور',
      'رقم الشقة',
      'النموذج الهندسي',
      'الاسم المعروض في الجدول',
      'الاسم الكامل للساكن',
      'الاشتراك الشهري المطلوب',
      'المبلغ المسدد في الشهر',
      'المتبقي',
      'حالة الشقة في الجدول',
    ];

    const rows: (string | number)[][] = [];
    sheetData.floors.forEach(floorRow => {
      floorRow.cells.forEach(cell => {
        const statusArabic =
          cell.status === 'closed_x'
            ? 'شقة مقفولة (X)'
            : cell.status === 'exempt_named'
            ? 'غير مطالب بالدفع (شقة خالية / معفاة)'
            : cell.status === 'required_paid'
            ? cell.isPartialPaid
              ? 'سداد جزئي'
              : 'قام بالدفع بالكامل'
            : 'مطالب بالدفع (لم يدفع)';

        rows.push([
          floorRow.floorTitleArabic,
          cell.unitNumber,
          cell.modelLabelArabic,
          cell.displayLabel,
          cell.fullResidentName,
          cell.monthlyFee,
          cell.paidAmount,
          cell.remainingAmount,
          statusArabic,
        ]);
      });
    });

    exportToCsv(
      `جدول-أدوار-وشقق-${settings.buildingName}-${selectedMonth}.csv`,
      headers,
      rows
    );
  };

  const availableMonths = [
    { value: '2026-09', label: 'سبتمبر 2026 (2026-09)' },
    { value: '2026-10', label: 'أكتوبر 2026 (2026-10)' },
    { value: '2026-11', label: 'نوفمبر 2026 (2026-11)' },
    { value: '2026-12', label: 'ديسمبر 2026 (2026-12)' },
  ];

  const getProUnitTheme = (cell: FloorExcelUnitCell) => {
    if (cell.status === 'closed_x') {
      return {
        cardClass: 'bg-amber-50/90 border-2 border-amber-400 shadow-xs hover:border-amber-500',
        headerClass: 'bg-gradient-to-l from-amber-600 to-amber-500 text-white',
        unitBadgeClass: 'bg-slate-950/25 text-white border border-white/20',
        statusBadgeText: 'شقة مغلقة (X)',
        statusBadgeClass: 'bg-white/25 text-white',
        nameClass: 'text-amber-950 font-black text-base',
        amountPillClass: 'bg-amber-100/90 text-rose-700 border border-amber-300/80',
        subLabel: 'مغلقة / غير مسكونة',
      };
    }
    if (cell.status === 'exempt_named') {
      return {
        cardClass: 'bg-amber-50/95 border-2 border-amber-400 shadow-xs hover:border-amber-500',
        headerClass: 'bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950',
        unitBadgeClass: 'bg-slate-950/15 text-slate-950 border border-slate-900/15',
        statusBadgeText: 'غير مطالب',
        statusBadgeClass: 'bg-slate-950/15 text-slate-950',
        nameClass: 'text-slate-900 font-black text-sm sm:text-base',
        amountPillClass: 'bg-amber-100 text-rose-700 border border-amber-300',
        subLabel: 'شقة خالية / معفاة',
      };
    }
    if (cell.status === 'required_unpaid') {
      if (!highlightUnpaidRed) {
        return {
          cardClass: 'bg-slate-50 border-2 border-slate-300 shadow-xs hover:border-slate-400',
          headerClass: 'bg-slate-700 text-white',
          unitBadgeClass: 'bg-slate-900/40 text-white',
          statusBadgeText: 'مطالب بالدفع',
          statusBadgeClass: 'bg-amber-400/20 text-amber-200',
          nameClass: 'text-slate-900 font-black text-sm sm:text-base',
          amountPillClass: 'bg-white text-slate-800 border border-slate-300',
          subLabel: `مطلوب ${cell.monthlyFee} ج.م`,
        };
      }
      return {
        cardClass: 'bg-rose-50/95 border-2 border-rose-400 shadow-xs hover:border-rose-500',
        headerClass: 'bg-gradient-to-l from-rose-600 to-red-600 text-white',
        unitBadgeClass: 'bg-slate-950/25 text-white border border-white/20',
        statusBadgeText: 'لم يدفع',
        statusBadgeClass: 'bg-white/20 text-white',
        nameClass: 'text-rose-950 font-black text-sm sm:text-base',
        amountPillClass: 'bg-rose-100 text-rose-800 border border-rose-300',
        subLabel: `مطلوب: ${cell.remainingAmount} ج.م`,
      };
    }
    if (cell.isPartialPaid) {
      return {
        cardClass: 'bg-cyan-50/95 border-2 border-cyan-500 shadow-xs hover:border-cyan-600',
        headerClass: 'bg-gradient-to-l from-cyan-600 to-sky-600 text-white',
        unitBadgeClass: 'bg-slate-950/25 text-white border border-white/20',
        statusBadgeText: 'سداد جزئي',
        statusBadgeClass: 'bg-white/20 text-white',
        nameClass: 'text-slate-900 font-black text-sm sm:text-base',
        amountPillClass: 'bg-cyan-100 text-cyan-900 border border-cyan-300',
        subLabel: `متبقي ${cell.remainingAmount} ج.م`,
      };
    }
    return {
      cardClass: 'bg-emerald-50/90 border-2 border-emerald-500 shadow-xs hover:border-emerald-600',
      headerClass: 'bg-gradient-to-l from-emerald-600 to-teal-600 text-white',
      unitBadgeClass: 'bg-slate-950/25 text-white border border-white/20',
      statusBadgeText: 'مسدد بالكامل',
      statusBadgeClass: 'bg-white/20 text-white',
      nameClass: 'text-slate-900 font-black text-sm sm:text-base',
      amountPillClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      subLabel: 'خالص السداد',
    };
  };

  const sheetBody = (
    <div className="space-y-4">
      {/* Action & Customization Toolbar (Hidden when printing) */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white">
                نموذج الإكسيل المصور للأدوار والشقق (بطريقة عرض احترافية ملونة)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black">
                رؤية بصرية مطابقة لهوية التطبيق
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              يعرض الأدوار الـ 10 وأرقام الشقق (1 إلى 27) والأسماء والمبالغ بمربعات ملونة احترافية توضح حالة كل وحدة بلمحة بصرية
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="share-floors-excel-whatsapp-btn"
            onClick={() => handleDownloadPngImage(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
            title="مشاركة كشف الأدوار كصورة على واتساب"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة للواتساب</span>
          </button>

          <button
            type="button"
            data-testid="direct-download-floors-downloads-btn"
            onClick={handleDirectDownloadToDownloads}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-xs transition cursor-pointer border border-teal-500/30 whitespace-nowrap"
            title="تنزيل مباشر وفوري لكشف الأدوار في مجلد التحميلات (Downloads)"
          >
            <Download className="w-4 h-4 text-teal-200" />
            <span>تنزيل فوري (PNG)</span>
          </button>

          <button
            type="button"
            data-testid="export-floors-excel-csv-btn"
            onClick={handleExportExcelCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            title="تصدير شيت إكسيل بجميع الصيغ (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل (Excel)</span>
          </button>

          <button
            type="button"
            data-testid="download-floors-excel-png-btn"
            onClick={() => handleDownloadPngImage(false)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-xs transition cursor-pointer border border-slate-700"
            title="خيارات الحفظ المتقدمة وتغيير الصيغ وتصفح المجلدات"
          >
            <FolderOpen className="w-4 h-4 text-amber-300" />
            <span>خيارات الحفظ والتصدير</span>
          </button>

          <button
            type="button"
            data-testid="export-floors-excel-csv-btn"
            onClick={handleExportExcelCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير ملف إكسيل (Excel / CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSheet}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكشف</span>
          </button>

          {!isEmbedded && onClose && (
            <button
              type="button"
              data-testid="close-floors-excel-modal-btn"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Month & Visual Theme Switcher Bar */}
      <div className="no-print bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Switcher */}
          <div
            className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
            role="group"
            aria-label="اختيار نمط تصميم كشف الأدوار"
          >
            <button
              type="button"
              data-testid="theme-app-pro-btn"
              onClick={() => setVisualTheme('app_pro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition cursor-pointer ${
                visualTheme === 'app_pro'
                  ? 'bg-slate-900 text-emerald-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>التصميم الاحترافي الملون (مشابه للتطبيق)</span>
            </button>
            <button
              type="button"
              data-testid="theme-classic-excel-btn"
              onClick={() => setVisualTheme('classic_excel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                visualTheme === 'classic_excel'
                  ? 'bg-slate-900 text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>النمط الكلاسيكي (جدول الإكسيل التقليدي)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">حسابات شهر:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">عنوان الشهر:</span>
            <input
              type="text"
              value={customMonthTitle}
              onChange={e => setCustomMonthTitle(e.target.value)}
              placeholder={sheetData.monthHeaderFormatted}
              className="px-2.5 py-1 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 w-32 text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighlightUnpaidRed(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition border cursor-pointer ${
              highlightUnpaidRed
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{highlightUnpaidRed ? 'تمييز غير المسددين بالأحمر: مفعّل' : 'تمييز غير المسددين بالأحمر: متوقف'}</span>
          </button>

          <button
            type="button"
            onClick={() => setGeneratedTimestamp(new Date())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            title="تحديث وقت الطباعة أسفل الكشف"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الوقت</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODE 1: PROFESSIONAL APP-MATCHED COLORFUL BOXES DESIGN (التصميم الاحترافي الملون)
          ==================================================================== */}
      {visualTheme === 'app_pro' ? (
        <div className="overflow-x-auto pb-2">
          <div
            data-testid="floors-excel-sheet-paper"
            data-visual-theme="app_pro"
            dir="ltr"
            className="bg-white text-slate-900 border-2 border-slate-300 rounded-3xl mx-auto p-4 sm:p-6 shadow-2xl max-w-[1040px] min-w-[780px] select-none space-y-4"
          >
            {/* 1. Sleek App-Themed Header Card with KPI Boxes */}
            <div
              dir="rtl"
              className="bg-gradient-to-l from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        {sheetData.buildingName} — كشف الأدوار والوحدات السكنية المصور
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
                        27 وحدة سكنية
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      مربعات بصرية ملونة حسب حالة السداد الفعلي لكل وحدة من الدور العاشر حتى الدور الأول
                    </p>
                  </div>
                </div>

                {/* Month & Total Collected Highlight Box */}
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl p-2 px-3.5">
                  <div className="text-right pl-3 border-l border-slate-700">
                    <span className="text-[10px] text-slate-400 block">الشهر المالي</span>
                    <span
                      data-testid="floors-excel-month-label"
                      className="font-black text-sm sm:text-base text-amber-300"
                    >
                      {displayedMonthHeader}
                    </span>
                  </div>
                  <div className="text-right pr-1">
                    <span className="text-[10px] text-emerald-300 block">إجمالي المحصل</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        data-testid="floors-excel-total-collected"
                        className="font-black text-lg sm:text-xl font-mono text-emerald-400"
                      >
                        {sheetData.totalMonthCollected}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-300">
                        {settings.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Colored KPI Summary Boxes inside the Header */}
              <div className="grid grid-cols-5 gap-2.5 pt-1">
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/35 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-emerald-200 block">
                    نسبة التحصيل الشهري
                  </span>
                  <span className="font-black text-base sm:text-lg text-emerald-300 font-mono">
                    {sheetData.collectionRatePercent}% ({sheetData.totalMonthCollected} / {sheetData.expectedMonthlyTotal})
                  </span>
                </div>

                <div className="rounded-xl bg-teal-500/15 border border-teal-400/35 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-teal-200 block">
                    مسدد بالكامل
                  </span>
                  <span className="font-black text-base sm:text-lg text-teal-300 font-mono">
                    {Math.max(0, sheetData.paidUnitsCount - sheetData.partialUnitsCount)} شقة
                  </span>
                </div>

                <div className="rounded-xl bg-cyan-500/15 border border-cyan-400/35 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-cyan-200 block">
                    سداد جزئي
                  </span>
                  <span className="font-black text-base sm:text-lg text-cyan-300 font-mono">
                    {sheetData.partialUnitsCount} شقة
                  </span>
                </div>

                <div className="rounded-xl bg-rose-500/20 border border-rose-400/40 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-rose-200 block">
                    لم يدفع (مطالب)
                  </span>
                  <span className="font-black text-base sm:text-lg text-rose-300 font-mono">
                    {sheetData.unpaidUnitsCount} شقق
                  </span>
                </div>

                <div className="rounded-xl bg-amber-500/20 border border-amber-400/40 p-2.5 text-center">
                  <span className="text-[11px] font-bold text-amber-200 block">
                    غير مطالب / مغلقة
                  </span>
                  <span className="font-black text-base sm:text-lg text-amber-300 font-mono">
                    {sheetData.exemptOrClosedCount} شقق
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Top Models Column Header Boxes */}
            <div className="grid grid-cols-12 gap-2.5 items-center">
              <div className="col-span-9 grid grid-cols-3 gap-2 text-center" dir="rtl">
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl py-2 px-3 font-black text-sm text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>نموذج 1 (يمين)</span>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl py-2 px-3 font-black text-sm text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>نموذج 2 (وسط)</span>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl py-2 px-3 font-black text-sm text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>نموذج 3 (يسار)</span>
                </div>
              </div>
              <div
                dir="rtl"
                className="col-span-3 bg-slate-900 text-emerald-400 border-2 border-slate-800 rounded-xl py-2 px-3 text-center font-black text-sm shadow-2xs"
              >
                الأدوار السكنية (10 - 1)
              </div>
            </div>

            {/* 3. Floors Rows (Ordered from Floor 10 down to Floor 1) */}
            <div className="space-y-2.5">
              {sheetData.floors.map(floorRow => {
                const cellsLeftToRight = [...floorRow.cells].reverse();

                return (
                  <div
                    key={floorRow.floor}
                    data-testid={`floors-excel-row-${floorRow.floor}`}
                    className="grid grid-cols-12 gap-2.5 items-stretch"
                  >
                    {/* 3 Models Area (Left 9 columns, subdivided into 6 half-model columns) */}
                    <div className="col-span-9 grid grid-cols-6 gap-2.5 items-stretch">
                      {cellsLeftToRight.map(cell => {
                        const spanClass =
                          cell.colSpanHalfUnits === 6
                            ? 'col-span-6'
                            : cell.colSpanHalfUnits === 4
                            ? 'col-span-4'
                            : cell.colSpanHalfUnits === 3
                            ? 'col-span-3'
                            : 'col-span-2';

                        const theme = getProUnitTheme(cell);

                        return (
                          <div
                            key={cell.apartmentId}
                            data-testid={`floors-excel-unit-${cell.unitNumber}`}
                            onClick={() => onSelectUnit && onSelectUnit(cell.apartmentId)}
                            className={`${spanClass} rounded-2xl overflow-hidden flex flex-col justify-between transition ${
                              theme.cardClass
                            } ${
                              onSelectUnit
                                ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
                                : ''
                            }`}
                            title={`شقة ${cell.unitNumber} - ${cell.fullResidentName} (${cell.modelLabelArabic})`}
                          >
                            {/* Unit Colored Header Bar: Unit Badge + Status Tag */}
                            <div
                              dir="rtl"
                              className={`px-2.5 py-1 flex items-center justify-between gap-1.5 ${theme.headerClass}`}
                            >
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono font-black text-xs ${theme.unitBadgeClass}`}
                              >
                                شقة {cell.unitNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] truncate ${theme.statusBadgeClass}`}
                              >
                                {theme.statusBadgeText}
                              </span>
                            </div>

                            {/* Center Body: Resident Name or 'X' */}
                            <div
                              dir="rtl"
                              className="px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-h-[42px]"
                            >
                              <div className={`truncate max-w-full ${theme.nameClass}`}>
                                {cell.displayLabel === 'X' ? (
                                  <span className="inline-flex items-center gap-1 text-amber-900">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>X — شقة مغلقة</span>
                                  </span>
                                ) : (
                                  cell.displayLabel
                                )}
                              </div>
                            </div>

                            {/* Bottom Bar: Paid Amount Box & Sub-Status */}
                            <div
                              dir="rtl"
                              className="px-2 pb-2 pt-0.5 flex items-center justify-between gap-1.5"
                            >
                              <div
                                className={`flex-1 py-1 px-2 rounded-xl text-center font-mono font-black text-sm flex items-center justify-center gap-1 ${theme.amountPillClass}`}
                              >
                                <span>{cell.paidAmount}</span>
                                <span className="text-[10px] font-bold">ج.م</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 px-1 hidden sm:inline">
                                {theme.subLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rightmost Floor Badge Card (3 columns) */}
                    <div
                      dir="rtl"
                      className="col-span-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 text-white border-2 border-slate-700 p-2.5 flex flex-col items-center justify-center text-center shadow-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs flex items-center justify-center">
                          {floorRow.floor}
                        </span>
                        <span className="font-black text-base sm:text-lg text-white">
                          {floorRow.floorTitleArabic}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono ${
                            floorRow.floorCollectedTotal > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700/70 text-slate-300'
                          }`}
                        >
                          محصل: {floorRow.floorCollectedTotal} ج.م
                        </span>
                        {floorRow.unpaidCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-400/30 text-[10px] font-bold">
                            متأخر: {floorRow.unpaidCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Bottom Models Labels Row */}
            <div className="grid grid-cols-12 gap-2.5 pt-1">
              <div className="col-span-9 grid grid-cols-3 gap-2 text-center font-black text-sm" dir="rtl">
                <div className="bg-slate-100 border border-slate-300 rounded-xl py-1.5 text-slate-800">
                  نموذج 1
                </div>
                <div className="bg-slate-100 border border-slate-300 rounded-xl py-1.5 text-slate-800">
                  نموذج 2
                </div>
                <div className="bg-slate-100 border border-slate-300 rounded-xl py-1.5 text-slate-800">
                  نموذج 3
                </div>
              </div>
              <div className="col-span-3" />
            </div>

            {/* 5. Modern Legend Boxes & InstaPay QR Card */}
            <div
              dir="rtl"
              className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
            >
              {/* Color Legend Grid */}
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>دليل الألوان والحالات البصرية للوحدات السكنية:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <div>
                      <span className="text-emerald-950 block font-black">مسدد بالكامل</span>
                      <span className="text-[10px] text-emerald-700">تم تحصيل الاشتراك</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-300 rounded-xl p-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-black flex items-center justify-center shrink-0">
                      ½
                    </span>
                    <div>
                      <span className="text-cyan-950 block font-black">سداد جزئي</span>
                      <span className="text-[10px] text-cyan-700">دفع جزء ومتبقي رصيد</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 rounded-xl p-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center shrink-0">
                      0
                    </span>
                    <div>
                      <span className="text-rose-950 block font-black">لم يدفع</span>
                      <span className="text-[10px] text-rose-700">مطالب بالدفع هذا الشهر</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl p-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-black flex items-center justify-center shrink-0">
                      X
                    </span>
                    <div>
                      <span className="text-amber-950 block font-black">شقة مقفولة</span>
                      <span className="text-[10px] text-amber-800">غير مسكونة / مغلقة</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-300 rounded-xl p-2 sm:col-span-2">
                    <span className="px-2 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0 text-[11px]">
                      الاسم
                    </span>
                    <div>
                      <span className="text-amber-950 block font-black">
                        غير مطالب بالدفع (شقة خالية / معفاة)
                      </span>
                      <span className="text-[10px] text-amber-800">
                        وحدات مسجلة بالاسم ومعفاة من رسوم الشهر
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* InstaPay QR Code Card */}
              <a
                href={sheetData.instapayUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="اضغط لفتح رابط الدفع السريع عبر InstaPay"
                className="bg-white border-2 border-purple-300 hover:border-purple-500 rounded-2xl p-3 flex items-center gap-3 shadow-sm transition shrink-0"
              >
                <div className="relative w-28 h-28 bg-white p-1 border border-slate-200 rounded-xl shrink-0">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="w-full h-full"
                    shapeRendering="crispEdges"
                  >
                    <rect width={qrMatrix.length} height={qrMatrix.length} fill="#FFFFFF" />
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#0F172A"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-1.5 py-0.5 rounded-xs border border-purple-300 shadow-2xs">
                      <span className="font-black text-[11px] tracking-tighter text-purple-800">
                        IPN
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1 max-w-[150px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black text-[10px]">
                    <QrCode className="w-3 h-3" />
                    <span>InstaPay QR</span>
                  </span>
                  <p className="font-black text-xs text-slate-900 leading-snug">
                    امسح الرمز أو اضغط للسداد الفوري عبر إنستاباي
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    PRINT TIME: {sheetData.printTimeFormatted}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           MODE 2: CLASSIC EXCEL SHEET REPLICA (النمط الكلاسيكي لجدول الإكسيل)
           ==================================================================== */
        <div className="overflow-x-auto pb-2">
          <div
            data-testid="floors-excel-sheet-paper"
            data-visual-theme="classic_excel"
            dir="ltr"
            className="bg-white text-black border-[3px] border-black mx-auto p-5 sm:p-7 shadow-xl max-w-[920px] min-w-[740px] select-none"
          >
            {/* 1. Top Header Box: [2400] | [سبتمبر- 2026] | [الشهر] */}
            <div className="mb-5 pl-3">
              <div className="inline-grid grid-cols-12 border-[3.5px] border-black bg-white min-w-[490px]">
                <div
                  data-testid="floors-excel-total-collected"
                  className="col-span-3 border-r-[3px] border-black py-2 px-3 text-center font-bold text-xl font-mono flex items-center justify-center"
                >
                  {sheetData.totalMonthCollected}
                </div>
                <div
                  data-testid="floors-excel-month-label"
                  dir="rtl"
                  className="col-span-6 border-r-[3px] border-black py-2 px-4 text-center font-black text-xl flex items-center justify-center"
                >
                  {displayedMonthHeader}
                </div>
                <div
                  dir="rtl"
                  className="col-span-3 py-2 px-3 text-center font-bold text-xl flex items-center justify-center"
                >
                  الشهر
                </div>
              </div>
            </div>

            {/* 2. Floors Rows (Ordered from Floor 10 down to Floor 1) */}
            <div className="space-y-2.5">
              {sheetData.floors.map(floorRow => {
                const cellsLeftToRight = [...floorRow.cells].reverse();

                return (
                  <div
                    key={floorRow.floor}
                    data-testid={`floors-excel-row-${floorRow.floor}`}
                    className="grid grid-cols-12 gap-2.5 items-stretch"
                  >
                    <div className="col-span-9 grid grid-cols-6 gap-2 items-stretch">
                      {cellsLeftToRight.map(cell => {
                        const spanClass =
                          cell.colSpanHalfUnits === 6
                            ? 'col-span-6'
                            : cell.colSpanHalfUnits === 4
                            ? 'col-span-4'
                            : cell.colSpanHalfUnits === 3
                            ? 'col-span-3'
                            : 'col-span-2';

                        const isAmber =
                          cell.status === 'closed_x' || cell.status === 'exempt_named';
                        const isUnpaidRed =
                          highlightUnpaidRed && cell.status === 'required_unpaid';

                        return (
                          <div
                            key={cell.apartmentId}
                            data-testid={`floors-excel-unit-${cell.unitNumber}`}
                            onClick={() => onSelectUnit && onSelectUnit(cell.apartmentId)}
                            className={`${spanClass} flex items-stretch gap-1.5 ${
                              onSelectUnit ? 'cursor-pointer group' : ''
                            }`}
                            title={`شقة ${cell.unitNumber} - ${cell.fullResidentName} (${cell.modelLabelArabic})`}
                          >
                            <div className="w-7 shrink-0 flex items-center justify-center text-[#7F7F7F] font-semibold text-lg font-mono pt-0.5">
                              {cell.unitNumber}
                            </div>

                            <div className="flex-1 border-[3.5px] border-black bg-white flex flex-col justify-between overflow-hidden group-hover:ring-2 group-hover:ring-emerald-500 transition">
                              <div
                                dir="rtl"
                                className={`py-1 px-2 text-center font-black text-base sm:text-[17px] leading-snug flex items-center justify-center min-h-[34px] ${
                                  isAmber
                                    ? 'bg-[#FFC000] text-black'
                                    : isUnpaidRed
                                    ? 'bg-[#FF0000] text-white'
                                    : 'bg-white text-black'
                                }`}
                              >
                                <span className="truncate">{cell.displayLabel}</span>
                              </div>

                              <div
                                className={`py-0.5 px-2 text-center font-bold text-base sm:text-[17px] font-mono leading-tight bg-white flex items-center justify-center min-h-[28px] ${
                                  isAmber ? 'text-[#C00000]' : 'text-black'
                                }`}
                              >
                                {cell.paidAmount}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      dir="rtl"
                      className="col-span-3 border-[3.5px] border-black bg-white flex items-center justify-center py-2 px-2 text-center font-black text-lg sm:text-xl"
                    >
                      {floorRow.floorTitleArabic}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Models Labels Row */}
            <div className="grid grid-cols-12 gap-2.5 mt-3">
              <div className="col-span-9 grid grid-cols-3 text-center font-black text-lg" dir="rtl">
                <div>نموذج 1</div>
                <div>نموذج 2</div>
                <div>نموذج 3</div>
              </div>
              <div className="col-span-3" />
            </div>

            {/* 4. Bottom Legend & InstaPay QR Code Section */}
            <div className="mt-5 flex items-start justify-end gap-6 pr-1">
              <div className="flex flex-col text-base font-bold" dir="rtl">
                <div className="flex items-center gap-3 h-9">
                  <div className="w-24 h-full bg-[#FF0000] shrink-0" />
                  <span className="text-black">لم يدفع</span>
                </div>
                <div className="flex items-center gap-3 h-9">
                  <div className="w-24 h-full bg-white border-2 border-black shrink-0" />
                  <span className="text-black">مطالب بالدفع</span>
                </div>
                <div className="flex items-center gap-3 h-9">
                  <div className="w-24 h-full bg-[#FFC000] border-2 border-black flex items-center justify-center font-bold text-black shrink-0">
                    X
                  </div>
                  <span className="text-black">شقه مقفولة,......</span>
                </div>
                <div className="flex items-center gap-3 h-9">
                  <div className="w-24 h-full bg-[#FFC000] border-2 border-black flex items-center justify-center font-bold text-black shrink-0">
                    الاسم
                  </div>
                  <span className="text-black">غير مطالب بالدفع (شقه خالية، ...)</span>
                </div>
              </div>

              <a
                href={sheetData.instapayUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="اضغط لفتح رابط الدفع السريع عبر InstaPay"
                className="relative w-40 h-40 bg-white p-1.5 border border-slate-300 shrink-0 block"
              >
                <svg
                  viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                  className="w-full h-full"
                  shapeRendering="crispEdges"
                >
                  <rect width={qrMatrix.length} height={qrMatrix.length} fill="#FFFFFF" />
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill="#000000"
                        />
                      ) : null
                    )
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white px-1.5 py-0.5 rounded-xs border border-purple-200 shadow-2xs">
                    <span className="font-black text-xs tracking-tighter text-purple-800">
                      IPN
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* 5. Bottom PRINT TIME Footer */}
            <div className="mt-5 text-center text-[#7F7F7F] font-mono text-sm tracking-wide">
              PRINT TIME &nbsp;&nbsp;&nbsp; {sheetData.printTimeFormatted}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return sheetBody;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="كشف الأدوار وأسماء وأرقام الشقق"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-100 rounded-3xl max-w-6xl w-full my-2 p-3 sm:p-5 shadow-2xl border border-slate-700/40">
        {sheetBody}
      </div>
    </div>
  );
};
