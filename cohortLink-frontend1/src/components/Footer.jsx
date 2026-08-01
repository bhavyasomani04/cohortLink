import { Text, Divider, Anchor, Group, ActionIcon } from '@mantine/core';

const DISCOVER_LINKS = [
  { id: 'footer-upcoming-events', label: 'Upcoming Events' },
  { id: 'footer-active-clubs', label: 'Active Clubs' },
  { id: 'footer-member-stories', label: 'Member Stories' },
  { id: 'footer-local-chapters', label: 'Local Chapters' },
];

const ACCOUNT_LINKS = [
  { id: 'footer-profile-settings', label: 'Profile Settings' },
  { id: 'footer-my-meetups', label: 'My Meetups' },
  { id: 'footer-joined-clubs', label: 'Joined Clubs' },
  { id: 'footer-notifications', label: 'Notifications' },
];

const SOCIAL_LINKS = [
  {
    id: 'footer-social-share',
    label: 'Share',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    id: 'footer-social-instagram',
    label: 'Instagram',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: 'footer-social-chat',
    label: 'Community chat',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'footer-social-globe',
    label: 'Website',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-gray-200 bg-white px-6 md:px-10 pt-12 pb-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        {/* Brand column */}
        <div className="lg:col-span-1">
          <Text fw={800} size="lg" className="mb-3 tracking-wide" style={{ color: '#2563eb' }}>CohortLink</Text>
          <Text size="sm" className="text-gray-500 leading-relaxed">
            Fostering active inclusion through community-driven events and shared passions. Connecting people, one meetup at a time.
          </Text>
        </div>

        {/* Discover */}
        <div>
          <Text size="xs" fw={700} className="text-gray-400 tracking-widest mb-4">DISCOVER</Text>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {DISCOVER_LINKS.map((link) => (
              <li key={link.id}>
                <Anchor
                  id={link.id}
                  href="#"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 no-underline"
                >
                  {link.label}
                </Anchor>
              </li>
            ))}
          </ul>
        </div>

        {/* Your Account */}
        <div>
          <Text size="xs" fw={700} className="text-gray-400 tracking-widest mb-4">YOUR ACCOUNT</Text>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.id}>
                <Anchor
                  id={link.id}
                  href="#"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200 no-underline"
                >
                  {link.label}
                </Anchor>
              </li>
            ))}
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <Text size="xs" fw={700} className="text-gray-400 tracking-widest mb-4">FOLLOW US</Text>
          <Group gap="sm">
            {SOCIAL_LINKS.map((social) => (
              <ActionIcon
                key={social.id}
                id={social.id}
                component="a"
                href="#"
                variant="subtle"
                size="lg"
                radius="xl"
                aria-label={social.label}
                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              >
                {social.icon}
              </ActionIcon>
            ))}
          </Group>
        </div>
      </div>

      <Divider style={{ borderColor: '#e5e7eb' }} className="mb-6" />

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Text size="xs" className="text-gray-400 tracking-wider">
          © 2024 COHORTLINK COMMUNITY. ALL RIGHTS RESERVED.
        </Text>
        <Group gap="lg">
          {['footer-privacy', 'footer-terms', 'footer-help'].map((id) => (
            <Anchor
              key={id}
              id={id}
              href="#"
              size="xs"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 no-underline capitalize"
            >
              {id.replace('footer-', '')}
            </Anchor>
          ))}
        </Group>
      </div>
    </footer>
  );
}
