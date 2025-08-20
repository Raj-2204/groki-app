import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './auth-forms.css';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <h1>Welcome Back</h1>
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

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Sign In Button */}
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
                  Signing In...
                </>
              ) : (
                'Sign In'
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

      {/* Switch to Signup */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span>Don't have an account? </span>
        <button
          onClick={onSwitchToSignup}
          className="auth-link"
        >
          Create one here
        </button>
      </div>

      <div className="credits">
        <a href="#">Secured with enterprise-grade encryption</a>
      </div>
    </div>
  );
}