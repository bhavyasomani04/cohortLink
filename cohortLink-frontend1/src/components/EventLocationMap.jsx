/**
 * EventLocationMap.jsx
 *
 * Displays an interactive Leaflet map card with a marker for an event's
 * location. Also provides an "Open in Google Maps" deep-link.
 *
 * Props:
 *   locationName — human-readable address string (shown above map + in popup)
 *   latitude     — number
 *   longitude    — number
 *
 * Graceful fallbacks:
 *   - If coordinates are 0,0 or missing → shows text-only card, no map
 *   - Leaflet CSS is imported here so it's only loaded when this component mounts
 */

import 'leaflet/dist/leaflet.css';
import '../utils/leafletFix'; // Fix Vite + Leaflet marker icon bug — must be before MapContainer

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Text, Group } from '@mantine/core';
import { MapPin, ExternalLink } from 'lucide-react';

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventLocationMap({ locationName, latitude, longitude }) {
  const hasCoords = latitude != null && longitude != null
    && !(latitude === 0 && longitude === 0);

  const googleMapsUrl = hasCoords
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(locationName || '')}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="bg-indigo-50 p-1.5 rounded-lg mt-0.5 shrink-0">
            <MapPin size={16} className="text-indigo-500" />
          </div>
          <div>
            <Text size="xs" fw={600} className="text-gray-400 uppercase tracking-widest mb-0.5">
              Location
            </Text>
            <Text size="sm" fw={600} className="text-gray-800 leading-snug">
              {locationName || 'Venue TBA'}
            </Text>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors shrink-0 mt-1"
        >
          Open in Maps
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Map or Fallback */}
      {hasCoords ? (
        <div className="h-[220px] w-full">
          <MapContainer
            center={[latitude, longitude]}
            zoom={15}
            scrollWheelZoom={false}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            // key forces remount if coordinates change (e.g. edit → save)
            key={`${latitude},${longitude}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[latitude, longitude]}>
              <Popup>
                <Text size="xs" fw={600}>{locationName}</Text>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        /* No coordinates — text-only fallback */
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-xl h-24 flex items-center justify-center border border-dashed border-gray-200">
            <Text size="xs" className="text-gray-400 text-center">
              Map unavailable — no coordinates yet
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
