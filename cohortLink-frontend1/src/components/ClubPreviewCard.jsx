/**
 * ClubPreviewCard.jsx
 *
 * Pure presentational component — receives form values as props and renders
 * a live preview of how the club will look to members. No state, no effects.
 *
 * Also renders a completion checklist below the card to motivate the user
 * to fill every field without blocking the submit button.
 */

import { Badge, Text, Group } from '@mantine/core';
import { MapPin, User, CheckCircle2, Circle } from 'lucide-react';
import { getInitials, stringToHue } from '../utils/formatters';

const CHECKLIST = [
  { label: 'Club name',       check: (v) => v.name.trim().length >= 3 },
  { label: 'Description',     check: (v) => v.bio.trim().length >= 20 },
  { label: 'Category',        check: (v) => !!v.category },
  { label: 'Location',        check: (v) => !!v.location.trim() },
  { label: 'Image uploaded',  check: (v) => !!v.profileImageUrl },
];

/**
 * @param {{
 *   name: string,
 *   bio: string,
 *   category: string,
 *   location: string,
 *   profileImageUrl: string,
 *   managerName: string,
 * }} props
 */
export default function ClubPreviewCard({ name, bio, category, location, profileImageUrl, managerName }) {
  const hue = stringToHue(name || 'club');
  const initials = getInitials(name || '?');
  const values = { name, bio, category, location, profileImageUrl };
  const completedCount = CHECKLIST.filter((item) => item.check(values)).length;

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

      {/* Club Card */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-white transition-all duration-300">
        {/* Image / Gradient Header */}
        <div className="relative h-40 w-full overflow-hidden">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Club cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 35%, hsl(${hue},70%,35%), hsl(${(hue + 60) % 360},60%,15%))`,
              }}
            >
              <span className="text-white font-bold text-5xl opacity-30 select-none font-['Outfit']">
                {initials}
              </span>
            </div>
          )}

          {/* Category badge overlay */}
          {category && (
            <div className="absolute top-3 left-3">
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
                {category}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-2">
          <Text
            fw={700}
            size="lg"
            className="text-gray-900 leading-snug"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {name.trim() || (
              <span className="text-gray-300 italic font-normal">Your club name…</span>
            )}
          </Text>

          <Text size="sm" className="text-gray-500 leading-relaxed min-h-[2.5rem] whitespace-pre-wrap break-words">
            {bio.trim() || (
              <span className="text-gray-300 italic">Your club description will appear here…</span>
            )}
          </Text>

          <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-1.5">
            {location.trim() && (
              <Group gap={6}>
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <Text size="xs" className="text-gray-500">{location}</Text>
              </Group>
            )}
            <Group gap={6}>
              <User size={13} className="text-gray-400 shrink-0" />
              <Text size="xs" className="text-gray-500">
                Managed by <span className="font-semibold text-gray-700">{managerName || 'you'}</span>
              </Text>
            </Group>
          </div>
        </div>
      </div>

      {/* Completion Checklist */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <Text size="xs" fw={600} className="text-gray-500 uppercase tracking-widest mb-3">
          Profile Checklist
        </Text>
        <div className="flex flex-col gap-2">
          {CHECKLIST.map((item) => {
            const done = item.check(values);
            return (
              <div key={item.label} className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 size={15} className="text-green-500 shrink-0" />
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
