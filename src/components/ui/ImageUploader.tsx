'use client';

import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { MAX_CLIENT_FILE_SIZE } from '@/lib/storage';

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null, storagePath?: string | null) => void;
  onRemove?: () => void;
  type?: 'logo' | 'gallery' | 'avatar';
  mode?: 'default' | 'avatar' | 'logo';
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  type = 'logo',
  mode = 'default',
  label,
  helperText,
  className = '',
  disabled = false,
}: ImageUploaderProps) {
  const isLogo = type === 'logo' || mode === 'logo';
  const isAvatar = mode === 'avatar' && !isLogo;
  const isCompactBox = isAvatar || isLogo;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStoragePath, setCurrentStoragePath] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  /**
   * Compresses an image in browser using canvas
   * Logo/Gallery: max 1200px, target <= 200 KB
   * Avatar: square crop, max 400px, target <= 60 KB
   */
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }

        const targetSizeBytes = isAvatar ? 60 * 1024 : 200 * 1024; // 60KB or 200KB
        const maxDimension = isAvatar ? 400 : 1200;

        if (isAvatar) {
          // Center square crop
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          const finalDim = Math.min(minDim, maxDimension);

          canvas.width = finalDim;
          canvas.height = finalDim;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, finalDim, finalDim);
        } else {
          // Aspect ratio preserve
          let w = img.width;
          let h = img.height;

          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
        }

        // Quality reduction loop
        const qualities = [0.85, 0.75, 0.65, 0.5, 0.4];
        let bestBlob: Blob | null = null;

        for (const q of qualities) {
          const blob: Blob | null = await new Promise((res) => {
            canvas.toBlob(res, 'image/webp', q);
          });

          if (blob) {
            bestBlob = blob;
            if (blob.size <= targetSizeBytes) {
              break; // Met size target!
            }
          }
        }

        // If WebP failed or wasn't supported, fallback to JPEG
        if (!bestBlob) {
          const fallbackBlob: Blob | null = await new Promise((res) => {
            canvas.toBlob(res, 'image/jpeg', 0.8);
          });
          if (fallbackBlob) bestBlob = fallbackBlob;
        }

        if (bestBlob) {
          resolve(bestBlob);
        } else {
          reject(new Error('Failed to compress image into valid blob'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid image data. Could not read image.'));
      };

      img.src = objectUrl;
    });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Immediate size check before any processing: strictly reject >5 MB
    if (file.size > MAX_CLIENT_FILE_SIZE) {
      setErrorMessage(`Image exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please pick a smaller image.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // MIME type check
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Only JPG, PNG, and WebP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      setProgressText('Compressing...');

      // Immediate local preview so user sees the image right away
      const localUrl = URL.createObjectURL(file);
      setLocalPreview(localUrl);
      setImageError(false);

      const compressedBlob = await compressImage(file);
      setProgressText(`Uploading (${Math.round(compressedBlob.size / 1024)}KB)...`);

      const formData = new FormData();
      formData.append('file', compressedBlob, `upload-${Date.now()}.webp`);
      formData.append('type', type);
      if (currentStoragePath) {
        formData.append('old_path', currentStoragePath);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setLocalPreview(null);
        throw new Error(data.error || 'Failed to upload image.');
      }

      setCurrentStoragePath(data.storage_path || null);
      onChange(data.url, data.storage_path);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image processing or upload failed');
    } finally {
      setUploading(false);
      setProgressText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (currentStoragePath) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage_path: currentStoragePath }),
        });
      } catch {}
    }

    setCurrentStoragePath(null);
    setLocalPreview(null);
    setImageError(false);
    onChange(null, null);
    if (onRemove) onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const displaySrc = localPreview || value;

  const containerShape = isAvatar
    ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-full'
    : isLogo
    ? 'w-32 h-32 sm:w-36 sm:h-36 rounded-2xl'
    : 'w-full max-w-sm h-28 sm:h-32 rounded-2xl';

  const previewShape = isAvatar
    ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-full'
    : isLogo
    ? 'w-32 h-32 sm:w-36 sm:h-36 rounded-2xl'
    : 'w-48 sm:w-56 h-32 rounded-2xl';

  const uploadPromptTitle = isLogo
    ? 'Upload Logo'
    : isAvatar
    ? 'Upload Photo'
    : 'Click to upload image';

  return (
    <div className={`space-y-2 w-full max-w-full ${className}`}>
      {label && (
        <label className={`block text-xs font-bold text-neutral-700 dark:text-neutral-300 ${isCompactBox ? 'text-center' : ''}`}>
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        disabled={disabled || uploading}
        className="hidden"
      />

      {displaySrc ? (
        /* Preview with Replace / Remove controls */
        <div className={`relative group ${isCompactBox ? 'flex flex-col items-center justify-center mx-auto' : 'inline-block'}`}>
          <div
            className={`relative overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 shadow-xs ${previewShape}`}
          >
            {!imageError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={displaySrc}
                alt=""
                onError={() => setImageError(true)}
                className={`w-full h-full ${isLogo ? 'object-contain p-2' : 'object-cover'}`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                <Upload className="w-5 h-5 mb-1 opacity-50 text-neutral-400" />
                <span className="text-[10px] leading-tight font-medium">Image unavailable</span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center p-2 text-center text-white">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D4A77F]" />
                <span className="text-[10px] mt-1 font-medium">{progressText || 'Updating...'}</span>
              </div>
            )}
          </div>

          {!disabled && !uploading && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-[11px] font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs transition-all cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[11px] font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div className={isCompactBox ? 'flex flex-col items-center justify-center' : ''}>
          <div
            onClick={() => {
              if (!disabled && !uploading) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-[#D4A77F] dark:hover:border-[#D4A77F] bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer flex flex-col items-center justify-center p-3 text-center ${containerShape} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-[#D4A77F] animate-spin" />
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-medium">{progressText || 'Processing...'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-[#D4A77F]" />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mt-1 sm:mt-1.5">
                  {uploadPromptTitle}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  JPG, PNG, WebP {isAvatar ? '' : '(max 5MB)'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {helperText && !errorMessage && (
        <p className={`text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 ${isCompactBox ? 'text-center max-w-xs mx-auto' : ''}`}>
          {helperText}
        </p>
      )}

      {errorMessage && (
        <div className={`p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 ${isCompactBox ? 'max-w-md mx-auto text-left' : ''}`}>
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
