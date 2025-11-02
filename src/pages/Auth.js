import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Error signing in with Google: " + error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    // For now, we'll just show an alert since we're focused on Google auth
    alert("Email/password authentication will be implemented later. Please use Google Sign-In for now.");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Duet</h1>
          <p style={styles.subtitle}>Chat with friends and listen to music together</p>
        </div>

        {/* Toggle between Login and Signup */}
        <div style={styles.toggleContainer}>
          <button
            style={{
              ...styles.toggleButton,
              ...(isLogin ? styles.activeToggle : {})
            }}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(!isLogin ? styles.activeToggle : {})
            }}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                style={styles.input}
                required={!isLogin}
              />
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.emailButton}>
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>or continue with</span>
        </div>

        {/* Google Sign In */}
        <button onClick={signInWithGoogle} style={styles.googleButton}>
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            style={styles.googleIcon}
          />
          Sign in with Google
        </button>

        {/* Switch between Login and Signup */}
        <div style={styles.switchContainer}>
          <p style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4285f4',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #4285f4, #34a853)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  toggleContainer: {
    display: 'flex',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px'
  },
  toggleButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  activeToggle: {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#4285f4'
  },
  form: {
    marginBottom: '24px'
  },
  inputGroup: {
    marginBottom: '16px',
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },
  inputFocus: {
    borderColor: '#4285f4'
  },
  emailButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '8px'
  },
  emailButtonHover: {
    backgroundColor: '#3367d6'
  },
  divider: {
    position: 'relative',
    margin: '24px 0',
    textAlign: 'center'
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 16px',
    fontSize: '12px',
    color: '#666',
    position: 'relative',
    zIndex: 1
  },
  dividerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: '#ddd',
    zIndex: 0
  },
  googleButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    marginBottom: '20px'
  },
  googleButtonHover: {
    borderColor: '#4285f4',
    boxShadow: '0 2px 4px rgba(66, 133, 244, 0.2)'
  },
  googleIcon: {
    width: '18px',
    height: '18px'
  },
  switchContainer: {
    marginTop: '16px'
  },
  switchText: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  switchButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#4285f4',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'underline'
  }
};

// Add hover effects
Object.assign(styles.input, {
  ':focus': {
    borderColor: '#4285f4'
  }
});

Object.assign(styles.emailButton, {
  ':hover': {
    backgroundColor: '#3367d6'
  }
});

Object.assign(styles.googleButton, {
  ':hover': {
    borderColor: '#4285f4',
    boxShadow: '0 2px 4px rgba(66, 133, 244, 0.2)'
  }
});

export default Auth;