'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.ok) {
      window.location.href = '/';
    } else {
      setError('認証に失敗しました');
    }
  }

  return (
    <main>
      <h1>ログイン</h1>
      <form onSubmit={onSubmit} aria-describedby={error ? 'login-error' : undefined}>
        <label htmlFor="email">メールアドレス</label>
        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">パスワード</label>
        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && (
          <div id="login-error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        <button type="submit">ログイン</button>
      </form>
    </main>
  );
}


