'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

/**
 * @param {{ onCreate: (name: string) => Promise<void>, creating: boolean }} props
 *   `onCreate` throwing (e.g. a duplicate-name 409) leaves the input filled so the
 *   admin can just fix the name and resubmit, rather than retyping it.
 */
export default function DepartmentCreateForm({ onCreate, creating }) {
  const [name, setName] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    try {
      await onCreate(trimmed);
      setName('');
    } catch {
      // Error toast is the caller's job (adminDepartments/page.jsx) — keep the input as-is.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <Input
          label="New department"
          hideLabel
          placeholder="E.g. Parks & Recreation"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button type="submit" loading={creating} disabled={name.trim().length < 2}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add
      </Button>
    </form>
  );
}
