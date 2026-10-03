import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface SaveOrShareOptions {
  filename: string;
  blob?: Blob;
  base64Data?: string;
  textContent?: string;
  mimeType: string;
  title?: string;
}

export interface SaveOrShareResult {
  success: boolean;
  method: 'native-share' | 'web-share' | 'download' | 'cancelled';
  error?: string;
}

/**
 * Converts a Blob to a base64 string (without the data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal file saver and sharer.
 * 
 * Works seamlessly across:
 * 1. Android APK & iOS App (Capacitor): writes to device cache and opens the native
 *    Android/iOS System Share & Save Dialog ("Save to Files / Downloads / Google Drive / Telegram / etc.")
 * 2. Mobile Browsers (Chrome / Safari / Firefox): uses Web Share API with Files
 * 3. Desktop Browsers: triggers standard reliable browser download
 */
export async function saveOrShareFile(options: SaveOrShareOptions): Promise<SaveOrShareResult> {
  const { filename, mimeType, title } = options;
  const displayTitle = title || filename;

  // 1. Prepare data formats
  let base64 = options.base64Data;
  let blob = options.blob;

  if (!blob && options.textContent) {
    blob = new Blob([options.textContent], { type: mimeType });
  }

  if (!base64 && blob) {
    try {
      base64 = await blobToBase64(blob);
    } catch (err) {
      console.warn('Failed to convert blob to base64:', err);
    }
  } else if (!base64 && options.textContent) {
    try {
      base64 = btoa(unescape(encodeURIComponent(options.textContent)));
    } catch {
      // fallback if btoa fails on unicode
    }
  }

  // 2. Check if running inside Capacitor Native App (Android APK / iOS)
  const isNative = Capacitor.isNativePlatform();

  if (isNative && base64) {
    try {
      // Clean path to prevent invalid character issues on Android
      const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
      
      // Write file to device Cache Directory
      const writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64,
        directory: Directory.Cache
      });

      // Prompt native Android system dialog to save or share the file
      await Share.share({
        title: displayTitle,
        text: `Файл: ${safeFilename}`,
        url: writeResult.uri,
        dialogTitle: 'Сохранить или отправить файл'
      });

      return { success: true, method: 'native-share' };
    } catch (err: any) {
      // If user simply dismissed the native dialog, that's not a fatal failure
      if (err?.message?.includes('canceled') || err?.message?.includes('cancelled') || err?.name === 'AbortError') {
        return { success: true, method: 'cancelled' };
      }
      console.warn('Capacitor native file write/share failed, falling back to web methods:', err);
    }
  }

  // 3. Check for Web Share API with Files support (Mobile Web / Modern WebViews)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && blob) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: displayTitle,
          text: displayTitle
        });
        return { success: true, method: 'web-share' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: true, method: 'cancelled' };
      }
      console.warn('navigator.share failed, falling back to direct download:', err);
    }
  }

  // 4. Standard Browser Download fallback
  try {
    let downloadUrl: string;
    if (blob) {
      downloadUrl = URL.createObjectURL(blob);
    } else if (base64) {
      downloadUrl = `data:${mimeType};base64,${base64}`;
    } else {
      downloadUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(options.textContent || '')}`;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      if (blob) {
        URL.revokeObjectURL(downloadUrl);
      }
    }, 2500);

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('All file export methods failed:', err);
    return {
      success: false,
      method: 'download',
      error: err?.message || 'Не удалось сохранить файл'
    };
  }
}
