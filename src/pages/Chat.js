import React, { useState, useEffect, useRef } from "react";
import MusicPlayer from '../Components/MusicPlayer';
import { 
  getOrCreateChat, 
  sendMessage, 
  listenToChatMessages, 
  markMessagesAsRead 
} from "../firebase/firestore";

function Chat({ user, friend, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && friend) {
      initializeChat();
    }
  }, [user, friend]);

  const initializeChat = async () => {
    try {
      const id = await getOrCreateChat(user.uid, friend.uid);
      setChatId(id);
      
      // Mark existing messages as read
      await markMessagesAsRead(id, user.uid);
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  useEffect(() => {
    if (!chatId) return;

    // Listen for real-time messages
    const unsubscribe = listenToChatMessages(chatId, (chatMessages) => {
      setMessages(chatMessages);
      scrollToBottom();
      
      // Mark new messages as read
      markMessagesAsRead(chatId, user.uid);
    });

    return unsubscribe;
  }, [chatId, user.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    setLoading(true);
    try {
      await sendMessage(chatId, user.uid, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message: " + error.message);
    }
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!friend) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <h3>Select a friend to start chatting</h3>
          <p>Choose a friend from your friends list to begin your conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Chat Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.userInfo}>
          <img 
            src={friend.photoURL} 
            alt={friend.displayName}
            style={styles.userAvatar}
          />
          <div>
            <h3 style={styles.userName}>{friend.displayName}</h3>
            <p style={styles.userStatus}>Online</p>
          </div>
        </div>
        {/* Add Music Button */}
        <button 
          onClick={() => setShowMusicPlayer(true)}
          style={styles.musicButton}
        >
          🎵 Sync Music
        </button>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageBubble,
                ...(message.senderId === user.uid 
                  ? styles.sentMessage 
                  : styles.receivedMessage)
              }}
            >
              <div style={styles.messageContent}>
                <p style={styles.messageText}>{message.text}</p>
                <span style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={styles.messageInput}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !newMessage.trim()}
          style={styles.sendButton}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>

      {/* Music Player */}
      <MusicPlayer
        chatId={chatId}
        user={user}
        isVisible={showMusicPlayer}
        onClose={() => setShowMusicPlayer(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8f9fa'
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#666',
    textAlign: 'center'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#4285f4',
    flexShrink: 0
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    justifyContent: 'center'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%'
  },
  userName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  userStatus: {
    margin: 0,
    fontSize: '12px',
    color: '#34a853'
  },
  musicButton: {
    padding: '8px 16px',
    backgroundColor: '#34a853',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flexShrink: 0
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noMessages: {
    textAlign: 'center',
    color: '#666',
    marginTop: '50px'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
    marginBottom: '8px'
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4285f4',
    color: 'white',
    borderBottomRightRadius: '4px'
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderBottomLeftRadius: '4px'
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  messageText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.4'
  },
  messageTime: {
    fontSize: '11px',
    opacity: 0.7,
    alignSelf: 'flex-end'
  },
  inputContainer: {
    display: 'flex',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    gap: '12px'
  },
  messageInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default Chat;