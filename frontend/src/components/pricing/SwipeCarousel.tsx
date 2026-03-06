"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
    children: React.ReactNode;
    itemCount: number;
    className?: string;
}

export function SwipeCarousel({ children, itemCount, className = "" }: SwipeCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile breakpoint (< lg = 1024px)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Track scroll position to update active dot
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || !isMobile) return;

        const scrollLeft = el.scrollLeft;
        const itemWidth = el.scrollWidth / itemCount;
        const index = Math.round(scrollLeft / itemWidth);
        setActiveIndex(Math.min(index, itemCount - 1));
    }, [itemCount, isMobile]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Click on a dot to scroll to that card
    const scrollToIndex = (index: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const itemWidth = el.scrollWidth / itemCount;
        el.scrollTo({ left: itemWidth * index, behavior: "smooth" });
    };

    return (
        <div className="w-full">
            <div
                ref={scrollRef}
                className={cn(
                    "flex flex-nowrap overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar",
                    "lg:flex-wrap lg:justify-center lg:overflow-x-visible items-stretch lg:snap-none",
                    className
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {children}
            </div>

            {/* Dot Indicators — Mobile Only */}
            {isMobile && itemCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: itemCount }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToIndex(i)}
                            aria-label={`Aller au plan ${i + 1}`}
                            className={`rounded-full transition-all duration-300 ${i === activeIndex
                                ? "w-6 h-2 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                                : "w-2 h-2 bg-white/20 hover:bg-white/40"
                                }`}
                            style={i === activeIndex ? {
                                background: 'linear-gradient(135deg, oklch(0.65 0.24 265), oklch(0.70 0.20 300))'
                            } : {}}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
