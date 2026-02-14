'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';

interface SlotMachineProps {
    candidates: Array<{
        name: string;
        address?: string;
    }>;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (index: number) => void;
}

export default function Roulette({ candidates, isOpen, onClose, onSelect }: SlotMachineProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(0);

    // 스핀 시작
    const startSpin = useCallback(() => {
        if (candidates.length === 0) return;

        setIsSpinning(true);
        setSelectedIndex(null);

        const spin = () => {
            currentIndexRef.current = (currentIndexRef.current + 1) % candidates.length;
            setCurrentIndex(currentIndexRef.current);
            spinIntervalRef.current = setTimeout(spin, 60); // 빠른 속도로 계속 회전
        };

        spin();
    }, [candidates.length]);

    // 스핀 정지 (점점 느려지면서)
    const stopSpin = useCallback(() => {
        if (!spinIntervalRef.current) return;

        // 기존 interval 중단
        clearTimeout(spinIntervalRef.current);

        // 점점 느려지는 효과
        let speed = 60;
        let slowdownCount = 0;
        const maxSlowdowns = 12;

        const slowDown = () => {
            currentIndexRef.current = (currentIndexRef.current + 1) % candidates.length;
            setCurrentIndex(currentIndexRef.current);
            slowdownCount++;

            if (slowdownCount < maxSlowdowns) {
                speed = speed * 1.25; // 점점 느려짐
                spinIntervalRef.current = setTimeout(slowDown, speed);
            } else {
                // 최종 정지
                setSelectedIndex(currentIndexRef.current);
                setIsSpinning(false);
                spinIntervalRef.current = null;
            }
        };

        slowDown();
    }, [candidates.length]);

    // 버튼 클릭 핸들러
    const handleLeverClick = useCallback(() => {
        if (isSpinning) {
            stopSpin();
        } else if (selectedIndex === null) {
            startSpin();
        }
    }, [isSpinning, selectedIndex, startSpin, stopSpin]);

    const handleConfirm = useCallback(() => {
        if (selectedIndex !== null) {
            onSelect(selectedIndex);
            onClose();
            setTimeout(() => {
                setSelectedIndex(null);
                setCurrentIndex(0);
                currentIndexRef.current = 0;
            }, 300);
        }
    }, [selectedIndex, onSelect, onClose]);

    const handleClose = useCallback(() => {
        if (spinIntervalRef.current) {
            clearTimeout(spinIntervalRef.current);
        }
        onClose();
        setTimeout(() => {
            setSelectedIndex(null);
            setCurrentIndex(0);
            currentIndexRef.current = 0;
            setIsSpinning(false);
        }, 300);
    }, [onClose]);

    // 모달 닫힐 때 정리
    useEffect(() => {
        if (!isOpen && spinIntervalRef.current) {
            clearTimeout(spinIntervalRef.current);
            spinIntervalRef.current = null;
        }
    }, [isOpen]);

    // 색상 팔레트
    const colors = [
        '#00d4ff', '#8b5cf6', '#ff00d4', '#00ff88',
        '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'
    ];

    // 보여줄 아이템들 (현재 위치 기준 전후 포함)
    const getVisibleItems = () => {
        if (candidates.length === 0) return [];
        const items = [];
        for (let i = -2; i <= 2; i++) {
            const idx = (currentIndex + i + candidates.length) % candidates.length;
            items.push({
                index: idx,
                name: candidates[idx]?.name || '',
                offset: i
            });
        }
        return items;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="slot-modal relative"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 헤더 */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">🎰 중간지점 슬롯</h2>
                            <p className="text-white/50 text-sm">
                                {!isSpinning && selectedIndex === null && '버튼을 눌러 시작하세요!'}
                                {isSpinning && '다시 눌러서 멈추세요!'}
                                {selectedIndex !== null && '결과가 나왔습니다!'}
                            </p>
                        </div>

                        {/* 슬롯머신 */}
                        <div className="slot-container">
                            {/* 슬롯 창 */}
                            <div className="slot-window">
                                {/* 선택 라인 */}
                                <div className="slot-line-left">▶</div>
                                <div className="slot-line-right">◀</div>

                                {/* 아이템 목록 */}
                                <div className="slot-items">
                                    {getVisibleItems().map((item, idx) => (
                                        <motion.div
                                            key={`${item.index}-${idx}-${currentIndex}`}
                                            className={`slot-item ${item.offset === 0 ? 'active' : ''}`}
                                            style={{
                                                backgroundColor: item.offset === 0
                                                    ? colors[item.index % colors.length]
                                                    : 'transparent',
                                                opacity: item.offset === 0 ? 1 : 0.3 - Math.abs(item.offset) * 0.1,
                                                transform: `scale(${item.offset === 0 ? 1 : 0.85 - Math.abs(item.offset) * 0.1})`
                                            }}
                                        >
                                            {item.name}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* 레버 버튼 */}
                            <motion.button
                                className={`slot-lever ${isSpinning ? 'spinning' : ''}`}
                                onClick={handleLeverClick}
                                disabled={selectedIndex !== null}
                                whileHover={selectedIndex === null ? { scale: 1.05 } : {}}
                                whileTap={selectedIndex === null ? { scale: 0.95, y: 3 } : {}}
                            >
                                {isSpinning ? (
                                    <>
                                        <span className="slot-lever-text">STOP</span>
                                        <span className="slot-lever-arrow-stop">■</span>
                                    </>
                                ) : selectedIndex !== null ? (
                                    <span className="slot-spinning">🎉</span>
                                ) : (
                                    <>
                                        <span className="slot-lever-text">PULL</span>
                                        <span className="slot-lever-arrow">↓</span>
                                    </>
                                )}
                            </motion.button>
                        </div>

                        {/* 결과 표시 */}
                        <AnimatePresence>
                            {selectedIndex !== null && (
                                <motion.div
                                    className="text-center mt-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="slot-result">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [0, 1.2, 1] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <p className="text-3xl mb-2">🎉</p>
                                        </motion.div>
                                        <p className="text-white/50 text-sm mb-1">당첨!</p>
                                        <p className="text-xl font-bold" style={{ color: colors[selectedIndex % colors.length] }}>
                                            {candidates[selectedIndex].name}
                                        </p>
                                    </div>

                                    <motion.button
                                        className="slot-confirm-btn mt-4"
                                        onClick={handleConfirm}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        이 장소로 결정! ✨
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 닫기 버튼 */}
                        <button
                            className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl"
                            onClick={handleClose}
                        >
                            ×
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
