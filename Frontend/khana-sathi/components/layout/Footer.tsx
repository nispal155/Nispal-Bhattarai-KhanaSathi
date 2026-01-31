import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xl">🍜</span>
                            </div>
                            <span className="text-red-500 font-bold text-xl">Khana Sathi</span>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Bringing your favorite local flavors right to your doorstep. Fast, fresh, and reliable food delivery service.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-900 font-semibold text-lg mb-6">Company</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="/team" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Our Team
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Legal */}
                    <div>
                        <h3 className="text-gray-900 font-semibold text-lg mb-6">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/support" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Help & Support
                                </Link>
                            </li>
                            <li>
                                <Link href="/partner" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Partner with us
                                </Link>
                            </li>
                            <li>
                                <Link href="/ride" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Ride with us
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-500 hover:text-red-500 hover:pl-2 transition-all duration-300">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Get in Touch */}
                    <div>
                        <h3 className="text-gray-900 font-semibold text-lg mb-6">Get in Touch</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                                <span className="text-gray-500 text-sm">
                                    Kathmandu, Nepal
                                    <br />
                                    Bagmati Province, 44600
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-red-500" />
                                <span className="text-gray-500 text-sm">+977 1-4XXXXXX</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-red-500" />
                                <span className="text-gray-500 text-sm">support@khanasathi.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Khana Sathi. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
