'use client';

import { useEffect, useState } from 'react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

/**
 * PATCH /admin/reports/:id/assign. Departments come from `GET /admin/departments` (every
 * department, including inactive ones — a report already assigned to a department that
 * was since deactivated should still show it, not silently fall back to "unassigned").
 * @param {{ reportId: string, currentDepartmentId?: number | null, onAssigned: (departmentId: number, name: string) => void }} props
 */
export default function AssignDepartmentForm({ reportId, currentDepartmentId, onAssigned }) {
  const { request } = useApi();
  const { toast } = useToast();

  const [departments, setDepartments] = useState(null);
  const [value, setValue] = useState(currentDepartmentId ? String(currentDepartmentId) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(authPaths.adminDepartments)
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments([]));
    // Only ever needs to run once — the option list itself doesn't change per report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!value) return;
    setSaving(true);
    try {
      await request(authPaths.adminReportAssign(reportId), {
        method: 'PATCH',
        body: { departmentId: Number(value) },
      });
      const dep = departments.find((d) => d.id === Number(value));
      onAssigned(Number(value), dep?.name);
      toast('Department assigned', 'success');
    } catch (err) {
      toast(err?.message || 'Could not assign a department', 'danger');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Department"
        placeholder={departments ? 'Select department' : 'Loading…'}
        options={(departments ?? []).map((d) => ({
          value: String(d.id),
          label: d.is_active ? d.name : `${d.name} (inactive)`,
        }))}
        value={value}
        disabled={!departments}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSave}
        loading={saving}
        disabled={!value || value === String(currentDepartmentId ?? '')}
      >
        Save assignment
      </Button>
    </div>
  );
}
