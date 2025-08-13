import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { Sun, Moon, LogOut, Smartphone, MousePointerClick, TestTube2 } from 'lucide-react';

const Switch = ({ checked, onChange, label }) => (
    <button 
        onClick={() => {
            console.log(`%c[STATUS_CODE: S1] Switch clicked for: ${label}`, 'color: green');
            onChange();
        }} 
        className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors ${checked ? 'bg-light-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
        <span className={`inline-block w-6 h-6 transform transition-transform bg-white rounded-full ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
);

const SettingsPage = () => {
    const { user, theme, toggleTheme, navPreference, updateNavPreference, demoMode, setDemoMode } = useContext(AppContext);
    const { logout } = useContext(AuthContext);

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="text-base font-semibold mb-2">User Profile</h3>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">Logged in as:</p>
                    <p className="font-semibold">{user.name} ({user.userId})</p>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md space-y-4">
                <h3 className="text-base font-semibold">Preferences</h3>
                 <div className="flex items-center justify-between">
                    <label className="font-semibold text-sm">Dark Mode</label>
                    <Switch checked={theme === 'dark'} onChange={toggleTheme} label="Dark Mode" />
                 </div>
                 <div className="flex items-center justify-between lg:hidden">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                        {navPreference === 'fab' ? <MousePointerClick size={16}/> : <Smartphone size={16}/>}
                        <span>{navPreference === 'fab' ? 'Use Floating Button' : 'Use Bottom Bar'}</span>
                    </label>
                    <Switch checked={navPreference === 'bottom'} onChange={() => updateNavPreference(navPreference === 'fab' ? 'bottom' : 'fab')} label="Nav Preference" />
                 </div>
            </div>

            {user.isAdmin && (
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md space-y-4">
                    <h3 className="text-base font-semibold">Admin Controls</h3>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-semibold">
                            <TestTube2 size={16} />
                            <span>Demo Mode</span>
                        </label>
                        <Switch checked={demoMode} onChange={() => setDemoMode(!demoMode)} label="Demo Mode" />
                    </div>
                </div>
            )}
            
            <div className="text-center pt-4">
                 <button onClick={logout} className="flex items-center justify-center gap-2 bg-light-status-danger hover:bg-light-status-danger/90 text-white font-semibold px-4 py-2 rounded-md transition-colors mx-auto text-sm">
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
