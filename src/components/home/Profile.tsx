'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    EnvelopeIcon,
    AcademicCapIcon,
    HeartIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolidIcon, EnvelopeIcon as EnvelopeSolidIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Github, Linkedin, Pin } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';
import { useMessages } from '@/lib/i18n/useMessages';

// Custom ORCID icon component
const OrcidIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" />
    </svg>
);

interface ProfileProps {
    author: SiteConfig['author'];
    social: SiteConfig['social'];
    features: SiteConfig['features'];
    researchInterests?: string[];
}

export default function Profile({ author, social, features, researchInterests }: ProfileProps) {
    const messages = useMessages();

    const [hasLiked, setHasLiked] = useState(false);
    const [likeCount, setLikeCount] = useState<number | null>(null);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showThanks, setShowThanks] = useState(false);
    const [showAddress, setShowAddress] = useState(false);
    const [isAddressPinned, setIsAddressPinned] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [isEmailPinned, setIsEmailPinned] = useState(false);
    const [lastClickedTooltip, setLastClickedTooltip] = useState<'email' | 'address' | null>(null);

    // Check local storage for user's like status
    useEffect(() => {
        if (!features.enable_likes) return;

        const localLikeKey = 'wei-wang-academic-homepage-liked';
        const visitorKey = 'wei-wang-academic-homepage-visitor-id';
        const localLikeState = localStorage.getItem(localLikeKey) === 'true';

        if (!features.likes_api_url) {
            setHasLiked(localLikeState);
            return;
        }

        let visitorId = localStorage.getItem(visitorKey);
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem(visitorKey, visitorId);
        }

        const controller = new AbortController();
        const apiUrl = features.likes_api_url.replace(/\/$/, '');

        fetch(`${apiUrl}/likes?page=homepage&visitor=${encodeURIComponent(visitorId)}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error('Unable to load like count.');
                return response.json() as Promise<{ count: number; liked: boolean }>;
            })
            .then((data) => {
                setLikeCount(data.count);
                setHasLiked(data.liked);
                if (data.liked) {
                    localStorage.setItem(localLikeKey, 'true');
                } else {
                    localStorage.removeItem(localLikeKey);
                }
            })
            .catch((error: Error) => {
                if (error.name !== 'AbortError') {
                    setHasLiked(localLikeState);
                }
            });

        return () => controller.abort();
    }, [features.enable_likes, features.likes_api_url]);

    const handleLike = async () => {
        const newLikedState = !hasLiked;
        const localLikeKey = 'wei-wang-academic-homepage-liked';

        if (!features.likes_api_url) {
            setHasLiked(newLikedState);
            if (newLikedState) {
                localStorage.setItem(localLikeKey, 'true');
                setShowThanks(true);
                setTimeout(() => setShowThanks(false), 2000);
            } else {
                localStorage.removeItem(localLikeKey);
                setShowThanks(false);
            }
            return;
        }

        const visitorKey = 'wei-wang-academic-homepage-visitor-id';
        let visitorId = localStorage.getItem(visitorKey);
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            localStorage.setItem(visitorKey, visitorId);
        }

        setIsLikeLoading(true);

        try {
            const apiUrl = features.likes_api_url.replace(/\/$/, '');
            const response = await fetch(`${apiUrl}/likes`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page: 'homepage',
                    visitorId,
                    liked: newLikedState,
                }),
            });

            if (!response.ok) throw new Error('Unable to update like count.');

            const data = await response.json() as { count: number; liked: boolean };
            setLikeCount(data.count);
            setHasLiked(data.liked);

            if (data.liked) {
                localStorage.setItem(localLikeKey, 'true');
                setShowThanks(true);
                setTimeout(() => setShowThanks(false), 2000);
            } else {
                localStorage.removeItem(localLikeKey);
                setShowThanks(false);
            }
        } catch {
            setShowThanks(false);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const socialLinks = [
        ...(social.email ? [{
            name: messages.profile.email,
            href: `mailto:${social.email}`,
            icon: EnvelopeIcon,
            isEmail: true,
        }] : []),
        ...(social.location || social.location_details ? [{
            name: messages.profile.location,
            href: social.location_url || '#',
            icon: MapPinIcon,
            isLocation: true,
        }] : []),
        ...(social.google_scholar ? [{
            name: 'Google Scholar',
            href: social.google_scholar,
            icon: AcademicCapIcon,
        }] : []),
        ...(social.orcid ? [{
            name: 'ORCID',
            href: social.orcid,
            icon: OrcidIcon,
        }] : []),
        ...(social.github ? [{
            name: 'GitHub',
            href: social.github,
            icon: Github,
        }] : []),
        ...(social.linkedin ? [{
            name: 'LinkedIn',
            href: social.linkedin,
            icon: Linkedin,
        }] : []),
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="sticky top-8"
        >
            {/* Profile Image */}
            <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Image
                    src={author.avatar}
                    alt={author.name}
                    width={256}
                    height={256}
                    className="w-full h-full object-cover object-center"
                    priority
                />
            </div>

            {/* Name and Title */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-serif font-bold text-primary mb-2">
                    {author.name}
                </h1>
                <p className="text-lg text-accent font-medium mb-1">
                    {author.title}
                </p>
                <p className="text-neutral-600 mb-2">
                    {author.institution}
                </p>
            </div>

            {/* Contact Links */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 relative px-2">
                {socialLinks.map((link) => {
                    const IconComponent = link.icon;
                    if (link.isLocation) {
                        return (
                            <div key={link.name} className="relative">
                                <button
                                    onMouseEnter={() => {
                                        if (!isAddressPinned) setShowAddress(true);
                                        setLastClickedTooltip('address');
                                    }}
                                    onMouseLeave={() => !isAddressPinned && setShowAddress(false)}
                                    onClick={() => {
                                        setIsAddressPinned(!isAddressPinned);
                                        setShowAddress(!isAddressPinned);
                                        setLastClickedTooltip('address');
                                    }}
                                    className={`p-2 sm:p-2 transition-colors duration-200 ${isAddressPinned
                                        ? 'text-accent'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'
                                        }`}
                                    aria-label={link.name}
                                >
                                    {isAddressPinned ? (
                                        <MapPinSolidIcon className="h-5 w-5" />
                                    ) : (
                                        <MapPinIcon className="h-5 w-5" />
                                    )}
                                </button>

                                {/* Address tooltip */}
                                <AnimatePresence>
                                    {(showAddress || isAddressPinned) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                            animate={{ opacity: 1, y: -10, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                            className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-neutral-800 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none sm:whitespace-nowrap ${lastClickedTooltip === 'address' ? 'z-20' : 'z-10'
                                                }`}
                                            onMouseEnter={() => {
                                                if (!isAddressPinned) setShowAddress(true);
                                                setLastClickedTooltip('address');
                                            }}
                                            onMouseLeave={() => !isAddressPinned && setShowAddress(false)}
                                        >
                                            <div className="text-center">
                                                <div className="flex items-center justify-center space-x-2 mb-1">
                                                    <p className="font-semibold">{messages.profile.workAddress}</p>
                                                    {!isAddressPinned && (
                                                        <div className="flex items-center space-x-0.5 text-xs text-neutral-400 opacity-60">
                                                            <Pin className="h-2.5 w-2.5" />
                                                            <span className="hidden sm:inline">{messages.profile.click}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {social.location_details?.map((line, i) => (
                                                    <p key={i} className="break-words">{line}</p>
                                                ))}
                                                <div className="mt-2 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-center">
                                                    {social.location_url && (
                                                        <a
                                                            href={social.location_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center space-x-2 bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 w-full sm:w-auto"
                                                        >
                                                            <MapPinIcon className="h-4 w-4" />
                                                            <span>{messages.profile.googleMap}</span>
                                                        </a>
                                                    )}
                                                </div>

                                            </div>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    }
                    if (link.isEmail) {
                        return (
                            <div key={link.name} className="relative">
                                <button
                                    onMouseEnter={() => {
                                        if (!isEmailPinned) setShowEmail(true);
                                        setLastClickedTooltip('email');
                                    }}
                                    onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                                    onClick={() => {
                                        setIsEmailPinned(!isEmailPinned);
                                        setShowEmail(!isEmailPinned);
                                        setLastClickedTooltip('email');
                                    }}
                                    className={`p-2 sm:p-2 transition-colors duration-200 ${isEmailPinned
                                        ? 'text-accent'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-accent'
                                        }`}
                                    aria-label={link.name}
                                >
                                    {isEmailPinned ? (
                                        <EnvelopeSolidIcon className="h-5 w-5" />
                                    ) : (
                                        <EnvelopeIcon className="h-5 w-5" />
                                    )}
                                </button>

                                {/* Email tooltip */}
                                <AnimatePresence>
                                    {(showEmail || isEmailPinned) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                            animate={{ opacity: 1, y: -10, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                                            className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-neutral-800 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none sm:whitespace-nowrap ${lastClickedTooltip === 'email' ? 'z-20' : 'z-10'
                                                }`}
                                            onMouseEnter={() => {
                                                if (!isEmailPinned) setShowEmail(true);
                                                setLastClickedTooltip('email');
                                            }}
                                            onMouseLeave={() => !isEmailPinned && setShowEmail(false)}
                                        >
                                            <div className="text-center">
                                                <div className="flex items-center justify-center space-x-2 mb-1">
                                                    <p className="font-semibold">{messages.profile.email}</p>
                                                    {!isEmailPinned && (
                                                        <div className="flex items-center space-x-0.5 text-xs text-neutral-400 opacity-60">
                                                            <Pin className="h-2.5 w-2.5" />
                                                            <span className="hidden sm:inline">{messages.profile.click}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="break-words">{social.email}</p>
                                                <div className="mt-2">
                                                    <a
                                                        href={link.href}
                                                        className="inline-flex items-center justify-center space-x-2 bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 w-full sm:w-auto"
                                                    >
                                                        <EnvelopeIcon className="h-4 w-4" />
                                                        <span className="sm:hidden">{messages.profile.send}</span>
                                                        <span className="hidden sm:inline">{messages.profile.sendEmail}</span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    }
                    return (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 sm:p-2 text-neutral-600 dark:text-neutral-400 hover:text-accent transition-colors duration-200"
                            aria-label={link.name}
                        >
                            <IconComponent className="h-5 w-5" />
                        </a>
                    );
                })}
            </div>

            {/* Research Interests */}
            {researchInterests && researchInterests.length > 0 && (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <h3 className="font-semibold text-primary mb-3">{messages.profile.researchInterests}</h3>
                    <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-500">
                        {researchInterests.map((interest, index) => (
                            <div key={index}>{interest}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Like Button */}
            {features.enable_likes && (
                <div className="relative">
                    <motion.button
                        onClick={handleLike}
                        disabled={isLikeLoading}
                        aria-pressed={hasLiked}
                        aria-label={hasLiked ? messages.profile.liked : messages.profile.like}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.985 }}
                        className={`group relative w-full overflow-hidden rounded-2xl border p-3.5 text-left shadow-sm transition-[border-color,box-shadow,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 dark:focus-visible:ring-offset-neutral-900 ${
                            hasLiked
                                ? 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-rose-100/70 dark:border-rose-800/50 dark:from-rose-950/35 dark:via-neutral-800 dark:to-amber-950/20'
                                : 'border-neutral-200 bg-gradient-to-br from-white via-white to-amber-50/70 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 dark:border-neutral-700 dark:from-neutral-800 dark:via-neutral-800 dark:to-amber-950/20 dark:hover:border-rose-800/60 dark:hover:shadow-none'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-rose-200/35 to-amber-200/25 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:from-rose-700/20 dark:to-amber-700/10"
                        />

                        <span className="relative flex items-center gap-3">
                            <span
                                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${
                                    hasLiked
                                        ? 'bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-rose-200 dark:shadow-none'
                                        : 'border border-rose-100 bg-white text-rose-500 group-hover:border-rose-200 group-hover:bg-rose-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-rose-400 dark:group-hover:border-rose-800 dark:group-hover:bg-rose-950/40'
                                }`}
                            >
                                <motion.span
                                    animate={hasLiked ? { scale: [1, 1.28, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.45, ease: 'easeOut' }}
                                >
                                    {hasLiked ? (
                                        <HeartSolidIcon className="h-5 w-5" />
                                    ) : (
                                        <HeartIcon className="h-5 w-5" />
                                    )}
                                </motion.span>

                                <AnimatePresence>
                                    {showThanks && (
                                        <motion.span
                                            aria-hidden="true"
                                            initial={{ opacity: 0.8, scale: 0.5 }}
                                            animate={{ opacity: 0, scale: 2 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.7, ease: 'easeOut' }}
                                            className="absolute inset-0 rounded-full border-2 border-rose-300"
                                        />
                                    )}
                                </AnimatePresence>
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold leading-5 text-primary">
                                    {hasLiked ? messages.profile.likedPrompt : messages.profile.likePrompt}
                                </span>
                                <span className="mt-0.5 block text-xs leading-4 text-neutral-500 dark:text-neutral-400">
                                    {hasLiked ? messages.profile.likedHint : messages.profile.likeHint}
                                </span>
                            </span>

                            <span
                                className="min-w-[4.25rem] shrink-0 rounded-xl border border-white/80 bg-white/80 px-2.5 py-2 text-center shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/70"
                                aria-live="polite"
                            >
                                <span className={`block text-lg font-bold leading-none tabular-nums ${hasLiked ? 'text-rose-600 dark:text-rose-400' : 'text-primary'}`}>
                                    {likeCount !== null ? likeCount.toLocaleString() : '—'}
                                </span>
                                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    {messages.profile.likeCountLabel}
                                </span>
                            </span>
                        </span>
                    </motion.button>

                    <AnimatePresence>
                        {showThanks && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                animate={{ opacity: 1, y: -8, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                                className="pointer-events-none absolute -top-7 right-3 z-10 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-background shadow-lg"
                            >
                                {messages.profile.thanks} ✨
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
