import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Use AuthContext
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
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text">Settings</h1>

            {/* User Info Section */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">User Profile</h2>
                <p className="text-light-subtle-text dark:text-dark-subtle-text">You are logged in as:</p>
                <p className="font-semibold">{user.fullName}</p>
            </div>

            {/* Appearance Section */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                <div className="flex items-center justify-between">
                    <p className="font-semibold">Dark Mode</p>
                    <button onClick={toggleTheme} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-slate-200 dark:bg-slate-600">
                        <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}>
                           {theme === 'dark' ? <Moon size={12} className="text-slate-800 m-0.5"/> : <Sun size={12} className="text-slate-800 m-0.5"/>}
                        </span>
                    </button>
                </div>
            </div>
            
            {/* Logout Button */}
            <div className="text-center">
                 <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md transition-colors mx-auto">
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>

            {/* About Section */}
            <div className="text-center text-sm text-light-subtle-text dark:text-dark-subtle-text pt-4">
                <p>Mine Safety Reporter v1.0.0</p>
                <p>Made by Ankita & Ashutosh Tripathi for SAIL</p>
            </div>
        </div>
    );
};

export default SettingsPage;
