/**
 * ClubFormView.jsx
 *
 * Unified Create + Edit Club page.
 *
 * Routes:
 *   /create-club          → mode = 'create'
 *   /edit-club/:clubId    → mode = 'edit'  (pre-fills form from API)
 *
 * Layout: split-panel on desktop — form left, live preview right (sticky).
 * On mobile: single column, preview card stacked below the form.
 *
 * Design: "Purposeful Editorial" — Outfit display font, confident spacing,
 * live-preview as the unforgettable anchor element.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextInput,
  Textarea,
  Select,
  Button,
  Text,
  Alert,
  Skeleton,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  ArrowLeft,
  AlertCircle,
  PlusCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { createClub, updateClub } from '../services/api';
import ClubPreviewCard from '../components/ClubPreviewCard';
import ImageUploadZone from '../components/ImageUploadZone';
import LocationAutocomplete from '../components/LocationAutocomplete';

// ─── Static Data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'Sports & Fitness',    label: 'Sports & Fitness' },
  { value: 'Music & Arts',        label: 'Music & Arts' },
  { value: 'Gaming & Social',     label: 'Gaming & Social' },
  { value: 'Tech & Innovation',   label: 'Tech & Innovation' },
  { value: 'Wellness & Yoga',     label: 'Wellness & Yoga' },
  { value: 'Food & Culture',      label: 'Food & Culture' },
];

// ─── Main View ────────────────────────────────────────────────────────────────

const ClubFormView = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();
  const mode = clubId ? 'edit' : 'create';

  // Form state via @mantine/form (AGENTS.md Rule)
  const form = useForm({
    initialValues: {
      name: '',
      bio: '',
      category: '',
      location: '',
      latitude: 0,
      longitude: 0,
      profileImageUrl: '',
    },
    validate: {
      name: (v) =>
        v.trim().length < 3
          ? 'Club name must be at least 3 characters'
          : v.trim().length > 60
          ? 'Club name must be 60 characters or less'
          : null,
      bio: (v) =>
        v.trim().length < 20
          ? 'Description must be at least 20 characters'
          : v.trim().length > 5000
          ? 'Description must be 5000 characters or less'
          : null,
      category: (v) => (!v ? 'Please select a category' : null),
      location: (v) => (!v.trim() ? 'Please enter a location' : null),
    },
  });

  // S3 upload hook
  const { uploadImage, uploading, progress, uploadedUrl, error: uploadError, reset: resetUpload } = useImageUpload();

  // Sync uploaded URL into form when upload completes
  useEffect(() => {
    if (uploadedUrl) {
      form.setFieldValue('profileImageUrl', uploadedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedUrl]);

  // Page-level state
  // AGENTS.md Rule: initialize loading to true in useState, never call setLoading(true) inside useEffect
  const [loadingClub, setLoadingClub] = useState(mode === 'edit');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Edit mode: pre-fill form from API
  useEffect(() => {
    if (mode !== 'edit' || !clubId) return;

    async function fetchClub() {
      try {
        const { get } = await import('../services/api');
        const club = await get(`/api/clubs/${clubId}`);
        form.setValues({
          name: club.name || '',
          bio: club.bio || '',
          category: club.category || '',
          location: club.city || '',
          latitude: club.latitude || 0,
          longitude: club.longitude || 0,
          profileImageUrl: club.profileImageUrl || '',
        });
        // If existing image URL, treat it as already "uploaded"
        if (club.profileImageUrl) {
          form.setFieldValue('profileImageUrl', club.profileImageUrl);
        }
      } catch {
        setSubmitError('Failed to load club data. Please try again.');
      } finally {
        setLoadingClub(false);
      }
    }

    fetchClub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, mode]);

  // Handle file selected in the upload zone
  const handleFile = useCallback(async (file) => {
    await uploadImage(file);
  }, [uploadImage]);

  const handleResetUpload = () => {
    resetUpload();
    form.setFieldValue('profileImageUrl', '');
  };

  // Form submit
  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      if (mode === 'create') {
        const newClub = await createClub({
          name: values.name.trim(),
          bio: values.bio.trim(),
          profileImageUrl: values.profileImageUrl || null,
          category: values.category,
          city: values.location.trim(),
          latitude: values.latitude || 0,
          longitude: values.longitude || 0,
        });
        navigate(`/club/${newClub.id}`);
      } else {
        await updateClub(Number(clubId), {
          name: values.name.trim(),
          bio: values.bio.trim(),
          profileImageUrl: values.profileImageUrl || null,
          category: values.category,
          city: values.location.trim(),
          latitude: values.latitude || 0,
          longitude: values.longitude || 0,
        });
        navigate(`/club/${clubId}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Derive the current image to show in the preview (uploaded > form value)
  const previewImageUrl = uploadedUrl || form.values.profileImageUrl;

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
              className="text-blue-600 uppercase tracking-widest"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {mode === 'create' ? 'New Community' : 'Edit Community'}
            </Text>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {mode === 'create' ? 'Start a Community' : 'Update Your Club'}
            </h1>
            <Text size="sm" className="text-gray-500 mt-1">
              {mode === 'create'
                ? 'Build a space where people connect around shared passions.'
                : 'Update your club profile to keep your community informed.'}
            </Text>
          </div>
        </div>

        {/* ── Split Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 items-start">

          {/* ── LEFT: Form ── */}
          <div>
            {loadingClub ? (
              /* Edit mode skeleton while fetching club data */
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-5">
                {[1, 2, 3, 4, 5].map((k) => (
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
                {/* Section A: Identity */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">A</span>
                    </div>
                    <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
                      Identity
                    </Text>
                  </div>

                  <TextInput
                    id="club-name"
                    label="Club Name"
                    placeholder="e.g. Sunday Morning Runners"
                    description="3–60 characters"
                    withAsterisk
                    {...form.getInputProps('name')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />

                  <Textarea
                    id="club-bio"
                    label="Description"
                    placeholder="Tell potential members what your club is about, who it's for, and what they can expect…"
                    description="20–5000 characters"
                    minRows={4}
                    withAsterisk
                    autosize
                    {...form.getInputProps('bio')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Section B: Details */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-purple-600">B</span>
                    </div>
                    <Text fw={700} size="sm" className="text-gray-800 uppercase tracking-wide">
                      Details
                    </Text>
                  </div>

                  <Select
                    id="club-category"
                    label="Category"
                    placeholder="What kind of club is this?"
                    data={CATEGORIES}
                    withAsterisk
                    searchable
                    {...form.getInputProps('category')}
                    styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
                  />

                  <LocationAutocomplete
                    label="Location"
                    placeholder="e.g. Mumbai, Maharashtra"
                    description="The city or area your club is based in"
                    required
                    searchType="city"
                    value={form.values.location}
                    error={form.errors.location}
                    onChange={({ label, latitude, longitude }) => {
                      form.setFieldValue('location',  label);
                      form.setFieldValue('latitude',  latitude);
                      form.setFieldValue('longitude', longitude);
                    }}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Section C: Image */}
                <div className="flex flex-col gap-4">
                  <ImageUploadZone
                    onFile={handleFile}
                    uploading={uploading}
                    progress={progress}
                    uploadedUrl={uploadedUrl || (mode === 'edit' ? form.values.profileImageUrl : null)}
                    error={uploadError}
                    onReset={handleResetUpload}
                    label="Club Image"
                    hint="Optional — a great image boosts member interest"
                  />
                </div>

                {/* Submit error */}
                {submitError && (
                  <Alert icon={<AlertCircle size={16} />} color="red" radius="md">
                    {submitError}
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  id="submit-club-btn"
                  type="submit"
                  size="lg"
                  radius="md"
                  loading={submitLoading}
                  disabled={uploading}
                  leftSection={mode === 'create' ? <PlusCircle size={18} /> : <Save size={18} />}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors border-0 shadow-md hover:shadow-lg mt-1"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}
                >
                  {mode === 'create' ? 'Create Club' : 'Save Changes'}
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
            <ClubPreviewCard
              name={form.values.name}
              bio={form.values.bio}
              category={form.values.category}
              location={form.values.location}
              profileImageUrl={previewImageUrl}
              managerName={dbUser?.name || user?.displayName || 'you'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubFormView;
