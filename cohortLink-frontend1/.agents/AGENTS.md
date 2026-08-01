# CohortLink Frontend - Project & Business Context

This file serves as the definitive context for all AI agents working on this project. It is automatically loaded for every session and model.

## 🏢 Business Context
 **cohortLink**, a modern Spring Boot RESTful API backend for a social networking and community platform. Based on its data model, the application allows users to create and manage clubs, host and book events with capacity limits, and engage through a social feed by creating posts with images, leaving comments, and liking content.

- **Product Name**: CohortLink
- **Core Value Proposition**: [e.g., Fostering active inclusion through community-driven events and shared passions.]
- **Target Audience**: [e.g., Students, professionals, hobbyists looking to connect locally.]
- **Key Business Workflows**: [e.g., Users must register, join clubs, and RSVP to events. Club managers can create and manage events.]
- **Tone & Brand Voice**: [e.g., Welcoming, vibrant, modern, inclusive.]

---

## 💻 Tech Stack Overview
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS 4 & Mantine UI 9
- **Components**: Mantine UI (Core, Dates, Form, Hooks)
- **Date Handling**: Day.js
- **Tooling**: ESLint, Vite

---

## 📜 Development Rules

### 1. Component Usage
- **Primary Component Library**: Use **Mantine UI** components (`@mantine/core`, `@mantine/dates`, `@mantine/form`) for all standard UI elements (e.g., buttons, inputs, modals, cards, typography).
- Do not build custom UI components from scratch if a Mantine component already exists that serves the purpose.
- **Custom Styling**: Use Tailwind CSS classes for layout (flex, grid, padding, margin) and specific styling overrides where Mantine's `style` or `className` props are insufficient.
- Prefer Mantine's built-in props (like `mt`, `mb`, `c`, `bg`) for simple spacing and colors when using Mantine components.

### 2. Forms and State Management
- Use `@mantine/form` for handling form state, validation, and submissions.
- Use `@mantine/hooks` for common React hook patterns (e.g., `useDisclosure`, `useMediaQuery`, `useClickOutside`).

### 3. Date and Time
- Use `dayjs` for all date manipulation and formatting. Avoid using native `Date` object methods directly when complex formatting or timezone handling is required.
- Pass `dayjs` instances or formatted strings to `@mantine/dates` components.

### 4. Code Style & Architecture
- **Functional Components**: Write functional components and use hooks. Avoid class components.
- **Modularity**: Keep components small, focused, and reusable.
- **Imports**: Organize imports logically. Group library imports together, followed by internal component imports.
- **Linting**: Ensure all code passes ESLint checks (`npm run lint`).

### 5. Styling Guidelines (Aesthetics)
- **Vibrant & Modern**: Utilize Mantine's robust theme capabilities combined with Tailwind to create a visually impressive, modern interface.
- **Responsive Design**: Ensure all layouts are fully responsive across mobile, tablet, and desktop views using Tailwind's breakpoints (`sm:`, `md:`, `lg:`) and Mantine's responsive props.
- **Micro-interactions**: Incorporate subtle hover states, transitions, and animations (via Tailwind or Mantine's transition components) to make the application feel dynamic and engaging.


### 6. File Structure & Project Context
- **Routing**: `react-router-dom` is configured globally. The top-level `<BrowserRouter>` wraps the application in `src/main.jsx`. The actual route definitions (`<Routes>`) and layout (via Mantine's `<AppShell>`) are handled in `src/App.jsx`.
- **Pages/Views**: All top-level page components should be placed in `src/views` (e.g., `HomeView.jsx`, `EventsView.jsx`, `ClubView.jsx`) and imported into `src/App.jsx` for routing.
- **Reusable Components**: Layout components (like `Sidebar`, `TopBar`, `Footer`) and other shared UI building blocks should be kept in `src/components`.
- **Global Context Providers**: State context providers (like `LocationProvider`) are placed in `src/context` and injected at the root level in `src/main.jsx`.
- **Utilities**: Reusable utility functions (like `dayjs` formatters) should go in `src/utils`.

### 7. React Best Practices & Historical Learnings
- **Avoid Cascading Renders:** When a component fetches data on mount, initialize its loading state to `true` via `useState(true)`. **NEVER** call `setLoading(true)` synchronously inside a `useEffect` as it triggers immediate redundant re-renders. (See `history.md` for context).
- **Navigation:** Use `react-router-dom` for routing. Rely on `useLocation()` for active state detection in navigation components rather than passing state down as props.
- **Global Location Context:** Never fetch user location directly inside page components. Location is resolved globally once at app boot via a fallback chain (Cache -> GPS -> IP -> Default). Use `useUserLocation()` from `LocationContext.jsx` and gate location-dependent backend calls behind `!locationLoading`.

---
