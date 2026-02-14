'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeMap = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className={`${sizeMap[size]} relative`}>
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/20"
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--theme-primary)]"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            </div>
            <AnimatePresence>
                {text && (
                    <motion.p
                        className="text-white/60 text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {text}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LoadingSpinner;
