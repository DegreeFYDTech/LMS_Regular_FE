import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Search,
  X,
  CheckCheck,
  Check,
  Send,
  Smile,
  MailCheck,
} from "lucide-react";
import { BASE_URL } from "../config/api";

const POLLING_INTERVAL = 5000;
const DEBOUNCE_DELAY = 300;
const COUNTRY_CODE = "91";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const formatTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const buildTemplatePlainText = (templateData) => {
  if (!templateData?.components) return "Template message";

  const parts = [];
  const header = templateData.components.find(
    (c) => c.type === "HEADER" && c.format === "TEXT",
  );
  if (header?.text) parts.push(header.text);

  const body = templateData.components.find((c) => c.type === "BODY");
  if (body?.text) parts.push(body.text);

  const footer = templateData.components.find((c) => c.type === "FOOTER");
  if (footer?.text) parts.push(footer.text);

  return parts.join("\n\n");
};

const WhatsAppChatInterface = ({ student, setOpenwhatsappPopup ,setOpenChatModal}) => {
  const hasUnreadMessages = student?.number_of_unread_messages > 0;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showMarkReadButton, setShowMarkReadButton] =
    useState(hasUnreadMessages);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const pollingIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const abortControllerRef = useRef(null);
  const componentMountedRef = useRef(true);
  const notificationShownRef = useRef(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const toNumber = useMemo(() => {
    const phone = student?.student_phone;
    if (!phone) return "";
    const cleanPhone = phone.replace(/\D/g, "");
    return `${COUNTRY_CODE}${cleanPhone}`;
  }, [student?.student_phone]);

  useEffect(() => {
    setShowMarkReadButton(student?.number_of_unread_messages > 0);
  }, [student?.number_of_unread_messages]);

  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
      stopPolling();
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (toNumber) {
      initializeChat();
    }
    return () => {
      stopPolling();
    };
  }, [toNumber]);

  useEffect(() => {
    if (toNumber && messages.length > 0 && !sending) {
      markMessagesAsReadDebounced();
    }
  }, [toNumber, messages.length, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [newMessage]);

  const makeApiCall = useCallback(async (url, options = {}) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: { "Content-Type": "application/json", ...options.headers },
      });

      if (!componentMountedRef.current) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") return null;
      throw error;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      if (toNumber && componentMountedRef.current) {
        const now = Date.now();
        if (now - lastFetchTimeRef.current > POLLING_INTERVAL) {
          checkForNewMessages();
        }
      }
    }, POLLING_INTERVAL);
  }, [toNumber]);

  const initializeChat = useCallback(async () => {
    if (!toNumber) return;
    try {
      await Promise.all([
        fetchTemplates(),
        fetchMessages(),
        fetchUnreadMessages(),
      ]);
      startPolling();
    } catch (error) {}
  }, [toNumber, startPolling]);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const data = await makeApiCall(`${BASE_URL}/whatsapp/getUnreadMessages`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (data?.totalUnreadCount !== undefined) {
        setTotalUnreadCount(data.totalUnreadCount);
      }
    } catch (err) {}
  }, []);

  // MARK AS READ FUNCTION - Uses your existing endpoint
  const markAllAsRead = useCallback(async () => {
    if (!toNumber || markingAsRead) return;

    setMarkingAsRead(true);
    try {
      const response = await fetch(`${BASE_URL}/whatsapp/markMessagesAsRead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherParticipantNumber: student?.student_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      const data = await response.json();

      // Update local state
      setShowMarkReadButton(false);
      setTotalUnreadCount(0);

      // If you have a callback to update parent component, call it here
      // Example: onMarkAsRead?.(student.student_id);

      // Refresh messages to update read status
      await fetchMessages();

      console.log("Marked as read successfully:", data);

      // Show success message
      if (data.success) {
        // You could add a toast notification here
        console.log(`${data.markedCount} messages marked as read`);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      alert("Failed to mark messages as read. Please try again.");
    } finally {
      setMarkingAsRead(false);
    }
  }, [toNumber, markingAsRead]);

  const markMessagesAsReadDebounced = useMemo(
    () =>
      debounce(async () => {
        if (!toNumber) return;
        try {
          await makeApiCall(`${BASE_URL}/whatsapp/markMessagesAsRead`, {
            method: "POST",
            body: JSON.stringify({
              otherParticipantNumber: student?.student_id,
            }),
          });
          setTotalUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {}
      }, DEBOUNCE_DELAY),
    [toNumber],
  );

  const transformMessages = useCallback((backendMessages) => {
    return backendMessages.map((msg) => {
      const backendType = msg.message_type || msg.messageType || msg.type || "";
      const isTemplate = backendType === "template";

      let templateData = null;
      let displayText = msg.message;

      if (isTemplate) {
        try {
          const parsed =
            typeof msg.message === "string"
              ? JSON.parse(msg.message)
              : msg.message;
          if (parsed.template?.length > 0) {
            templateData = parsed.template[0];
            displayText = buildTemplatePlainText(templateData);
          } else {
            displayText = "Template message";
          }
        } catch (e) {
          displayText = "Template message";
        }
      }

      const isFromMe = msg.direction === "sent";

      return {
        id: msg._id || msg.message_id || Date.now() + Math.random(),
        type: isTemplate ? "template" : backendType,
        text: displayText,
        template: templateData,
        timestamp: new Date(msg.timestamp),
        status: "delivered",
        from: isFromMe ? "me" : "them",
        sender: msg.sender,
        receiver: msg.receiver,
        direction: msg.direction,
        isRead: msg.isRead ?? msg.is_read ?? true,
        readAt: msg.readAt ?? msg.read_at,
        rawMessage: msg.message,
      };
    });
  }, []);

  const checkForNewMessages = useCallback(async () => {
    if (!toNumber || !componentMountedRef.current) return;

    try {
      const data = await makeApiCall(`${BASE_URL}/whatsapp/getMessages`, {
        method: "POST",
        body: JSON.stringify({ student_id: student?.student_id }),
      });

      if (!data) return;

      const newMessageCount = data.messages?.length || 0;
      lastFetchTimeRef.current = Date.now();
      setIsLocked(data.isLocked || false);

      if (newMessageCount > lastMessageCountRef.current) {
        const transformedMessages = transformMessages(data.messages || []);
        if (componentMountedRef.current) {
          setMessages(transformedMessages);
          // Show mark as read button if new messages come in
          if (newMessageCount > 0 && lastMessageCountRef.current > 0) {
            setShowMarkReadButton(true);
            showNewMessageNotification(transformedMessages);
          }
        }
        lastMessageCountRef.current = newMessageCount;
      }

      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
    }
  }, [toNumber, transformMessages]);

  const showNewMessageNotification = useCallback(
    (messages) => {
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      if (notificationShownRef.current) return;
      notificationShownRef.current = true;

      const newMessage = messages[messages.length - 1];
      if (!newMessage || newMessage.from === "me") return;

      try {
        new Notification(
          `New message from ${student?.student_name || "Contact"}`,
          {
            icon: "/whatsapp-icon.png",
            body: newMessage.text?.substring(0, 50) || "New message received",
            tag: `whatsapp-${toNumber}`,
          },
        );
        setTimeout(() => {
          notificationShownRef.current = false;
        }, 5000);
      } catch (error) {
        notificationShownRef.current = false;
      }
    },
    [student?.student_name, toNumber],
  );

  const fetchMessages = async () => {
    if (!toNumber) return;
    try {
      const response = await fetch(`${BASE_URL}/whatsapp/getMessages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student?.student_id }),
      });

      if (!response.ok) return;

      const data = await response.json();
      const transformedMessages = transformMessages(data.messages);
      setMessages(transformedMessages);
      lastMessageCountRef.current = transformedMessages.length;

      // Check if there are any unread messages from the other participant
      const hasUnreadFromOther = transformedMessages.some(
        (msg) => !msg.isRead && msg.from === "them",
      );
      if (hasUnreadFromOther) {
        setShowMarkReadButton(true);
      }
    } catch (err) {}
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/whatsapp/getTemplates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setError("Failed to load templates");
        return;
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateById = useCallback(async (templateName) => {
    try {
      const data = await makeApiCall(`${BASE_URL}/whatsapp/getTemplatesById`, {
        method: "POST",
        body: JSON.stringify({ templateid: templateName }),
      });

      if (data?.data?.template?.[0]) {
        setSelectedTemplate(data.data.template[0]);
        setNewMessage(buildTemplatePlainText(data.data.template[0]));
      } else {
        throw new Error("No template data found");
      }
    } catch (err) {
      alert("Error loading template details");
    }
  }, []);

  const sendTemplate = useCallback(async () => {
    if (!toNumber || !student?.student_id) {
      alert("Missing required information");
      return;
    }

    if (!selectedTemplate) return;

    setSending(true);
    try {
      const imageComponent = selectedTemplate.components?.find(
        (c) => c.type === "HEADER" && c.format === "IMAGE",
      );
      const payload = {
        student: student.student_id,
        whatsapptosend: [
          {
            to: toNumber,
            templateid: selectedTemplate.name,
            url: imageComponent?.example?.header_handle?.[0] || "",
            filename: "",
            smsgid: "Nuvora",
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/whatsapp/send-media-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send template");
      }

      setSelectedTemplate(null);
      setNewMessage("");
      await Promise.all([fetchMessages(), fetchUnreadMessages()]);
    } catch (err) {
      alert(err.message || "Error sending template");
    } finally {
      if (componentMountedRef.current) {
        setSending(false);
      }
    }
  }, [toNumber, student?.student_id, selectedTemplate]);

  const sendTextMessage = useCallback(async () => {
    if (!newMessage.trim() || !toNumber || sending) return;

    setSending(true);
    try {
      const payload = {
        sessiondata: {
          to: student.student_id,
          type: "text",
          message: { text: newMessage },
        },
      };

      const response = await fetch(
        `${BASE_URL}/whatsapp/send-session-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      setNewMessage("");
      await Promise.all([fetchMessages(), fetchUnreadMessages()]);
    } catch (err) {
      alert(err.message || "Error sending message");
    } finally {
      if (componentMountedRef.current) {
        setSending(false);
      }
    }
  }, [newMessage, toNumber, sending]);

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const searchLower = searchTerm.toLowerCase();
    return templates.filter(
      (template) =>
        template.name?.toLowerCase().includes(searchLower) ||
        template.components?.some((comp) =>
          comp.text?.toLowerCase().includes(searchLower),
        ),
    );
  }, [templates, searchTerm]);

  const renderReadStatus = useCallback((message) => {
    if (message.status === "sent")
      return <Check className="w-3 h-3 opacity-60" />;
    if (message.status === "delivered")
      return <CheckCheck className="w-3 h-3 opacity-60" />;
    if (message.status === "read")
      return <CheckCheck className="w-3 h-3 text-blue-400" />;
    return null;
  }, []);

  const renderMessage = useCallback(
    (message) => {
      const isFromMe = message.from === "me";

      if (message.type === "template") {
        return (
          <div
            key={message.id}
            className={`flex mb-3 ${isFromMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-sm shadow-sm relative text-sm font-helvetica ${
                isFromMe
                  ? "bg-green-200 text-black rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
              }`}
            >
              {message.template?.name && (
                <div className="text-xs bg-gray-600 text-white px-2 py-1 rounded-full mb-2 inline-block">
                  Template: {message.template.name.replace(/_/g, " ")}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap mb-2">
                {message.text}
              </div>
              <div
                className={`flex items-center justify-end space-x-1 text-xs opacity-75 mt-2 ${isFromMe ? "text-gray-600" : "text-gray-500"}`}
              >
                <span>{formatTime(message.timestamp)}</span>
                {isFromMe && renderReadStatus(message)}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={message.id}
          className={`flex mb-3 ${isFromMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`px-4 py-2 rounded-2xl max-w-sm shadow-sm relative text-sm font-helvetica ${
              isFromMe
                ? "bg-green-200 text-black rounded-br-md"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
            }`}
          >
            <div className="whitespace-pre-wrap leading-relaxed mb-1">
              {message.text}
            </div>
            <div
              className={`flex items-center justify-end space-x-1 text-xs opacity-75 ${isFromMe ? "text-gray-600" : "text-gray-500"}`}
            >
              <span>{formatTime(message.timestamp)}</span>
              {isFromMe && renderReadStatus(message)}
            </div>
          </div>
        </div>
      );
    },
    [renderReadStatus],
  );

  const handleTemplateClick = useCallback(
    (template) => {
      fetchTemplateById(template.name);
    },
    [fetchTemplateById],
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (selectedTemplate) {
          sendTemplate();
        } else {
          sendTextMessage();
        }
      }
    },
    [selectedTemplate, sendTemplate, sendTextMessage],
  );

  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
  }, []);

  const ConnectionStatus = useMemo(
    () => (
      <div className="flex items-center text-xs ml-4">
        <div
          className={`w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-gray-600">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    ),
    [isConnected],
  );

  const UnreadBadge = useMemo(
    () =>
      totalUnreadCount > 0 ? (
        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
          {totalUnreadCount}
        </span>
      ) : null,
    [totalUnreadCount],
  );

  if (!student) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-10 flex items-center justify-center z-50 p-4 font-helvetica">
      {/* Floating Mark as Read Button */}
      {showMarkReadButton && (
        <button
          onClick={markAllAsRead}
          disabled={markingAsRead}
          className="fixed z-60 bottom-20 right-1/2 transform translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-300 animate-bounce"
          style={{
            animationDuration: "2s",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <MailCheck className="w-4 h-4" />
          {markingAsRead ? (
            <>
              <span className="ml-1">Marking...</span>
              <div className="ml-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <span className="ml-1">Mark as Read</span>
              {student.number_of_unread_messages > 0 && (
                <span className="ml-2 bg-white text-green-600 text-xs rounded-full px-2 py-0.5">
                  {student.number_of_unread_messages}
                </span>
              )}
            </>
          )}
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex overflow-hidden">
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="bg-gray-50 text-black p-4 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-bold tracking-tight text-green-600">
                WhatsApp
              </h2>
              {UnreadBadge}
              {ConnectionStatus}
            </div>
            <button
              onClick={setOpenChatModal ? () => setOpenChatModal(false) : null}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && templates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                <p className="text-sm">Loading templates...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <div className="mb-3 text-sm">Error: {error}</div>
                <button
                  onClick={fetchTemplates}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">
                  {searchTerm
                    ? "No matching templates"
                    : "No templates available"}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`px-4 py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.name === template.name
                      ? "bg-green-50 border-l-4 border-l-green-500"
                      : ""
                  }`}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-sm text-gray-900 flex-1 leading-relaxed">
                      {template.name.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-gray-500">Template</div>
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {template.components
                      ?.find((c) => c.type === "BODY")
                      ?.text?.substring(0, 80) || "No preview available"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <div className="font-medium text-gray-900">
                  {student.student_name}
                </div>
              </div>
            </div>
            {/* Optional: Add a button in header too */}
            {showMarkReadButton && (
              <button
                onClick={markAllAsRead}
                disabled={markingAsRead}
                className="text-xs flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                <MailCheck className="w-3 h-3" />
                {markingAsRead ? "Marking..." : "Mark Read"}
              </button>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto p-6"
            style={{
              backgroundImage: `linear-gradient(rgba(228, 220, 212, 0.9), rgba(228, 220, 212, 0.9)),
              linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.4)),
              linear-gradient(to bottom, #e8d8c3, #cbb7a2),
              url("https://raw.githubusercontent.com/KarenOk/whatsapp-web-clone/refs/heads/main/src/assets/images/bg-chat-light.png")`,
              backgroundBlendMode: "normal, overlay, overlay, normal",
              backgroundRepeat: "repeat",
              backgroundSize: "auto",
              backgroundColor: "#E4DCD4",
            }}
          >
            {selectedTemplate && (
              <div className="flex justify-end mb-4">
                <div className="bg-green-200 text-black p-4 rounded-2xl rounded-br-md max-w-sm shadow-md relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {selectedTemplate.name}
                    </div>
                    <div className="text-xs bg-gray-600 text-white px-2 py-1 rounded-full">
                      Preview
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {buildTemplatePlainText(selectedTemplate)}
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 ? (
              <>
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </>
            ) : !selectedTemplate ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <div className="text-lg font-medium mb-2">
                    No messages yet
                  </div>
                  <div className="text-sm">
                    Send your first message or select a template
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            {selectedTemplate ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="text-sm whitespace-pre-wrap">
                    {buildTemplatePlainText(selectedTemplate)}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={sendTemplate}
                    disabled={sending}
                    className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {sending ? "Sending..." : "Send Template"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setNewMessage("");
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isLocked !== true ? (
              <div className="flex items-end space-x-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-gray-100 rounded-full pl-4 pr-2 py-2 flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm max-h-24"
                    rows="1"
                    style={{ minHeight: "24px" }}
                  />
                  <button
                    onClick={sendTextMessage}
                    disabled={sending || !newMessage.trim()}
                    className={`ml-2 p-2 rounded-full transition-colors ${
                      newMessage.trim()
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-2">
                Chat is locked. Cannot send messages.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(WhatsAppChatInterface);
