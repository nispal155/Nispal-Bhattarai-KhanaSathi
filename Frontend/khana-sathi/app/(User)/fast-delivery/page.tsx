'use client';

import { Truck, Zap, MapPin, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FastDeliveryPage() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get your food delivered in 15-30 minutes from participating restaurants',
    },
    {
      icon: MapPin,
      title: 'Wide Coverage',
      description: 'Fast delivery available across all major cities in Nepal',
    },
    {
      icon: Truck,
      title: 'Professional Riders',
      description: 'Our trained and verified delivery partners ensure safe and timely delivery',
    },
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'Track your order in real-time and know exactly when it arrives',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Search Restaurants',
      description: 'Browse restaurants offering fast delivery in your area',
    },
    {
      step: 2,
      title: 'Place Your Order',
      description: 'Select your favorite dishes and proceed to checkout',
    },
    {
      step: 3,
      title: 'Pay Securely',
      description: 'Choose from multiple payment options - Cash, eSewa, or Khalti',
    },
    {
      step: 4,
      title: 'Track & Enjoy',
      description: 'Track your order in real-time and enjoy delicious food at your doorstep',
    },
  ];

  const faq = [
    {
      question: 'How fast is fast delivery?',
      answer: 'Our fast delivery partners aim to deliver your order within 15-30 minutes from the restaurant. Delivery time may vary based on location, traffic, and order complexity.',
    },
    {
      question: 'Is fast delivery available in my area?',
      answer: 'Fast delivery is available in all major cities. Check the "Fast Delivery" section on our app to see if it\'s available in your location.',
    },
    {
      question: 'What\'s the delivery charge for fast delivery?',
      answer: 'Delivery charges vary by location and distance. You\'ll see the exact charge during checkout before placing your order.',
    },
    {
      question: 'What if my order is late?',
      answer: 'We have a strict quality assurance process. If your order is significantly delayed, contact our support team for assistance.',
    },
    {
      question: 'Can I schedule delivery in advance?',
      answer: 'Yes! You can schedule deliveries up to 7 days in advance. Select your preferred delivery time during checkout.',
    },
    {
      question: 'Are contactless deliveries available?',
      answer: 'Absolutely! You can request contactless delivery during checkout, and our rider will leave your order at a safe location.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f0] to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="h-8 w-8 text-[#d62828]" />
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Fast Delivery</h1>
              <p className="text-[#6b7280]">Quick, reliable, and professional food delivery</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/nearest-restaurants"
            className="inline-flex items-center gap-2 rounded-full bg-[#d62828] px-8 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-[#bb1f1f]"
          >
            Order Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Features Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#111827] sm:text-3xl">
            Why Choose Fast Delivery?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-6 shadow-[0_25px_60px_rgba(16,24,40,0.12)] transition hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)]"
                >
                  <div className="mb-4 inline-block rounded-2xl bg-[#fff4ea] p-4">
                    <Icon className="h-6 w-6 text-[#d62828]" />
                  </div>
                  <h3 className="mb-2 font-bold text-[#111827]">{feature.title}</h3>
                  <p className="text-sm text-[#6b7280]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#111827] sm:text-3xl">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < howItWorks.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-16 w-1 -translate-x-1/2 bg-gradient-to-b from-[#d62828] to-transparent lg:block" />
                )}

                {/* Card */}
                <div className="rounded-2xl bg-white p-6 shadow-[0_25px_60px_rgba(16,24,40,0.12)] text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#d62828] text-xl font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-bold text-[#111827]">{item.title}</h3>
                  <p className="text-sm text-[#6b7280]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Benefits Section */}
        <div className="mb-16 rounded-3xl bg-gradient-to-r from-[#d62828] to-[#bb1f1f] p-8 text-white sm:p-12">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Key Benefits</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Quick Orders', desc: '15-30 min delivery time' },
              { title: 'Affordable', desc: 'Competitive delivery charges' },
              { title: 'Safe & Secure', desc: 'Temperature-controlled bags' },
              { title: 'Verified Riders', desc: 'Trained & background-checked' },
              { title: 'Real-Time Tracking', desc: 'Know exactly where your order is' },
              { title: 'Customer Support', desc: '24/7 assistance available' },
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">{benefit.title}</p>
                  <p className="text-sm text-white/80">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#111827] sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faq.map((item, index) => (
              <details
                key={index}
                className="group cursor-pointer rounded-2xl bg-white p-6 shadow-[0_25px_60px_rgba(16,24,40,0.12)] transition hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)]"
              >
                <summary className="flex items-center justify-between font-bold text-[#111827]">
                  <span>{item.question}</span>
                  <AlertCircle className="h-5 w-5 text-[#d62828] transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-[#6b7280]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl bg-[#fff4ea] p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold text-[#111827] sm:text-3xl">
            Ready for Fast Delivery?
          </h2>
          <p className="mb-8 text-[#6b7280]">
            Browse restaurants near you and enjoy delicious food delivered quickly to your doorstep
          </p>
          <Link
            href="/nearest-restaurants"
            className="inline-flex items-center gap-2 rounded-full bg-[#d62828] px-8 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:bg-[#bb1f1f]"
          >
            Explore Restaurants
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
