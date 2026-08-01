import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Container, Text, Group, Button, Card, Badge, Loader, Center, ActionIcon, Avatar, Tooltip, TextInput, Modal } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { getClubById, authedGet, deleteEvent, createEvent } from '../services/api';
import dayjs from 'dayjs';
import { CalendarPlus, Settings, Trash, ArrowRight, X, Search, RefreshCw } from 'lucide-react';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';

export default function ClubManagerDashboardView() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { dbUser, initializing, user } = useAuth();
  
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [recreateModalOpen, setRecreateModalOpen] = useState(false);
  const [eventToRecreate, setEventToRecreate] = useState(null);
  const [recreateLoading, setRecreateLoading] = useState(false);

  const recreateForm = useForm({
    initialValues: {
      startDateTime: null,
      endDateTime: null,
    },
    validate: {
      startDateTime: (v) => (!v ? 'Start date and time is required' : (dayjs(v).isBefore(dayjs()) ? 'Start time must be in the future' : null)),
      endDateTime: (v, values) => {
        if (!v) return 'End date and time is required';
        if (values.startDateTime && !dayjs(v).isAfter(dayjs(values.startDateTime))) {
          return 'End time must be after start time';
        }
        return null;
      },
    },
  });

  const openRecreateModal = (event) => {
    setEventToRecreate(event);
    recreateForm.reset();
    setRecreateModalOpen(true);
  };

  const handleRecreateSubmit = async (values) => {
    if (!eventToRecreate) return;
    setRecreateLoading(true);
    try {
      const fullEvent = await authedGet(`/api/events/${eventToRecreate.id}`);
      const payload = {
        title: fullEvent.title,
        description: fullEvent.description || '',
        location: fullEvent.locationName || fullEvent.location || '',
        latitude: fullEvent.latitude || 0,
        longitude: fullEvent.longitude || 0,
        capacity: Number(fullEvent.maxCapacity),
        bannerImageUrl: fullEvent.imageUrl || null,
        startDateTime: dayjs(values.startDateTime).toISOString(),
        endDateTime: dayjs(values.endDateTime).toISOString(),
        clubId: Number(clubId)
      };

      const newEvent = await createEvent(payload);
      setEvents(prev => [newEvent, ...prev]);
      setRecreateModalOpen(false);
      setEventToRecreate(null);
    } catch (err) {
      console.error("Failed to recreate event", err);
      alert("Failed to recreate event. Please try again.");
    } finally {
      setRecreateLoading(false);
    }
  };

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      try {
        const [clubData, eventsData, pastEventsData, membersData] = await Promise.all([
          getClubById(clubId),
          authedGet(`/api/events/club/${clubId}`).catch(() => []),
          authedGet(`/api/events/club/${clubId}/past`).catch(() => []),
          authedGet(`/api/clubs/${clubId}/members`).catch(() => [
            // Fallback mock members
            { id: 101, name: 'Alex Johnson', email: 'alex@example.com', joinDate: '2024-01-15' },
            { id: 102, name: 'Sam Taylor', email: 'sam@example.com', joinDate: '2024-02-22' },
            { id: 103, name: 'Jordan Lee', email: 'jordan@example.com', joinDate: '2024-03-05' },
            { id: 104, name: 'Casey Smith', email: 'casey@example.com', joinDate: '2024-03-10' }
          ])
        ]);

        if (cancelled) return;
        
        setClub(clubData);
        // Ensure events is an array
        setEvents(Array.isArray(eventsData) ? eventsData : (eventsData?.content || []));
        setPastEvents(Array.isArray(pastEventsData) ? pastEventsData : (pastEventsData?.content || []));
        setMembers(Array.isArray(membersData) ? membersData : (membersData?.content || []));
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { cancelled = true; };
  }, [clubId, initializing, user]);

  const handleRemoveMember = (memberId) => {
    // Optimistic UI update
    setMembers(prev => prev.filter(m => m.id !== memberId));
    // Here you would also call your backend to actually remove them
    // delete(`/api/clubs/${clubId}/members/${memberId}`)
  };

  const handleDeleteEvent = async (e, eventId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteEvent(eventId);
      // Optimistic UI update
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      setPastEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Failed to delete event. Please try again.");
    }
  };

  if (loading) {
    return (
      <Center className="h-[50vh]">
        <Loader color="blue" size="lg" type="dots" />
      </Center>
    );
  }

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!club) {
    return (
      <Center className="h-[50vh]">
        <Text c="dimmed">Club not found or you don't have access.</Text>
      </Center>
    );
  }

  return (
    <main id="main-content" role="main" className="flex-1 flex flex-col p-6 lg:p-10 bg-slate-50 min-h-screen">
      <Container size="xl" className="w-full" p={0}>
        
        {/* ─── Header Command Center ────────────────────────────── */}
        <div className="mb-10 pb-6 border-b border-gray-200">
          <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }} className="mb-2 tracking-widest uppercase">
            DASHBOARD // {club.category}
          </Text>
          <Group justify="space-between" align="flex-end" className="flex-col md:flex-row gap-4 md:gap-0">
            <div>
              <Title order={1} className="text-gray-900 text-4xl md:text-5xl font-extrabold tracking-tight">
                {club.name}
              </Title>
              <Text c="dimmed" mt="xs" className="max-w-2xl">
                Manage your community, oversee upcoming events, and curate your active roster.
              </Text>
            </div>
            
            <Group>
              <Button 
                variant="default"
                leftSection={<Settings size={16} />}
                onClick={() => navigate(`/edit-club/${club.id}`)}
                className="font-semibold text-gray-700 border-gray-300"
              >
                Settings
              </Button>
              <Button 
                leftSection={<CalendarPlus size={16} />}
                onClick={() => navigate(`/create-event?clubId=${club.id}`)}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold shadow-sm border-0"
              >
                Create Event
              </Button>
            </Group>
          </Group>
        </div>

        {/* ─── Main Content Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Events Hub (span 7 or 8) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <Group justify="space-between" align="center" className="mb-2">
              <Text size="lg" fw={700} className="text-gray-900 tracking-tight">Scheduled Events</Text>
              <Badge color="indigo" variant="light" size="lg" radius="sm" style={{ fontFamily: 'monospace' }}>
                {events.length} TOTAL
              </Badge>
            </Group>

            {events.length === 0 ? (
              <Card withBorder padding="xl" radius="md" className="bg-white border-gray-200 border-dashed text-center">
                <Text c="dimmed" mb="md">No upcoming events scheduled.</Text>
                <Button variant="light" color="indigo" onClick={() => navigate(`/create-event?clubId=${club.id}`)}>
                  Schedule the first event
                </Button>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {events.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="group bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <Group wrap="nowrap" gap="xl" className="flex-1 overflow-hidden">
                      {/* Monospace Date Block */}
                      <div className="w-24 shrink-0 text-center border-r border-gray-100 pr-4">
                        <Text size="xs" fw={700} className="text-gray-400 uppercase tracking-widest mb-1">
                          {dayjs(event.eventTime || event.date).format('MMM')}
                        </Text>
                        <Text size="xl" fw={800} className="text-gray-800 font-mono leading-none">
                          {dayjs(event.eventTime || event.date).format('DD')}
                        </Text>
                      </div>
                      
                      {/* Event Core Info */}
                      <div className="flex-1 min-w-0">
                        <Text fw={600} size="lg" className="text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                          {event.title}
                        </Text>
                        <Text size="sm" c="dimmed" className="truncate mt-1">
                          {event.locationName || event.location || 'No location set'}
                        </Text>
                      </div>
                    </Group>

                    {/* Metadata & Hover Arrow */}
                    <Group wrap="nowrap" gap="lg" className="pl-4 shrink-0">
                      <div className="hidden sm:block text-right">
                        <Text size="xs" c="dimmed" className="uppercase font-semibold tracking-wider">Capacity</Text>
                        <Text size="sm" fw={600} className="text-gray-700 font-mono">
                          {event.maxCapacity || '∞'}
                        </Text>
                      </div>
                      <Tooltip label="Delete Event" position="top" withArrow>
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteEvent(e, event.id)}
                        >
                          <Trash size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <div className="w-8 h-8 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-600">
                        <ArrowRight size={20} />
                      </div>
                    </Group>
                  </div>
                ))}
              </div>
            )}

            {/* Past Events Section */}
            <div className="mt-8">
              <Group justify="space-between" align="center" className="mb-2">
                <Text size="lg" fw={700} className="text-gray-900 tracking-tight">Past Events</Text>
                <Badge color="gray" variant="light" size="lg" radius="sm" style={{ fontFamily: 'monospace' }}>
                  {pastEvents.length} TOTAL
                </Badge>
              </Group>

              {pastEvents.length === 0 ? (
                <Card withBorder padding="xl" radius="md" className="bg-white border-gray-200 border-dashed text-center">
                  <Text c="dimmed">No past events found.</Text>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {pastEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="group bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all opacity-80 hover:opacity-100"
                    >
                      <Group wrap="nowrap" gap="xl" className="flex-1 overflow-hidden">
                        {/* Monospace Date Block */}
                        <div className="w-24 shrink-0 text-center border-r border-gray-100 pr-4">
                          <Text size="xs" fw={700} className="text-gray-400 uppercase tracking-widest mb-1">
                            {dayjs(event.eventTime || event.date).format('MMM')}
                          </Text>
                          <Text size="xl" fw={800} className="text-gray-600 font-mono leading-none">
                            {dayjs(event.eventTime || event.date).format('DD')}
                          </Text>
                        </div>
                        
                        {/* Event Core Info */}
                        <div className="flex-1 min-w-0">
                          <Text fw={600} size="lg" className="text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                            {event.title}
                          </Text>
                          <Text size="sm" c="dimmed" className="truncate mt-1">
                            {event.locationName || event.location || 'No location set'}
                          </Text>
                        </div>
                      </Group>

                      {/* Metadata & Hover Arrow */}
                      <Group wrap="nowrap" gap="lg" className="pl-4 shrink-0">
                        <div className="hidden sm:block text-right">
                          <Text size="xs" c="dimmed" className="uppercase font-semibold tracking-wider">Capacity</Text>
                          <Text size="sm" fw={600} className="text-gray-500 font-mono">
                            {event.maxCapacity || '∞'}
                          </Text>
                        </div>
                        <Tooltip label="Recreate Event" position="top" withArrow>
                          <ActionIcon 
                            color="blue" 
                            variant="subtle"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRecreateModal(event);
                            }}
                          >
                            <RefreshCw size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Event" position="top" withArrow>
                          <ActionIcon 
                            color="red" 
                            variant="subtle"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteEvent(e, event.id)}
                          >
                            <Trash size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <div className="w-8 h-8 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-500">
                          <ArrowRight size={20} />
                        </div>
                      </Group>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Member Roster (span 5 or 4) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <Group justify="space-between" align="center" className="mb-2">
              <Text size="lg" fw={700} className="text-gray-900 tracking-tight">Active Roster</Text>
              <Badge color="gray" variant="outline" size="lg" radius="sm" style={{ fontFamily: 'monospace' }}>
                {members.length} MEMBERS
              </Badge>
            </Group>

            <Card withBorder padding="md" radius="md" className="bg-white border-gray-200 flex flex-col gap-4">
              <TextInput 
                placeholder="Search member by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<Search size={16} className="text-gray-400" />}
                styles={{ input: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' } }}
              />
              
              {filteredMembers.length === 0 ? (
                <Text c="dimmed" size="sm" className="text-center py-8">
                  {members.length === 0 ? 'No members have joined yet.' : 'No members found.'}
                </Text>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[400px]">
                  {filteredMembers.map(member => (
                    <div 
                      key={member.id} 
                      className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="indigo" radius="xl" size="md">
                          {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={600} className="text-gray-800 leading-none mb-1">
                            {member.name}
                          </Text>
                          <Text size="xs" c="dimmed" className="font-mono">
                            Joined {dayjs(member.joinDate).format('MM.DD.YYYY')}
                          </Text>
                        </div>
                      </Group>
                      
                      <Tooltip label="Remove Member" position="left" withArrow>
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          
        </div>
      </Container>

      {/* Recreate Event Modal */}
      <Modal 
        opened={recreateModalOpen} 
        onClose={() => setRecreateModalOpen(false)} 
        title={<Text fw={700} size="lg">Recreate Event</Text>}
        centered
      >
        {eventToRecreate && (
          <form onSubmit={recreateForm.onSubmit(handleRecreateSubmit)} className="flex flex-col gap-4">
            <Text size="sm" c="dimmed">
              You are recreating <strong>{eventToRecreate.title}</strong>. Please select the new dates for this event. All other details will remain the same.
            </Text>
            <DateTimePicker
              label="New Start Date & Time"
              placeholder="Pick date & time"
              withAsterisk
              valueFormat="MMM D, YYYY · h:mm A"
              minDate={new Date()}
              clearable
              dropdownType="modal"
              {...recreateForm.getInputProps('startDateTime')}
            />
            <DateTimePicker
              label="New End Date & Time"
              placeholder="Pick date & time"
              withAsterisk
              valueFormat="MMM D, YYYY · h:mm A"
              minDate={recreateForm.values.startDateTime || new Date()}
              clearable
              dropdownType="modal"
              {...recreateForm.getInputProps('endDateTime')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setRecreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" color="indigo" loading={recreateLoading}>Recreate Event</Button>
            </Group>
          </form>
        )}
      </Modal>

    </main>
  );
}
