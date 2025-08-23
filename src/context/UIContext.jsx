import React, { createContext, useState, useEffect, useMemo } from 'react';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [navPreference, setNavPreference] = useState(localStorage.getItem('navPreference') || 'fab');
    const [demoMode, setDemoMode] = useState(localStorage.getItem('demoMode') === 'true');

    useEffect(() => {
      document.documentElement.className = theme;
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const updateNavPreference = (newPref) => {
        setNavPreference(newPref);
        localStorage.setItem('navPreference', newPref);
    };

    const setDemoModeAndUpdateStorage = (newMode) => {
        setDemoMode(newMode);
        localStorage.setItem('demoMode', newMode);
    };

    const value = useMemo(() => ({
        theme,
        toggleTheme,
        navPreference,
        updateNavPreference,
        demoMode,
        setDemoMode: setDemoModeAndUpdateStorage,
    }), [theme, navPreference, demoMode]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};