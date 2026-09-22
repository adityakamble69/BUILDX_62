'use client';

import { useEffect, useState } from 'react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const EMPTY = {
  reportId: '',
  title: '',
  description: '',
  departmentId: '',
  assignedToId: '',
  assignedTo: '',
  priority: 'medium',
  taskDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
};

/**
 * Assign Task form (design brief §5). Worker dropdown is optional — selecting a worker
 * sets `assignedToId` (a Clerk userId) so the task appears in that worker's
 * `/worker/tasks` dashboard. If no worker is picked, only the free-text `assignedTo`
 * label is stored and the task has no in-app recipient.
 *
 * Both option lists are fetched behind an `isLoaded` guard — Clerk's session (and
 * therefore the Bearer token) must exist before hitting `/admin/*`, or the server
 * returns 401 and the dropdowns render empty.
 *
 * @param {{
 *   defaultReportId?: string,
 *   defaultTitle?: string,
 *   defaultDepartmentId?: string | number,
 *   onCreated: () => void,
 * }} props
 */
export default function TaskForm({
  defaultReportId,
  defaultTitle,
  defaultDepartmentId,
  onCreated,
}) {
  const { request, isLoaded } = useApi();
  const { toast } = useToast();

  const [values, setValues] = useState({
    ...EMPTY,
    reportId: defaultReportId ?? '',
    title: defaultTitle ?? '',
    departmentId:
      defaultDepartmentId != null && defaultDepartmentId !== ''
        ? String(defaultDepartmentId)
        : '',
  });
  const [departments, setDepartments] = useState(null);
  const [workers, setWorkers] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    request(authPaths.adminDepartments)
      .then((res) => setDepartments(res.data))
      .catch((err) => {
        console.error('Failed to load departments:', err);
        setDepartments([]);
        toast('Could not load departments — is the server running?', 'danger');
      });

    request(authPaths.adminWorkers)
      .then((res) => setWorkers(res.data))
      .catch((err) => {
        // Workers are optional (a task can exist without a worker account), so this
        // failure is logged but not toasted — the form still works.
        console.error('Failed to load workers:', err);
        setWorkers([]);
      });
  }, [isLoaded, request, toast]);

  function update(patch) {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }

  function handleWorkerSelect(workerId) {
    const worker = workers?.find((w) => w.id === workerId);
    // Auto-fill the free-text label with the worker's display name if it's empty —
    // admins can still override it (e.g. "Suresh (morning shift)").
    setValues((v) => ({
      ...v,
      assignedToId: workerId,
      assignedTo: v.assignedTo.trim() === '' ? worker?.displayName ?? '' : v.assignedTo,
    }));
  }

  function validate() {
    const found = {};
    if (!/^[0-9a-f-]{36}$/i.test(values.reportId.trim())) found.reportId = 'Paste a valid report UUID.';
    if (values.title.trim().length < 3) found.title = 'Title must be at least 3 characters.';
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await request(authPaths.adminTasks(), {
        method: 'POST',
        body: {
          reportId: values.reportId.trim(),
          departmentId: values.departmentId ? Number(values.departmentId) : undefined,
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          assignedToId: values.assignedToId || undefined,
          assignedTo: values.assignedTo.trim() || undefined,
          priority: values.priority,
          taskDate: values.taskDate || undefined,
          dueDate: values.dueDate || undefined,
        },
      });
      toast(
        values.assignedToId ? 'Task assigned — worker can see it now' : 'Task created',
        'success',
      );
      setValues({
        ...EMPTY,
        reportId: defaultReportId ?? '',
        title: defaultTitle ?? '',
        departmentId:
          defaultDepartmentId != null && defaultDepartmentId !== ''
            ? String(defaultDepartmentId)
            : '',
      });
      onCreated();
    } catch (err) {
      toast(err?.message || 'Could not assign the task', 'danger');
    } finally {
      setSaving(false);
    }
  }

  const workerOptions = [
    { value: '', label: workers ? '— No worker (free-text only) —' : 'Loading workers…' },
    ...(workers ?? []).map((w) => ({ value: w.id, label: w.displayName })),
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold">Assign a task</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Attach a report to a department and optionally to a worker account, set a due date,
        and track progress below.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Report ID"
          required
          placeholder="e.g. 22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d"
          value={values.reportId}
          error={errors.reportId}
          disabled={!!defaultReportId}
          helperText={
            defaultReportId
              ? 'Pre-filled from the report.'
              : 'Copy the ID from the report page or the Reports table.'
          }
          onChange={(e) => update({ reportId: e.target.value })}
        />
        <Input
          label="Task Title"
          required
          placeholder="e.g. Patch the pothole on MG Road"
          maxLength={200}
          value={values.title}
          error={errors.title}
          onChange={(e) => update({ title: e.target.value })}
        />
        <Select
          label="Department"
          placeholder={departments ? 'Select department' : 'Loading…'}
          options={(departments ?? []).map((d) => ({ value: String(d.id), label: d.name }))}
          value={values.departmentId}
          disabled={!departments}
          onChange={(e) => update({ departmentId: e.target.value })}
        />
        <Select
          label="Assign to Worker"
          options={workerOptions}
          value={values.assignedToId}
          disabled={!workers}
          helperText={
            workers?.length === 0
              ? 'No workers registered yet. Create a Clerk user with publicMetadata.role = "worker".'
              : 'Optional — assigns the task to a worker account so it shows up in their dashboard.'
          }
          onChange={(e) => handleWorkerSelect(e.target.value)}
        />
        <Input
          label="Assigned Person / Team (label)"
          placeholder="e.g. Roads crew A — Suresh"
          maxLength={120}
          value={values.assignedTo}
          helperText="Free-text label shown in the table. Auto-filled from the worker above if empty."
          onChange={(e) => update({ assignedTo: e.target.value })}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          onChange={(e) => update({ priority: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Task Date"
            type="date"
            value={values.taskDate}
            onChange={(e) => update({ taskDate: e.target.value })}
          />
          <Input
            label="Due Date"
            type="date"
            value={values.dueDate}
            onChange={(e) => update({ dueDate: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Task Description"
            placeholder="What needs to be done? Any access notes, material needs, or safety notes."
            maxLength={2000}
            value={values.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={saving}>
            Assign Task
          </Button>
        </div>
      </form>
    </Card>
  );
}