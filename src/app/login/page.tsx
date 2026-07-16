'use client';

import { useActionState } from 'react';
import { Lock } from 'lucide-react';
import { login, type LoginState } from '@/app/actions/auth';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(135deg,_#f9fff8_0%,_#fdfefe_100%)] px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto w-fit rounded-xl bg-emerald-100 p-3 text-emerald-700">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">LA FRUTA</h1>
          <p className="text-slate-600 mt-1 text-sm">Sign in to access the workspace.</p>
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
