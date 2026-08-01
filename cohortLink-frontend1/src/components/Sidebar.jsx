import { NavLink, Text, Stack, Divider } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    id: 'discovery',
    path: '/',
    label: 'Discovery',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'my-clubs',
    path: '/my-clubs',
    label: 'My Clubs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'create-club',
    path: '/create-club',
    label: 'Create Club',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    isAction: true,
  },

];

export default function Sidebar({ onNavChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full py-6 px-3 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 mb-8">
        {/* Circular logo icon with dark gradient */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #1e3a5f, #0f172a)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5" fill="white" opacity="0.15" />
            <circle cx="12" cy="12" r="2.5" fill="white" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <Text fw={700} size="sm" className="text-gray-900 tracking-wide">CohortLink</Text>
          <Text
            size="xs"
            className="tracking-widest font-semibold"
            style={{ fontSize: '9px', color: '#2563eb' }}
          >
            ACTIVE INCLUSION
          </Text>
        </div>
      </div>

      <Divider className="mb-4" style={{ borderColor: '#f3f4f6' }} />

      {/* Navigation */}
      <Stack gap={2} className="flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const isAction = item.isAction;

          return (
            <NavLink
              key={item.id}
              id={`nav-${item.id}`}
              label={item.label}
              leftSection={item.icon}
              active={isActive}
              onClick={() => {
                navigate(item.path);
                if (onNavChange) onNavChange();
              }}
              className="rounded-lg transition-all duration-200"
              styles={{
                root: isAction
                  ? {
                      color: '#2563eb',
                      backgroundColor: '#eff6ff',
                      fontWeight: 600,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px dashed #bfdbfe',
                      marginTop: '4px',
                      '&:hover': {
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                      },
                    }
                  : {
                      color: isActive ? '#ffffff' : '#6b7280',
                      backgroundColor: isActive ? '#22c55e' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: isActive ? '#22c55e' : '#f3f4f6',
                        color: isActive ? '#ffffff' : '#374151',
                      },
                    },
                section: {
                  color: isAction ? '#2563eb' : isActive ? '#ffffff' : '#9ca3af',
                },
              }}
            />
          );
        })}
      </Stack>

      <Divider className="mt-4 mb-4" style={{ borderColor: '#f3f4f6' }} />

      {/* Footer of sidebar */}
      <div className="px-3">
        <Text size="xs" className="text-gray-400 text-center">v1.0.0 · CohortLink</Text>
      </div>
    </aside>
  );
}
