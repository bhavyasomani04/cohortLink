import { Card, Text, Group, Button, SimpleGrid, Skeleton, Rating } from '@mantine/core';
import { getInitials, stringToHue } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

// Circular avatar for club/location
function LocationAvatar({ club }) {
  const hue = stringToHue(club.name);

  return (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md transition-transform duration-300 group-hover:scale-110"
      style={{
        background: `radial-gradient(circle at 35% 35%, hsl(${hue},70%,35%), hsl(${(hue + 60) % 360},60%,15%))`,
        border: `3px solid hsl(${hue},50%,80%)`,
      }}
      aria-hidden="true"
    >
      <span className="text-white font-bold text-xl">{getInitials(club.name)}</span>
    </div>
  );
}

function LocationCard({ club }) {
  const navigate = useNavigate();
  const rating = Math.min(((club.id * 17) % 25) / 10 + 3, 5);

  return (
    <Card
      id={`location-card-${club.id}`}
      radius="md"
      padding="lg"
      className="border border-gray-100 bg-white text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
      component="article"
      onClick={() => navigate(`/club/${club.id}`)}
    >
      <LocationAvatar club={club} />

      <Text fw={700} size="sm" className="text-gray-900 mb-1 tracking-wide">
        {club.name}
      </Text>

      {/* Rating */}
      <Group justify="center" mb="xs">
        <Rating value={rating} fractions={2} readOnly size="xs" color="yellow" />
        <Text size="xs" className="text-gray-400">({rating.toFixed(1)})</Text>
      </Group>

      <Text size="xs" className="text-gray-500 leading-relaxed line-clamp-2">
        {club.bio}
      </Text>
    </Card>
  );
}

export default function ClubCategories({ clubs, loading }) {
  return (
    <section className="px-6 md:px-10 py-10 bg-[#f5f5f5] pb-16" aria-labelledby="popular-locations-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 id="popular-locations-heading" className="text-xl font-bold text-gray-900 tracking-tight">
          Popular Locations
        </h2>
        <Button
          id="view-all-clubs-btn"
          variant="subtle"
          color="blue"
          size="xs"
          radius="md"
          rightSection={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          }
          className="font-semibold tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
        >
          VIEW ALL
        </Button>
      </div>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {[1, 2, 3].map((k) => (
            <Card key={k} radius="md" padding="lg" className="border border-gray-100 bg-white text-center" aria-hidden="true">
              <Skeleton height={80} width={80} radius="100%" className="mx-auto mb-4" />
              <Skeleton height={12} width="60%" radius="xl" className="mx-auto mb-2" />
              <Skeleton height={10} width="40%" radius="xl" className="mx-auto mb-3" />
              <Skeleton height={10} width="80%" radius="xl" className="mx-auto" />
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {clubs.slice(0, 3).map((club) => (
            <LocationCard key={club.id} club={club} />
          ))}
        </SimpleGrid>
      )}
    </section>
  );
}
