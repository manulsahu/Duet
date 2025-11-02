import React, { useState, useEffect } from "react";
import { 
  listenToUserProfile, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getUserProfile 
} from "../firebase/firestore";

function Notifications({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState({});
  const [processedRequests, setProcessedRequests] = useState(new Set());
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserProfile(user.uid, (userProfile) => {
        console.log("Notifications - Profile updated:", userProfile);
        setProfile(userProfile);
      });
      return unsubscribe;
    }
  }, [user]);

  const handleAccept = async (requestFromId, requestIndex, requesterName) => {
    const requestKey = `${requestFromId}_${requestIndex}`;
    
    // Don't process if already handled
    if (processedRequests.has(requestKey)) {
      return;
    }
    
    setLoading(prev => ({ ...prev, [requestKey]: true }));
    setActionMessage("");
    
    try {
      await acceptFriendRequest(user.uid, requestFromId);
      
      // Mark this request as processed
      setProcessedRequests(prev => new Set(prev.add(requestKey)));
      setActionMessage(`✅ Accepted friend request from ${requesterName}`);
      
      console.log("Friend request accepted and marked as processed");
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(""), 3000);
      
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setActionMessage(`❌ Error: ${error.message}`);
    }
    
    setLoading(prev => ({ ...prev, [requestKey]: false }));
  };

  const handleReject = async (requestFromId, requestIndex, requesterName) => {
    const requestKey = `${requestFromId}_${requestIndex}`;
    
    // Don't process if already handled
    if (processedRequests.has(requestKey)) {
      return;
    }
    
    setLoading(prev => ({ ...prev, [requestKey]: true }));
    setActionMessage("");
    
    try {
      await rejectFriendRequest(user.uid, requestFromId);
      
      // Mark this request as processed
      setProcessedRequests(prev => new Set(prev.add(requestKey)));
      setActionMessage(`❌ Rejected friend request from ${requesterName}`);
      
      console.log("Friend request rejected and marked as processed");
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(""), 3000);
      
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setActionMessage(`❌ Error: ${error.message}`);
    }
    
    setLoading(prev => ({ ...prev, [requestKey]: false }));
  };

  if (!profile) {
    return <div style={{ padding: '20px' }}>Loading notifications...</div>;
  }

  const friendRequests = profile.friendRequests || [];
  
  // Filter out processed requests
  const activeFriendRequests = friendRequests.filter((request, index) => {
    const requestKey = `${request.from}_${index}`;
    return !processedRequests.has(requestKey);
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Notifications</h2>
      
      {actionMessage && (
        <div style={{
          padding: '10px',
          backgroundColor: actionMessage.includes('✅') ? '#e8f5e8' : '#ffebee',
          border: '1px solid',
          borderColor: actionMessage.includes('✅') ? '#4caf50' : '#f44336',
          borderRadius: '4px',
          marginBottom: '20px',
          color: actionMessage.includes('✅') ? '#2e7d32' : '#c62828'
        }}>
          {actionMessage}
        </div>
      )}
      
      {activeFriendRequests.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          border: '1px dashed #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <p>No new notifications</p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            You're all caught up! New friend requests will appear here.
          </p>
        </div>
      ) : (
        <div>
          <h3>Friend Requests ({activeFriendRequests.length})</h3>
          {activeFriendRequests.map((request, index) => (
            <FriendRequestItem 
              key={`${request.from}_${index}`}
              request={request}
              index={index}
              onAccept={handleAccept}
              onReject={handleReject}
              loading={loading[`${request.from}_${index}`] || false}
              isProcessed={processedRequests.has(`${request.from}_${index}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced FriendRequestItem component
function FriendRequestItem({ request, index, onAccept, onReject, loading, isProcessed }) {
  const [requesterProfile, setRequesterProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchRequesterProfile = async () => {
      try {
        const profile = await getUserProfile(request.from);
        setRequesterProfile(profile);
      } catch (error) {
        console.error("Error fetching requester profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchRequesterProfile();
  }, [request.from]);

  if (isProcessed) {
    return null; // Don't render processed requests
  }

  if (profileLoading) {
    return (
      <div style={{
        padding: '15px',
        border: '1px solid #eee',
        borderRadius: '8px',
        marginBottom: '10px',
        backgroundColor: '#f9f9f9',
        textAlign: 'center'
      }}>
        Loading user information...
      </div>
    );
  }

  const requesterName = requesterProfile?.displayName || "Unknown User";

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '15px',
      border: '1px solid #eee',
      borderRadius: '8px',
      marginBottom: '10px',
      backgroundColor: '#f9f9f9',
      opacity: loading ? 0.7 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {requesterProfile ? (
          <>
            <img 
              src={requesterProfile.photoURL} 
              alt={requesterProfile.displayName}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                marginRight: '15px'
              }}
            />
            <div>
              <h4 style={{ margin: 0 }}>{requesterProfile.displayName}</h4>
              <p style={{ margin: 0, color: '#666' }}>@{requesterProfile.username}</p>
              {requesterProfile.bio && (
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                  {requesterProfile.bio}
                </p>
              )}
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                {request.timestamp?.toDate?.()?.toLocaleString() || 'Recently'}
              </p>
            </div>
          </>
        ) : (
          <div>
            <p style={{ margin: 0, color: '#666' }}>User not found</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              User ID: {request.from}
            </p>
          </div>
        )}
      </div>
      <div>
        <button 
          onClick={() => onAccept(request.from, index, requesterName)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          {loading ? '...' : 'Accept'}
        </button>
        <button 
          onClick={() => onReject(request.from, index, requesterName)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ea4335',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          {loading ? '...' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

export default Notifications;