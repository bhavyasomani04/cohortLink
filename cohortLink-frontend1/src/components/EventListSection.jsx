import React, { useEffect, useRef } from 'react';
import { Card, Text, Group, Skeleton, Button, SimpleGrid, Center, Stack, ThemeIcon, Loader } from '@mantine/core';
import { formatEventDate, formatEventTime } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

function EventCard({ event }) {
  const navigate = useNavigate();
  const eventDate = event.eventTime || event.date;
  const eventLoc = event.locationName || event.location;

  const dateLabel = formatEventDate(eventDate);
  const timeLabel = formatEventTime ? formatEventTime(eventDate) : null;

  return (
    <Card
      id={`event-card-${event.id}`}
      radius="md"
      padding={0}
      className="overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col"
      component="article"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        <img
          src={event.imageUrl || '/hero_banner.jpg'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Date badge — top right */}
        {dateLabel && (
          <div
            className="absolute top-3 right-3 text-white text-xs font-bold px-2 py-1 rounded"
            style={{ backgroundColor: '#1d4ed8', minWidth: '48px', textAlign: 'center' }}
          >
            {dateLabel}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <Text
          fw={700}
          size="md"
          className="text-gray-900 mb-2 leading-snug line-clamp-2"
        >
          {event.title}
        </Text>
        <Group gap="xs" className="mt-auto flex-wrap pt-2">
          {eventLoc && (
            <Group gap={4} className="text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <Text size="xs" className="text-gray-500">{eventLoc}</Text>
            </Group>
          )}
          {timeLabel && (
            <Group gap={4} className="text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <Text size="xs" className="text-gray-500">{timeLabel}</Text>
            </Group>
          )}
        </Group>
      </div>
    </Card>
  );
}

function EmptyEventsState({ title, message }) {
  return (
    <Card
      radius="md"
      padding="xl"
      className="border border-gray-100 bg-white text-center w-full py-16"
    >
      <Center>
        <Stack align="center" gap="sm">
          <ThemeIcon size={64} radius="100%" variant="light" color="blue">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </ThemeIcon>
          <Text size="lg" fw={600} className="text-gray-800 mt-2">
            {title || "No current events going on"}
          </Text>
          <Text size="sm" c="dimmed" className="max-w-md mx-auto">
            {message || "It's a bit quiet in your area. Why not start something amazing?"}
          </Text>
          {(!title || title === "No current events going on") && (
            <Button
              component="a"
              href="/create-club"
              variant="light"
              color="blue"
              radius="md"
              mt="md"
            >
              Become the first club owner
            </Button>
          )}
        </Stack>
      </Center>
    </Card>
  );
}

export default function EventListSection({
  events,
  loading,
  onLoadMore,
  hasMore,
  loadingMore,
  title = "Upcoming Events",
  emptyStateTitle,
  emptyStateMessage
}) {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          if (onLoadMore) onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Load a bit earlier before user reaches the bottom
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const currentTarget = observerTarget.current;
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, onLoadMore]);

  return (
    <section className="px-6 md:px-10 py-10 bg-[#f5f5f5]" aria-labelledby="events-list-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 id="events-list-heading" className="text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {loading ? (
        /* Loading skeletons — 3 columns */
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3].map((k) => (
            <Card key={k} radius="md" padding={0} className="overflow-hidden border border-gray-100 bg-white" aria-hidden="true">
              <Skeleton height={200} radius={0} />
              <div className="p-4 flex flex-col gap-2">
                <Skeleton height={14} width="75%" radius="xl" />
                <Skeleton height={11} width="50%" radius="xl" />
              </div>
            </Card>
          ))}
        </SimpleGrid>
      ) : events.length === 0 ? (
        <EmptyEventsState title={emptyStateTitle} message={emptyStateMessage} />
      ) : (
        <>
          {/* 3-column Grid for events */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </SimpleGrid>
          
          {/* Intersection Observer Sentinel */}
          {hasMore && (
            <div ref={observerTarget} className="w-full flex justify-center py-8">
              {loadingMore && <Loader color="blue" size="md" />}
            </div>
          )}
          
          {!hasMore && events.length > 0 && (
            <div className="w-full text-center py-8">
              <Text size="sm" c="dimmed">You've reached the end of the events.</Text>
            </div>
          )}
        </>
      )}
    </section>
  );
}
