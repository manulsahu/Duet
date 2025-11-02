import React, { useEffect, useState } from "react";
import { auth } from "./firebase/firebase";
import { createUserProfile } from "./firebase/firestore";
import Auth from "./pages/Auth"; // Updated import
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log("Auth state changed:", currentUser);
      
      try {
        if (currentUser) {
          // Create/update user profile in Firestore
          console.log("Creating/updating user profile...");
          await createUserProfile(currentUser);
          console.log("User profile created/updated");
          setAuthError(null);
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error("Error in auth state change:", error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  // Show loading only while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #4285f4, #34a853)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Duet
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth error if any
  if (authError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column',
        textAlign: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h2>Authentication Error</h2>
        <p style={{ color: 'red', margin: '20px' }}>{authError}</p>
        <p>Please check your Firestore security rules and refresh the page.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // If not loading and no user, show the new Auth component
  if (!user) {
    return <Auth />;
  }

  // User is authenticated
  return (
    <Router>
      <nav style={{ 
        padding: '15px 20px', 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ 
            textDecoration: 'none', 
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#4285f4'
          }}>
            Duet
          </Link>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/" style={navLinkStyle}>Home</Link>
            <Link to="/search" style={navLinkStyle}>Search</Link>
            <Link to="/notifications" style={navLinkStyle}>Notifications</Link>
            <Link to="/profile" style={navLinkStyle}>Profile</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Hello, {user.displayName || 'User'}!
          </span>
          <button 
            onClick={() => auth.signOut()} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#ea4335',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/search" element={<Search user={user} />} />
        <Route path="/notifications" element={<Notifications user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
      </Routes>
    </Router>
  );
}

const navLinkStyle = {
  textDecoration: 'none',
  color: '#333',
  padding: '8px 12px',
  borderRadius: '6px',
  transition: 'background-color 0.2s ease',
  fontSize: '14px',
  fontWeight: '500'
};

// Add hover effect
navLinkStyle[':hover'] = {
  backgroundColor: '#f5f5f5'
};

export default App;