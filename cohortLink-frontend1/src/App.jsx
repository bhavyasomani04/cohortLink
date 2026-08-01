import React, { Suspense, lazy } from 'react';
import { AppShell, Burger, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';

// Vercel Best Practice: bundle-dynamic-imports
// Lazy load route components to reduce initial bundle size
const HomeView = lazy(() => import('./views/HomeView'));
const MyClubsView = lazy(() => import('./views/MyClubsView'));
const ClubView = lazy(() => import('./views/ClubView'));

const EventDetailView = lazy(() => import('./views/EventDetailView'));
const BookingsView = lazy(() => import('./views/BookingsView'));
const CommunityView = lazy(() => import('./views/CommunityView'));
const LoginView = lazy(() => import('./views/LoginView'));
const ClubFormView = lazy(() => import('./views/ClubFormView'));
const EventFormView = lazy(() => import('./views/EventFormView'));
const ClubManagerDashboardView = lazy(() => import('./views/ClubManagerDashboardView'));

// Fallback loader for Suspense boundaries
const PageLoader = () => (
  <Center className="h-[50vh]">
    <Loader color="blue" size="lg" type="dots" />
  </Center>
);

// ─── Main Layout (AppShell with sidebar, topbar, footer) ──────────────────

function MainLayout() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
      className="min-h-screen bg-[#f5f5f5]"
    >
      {/* Navbar slot */}
      <AppShell.Navbar className="border-r border-gray-200 bg-white">
        <Sidebar onNavChange={close} />
      </AppShell.Navbar>

      {/* Main content slot */}
      <AppShell.Main className="flex flex-col min-h-screen bg-[#f5f5f5]">
        <TopBar
          burgerOpened={opened}
          onBurgerToggle={toggle}
        />

        {/* Vercel Best Practice: async-suspense-boundaries */}
        {/* Stream content and show fallback while chunks are loading */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>

        <div className="mt-auto">
          <Footer />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Standalone routes (no sidebar/topbar) */}
        <Route path="/login" element={<LoginView />} />

        {/* Main app routes — wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeView />} />

          {/* Clubs Routing Group */}
          <Route
            path="/my-clubs"
            element={
              <RequireAuth message="Sign in to see your clubs and memberships">
                <MyClubsView />
              </RequireAuth>
            }
          />
          <Route path="/club/:clubId" element={<ClubView />} />
          <Route
            path="/create-club"
            element={
              <RequireAuth message="Sign in to create and manage your own club">
                <ClubFormView />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-club/:clubId"
            element={
              <RequireAuth message="Sign in to edit your club">
                <ClubFormView />
              </RequireAuth>
            }
          />

          {/* Events Routing Group */}
          <Route path="/event/:eventId" element={<EventDetailView />} />
          <Route
            path="/create-event"
            element={
              <RequireAuth message="Sign in to create an event for your club">
                <EventFormView />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-event/:eventId"
            element={
              <RequireAuth message="Sign in to edit your event">
                <EventFormView />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth message="Sign in to view and manage your event bookings">
                <BookingsView />
              </RequireAuth>
            }
          />
          <Route
            path="/club-manager-dashboard/:clubId"
            element={
              <RequireAuth message="Sign in to view the club manager dashboard">
                <ClubManagerDashboardView />
              </RequireAuth>
            }
          />

          {/* Community */}
          <Route
            path="/community"
            element={
              <RequireAuth message="Sign in to access the community and connect with others">
                <CommunityView />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
