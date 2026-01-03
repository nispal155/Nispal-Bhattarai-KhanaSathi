// app/verify-otp/page.tsx
'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOTP, resendOTP } from '@/lib/authService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyOTPPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/Signup');
    }
  }, [router]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasted.padEnd(6, '').split('').slice(0, 6);
    setOtp(newOtp);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    const result = await verifyOTP(email, otpString);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result.data) {
      // Clear pending email
      localStorage.removeItem('pendingVerificationEmail');

      toast.success('Email verified successfully!');

      // Auto-login after verification
      login(
        { _id: result.data._id, username: result.data.username, email: result.data.email },
        result.data.token
      );

      if (result.data.role === 'delivery_staff') {
        if (!result.data.isProfileComplete) {
          router.push('/onboarding');
        } else {
          router.push('/rider-dashboard');
        }
      } else if (result.data.role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/');
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    const result = await resendOTP(email);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('OTP resent successfully!');
      setOtp(['', '', '', '', '', '']);
    }

    setIsResending(false);
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

      {/* Right Side – OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md space-y-12">
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
          <h2 className="text-center text-4xl font-bold text-yellow-500">
            Verify OTP
          </h2>

          {email && (
            <p className="text-center text-gray-600 -mt-8">
              Enter the code sent to <span className="font-medium">{email}</span>
            </p>
          )}

          {/* 6-Digit OTP Boxes */}
          <div className="flex justify-center gap-4" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => { inputs.current[index] = el; }}
                className="w-16 h-16 text-3xl font-bold text-center border-2 text-black border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all duration-200"
                inputMode="numeric"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold text-2xl py-5 rounded-xl transition duration-200 shadow-lg transform hover:scale-105"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-gray-600">
              Didn&apos;t receive code?{' '}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-orange-600 font-bold hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}