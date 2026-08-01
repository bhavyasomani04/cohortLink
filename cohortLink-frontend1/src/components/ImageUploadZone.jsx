/**
 * ImageUploadZone.jsx
 *
 * Shared drag-and-drop image upload component.
 * Used by ClubFormView (club cover) and EventFormView (event banner).
 *
 * Props:
 *   onFile      (file: File) => void          — called when a file is chosen
 *   uploading   boolean                        — show upload progress state
 *   progress    number (0–100)                 — progress bar value
 *   uploadedUrl string | null                  — show success state with preview
 *   error       string | null                  — show error below the zone
 *   onReset     () => void                     — clear uploaded image
 *   label       string (optional)              — section title, e.g. "Club Image"
 *   hint        string (optional)              — sub-label below section title
 */

import { useRef, useState, useCallback } from 'react';
import { Text, Alert, Progress } from '@mantine/core';
import { UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImageUploadZone({
  onFile,
  uploading,
  progress,
  uploadedUrl,
  error: uploadError,
  onReset,
  label = 'Image',
  hint = 'Optional — a great image boosts interest',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleClick = () => inputRef.current?.click();
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  // ── Section header ──
  const SectionHeader = (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-green-600">
          {label.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col">
        <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
          {label}
        </Text>
        <Text size="xs" className="text-gray-400">{hint}</Text>
      </div>
    </div>
  );

  // ── Success state ──
  if (uploadedUrl) {
    return (
      <div className="flex flex-col gap-4">
        {SectionHeader}
        <div className="rounded-xl overflow-hidden border-2 border-green-200 bg-green-50 relative">
          <img
            src={uploadedUrl}
            alt="Uploaded preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white transition-colors shadow"
            >
              <X size={14} /> Replace image
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <CheckCircle2 size={16} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  // ── Uploading state ──
  if (uploading) {
    return (
      <div className="flex flex-col gap-4">
        {SectionHeader}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 flex flex-col items-center gap-3">
          <UploadCloud size={32} className="text-blue-400 animate-pulse" />
          <Text size="sm" className="text-blue-600 font-medium">
            Uploading… {progress}%
          </Text>
          <Progress
            value={progress}
            size="sm"
            radius="xl"
            className="w-full"
            color="blue"
            striped
            animated
          />
        </div>
      </div>
    );
  }

  // ── Idle / drag state ──
  return (
    <div className="flex flex-col gap-4">
      {SectionHeader}
      <div className="flex flex-col gap-2">
        <div
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label.toLowerCase()}`}
          onClick={handleClick}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            'rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 select-none',
            dragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40',
          ].join(' ')}
        >
          <UploadCloud
            size={36}
            className={`transition-colors duration-200 ${dragging ? 'text-blue-500' : 'text-gray-400'}`}
          />
          <div className="text-center">
            <Text size="sm" fw={600} className="text-gray-700">
              {dragging ? 'Drop it here!' : `Drop your ${label.toLowerCase()} here`}
            </Text>
            <Text size="xs" className="text-gray-400 mt-1">
              or <span className="text-blue-600 underline underline-offset-2">browse files</span>
              {' · '}JPEG, PNG, WEBP · max 5 MB
            </Text>
          </div>
        </div>

        {uploadError && (
          <Alert icon={<AlertCircle size={16} />} color="red" radius="md" py="xs">
            {uploadError}
          </Alert>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleChange}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
