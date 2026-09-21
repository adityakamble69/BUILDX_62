'use client';

import { useRef, useState } from 'react';
import { Camera, ImageOff, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { compressImage } from '@/lib/utils/compressImage';
import { uploadReportImages } from '@/lib/utils/uploadReportImages';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Worker submission modal — worker uploads the resolution photo and describes what
 * was done. Reuses the same signed-upload contract as the citizen wizard
 * (POST /uploads/sign → PUT to Storage → submit the storage path).
 *
 * @param {{
 *   open: boolean,
 *   task: object | null,
 *   onClose: () => void,
 *   onSubmitted: () => void,
 * }} props
 */
export default function WorkerSubmissionModal({ open, task, onClose, onSubmitted }) {
  const { request } = useApi();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setDetails('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(event) {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      toast('Photo must be a JPEG, PNG or WebP', 'danger');
      return;
    }
    try {
      const blob = await compressImage(picked);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      toast('Could not process that photo', 'danger');
    }
  }

  async function handleSubmit() {
    if (!file) {
      toast('Add a photo of the completed work', 'warning');
      return;
    }
    if (!task) return;

    setSubmitting(true);
    try {
      const [storagePath] = await uploadReportImages(request, [file]);
      await request(authPaths.myTaskSubmission(task.id), {
        method: 'POST',
        body: {
          resolutionImagePath: storagePath,
          details: details.trim() || undefined,
        },
      });
      toast('Submission sent — the admin will review it', 'success');
      reset();
      onSubmitted();
      onClose();
    } catch (err) {
      toast(err?.message || 'Could not send your submission', 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Submit resolution proof"
      closeOnOverlay={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={!file}>
            Send submission
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {task && (
          <div>
            <p className="text-sm font-semibold text-ink">{task.title}</p>
            {task.report_title && (
              <p className="text-xs text-ink-subtle">Report: {task.report_title}</p>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Resolution photo <span className="text-danger">*</span>
          </p>
          {previewUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
              <img src={previewUrl} alt="Resolution preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setFile(null);
                  setPreviewUrl(null);
                }}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink-muted shadow-md hover:text-danger"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg px-4 py-8 text-center transition hover:border-primary-600/60 hover:bg-primary-50/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink">Click to upload a photo</span>
              <span className="text-xs text-ink-subtle">JPG, PNG, WebP · Max 5 MB</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="sr-only"
            onChange={handleFile}
          />
        </div>

        <Textarea
          label="What did you do?"
          placeholder="Briefly describe the work — e.g. 'Filled the pothole with hot mix and compacted it.'"
          maxLength={2000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
    </Modal>
  );
}