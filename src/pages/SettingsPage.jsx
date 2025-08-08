import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { Sun, Moon, LogOut, Smartphone, MousePointerClick } from 'lucide-react';

const Switch = ({ checked, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors ${checked ? 'bg-light-accent' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`inline-block w-6 h-6 transform transition-transform bg-white rounded-full ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
);

const SettingsPage = () => {
    const { user, theme, toggleTheme, navPreference, updateNavPreference } = useContext(AppContext);
    const { logout } = useContext(AuthContext);

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold">Settings</h2>
            
            {/* ... (User Profile section updated to be single-line) ... */}
            <div className="flex items-center gap-2">
                <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">Logged in as:</p>
                <p className="font-semibold">{user.name}</p>
            </div>

            {/* ... (Appearance and Navigation Preference sections with larger switches) ... */}
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                 <h3 className="text-lg font-semibold mb-3">Mobile Navigation Style</h3>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        {navPreference === 'fab' ? <MousePointerClick/> : <Smartphone/>}
                        <span>{navPreference === 'fab' ? 'Floating Button' : 'Bottom Bar'}</span>
                    </div>
                    <Switch checked={navPreference === 'bottom'} onChange={() => updateNavPreference(navPreference === 'fab' ? 'bottom' : 'fab')} />
                 </div>
            </div>

            {/* ... (Logout Button and updated credit line) ... */}
            <p>Made by Ankita and Ashutosh Tripathi for SAIL.</p>
        </div>
    );
};

export default SettingsPage;
