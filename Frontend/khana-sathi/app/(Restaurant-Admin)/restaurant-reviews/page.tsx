'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, Send, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
    }, [user, authLoading]);

    useEffect(() => {
        if (restaurantId) {
            fetchReviews();
        }
    }, [page, restaurantId]);

    const fetchRestaurantAndReviews = async () => {
        try {
            const res = await getMyRestaurant();
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

    const renderStars = (rating: number, size = "w-4 h-4") => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
            ))}
        </div>
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Customer Feedback</h1>
                    <p className="text-gray-500">Monitor and respond to customer reviews for {restaurantName}</p>
                </div>

                {/* Dashboard / Summary */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    {/* Overall Score */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Score</p>
                        <div className="relative mb-2">
                            <p className="text-7xl font-black text-gray-800 leading-none">{averageRating.toFixed(1)}</p>
                            <Star className="absolute -top-1 -right-4 w-6 h-6 text-yellow-500 fill-yellow-400" />
                        </div>
                        <div className="mb-2">{renderStars(Math.round(averageRating), "w-5 h-5")}</div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Based on {totalReviews} reviews</p>
                    </div>

                    {/* Breakdown */}
                    <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Rating Breakdown</p>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = ratingBreakdown[stars] || 0;
                                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                return (
                                    <div key={stars} className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 w-8">
                                            <span className="text-sm font-bold text-gray-600">{stars}</span>
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        </div>
                                        <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 w-10 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-orange-500" />
                            Recent Comments
                        </h3>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Showing Page {page}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 bg-white rounded-3xl border border-gray-100">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ThumbsUp className="w-10 h-10 text-gray-200" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 mb-1">No Reviews Found</h4>
                            <p className="text-gray-400 text-sm">Customers haven't left any feedback yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reviews.map((review) => (
                                <div key={review._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:border-orange-200 transition duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-black text-gray-400 border border-gray-200/50">
                                                {review.customer?.username?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{review.customer?.username || 'Verified Customer'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-xl border border-yellow-100/50">
                                            {renderStars(review.overallRating, "w-3.5 h-3.5")}
                                            <span className="text-sm font-black text-yellow-600 ml-1">{review.overallRating}</span>
                                        </div>
                                    </div>

                                    {/* Ratings Breakout */}
                                    <div className="flex flex-wrap gap-4 mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                                        {review.restaurantRating && (
                                            <div className="flex items-center gap-1">Service: <span className="text-yellow-600">{'★'.repeat(review.restaurantRating)}</span></div>
                                        )}
                                        {review.foodRating && (
                                            <div className="flex items-center gap-1">Quality: <span className="text-yellow-600">{'★'.repeat(review.foodRating)}</span></div>
                                        )}
                                    </div>

                                    {(review.restaurantReview || review.comment) && (
                                        <p className="text-gray-700 text-sm leading-relaxed mb-6 px-1 italic">
                                            "{review.restaurantReview || review.comment}"
                                        </p>
                                    )}

                                    {/* Response Section */}
                                    {review.response?.text ? (
                                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Restaurant Response</p>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium">{review.response.text}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            {respondingTo === review._id ? (
                                                <div className="space-y-3 p-4 bg-orange-50/30 rounded-2xl border border-orange-100">
                                                    <textarea
                                                        value={responseText}
                                                        onChange={(e) => setResponseText(e.target.value)}
                                                        placeholder="Type your response to the customer..."
                                                        className="w-full px-4 py-3 bg-white border border-orange-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => { setRespondingTo(null); setResponseText(''); }}
                                                            className="px-4 py-2 text-xs font-bold text-gray-400 uppercase hover:text-gray-600 transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleRespond(review._id)}
                                                            disabled={submittingResponse || !responseText.trim()}
                                                            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition shadow-md"
                                                        >
                                                            {submittingResponse ? 'Sending...' : 'Post Response'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setRespondingTo(review._id)}
                                                    className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest hover:text-orange-700 transition px-1"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Reply to customer
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-6 mt-10">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-500 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                PAGE {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-orange-600 hover:border-orange-500 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
