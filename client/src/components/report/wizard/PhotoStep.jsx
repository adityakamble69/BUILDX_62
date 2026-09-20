'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { compressImage } from '@/lib/utils/compressImage';
import { useToast } from '@/lib/context/ToastContext';

const MAX_PHOTOS = 3; // rules.md §7 / database.md §4
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Step 1 — photos. Files are compressed here (rules.md §16: ≤ 1 MB, ≤ 1600 px wide) rather
 * than at submit time, so the wizard already holds upload-ready blobs and the user sees the
 * cost of a huge photo immediately instead of at the end of the flow.
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

  async function handleFiles(event) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = ''; // let the same file be re-picked after a removal
    if (picked.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (picked.length > room) toast(`Only ${room} more photo${room === 1 ? '' : 's'} can be added`, 'warning');

    setWorking(true);
    const added = [];
    for (const file of picked.slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        toast(`${file.name} is not a JPEG, PNG or WebP`, 'danger');
        continue;
      }
      try {
        const blob = await compressImage(file);
        added.push({ id: `${file.name}-${Date.now()}-${added.length}`, blob, previewUrl: URL.createObjectURL(blob) });
      } catch {
        toast(`Could not process ${file.name}`, 'danger');
      }
    }
    setWorking(false);

    if (added.length > 0) onChange([...photos, ...added]);
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
          At least one photo, up to {MAX_PHOTOS}. They are resized on your device before upload, so a
          slow connection is fine.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className="relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, next/image can't optimise it */}
              <img src={photo.previewUrl} alt={`Selected photo ${i + 1}`} className="aspect-video w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted shadow-md hover:text-danger"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => cameraRef.current?.click()} disabled={full || working}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Take a photo
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={full || working}>
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Choose from device
        </Button>
        {working && (
          <span className="inline-flex items-center gap-2 self-center text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Preparing photos…
          </span>
        )}
      </div>

      {full && <p className="text-xs text-ink-subtle">Maximum of {MAX_PHOTOS} photos reached.</p>}

      {/* Labels are visually hidden: the two buttons above are the real, larger controls. */}
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
        onChange={handleFiles}
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
        onChange={handleFiles}
      />
    </div>
  );
}
