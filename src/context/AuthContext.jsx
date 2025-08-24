import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    updatePassword
} from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    function updateUserPassword(newPassword) {
        if (auth.currentUser) {
            return updatePassword(auth.currentUser, newPassword);
        }
        return Promise.reject(new Error("No user is currently signed in."));
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
  user: currentUser,  // ✅ lowercase 'user'
  currentUser,
  login,
  logout,
  resetPassword,
  updateUserPassword
};

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
