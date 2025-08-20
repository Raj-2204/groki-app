import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './auth-forms.css';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <div className="success-container">
          <CheckCircle size={48} style={{ color: '#00d4ff', marginBottom: '20px' }} />
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '16px' }}>Account Created!</h2>
          <p style={{ color: '#ccc', marginBottom: '24px' }}>
            Your account has been created successfully. You can now sign in to start using your Voice Grocery Assistant.
          </p>
          <div className="block-cube block-cube-hover">
            <button onClick={onSwitchToLogin} className="btn">
              <div className="text">Go to Sign In</div>
            </button>
            <div className="bg-top">
              <div className="bg-inner"></div>
            </div>
            <div className="bg-right">
              <div className="bg-inner"></div>
            </div>
            <div className="bg">
              <div className="bg-inner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit} className="form">
        {/* Email Field */}
        <div className="control block-cube block-input">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
          />
          <div className="bg-top">
            <div className="bg-inner"></div>
          </div>
          <div className="bg-right">
            <div className="bg-inner"></div>
          </div>
          <div className="bg">
            <div className="bg-inner"></div>
          </div>
        </div>

        {/* Password Field */}
        <div className="control block-cube block-input">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <div className="bg-top">
            <div className="bg-inner"></div>
          </div>
          <div className="bg-right">
            <div className="bg-inner"></div>
          </div>
          <div className="bg">
            <div className="bg-inner"></div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="control block-cube block-input">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm Password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <div className="bg-top">
            <div className="bg-inner"></div>
          </div>
          <div className="bg-right">
            <div className="bg-inner"></div>
          </div>
          <div className="bg">
            <div className="bg-inner"></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Sign Up Button */}
        <div className="block-cube block-cube-hover">
          <button
            type="submit"
            disabled={loading}
            className="btn"
          >
            <div className="text">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </div>
          </button>
          <div className="bg-top">
            <div className="bg-inner"></div>
          </div>
          <div className="bg-right">
            <div className="bg-inner"></div>
          </div>
          <div className="bg">
            <div className="bg-inner"></div>
          </div>
        </div>
      </form>

      {/* Switch to Login */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span>Already have an account? </span>
        <button
          onClick={onSwitchToLogin}
          className="auth-link"
        >
          Sign in here
        </button>
      </div>

      <div className="credits">
        <a href="#">Secure authentication powered by Supabase</a>
      </div>
    </div>
  );
}