import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api';
import notificationDB from '../config/notificationDB';
class WebSocketService {
  constructor() {
    this.socket = null;
    this.chatSocket = null;
    this.isConnected = false;
    this.userId = null;
    this.userRole = null;
    this.whatsappMessageHandlers = [];
    this.isManualDisconnect = false;
    
    // Audio context for better sound handling
    this.audioContext = null;
    this.audioBuffers = new Map();
    this.isAudioAllowed = false;
    this.pendingAudioQueue = [];
    
    this.sounds = {
      googleLead: '/sounds/fresh-google-lead.mp3',
      regularLead: '/sounds/fresh-lead.mp3',
      whatsapp: '/sounds/watsaap-notification.mp3',
      callback: '/sounds/callback-tune.mp3'
    };

    if (!sessionStorage.getItem('socket_session_id')) {
      sessionStorage.setItem('socket_session_id',
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    this.sessionId = sessionStorage.getItem('socket_session_id');
    
    // Initialize audio system
    this.initAudioSystem();
    
    // Listen for user interaction to enable audio
    this.setupAudioPermissionListener();
  }

  // Initialize audio system
  initAudioSystem() {
    try {
      // Create audio context (suspended by default)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 Audio context created (suspended)');
      
      // Preload sound buffers
      this.preloadSounds();
    } catch (error) {
      console.error('❌ Failed to create audio context:', error);
    }
  }

  // Setup user interaction listener to enable audio
  setupAudioPermissionListener() {
    const enableAudio = () => {
      this.isAudioAllowed = true;
      
      // Resume audio context if it exists and is suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('✅ Audio context resumed after user interaction');
          
          // Play any pending audio from queue
          this.processAudioQueue();
        }).catch(error => {
          console.error('❌ Failed to resume audio context:', error);
        });
      }
      
      // Process pending audio queue
      this.processAudioQueue();
    };

    // Listen for various user interactions
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
    interactionEvents.forEach(event => {
      window.addEventListener(event, enableAudio, { once: true });
    });

    // Also check if we can already play audio (e.g., page was already interacted with)
    setTimeout(() => {
      if (document.hasFocus()) {
        // Try to resume immediately if page is already focused
        enableAudio();
      }
    }, 1000);
  }

  // Preload sound buffers
  async preloadSounds() {
    if (!this.audioContext) return;

    for (const [key, url] of Object.entries(this.sounds)) {
      try {
        const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
        const response = await fetch(fullUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(key, audioBuffer);
        console.log(`✅ Preloaded sound: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to preload sound ${key}:`, error);
        // Fallback to HTML5 Audio
        const audio = new Audio(url);
        audio.load();
        console.log(`📦 Loaded fallback audio for: ${key}`);
      }
    }
  }

  // Play sound with audio context (better handling)
  playSoundWithContext(soundKey, volume = 0.5) {
    // If audio is not allowed yet, queue it
    if (!this.isAudioAllowed || !this.audioContext || this.audioContext.state === 'suspended') {
      this.pendingAudioQueue.push({ soundKey, volume, timestamp: Date.now() });
      console.log(`📥 Audio queued (pending user interaction): ${soundKey}`);
      
      // Keep only recent queued sounds (last 5)
      if (this.pendingAudioQueue.length > 5) {
        this.pendingAudioQueue = this.pendingAudioQueue.slice(-5);
      }
      
      return;
    }

    try {
      const audioBuffer = this.audioBuffers.get(soundKey);
      if (!audioBuffer) {
        // Fallback to HTML5 Audio if buffer not loaded
        this.playSoundWithHTML5(soundKey, volume);
        return;
      }

      // Create source and connect to audio context
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      console.log(`🔊 Played sound via AudioContext: ${soundKey}`);
      
      // Cleanup
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error(`❌ Failed to play sound via AudioContext (${soundKey}):`, error);
      // Fallback to HTML5 Audio
      this.playSoundWithHTML5(soundKey, volume);
    }
  }

  // Fallback to HTML5 Audio
  playSoundWithHTML5(soundKey, volume = 0.5) {
    try {
      const soundUrl = this.sounds[soundKey];
      if (!soundUrl) {
        console.error(`❌ Sound URL not found for: ${soundKey}`);
        return;
      }

      const fullUrl = soundUrl.startsWith('http') ? soundUrl : window.location.origin + soundUrl;
      const audio = new Audio(fullUrl);
      audio.volume = volume;
      
      // Set preload to auto
      audio.preload = 'auto';
      
      // Try to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 Played sound via HTML5 Audio: ${soundKey}`);
          })
          .catch(error => {
            console.log(`📥 HTML5 Audio blocked, queuing: ${soundKey}`, error.message);
            // Queue for later
            this.pendingAudioQueue.push({ soundKey, volume, timestamp: Date.now() });
          });
      }
    } catch (error) {
      console.error(`❌ HTML5 Audio error (${soundKey}):`, error);
    }
  }

  // Process queued audio
  processAudioQueue() {
    if (this.pendingAudioQueue.length === 0 || !this.isAudioAllowed) return;

    console.log(`🔄 Processing ${this.pendingAudioQueue.length} queued audio files`);
    
    // Play all queued sounds
    const queueCopy = [...this.pendingAudioQueue];
    this.pendingAudioQueue = [];
    
    // Play sounds with small delay between them
    queueCopy.forEach((item, index) => {
      setTimeout(() => {
        this.playSoundWithContext(item.soundKey, item.volume);
      }, index * 300); // 300ms delay between sounds
    });
  }

  connect(userId, role) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.userId = userId;
    this.userRole = role;
    this.isManualDisconnect = false;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

      const getSocketUrl = () => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3006';
        }
        return 'https://lms-regular.degreefyd.com';
      };

    const socketUrl = getSocketUrl();
    console.log(`🔗 Connecting to: ${socketUrl}`);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
      query: {
        userId: userId,
        role: role,
        sessionId: this.sessionId
      }
    });

    this.setupSocketEventListeners();
    return this.socket;
  }

  setupSocketEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;

      setTimeout(() => {
        if (this.userId && this.userRole && this.socket.connected) {
          console.log(`👤 Logging in as ${this.userId}`);
          this.socket.emit('counsellor-login', {
            counsellorId: this.userId,
            role: this.userRole,
            sessionId: this.sessionId
          });
        }
      }, 500);
    });

    this.socket.on('login-success', (data) => {
      console.log('✅ Login successful');
    });

    this.socket.on('login-error', (data) => {
      console.error('❌ Login error:', data.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      this.isConnected = false;

      if (!this.isManualDisconnect &&
        (reason === 'transport close' || reason === 'ping timeout' || reason === 'transport error')) {
        console.log('🔄 Will auto-reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
    });

    this.socket.on('whatsapp_notification', async (data) => {
      console.log('📱 WhatsApp notification received');
      await this.handleWhatsAppMessageNotification(data);
    });

    this.socket.on('new_lead', async (data) => {
      console.log('🎯 LEAD notification received');
      await this.handleNewLeadNotification(data);
    });

    this.socket.on('callback_reminder', async (data) => {
      console.log('⏰ Callback notification received');
      await this.handleCallbackNotification(data);
    });

    this.socket.on('whatsapp_pending_notifications', async (data) => {
      console.log(`📨 Received ${data.count} pending WhatsApp notifications`);
      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          await this.handleWhatsAppMessageNotification(notification);
        }
      }
    });

    this.socket.on('lead_pending_notifications', async (data) => {
      console.log(`📝 Received ${data.count} pending lead notifications`);
      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          await this.handleNewLeadNotification(notification);
        }
      }
    });

    this.socket.on('callback_pending_notifications', async (data) => {
      console.log(`⏰ Received ${data.count} pending callback notifications`);
      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          await this.handleCallbackNotification(notification);
        }
      }
    });

    this.socket.on('tab-disconnected', (data) => {
      console.log('ℹ️ Another tab was disconnected:', data.message);
    });

    this.socket.on('multiple-tabs-detected', (data) => {
      console.log('⚠️ Multiple tabs detected, this tab will disconnect');
      this.disconnect();
    });

    this.socket.on('connection-idle', (data) => {
      console.log('⚠️ Connection idle for too long');
      this.disconnect();
    });

    // START: Added for Regular LMS Chat Notifications
    this.socket.on('global_chat_notification', (data) => {
        console.log('💬 Global Chat Notification Received:', data);
        this.handleGlobalChatNotification(data);
    });
    // END: Added for Regular LMS Chat Notifications
  }

  disconnect() {
    this.isManualDisconnect = true;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    console.log('🔌 WebSocket disconnected');
  }

  async handleWhatsAppMessageNotification(data) {
    try {
      console.log('📱 Processing WhatsApp notification:', data.id);

      await notificationDB.storeWhatsApp(data);
      this.playWhatsAppNotificationSound();

      window.dispatchEvent(new CustomEvent('whatsappMessageReceived', {
        detail: {
          type: 'whatsapp_message',
          student_id: data.student_id,
          student_name: data.student_name,
          student_phone: data.student_phone,
          counsellor_id: data.counsellor_id,
          message: data.message,
          message_preview: data.message?.substring(0, 60) || 'New WhatsApp message',
          timestamp: data.timestamp || new Date().toISOString(),
          urgency: data.urgency || 'medium',
          source: 'whatsapp',
          waba_number: data.waba_number,
          notification_type: 'whatsapp'
        }
      }));

      this.whatsappMessageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('❌ Error in WhatsApp message handler:', error);
        }
      });

      this.showBrowserNotification(
        '💬 WhatsApp Message',
        `${data.student_name || 'Student'}: ${data.message?.substring(0, 50) || 'New message'}...`,
        'whatsapp'
      );

      console.log('✅ WhatsApp notification processed');
    } catch (error) {
      console.error('❌ Error handling WhatsApp notification:', error);
    }
  }

  async handleNewLeadNotification(data) {
    try {
      console.log('🎯 Processing lead notification:', data.id);

      await notificationDB.storeLead(data);

      if (data.source === 'Google_Lead_Form' || data.source === 'Google_Lead_Form_New') {
        this.playGoogleLeadNotificationSound();
      } else {
        this.playRegularLeadNotificationSound();
      }

      window.dispatchEvent(new CustomEvent('newLeadAssigned', {
        detail: {
          type: 'new_lead',
          student_id: data.student_id,
          student_name: data.student_name,
          student_phone: data.student_phone,
          source: data.source || 'Unknown',
          timestamp: data.timestamp || new Date().toISOString(),
          notification_type: data.notification_type || 'regular_lead',
          is_premium: data.notification_type === 'premium_lead',
          counsellorId: data.counsellorId || data.counsellor_id,
          priority: data.priority || 'medium',
          icon: data.icon || '📝',
          studentStatus: data.studentStatus || 'new'
        }
      }));

      this.showBrowserNotification(
        data.notification_type === 'premium_lead' ? '🎯 Premium Lead' : '📝 New Lead',
        `${data.student_name || 'New Lead'} - ${data.source || 'Unknown source'}`,
        'lead'
      );

      console.log('✅ Lead notification processed');
    } catch (error) {
      console.error('❌ Error handling lead notification:', error);
    }
  }

  // START: Added for Regular LMS Chat Notifications
  handleGlobalChatNotification(payload) {
      const { event, data } = payload;
      
      // Play sound
      this.playChatNotificationSound();
      
      // Show Toast or Dispatch Event
      window.dispatchEvent(new CustomEvent('globalChatNotification', {
          detail: {
             ...data,
             timestamp: new Date().toISOString()
          }
      }));
      
      this.showBrowserNotification(
          data.title || 'Chat Notification',
          data.message || 'New chat activity',
          'chat'
      );
  }
  // END: Added for Regular LMS Chat Notifications

  async handleCallbackNotification(data) {
    try {
      console.log('⏰ Processing callback notification');

      await notificationDB.storeCallback(data);
      this.playCallbackNotificationSound();

      window.dispatchEvent(new CustomEvent('callbackReminder', {
        detail: {
          type: 'callback_reminder',
          target_time: data.target_time,
          students: data.students || [],
          count: data.count || data.students?.length || 1,
          timestamp: data.timestamp || new Date().toISOString(),
          notification_type: 'callback',
          is_urgent: data.is_urgent || false,
          student_names: data.student_names || [],
          counsellorId: data.counsellorId,
          immediate_count: data.immediate_count || 0
        }
      }));

      this.showBrowserNotification(
        '⏰ Callback Reminder',
        `You have ${data.count || 1} callback${data.count > 1 ? 's' : ''} scheduled`,
        'callback'
      );

      console.log('✅ Callback notification processed');
    } catch (error) {
      console.error('❌ Error handling callback notification:', error);
    }
  }

  registerWhatsAppMessageHandler(handler) {
    if (!this.whatsappMessageHandlers.includes(handler)) {
      this.whatsappMessageHandlers.push(handler);
      console.log('✅ Registered WhatsApp message handler');
    }
  }

  unregisterWhatsAppMessageHandler(handler) {
    const index = this.whatsappMessageHandlers.indexOf(handler);
    if (index > -1) {
      this.whatsappMessageHandlers.splice(index, 1);
      console.log('✅ Unregistered WhatsApp message handler');
    }
  }

  markWhatsAppMessagesAsRead(studentId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('whatsapp_messages_read', {
        studentId: studentId,
        counsellorId: this.userId,
        timestamp: new Date().toISOString()
      });
      console.log(`📱 Marking messages as read for student: ${studentId}`);
    }
  }

  // Updated sound methods to use new system
  playWhatsAppNotificationSound() {
    this.playSoundWithContext('whatsapp', 0.5);
  }

  playGoogleLeadNotificationSound() {
    this.playSoundWithContext('googleLead', 0.5);
  }

  playRegularLeadNotificationSound() {
    this.playSoundWithContext('regularLead', 0.5);
  }

  playCallbackNotificationSound() {
    this.playSoundWithContext('callback', 0.5);
  }

  playChatNotificationSound() {
    // For chat, we can use HTML5 audio directly if needed
    this.playSoundWithHTML5('whatsapp', 0.3); // Using whatsapp sound for chat
  }

  // Legacy method for compatibility (uses new system)
  playSound(url, volume = 0.5) {
    // Convert URL to sound key if possible
    const soundKey = Object.keys(this.sounds).find(key => this.sounds[key] === url);
    if (soundKey) {
      this.playSoundWithContext(soundKey, volume);
    } else {
      // Fallback to direct HTML5 Audio
      this.playSoundWithHTML5Direct(url, volume);
    }
  }

  // Direct HTML5 audio play for custom URLs
  playSoundWithHTML5Direct(url, volume = 0.5) {
    try {
      const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
      const audio = new Audio(fullUrl);
      audio.volume = volume;
      
      // Set preload
      audio.preload = 'auto';
      
      // Try to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 Played custom sound: ${url}`);
          })
          .catch(error => {
            console.log(`📥 Custom audio blocked, queuing: ${url}`, error.message);
            // Queue for later
            this.pendingAudioQueue.push({ 
              soundKey: 'custom', 
              volume, 
              timestamp: Date.now(),
              url 
            });
          });
      }
    } catch (error) {
      console.error(`❌ Custom audio error:`, error);
    }
  }

  connectChat(operatorId, role) {
    if (this.chatSocket) {
      return;
    }

    const baseUrl = BASE_URL.replace(/\/v1\/?$/, '').replace(/\/$/, '');
    const SOCKET_URL = `${baseUrl}/website-chat`;

    this.chatSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      query: { operatorId, role }
    });

    this.chatSocket.on('connect', () => {
      console.log('✅ Chat WebSocket connected');
    });

    this.chatSocket.on('chat_assigned', (chat) => {
      const normalizedRole = role?.toLowerCase();
      const isCounsellor = ['counsellor', 'agent', 'l2', 'l3', 'to'].includes(normalizedRole);

      if (isCounsellor) {
        this.handleChatNotification(chat);
      } else {
        window.dispatchEvent(new CustomEvent('chatMessageReceived', {
          detail: chat
        }));
      }
    });
  }

  handleChatNotification(data) {
    this.playChatNotificationSound();

    window.dispatchEvent(new CustomEvent('chatNotification', {
      detail: data
    }));
  }

  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
      return true;
    }
    return false;
  }

  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  testConnection() {
    if (this.socket && this.isConnected) {
      console.log('✅ WebSocket connection test: PASSED');
      console.log('Socket ID:', this.socket.id);
      console.log('User ID:', this.userId);
      console.log('User Role:', this.userRole);
      console.log('Session:', this.sessionId.substring(0, 10));
      return true;
    } else {
      console.log('❌ WebSocket connection test: FAILED');
      console.log('Connected:', this.isConnected);
      return false;
    }
  }

  showBrowserNotification(title, body, type = 'info') {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: `${type}_${Date.now()}`,
        requireInteraction: true,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        
        if (type === 'whatsapp') {
          window.dispatchEvent(new CustomEvent('openWhatsAppChatForStudent'));
        } else if (type === 'lead') {
          window.dispatchEvent(new CustomEvent('openLeadsTab'));
        } else if (type === 'callback') {
          window.dispatchEvent(new CustomEvent('openCallbacksTab'));
        }
        
        notification.close();
      };

      setTimeout(() => notification.close(), 8000);
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(title, body, type);
        }
      });
    }
  }

  // Method to manually trigger audio permission
  requestAudioPermission() {
    if (!this.isAudioAllowed) {
      console.log('🎵 Requesting audio permission...');
      
      // Create a silent audio element and play it
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='; // 1ms silent audio
      silentAudio.volume = 0;
      
      silentAudio.play().then(() => {
        console.log('✅ Audio permission granted');
        this.isAudioAllowed = true;
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        // Process queued audio
        setTimeout(() => this.processAudioQueue(), 100);
      }).catch(error => {
        console.log('❌ Audio permission still blocked, waiting for user interaction');
      });
      
      // Clean up
      setTimeout(() => {
        silentAudio.pause();
        silentAudio.src = '';
      }, 100);
    }
  }

  // Clean up resources
  destroy() {
    this.disconnect();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffers.clear();
    this.pendingAudioQueue = [];
    
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    
    console.log('🧹 WebSocketService destroyed');
  }
}

let webSocketInstance = null;

function getWebSocketService() {
  if (!webSocketInstance) {
    webSocketInstance = new WebSocketService();
    console.log('✅ Created new WebSocketService instance');
    
    // Add a global method to request audio permission
    if (window) {
      window.requestNotificationAudioPermission = () => {
        webSocketInstance.requestAudioPermission();
      };
    }
  }
  return webSocketInstance;
}

const webSocketService = getWebSocketService();
export default webSocketService;