/**
 * EventPreviewCard.jsx
 *
 * Pure presentational component — receives form values as props and renders
 * a live preview of how the event card will look. No state, no effects.
 *
 * Also renders a completion checklist to motivate the user to fill every field.
 */

import { Badge, Text, Group } from '@mantine/core';
import { MapPin, Calendar, Clock, Users, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

const CHECKLIST = [
  { label: 'Event title',   check: (v) => v.title.trim().length >= 3 },
  { label: 'Description',   check: (v) => v.description.trim().length >= 20 },
  { label: 'Start time',    check: (v) => !!v.startDateTime },
  { label: 'End time',      check: (v) => !!v.endDateTime },
  { label: 'Location',      check: (v) => !!v.location.trim() },
  { label: 'Capacity set',  check: (v) => v.capacity >= 1 },
  { label: 'Banner image',  check: (v) => !!v.bannerImageUrl },
];

/**
 * Generates a deterministic warm gradient from the event title string.
 * Keeps the visual anchor amber/orange as per the design plan.
 */
function titleToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Bias toward amber/orange range (20–50°)
  return 20 + (Math.abs(hash) % 30);
}

function formatDateTime(dt) {
  if (!dt) return null;
  return dayjs(dt).format('ddd, MMM D · h:mm A');
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   startDateTime: Date | null,
 *   endDateTime: Date | null,
 *   location: string,
 *   capacity: number,
 *   bannerImageUrl: string,
 *   clubName?: string,
 * }} props
 */
export default function EventPreviewCard({
  title,
  description,
  startDateTime,
  endDateTime,
  location,
  capacity,
  bannerImageUrl,
  clubName,
}) {
  const hue = titleToHue(title || 'event');
  const values = { title, description, startDateTime, endDateTime, location, capacity, bannerImageUrl };
  const completedCount = CHECKLIST.filter((item) => item.check(values)).length;

  const formattedStart = formatDateTime(startDateTime);
  const formattedEnd   = formatDateTime(endDateTime);

  // Duration label e.g. "2 hrs"
  let durationLabel = null;
  if (startDateTime && endDateTime) {
    const diffMins = dayjs(endDateTime).diff(dayjs(startDateTime), 'minute');
    if (diffMins > 0) {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationLabel = hrs > 0
        ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`
        : `${mins}m`;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <Text size="xs" fw={600} className="text-gray-400 uppercase tracking-widest">
          Live Preview
        </Text>
        <Text size="xs" className="text-gray-400">
          {completedCount}/{CHECKLIST.length} complete
        </Text>
      </div>

      {/* Event Card */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white transition-all duration-300">

        {/* Banner / Gradient Header */}
        <div className="relative h-44 w-full overflow-hidden">
          {bannerImageUrl ? (
            <img
              src={bannerImageUrl}
              alt="Event banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 30% 40%,
                  hsl(${hue},85%,55%),
                  hsl(${hue + 15},75%,35%),
                  hsl(${hue + 30},65%,18%))`,
              }}
            >
              {/* Decorative calendar icon as ambient art */}
              <Calendar size={56} className="text-white/20" />
            </div>
          )}

          {/* Duration badge overlay */}
          {durationLabel && (
            <div className="absolute top-3 right-3">
              <Badge
                size="sm"
                radius="md"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {durationLabel}
              </Badge>
            </div>
          )}

          {/* Club badge overlay */}
          {clubName && (
            <div className="absolute top-3 left-3">
              <Badge
                size="sm"
                radius="md"
                style={{
                  background: 'rgba(251,191,36,0.85)',
                  color: '#78350f',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                }}
              >
                {clubName}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-2.5">

          {/* Title */}
          <Text
            fw={700}
            size="lg"
            className="text-gray-900 leading-snug"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {title.trim() || (
              <span className="text-gray-300 italic font-normal">Your event title…</span>
            )}
          </Text>

          {/* Description */}
          <Text size="sm" className="text-gray-500 leading-relaxed min-h-[2.5rem] whitespace-pre-wrap break-words">
            {description.trim() || (
              <span className="text-gray-300 italic">Event description will appear here…</span>
            )}
          </Text>

          {/* Meta row */}
          <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-1.5">

            {/* Schedule */}
            {formattedStart && (
              <Group gap={6} wrap="wrap">
                <Calendar size={13} className="text-amber-500 shrink-0" />
                <Text size="xs" className="text-gray-600 font-medium">{formattedStart}</Text>
                {formattedEnd && (
                  <>
                    <ArrowRight size={11} className="text-gray-300 shrink-0" />
                    <Clock size={13} className="text-amber-400 shrink-0" />
                    <Text size="xs" className="text-gray-500">{dayjs(endDateTime).format('h:mm A')}</Text>
                  </>
                )}
              </Group>
            )}

            {/* Location */}
            {location.trim() && (
              <Group gap={6}>
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <Text size="xs" className="text-gray-500">{location}</Text>
              </Group>
            )}

            {/* Capacity */}
            {capacity >= 1 && (
              <Group gap={6}>
                <Users size={13} className="text-gray-400 shrink-0" />
                <Text size="xs" className="text-gray-500">
                  Up to <span className="font-semibold text-gray-700">{capacity}</span> attendees
                </Text>
              </Group>
            )}
          </div>
        </div>
      </div>

      {/* Completion Checklist */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <Text size="xs" fw={600} className="text-gray-500 uppercase tracking-widest mb-3">
          Event Checklist
        </Text>
        <div className="flex flex-col gap-2">
          {CHECKLIST.map((item) => {
            const done = item.check(values);
            return (
              <div key={item.label} className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 size={15} className="text-amber-500 shrink-0" />
                ) : (
                  <Circle size={15} className="text-gray-300 shrink-0" />
                )}
                <Text size="xs" className={done ? 'text-gray-700' : 'text-gray-400'}>
                  {item.label}
                </Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
