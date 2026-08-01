// Mock data used when the backend API is unavailable (dev / offline mode)

export const MOCK_FEATURED_EVENT = {
  id: 1,
  title: 'City-Wide Badminton Open',
  description:
    'Join the community for a weekend of friendly competition, casual rallies, and connection at our annual open tournament. All skill levels welcome.',
  date: '2024-10-20T10:00:00',
  location: 'Community Sports Center',
  imageUrl: '/hero_banner.jpg',
};

export const MOCK_EVENTS = [
  {
    id: 2,
    title: 'Friday Board Game Night',
    date: '2024-10-14T18:00:00',
    location: 'The Dice Den Cafe',
    imageUrl: '/event_board_game.jpg',
  },
  {
    id: 3,
    title: 'Sunday Morning Smash',
    date: '2024-10-15T09:00:00',
    location: 'Community Sports Center',
    imageUrl: '/event_dj_set.jpg',
  },
  {
    id: 4,
    title: 'Basement Jazz Workshop',
    date: '2024-10-18T19:00:00',
    location: 'Sound Stage Studios',
    imageUrl: '/event_jazz_workshop.jpg',
  },
];

export const MOCK_CLUB_CATEGORIES = [
  {
    id: 1,
    name: 'Sports & Fitness',
    bio: 'Multi-purpose indoor courts and community athletics facilities.',
    profileImageUrl: null,
    category: 'Sports & Fitness',
    city: 'Mumbai',
    latitude: 19.0760,
    longitude: 72.8777,
    manager: { id: 1, email: 'admin@cohortlink.com', name: 'admin' },
  },
  {
    id: 2,
    name: 'Music & Arts',
    bio: 'Affordable practice spaces and recording rooms for local musicians.',
    profileImageUrl: null,
    category: 'Music & Arts',
    city: 'Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    manager: { id: 2, email: 'artadmin@cohortlink.com', name: 'artadmin' },
  },
  {
    id: 3,
    name: 'Gaming & Social',
    bio: 'Cozy atmosphere, great coffee, and a massive library of tabletop games.',
    profileImageUrl: null,
    category: 'Gaming & Social',
    city: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    manager: { id: 3, email: 'gameadmin@cohortlink.com', name: 'gameadmin' },
  },
  {
    id: 4,
    name: 'Tech & Innovation',
    bio: 'Workshops, hackathons, and meetups for the curious and the technical.',
    profileImageUrl: null,
    category: 'Tech & Innovation',
    city: 'Hyderabad',
    latitude: 17.3850,
    longitude: 78.4867,
    manager: { id: 4, email: 'techclub@cohortlink.com', name: 'techclub' },
  },
  {
    id: 5,
    name: 'Wellness & Yoga',
    bio: 'Mindfulness sessions, yoga classes, and wellness workshops for everyone.',
    profileImageUrl: null,
    category: 'Wellness & Yoga',
    city: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    manager: { id: 5, email: 'wellnessclub@cohortlink.com', name: 'wellnessclub' },
  },
  {
    id: 6,
    name: 'Food & Culture',
    bio: 'Explore global cuisines, cooking classes, and culinary culture events.',
    profileImageUrl: null,
    category: 'Food & Culture',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    manager: { id: 6, email: 'foodclub@cohortlink.com', name: 'foodclub' },
  },
];
