import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Sun, Moon, Save } from 'lucide-react';

const SettingsPage = () => {
    const { user, setUser, theme, toggleTheme } = useContext(AppContext);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
    });
    const [saveMessage, setSaveMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setUser(formData);
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text">Settings</h1>

            {/* User Profile Section */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">User Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-semibold mb-1">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-semibold mb-1">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" className="flex items-center gap-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md transition-colors">
                            <Save size={16} />
                            <span>Save Changes</span>
                        </button>
                        {saveMessage && <p className="text-green-600 dark:text-green-400 text-sm">{saveMessage}</p>}
                    </div>
                </form>
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
            
            {/* About Section */}
            <div className="text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">
                <p>Mine Safety Reporter v1.0.0</p>
                <p>Made by Ashutosh Tripathi, BSP, SAIL.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
