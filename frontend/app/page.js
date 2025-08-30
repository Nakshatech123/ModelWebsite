// app/page.js
import Link from 'next/link';
import styles from './globals.css';

export default function HomePage() {
  return (
    <main style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Your Application</h1>
      <p>Please log in or register to access the dashboard.</p>
      <div style={{ marginTop: '20px' }}>
        <Link href="/login">
          <button style={{ marginRight: '10px' }}>Login</button>
        </Link>
        <Link href="/register">
          <button>Register</button>
        </Link>
      </div>
    </main>
  );
}