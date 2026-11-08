import { useState, useCallback, useEffect, useRef } from 'react';
import {
  OperationProgressState,
  ExportScaleMultiplier,
  transformAndOptimizeImage,
  buildMultiFormatZipBundle,
  copyImageToSystemClipboard,
  executeUnifiedSaveOperation,
  mediaMemoryRegistry,
  exportWhatsAppReadyImage,
  shareFileToWhatsAppOrApps,
} from '../services/fileMediaManager';
import { SaveLocationFolder } from '../types';
import { copyTextWithApkBridge, openExternalUrlOrWhatsApp } from '../utils/apkBridge';

export interface UseFileMediaManagerReturn {
  progressState: OperationProgressState;
  isBusy: boolean;
  scale: ExportScaleMultiplier;
  setScale: (s: ExportScaleMultiplier) => void;
  quality: number;
  setQuality: (q: number) => void;
  resetProgress: () => void;
  saveSingleFile: (params: {
    base64OrDataUrl: string;
    fileName: string;
    mimeType: string;
    mode: 'direct_download' | 'model_folder' | 'save_as_picker';
    targetFolder?: SaveLocationFolder;
    customSubfolder?: string;
    bypassDuplicateCheck?: boolean;
  }) => Promise<OperationProgressState>;
  exportAndSaveImage: (params: {
    sourceDataUrl: string;
    baseFileName: string;
    format: 'png' | 'jpeg' | 'webp' | 'avif' | 'svg' | 'pdf';
    scale?: ExportScaleMultiplier;
    quality?: number;
    backgroundColor?: string;
    mode: 'direct_download' | 'model_folder' | 'save_as_picker';
    targetFolder?: SaveLocationFolder;
    customSubfolder?: string;
  }) => Promise<OperationProgressState>;
  exportMultipleAsZip: (params: {
    entries: Array<{ fileName: string; data: Uint8Array | string }>;
    bundleBaseName: string;
    mode?: 'direct_download' | 'model_folder' | 'save_as_picker';
    targetFolder?: SaveLocationFolder;
    customSubfolder?: string;
  }) => Promise<OperationProgressState>;
  copyImageToClipboard: (sourceDataUrl: string) => Promise<boolean>;
  copyShareLinkOrText: (text: string, openWhatsApp?: boolean) => Promise<boolean>;
  shareWhatsAppReady: (
    sourceDataUrl: string,
    baseFileName: string,
    captionText: string,
    action: 'share' | 'download'
  ) => Promise<OperationProgressState>;
  retryLastOperation: () => Promise<void>;
}

/**
 * Custom React Hook (`useFileMediaManager`)
 * Provides reactive state, debounced execution guard, automatic ObjectURL cleanup on unmount,
 * real-time progress bar tracking, and 1-click retry for any failed export/save operation.
 */
export function useFileMediaManager(): UseFileMediaManagerReturn {
  const [progressState, setProgressState] = useState<OperationProgressState>({
    status: 'idle',
    progressPercent: 0,
    stepLabelArabic: '',
  });
  const [scale, setScale] = useState<ExportScaleMultiplier>(1);
  const [quality, setQuality] = useState<number>(0.94);

  const busyRef = useRef<boolean>(false);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  // Automatic memory cleanup on unmount
  useEffect(() => {
    return () => {
      mediaMemoryRegistry.revokeAll();
    };
  }, []);

  const isBusy =
    progressState.status === 'preparing' ||
    progressState.status === 'converting' ||
    progressState.status === 'bundling_zip' ||
    progressState.status === 'saving';

  const resetProgress = useCallback(() => {
    setProgressState({
      status: 'idle',
      progressPercent: 0,
      stepLabelArabic: '',
    });
  }, []);

  const saveSingleFile = useCallback(
    async (params: {
      base64OrDataUrl: string;
      fileName: string;
      mimeType: string;
      mode: 'direct_download' | 'model_folder' | 'save_as_picker';
      targetFolder?: SaveLocationFolder;
      customSubfolder?: string;
      bypassDuplicateCheck?: boolean;
    }): Promise<OperationProgressState> => {
      if (busyRef.current) {
        return progressState;
      }
      busyRef.current = true;
      lastActionRef.current = async () => {
        await saveSingleFile({ ...params, bypassDuplicateCheck: true });
      };

      try {
        const res = await executeUnifiedSaveOperation({
          ...params,
          onProgress: state => setProgressState(state),
        });
        return res;
      } finally {
        busyRef.current = false;
      }
    },
    [progressState]
  );

  const exportAndSaveImage = useCallback(
    async (params: {
      sourceDataUrl: string;
      baseFileName: string;
      format: 'png' | 'jpeg' | 'webp' | 'avif' | 'svg' | 'pdf';
      scale?: ExportScaleMultiplier;
      quality?: number;
      backgroundColor?: string;
      mode: 'direct_download' | 'model_folder' | 'save_as_picker';
      targetFolder?: SaveLocationFolder;
      customSubfolder?: string;
    }): Promise<OperationProgressState> => {
      if (busyRef.current) {
        return progressState;
      }
      busyRef.current = true;
      lastActionRef.current = async () => {
        await exportAndSaveImage(params);
      };

      try {
        setProgressState({
          status: 'converting',
          progressPercent: 15,
          stepLabelArabic: `جاري معالجة وتحويل الصورة إلى ${params.format.toUpperCase()} (${
            params.scale || scale
          }x)...`,
        });

        const transformed = await transformAndOptimizeImage(
          params.sourceDataUrl,
          params.baseFileName,
          {
            format: params.format,
            scale: params.scale || scale,
            quality: params.quality ?? quality,
            backgroundColor: params.backgroundColor || '#ffffff',
            onProgress: (pct, label) =>
              setProgressState({
                status: 'converting',
                progressPercent: Math.min(70, Math.round(pct * 0.7)),
                stepLabelArabic: label,
              }),
          }
        );

        const res = await executeUnifiedSaveOperation({
          base64OrDataUrl: transformed.base64Data,
          fileName: transformed.fileName,
          mimeType: transformed.mimeType,
          mode: params.mode,
          targetFolder: params.targetFolder,
          customSubfolder: params.customSubfolder,
          onProgress: state => setProgressState(state),
        });
        return res;
      } finally {
        busyRef.current = false;
      }
    },
    [progressState, scale, quality]
  );

  const exportMultipleAsZip = useCallback(
    async (params: {
      entries: Array<{ fileName: string; data: Uint8Array | string }>;
      bundleBaseName: string;
      mode?: 'direct_download' | 'model_folder' | 'save_as_picker';
      targetFolder?: SaveLocationFolder;
      customSubfolder?: string;
    }): Promise<OperationProgressState> => {
      if (busyRef.current) {
        return progressState;
      }
      busyRef.current = true;
      lastActionRef.current = async () => {
        await exportMultipleAsZip(params);
      };

      try {
        setProgressState({
          status: 'bundling_zip',
          progressPercent: 35,
          stepLabelArabic: `جاري ضغط وتجميع ${params.entries.length} ملفات في حزمة ZIP واحدة...`,
        });

        const zipBundle = buildMultiFormatZipBundle(
          params.entries,
          params.bundleBaseName
        );

        const res = await executeUnifiedSaveOperation({
          base64OrDataUrl: zipBundle.zipBase64,
          fileName: zipBundle.zipFileName,
          mimeType: 'application/zip',
          mode: params.mode || 'model_folder',
          targetFolder: params.targetFolder || 'Download',
          customSubfolder: params.customSubfolder || 'حسن_الجوار',
          onProgress: state => setProgressState(state),
        });

        const enriched: OperationProgressState = {
          ...res,
          stepLabelArabic: res.wasDuplicatePrevented
            ? res.stepLabelArabic
            : `تم تجميع وحفظ ${zipBundle.fileCount} ملفات داخل أرشيف واحد (${zipBundle.zipFileName}) بنجاح!`,
        };
        setProgressState(enriched);
        return enriched;
      } finally {
        busyRef.current = false;
      }
    },
    [progressState]
  );

  const copyImageToClipboard = useCallback(
    async (sourceDataUrl: string): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      try {
        setProgressState({
          status: 'converting',
          progressPercent: 50,
          stepLabelArabic: 'جاري نسخ الصورة إلى الحافظة (Clipboard)...',
        });
        const res = await copyImageToSystemClipboard(sourceDataUrl);
        setProgressState({
          status: 'completed',
          progressPercent: 100,
          stepLabelArabic: res.message,
        });
        return res.ok;
      } finally {
        busyRef.current = false;
      }
    },
    []
  );

  const copyShareLinkOrText = useCallback(
    async (text: string, openWhatsApp = false): Promise<boolean> => {
      await copyTextWithApkBridge(text);
      setProgressState({
        status: 'completed',
        progressPercent: 100,
        stepLabelArabic: openWhatsApp
          ? 'تم نسخ البيانات وفتح واتساب للمشاركة الفورية!'
          : 'تم نسخ النص / الرابط إلى الحافظة بنجاح!',
      });
      if (openWhatsApp) {
        openExternalUrlOrWhatsApp(`https://wa.me/?text=${encodeURIComponent(text)}`);
      }
      return true;
    },
    []
  );

  const shareWhatsAppReady = useCallback(
    async (
      sourceDataUrl: string,
      baseFileName: string,
      captionText: string,
      action: 'share' | 'download'
    ): Promise<OperationProgressState> => {
      if (busyRef.current) return progressState;
      busyRef.current = true;
      try {
        setProgressState({
          status: 'converting',
          progressPercent: 45,
          stepLabelArabic:
            action === 'share'
              ? 'جاري معالجة الصورة بخلفية بيضاء نقية ومشاركتها للواتساب...'
              : 'جاري تجهيز وتنزيل نسخة الواتساب المعتمدة (.JPG)...',
        });
        const res = await exportWhatsAppReadyImage(
          sourceDataUrl,
          baseFileName,
          captionText,
          action
        );
        const doneState: OperationProgressState = {
          status: 'completed',
          progressPercent: 100,
          stepLabelArabic: res.message,
        };
        setProgressState(doneState);
        return doneState;
      } finally {
        busyRef.current = false;
      }
    },
    [progressState]
  );

  const retryLastOperation = useCallback(async () => {
    if (lastActionRef.current) {
      await lastActionRef.current();
    }
  }, []);

  return {
    progressState,
    isBusy,
    scale,
    setScale,
    quality,
    setQuality,
    resetProgress,
    saveSingleFile,
    exportAndSaveImage,
    exportMultipleAsZip,
    copyImageToClipboard,
    copyShareLinkOrText,
    shareWhatsAppReady,
    retryLastOperation,
  };
}

export { shareFileToWhatsAppOrApps };
