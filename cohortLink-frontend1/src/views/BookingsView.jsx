import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Card, Text, Stack, Skeleton, SimpleGrid, Button, 
  Image, Group, Badge, ActionIcon, Center 
} from '@mantine/core';
import { CalendarDays, MapPin, TicketX, CalendarHeart } from 'lucide-react';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { getDetailedBookingsByUser, cancelBooking } from '../services/api';

const BookingsView = () => {
  const { user, dbUser, initializing } = useAuth();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadBookings() {
      // Avoid fetching if user is not fully loaded in DB
      if (!dbUser?.id) {
        if (!initializing) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getDetailedBookingsByUser(dbUser.id);
        if (mounted) {
          setBookings(data);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
        if (mounted) {
          setError('Failed to load your bookings. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBookings();
    
    return () => {
      mounted = false;
    };
  }, [dbUser, initializing]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  // Soft-gate: prompt sign-in if viewing bookings while logged out
  if (!initializing && !user) {
    return (
      <Container size="lg" py="xl">
        <Title order={2} mb="xl" className="text-slate-800">My Bookings</Title>
        <Card withBorder radius="md" padding="lg" shadow="sm" mb="lg" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
          <Stack gap="sm" align="center">
            <Text size="sm" fw={600} style={{ color: '#1e40af' }}>
              Sign in to view your bookings
            </Text>
            <Text size="xs" style={{ color: '#3b82f6' }}>
              You need an account to manage your event bookings.
            </Text>
            <Button
              size="sm"
              radius="md"
              onClick={() => navigate('/login?from=/bookings')}
              style={{ backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 600 }}
            >
              Sign in
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2} className="text-slate-800">My Bookings</Title>
      </Group>

      {/* Error state */}
      {error && (
        <Card withBorder radius="md" padding="lg" shadow="sm" mb="lg" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <Text size="sm" fw={600} style={{ color: '#991b1b' }}>{error}</Text>
        </Card>
      )}

      {/* Loading state */}
      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {[1, 2, 3].map((item) => (
            <Card key={item} withBorder radius="md" padding="lg" shadow="sm">
              <Stack gap="sm">
                <Skeleton height={160} radius="sm" mb="sm" />
                <Skeleton height={24} width="80%" />
                <Skeleton height={16} width="50%" />
                <Skeleton height={16} width="60%" mt="xs" />
                <Skeleton height={36} width="100%" mt="md" />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      ) : bookings.length === 0 && !error ? (
        /* Empty State */
        <Card withBorder radius="md" padding="xl" shadow="sm" className="text-center">
          <Center mb="md">
            <CalendarHeart size={48} className="text-slate-300" strokeWidth={1.5} />
          </Center>
          <Title order={4} className="text-slate-700" mb="sm">No upcoming bookings</Title>
          <Text size="sm" className="text-slate-500" mb="lg" maw={400} mx="auto">
            You haven't registered for any events yet. Discover what's happening near you and join the community!
          </Text>
          <Button 
            radius="md" 
            size="md"
            onClick={() => navigate('/')}
            style={{ backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 600 }}
          >
            Browse Events
          </Button>
        </Card>
      ) : (
        /* Bookings Grid */
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {bookings.map((booking) => {
            const event = booking.event;
            const eventDate = dayjs(event.eventTime);
            
            return (
              <Card 
                key={booking.id} 
                withBorder 
                radius="md" 
                padding="md" 
                shadow="sm"
                className="transition-shadow duration-200 hover:shadow-md cursor-pointer flex flex-col"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <Card.Section>
                  <Image
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'}
                    height={160}
                    fallbackSrc="https://placehold.co/400x200?text=Event"
                    alt={event.title}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Badge color="green" variant="light" size="sm" radius="sm">
                    {booking.status}
                  </Badge>
                  <Text size="xs" className="text-slate-400">
                    Booked {dayjs(booking.bookedAt).format('MMM D')}
                  </Text>
                </Group>

                <Text fw={600} size="lg" className="text-slate-800 line-clamp-1" mb="xs">
                  {event.title}
                </Text>

                <Stack gap="xs" mb="lg" className="flex-grow">
                  <Group gap="xs" wrap="nowrap">
                    <CalendarDays size={16} className="text-slate-400 shrink-0" />
                    <Text size="sm" className="text-slate-600 line-clamp-1">
                      {eventDate.format('dddd, MMMM D, YYYY • h:mm A')}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <MapPin size={16} className="text-slate-400 shrink-0" />
                    <Text size="sm" className="text-slate-600 line-clamp-1">
                      {event.locationName}
                    </Text>
                  </Group>
                </Stack>

                <Button 
                  variant="light" 
                  color="red" 
                  fullWidth 
                  radius="md"
                  mt="auto"
                  leftSection={<TicketX size={16} />}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleCancelBooking(booking.id);
                  }}
                  className="transition-colors hover:bg-red-100"
                >
                  Cancel Booking
                </Button>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
};

export default BookingsView;
