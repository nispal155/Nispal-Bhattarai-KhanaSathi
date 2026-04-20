'use client';

import { Gift, Tag, Clock, DollarSign, Loader, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getActivePromoCodes, type PromoCode } from '@/lib/promoService';

export default function OffersPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'fixed'>('all');

  useEffect(() => {
    const loadPromos = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch all active promo codes available to users (without login)
        const response = await getActivePromoCodes();
        const promoData = response.data?.data || [];
        setPromos(promoData);
      } catch (err) {
        console.error('Failed to load offers:', err);
        setError('Unable to load offers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPromos();
  }, []);

  // Filter promos by discount type
  const filteredPromos = promos.filter((promo) => {
    if (filterType === 'all') return true;
    return promo.discountType === filterType;
  });

  // Check if promo is still valid
  const isPromoValid = (promo: PromoCode): boolean => {
    const now = new Date();
    const validUntil = new Date(promo.validUntil);
    return now <= validUntil && promo.isActive && (!promo.usageLimit || promo.usedCount < promo.usageLimit);
  };

  // Format discount display
  const formatDiscount = (promo: PromoCode): string => {
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}%`;
    }
    return `Rs. ${promo.discountValue}`;
  };

  // Format expiry date
  const formatExpiryDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f0] to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="h-8 w-8 text-[#d62828]" />
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Best Offers</h1>
              <p className="text-[#6b7280]">Explore amazing coupon codes and discounts</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-full px-6 py-2 font-semibold transition ${
                filterType === 'all'
                  ? 'bg-[#d62828] text-white'
                  : 'bg-[#f0f0f0] text-[#374151] hover:bg-[#e8e8e8]'
              }`}
            >
              All Offers
            </button>
            <button
              onClick={() => setFilterType('percentage')}
              className={`rounded-full px-6 py-2 font-semibold transition ${
                filterType === 'percentage'
                  ? 'bg-[#d62828] text-white'
                  : 'bg-[#f0f0f0] text-[#374151] hover:bg-[#e8e8e8]'
              }`}
            >
              Percentage Off
            </button>
            <button
              onClick={() => setFilterType('fixed')}
              className={`rounded-full px-6 py-2 font-semibold transition ${
                filterType === 'fixed'
                  ? 'bg-[#d62828] text-white'
                  : 'bg-[#f0f0f0] text-[#374151] hover:bg-[#e8e8e8]'
              }`}
            >
              Fixed Discount
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* About Offers Section */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-[0_25px_60px_rgba(16,24,40,0.12)]">
            <h2 className="text-2xl font-bold text-[#111827] mb-4">About Our Offers</h2>
            <p className="text-[#6b7280] leading-relaxed">
              KhanaSathi brings you the best deals and exclusive discounts on your favorite restaurant orders. 
              Our offers are carefully curated to help you save money while enjoying delicious food. Whether 
              you're looking for percentage discounts or fixed rupee off deals, we have something for everyone!
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#fff4ea] to-[#ffe8d6] p-8">
            <h3 className="text-2xl font-bold text-[#d62828] mb-4">Why Choose Our Offers?</h3>
            <ul className="space-y-3 text-[#6b7280]">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d62828] text-xs font-bold text-white">✓</span>
                <span><strong>No Hidden Charges</strong> - What you see is what you save</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d62828] text-xs font-bold text-white">✓</span>
                <span><strong>Updated Regularly</strong> - New discounts added frequently</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d62828] text-xs font-bold text-white">✓</span>
                <span><strong>Easy to Apply</strong> - Simple coupon code entry at checkout</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d62828] text-xs font-bold text-white">✓</span>
                <span><strong>Works Everywhere</strong> - Valid across all partner restaurants</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Types of Offers Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#111827] sm:text-3xl">
            Types of Offers Available
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Percentage Discounts",
                description: "Save a percentage of your total order. Perfect for larger orders!",
                example: "20% OFF on orders above Rs. 500",
                icon: "📊"
              },
              {
                title: "Fixed Amount Off",
                description: "Get a fixed rupee amount off your order, regardless of price.",
                example: "Rs. 100 OFF on any order",
                icon: "💰"
              },
              {
                title: "Seasonal Offers",
                description: "Special discounts during festivals and special occasions.",
                example: "Diwali Special - Up to 50% OFF",
                icon: "🎉"
              }
            ].map((offer, index) => (
              <div key={index} className="rounded-2xl bg-white p-6 shadow-[0_25px_60px_rgba(16,24,40,0.12)] hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)] transition">
                <div className="text-4xl mb-3">{offer.icon}</div>
                <h3 className="text-lg font-bold text-[#111827] mb-2">{offer.title}</h3>
                <p className="text-sm text-[#6b7280] mb-3">{offer.description}</p>
                <p className="text-sm font-semibold text-[#d62828]">{offer.example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="h-12 w-12 animate-spin text-[#d62828]" />
            <p className="mt-4 text-[#6b7280]">Loading offers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg bg-red-50 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPromos.length === 0 && !error && (
          <div className="rounded-lg bg-[#fff4ea] p-12 text-center">
            <Tag className="mx-auto h-12 w-12 text-[#d62828]" />
            <p className="mt-4 text-lg text-[#6b7280]">No offers available right now</p>
          </div>
        )}

        {/* Promos Grid */}
        {!isLoading && filteredPromos.length > 0 && (
          <div>
            <p className="mb-8 text-[#6b7280]">
              Found <span className="font-bold text-[#111827]">{filteredPromos.length}</span> amazing
              {filterType !== 'all' && ` ${filterType}`} offers
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPromos.map((promo) => {
                const isValid = isPromoValid(promo);
                const daysLeft = Math.ceil(
                  (new Date(promo.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={promo._id}
                    className={`rounded-2xl p-6 transition ${
                      isValid
                        ? 'bg-white shadow-[0_25px_60px_rgba(16,24,40,0.12)] hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)]'
                        : 'bg-gray-100 opacity-60'
                    }`}
                  >
                    {/* Badge */}
                    {!isValid && (
                      <div className="absolute right-4 top-4 rounded-lg bg-gray-400 px-3 py-1 text-sm font-bold text-white">
                        Expired
                      </div>
                    )}

                    {/* Discount Display */}
                    <div className="mb-4 flex items-center gap-4">
                      <div className="rounded-2xl bg-[#fff4ea] p-4">
                        <DollarSign className="h-8 w-8 text-[#d62828]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#6b7280]">Discount</p>
                        <p className="text-2xl font-bold text-[#d62828]">{formatDiscount(promo)}</p>
                      </div>
                    </div>

                    {/* Code */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase text-[#6b7280]">Coupon Code</p>
                      <p className="mt-2 break-all rounded-lg bg-[#f3f4f6] px-4 py-3 font-mono text-lg font-bold text-[#111827]">
                        {promo.code}
                      </p>
                    </div>

                    {/* Description */}
                    {promo.description && (
                      <p className="mb-4 text-sm text-[#6b7280]">{promo.description}</p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 border-t border-[#e5e7eb] pt-4 text-sm">
                      {promo.minOrderAmount && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">Min Order:</span>
                          <span className="font-semibold text-[#111827]">
                            Rs. {promo.minOrderAmount}
                          </span>
                        </div>
                      )}

                      {promo.maxDiscount && promo.discountType === 'percentage' && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">Max Discount:</span>
                          <span className="font-semibold text-[#111827]">
                            Rs. {promo.maxDiscount}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[#6b7280]">
                          <Clock className="h-4 w-4" />
                          Expires
                        </span>
                        <span
                          className={`font-semibold ${
                            daysLeft <= 2 ? 'text-red-600' : 'text-[#111827]'
                          }`}
                        >
                          {daysLeft > 0 ? `${daysLeft} days` : 'Today'}
                        </span>
                      </div>

                      {promo.usageLimit && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">Uses Left:</span>
                          <span className="font-semibold text-[#111827]">
                            {promo.usageLimit - promo.usedCount} of {promo.usageLimit}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Usage Note */}
                    {isValid && (
                      <p className="mt-4 rounded-lg bg-green-50 p-3 text-center text-xs font-semibold text-green-700">
                        ✓ Valid - Apply at checkout
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-12 rounded-2xl border-2 border-[#d62828] bg-[#fff5f0] p-6">
              <p className="font-semibold text-[#111827]">💡 How to use these offers:</p>
              <ol className="mt-3 space-y-2 text-[#6b7280]">
                <li>1. Add items to your cart</li>
                <li>2. Go to checkout</li>
                <li>3. Enter the coupon code in the "Promo Code" field</li>
                <li>4. Click "Apply" to see your discount</li>
                <li>5. Complete your order and enjoy savings!</li>
              </ol>
            </div>

            {/* Tips Section */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-blue-50 p-6 border border-blue-200">
                <p className="font-semibold text-blue-900 mb-3">🎯 Pro Tips for Maximum Savings</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Stack offers with loyalty rewards for bigger savings</li>
                  <li>• Check expiry dates before applying codes</li>
                  <li>• Use percentage discounts on large orders</li>
                  <li>• Follow us for flash sales and limited-time offers</li>
                  <li>• First-time users often get exclusive welcome discounts</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-green-50 p-6 border border-green-200">
                <p className="font-semibold text-green-900 mb-3">📱 Download Our App</p>
                <p className="text-sm text-green-800 mb-3">
                  Get even better deals on the KhanaSathi mobile app with exclusive app-only offers and faster checkout!
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition">
                    iOS App
                  </button>
                  <button className="flex-1 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition">
                    Android App
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
