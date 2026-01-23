import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { showToast } from '../utils/toast';
import { BASE_URL } from '../config/api';
const getSocketUrl = () => {
 
  return BASE_URL.replace('/v1', '/website-chat');
};

export const useOperatorSocket = (operatorId, role = 'Counsellor',operatorName) => {
  const socketRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeChats, setActiveChats] = useState([]); 
  const [currentChatMessages, setCurrentChatMessages] = useState({}); 
  const [typingUsers, setTypingUsers] = useState({}); 
  const [studentStatus, setStudentStatus] = useState({}); 
 const [selectedChat, setSelectedChat] = useState(null);
 const selectedChatRef = useRef(null);
 useEffect(() => {
  selectedChatRef.current = selectedChat;
}, [selectedChat]);

  useEffect(() => {
    if (!operatorId) return;

    const socketUrl = getSocketUrl();
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'], 
      query: { operatorId, role }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('operator_join', { operatorId });
      socket.emit('join_dashboard', { operatorId, role });
    });

    socket.on('chat_list_update', (chats) => {
        setActiveChats(chats);
        const statusUpdates = {};
        chats.forEach(chat => {
          if (chat.isOnline) {
            statusUpdates[chat.id] = 'online';
          }
        });
        if (Object.keys(statusUpdates).length > 0) {
          setStudentStatus(prev => ({ ...prev, ...statusUpdates }));
        }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

const upsertChat = (newChat) => {
  setActiveChats(prev => {
    const selected = selectedChatRef.current;

    const existingIdx = prev.findIndex(
      c => c.studentId === newChat.studentId
    );

    if (existingIdx !== -1) {
      if (selected?.id === prev[existingIdx].id) {
        setSelectedChat(newChat);
      }

      const newList = [...prev];
      newList.splice(existingIdx, 1);
      return [newChat, ...newList];
    }

    return [newChat, ...prev];
  });
};




    socket.on('chat_assigned', (chat) => {

      upsertChat(chat);
      socket.emit('join_chat', { chatId: chat.id, userType: 'Counsellor' });
    });

    socket.on('chat_created', (chat) => {
      upsertChat(chat);
    //  showToast(`${chat.studentName} started a new chat session. Please have a look.`, 'info');

    });

    socket.on('chat_updated', (data) => {
      setActiveChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          if (activeChatIdRef.current === data.chatId) {
              return { ...chat, ...data, unreadCountCounsellor: 0 };
          }
          return { ...chat, ...data };
        }
        return chat;
      }));
    });

    socket.on('new_message', (msg) => {
      setCurrentChatMessages(prev => {
        const chatMsgs = prev[msg.chatId] || [];
        if (chatMsgs.find(m => m.id === msg.id)) return prev;
        return { ...prev, [msg.chatId]: [...chatMsgs, msg] };
      });

      const isActive = (activeChatIdRef.current === msg.chatId);

      if (isActive && msg.senderType === 'Student') {
          socket.emit('mark_read', { chatId: msg.chatId, userType: 'Operator' });
      }

      setActiveChats(prev => prev.map(chat => {
        if (chat.id === msg.chatId) {
           const newUnread = (msg.senderType === 'Student' && !isActive) 
               ? (chat.unreadCountCounsellor || 0) + 1 
               : 0; 
           return { 
               ...chat, 
               lastMessage: msg.content, 
               lastMessageAt: msg.createdAt,
               unreadCountCounsellor: newUnread
           };
        }
        return chat;
      }));
    });

    socket.on('messages_read', ({ chatId, readerType }) => {
        if (readerType === 'Student') {
             setCurrentChatMessages(prev => {
                 const chatMsgs = prev[chatId];
                 if (!chatMsgs) return prev;
                 return { ...prev, [chatId]: chatMsgs.map(m => ({ ...m, isRead: true })) };
             });
        } else if (readerType === 'Operator') {
             setActiveChats(prev => prev.map(c => {
                 if (c.id === chatId) return { ...c, unreadCountCounsellor: 0 };
                 return c;
             }));
        }
    });

    socket.on('user_status', ({ chatId, userType, status }) => {
        if (userType === 'Student') {
            setStudentStatus(prev => ({ ...prev, [chatId]: status }));
        }
    });

    socket.on('messages_delivered', ({ chatId, userType }) => {
        if (userType === 'Student') {
            setCurrentChatMessages(prev => {
                const chatMsgs = prev[chatId];
                if (!chatMsgs) return prev;
                return {
                    ...prev,
                    [chatId]: chatMsgs.map(m => {
                        if (m.senderType === 'Operator' && !m.isRead) {
                            return { ...m, isDelivered: true };
                        }
                        return m;
                    })
                };
            });
        }
    });

    socket.on('chat_closed', ({ chatId, closedBy,name }) => {
        const status = closedBy === 'STUDENT' ? 'CLOSED_BY_STUDENT' : 'CLOSED_BY_COUNSELLOR';
        setActiveChats(prev => prev.map(c => {
            if (c.id === chatId) return { ...c, status };
            return c;
        }));
       if(closedBy === 'STUDENT') {
        showToast(`${name} has closed the chat.`, 'info');
       }
      });

    socket.on('typing_status', ({ chatId, isTyping, userType }) => {
        if (userType === 'Student') {
            setTypingUsers(prev => ({ ...prev, [chatId]: isTyping }));
        }
    });

    return () => {
      socket.disconnect();
    };
  }, [operatorId, role]);

  const sendMessage = useCallback((chatId, content) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        chatId, content, senderType: 'Operator', senderId: operatorId, senderName: operatorName
      });
    }
  }, [isConnected, operatorId, role, operatorName]);

  const sendTyping = useCallback((chatId, isTyping) => {
    if (socketRef.current) {
        socketRef.current.emit('typing', { chatId, isTyping, userType: 'Operator' });
    }
  }, []);

  const markRead = useCallback((chatId) => {
    if (socketRef.current) {
        socketRef.current.emit('mark_read', { chatId, userType: 'Operator' });
        setActiveChats(prev => prev.map(c => {
            if (c.id === chatId) return { ...c, unreadCountCounsellor: 0 };
            return c;
        }));
    }
  }, []);

  const joinChatRoom = useCallback((chatId) => {
      activeChatIdRef.current = chatId;
      
      if (socketRef.current) {
          socketRef.current.emit('join_chat', { chatId, userType: 'Counsellor' });
      }
  }, []);

  return { selectedChat, setSelectedChat,isConnected, activeChats, setActiveChats, currentChatMessages, setCurrentChatMessages, sendMessage, joinChatRoom, sendTyping, typingUsers, markRead, studentStatus };
};
