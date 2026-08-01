import { Badge, Button, Skeleton, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function FeaturedEvent({ event, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section
        aria-busy="true"
        aria-label="Loading featured event"
        className="relative w-full overflow-hidden"
      >
        <Skeleton height={320} radius={0} className="w-full" />
        <div className="px-6 md:px-10 py-6 bg-white">
          <Skeleton height={14} width={120} radius="xl" className="mb-4" />
          <Skeleton height={36} width="60%" radius="xl" className="mb-3" />
          <Skeleton height={14} width="80%" radius="xl" className="mb-2" />
          <Skeleton height={14} width="70%" radius="xl" className="mb-6" />
          <Skeleton height={40} width={140} radius="xl" />
        </div>
      </section>
    );
  }

  if (!event) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Featured event"
    >
      {/* Hero Banner Image — full width, no text overlay */}
      <div
        className="w-full overflow-hidden"
        style={{ height: '320px' }}
      >
        <img
          src={event.imageUrl || '/hero_banner.jpg'}
          alt={`${event.title} event banner`}
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
      </div>

      {/* Event Info — below image, light background */}
      <div className="bg-white px-6 md:px-10 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-gray-100">
        <div className="flex-1">
          <Badge
            variant="filled"
            color="teal"
            size="sm"
            radius="sm"
            className="mb-3 self-start tracking-widest uppercase"
            style={{ letterSpacing: '0.08em', backgroundColor: '#d1fae5', color: '#065f46', border: 'none' }}
          >
            Featured Event
          </Badge>

          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
            {event.title}
          </h1>

          <Text
            size="sm"
            className="text-gray-500 max-w-xl leading-relaxed"
            lineClamp={2}
          >
            {event.description}
          </Text>
        </div>

        <div className="shrink-0">
          <Button
            id="featured-register-btn"
            variant="filled"
            size="md"
            radius="md"
            className="transition-transform duration-200 hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 600 }}
            onClick={() => navigate(`/event/${event.id}`)}
          >
            Register Now
          </Button>
        </div>
      </div>
    </section>
  );
}
