'use client';

import { useUser } from '@auth0/nextjs-auth0';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const { user } = useUser();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/logo.png" alt="Logo" height={40} width={40} style={{ marginRight: '0.5rem' }} />
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Autothreat</h1>
        </div>
        <div>
          {user ? (
            <Link href="/dashboard">
              <button style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Dashboard</button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <button style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Login</button>
            </Link>
          )}
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Welcome to the Autothreat Platform</h2>
      </main>
    </div>
  );
}
