'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getContent, updateContent, ContentData } from '@/lib/contentService';
import toast from 'react-hot-toast';
import { Save, FileText, HelpCircle, Shield, Info, Loader2 } from 'lucide-react';

const SLUGS = [
    { id: 'faq', name: 'Frequently Asked Questions', icon: HelpCircle },
    { id: 'terms', name: 'Terms of Service', icon: FileText },
    { id: 'privacy', name: 'Privacy Policy', icon: Shield },
    { id: 'about', name: 'About Us', icon: Info },
    { id: 'contact', name: 'Contact Information', icon: FileText }
];

export default function ContentManagementPage() {
    const [selectedSlug, setSelectedSlug] = useState('faq');
    const [data, setData] = useState<ContentData>({ slug: 'faq', title: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContent();
    }, [selectedSlug]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const resp = await getContent(selectedSlug);
            if (resp.data?.data) {
                setData(resp.data.data);
            } else {
                setData({ slug: selectedSlug, title: '', content: '' });
            }
        } catch (error) {
            console.error("Fetch content error:", error);
            setData({ slug: selectedSlug, title: '', content: '' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateContent(selectedSlug, { title: data.title, content: data.content });
            toast.success('Content updated successfully!');
        } catch (error) {
            toast.error('Failed to update content');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Content Management</h2>
                    <p className="text-gray-500 mt-2">Manage static pages and documents of the application</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar for Navigation */}
                    <div className="lg:col-span-1 space-y-2">
                        {SLUGS.map((slug) => {
                            const Icon = slug.icon;
                            return (
                                <button
                                    key={slug.id}
                                    onClick={() => setSelectedSlug(slug.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${selectedSlug === slug.id
                                        ? 'bg-red-500 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {slug.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form Area */}
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                                <p className="text-gray-400 mt-4">Loading content...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Page Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData({ ...data, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                                        placeholder="Enter page title..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Content (Markdown supported)</label>
                                    <textarea
                                        value={data.content}
                                        onChange={(e) => setData({ ...data, content: e.target.value })}
                                        className="w-full h-96 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition font-mono text-sm"
                                        placeholder="Write your content here..."
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <p className="text-xs text-gray-400 italic">
                                        {data.updatedAt ? `Last updated: ${new Date(data.updatedAt).toLocaleString()}` : 'No previous version found'}
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
