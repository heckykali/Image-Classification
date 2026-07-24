import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authLogin, authRegister, authMe, authSendLoginOTP, authVerifyLoginOTP, authSendRegisterOTP, authVerifyRegisterOTP } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from token on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            authMe()
                .then((userData) => {
                    setUser({ ...userData, token });
                })
                .catch(() => {
                    localStorage.removeItem('auth_token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    // OTP-based registration: step 1 - send OTP to email
    const sendRegisterOTP = useCallback(async (email) => {
        return await authSendRegisterOTP(email);
    }, []);

    // OTP-based registration: step 2 - verify OTP and create account
    const verifyRegisterOTP = useCallback(async (email, otp, username, password) => {
        const response = await authVerifyRegisterOTP(email, otp, username, password);
        return response;
    }, []);

    // OTP-based login: step 1 - send OTP to email
    const sendLoginOTP = useCallback(async (username, password) => {
        const response = await authSendLoginOTP(username, password);
        return response; // { message, email }
    }, []);

    // OTP-based login: step 2 - verify OTP and get JWT
    const verifyLoginOTP = useCallback(async (email, otp, username, password) => {
        const response = await authVerifyLoginOTP(email, otp, username, password);
        localStorage.setItem('auth_token', response.access_token);
        setUser({
            username: response.username,
            role: response.role,
            token: response.access_token,
        });
        return response;
    }, []);

    // Legacy direct login (still works for admin-created users etc.)
    const login = useCallback(async (username, password) => {
        const response = await authLogin(username, password);
        localStorage.setItem('auth_token', response.access_token);
        setUser({
            username: response.username,
            role: response.role,
            token: response.access_token,
        });
        return response;
    }, []);

    const register = useCallback(async (username, email, password) => {
        const response = await authRegister(username, email, password);
        return response;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
    }, []);

    const isAdmin = user?.role === 'admin';
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user, login, register, logout,
            sendRegisterOTP, verifyRegisterOTP,
            sendLoginOTP, verifyLoginOTP,
            isAdmin, isAuthenticated, loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

