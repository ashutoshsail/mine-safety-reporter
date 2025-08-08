import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { Sun, Moon, LogOut } from 'lucide-react';

const SettingsPage = () => {
    const { user, theme, toggleTheme } = useContext(AppContext);
    const { logout } = useContext(AuthContext);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl sm:text-3xl font-semibold">Settings</h1>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-1">User Profile</h2>
                <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">You are logged in as:</p>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">User ID: {user.userId}</p>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-2">Appearance</h2>
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Dark Mode</p>
                    <button onClick={toggleTheme} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-slate-200 dark:bg-slate-600">
                        <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}>
                           {theme === 'dark' ? <Moon size={12} className="text-slate-800 m-0.5"/> : <Sun size={12} className="text-slate-800 m-0.5"/>}
                        </span>
                    </button>
                </div>
            </div>
            
            <div className="text-center pt-4">
                 <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition-colors mx-auto text-sm">
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>

            <div className="text-center text-xs text-light-subtle-text dark:text-dark-subtle-text pt-6">
                <p>Mine Safety Reporter v1.0.0</p>
                <p>Made by Ankita and Ashutosh Tripathi for SAIL.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
