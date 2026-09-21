'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Stepper from '@/components/report/wizard/Stepper';
import PhotoStep from '@/components/report/wizard/PhotoStep';
import LocationStep from '@/components/report/wizard/LocationStep';
import DetailsStep from '@/components/report/wizard/DetailsStep';
import ReviewStep from '@/components/report/wizard/ReviewStep';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { uploadReportImages } from '@/lib/utils/uploadReportImages';
import { blobToBase64 } from '@/lib/utils/blobToBase64';

// Order follows phases.md: photo → location → details → duplicate check → submit.
const STEPS = ['Photos', 'Location', 'Details', 'Review'];
const DUPLICATE_RADIUS_M = 50; // matches nearby_duplicates' default (sql/002_functions.sql)

/**
 * `/report/new` — the citizen reporting flow. `middleware.js` already redirects guests to
 * sign-in, so this page assumes a signed-in user.
 *
 * Photos are compressed and held as blobs while the user moves through the steps, and only
 * uploaded on submit: abandoning the wizard then leaves nothing orphaned in Storage.
 */
export default function NewReportPage() {
  const router = useRouter();
  const { request, isLoaded } = useApi();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [details, setDetails] = useState({ category: '', severity: '3', title: '', description: '' });
  const [errors, setErrors] = useState({});

  const [duplicates, setDuplicates] = useState(null);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Phase 8 (PRD FR5): fetched once, in the background, as soon as a photo exists — by the
  // time the citizen reaches the Details step the suggestion is usually already there. Never
  // re-fetched for the same photo set, and never blocks navigation; a failure or a disabled
  // deployment just leaves this null and DetailsStep renders nothing extra (rules.md §10).
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiRequestedRef = useRef(false);

  // Object URLs created in PhotoStep are freed when the page unmounts (removals free their
  // own URL there). `photosRef` avoids re-running this effect on every photo change.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  // Duplicate check runs when the Review step opens — by then both the location and the
  // category are known, which the RPC needs.
  useEffect(() => {
    if (step !== 3 || !isLoaded || !location || !details.category) return undefined;

    let active = true;
    setDuplicatesLoading(true);
    request(
      authPaths.nearbyDuplicates({
        lat: location.lat,
        lng: location.lng,
        category: details.category,
        radius: DUPLICATE_RADIUS_M,
      }),
    )
      .then((res) => {
        if (active) setDuplicates(res.data);
      })
      .catch(() => {
        // A failed duplicate check must not block reporting — it's advisory only.
        if (active) setDuplicates([]);
      })
      .finally(() => {
        if (active) setDuplicatesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [step, isLoaded, location, details.category, request]);

  const updateDetails = useCallback((patch) => {
    setDetails((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  /** Client-side validation is UX only; the server validates again (rules.md §11). */
  function validateStep(index) {
    if (index === 0) {
      if (photos.length === 0) {
        toast('Add at least one photo of the issue', 'warning');
        return false;
      }
      return true;
    }

    if (index === 1) {
      if (!location) {
        toast('Tap the map to pin the location', 'warning');
        return false;
      }
      return true;
    }

    if (index === 2) {
      const found = {};
      const title = details.title.trim();
      if (title.length < 5 || title.length > 120) found.title = 'Title must be 5 to 120 characters.';
      if (!details.category) found.category = 'Pick a category.';
      if (!details.description.trim()) found.description = 'Add a short description.';
      setErrors(found);
      return Object.keys(found).length === 0;
    }

    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step === 0) requestAiSuggestion();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  /** Fires once per wizard session, right after the Photos step is confirmed. */
  function requestAiSuggestion() {
    if (aiRequestedRef.current || photosRef.current.length === 0) return;
    aiRequestedRef.current = true;
    setAiLoading(true);

    blobToBase64(photosRef.current[0].blob)
      .then((imageBase64) =>
        request(authPaths.aiClassify, {
          method: 'POST',
          body: { imageBase64, mimeType: 'image/jpeg' },
        }),
      )
      .then((res) => setAiSuggestion(res.data.suggestion))
      .catch(() => setAiSuggestion(null)) // advisory only — never surfaced as an error
      .finally(() => setAiLoading(false));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const imagePaths = await uploadReportImages(request, photos.map((p) => p.blob));
      const { data } = await request(authPaths.reports, {
        method: 'POST',
        body: {
          title: details.title.trim(),
          description: details.description.trim(),
          category: details.category,
          severity: Number(details.severity),
          lat: location.lat,
          lng: location.lng,
          areaName: areaName.trim() || undefined,
          imagePaths,
          // Audit fields (database.md §4) — stored alongside whatever the citizen actually
          // chose, even when they didn't apply the suggestion or it disagreed with them.
          aiCategory: aiSuggestion?.category,
          aiSeverity: aiSuggestion?.severity,
        },
      });
      toast('Report submitted — thank you!', 'success');
      router.push(`/reports/${data.id}`);
    } catch (err) {
      toast(err?.message || 'Could not submit your report', 'danger');
      setSubmitting(false); // stay on the step so nothing typed is lost
    }
  }

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Report an issue</h1>
        <p className="mt-1 text-ink-muted">
          Help us keep your city clean and safe. Share the details, a photo and the location.
        </p>
      </div>

      <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />

      <Card>
        {step === 0 && <PhotoStep photos={photos} onChange={setPhotos} />}
        {step === 1 && (
          <LocationStep
            value={location}
            onChange={setLocation}
            areaName={areaName}
            onAreaNameChange={setAreaName}
          />
        )}
        {step === 2 && (
          <DetailsStep
            values={details}
            onChange={updateDetails}
            errors={errors}
            aiSuggestion={aiSuggestion}
            aiLoading={aiLoading}
          />
        )}
        {step === 3 && (
          <ReviewStep
            values={{ ...details, areaName }}
            location={location}
            photoCount={photos.length}
            duplicates={duplicates}
            duplicatesLoading={duplicatesLoading}
          />
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={submitting} disabled={!isLoaded}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit report
          </Button>
        )}
      </div>
    </div>
  );
}
