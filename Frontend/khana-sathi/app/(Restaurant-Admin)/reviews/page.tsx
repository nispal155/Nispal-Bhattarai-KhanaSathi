'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, Send, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import { getMyRestaurant } from '@/lib/restaurantService';
import { getRestaurantReviews, respondToReview, type Review } from '@/lib/reviewService';
import toast from 'react-hot-toast';

export default function RestaurantReviewsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [restaurantId, setRestaurantId] = useState<string>('');
    const [restaurantName, setRestaurantName] = useState('');
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseText, setResponseText] = useState('');
    const [submittingResponse, setSubmittingResponse] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchRestaurantAndReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    useEffect(() => {
        if (restaurantId) {
            fetchReviews();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, restaurantId]);

    const fetchRestaurantAndReviews = async () => {
        try {
            const res = await getMyRestaurant();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resData = res?.data as any;
            const restaurant = resData?.data || resData;
            if (restaurant) {
                setRestaurantId(restaurant._id);
                setRestaurantName(restaurant.name);
                setAverageRating(restaurant.averageRating || 0);
            }
        } catch (err) {
            console.error('Error fetching restaurant:', err);
            toast.error('Failed to load restaurant');
        }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await getRestaurantReviews(restaurantId, { page, limit: 10, sort: '-createdAt' });
            const data = res?.data;
            if (data) {
                setReviews(data.data || []);
                setTotalReviews(data.total || 0);
                setTotalPages(data.pages || 1);
                // Build rating breakdown
                if (data.ratingBreakdown) {
                    const breakdown: Record<number, number> = {};
                    data.ratingBreakdown.forEach((item: { _id: number; count: number }) => {
                        breakdown[item._id] = item.count;
                    });
                    setRatingBreakdown(breakdown);
                }
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (reviewId: string) => {
        if (!responseText.trim()) return;
        try {
            setSubmittingResponse(true);
            await respondToReview(reviewId, responseText);
            toast.success('Response submitted');
            setRespondingTo(null);
            setResponseText('');
            fetchReviews();
        } catch (err) {
            console.error('Error responding:', err);
            toast.error('Failed to submit response');
        } finally {
            setSubmittingResponse(false);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <RestaurantSidebar />

            <main className="flex-1 p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">Customer Reviews</h1>
                        <p className="text-gray-500 mt-1">See what customers are saying about {restaurantName}</p>
                    </div>

                    {/* Rating Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className="text-center">
                                <p className="text-6xl font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                                <div className="flex justify-center my-2">{renderStars(Math.round(averageRating))}</div>
                                <p className="text-gray-500 text-sm">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex-1 w-full">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = ratingBreakdown[stars] || 0;
                                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-3 mb-2">
                                            <span className="text-sm text-gray-600 w-3">{stars}</span>
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-sm text-gray-400 w-8">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-orange-500" />
                            Reviews
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ThumbsUp className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-400 text-lg">No reviews yet</p>
                                <p className="text-gray-300 text-sm mt-1">Customer reviews will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review._id} className="p-5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                        {/* Customer & Rating */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {review.customer?.username || 'Customer'}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1">
                                                    {renderStars(review.overallRating)}
                                                    <span className="ml-1 text-sm font-medium text-gray-700">{review.overallRating}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sub-ratings */}
                                        <div className="flex flex-wrap gap-4 mb-3 text-sm">
                                            {review.restaurantRating && (
                                                <span className="text-gray-600">
                                                    Restaurant: <span className="text-yellow-500">{'★'.repeat(review.restaurantRating)}</span>
                                                </span>
                                            )}
                                            {review.foodRating && (
                                                <span className="text-gray-600">
                                                    Food: <span className="text-yellow-500">{'★'.repeat(review.foodRating)}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        {(review.restaurantReview || review.comment) && (
                                            <p className="text-gray-600 text-sm mb-3">
                                                {review.restaurantReview || review.comment}
                                            </p>
                                        )}

                                        {/* Existing Response */}
                                        {review.response?.text && (
                                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-3">
                                                <p className="text-xs text-orange-600 font-medium mb-1">Your Response</p>
                                                <p className="text-sm text-gray-700">{review.response.text}</p>
                                            </div>
                                        )}

                                        {/* Respond Button / Form */}
                                        {!review.response?.text && (
                                            <>
                                                {respondingTo === review._id ? (
                                                    <div className="flex gap-2 mt-2">
                                                        <input
                                                            type="text"
                                                            value={responseText}
                                                            onChange={(e) => setResponseText(e.target.value)}
                                                            placeholder="Write your response..."
                                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                        <button
                                                            onClick={() => handleRespond(review._id)}
                                                            disabled={submittingResponse || !responseText.trim()}
                                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setRespondingTo(null); setResponseText(''); }}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRespondingTo(review._id)}
                                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                                    >
                                                        Reply to review
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
