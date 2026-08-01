import React, { useState, useEffect } from 'react';
import { Badge, Button, Accordion, Card, Text, Stack, Skeleton, Alert, Center, Tabs, Loader, Modal, Textarea, Progress, Group, Avatar } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  MapPin,
  Users,
  Camera,
  PlusSquare,
  Calendar as CalendarIcon,
  Dices,
  Heart,
  Clock,
  UserPlus,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  AlertCircle,
  X,
  Check,
  UserMinus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../context/AuthContext';
import AuthPromptCard from '../components/AuthPromptCard';
import MomentCard from '../components/MomentCard';
import CommentsDrawer from '../components/CommentsDrawer';
import { useFeed } from '../hooks/useFeed';
import { useImageUpload } from '../hooks/useImageUpload';
import { getClubById, get, createPost, followClub, unfollowClub, getClubMembers } from '../services/api';

const ClubView = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { dbUser } = useAuth();

  // Auth guard for the Join button
  const { guard, showPrompt, dismissPrompt } = useAuthGuard();

  // State management
  const [club, setClub]           = useState(null);
  const [events, setEvents]       = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  // Comments drawer state
  const [activeComment, setActiveComment] = useState(null);
  // Add Post modal state
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showMembers, setShowMembers] = useState(false);
  const toggleMembers = () => setShowMembers(prev => !prev);

  useEffect(() => {
    let cancelled = false;

    const fetchClubData = async () => {
      try {
        const [clubData, eventsData, pastEventsData, membersData] = await Promise.all([
          getClubById(clubId),
          get(`/api/events/club/${clubId}`).catch(() => []), // fallback for events
          get(`/api/events/club/${clubId}/past`).catch(() => []), // fallback for past events
          getClubMembers(clubId).catch(() => []) // fallback for members
        ]);

        if (cancelled) return;
        
        setClub(clubData);
        const eventsArray = Array.isArray(eventsData) ? eventsData : (eventsData?.content || []);
        setEvents(eventsArray.slice(0, 3));
        const pastEventsArray = Array.isArray(pastEventsData) ? pastEventsData : (pastEventsData?.content || []);
        setPastEvents(pastEventsArray.slice(0, 3));
        const membersList = Array.isArray(membersData) ? membersData : (membersData?.content || []);
        setMembers(membersList);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (clubId && clubId !== 'undefined') {
      fetchClubData();
    } else {
      setError('Invalid club ID');
      setLoading(false);
    }
    
    return () => { cancelled = true; };
  }, [clubId]);

  // Vercel Best Practice: loading-states - Skeleton screens or spinners
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton radius="xl" className="w-full h-[300px] md:h-[400px] mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card padding="xl" radius="md" withBorder className="border-gray-100">
              <Skeleton height={30} width="40%" mb="md" />
              <Skeleton height={15} mb="sm" />
              <Skeleton height={15} mb="sm" />
              <Skeleton height={15} width="80%" mb="xl" />
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card padding="xl" radius="md" withBorder className="border-gray-100">
              <Skeleton height={30} width="60%" mb="xl" />
              <Skeleton height={120} mb="md" radius="md" />
              <Skeleton height={120} mb="md" radius="md" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error boundary feedback
  if (error || !club) {
    return (
      <Center className="h-[50vh]">
        <Alert icon={<AlertCircle size={20} />} title="Error loading club" color="red" radius="md" variant="light">
          {error || 'Club not found'}
        </Alert>
      </Center>
    );
  }

  // Dynamic colors for events (simulating the design variance)
  const eventColors = ['blue', 'green', 'orange', 'purple', 'teal'];

  const isManager = club?.manager?.id && dbUser?.id === club.manager.id;
  const isFollowing = dbUser?.id && members.some(m => m.id === dbUser.id);

  const handleToggleFollow = async () => {
    const wasFollowing = isFollowing;
    try {
      if (wasFollowing) {
        // Optimistic unfollow
        setMembers(prev => prev.filter(m => m.id !== dbUser.id));
        await unfollowClub(clubId);
      } else {
        // Optimistic follow
        setMembers(prev => [...prev, { id: dbUser.id, name: dbUser?.name || 'User' }]);
        await followClub(clubId);
      }
    } catch (err) {
      // Revert on error
      if (wasFollowing) {
        setMembers(prev => [...prev, { id: dbUser.id, name: dbUser?.name || 'User' }]);
      } else {
        setMembers(prev => prev.filter(m => m.id !== dbUser.id));
      }
      console.error("Failed to toggle follow:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeInUp_0.5s_ease-out]">
      {/* Hero Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 shadow-lg group">
        <img 
          src={club.profileImageUrl || "https://images.unsplash.com/photo-1611891487122-207579d67d98?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"} 
          alt={`${club.name} banner`} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="text-white z-10">
            <Badge size="lg" radius="sm" className="mb-3 font-semibold tracking-wider bg-teal-500/90 text-white border-0">
              COMMUNITY CLUB
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-white">
              {club.name}
            </h1>
            <div className="flex items-center text-gray-200 text-sm md:text-base font-medium">
              <MapPin size={18} className="mr-2" />
              <span>Managed by {club.manager?.name || 'Admin'}</span>
            </div>
          </div>
          {isManager ? (
            <div className="flex items-center gap-2 z-10">
              <Button
                size="lg"
                radius="md"
                leftSection={<CalendarPlus size={18} />}
                className="bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-md hover:shadow-lg border-0"
                onClick={() => navigate(`/create-event?clubId=${club.id}`)}
              >
                Add Event
              </Button>
              <Button
                size="lg"
                radius="md"
                className="bg-white text-slate-800 hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg border-0"
                onClick={() => navigate(`/edit-club/${club.id}`)}
              >
                Edit Club
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              radius="md"
              className={`group transition-all duration-300 shadow-md hover:shadow-lg z-10 ${
                isFollowing 
                  ? 'bg-white/15 text-white border border-white/20 backdrop-blur-md hover:bg-red-500/90 hover:border-red-500/90' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-0'
              }`}
              onClick={() => guard(handleToggleFollow)}
            >
              {isFollowing ? (
                <div className="flex items-center justify-center min-w-[110px]">
                  <span className="flex items-center gap-2 group-hover:hidden font-semibold">
                    <Check size={18} /> Following
                  </span>
                  <span className="hidden items-center gap-2 group-hover:flex font-semibold">
                    <UserMinus size={18} /> Unfollow
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 font-semibold">
                  <UserPlus size={18} /> Join Club
                </div>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Inline auth prompt — shown below hero when user is unauthenticated */}
      {showPrompt && (
        <div className="flex justify-center mb-6 animate-[fadeInUp_0.3s_ease_both]">
          <AuthPromptCard
            message="Sign in to join this club and access member benefits"
            onSuccess={dismissPrompt}
            onDismiss={dismissPrompt}
          />
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 space-y-8">
          <Tabs value={activeTab} onChange={setActiveTab} color="blue" radius="md">
            
            <Tabs.List className="mb-6" grow={false}>
              <Tabs.Tab value="details" className="text-base font-semibold px-6 py-3">
                Details
              </Tabs.Tab>
              <Tabs.Tab value="moments" className="text-base font-semibold px-6 py-3">
                Moments
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details" className="animate-[fadeIn_0.3s_ease-out]">
              {/* About Section */}
              <Card shadow="sm" padding="xl" radius="md" withBorder className="bg-white transition-all hover:shadow-md border-gray-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-gray-100 pb-2">
                  About The Club
                </h2>
                <div className="text-slate-600 space-y-4 mb-8 leading-relaxed text-base">
                  <p>{club.bio}</p>
                </div>
                
                {/* Quick Stats Grid - Placeholder icons for demonstration, could be dynamic in future */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-50">
                  <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <Users size={24} />
                    </div>
                    <Text fw={700} size="sm" className="text-slate-700">{members.length} {members.length === 1 ? 'Member' : 'Members'}</Text>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                      <CalendarIcon size={24} />
                    </div>
                    <Text fw={700} size="sm" className="text-slate-700">Weekly Meets</Text>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="bg-amber-100 p-3 rounded-full mb-3 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                      <Dices size={24} />
                    </div>
                    <Text fw={700} size="sm" className="text-slate-700">300+ Games</Text>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="bg-rose-100 p-3 rounded-full mb-3 text-rose-600 group-hover:scale-110 transition-transform duration-300">
                      <Heart size={24} />
                    </div>
                    <Text fw={700} size="sm" className="text-slate-700">Beginner Friendly</Text>
                  </div>
                </div>
              </Card>

              {/* Members Section */}
              <Card shadow="sm" padding="xl" radius="md" withBorder className="bg-white transition-all hover:shadow-md border-gray-100 mt-6">
                <Group justify="space-between" mb="lg">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Members ({members.length})</h2>
                    <Text size="sm" color="dimmed">People who have joined this club</Text>
                  </div>
                  
                  {members.length > 0 && (
                    <Button 
                      variant="subtle" 
                      onClick={toggleMembers}
                      rightSection={showMembers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      className="text-blue-600 font-semibold"
                    >
                      {showMembers ? 'Hide List' : 'See All'}
                    </Button>
                  )}
                </Group>

                {members.length > 0 ? (
                  <>
                    {/* Initial collapsed view: Avatar Group */}
                    {!showMembers && (
                      <Avatar.Group spacing="sm">
                        {members.slice(0, 5).map(user => (
                          <Avatar key={user.id} radius="xl" size="md" color="blue" className="border-2 border-white shadow-sm">
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                        ))}
                        {members.length > 5 && (
                          <Avatar radius="xl" size="md" className="border-2 border-white shadow-sm bg-gray-100 text-gray-600 font-semibold">
                            +{members.length - 5}
                          </Avatar>
                        )}
                      </Avatar.Group>
                    )}

                    {/* Expanded view: Full list */}
                    {showMembers && (
                      <Stack gap="sm" className="mt-2 animate-[fadeIn_0.3s_ease-out]">
                        {members.map(user => (
                          <Group key={user.id} className="p-3 bg-slate-50 rounded-lg border border-gray-100 transition-colors hover:bg-slate-100">
                            <Avatar radius="xl" size="md" color="indigo" className="shadow-sm">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                              <Text fw={600} className="text-slate-700">{user?.name || 'Unknown User'}</Text>
                              <Text size="xs" color="dimmed">{club?.manager?.id === user.id ? 'Club Manager' : 'Member'}</Text>
                            </div>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-gray-200">
                    <Users size={32} className="mx-auto text-slate-400 mb-2" />
                    <Text color="dimmed" fw={500}>No members yet</Text>
                    <Text size="sm" color="dimmed">Be the first to join!</Text>
                  </div>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="moments" className="animate-[fadeIn_0.3s_ease-out]">
              <MomentsFeed clubId={clubId} onComment={setActiveComment} />
            </Tabs.Panel>
          </Tabs>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <Card shadow="sm" padding="xl" radius="md" withBorder className="bg-white transition-all hover:shadow-md border-gray-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <CalendarDays size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Upcoming Events</h2>
            </div>
            
            <Stack gap="lg">
              {events.length > 0 ? (
                events.map((event, index) => {
                  const colorTheme = eventColors[index % eventColors.length];
                  
                  return (
                    <div 
                      key={event.id} 
                      onClick={() => navigate(`/event/${event.id}`)}
                      className={`group border border-gray-100 rounded-xl p-5 hover:border-${colorTheme}-200 hover:shadow-md transition-all duration-300 bg-white hover:bg-${colorTheme}-50/30 cursor-pointer relative overflow-hidden flex flex-col h-full`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full bg-${colorTheme}-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out`} />
                      
                      <Badge size="sm" radius="sm" className={`mb-3 bg-${colorTheme}-100 text-${colorTheme}-700 hover:bg-${colorTheme}-100 border-0 self-start font-bold tracking-wide`}>
                        {dayjs(event.eventTime).format('MMM D, YYYY')}
                      </Badge>
                      
                      <h3 className={`font-bold text-slate-800 text-lg mb-3 group-hover:text-${colorTheme}-700 transition-colors leading-tight`}>
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-col gap-2 text-sm text-slate-600 mb-5 flex-grow">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          <span>{dayjs(event.eventTime).format('h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <span>
                            {event.maxCapacity - event.remainingSlots}/{event.maxCapacity} Attending
                          </span>
                        </div>
                      </div>
                      
                      <Button fullWidth variant="light" className={`bg-gray-50 text-gray-700 group-hover:bg-${colorTheme}-600 group-hover:text-white transition-all duration-300 border-0 font-semibold mt-auto`}>
                        RSVP
                      </Button>
                    </div>
                  );
                })
              ) : (
                <Text color="dimmed" size="sm" align="center" className="py-8">
                  No upcoming events right now.
                </Text>
              )}
            </Stack>

            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <Button 
                variant="transparent" 
                rightSection={<ArrowRight size={16} />} 
                className="text-blue-600 hover:bg-transparent hover:underline hover:text-blue-700 px-0 transition-all font-semibold"
                onClick={() => navigate(`/?clubId=${clubId}`)}
              >
                View Full Calendar
              </Button>
            </div>
            </Card>

            {pastEvents.length > 0 && (
              <Card shadow="sm" padding="xl" radius="md" withBorder className="bg-white transition-all hover:shadow-md border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Past Events</h2>
                </div>
                
                <Stack gap="lg">
                  {pastEvents.map((event) => (
                    <div 
                      key={event.id} 
                      onClick={() => navigate(`/event/${event.id}`)}
                      className={`group border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white hover:bg-gray-50/30 cursor-pointer relative overflow-hidden flex flex-col h-full`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gray-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out`} />
                      
                      <Badge size="sm" radius="sm" className={`mb-3 bg-gray-100 text-gray-700 hover:bg-gray-100 border-0 self-start font-bold tracking-wide`}>
                        {dayjs(event.eventTime).format('MMM D, YYYY')}
                      </Badge>
                      
                      <h3 className={`font-bold text-slate-800 text-lg mb-3 group-hover:text-gray-700 transition-colors leading-tight`}>
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-col gap-2 text-sm text-slate-600 flex-grow">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          <span>{dayjs(event.eventTime).format('h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </Stack>
              </Card>
            )}

            {isManager && activeTab === 'moments' && (
              <Button
                fullWidth
                size="md"
                radius="md"
                leftSection={<PlusSquare size={18} />}
                onClick={() => setPostModalOpen(true)}
                className="border-0 text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
              >
                Add Post
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Comments Drawer */}
      <CommentsDrawer
        post={activeComment}
        onClose={() => setActiveComment(null)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        opened={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        clubId={clubId}
      />
    </div>
  );
};

// ─── CreatePostModal ──────────────────────────────────────────────────────────
const CreatePostModal = ({ opened, onClose, clubId }) => {
  const { uploadImage, uploading, progress, reset: resetUpload } = useImageUpload();

  const [caption, setCaption]         = useState('');
  const [imageFile, setImageFile]     = useState(null);
  const [preview, setPreview]         = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);
  const fileInputRef                  = React.useRef(null);

  const handleClose = () => {
    setCaption('');
    setImageFile(null);
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
    resetUpload();
    onClose();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setUploadedUrl(null);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
    setUploadedUrl(null);
    resetUpload();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !imageFile) {
      setError('Please add a caption or an image.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      let finalUrl = uploadedUrl;

      // Upload image first if one is selected and not yet uploaded
      if (imageFile && !uploadedUrl) {
        finalUrl = await uploadImage(imageFile);
        if (!finalUrl) {
          setSubmitting(false);
          return; // uploadImage sets its own error
        }
        setUploadedUrl(finalUrl);
      }

      // Build images array per PostCreateRequest DTO
      const images = finalUrl
        ? [{ originalImageUrl: finalUrl, thumbnailUrl: finalUrl, aspectRatio: 1.0, sequenceOrder: 1 }]
        : [];

      await createPost(clubId, { caption: caption.trim(), images });
      handleClose();
      // Refresh the page to show the new post (useFeed will re-init)
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg" className="text-slate-800">Create a Moment</Text>
      }
      size="md"
      radius="lg"
      centered
      styles={{
        header: { paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
        body: { padding: '20px 24px 24px' },
      }}
    >
      <div className="flex flex-col gap-4">

        {/* Image upload area */}
        {preview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full max-h-72 object-cover rounded-xl" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors group cursor-pointer bg-gray-50 hover:bg-blue-50/40"
          >
            <div className="bg-gray-100 group-hover:bg-blue-100 p-4 rounded-full transition-colors">
              <Camera size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="text-center">
              <Text size="sm" fw={600} className="text-slate-600 group-hover:text-blue-600 transition-colors">
                Upload a photo
              </Text>
              <Text size="xs" className="text-slate-400 mt-0.5">JPEG, PNG, WEBP · max 5 MB</Text>
            </div>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Upload progress */}
        {uploading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <Text size="xs" className="text-slate-500">Uploading…</Text>
              <Text size="xs" fw={600} className="text-blue-600">{progress}%</Text>
            </div>
            <Progress value={progress} size="sm" radius="xl" color="blue" />
          </div>
        )}

        {/* Caption */}
        <Textarea
          label="Caption"
          placeholder="Write something about this moment…"
          value={caption}
          onChange={(e) => setCaption(e.currentTarget.value)}
          minRows={3}
          maxRows={6}
          autosize
          maxLength={2200}
          styles={{ label: { fontWeight: 600, marginBottom: 4 } }}
        />
        <Text size="xs" className="text-slate-400 -mt-3 text-right">{caption.length}/2200</Text>

        {/* Error */}
        {error && (
          <Alert icon={<AlertCircle size={16} />} color="red" radius="md" variant="light">
            {error}
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="default"
            radius="md"
            className="flex-1"
            onClick={handleClose}
            disabled={submitting || uploading}
          >
            Cancel
          </Button>
          <Button
            radius="md"
            className="flex-1 border-0 text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            loading={submitting || uploading}
            onClick={handleSubmit}
          >
            Post
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── MomentsFeed ─────────────────────────────────────────────────────────────
// Inline sub-component so ClubView stays as a single file.
// Calls useFeed(clubId) and renders the infinite scroll list.
const MomentsFeed = ({ clubId, onComment }) => {
  const { posts, loading, loadingMore, hasMore, sentinelRef, error } = useFeed(clubId);

  // Skeleton cards on initial load
  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-[560px] mx-auto">
        {[1, 2, 3].map((k) => (
          <div key={k} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton circle height={38} width={38} />
              <div className="flex-1">
                <Skeleton height={12} width="40%" mb={6} />
                <Skeleton height={10} width="25%" />
              </div>
            </div>
            <Skeleton height={280} />
            <div className="px-4 py-3">
              <Skeleton height={10} width="30%" mb={8} />
              <Skeleton height={10} width="80%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Center className="py-16">
        <Alert icon={<AlertCircle size={18} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      </Center>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-slate-100 p-5 rounded-full mb-4">
          <Camera size={32} className="text-slate-400" />
        </div>
        <Text fw={600} size="md" className="text-slate-600">No moments yet</Text>
        <Text size="sm" className="text-slate-400 mt-1">Posts from this club will appear here.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[560px] mx-auto">
      {posts.map((post) => (
        <MomentCard key={post.id} post={post} onComment={onComment} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more spinner */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader size="sm" color="blue" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <Text size="xs" className="text-center text-slate-400 pb-6">You've seen all moments ✨</Text>
      )}
    </div>
  );
};

export default ClubView;
