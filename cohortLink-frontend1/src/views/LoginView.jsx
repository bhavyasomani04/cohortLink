/**
 * LoginView.jsx
 *
 * Standalone login / registration page rendered *outside* the AppShell
 * (no sidebar, no topbar, no footer).  Users toggle between "Sign in"
 * and "Create account" modes; Google OAuth is available in both.
 *
 * Design language matches the existing CohortLink theme:
 *   - Brand blue #2563eb / #1d4ed8 gradient panel (desktop left side)
 *   - Concentric-circle logo mark from Sidebar
 *   - Inter font, inputs styled identically to TopBar search
 *   - Primary button styled like FeaturedEvent "Register Now"
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Container,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';

// ─── Shared input styles (mirrors TopBar.jsx search input) ──────────────

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

// ─── Brand Logo Component (extracted from Sidebar.jsx) ──────────────────

function BrandLogo({ size = 40, className = '' }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 35%, #1e3a5f, #0f172a)',
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.15" />
        <circle cx="12" cy="12" r="2.5" fill="white" />
      </svg>
    </div>
  );
}

// ─── Google Brand Icon ──────────────────────────────────────────────────

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function LoginView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('from') || '/';

  const { user, login, register, loginWithGoogle, initializing } = useAuth();

  // Local UI state
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect away if already authenticated
  useEffect(() => {
    if (!initializing && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, initializing, navigate, redirectTo]);

  // ─── Form setup via @mantine/form ─────────────────────────────────

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      name: (v) => (mode === 'register' && !v.trim() ? 'Name is required' : null),
      email: (v) => (!v.trim() ? 'Email is required' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (!v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSubmit = async (values) => {
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        await register(values.name, values.email, values.password);
      } else {
        await login(values.email, values.password);
      }
      // AuthContext will update `user`; the useEffect above handles redirect
    } catch (err) {
      // Translate Firebase error codes to user-friendly messages
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
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show a full-page loader while Firebase resolves the session
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader color="blue" size="lg" type="dots" />
      </div>
    );
  }

  // Don't render the form if already authenticated (about to redirect)
  if (user) return null;

  return (
    <div
      className="min-h-screen flex"
      style={{ animation: 'fadeInUp 0.4s ease both' }}
    >
      {/* ── Left Panel: Brand Gradient (hidden on mobile) ──────────── */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
        }}
      >
        {/* Decorative circles (mirrors community-promo-card) */}
        <div
          className="absolute -top-10 -right-10 rounded-full"
          style={{ width: 280, height: 280, background: 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute -bottom-16 -left-16 rounded-full"
          style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.04)' }}
        />

        {/* Brand block */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <BrandLogo size={72} className="mb-6" />
          <Text
            fw={800}
            size="xl"
            className="text-white mb-2"
            style={{ letterSpacing: '-0.5px' }}
          >
            CohortLink
          </Text>
          <Text
            size="xs"
            className="tracking-widest font-semibold mb-8"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}
          >
            ACTIVE INCLUSION
          </Text>

          <Text
            size="lg"
            fw={700}
            className="text-white mb-3"
            style={{ letterSpacing: '-0.3px', lineHeight: 1.2 }}
          >
            {mode === 'register'
              ? 'Join Your Community'
              : 'Welcome Back'}
          </Text>
          <Text
            size="sm"
            className="text-white"
            style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}
          >
            {mode === 'register'
              ? 'Create your account and start discovering local events, joining clubs, and connecting with people who share your passions.'
              : 'Discover local events, join clubs, and connect with your community. Your next great experience is just a sign-in away.'}
          </Text>
        </div>
      </div>

      {/* ── Right Panel: Form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#f5f5f5]">
        <Container size={420} p={0}>
          {/* Mobile-only brand block */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <BrandLogo size={40} />
            <div className="flex flex-col leading-tight">
              <Text fw={700} size="sm" className="text-gray-900 tracking-wide">
                CohortLink
              </Text>
              <Text
                size="xs"
                className="tracking-widest font-semibold"
                style={{ fontSize: '9px', color: '#2563eb' }}
              >
                ACTIVE INCLUSION
              </Text>
            </div>
          </div>

          {/* Heading */}
          <Text
            fw={800}
            size="xl"
            className="text-gray-900 mb-1"
            style={{ letterSpacing: '-0.3px' }}
          >
            {mode === 'register' ? 'Create an account' : 'Sign in to CohortLink'}
          </Text>
          <Text size="sm" className="text-gray-500 mb-6" style={{ lineHeight: 1.5 }}>
            {mode === 'register'
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Anchor
              size="sm"
              fw={600}
              style={{ color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }}
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                form.reset();
              }}
            >
              {mode === 'register' ? 'Sign in' : 'Sign up'}
            </Anchor>
          </Text>

          {/* Error alert */}
          {error && (
            <Alert
              color="red"
              variant="light"
              radius="md"
              mb="md"
              style={{ fontSize: '13px' }}
            >
              {error}
            </Alert>
          )}

          {/* Google button */}
          <Button
            fullWidth
            size="md"
            radius="md"
            variant="default"
            leftSection={<GoogleIcon size={18} />}
            onClick={handleGoogle}
            disabled={submitting}
            className="mb-4 transition-transform duration-200 hover:scale-[1.01]"
            styles={{
              root: {
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#374151',
                fontWeight: 600,
                fontSize: '14px',
                height: '44px',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  borderColor: '#d1d5db',
                },
              },
            }}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <Divider
            label="or continue with email"
            labelPosition="center"
            my="md"
            styles={{
              label: {
                fontSize: '12px',
                color: '#9ca3af',
                fontWeight: 500,
              },
              root: {
                borderColor: '#e5e7eb',
              },
            }}
          />

          {/* Form */}
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              {/* Name (register only) */}
              {mode === 'register' && (
                <TextInput
                  label="Full name"
                  placeholder="John Doe"
                  withAsterisk
                  {...form.getInputProps('name')}
                  styles={inputStyles}
                  size="md"
                />
              )}

              {/* Email */}
              <TextInput
                label="Email"
                placeholder="you@example.com"
                withAsterisk
                {...form.getInputProps('email')}
                styles={inputStyles}
                size="md"
              />

              {/* Password */}
              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                withAsterisk
                {...form.getInputProps('password')}
                styles={inputStyles}
                size="md"
              />

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                size="md"
                radius="md"
                disabled={submitting}
                className="mt-2 transition-transform duration-200 hover:scale-105 hover:opacity-90"
                styles={{
                  root: {
                    backgroundColor: '#1d4ed8',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    height: '44px',
                    boxShadow: '0 2px 8px rgba(37,99,235,.35)',
                    '&:hover': {
                      backgroundColor: '#1e40af',
                    },
                  },
                }}
              >
                {submitting ? (
                  <Loader size="sm" color="white" type="dots" />
                ) : mode === 'register' ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </Button>
            </Stack>
          </form>

          {/* Bottom note */}
          <Text
            size="xs"
            className="text-gray-400 text-center mt-6"
            style={{ lineHeight: 1.6 }}
          >
            By continuing, you agree to CohortLink's{' '}
            <Anchor size="xs" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Terms of Service
            </Anchor>{' '}
            and{' '}
            <Anchor size="xs" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Privacy Policy
            </Anchor>
            .
          </Text>
        </Container>
      </div>
    </div>
  );
}
