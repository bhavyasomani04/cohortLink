/**
 * useAuthGuard.js
 *
 * Action-level authentication guard hook.
 *
 * Usage:
 *   const { guard, showPrompt, dismissPrompt } = useAuthGuard();
 *
 *   // Wrap any handler — runs immediately if authed, shows auth prompt if not.
 *   <Button onClick={() => guard(handleJoin)}>Join Club</Button>
 *
 *   // Render the prompt card conditionally below the gated element.
 *   {showPrompt && (
 *     <AuthPromptCard
 *       message="Sign in to join this club"
 *       onSuccess={dismissPrompt}
 *       onDismiss={dismissPrompt}
 *     />
 *   )}
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * @returns {{
 *   guard: (action: () => void) => void,
 *   showPrompt: boolean,
 *   dismissPrompt: () => void,
 * }}
 */
export function useAuthGuard() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  /**
   * Runs `action` immediately if the user is authenticated.
   * Otherwise opens the inline AuthPromptCard.
   *
   * @param {() => void} action — The callback to run when authed.
   */
  const guard = (action) => {
    if (user) {
      action();
    } else {
      setShowPrompt(true);
    }
  };

  const dismissPrompt = () => setShowPrompt(false);

  return { guard, showPrompt, dismissPrompt };
}
