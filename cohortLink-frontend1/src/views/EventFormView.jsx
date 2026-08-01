/**
 * EventFormView.jsx
 *
 * Unified Create + Edit Event page.
 *
 * Routes:
 *   /create-event?clubId=<id>   → mode = 'create'  (clubId from search param)
 *   /edit-event/:eventId        → mode = 'edit'     (pre-fills form from API)
 *
 * Layout: split-panel on desktop — form left, live preview right (sticky).
 * On mobile: single column, preview stacked below form.
 *
 * Design: "Warm Urgency" — Outfit display font, amber/orange accent palette
 * to visually distinguish event creation from club creation (blue). Events
 * are time-sensitive; the warm palette communicates urgency and excitement.
 *
 * API patterns applied (frontend-api-integration-patterns skill):
 *   - Race-safe useEffect with cancellation flag for edit-mode prefill
 *   - ApiError typed error handling (4xx vs 5xx)
 *   - Centralized api.js only — no raw fetch()
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Text,
  Alert,
  Skeleton,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

import {
  ArrowLeft,
  AlertCircle,
  PlusCircle,
  Save,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { createEvent, updateEvent, getClubById, ApiError } from '../services/api';
import ImageUploadZone from '../components/ImageUploadZone';
import EventPreviewCard from '../components/EventPreviewCard';
import LocationAutocomplete from '../components/LocationAutocomplete';

// ─── Main View ────────────────────────────────────────────────────────────────

const EventFormView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dbUser } = useAuth();

  // Mode detection
  const mode = eventId ? 'edit' : 'create';
  // clubId is provided via query param on create, fetched from event on edit
  const clubIdFromQuery = searchParams.get('clubId');

  // ── Form state via @mantine/form (AGENTS.md Rule) ──
  const form = useForm({
    initialValues: {
      title:         '',
      description:   '',
      startDateTime: null,
      endDateTime:   null,
      location:      '',
      latitude:      0,
      longitude:     0,
      capacity:      '',
      bannerImageUrl: '',
    },
    validate: {
      title: (v) =>
        v.trim().length < 3   ? 'Event title must be at least 3 characters' :
        v.trim().length > 80  ? 'Event title must be 80 characters or less' :
        null,
      description: (v) =>
        v.trim().length < 20   ? 'Description must be at least 20 characters' :
        v.trim().length > 5000 ? 'Description must be 5000 characters or less' :
        null,
      startDateTime: (v) => {
        if (!v) return 'Start date and time is required';
        if (mode === 'create' && dayjs(v).isBefore(dayjs())) {
          return 'Start time must be in the future';
        }
        return null;
      },
      endDateTime: (v, values) => {
        if (!v) return 'End date and time is required';
        if (values.startDateTime && dayjs(v).isSameOrBefore(dayjs(values.startDateTime))) {
          return 'End time must be after start time';
        }
        return null;
      },
      location: (v) => (!v.trim() ? 'Please enter a location' : null),
      capacity: (v) => {
        const n = Number(v);
        if (!v && v !== 0) return 'Capacity is required';
        if (!Number.isInteger(n) || n < 1) return 'Capacity must be at least 1';
        if (n > 10000) return 'Capacity cannot exceed 10,000';
        return null;
      },
    },
  });

  // ── S3 upload hook ──
  const {
    uploadImage,
    uploading,
    progress,
    uploadedUrl,
    error: uploadError,
    reset: resetUpload,
  } = useImageUpload();

  // Sync uploaded URL into form when upload completes
  useEffect(() => {
    if (uploadedUrl) {
      form.setFieldValue('bannerImageUrl', uploadedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedUrl]);

  // ── Page-level state ──
  // AGENTS.md Rule: initialize loading to true in useState, never setLoading(true) in useEffect
  const [loadingEvent, setLoadingEvent]   = useState(mode === 'edit');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]     = useState(null);
  const [clubName, setClubName]           = useState('');
  const [resolvedClubId, setResolvedClubId] = useState(clubIdFromQuery || null);

  // ── Edit mode: prefill form from API (race-safe per skill) ──
  useEffect(() => {
    if (mode !== 'edit' || !eventId) return;

    let cancelled = false;

    async function fetchEvent() {
      try {
        const { get } = await import('../services/api');
        const event = await get(`/api/events/${eventId}`);

        if (cancelled) return;

        form.setValues({
          title:          event.title        || '',
          description:    event.description  || '',
          startDateTime:  event.eventTime ? new Date(event.eventTime) : null,
          endDateTime:    event.eventTime ? new Date(new Date(event.eventTime).getTime() + 60*60*1000) : null,
          location:       event.locationName || '',
          latitude:       event.latitude     || 0,
          longitude:      event.longitude    || 0,
          capacity:       event.maxCapacity  || '',
          bannerImageUrl: event.imageUrl     || '',
        });

        if (event.clubId) {
          setResolvedClubId(event.clubId);
        }
      } catch (err) {
        if (cancelled) return;
        setSubmitError(
          err instanceof ApiError && !err.isRetryable
            ? err.message
            : 'Failed to load event data. Please try again.',
        );
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    }

    fetchEvent();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, mode]);

  // ── Fetch club name for the preview badge (create or edit) ──
  useEffect(() => {
    if (!resolvedClubId) return;
    let cancelled = false;

    getClubById(resolvedClubId)
      .then((club) => { if (!cancelled) setClubName(club?.name || ''); })
      .catch(() => { /* non-critical — preview badge just won't show */ });

    return () => { cancelled = true; };
  }, [resolvedClubId]);

  // ── Handle image file selected ──
  const handleFile = useCallback(async (file) => {
    await uploadImage(file);
  }, [uploadImage]);

  const handleResetUpload = () => {
    resetUpload();
    form.setFieldValue('bannerImageUrl', '');
  };

  // ── Form submit ──
  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    setSubmitError(null);

    const payload = {
      title:          values.title.trim(),
      description:    values.description.trim(),
      location:       values.location.trim(),
      startDateTime:  dayjs(values.startDateTime).toISOString(),
      endDateTime:    dayjs(values.endDateTime).toISOString(),
      capacity:       Number(values.capacity),
      bannerImageUrl: values.bannerImageUrl || null,
      latitude:       values.latitude  || 0,
      longitude:      values.longitude || 0,
    };

    try {
      if (mode === 'create') {
        const newEvent = await createEvent({
          ...payload,
          clubId: Number(resolvedClubId),
        });
        const newEventId = newEvent.id || newEvent.eventId;
        if (newEventId) {
          navigate(`/event/${newEventId}`);
        } else {
          // Fallback if the backend doesn't return the ID in the response
          navigate('/?view=all');
        }
      } else {
        await updateEvent(Number(eventId), payload);
        navigate(`/event/${eventId}`);
      }
    } catch (err) {
      // Distinguish typed 4xx (show as-is) from 5xx/network (generic message)
      if (err instanceof ApiError && !err.isRetryable) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Derive current banner for preview (uploaded URL takes precedence)
  const previewBannerUrl = uploadedUrl || form.values.bannerImageUrl;

  // ── Shared section badge factory ──
  const SectionBadge = ({ letter, colorClass }) => (
    <div className={`w-6 h-6 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold" style={{ color: 'inherit' }}>{letter}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google Font — Outfit */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="flex flex-col gap-1">
            <Text
              size="xs"
              fw={600}
              className="text-amber-600 uppercase tracking-widest"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {mode === 'create' ? 'New Event' : 'Edit Event'}
            </Text>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {mode === 'create' ? 'Create an Event' : 'Update Your Event'}
            </h1>
            <Text size="sm" className="text-gray-500 mt-1">
              {mode === 'create'
                ? 'Bring your community together. Fill in the details below.'
                : 'Update your event details to keep attendees informed.'}
            </Text>
          </div>
        </div>

        {/* ── Split Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 items-start">

          {/* ── LEFT: Form ── */}
          <div>
            {loadingEvent ? (
              /* Edit mode skeleton */
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-5">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div key={k} className="flex flex-col gap-2">
                    <Skeleton height={12} width="30%" radius="xl" />
                    <Skeleton height={40} radius="md" />
                  </div>
                ))}
              </div>
            ) : (
              <form
                onSubmit={form.onSubmit(handleSubmit)}
                noValidate
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6"
              >

                {/* ── Section A: Identity ── */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-amber-600">A</span>
                    </div>
                    <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
                      Identity
                    </Text>
                  </div>

                  <TextInput
                    id="event-title"
                    label="Event Title"
                    placeholder="e.g. Sunday Morning 5K Run"
                    description="3–80 characters"
                    withAsterisk
                    {...form.getInputProps('title')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />

                  <Textarea
                    id="event-description"
                    label="Description"
                    placeholder="Tell attendees what this event is about, what to bring, and what to expect…"
                    description="20–5000 characters"
                    minRows={4}
                    withAsterisk
                    autosize
                    {...form.getInputProps('description')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* ── Section B: Schedule ── */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-orange-600">B</span>
                    </div>
                    <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
                      Schedule
                    </Text>
                  </div>

                  {/* Start → End with arrow — the memorable anchor for this form */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full">
                      <DateTimePicker
                        id="event-start"
                        label="Starts"
                        placeholder="Pick date & time"
                        withAsterisk
                        valueFormat="MMM D, YYYY · h:mm A"
                        minDate={mode === 'create' ? new Date() : undefined}
                        clearable
                        dropdownType="modal"
                        {...form.getInputProps('startDateTime')}
                        styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                      />
                    </div>

                    <div className="hidden sm:flex items-center pt-6 text-gray-300">
                      <ArrowRight size={20} />
                    </div>

                    <div className="flex-1 w-full">
                      <DateTimePicker
                        id="event-end"
                        label="Ends"
                        placeholder="Pick date & time"
                        withAsterisk
                        valueFormat="MMM D, YYYY · h:mm A"
                        minDate={form.values.startDateTime || (mode === 'create' ? new Date() : undefined)}
                        clearable
                        dropdownType="modal"
                        {...form.getInputProps('endDateTime')}
                        styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                      />
                    </div>
                  </div>

                  {/* Duration indicator */}
                  {form.values.startDateTime && form.values.endDateTime &&
                   dayjs(form.values.endDateTime).isAfter(dayjs(form.values.startDateTime)) && (
                    <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                      <CalendarDays size={14} className="text-amber-500 shrink-0" />
                      <Text size="xs" className="text-amber-700 font-medium">
                        Duration:{' '}
                        {(() => {
                          const mins = dayjs(form.values.endDateTime).diff(
                            dayjs(form.values.startDateTime), 'minute',
                          );
                          const hrs = Math.floor(mins / 60);
                          const rem = mins % 60;
                          return hrs > 0 ? `${hrs}h${rem > 0 ? ` ${rem}m` : ''}` : `${mins}m`;
                        })()}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* ── Section C: Details ── */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-rose-600">C</span>
                    </div>
                    <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
                      Details
                    </Text>
                  </div>

                  <LocationAutocomplete
                    label="Address"
                    placeholder="e.g. Shivaji Park, Dadar, Mumbai"
                    description="Search for a venue or address in India"
                    required
                    searchType="address"
                    value={form.values.location}
                    error={form.errors.location}
                    onChange={({ label, latitude, longitude }) => {
                      form.setFieldValue('location',  label);
                      form.setFieldValue('latitude',  latitude);
                      form.setFieldValue('longitude', longitude);
                    }}
                  />

                  <NumberInput
                    id="event-capacity"
                    label="Capacity"
                    placeholder="e.g. 50"
                    description="Maximum number of attendees (1–10,000)"
                    withAsterisk
                    min={1}
                    max={10000}
                    allowDecimal={false}
                    {...form.getInputProps('capacity')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* ── Section D: Banner Image ── */}
                <ImageUploadZone
                  onFile={handleFile}
                  uploading={uploading}
                  progress={progress}
                  uploadedUrl={
                    uploadedUrl ||
                    (mode === 'edit' ? form.values.bannerImageUrl : null)
                  }
                  error={uploadError}
                  onReset={handleResetUpload}
                  label="Event Banner"
                  hint="Optional — a compelling banner drives registrations"
                />

                {/* Submit error */}
                {submitError && (
                  <Alert icon={<AlertCircle size={16} />} color="red" radius="md">
                    {submitError}
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  id="submit-event-btn"
                  type="submit"
                  size="lg"
                  radius="md"
                  loading={submitLoading}
                  disabled={uploading}
                  leftSection={mode === 'create' ? <PlusCircle size={18} /> : <Save size={18} />}
                  className="border-0 shadow-md hover:shadow-lg mt-1 transition-all duration-200"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  }}
                >
                  {mode === 'create' ? 'Create Event' : 'Save Changes'}
                </Button>

                {uploading && (
                  <Text size="xs" className="text-center text-gray-400">
                    Please wait for the image upload to finish before submitting.
                  </Text>
                )}
              </form>
            )}
          </div>

          {/* ── RIGHT: Live Preview (sticky on desktop) ── */}
          <div className="lg:sticky lg:top-8">
            <EventPreviewCard
              title={form.values.title}
              description={form.values.description}
              startDateTime={form.values.startDateTime}
              endDateTime={form.values.endDateTime}
              location={form.values.location}
              capacity={Number(form.values.capacity) || 0}
              bannerImageUrl={previewBannerUrl}
              clubName={clubName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFormView;
