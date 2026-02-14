'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ContextMode } from '@/types';

const THEME_MAP: Record<ContextMode, string> = {
    company: 'company',
    friends: 'friends',
    romantic: 'romantic',
};

export function useTheme(initialTheme: ContextMode = 'company') {
    const [theme, setTheme] = useState<ContextMode>(initialTheme);

    const changeTheme = useCallback((newTheme: ContextMode) => {
        setTheme(newTheme);
    }, []);

    useEffect(() => {
        // body에 data-theme 속성 업데이트
        document.body.setAttribute('data-theme', THEME_MAP[theme]);
    }, [theme]);

    return {
        theme,
        changeTheme,
        themeClass: THEME_MAP[theme],
    };
}

export default useTheme;
