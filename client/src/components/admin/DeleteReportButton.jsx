'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

/**
 * DELETE /admin/reports/:id. design.md §7: "Danger: confirm dialogs required" — a report
 * deletion cascades to its images/comments/history/notifications (001_schema.sql), so this
 * is destructive and irreversible.
 * @param {{ reportId: string, reportTitle: string }} props
 */
export default function DeleteReportButton({ reportId, reportTitle }) {
  const router = useRouter();
  const { request } = useApi();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await request(authPaths.adminDeleteReport(reportId), { method: 'DELETE' });
      toast('Report deleted', 'success');
      router.push('/admin/reports');
    } catch (err) {
      toast(err?.message || 'Could not delete the report', 'danger');
      setDeleting(false);
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" fullWidth onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete report
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this report?"
        closeOnOverlay={false}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirm} loading={deleting}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">&ldquo;{reportTitle}&rdquo;</span> and all of its photos,
          comments and status history will be permanently deleted. This can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
