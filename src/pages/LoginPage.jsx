import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebaseConfig'; // Import firestore
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Shield } from 'lucide-react';

const LoginPage = () => {
    const [userId, setUserId] = useState(''); // Changed from email to userId
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const { login, updateUserPassword } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            // Step 1: Look up the userId in the 'users' collection
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Invalid User ID.");
                return;
            }

            // Step 2: Get the email associated with the userId
            const userDoc = querySnapshot.docs[0];
            const email = userDoc.data().email;

            // Step 3: Use the retrieved email to log in
            await login(email, password);

            // Step 4: Check for default password to force a change
            if (password === 'password123') { 
                setIsFirstLogin(true);
                setMessage('This is your first login. Please set a new password.');
            }
        } catch (err) {
            setError('Failed to log in. Please check your User ID and password.');
            console.error(err);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }
        try {
            await updateUserPassword(newPassword);
            setMessage('Password updated successfully! You are now logged in.');
            setTimeout(() => setIsFirstLogin(false), 2000);
        } catch (err) {
            setError('Failed to update password. Please try again.');
            console.error(err);
        }
    };

    if (isFirstLogin) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
                <div className="w-full max-w-md p-8 space-y-6 bg-light-card dark:bg-dark-card rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center">Set New Password</h2>
                    <p className="text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">{message}</p>
                    <form className="space-y-4" onSubmit={handlePasswordChange}>
                        <div>
                            <label className="block text-sm font-medium">New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <button type="submit" className="w-full py-2 px-4 rounded-md text-white bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:text-slate-900">Update Password</button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-light-card dark:bg-dark-card rounded-lg shadow-md">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-auto text-light-primary dark:text-dark-primary" />
                    <h2 className="mt-6 text-3xl font-bold text-light-text dark:text-dark-text">Mine Safety Reporter</h2>
                    <p className="mt-2 text-sm text-light-subtle-text dark:text-dark-subtle-text">Sign in to your account</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                     <div>
                        <label htmlFor="userId" className="block text-sm font-medium">User ID</label>
                        <input id="userId" name="userId" type="text" required value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium">Password</label>
                        <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" className="w-full py-2 px-4 rounded-md text-white bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:text-slate-900">Sign in</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;