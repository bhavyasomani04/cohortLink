/**
 * AuthPromptCard.jsx
 *
 * Reusable inline authentication card rendered *inside* the AppShell
 * (sidebar + topbar stay visible). Shows a full sign-in / register form
 * without any page navigation.
 *
 * Props:
 *   message   {string}   — Contextual prompt shown at top of card,
 *                          e.g. "Sign in to join this club"
 *   onSuccess {function} — Called after a successful auth action.
 *   onDismiss {function} — If provided, renders an x close button.
 */

import { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Button,
  Text,
  Stack,
  Anchor,
  Divider,
  Loader,
  Alert,
  Paper,
  ActionIcon,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';

const inputStyles = {
  input: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    color: '#111827',
    borderRadius: '8px',
    '&::placeholder': { color: '#9ca3af' },
    '&:focus': { borderColor: '#2563eb' },
  },
};

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthPromptCard({ message, onSuccess, onDismiss }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: (v) => (mode === 'register' && !v.trim() ? 'Name is required' : null),
      email: (v) => (!v.trim() ? 'Email is required' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (!v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values) => {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(values.name, values.email, values.password);
      } else {
        await login(values.email, values.password);
      }
      onSuccess?.();
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/invalid-email') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    form.reset();
  };

  return (
    <Paper
      shadow="md"
      radius="xl"
      p="xl"
      className="w-full"
      style={{ maxWidth: 440, border: '1px solid #e5e7eb', animation: 'fadeInUp 0.35s ease both' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 48, height: 48, background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            {message && (
              <Text size="xs" fw={600} style={{ color: '#2563eb', letterSpacing: '0.03em' }}>
                SIGN IN REQUIRED
              </Text>
            )}
            <Text fw={800} size="lg" className="text-gray-900" style={{ letterSpacing: '-0.3px' }}>
              {mode === 'register' ? 'Create an account' : 'Sign in to continue'}
            </Text>
          </div>
        </div>

        {onDismiss && (
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onDismiss} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </ActionIcon>
        )}
      </div>

      {/* Contextual message banner */}
      {message && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 mb-5"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <Text size="sm" style={{ color: '#1d4ed8' }}>{message}</Text>
        </div>
      )}

      {/* Mode toggle */}
      <Text size="sm" className="text-gray-500 mb-5" style={{ lineHeight: 1.5 }}>
        {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
        <Anchor size="sm" fw={600} style={{ color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }} onClick={switchMode}>
          {mode === 'register' ? 'Sign in' : 'Sign up'}
        </Anchor>
      </Text>

      {error && (
        <Alert color="red" variant="light" radius="md" mb="md" style={{ fontSize: '13px' }}>
          {error}
        </Alert>
      )}

      {/* Google */}
      <Button
        fullWidth size="md" radius="md" variant="default"
        leftSection={<GoogleIcon size={18} />}
        onClick={handleGoogle}
        disabled={submitting}
        className="mb-4 transition-transform duration-200 hover:scale-[1.01]"
        styles={{
          root: {
            backgroundColor: '#ffffff', border: '1px solid #e5e7eb',
            color: '#374151', fontWeight: 600, fontSize: '14px', height: '44px',
            '&:hover': { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
          },
        }}
      >
        Continue with Google
      </Button>

      <Divider
        label="or continue with email" labelPosition="center" my="md"
        styles={{ label: { fontSize: '12px', color: '#9ca3af', fontWeight: 500 }, root: { borderColor: '#e5e7eb' } }}
      />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {mode === 'register' && (
            <TextInput label="Full name" placeholder="John Doe" withAsterisk {...form.getInputProps('name')} styles={inputStyles} size="md" />
          )}
          <TextInput label="Email" placeholder="you@example.com" withAsterisk {...form.getInputProps('email')} styles={inputStyles} size="md" />
          <PasswordInput label="Password" placeholder="At least 6 characters" withAsterisk {...form.getInputProps('password')} styles={inputStyles} size="md" />

          <Button
            type="submit" fullWidth size="md" radius="md" disabled={submitting}
            className="mt-2 transition-transform duration-200 hover:scale-105 hover:opacity-90"
            styles={{
              root: {
                backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 600,
                fontSize: '14px', height: '44px', boxShadow: '0 2px 8px rgba(37,99,235,.35)',
                '&:hover': { backgroundColor: '#1e40af' },
              },
            }}
          >
            {submitting ? <Loader size="sm" color="white" type="dots" /> : mode === 'register' ? 'Create account' : 'Sign in'}
          </Button>
        </Stack>
      </form>

      <Text size="xs" className="text-gray-400 text-center mt-4" style={{ lineHeight: 1.6 }}>
        By continuing, you agree to CohortLink's Terms of Service and Privacy Policy.
      </Text>
    </Paper>
  );
}
