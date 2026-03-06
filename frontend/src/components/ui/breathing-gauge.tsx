"use client";
import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const BreathingGauge = ({ value = 72, label = "Confiance IA" }: { value?: number, label?: string }) => {
    // Animation for the "breathing" effect
    const controls = useAnimation();

    useEffect(() => {
        controls.start({
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        });
    }, [controls]);

    // Color based on value
    const getColor = (val: number) => {
        if (val >= 80) return "#10b981"; // emerald-500 (safe)
        if (val >= 60) return "#3b82f6"; // blue-500 (value)
        return "#f43f5e"; // rose-500 (risky)
    };

    const color = getColor(value);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <motion.div
                animate={controls}
                className="relative size-32 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-md border border-white/10 shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)]"
                style={{ boxShadow: `0 0 20px ${color}30` }}
            >
                {/* SVG Gauge */}
                <svg className="size-full -rotate-90 transform p-2">
                    {/* Background Circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/20"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-black tracking-tighter font-sans"
                        style={{ color, textShadow: `0 0 20px ${color}` }}
                    >
                        {value}%
                    </motion.span>
                </div>
            </motion.div>
            <p className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{label}</p>
        </div>
    );
};
