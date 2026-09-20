'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { getCategories } from '@/lib/api';
import { SEVERITY_OPTIONS } from '@/lib/utils/severity';

const SEVERITY_SELECT = SEVERITY_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));

/**
 * Step 3 — issue details. Categories come from `GET /categories` rather than the local
 * `categories.js` lookup: the *set of active categories* can change server-side
 * (`is_active`), and submitting a deactivated slug would be rejected with a 422 (memory.md D29).
 *
 * `errors` is owned by the wizard so validation can run on "Next" and mark fields here.
 *
 * @param {{
 *  values: { category: string, severity: string, title: string, description: string },
 *  onChange: (patch: object) => void,
 *  errors: Record<string, string>,
 * }} props
 */
export default function DetailsStep({ values, onChange, errors }) {
  const [categories, setCategories] = useState(null);
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then((res) => setCategories(res.data.map((c) => ({ value: c.slug, label: c.name }))))
      .catch((err) => {
        if (err?.name !== 'AbortError') setCategoryError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Issue details</h2>
        <p className="mt-1 text-sm text-ink-muted">
          A clear title and a short description help the city route this to the right department.
        </p>
      </div>

      <Input
        label="Title"
        required
        placeholder="E.g. Pothole on main road"
        maxLength={120}
        value={values.title}
        error={errors.title}
        helperText="5 to 120 characters."
        onChange={(e) => onChange({ title: e.target.value })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Category"
          required
          placeholder={categories ? 'Select category' : 'Loading categories…'}
          options={categories ?? []}
          value={values.category}
          error={errors.category || (categoryError ? 'Could not load categories — refresh the page.' : undefined)}
          disabled={!categories}
          onChange={(e) => onChange({ category: e.target.value })}
        />
        <Select
          label="Severity"
          options={SEVERITY_SELECT}
          value={values.severity}
          helperText="How urgent is this?"
          onChange={(e) => onChange({ severity: e.target.value })}
        />
      </div>

      <Textarea
        label="Description"
        required
        placeholder="Describe the issue in detail…"
        maxLength={2000}
        value={values.description}
        error={errors.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </div>
  );
}
