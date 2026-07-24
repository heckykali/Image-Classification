import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [step, setStep] = useState('password'); // password | otp
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { sendLoginOTP, verifyLoginOTP, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await sendLoginOTP(username, password);
            setEmail(response.email || '');
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP code');
            return;
        }

        setLoading(true);

        try {
            await verifyLoginOTP(email, otp, username, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToPassword = () => {
        setStep('password');
        setError(null);
        setOtp('');
    };

    return (
        <div className="page auth-page">
            <div className="auth-card glass-card">
                {step === 'password' && (
                    <>
                        <div className="auth-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to your account</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                                {loading ? '⏳ Verifying...' : '🔑 Sign In'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div className="auth-header">
                            <h2>Verify Login</h2>
                            <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleOTPSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="otp">OTP Code</label>
                                <input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    minLength={6}
                                    maxLength={6}
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                                />
                            </div>

                            <button type="submit" className="btn-primary auth-btn" disabled={loading || otp.length !== 6}>
                                {loading ? '⏳ Verifying...' : '✅ Verify & Sign In'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                <button onClick={handleBackToPassword} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                                    ← Back to login form
                                </button>
                            </p>
                        </div>
                    </>
                )}

                <div className="auth-footer">
                    <p>
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;

