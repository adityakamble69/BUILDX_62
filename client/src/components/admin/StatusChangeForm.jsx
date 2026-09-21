'use client';

import { useState } from 'react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { STATUS_META } from '@/components/ui/StatusBadge';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }));

/**
 * PATCH /admin/reports/:id/status. The note is required only for 'rejected' — it becomes
 * `reports.reject_reason` (`change_report_status`, sql/002_functions.sql) and is shown to
 * the citizen on the report detail page, so a rejection with no explanation would leave
 * them with no idea why.
 * @param {{ reportId: string, currentStatus: string, onChanged: (status: string) => void }} props
 */
export default function StatusChangeForm({ reportId, currentStatus, onChanged }) {
  const { request } = useApi();
  const { toast } = useToast();

  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (status === 'rejected' && !note.trim()) {
      setError('Add a reason so the citizen knows why this was rejected.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await request(authPaths.adminReportStatus(reportId), {
        method: 'PATCH',
        body: { status, note: note.trim() || undefined },
      });
      onChanged(status);
      setNote('');
      toast('Status updated — the citizen has been notified', 'success');
    } catch (err) {
      toast(err?.message || 'Could not update the status', 'danger');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      <Textarea
        label="Note"
        helperText={status === 'rejected' ? undefined : 'Optional — shown to the citizen in the status timeline.'}
        required={status === 'rejected'}
        error={error}
        placeholder={status === 'rejected' ? 'Why is this being rejected?' : 'Add a short update…'}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button variant="secondary" size="sm" onClick={handleSave} loading={saving} disabled={status === currentStatus && !note.trim()}>
        Update status
      </Button>
    </div>
  );
}
