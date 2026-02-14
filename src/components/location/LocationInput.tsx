'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Location, TransitSuggestion } from '@/types';
import { generateId } from '@/lib/midpoint';

interface LocationInputProps {
    locations: Location[];
    onLocationChange: (locations: Location[]) => void;
    onSubmit: () => void;
}

// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// 색상 배열 (출발지별)
const LOCATION_COLORS = ['cyan', 'magenta', 'purple', 'cyan', 'magenta'] as const;

export function LocationInput({
    locations,
    onLocationChange,
    onSubmit,
}: LocationInputProps) {
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [suggestions, setSuggestions] = useState<TransitSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const debouncedQuery = useDebounce(searchQuery, 300);

    // 자동완성 검색
    useEffect(() => {
        async function fetchSuggestions() {
            if (!debouncedQuery || debouncedQuery.length < 2 || !focusedId) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch('/api/autocomplete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: debouncedQuery }),
                });
                const data = await response.json();

                if (data.success && data.data) {
                    setSuggestions(data.data);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSuggestions();
    }, [debouncedQuery, focusedId]);

    const addLocation = useCallback(() => {
        if (locations.length >= 5) return;
        const newLocation: Location = {
            id: generateId(),
            address: '',
            label: `출발지 ${locations.length + 1}`,
        };
        onLocationChange([...locations, newLocation]);
    }, [locations, onLocationChange]);

    const removeLocation = useCallback(
        (id: string) => {
            if (locations.length <= 2) return;
            onLocationChange(locations.filter((loc) => loc.id !== id));
        },
        [locations, onLocationChange]
    );

    const updateLocation = useCallback(
        (id: string, address: string, coordinates?: { lat: number; lng: number }) => {
            onLocationChange(
                locations.map((loc) =>
                    loc.id === id ? { ...loc, address, coordinates } : loc
                )
            );
            setSearchQuery(address);
        },
        [locations, onLocationChange]
    );

    const handleInputChange = useCallback(
        (id: string, value: string) => {
            updateLocation(id, value);
            setSearchQuery(value);
        },
        [updateLocation]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: TransitSuggestion) => {
            if (focusedId) {
                updateLocation(focusedId, suggestion.name, {
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                });
            }
            setShowSuggestions(false);
            setSuggestions([]);
        },
        [focusedId, updateLocation]
    );

    const handleFocus = useCallback((id: string) => {
        setFocusedId(id);
        const location = locations.find((l) => l.id === id);
        if (location) {
            setSearchQuery(location.address);
        }
    }, [locations]);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setShowSuggestions(false);
            setFocusedId(null);
        }, 200);
    }, []);

    const getTransitIcon = (type: TransitSuggestion['type']) => {
        switch (type) {
            case 'subway': return '🚇';
            case 'bus': return '🚌';
            default: return '🚉';
        }
    };

    const isValid = locations.every((loc) => loc.address.trim().length >= 2) && locations.length >= 2;

    return (
        <div className="space-y-4">
            {/* 위치 입력 카드들 */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {locations.map((location, index) => (
                        <motion.div
                            key={location.id}
                            layout
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <div className={`location-input-card ${index > 0 ? 'secondary' : ''}`}>
                                {/* 색상 도트 */}
                                <div className={`location-dot ${LOCATION_COLORS[index]}`} />

                                {/* 입력 필드 */}
                                <input
                                    type="text"
                                    value={location.address}
                                    onChange={(e) => handleInputChange(location.id, e.target.value)}
                                    onFocus={() => handleFocus(location.id)}
                                    onBlur={handleBlur}
                                    placeholder={index === 0 ? '내 위치 (예: 강남역)' : '상대방 위치 (예: 홍대입구역)'}
                                />

                                {/* 삭제 버튼 */}
                                {locations.length > 2 && (
                                    <motion.button
                                        onClick={() => removeLocation(location.id)}
                                        className="text-white/30 hover:text-red-400 transition-colors text-lg"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        ✕
                                    </motion.button>
                                )}
                            </div>

                            {/* 자동완성 드롭다운 */}
                            <AnimatePresence>
                                {showSuggestions && focusedId === location.id && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="autocomplete-dropdown"
                                    >
                                        {suggestions.map((suggestion, idx) => (
                                            <div
                                                key={`${suggestion.name}-${idx}`}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="autocomplete-item"
                                            >
                                                <span className="icon">{getTransitIcon(suggestion.type)}</span>
                                                <div className="flex-1">
                                                    <div className="name">{suggestion.name}</div>
                                                    <div className="address">{suggestion.address}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* 출발지 추가 버튼 */}
            {locations.length < 5 && (
                <motion.button
                    onClick={addLocation}
                    className="w-full py-3 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-white/70 hover:border-white/40 transition-all text-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    + 출발지 추가
                </motion.button>
            )}

            {/* FIND 버튼 */}
            <motion.div
                className="flex justify-center pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <motion.button
                    onClick={onSubmit}
                    disabled={!isValid}
                    className="find-button"
                    whileHover={isValid ? { scale: 1.1 } : {}}
                    whileTap={isValid ? { scale: 0.95 } : {}}
                >
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">📍</span>
                        <span>FIND</span>
                    </div>
                </motion.button>
            </motion.div>

            {/* 도움말 */}
            <p className="text-center text-white/30 text-sm mt-4">
                두 곳 이상의 위치를 입력하세요
            </p>
        </div>
    );
}

export default LocationInput;
