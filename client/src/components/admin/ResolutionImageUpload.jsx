'use client';

import { useRef, useState } from 'react';
import { Camera, CircleCheck } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { compressImage } from '@/lib/utils/compressImage';
import { uploadReportImages } from '@/lib/utils/uploadReportImages';
import Button from '@/components/ui/Button';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /admin/reports/:id/resolution-image. Reuses the citizen wizard's
 * `compressImage`/`uploadReportImages` — same signed-upload contract
 * (`POST /uploads/sign` then a direct PUT to Storage), just attached with `kind: 'after'`
 * by the admin RPC instead of `create_report`'s 'before' images.
 * @param {{ reportId: string, onUploaded: () => void }} props
 */
export default function ResolutionImageUpload({ reportId, onUploaded }) {
  const { request } = useApi();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast('Photo must be a JPEG, PNG or WebP', 'danger');
      return;
    }

    setUploading(true);
    try {
      const blob = await compressImage(file);
      const [storagePath] = await uploadReportImages(request, [blob]);
      await request(authPaths.adminResolutionImage(reportId), {
        method: 'POST',
        body: { storagePath },
      });
      toast('Resolution photo attached', 'success');
      onUploaded();
    } catch (err) {
      toast(err?.message || 'Could not upload the photo', 'danger');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
        <Camera className="h-4 w-4" aria-hidden="true" />
        Upload after photo
      </Button>
      <p className="flex items-center gap-1 text-xs text-ink-subtle">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Proof of the fix, shown to the citizen on their report.
      </p>
      <label className="sr-only" htmlFor="resolution-photo">
        Upload after photo
      </label>
      <input
        ref={fileRef}
        id="resolution-photo"
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
