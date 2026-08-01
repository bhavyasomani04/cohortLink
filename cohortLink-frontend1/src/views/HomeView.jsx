import { useState, useEffect } from 'react';
import { Text, Group, Loader } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import EventListSection from '../components/EventListSection';
import ClubCategories from '../components/ClubCategories';
import { useUserLocation } from '../context/LocationContext';
import {
  getEvents,
  getEventsByLocation,
  getClubCategories,
  searchEvents,
} from '../services/api';
import {
  MOCK_EVENTS,
  MOCK_CLUB_CATEGORIES,
} from '../services/mockData';

// Polyfills for APIs that might not exist yet in api.js but are needed by the plan
async function getEventsByClubAPI(clubId, page = 0, size = 12) {
  const { get } = await import('../services/api');
  try {
    return await get(`/api/events/club/${clubId}?page=${page}&size=${size}`);
  } catch (err) {
    console.warn("Club events API might not be implemented, returning all events");
    return getEvents(page, size);
  }
}

// ─── Location Status Banner ───────────────────────────────────────────────────

/**
 * A small non-intrusive banner that tells the user how their location
 * was resolved. Shown only briefly so it doesn't clutter the UI.
 */
function LocationBanner({ location, loading }) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 px-6 py-2 text-xs text-gray-500 bg-white border-b border-gray-100"
      >
        <Loader size="xs" color="blue" />
        <span>Detecting your location…</span>
      </div>
    );
  }

  if (!location) return null;

  const sourceLabel = {
    cache: '📍',
    gps: '📡 Located via GPS',
    ip: '🌐 Located via network',
    default: '🗺️ Using default location',
  }[location.source] ?? '📍';

  const cityLabel = location.city
    ? `${location.city}${location.region ? `, ${location.region}` : ''}`
    : 'Your area';

  // Don't show a label for the cache hit — it's already a known location.
  if (location.source === 'cache') return null;

  return (
    <Group
      role="status"
      aria-live="polite"
      gap="xs"
      className="px-6 py-2 bg-white border-b border-gray-100"
    >
      <Text size="xs" c="dimmed">
        {sourceLabel} — Showing events near <strong className="text-blue-600">{cityLabel}</strong>
      </Text>
    </Group>
  );
}


// ─── HomeView ─────────────────────────────────────────────────────────────────

export default function HomeView() {
  const { location, locationLoading } = useUserLocation();
  const [searchParams] = useSearchParams();

  const querySearch = searchParams.get('search');
  const queryClubId = searchParams.get('clubId');
  const queryViewAll = searchParams.get('view') === 'all';
  
  const isFilteredView = !!querySearch || !!queryClubId || queryViewAll;

  // Upcoming events state — location-aware
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsPage, setEventsPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Club categories state
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  // ── Fetch events (location-aware or parameter-aware) ─────────────────────────────────────────
  const fetchEventsData = async (pageToLoad) => {
    let apiCall;
    
    if (querySearch) {
      const canUseLocation = location && location.lat != null && location.lng != null;
      if (canUseLocation) {
        const isPrecise = location.source === 'gps' || location.originalSource === 'gps';
        const radiusKm = isPrecise ? 20 : 50;
        apiCall = searchEvents(querySearch, location.lat, location.lng, radiusKm, pageToLoad, 12);
      } else {
        // Fallback: If no location is available, backend requires lat/long for search.
        apiCall = getEvents(pageToLoad, 12);
      }
    } else if (queryClubId) {
      apiCall = getEventsByClubAPI(queryClubId, pageToLoad, 12);
    } else if (queryViewAll) {
      apiCall = getEvents(pageToLoad, 12);
    } else {
      const canUseLocation = location && location.lat != null && location.lng != null;
      if (canUseLocation) {
        const isPrecise = location.source === 'gps' || location.originalSource === 'gps';
        const radiusKm = isPrecise ? 20 : 50;
        apiCall = getEventsByLocation(location.lat, location.lng, radiusKm, pageToLoad, 12);
      } else {
        apiCall = getEvents(pageToLoad, 12);
      }
    }

    try {
      const response = await apiCall;
      // Handle both direct arrays and Spring Data Page objects
      const newEvents = Array.isArray(response) ? response : (response?.content || []);
      
      if (newEvents.length < 12) {
        setHasMoreEvents(false);
      } else {
        setHasMoreEvents(true);
      }
      
      if (pageToLoad === 0) {
        setEvents(newEvents);
      } else {
        setEvents((prev) => {
          // Prevent duplicates just in case
          const existingIds = new Set(prev.map(e => e.id));
          const filteredNew = newEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...filteredNew];
        });
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
      if (pageToLoad === 0) {
        setEvents(MOCK_EVENTS);
        setHasMoreEvents(false);
      }
    }
  };

  useEffect(() => {
    if (locationLoading) return;
    
    setEventsLoading(true);
    setEventsPage(0);
    fetchEventsData(0).finally(() => setEventsLoading(false));
  }, [locationLoading, location, querySearch, queryClubId, queryViewAll]);

  const loadMoreEvents = async () => {
    if (loadingMore || !hasMoreEvents) return;
    setLoadingMore(true);
    const nextPage = eventsPage + 1;
    await fetchEventsData(nextPage);
    setEventsPage(nextPage);
    setLoadingMore(false);
  };

  // ── Fetch club categories ─────────────────────────────────────────────────
  // Not location-dependent; fetch immediately on mount.
  useEffect(() => {
    getClubCategories()
      .then(res => setClubs(Array.isArray(res) ? res : (res?.content || [])))
      .catch(() => setClubs(MOCK_CLUB_CATEGORIES))
      .finally(() => setClubsLoading(false));
  }, []);

  // Determine list title and empty state
  let listTitle = "Upcoming Events";
  let emptyTitle = "No current events going on";
  let emptyMsg = "It's a bit quiet in your area. Why not start something amazing?";
  
  if (querySearch) {
    listTitle = `Search Results for "${querySearch}"`;
    emptyTitle = "No events found";
    emptyMsg = "Try adjusting your search terms.";
  } else if (queryClubId) {
    listTitle = "Club Events";
    emptyTitle = "No club events";
    emptyMsg = "This club hasn't scheduled any events yet.";
  } else if (queryViewAll) {
    listTitle = "All Events";
    emptyTitle = "No events found";
    emptyMsg = "There are no events on the platform right now.";
  }

  return (
    <main id="main-content" role="main" className="flex-1 flex flex-col">
      {!isFilteredView && <LocationBanner location={location} loading={locationLoading} />}
      
      <EventListSection 
        events={events} 
        loading={eventsLoading} 
        onLoadMore={loadMoreEvents}
        hasMore={hasMoreEvents}
        loadingMore={loadingMore}
        title={listTitle}
        emptyStateTitle={emptyTitle}
        emptyStateMessage={emptyMsg}
      />
      
      {!isFilteredView && <ClubCategories clubs={clubs} loading={clubsLoading} />}
    </main>
  );
}
