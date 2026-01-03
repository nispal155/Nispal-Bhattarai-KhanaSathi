// app/login/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login as loginApi } from '@/lib/authService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    const result = await loginApi(formData.email, formData.password);

    if (result.error) {
      // Check if user needs to verify email
      if (result.error.toLowerCase().includes('verify')) {
        toast.error('Please verify your email first');
        localStorage.setItem('pendingVerificationEmail', formData.email);
        router.push('/verify-otp');
        return;
      }
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result.data) {
      toast.success('Login successful!');
      login(
        { _id: result.data._id, username: result.data.username, email: result.data.email },
        result.data.token
      );
      console.log(result);
      if (result.data.role === 'admin') {
        router.push('/admin-dashboard')
        console.log(result.data.role)
      } else if (result.data.role === 'delivery_staff') {
        if (!result.data.isProfileComplete) {
          router.push('/onboarding');
        } else {
          router.push('/rider-dashboard');
        }
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side – Burger Image */}
      <div className="relative w-full lg:w-1/2 h-64 lg:h-screen bg-red-600 overflow-hidden">
        <Image
          src="/burger.png"
          alt="Delicious Burger"
          fill
          priority
          className="object-contain object-center scale-75"
        />
      </div>

      {/* Right Side – Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-29 h-29">
              <Image
                src="/logo.png"
                alt="KhanaSathi Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-yellow-500 text-center mb-8">Login</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-5 py-4 bg-gray-100 text-black placeholder-gray-500 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-gray-100 text-black placeholder-gray-500 rounded-lg 
             focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-5 h-5 text-yellow-500 rounded"
                />
                <span className="text-gray-700">Remember Me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold text-xl py-4 rounded-lg transition duration-200 shadow-md"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Links */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-gray-600">
              <Link href="/forgot-password" className="text-gray-500 hover:text-yellow-600 font-medium">
                Forgot password?
              </Link>
            </p>
            <p className="text-gray-700">
              Don&apos;t have an account?{' '}
              <Link href="/Signup" className="text-orange-600 font-bold hover:underline">
                Sign up Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}