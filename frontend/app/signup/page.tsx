"use client"
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'buyer' });
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/signup', form);
      alert("Account created! Please login.");
      router.push('/login');
    } catch (err) {
      alert("Signup failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSignup} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Create Account</h2>
        <input type="text" placeholder="Full Name" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setForm({...form, full_name: e.target.value})} required />
        <input type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setForm({...form, email: e.target.value})} required />
        <input type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setForm({...form, password: e.target.value})} required />
        
        <select className="w-full p-2 mb-6 border rounded" 
          onChange={(e) => setForm({...form, role: e.target.value})}>
          <option value="buyer">I am a Buyer</option>
          <option value="seller">I am a Seller</option>
        </select>

        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Sign Up
        </button>
      </form>
    </div>
  );
}