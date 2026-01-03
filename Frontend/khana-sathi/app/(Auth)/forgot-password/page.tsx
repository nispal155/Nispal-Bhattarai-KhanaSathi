// app/forgot-password/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword, resetPassword } from '@/lib/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasted.padEnd(6, '').split('').slice(0, 6);
    setOtp(newOtp);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    const result = await forgotPassword(email);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success('OTP sent to your email!');
    setStep('reset');
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(email, otpString, newPassword);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success('Password reset successful!');
    setTimeout(() => router.push('/login'), 1500);
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
          className="object-contain object-center scale-60"
        />
      </div>

      {/* Right Side – Forgot Password Form */}
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

          {/* Title */}
          <h2 className="text-3xl font-bold text-yellow-500 text-center mb-6">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h2>

          {step === 'email' ? (
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 bg-gray-100 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold text-xl py-4 rounded-lg transition duration-200 shadow-md"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Enter OTP
                </label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      ref={(el) => { inputs.current[index] = el; }}
                      className="w-12 h-12 text-2xl font-bold text-center border-2 text-black border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200 transition"
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-100 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-100 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold text-xl py-4 rounded-lg transition duration-200 shadow-md"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center mt-8">
            <Link
              href="/login"
              className="text-gray-600 hover:text-orange-600 font-medium transition"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}