import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Autocomplete,
  ActionIcon,
  Group,
  Badge,
  Burger,
  Text,
  Tooltip,
  Menu,
  Avatar,
} from '@mantine/core';
import { useUserLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import LocationAutocomplete from './LocationAutocomplete';

const SUGGESTED_KEYWORDS = ["Music", "Technology", "Sports & Fitness", "Networking", "Arts & Culture", "Workshops"];

export default function TopBar({ burgerOpened, onBurgerToggle }) {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(initialSearch);

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);
  const { location, refreshLocation, setManualLocation } = useUserLocation();
  const { user, dbUser, logout, initializing } = useAuth();
  const navigate = useNavigate();
  const [managedClubs, setManagedClubs] = useState([]);

  // Fetch clubs to check if user manages any
  useEffect(() => {
    if (dbUser) {
      import('../services/api').then(({ getClubCategories }) => {
        getClubCategories()
          .then(res => {
            const clubs = Array.isArray(res) ? res : (res?.content || []);
            const userManaged = clubs.filter(c => c.manager?.id === dbUser.id);
            setManagedClubs(userManaged);
          })
          .catch(() => {
            // fallback if api fails, use mock
            import('../services/mockData').then(({ MOCK_CLUB_CATEGORIES }) => {
              const userManaged = MOCK_CLUB_CATEGORIES.filter(c => c.manager?.id === dbUser.id);
              setManagedClubs(userManaged);
            });
          });
      });
    } else {
      setManagedClubs([]);
    }
  }, [dbUser]);

  // Derive display info from Firebase user or backend profile
  const displayName = user?.displayName || dbUser?.name || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const photoUrl = user?.photoURL;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 h-14 border-b border-gray-200 bg-white"
    >
      {/* Mobile burger */}
      <Burger
        opened={burgerOpened}
        onClick={onBurgerToggle}
        hiddenFrom="sm"
        size="sm"
        color="gray"
        aria-label="Toggle navigation menu"
      />

      {/* Logo text (mobile only) */}
      <Text
        fw={700}
        size="sm"
        visibleFrom="xs"
        hiddenFrom="sm"
        className="text-blue-600 tracking-wide shrink-0"
      >
        CohortLink
      </Text>

      {/* App title visible on desktop */}
      <Text
        fw={700}
        size="sm"
        visibleFrom="sm"
        className="text-blue-600 tracking-wide shrink-0 mr-2"
      >
        CohortLink
      </Text>

      {/* Search Area */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2 mt-1">
        
        {/* Event Search */}
        <div className="flex-1">
          <Autocomplete
            id="search-events-input"
            placeholder="Search events..."
            data={SUGGESTED_KEYWORDS}
            value={searchValue}
            onChange={setSearchValue}
            onOptionSubmit={(val) => {
              if (val.trim()) {
                navigate(`/?search=${encodeURIComponent(val.trim())}`);
              } else {
                navigate(`/`);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (searchValue.trim()) {
                  navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
                } else {
                  navigate(`/`);
                }
              }
            }}
            aria-label="Search events"
            leftSection={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            styles={{
              input: {
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#111827',
                borderRadius: '8px',
                height: 36,
              },
            }}
          />
        </div>

        {/* City Selector */}
        <div className="flex-1">
          <LocationAutocomplete
            label=""
            description=""
            placeholder="Select a city..."
            searchType="city"
            value={location?.city || ''}
            onChange={({ label, latitude, longitude }) => {
              setManualLocation({ city: label, lat: latitude, lng: longitude, source: 'manual' });
            }}
          />
        </div>

        {/* Refresh Location Button */}
        <Tooltip label="Refresh Location" withArrow>
          <ActionIcon
            id="refresh-location-btn"
            variant="default"
            size="lg"
            radius="md"
            onClick={() => refreshLocation()}
            aria-label="Refresh Location"
            style={{ height: 36, width: 36 }}
            styles={{
              root: {
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                '&:hover': { backgroundColor: '#f3f4f6' },
              },
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4" y1="12" x2="8" y2="12" />
              <line x1="16" y1="12" x2="20" y2="12" />
            </svg>
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <Group gap="sm">


        {/* Profile avatar — auth-aware */}
        {!initializing && user ? (
          <Menu
            shadow="md"
            width={220}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right' }}
          >
            <Menu.Target>
              <ActionIcon
                id="profile-avatar"
                variant="subtle"
                size="lg"
                radius="xl"
                aria-label="User profile menu"
                className="transition-all duration-200"
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1.5px solid #2563eb',
                }}
              >
                {photoUrl ? (
                  <Avatar src={photoUrl} size={20} radius="xl" />
                ) : (
                  <Text
                    size="xs"
                    fw={700}
                    className="text-blue-600"
                  >
                    {initials}
                  </Text>
                )}
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#6b7280' }}>
                Signed in as
              </Menu.Label>
              <Menu.Item disabled style={{ color: '#111827', fontWeight: 600 }}>
                {displayName}
              </Menu.Item>
              <Menu.Item disabled style={{ color: '#6b7280', fontSize: '12px' }}>
                {user.email}
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                onClick={() => navigate('/bookings')}
                style={{ fontSize: '13px' }}
              >
                My Bookings
              </Menu.Item>

              {managedClubs.length > 0 && (
                <Menu.Item
                  onClick={() => navigate('/my-clubs')}
                  style={{ fontSize: '13px' }}
                >
                  Manage Clubs
                </Menu.Item>
              )}

              <Menu.Divider />

              <Menu.Item
                color="red"
                onClick={handleLogout}
                style={{ fontSize: '13px' }}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : !initializing ? (
          <Tooltip label="Sign in" withArrow>
            <ActionIcon
              id="profile-avatar"
              variant="subtle"
              size="lg"
              radius="xl"
              aria-label="Sign in"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
              onClick={() => navigate('/login')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </ActionIcon>
          </Tooltip>
        ) : null}
      </Group>
    </header>
  );
}
