/**
 * LocationAutocomplete.jsx
 *
 * A smart address search input backed by the MapBox Geocoding API.
 * Renders a Mantine Combobox with a debounced search — enterprise pattern.
 *
 * Props:
 *   value         — current display string (the address text shown in input)
 *   onChange      — called with { label, latitude, longitude } on selection
 *   error         — validation error string from @mantine/form
 *   label         — input label text
 *   placeholder   — input placeholder text
 *   description   — input description text (shown below label)
 *   required      — whether to show the asterisk
 *   searchType    — 'address' (default) or 'city'
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Combobox,
  TextInput,
  useCombobox,
  Loader,
  Text,
} from '@mantine/core';
import { MapPin, Building2 } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEBOUNCE_MS  = 400;

// ─── MapBox Geocoding fetch ────────────────────────────────────────────────────

async function fetchSuggestions(query, searchType) {
  if (!query || query.trim().length < 2) return [];

  const encoded = encodeURIComponent(query.trim());
  const types = searchType === 'city' ? 'place' : 'address,poi,place,locality,neighborhood';
  
  const url = [
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`,
    `?access_token=${MAPBOX_TOKEN}`,
    `&country=in`,
    `&types=${types}`,
    `&limit=6`,
    `&language=en`,
  ].join('');

  const res = await fetch(url);
  if (!res.ok) throw new Error('MapBox geocoding failed');
  const data = await res.json();

  // Map MapBox feature to simple { id, label, latitude, longitude }
  return (data.features || []).map((f) => ({
    id:        f.id,
    label:     f.place_name,
    latitude:  f.center[1], // MapBox returns [lng, lat]
    longitude: f.center[0],
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationAutocomplete({
  value,
  onChange,
  error,
  label        = 'Address',
  placeholder  = 'Search...',
  description  = 'Start typing to search — select from suggestions',
  required     = false,
  searchType   = 'address',
}) {
  const combobox   = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [options, setOptions]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const debounceRef = useRef(null);

  // ── Sync external value changes ──
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value || '');
    }
  }, [value]);

  // ── Debounced search ──
  const handleInput = useCallback((raw) => {
    setInputValue(raw);

    clearTimeout(debounceRef.current);

    if (!raw || raw.trim().length < 2) {
      setOptions([]);
      combobox.closeDropdown();
      return;
    }

    setSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(raw, searchType);
        setOptions(results);
        if (results.length > 0) combobox.openDropdown();
        else combobox.closeDropdown();
      } catch {
        setOptions([]);
        combobox.closeDropdown();
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
  }, [combobox]);

  // ── Option selected ──
  const handleSelect = useCallback((optionId) => {
    const selected = options.find((o) => o.id === optionId);
    if (!selected) return;
    setInputValue(selected.label);
    setOptions([]);
    combobox.closeDropdown();
    onChange({ label: selected.label, latitude: selected.latitude, longitude: selected.longitude });
  }, [options, combobox, onChange]);

  return (
    <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal={false}>
      <Combobox.Target>
        <TextInput
          id="event-location"
          label={label}
          description={description}
          placeholder={placeholder}
          withAsterisk={required}
          error={error}
          value={inputValue}
          onChange={(e) => handleInput(e.currentTarget.value)}
          onFocus={() => options.length > 0 && combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setInputValue(value || '');
          }}
          leftSection={searchType === 'city' ? <Building2 size={15} className="text-gray-400" /> : <MapPin size={15} className="text-gray-400" />}
          rightSection={searching ? <Loader size={14} /> : null}
          autoComplete="off"
          styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length > 0 ? (
            options.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option.id}
                className="cursor-pointer"
              >
                <div className="flex items-start gap-2 py-0.5">
                  {searchType === 'city' 
                    ? <Building2 size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    : <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  }
                  <Text size="sm" className="text-gray-800 leading-snug">
                    {option.label}
                  </Text>
                </div>
              </Combobox.Option>
            ))
          ) : (
            <Combobox.Empty>No results found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
