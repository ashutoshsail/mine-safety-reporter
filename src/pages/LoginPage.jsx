import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Shield } from 'lucide-react';

const LoginPage = ({ setRoute }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const { login, updateUserPassword, currentUser } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        console.log(`[DEBUG_CODE] LoginPage: Attempting to log in with User ID: ${userId}`);
        
        try {
            // Step 1: Look up the userId in the 'users' collection to get the email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Invalid User ID.");
                console.log(`[DEBUG_CODE] LoginPage: Failed to find User ID '${userId}' in Firestore.`);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const email = userDoc.data().email;
            const userData = userDoc.data();
            
            console.log(`[DEBUG_CODE] LoginPage: Found email '${email}' and data in Firestore. Attempting Firebase Auth login...`);

            const userCredential = await login(email, password);
            
            console.log(`[DEBUG_CODE] LoginPage: Firebase Auth successful. Received UID: ${userCredential.user.uid}`);

            // Step 2: After successful Firebase login, proactively create/update user data in Firestore
            const userProfileRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userProfileRef, {
                uid: userCredential.user.uid,
                userId: userData.userId,
                name: userData.name || 'New User',
                email: userData.email,
                isAdmin: userData.isAdmin || false,
                lastLogin: new Date().toISOString()
            }, { merge: true }); // Use merge:true to avoid overwriting existing fields

            console.log("[DEBUG_CODE] LoginPage: Firestore profile updated/created successfully with UID.");

            // Step 3: Check for first-time login
            if (password === 'password123') {
                setIsFirstLogin(true);
            } else {
                setRoute('home');
            }

        } catch (err) {
            setError("Login failed. Please check your password.");
            console.error("[DEBUG_CODE] Login Error:", err);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        try {
            await updateUserPassword(newPassword);
            setMessage("Password changed successfully. Redirecting...");
            setTimeout(() => {
                setIsFirstLogin(false);
                setRoute('home');
            }, 2000);
        } catch (err) {
            setError("Failed to change password.");
            console.error("[DEBUG_CODE] Password Change Error:", err);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
            <div className="w-full max-w-sm p-8 space-y-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg">
                {isFirstLogin ? (
                    <>
                        <div className="text-center">
                            <h2 className="mt-6 text-2xl font-bold text-light-status-warning dark:text-dark-status-warning">Change Password</h2>
                            <p className="mt-2 text-sm text-light-subtle-text dark:text-dark-subtle-text">This is your first login. Please set a new password.</p>
                        </div>
                        <form className="space-y-6" onSubmit={handlePasswordChange}>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium">New Password</label>
                                <input id="new-password" name="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium">Confirm New Password</label>
                                <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            {message && <p className="text-sm text-green-600 text-center">{message}</p>}
                            <button type="submit" className="w-full py-2 px-4 rounded-md text-white bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:text-slate-100 font-semibold transition-colors">Set New Password</button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <Shield className="mx-auto text-light-primary dark:text-dark-primary" size={48} />
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
                            <button type="submit" className="w-full py-2 px-4 rounded-md text-white bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:text-slate-100 font-semibold transition-colors">Sign in</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
