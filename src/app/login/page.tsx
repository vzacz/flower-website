'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { login, type LoginState } from '@/app/actions/auth';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(135deg,_#f9fff8_0%,_#fdfefe_100%)] px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center">
          {/* The mark already reads "LA FRUTA", so the heading it replaces is
              kept for screen readers rather than printed twice. */}
          <Image
            src="/la-fruta-logo.png"
            alt=""
            width={1254}
            height={1254}
            priority
            sizes="128px"
            className="mx-auto h-32 w-32 rounded-full object-cover shadow-sm ring-1 ring-emerald-900/10"
          />
          <h1 className="sr-only">LA FRUTA</h1>
          <p className="text-slate-600 mt-4 text-sm">Sign in to access the workspace.</p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="input w-full"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
