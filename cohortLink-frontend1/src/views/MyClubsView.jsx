import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title, Container, Text, Group, Button, Card,
  SimpleGrid, Badge, Loader, Center, Image,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { getClubCategories, getJoinedClubs } from '../services/api';

// ─── Shared Club Card ──────────────────────────────────────────────────────────

function ClubCard({ club, isManaged, onNavigate }) {
  const navigate = useNavigate();

  return (
    <Card
      key={club.id}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="transition-all duration-200 hover:shadow-md flex flex-col"
      style={{ borderColor: isManaged ? '#dbeafe' : '#e5e7eb' }}
    >
      <Card.Section>
        <Image
          src={
            club.profileImageUrl ||
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400&h=200'
          }
          height={160}
          alt={club.name}
        />
      </Card.Section>

      <div className="flex-1 mt-4">
        <Group justify="space-between" mb="xs">
          <Text fw={600} className="text-gray-900" lineClamp={1}>
            {club.name}
          </Text>
          <Badge
            color={isManaged ? 'blue' : 'violet'}
            variant="light"
            size="sm"
          >
            {club.category}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" mb="xs" lineClamp={1}>
          {club.city || 'No location set'}
        </Text>

        {club.bio && (
          <Text size="xs" c="dimmed" lineClamp={2} mb="md">
            {club.bio}
          </Text>
        )}
      </div>

      <Group grow mt="auto" pt="sm">
        <Button
          variant="default"
          size="sm"
          radius="md"
          onClick={() => navigate(`/club/${club.id}`)}
        >
          View
        </Button>
        {isManaged && (
          <Button
            size="sm"
            radius="md"
            className="bg-blue-600 hover:bg-blue-700 transition-colors border-0"
            onClick={() => navigate(`/club-manager-dashboard/${club.id}`)}
          >
            Manage
          </Button>
        )}
      </Group>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 rounded-xl mb-8"
      style={{
        border: '2px dashed #e5e7eb',
        background: '#fafafa',
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1.5"
        className="mb-3"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" fill="#d1d5db" opacity="0.2" />
        <circle cx="12" cy="12" r="2" fill="#d1d5db" />
      </svg>
      <Text size="sm" c="dimmed" mb={actionLabel ? 'sm' : 0} ta="center">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button
          size="xs"
          variant="light"
          color="blue"
          radius="md"
          mt="xs"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export default function MyClubsView() {
  const navigate = useNavigate();
  const { dbUser } = useAuth();

  const [managedClubs, setManagedClubs] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUser) {
      setLoading(false);
      return;
    }

    // Fetch both managed clubs and joined clubs in parallel
    Promise.all([
      getClubCategories().catch(() => []),
      getJoinedClubs(dbUser.id).catch(() => []),
    ]).then(([allClubs, joined]) => {
      const clubs = Array.isArray(allClubs) ? allClubs : (allClubs?.content || []);
      const userManaged = clubs.filter((c) => c.manager?.id === dbUser.id);
      setManagedClubs(userManaged);

      const joinedArr = Array.isArray(joined) ? joined : (joined?.content || []);
      // Exclude clubs the user already manages to avoid duplication
      const managedIds = new Set(userManaged.map((c) => c.id));
      setJoinedClubs(joinedArr.filter((c) => !managedIds.has(c.id)));
    }).finally(() => {
      setLoading(false);
    });
  }, [dbUser]);

  return (
    <main id="main-content" role="main" className="flex-1 flex flex-col p-6">
      <Container size="xl" className="w-full">
        {/* Header */}
        <Group justify="space-between" align="center" mb="xl">
          <Title order={1} className="text-gray-900">
            My Clubs
          </Title>
          <Button
            id="create-club-btn"
            size="sm"
            radius="md"
            leftSection={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => navigate('/create-club')}
            className="bg-blue-600 hover:bg-blue-700 border-0 transition-colors"
          >
            Create a Club
          </Button>
        </Group>

        {loading ? (
          <Center className="py-20">
            <Loader color="blue" />
          </Center>
        ) : (
          <>
            {/* ── Clubs You Manage (only shown if user manages at least one) ── */}
            {managedClubs.length > 0 && (
              <section className="mb-10">
                <Group align="center" gap="xs" mb="md">
                  <Text size="lg" fw={700} className="text-gray-800">
                    Clubs You Manage
                  </Text>
                  <Badge color="blue" variant="filled" size="sm" radius="xl">
                    {managedClubs.length}
                  </Badge>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {managedClubs.map((club) => (
                    <ClubCard key={club.id} club={club} isManaged />
                  ))}
                </SimpleGrid>
              </section>
            )}

            {/* ── Clubs You've Joined ──────────────────────────────────────── */}
            <section>
              <Group align="center" gap="xs" mb="md">
                <Text size="lg" fw={700} className="text-gray-800">
                  Clubs You've Joined
                </Text>
                {joinedClubs.length > 0 && (
                  <Badge color="violet" variant="filled" size="sm" radius="xl">
                    {joinedClubs.length}
                  </Badge>
                )}
              </Group>

              {joinedClubs.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {joinedClubs.map((club) => (
                    <ClubCard key={club.id} club={club} isManaged={false} />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  message="You haven't joined any clubs yet. Discover clubs and hit Join to get started."
                  actionLabel="Explore Events and Clubs"
                  onAction={() => navigate('/')}
                />
              )}
            </section>
          </>
        )}
      </Container>
    </main>
  );
}
