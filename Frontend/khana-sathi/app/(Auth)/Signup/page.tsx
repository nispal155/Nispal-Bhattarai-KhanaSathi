// app/signup/page.tsx 
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/authService';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
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

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeTerms) {
      toast.error('Please agree to terms & conditions');
      return;
    }

    setIsLoading(true);

    const result = await register(formData.name, formData.email, formData.password);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success('Registration successful! Please verify your email.');
    // Store email for OTP verification
    localStorage.setItem('pendingVerificationEmail', formData.email);
    router.push('/verify-otp');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Burger Image */}
      <div className="relative w-full lg:w-1/2 h-64 lg:h-screen bg-red-600 overflow-hidden">
        <Image
          src="/burger.png"
          alt="Delicious Burger"
          fill
          priority
          className="object-contain object-center scale-75"
        />
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
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

          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Create account
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 
             text-black placeholder-gray-500 
             focus:outline-none focus:border-orange-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 
                  text-black placeholder-gray-500 
                  focus:outline-none focus:border-orange-500"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <label htmlFor="terms" className="text-gray-600 cursor-pointer">
                I agree terms & conditions
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold py-4 rounded-lg transition duration-200 shadow-md"
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:underline">
              Log in Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}