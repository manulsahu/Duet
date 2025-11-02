import React, { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { updateDoc, doc, getDoc, setDoc } from "firebase/firestore"; // Added setDoc here
import { db } from "../firebase/firebase";
import { listenToUserProfile, getUserProfile } from "../firebase/firestore";

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load profile data with fallback
  useEffect(() => {
    if (!user) return;

    console.log("Current user:", user);
    
    // Try real-time listener first
    const unsubscribe = listenToUserProfile(user.uid, (userProfile) => {
      console.log("Real-time profile received:", userProfile);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName || user.displayName || "",
          username: userProfile.username || user.email?.split('@')[0] || "",
          bio: userProfile.bio || ""
        });
      } else {
        // If no profile found, create one or use auth data
        loadProfileFallback();
      }
    });

    return unsubscribe;
  }, [user]);

  // Fallback method to load profile
  const loadProfileFallback = async () => {
    try {
      console.log("Trying fallback profile load...");
      let userProfile = await getUserProfile(user.uid);
      
      if (!userProfile) {
        console.log("No profile found, creating one...");
        // Create basic profile from auth data
        userProfile = {
          uid: user.uid,
          displayName: user.displayName || "User",
          email: user.email,
          photoURL: user.photoURL,
          username: user.email?.split('@')[0] || "user",
          bio: "",
          friends: [],
          friendRequests: [],
          createdAt: new Date()
        };
        
        // Save to Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, userProfile); // This is where setDoc is used
      }
      
      setProfile(userProfile);
      setFormData({
        displayName: userProfile.displayName || "",
        username: userProfile.username || "",
        bio: userProfile.bio || ""
      });
    } catch (error) {
      console.error("Error in fallback:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      // Update Firebase Auth display name
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: formData.displayName });
      }
      
      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        username: formData.username,
        bio: formData.bio
      });

      setMessage("Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile: " + error.message);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!user || !user.email) return;

    setLoading(true);
    setMessage("");

    try {
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage("New passwords don't match");
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setMessage("Password should be at least 6 characters");
        setLoading(false);
        return;
      }

      // Reauthenticate user before password change
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      setMessage("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setChangingPassword(false);
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage("Current password is incorrect");
      } else {
        setMessage("Error updating password: " + error.message);
      }
    }
    setLoading(false);
  };

  // If profile is still loading after 3 seconds, show fallback
  if (!profile) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Your Profile</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading profile...</p>
          <button 
            onClick={loadProfileFallback}
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
            Click here if loading takes too long
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Your Profile</h2>
        <button 
          onClick={() => {
            setEditing(!editing);
            setChangingPassword(false);
            setMessage("");
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: editing ? '#666' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Picture Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt="Profile" 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%',
            marginBottom: '15px'
          }}
        />
        <p style={{ color: '#666' }}>Profile picture from Google</p>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          border: '1px solid',
          borderColor: message.includes('Error') ? '#f44336' : '#4caf50',
          borderRadius: '4px',
          marginBottom: '20px',
          color: message.includes('Error') ? '#c62828' : '#2e7d32'
        }}>
          {message}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Display Name:
            </label>
            <input 
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Username:
            </label>
            <input 
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Bio:
            </label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows="4"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Tell others about yourself..."
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#34a853',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Name:</strong> {profile.displayName}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Username:</strong> @{profile.username}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Email:</strong> {user.email}
          </div>
          {profile.bio && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Bio:</strong> 
              <p style={{ margin: '5px 0 0 0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                {profile.bio}
              </p>
            </div>
          )}
          <div style={{ marginBottom: '20px' }}>
            <strong>Friends:</strong> {profile.friends ? profile.friends.length : 0}
          </div>

          {/* Password Change Section */}
          {!changingPassword ? (
            <button 
              onClick={() => setChangingPassword(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Change Password
            </button>
          ) : (
            <div style={{ 
              padding: '20px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Current Password:
                  </label>
                  <input 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    New Password:
                  </label>
                  <input 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Confirm New Password:
                  </label>
                  <input 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#34a853',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                      });
                      setMessage("");
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}