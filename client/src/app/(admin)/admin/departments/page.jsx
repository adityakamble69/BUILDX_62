'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import DepartmentCreateForm from '@/components/admin/DepartmentCreateForm';

/**
 * `/admin/departments` — list, create, activate/deactivate (phases.md Phase 7). No hard
 * delete: `departments.id` is referenced by `reports.department_id`, so removing one would
 * either cascade-orphan every report assigned to it or be blocked by the FK — deactivating
 * just drops it from the "assign" dropdown while keeping history intact.
 */
export default function AdminDepartmentsPage() {
  const { request, isLoaded } = useApi();
  const { toast } = useToast();

  const [departments, setDepartments] = useState(null);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  function load() {
    setError(false);
    return request(authPaths.adminDepartments)
      .then((res) => setDepartments(res.data))
      .catch(() => setError(true));
  }

  useEffect(() => {
    if (isLoaded) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  async function handleCreate(name) {
    setCreating(true);
    try {
      const { data } = await request(authPaths.adminDepartments, { method: 'POST', body: { name } });
      setDepartments((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast('Department added', 'success');
    } catch (err) {
      toast(err?.message || 'Could not add the department', 'danger');
      throw err;
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(dept) {
    setTogglingId(dept.id);
    const previous = departments;
    setDepartments((current) =>
      current.map((d) => (d.id === dept.id ? { ...d, is_active: !d.is_active } : d)),
    );
    try {
      await request(authPaths.adminDepartment(dept.id), {
        method: 'PATCH',
        body: { isActive: !dept.is_active },
      });
    } catch (err) {
      setDepartments(previous);
      toast(err?.message || 'Could not update the department', 'danger');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Departments</h1>
        <p className="mt-1 text-ink-muted">
          Who reports get assigned to. Deactivating one removes it from new assignments but
          keeps its history.
        </p>
      </div>

      <Card>
        <DepartmentCreateForm onCreate={handleCreate} creating={creating} />
      </Card>

      {error && (
        <EmptyState
          title="Couldn't load departments"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && departments === null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!error && departments?.length === 0 && (
        <EmptyState icon={Building2} title="No departments yet" description="Add the first one above." />
      )}

      {!error && departments?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {departments.map((dept) => (
            <li key={dept.id}>
              <Card className="flex flex-row items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-ink">{dept.name}</span>
                  <Badge tone={dept.is_active ? 'success' : 'neutral'}>
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggle(dept)}
                  loading={togglingId === dept.id}
                >
                  {dept.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
