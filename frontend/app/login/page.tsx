"use client"
import { useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/users/login', formData);
      // In a real app, you'd fetch user profile here. For now, we save token.
      setAuth({ email }, res.data.access_token);
      router.push('/');
    } catch (err) {
      alert("Login failed. Check credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Login</h2>
        <input 
          type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setEmail(e.target.value)} required
        />
        <input 
          type="password" placeholder="Password" className="w-full p-2 mb-6 border rounded"
          onChange={(e) => setPassword(e.target.value)} required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Login
        </button>
        <p className="mt-4 text-sm text-center">
          Don't have an account? <Link href="/signup" className="text-blue-600">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}