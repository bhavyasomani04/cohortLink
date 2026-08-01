/**
 * RequireAuth.jsx
 *
 * Route-level guard component.  If the user is not signed in, renders an
 * inline AuthPromptCard in place of the page body (the AppShell — sidebar
 * and topbar — stays fully visible). The URL is preserved so the user
 * always knows which page they were trying to reach.
 *
 * Once the user signs in inside the card, AuthContext.user becomes non-null
 * and this component automatically re-renders to show `children` — no
 * navigation or redirect required.
 *
 * Usage in App.jsx:
 *   <Route
 *     path="/my-clubs"
 *     element={
 *       <RequireAuth message="Sign in to see your clubs">
 *         <MyClubsView />
 *       </RequireAuth>
 *     }
 *   />
 */

import { useAuth } from '../context/AuthContext';
import AuthPromptCard from './AuthPromptCard';

/**
 * @param {{ children: React.ReactNode, message?: string }} props
 */
export default function RequireAuth({ children, message }) {
  const { user, initializing } = useAuth();

  // Wait for the initial Firebase session check before deciding.
  // Returning null prevents a flash of the auth card on page refresh.
  if (initializing) return null;

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <AuthPromptCard message={message} />
      </div>
    );
  }

  return children;
}
