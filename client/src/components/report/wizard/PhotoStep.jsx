'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { compressImage } from '@/lib/utils/compressImage';
import { useToast } from '@/lib/context/ToastContext';
import { cn } from '@/lib/utils/cn';

const MAX_PHOTOS = 3; // rules.md §7 / database.md §4
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Step 1 — photos. Files are compressed here (rules.md §16: ≤ 1 MB, ≤ 1600 px wide) so the
 * wizard already holds upload-ready blobs. Primary UI is a dashed drop zone (click or
 * drag-and-drop); "Take a photo" is kept as a separate small button because that's the
 * camera-specific input on mobile and the drag zone can't trigger it.
 *
 * @param {{
 *  photos: Array<{ id: string, blob: Blob, previewUrl: string }>,
 *  onChange: (photos: Array<{ id: string, blob: Blob, previewUrl: string }>) => void,
 * }} props
 */
export default function PhotoStep({ photos, onChange }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFiles(files) {
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (picked.length > room) {
      toast(`Only ${room} more photo${room === 1 ? '' : 's'} can be added`, 'warning');
    }

    setWorking(true);
    const added = [];
    for (const file of picked.slice(0, room)) {
      const isImage =
        ACCEPTED.includes(file.type?.toLowerCase()) ||
        file.type?.startsWith('image/') ||
        /\.(jpe?g|png|webp|avif)$/i.test(file.name);

      if (!isImage) {
        toast(`${file.name} is not a JPEG, PNG or WebP`, 'danger');
        continue;
      }
      try {
        const blob = await compressImage(file);
        added.push({
          id: `${file.name}-${Date.now()}-${added.length}`,
          blob,
          previewUrl: URL.createObjectURL(blob),
        });
      } catch {
        toast(`Could not process ${file.name}`, 'danger');
      }
    }
    setWorking(false);

    if (added.length > 0) onChange([...photos, ...added]);
  }

  async function handleInputChange(event) {
    // Must copy to array BEFORE resetting event.target.value,
    // otherwise the browser immediately empties the FileList!
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    if (files.length > 0) {
      await handleFiles(files);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!full && !working) setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (full || working) return;
    await handleFiles(e.dataTransfer.files);
  }

  function remove(id) {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  }

  const full = photos.length >= MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Add photos</h2>
        <p className="mt-1 text-sm text-ink-muted">
          At least one photo, up to {MAX_PHOTOS}. They are resized on your device before upload,
          so a slow connection is fine.
        </p>
      </div>

      {!full && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={working}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
            dragActive
              ? 'border-primary-600 bg-primary-50'
              : 'border-border bg-bg hover:border-primary-600/60 hover:bg-primary-50/40',
            working && 'opacity-60',
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            {working ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <span className="text-sm font-semibold text-ink">
            {working ? 'Preparing photos…' : 'Click to upload or drag & drop'}
          </span>
          <span className="text-xs text-ink-subtle">JPG, PNG, WebP · Max 5 MB each</span>
        </button>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={full || working}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Take a photo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={full || working}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Choose from device
        </Button>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className="relative overflow-hidden rounded-lg border border-border bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, next/image can't optimise it */}
              <img
                src={photo.previewUrl}
                alt={`Selected photo ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-ink-muted shadow-md hover:bg-surface hover:text-danger"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {full && <p className="text-xs text-ink-subtle">Maximum of {MAX_PHOTOS} photos reached.</p>}

      <label className="sr-only" htmlFor="report-photo-camera">
        Take a photo
      </label>
      <input
        ref={cameraRef}
        id="report-photo-camera"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleInputChange}
      />
      <label className="sr-only" htmlFor="report-photo-files">
        Choose photos from your device
      </label>
      <input
        ref={fileRef}
        id="report-photo-files"
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}