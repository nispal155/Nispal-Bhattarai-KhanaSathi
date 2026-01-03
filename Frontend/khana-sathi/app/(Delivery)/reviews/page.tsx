'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Star,
    ThumbsUp,
    MessageSquare,
    Loader2
} from 'lucide-react';

export default function ReviewsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        setTimeout(() => {
            setReviews([]);
            setLoading(false);
        }, 500);
    }, [user, router, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/rider-dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Customer Reviews</h1>
                        <p className="text-gray-500">See what customers are saying</p>
                    </div>
                </div>

                {/* Rating Summary */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-6xl font-bold text-gray-800">5.0</p>
                            <div className="flex text-yellow-400 text-xl my-2 justify-center">★★★★★</div>
                            <p className="text-gray-500 text-sm">0 reviews</p>
                        </div>
                        <div className="flex-1">
                            {[5, 4, 3, 2, 1].map((stars) => (
                                <div key={stars} className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-gray-600 w-3">{stars}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: stars === 5 ? '0%' : '0%' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-400 w-8">0</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        Recent Reviews
                    </h3>

                    {reviews.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ThumbsUp className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No reviews yet</p>
                            <p className="text-gray-300 text-sm mt-1">Customer reviews will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review, index) => (
                                <div key={index} className="p-4 border border-gray-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-800">{review.customer}</p>
                                        <div className="flex text-yellow-400 text-sm">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                    <p className="text-gray-400 text-xs mt-2">{review.date}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
