import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Text, Center, Alert, Grid, Group, ThemeIcon, Progress, Skeleton, ActionIcon, Avatar, Collapse, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Heart,
  Pencil,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../context/AuthContext';
import AuthPromptCard from '../components/AuthPromptCard';
import { get, getClubById, getEventAttendees, createBooking, ApiError } from '../services/api';
import EventLocationMap from '../components/EventLocationMap';

const EventDetailView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Auth guard for the Register Now button
  const { guard, showPrompt, dismissPrompt } = useAuthGuard();
  const { dbUser } = useAuth();

  // Data states
  const [eventData, setEventData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingState, setBookingState] = useState('idle');
  const [showAttendees, setShowAttendees] = useState(false);
  const toggleAttendees = () => setShowAttendees(prev => !prev);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Fetch event and attendees in parallel
        const [event, attendeesList] = await Promise.all([
          get(`/api/events/${eventId}`),
          getEventAttendees(eventId).catch(() => []) // Fallback to empty if error
        ]);
        
        if (cancelled) return;
        
        setEventData(event);
        setAttendees(attendeesList);

        // Fetch associated club
        if (event.clubId) {
          const club = await getClubById(event.clubId).catch(() => null);
          if (!cancelled && club) {
            setClubData(club);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (eventId && eventId !== 'undefined') {
      fetchData();
    } else {
      setError('Invalid event ID');
      setLoading(false);
    }
    
    return () => { cancelled = true; };
  }, [eventId]);

  const handleRegister = async () => {
    setBookingState('loading');
    try {
      await createBooking({ eventId: parseInt(eventId) });
      
      setBookingState('success');
      // Optimistically update the UI capacity and append mock user to attendees list
      setEventData(prev => ({ ...prev, remainingSlots: prev.remainingSlots - 1 }));
      setAttendees(prev => [...prev, { id: dbUser?.id || 1, name: dbUser?.name || 'You' }]);
    } catch (err) {
      console.error(err);
      setBookingState('error');
      setTimeout(() => setBookingState('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton height={40} width={120} mb="xl" radius="md" />
        <Skeleton height={300} md={{height: 400}} radius="xl" className="mb-8" />
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Skeleton height={40} width="70%" mb="md" />
            <Skeleton height={20} mb="sm" />
            <Skeleton height={20} mb="xl" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={300} radius="md" />
          </Grid.Col>
        </Grid>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <Center className="h-[50vh]">
        <Alert icon={<AlertCircle size={20} />} title="Error loading event" color="red" radius="md" variant="light">
          {error || 'Event not found'}
        </Alert>
      </Center>
    );
  }

  const capacityPercent = ((eventData.maxCapacity - eventData.remainingSlots) / eventData.maxCapacity) * 100;
  const isFull = eventData.remainingSlots === 0;
  const heroImage = eventData.imageUrl || "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

  // Manager check: user is manager of the club that owns this event
  const isManager = clubData?.manager?.id && dbUser?.id === clubData.manager.id;

  // Check if current user is already in the attendees list
  const isAlreadyBooked = dbUser && attendees.some(user => user.id === dbUser.id);
  const showAsRegistered = bookingState === 'success' || isAlreadyBooked;
  
  const isPastEvent = dayjs().isAfter(dayjs(eventData.eventTime));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeInUp_0.5s_ease-out]">
      
      <Button 
        variant="subtle" 
        color="gray" 
        leftSection={<ArrowLeft size={16} />} 
        onClick={() => navigate(-1)}
        className="mb-6 hover:bg-gray-100 transition-colors"
      >
        Back to Events
      </Button>

      {/* Hero Section */}
      <div className="relative w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden mb-8 shadow-sm group">
        <img 
          src={heroImage} 
          alt={eventData.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          {isManager && (
            <Button
              size="sm"
              radius="md"
              leftSection={<Pencil size={14} />}
              onClick={() => navigate(`/edit-event/${eventId}`)}
              className="border-0 shadow-md text-amber-900 transition-colors"
              style={{ background: 'rgba(251,191,36,0.92)', backdropFilter: 'blur(6px)' }}
            >
              Edit Event
            </Button>
          )}
          <ActionIcon size="lg" radius="xl" variant="white" className="shadow-md hover:scale-105 transition-transform text-slate-700">
            <Share2 size={18} />
          </ActionIcon>
          <ActionIcon size="lg" radius="xl" variant="white" className="shadow-md hover:scale-105 transition-transform text-rose-500">
            <Heart size={18} />
          </ActionIcon>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* Main Details (Left/Top) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            {eventData.featured && (
              <Badge size="md" radius="sm" className="mb-4 bg-emerald-400 text-emerald-950 border-0 font-bold tracking-wider">
                FEATURED EVENT
              </Badge>
            )}
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              {eventData.title}
            </h1>
          </div>
          
          <Card padding="xl" radius="md" withBorder className="bg-white border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-gray-100 pb-2">About This Event</h2>
            <Text className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
              {eventData.description}
            </Text>
          </Card>

          {/* Attendees Section */}
          <Card padding="xl" radius="md" withBorder className="bg-white border-gray-100 shadow-sm">
            <Group justify="space-between" mb="lg">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Attendees ({attendees.length})</h2>
                <Text size="sm" color="dimmed">People who have already RSVP'd</Text>
              </div>
              
              {attendees.length > 0 && (
                <Button 
                  variant="subtle" 
                  onClick={toggleAttendees}
                  rightSection={showAttendees ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  className="text-blue-600 font-semibold"
                >
                  {showAttendees ? 'Hide List' : 'See All'}
                </Button>
              )}
            </Group>

            {attendees.length > 0 ? (
              <>
                {/* Initial collapsed view: Avatar Group */}
                {!showAttendees && (
                  <Avatar.Group spacing="sm">
                    {attendees.slice(0, 5).map(user => (
                      <Avatar key={user.id} radius="xl" size="md" color="blue" className="border-2 border-white shadow-sm">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                    ))}
                    {attendees.length > 5 && (
                      <Avatar radius="xl" size="md" className="border-2 border-white shadow-sm bg-gray-100 text-gray-600">
                        +{attendees.length - 5}
                      </Avatar>
                    )}
                  </Avatar.Group>
                )}

                {/* Expanded view: Full list */}
                {showAttendees && (
                  <Stack gap="sm" className="mt-2 animate-[fadeIn_0.3s_ease-out]">
                    {attendees.map(user => (
                      <Group key={user.id} className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                        <Avatar radius="xl" size="md" color="indigo">
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text fw={600} className="text-slate-700">{user?.name || 'Unknown User'}</Text>
                          <Text size="xs" color="dimmed">Member</Text>
                        </div>
                      </Group>
                    ))}
                  </Stack>
                )}
              </>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-gray-200">
                <Users size={32} className="mx-auto text-slate-400 mb-2" />
                <Text color="dimmed" fw={500}>No attendees yet</Text>
                <Text size="sm" color="dimmed">Be the first to register!</Text>
              </div>
            )}
          </Card>

          {/* Hosted By Section */}
          {clubData && (
            <Card padding="lg" radius="md" withBorder className="bg-slate-50 border-gray-100 cursor-pointer hover:border-blue-200 transition-colors" onClick={() => navigate(`/club/${clubData.id}`)}>
              <Group>
                <Avatar src={clubData.profileImageUrl} size="lg" radius="md" color="blue">
                  {clubData.name.charAt(0)}
                </Avatar>
                <div>
                  <Text size="sm" color="dimmed" fw={500}>Hosted by</Text>
                  <Text size="lg" fw={700} className="text-slate-800">{clubData.name}</Text>
                </div>
              </Group>
            </Card>
          )}
        </div>

        {/* Action Sidebar (Right) */}
        <div className="lg:col-span-1">
          <Card padding="xl" radius="xl" withBorder className="bg-white border-gray-100 shadow-lg sticky top-8">
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" variant="light" color="blue">
                  <Calendar size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={700} className="text-slate-800 text-lg">{dayjs(eventData.eventTime).format('dddd, MMMM D')}</Text>
                  <Text className="text-slate-500 flex items-center gap-1 mt-1">
                    <Clock size={14} /> {dayjs(eventData.eventTime).format('h:mm A')}
                  </Text>
                </div>
              </div>

              <EventLocationMap
                locationName={eventData.locationName}
                latitude={eventData.latitude}
                longitude={eventData.longitude}
              />

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" variant="light" color="teal">
                  <Users size={24} />
                </ThemeIcon>
                <div className="flex-1">
                  <Group justify="space-between" mb={4}>
                    <Text fw={700} className="text-slate-800 text-lg">Capacity</Text>
                    <Text fw={700} className={isFull ? "text-red-500" : "text-teal-600"}>
                      {eventData.remainingSlots} spots left
                    </Text>
                  </Group>
                  <Progress 
                    value={capacityPercent} 
                    color={isFull ? 'red' : capacityPercent > 80 ? 'orange' : 'teal'} 
                    size="md" 
                    radius="xl"
                  />
                  <Text size="xs" color="dimmed" mt={4}>
                    {eventData.maxCapacity - eventData.remainingSlots} going out of {eventData.maxCapacity}
                  </Text>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              {isPastEvent ? (
                <Button
                  fullWidth
                  size="xl"
                  radius="md"
                  className="bg-gray-200 text-gray-500 pointer-events-none border-0"
                  disabled
                >
                  Event Ended
                </Button>
              ) : showAsRegistered ? (
                <Button 
                  fullWidth 
                  size="lg" 
                  radius="md" 
                  color="teal"
                  className="bg-teal-500 pointer-events-none"
                  leftSection={<CheckCircle2 size={20} />}
                >
                  You're Registered!
                </Button>
              ) : bookingState === 'error' ? (
                <Button 
                  fullWidth 
                  size="lg" 
                  radius="md" 
                  color="red"
                  className="bg-red-500"
                  onClick={handleRegister}
                >
                  Failed. Try Again?
                </Button>
              ) : (
                <Button
                  fullWidth
                  size="xl"
                  radius="md"
                  className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg border-0"
                  disabled={isFull}
                  loading={bookingState === 'loading'}
                  onClick={() => guard(handleRegister)}
                >
                  {isFull ? 'Event Full' : 'Register Now'}
                </Button>
              )}

              {isPastEvent ? (
                <Text size="xs" color="dimmed" align="center" mt="sm">
                  This event has already taken place.
                </Text>
              ) : showAsRegistered ? (
                <Text size="xs" color="dimmed" align="center" mt="sm">
                  You have already booked this event.
                </Text>
              ) : !isFull ? (
                <Text size="xs" color="dimmed" align="center" mt="sm">
                  Free to attend. Registration required.
                </Text>
              ) : null}

              {/* Inline auth prompt — shown inside sidebar when unauthenticated */}
              {showPrompt && (
                <div className="mt-4 animate-[fadeInUp_0.3s_ease_both]">
                  <AuthPromptCard
                    message="Sign in to register for this event"
                    onSuccess={dismissPrompt}
                    onDismiss={dismissPrompt}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetailView;
