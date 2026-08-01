# CohortLink Frontend - Project History & Best Practices

This file serves as a historical log of architectural decisions, bug fixes, and best practices discovered during the development of this project. It provides AI agents and developers context on *why* certain patterns are enforced.

## 1. State Management in Effects (Cascading Renders)
**Date:** 2026-06-25
**Context:** When fetching data on component mount (e.g., in `HomeView.jsx`), we initially used a pattern where loading state was initialized to `true`, and then redundantly set to `true` again synchronously inside the `useEffect`.
**Issue:** ESLint warning: `Calling setState synchronously within an effect can trigger cascading renders.` This causes an immediate, redundant re-render loop right after the initial render.
**Best Practice / Rule:** 
- Always initialize loading states correctly using `useState(true)` if the component is fetching data on mount.
- **NEVER** call a state setter (like `setLoading(true)`) synchronously at the top of a `useEffect`. Only update the state after an asynchronous operation (e.g., in `.then()`, `.catch()`, or `.finally()`).

## 2. Navigation Architecture
**Date:** 2026-06-25
**Context:** Refactored the application from local state-based navigation (`activeNav`) to standard URL-based navigation.
**Best Practice / Rule:**
- Use `react-router-dom` for all navigation.
- Top-level page components should be stored in `src/views/` (e.g., `HomeView.jsx`, `MyClubsView.jsx`).
- Navigation components (like `Sidebar.jsx`) should rely on `useLocation` from `react-router-dom` to determine the active route, rather than passing state props down the tree.

## 3. Global Location Architecture
**Date:** 2026-06-25
**Context:** Implemented an enterprise-grade location retrieval system to fetch events near the user without degrading UX or privacy.
**Architecture / Rule:**
- **Deterministic Fallback Chain:** Location is resolved in `locationService.js` through a strict fallback chain: LocalStorage Cache (24h TTL) -> Browser Geolocation API (GPS) -> IP-based Geolocation (ipapi.co) -> Static Default City.
- **Global State Context:** Location state is resolved exactly ONCE at app boot via `LocationContext.jsx` (which wraps the entire app in `main.jsx`). 
- **Best Practice:** Individual components (like `HomeView.jsx`) should **never** trigger location fetching APIs directly. They must consume `useUserLocation()` from the global context and wait for `locationLoading` to settle before making location-dependent backend API calls.
- **Privacy/Storage:** We only cache city-level coordinates in `localStorage`, never raw high-precision GPS data.

## 4. UI Animation and Conditional Rendering Resilience
**Date:** 2026-06-27
**Context:** When implementing an expanding list of attendees in `EventDetailView.jsx`, we attempted to use Mantine's `useDisclosure` and `<Collapse>` components. The component failed to render the expanded state correctly.
**Issue:** 
1. The `<Collapse>` component measures pixel height (`scrollHeight`) immediately on mount. If child elements (like mapped data or avatars) haven't fully painted or are nested inside conflicting Tailwind Flex/Grid contexts, it measures a height of `0px` and technically opens but hides the content.
2. If mapped API data is incomplete (e.g., a missing `username`), trying to manipulate it (like `.charAt(0)`) throws a silent JavaScript TypeError inside the component tree, causing React to silently abort rendering that chunk of the UI.
**Best Practice / Rule:**
- **Prefer Standard Conditional Rendering:** For critical UI blocks that lazy-load or contain dynamic data, prefer standard React conditional rendering (e.g., `{show && <div className="animate-[fadeIn_0.3s_ease-out]">...</div>}`) over UI library animation wrappers (like `<Collapse>`) to guarantee the DOM is rendered natively.
- **Data Safety Fallbacks:** Always use optional chaining and logical OR fallbacks when rendering API data arrays to prevent silent React rendering crashes (e.g., `(user?.username || 'Unknown').charAt(0)`).
