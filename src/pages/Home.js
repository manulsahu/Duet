import React, { useState, useEffect } from "react";
import { getUserFriends, listenToUserChats } from "../firebase/firestore";
import Chat from "./Chat";

function Home({ user }) {
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeView, setActiveView] = useState('friends'); // 'friends' or 'chats'

  useEffect(() => {
    const loadFriends = async () => {
      if (user) {
        try {
          const friendsList = await getUserFriends(user.uid);
          setFriends(friendsList);
        } catch (error) {
          console.error("Error loading friends:", error);
        }
        setLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Listen for real-time chat updates
    const unsubscribe = listenToUserChats(user.uid, (userChats) => {
      setChats(userChats);
    });

    return unsubscribe;
  }, [user]);

  const handleStartChat = (friend) => {
    setSelectedFriend(friend);
  };

  const handleBackToFriends = () => {
    setSelectedFriend(null);
  };

  // If chat is open, show chat interface
  if (selectedFriend) {
    return (
      <Chat 
        user={user} 
        friend={selectedFriend} 
        onBack={handleBackToFriends}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Welcome to Duet, {user?.displayName}! 🎵</h2>
        <p style={styles.subtitle}>Chat with friends and listen to music together in real-time.</p>
        
        {/* View Toggle */}
        <div style={styles.toggleContainer}>
          <button
            style={{
              ...styles.toggleButton,
              ...(activeView === 'friends' ? styles.activeToggle : {})
            }}
            onClick={() => setActiveView('friends')}
          >
            Friends ({friends.length})
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(activeView === 'chats' ? styles.activeToggle : {})
            }}
            onClick={() => setActiveView('chats')}
          >
            Chats ({chats.length})
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {activeView === 'friends' ? (
          <FriendsView 
            friends={friends} 
            loading={loading} 
            onStartChat={handleStartChat}
          />
        ) : (
          <ChatsView 
            chats={chats} 
            loading={loading} 
            onStartChat={handleStartChat}
          />
        )}
      </div>
    </div>
  );
}

// Friends View Component
function FriendsView({ friends, loading, onStartChat }) {
  if (loading) {
    return <div style={styles.loading}>Loading friends...</div>;
  }

  if (friends.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>You don't have any friends yet.</p>
        <p>Go to the Search page to find and add friends!</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {friends.map(friend => (
        <div 
          key={friend.uid} 
          style={styles.card}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <img 
            src={friend.photoURL} 
            alt={friend.displayName}
            style={styles.avatar}
          />
          <div style={styles.cardContent}>
            <h4 style={styles.cardTitle}>{friend.displayName}</h4>
            <p style={styles.cardSubtitle}>@{friend.username}</p>
            {friend.bio && (
              <p style={styles.cardBio}>{friend.bio}</p>
            )}
          </div>
          <button 
            onClick={() => onStartChat(friend)}
            style={styles.chatButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#3367d6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4285f4';
            }}
          >
            💬 Chat
          </button>
        </div>
      ))}
    </div>
  );
}

// Chats View Component
function ChatsView({ chats, loading, onStartChat }) {
  if (loading) {
    return <div style={styles.loading}>Loading chats...</div>;
  }

  if (chats.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>No active chats yet.</p>
        <p>Start a conversation with one of your friends!</p>
      </div>
    );
  }

  return (
    <div style={styles.chatList}>
      {chats.map(chat => (
        <div 
          key={chat.id} 
          style={styles.chatItem}
          onClick={() => onStartChat(chat.otherParticipant)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <img 
            src={chat.otherParticipant.photoURL} 
            alt={chat.otherParticipant.displayName}
            style={styles.chatAvatar}
          />
          <div style={styles.chatInfo}>
            <div style={styles.chatHeader}>
              <h4 style={styles.chatName}>{chat.otherParticipant.displayName}</h4>
              <span style={styles.chatTime}>
                {chat.lastMessageAt?.toDate?.()?.toLocaleDateString() || 'New'}
              </span>
            </div>
            <p style={styles.lastMessage}>
              {chat.lastMessage || 'Start a conversation...'}
            </p>
          </div>
          {chat.unreadCount > 0 && (
            <div style={styles.unreadBadge}>
              {chat.unreadCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 20px 0'
  },
  toggleContainer: {
    display: 'inline-flex',
    backgroundColor: '#e9ecef',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '20px'
  },
  toggleButton: {
    padding: '10px 20px',
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
  content: {
    marginBottom: '40px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 40px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px dashed #ddd',
    fontSize: '16px',
    lineHeight: '1.6'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  cardContent: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardSubtitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardBio: {
    margin: 0,
    fontSize: '12px',
    color: '#999',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  chatButton: {
    padding: '8px 16px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap'
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  chatAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
    objectFit: 'cover'
  },
  chatInfo: {
    flex: 1,
    minWidth: 0
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  chatName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  chatTime: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap',
    marginLeft: '10px'
  },
  lastMessage: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  unreadBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#ea4335',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  comingSoon: {
    backgroundColor: '#e8f4fd',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #b3d9ff',
    textAlign: 'center',
    marginTop: '40px'
  },
  featureList: {
    textAlign: 'left',
    maxWidth: '400px',
    margin: '20px auto 0',
    color: '#666',
    paddingLeft: '20px',
    lineHeight: '1.6'
  }
};

export default Home;