'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationInput } from '@/components/location';
import { MidpointDisplay } from '@/components/result';
import { LoadingSpinner } from '@/components/ui';
import { generateId } from '@/lib/midpoint';
import type { Location, MidpointInfo } from '@/types';

type AppStep = 'location' | 'loading' | 'result';

export default function Home() {
    const [step, setStep] = useState<AppStep>('location');
    const [locations, setLocations] = useState<Location[]>([
        { id: generateId(), address: '', label: '나' },
        { id: generateId(), address: '', label: '상대방' },
    ]);
    const [midpoint, setMidpoint] = useState<MidpointInfo | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

    const handleLocationSubmit = useCallback(async () => {
        setError(null);
        setStep('loading');
        setLoadingMessage('중간 지점을 찾고 있어요');

        try {
            const coordinatesPromises = locations.map(async (loc) => {
                const res = await fetch('/api/geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: loc.address }),
                });
                const data = await res.json();
                if (data.success && data.data) {
                    return { lat: data.data.lat, lng: data.data.lng };
                }
                throw new Error(`주소 변환 실패: ${loc.address}`);
            });

            const coordinates = await Promise.all(coordinatesPromises);
            const updatedLocations = locations.map((loc, i) => ({
                ...loc,
                coordinates: coordinates[i]
            }));
            setLocations(updatedLocations);

            const midpointRes = await fetch('/api/midpoint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coordinates }),
            });
            const midpointData = await midpointRes.json();

            if (!midpointData.success) {
                throw new Error('중간 지점 계산 실패');
            }

            setMidpoint(midpointData.data);
            setStep('result');
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : '오류가 발생했습니다');
            setStep('location');
        }
    }, [locations]);

    const handleReset = useCallback(() => {
        setStep('location');
        setLocations([
            { id: generateId(), address: '', label: '나' },
            { id: generateId(), address: '', label: '상대방' },
        ]);
        setMidpoint(null);
        setSelectedCandidateIndex(0);
        setError(null);
    }, []);

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* 오로라 배경 */}
            <div className="aurora-bg" />

            {/* 플로팅 파티클 */}
            <div className="particles">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="particle"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            y: [-20, 20, -20],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            {/* 메인 콘텐츠 */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* 헤더 */}
                <motion.header
                    className="pt-8 pb-4 text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* 딱정해 로고 */}
                    <motion.div
                        className="flex justify-center mb-4"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="logo-badge">
                            딱정해
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-4xl md:text-5xl font-black title-gradient mb-2"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                    >
                        중간지점
                    </motion.h1>
                    <motion.p
                        className="text-white/40 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        어디서 만날까요?
                    </motion.p>
                </motion.header>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {/* 에러 메시지 */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="error-toast"
                            >
                                {error}
                                <button onClick={() => setError(null)}>✕</button>
                            </motion.div>
                        )}

                        {step === 'location' && (
                            <motion.div
                                key="location"
                                className="w-full max-w-md"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <LocationInput
                                    locations={locations}
                                    onLocationChange={setLocations}
                                    onSubmit={handleLocationSubmit}
                                />
                            </motion.div>
                        )}

                        {step === 'loading' && (
                            <motion.div
                                key="loading"
                                className="flex flex-col items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* 원형 로딩 애니메이션 */}
                                <div className="loading-ring">
                                    <motion.div
                                        className="ring-glow"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <div className="ring-center">
                                        <motion.span
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            🔍
                                        </motion.span>
                                    </div>
                                </div>
                                <motion.p
                                    className="mt-6 text-white/60"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {loadingMessage}
                                </motion.p>
                            </motion.div>
                        )}

                        {step === 'result' && midpoint && (
                            <motion.div
                                key="result"
                                className="w-full max-w-lg space-y-4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                {/* 결과 헤더 - 간소화 */}
                                <div className="text-center py-2">
                                    <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                        <span>📍</span> 여기서 만나요!
                                    </h2>
                                </div>

                                {/* 중간 지점 카드 */}
                                <MidpointDisplay
                                    midpoint={midpoint}
                                    origins={locations.map(l => ({
                                        name: l.address,
                                        lat: l.coordinates?.lat || 0,
                                        lng: l.coordinates?.lng || 0
                                    }))}
                                    selectedCandidateIndex={selectedCandidateIndex}
                                    onCandidateSelect={(_, index) => setSelectedCandidateIndex(index)}
                                />

                                {/* 액션 버튼들 */}
                                <div className="space-y-3 pt-4">
                                    {midpoint.candidates?.[selectedCandidateIndex] && (
                                        <motion.button
                                            className="action-btn primary"
                                            onClick={() => {
                                                const station = midpoint.candidates![selectedCandidateIndex].station;
                                                const url = `https://map.naver.com/v5/search/${encodeURIComponent(station.name)}`;
                                                window.open(url, '_blank');
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span>🗺️</span>
                                            지도에서 보기
                                        </motion.button>
                                    )}

                                    <motion.button
                                        className="action-btn secondary"
                                        onClick={handleReset}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        다시 찾기
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
