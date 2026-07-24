import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
    const [step, setStep] = useState('form'); // form | otp | success
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const { sendRegisterOTP, verifyRegisterOTP, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await sendRegisterOTP(email);
            setSuccess(response.message || 'OTP sent to your email!');
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP code');
            return;
        }

        setLoading(true);

        try {
            const response = await verifyRegisterOTP(email, otp, username, password);
            setSuccess(response.message || 'Account created successfully!');
            setStep('success');
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToForm = () => {
        setStep('form');
        setError(null);
        setSuccess(null);
        setOtp('');
    };

    return (
        <div className="page auth-page">
            <div className="auth-card glass-card">
                {step === 'form' && (
                    <>
                        <div className="auth-header">
                            <h2>Create Account</h2>
                            <p>Sign up to get started</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSendOTP} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    minLength={3}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                                {loading ? '⏳ Sending OTP...' : '📧 Send Verification Code'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div className="auth-header">
                            <h2>Verify Email</h2>
                            <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        {success && (
                            <div className="auth-success">
                                ✅ {success}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOTP} className="auth-form">
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
                                {loading ? '⏳ Verifying...' : '✅ Create Account'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                <button onClick={handleBackToForm} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                                    ← Back to registration form
                                </button>
                            </p>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <div className="auth-header">
                            <h2>🎉 Welcome!</h2>
                            <p>Your account has been created successfully.</p>
                        </div>

                        {success && (
                            <div className="auth-success" style={{ marginBottom: '1.5rem' }}>
                                ✅ {success}
                            </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <Link to="/login" className="btn-primary auth-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                                🔑 Sign In Now
                            </Link>
                        </div>
                    </>
                )}

                {step !== 'success' && (
                    <div className="auth-footer">
                        <p>
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RegisterPage;

