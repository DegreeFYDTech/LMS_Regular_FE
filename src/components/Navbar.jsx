import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import {
  logoutCounsellor,
  logoutSupervisor,
  logoutAnalyser,
} from "../network/auth";
import webSocketService from "../utils/websocket";
import notificationDB from "../config/notificationDB";
import { BASE_URL } from "../config/api";
import BreakModel from "./modals/Break";
import {
  UserOutlined,
  BellOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  LogoutOutlined,
  MenuOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  WhatsAppOutlined,
  FireOutlined,
  UserAddOutlined,
  MessageFilled,
  PhoneOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Avatar,
  Dropdown,
  Menu,
  Button,
  Modal,
  List,
  Tag,
  Tooltip,
  notification,
} from "antd";
import WatsaapChat from "./WatsaapChat";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  // Notification states
  const [leadNotifications, setLeadNotifications] = useState([]);
  const [callbackNotifications, setCallbackNotifications] = useState([]);
  const [whatsappNotifications, setWhatsappNotifications] = useState([]);
  const [leadUnreadCount, setLeadUnreadCount] = useState(0);
  const [callbackUnreadCount, setCallbackUnreadCount] = useState(0);
  const [whatsappUnreadCount, setWhatsappUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Modal states
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showRemarkReminder, setShowRemarkReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  // WhatsApp chat modal states
  const [openChatModal, setOpenChatModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { user, role } = useSelector((state) => state.auth);
  const storedRole = localStorage.getItem("role");
  const activeRole =
    user?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2";

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const [whatsapp, leads, callbacks] = await Promise.all([
        notificationDB.getNotifications("whatsapp"),
        notificationDB.getNotifications("leads"),
        notificationDB.getNotifications("callbacks"),
      ]);

      // Parse callback notifications
      const parsedCallbacks = callbacks.map((notification) => {
        try {
          if (typeof notification.students === "string") {
            return {
              ...notification,
              students: JSON.parse(notification.students),
            };
          }
          return notification;
        } catch (error) {
          console.error("Error parsing notification:", error, notification);
          return notification;
        }
      });

      console.log("📊 Loaded notifications:", {
        whatsapp: whatsapp.length,
        leads: leads.length,
        callbacks: parsedCallbacks.length,
      });

      // ... rest of your existing code
      setCallbackNotifications(parsedCallbacks);
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      const fetchChatUnreadCount = async () => {
        try {
          const validRole = role === "agent" ? "Counsellor" : role;
          const response = await fetch(
            `${BASE_URL}/website-chat/unread-count?operatorId=${user.id}&role=${validRole}`,
          );
          if (response.ok) {
            const resData = await response.json();
            if (resData.success) {
              setChatUnreadCount(resData.data.count);
            }
          }
        } catch (error) {
          console.error("Error fetching chat count:", error);
        }
      };

      fetchChatUnreadCount();

      webSocketService.connect(user.id, role);

      const handleWhatsAppMessage = async (data) => {
        console.log("📱 WhatsApp message received:", data);
        setWhatsappUnreadCount((prev) => prev + 1);
        await loadNotifications();
      };

      webSocketService.registerWhatsAppMessageHandler(handleWhatsAppMessage);

      const handleChatMessage = () => {
        console.log("💬 Chat message received");
        setChatUnreadCount((prev) => prev + 1);
      };

      const handleChatAlert = (e) => {
        const data = e.detail;
        const name = data.studentName || data.student_name || "Student";
        const isMessage = data.messageContent || data.content;

        api.success({
          message: isMessage ? "New Message" : "New Chat",
          description: isMessage
            ? `Message received from ${name}`
            : `New chat started with ${name}`,
          icon: <MessageFilled />,
          placement: "topRight",
          duration: 3,
        });

        if (!isMessage) {
          setChatUnreadCount((prev) => prev + 1);
        }
      };

      const handleNewLead = async (event) => {
        const data = event.detail;
        console.log("📝 New lead notification:", data);
        setLeadUnreadCount((prev) => prev + 1);
        await loadNotifications();
        setLeadNotifications((prev) => [...prev, data]);
        api[data.notification_type === "premium_lead" ? "warning" : "success"]({
          message:
            data.notification_type === "premium_lead"
              ? "Priority Lead"
              : "New Lead",
          description: `${data.student_name} - ${data.source}`,
          icon:
            data.notification_type === "premium_lead" ? (
              <FireOutlined />
            ) : (
              <UserAddOutlined />
            ),
          placement: "topRight",
          duration: 4,
          style:
            data.notification_type === "premium_lead"
              ? { borderLeft: "4px solid #fa8c16" }
              : { borderLeft: "4px solid #52c41a" },
        });
        await loadNotifications();
      };

      const handleCallbackReminder = async (event) => {
        const data = event.detail;
        console.log("⏰ Callback reminder received:", data);
        setCallbackUnreadCount((prev) => prev + 1);
        await loadNotifications();

        const targetTime =
          data.targetTime ||
          data.target_time ||
          (data.students &&
            data.students[0] &&
            data.students[0].callback_time) ||
          "Unknown time";

        api.info({
          message: "Callback Reminder",
          description: `${data.count} callback(s) scheduled at ${targetTime}`,
          icon: <ClockCircleOutlined />,
          placement: "topRight",
          duration: 4,
          style: { borderLeft: "4px solid #1890ff" },
        });
      };

      const handleWhatsAppMessageFromEvent = async (event) => {
        const data = event.detail;
        console.log("📱 WhatsApp event received:", data);
        setWhatsappUnreadCount((prev) => prev + 1);
        await loadNotifications();

        api.success({
          message: "WhatsApp Message",
          description: `New message from ${data.student_name}`,
          icon: <WhatsAppOutlined style={{ color: "#25D366" }} />,
          placement: "topRight",
          duration: 4,
          style: { borderLeft: "4px solid #52c41a" },
        });
      };

      window.addEventListener("chatMessageReceived", handleChatMessage);
      window.addEventListener("globalChatNotification", handleChatAlert); // Updated event name
      window.addEventListener("newLeadAssigned", handleNewLead);
      window.addEventListener("callbackReminder", handleCallbackReminder);
      window.addEventListener(
        "whatsappMessageReceived",
        handleWhatsAppMessageFromEvent,
      );

      return () => {
        window.removeEventListener("chatMessageReceived", handleChatMessage);
        window.removeEventListener("globalChatNotification", handleChatAlert); // Updated event name
        window.removeEventListener("newLeadAssigned", handleNewLead);
        window.removeEventListener("callbackReminder", handleCallbackReminder);
        window.removeEventListener(
          "whatsappMessageReceived",
          handleWhatsAppMessageFromEvent,
        );
        webSocketService.disconnect();
      };
    }
  }, [user, role, api]);

  useEffect(() => {
    const checkRemarkTime = () => {
      const lastRemarkTime = localStorage.getItem("lastRemarkTime");
      const remarkReminderDismissed = localStorage.getItem(
        "remarkReminderDismissed",
      );
      if (lastRemarkTime) {
        const timeDiff = Date.now() - parseInt(lastRemarkTime);
        const fifteenMinutes = 15 * 60 * 1000;
        if (
          timeDiff >= fifteenMinutes &&
          user &&
          role &&
          remarkReminderDismissed !== "true"
        ) {
          setShowRemarkReminder(true);
        }
      }
    };

    let interval;
    if (activeRole !== "Supervisor") {
      checkRemarkTime();
      interval = setInterval(checkRemarkTime, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, role, activeRole]);

  const handleLogout = async () => {
    try {
      if (role === "Supervisor") {
        await logoutSupervisor();
      } else if (role === "Analyser") {
        await logoutAnalyser();
      } else {
        await logoutCounsellor();
      }
      api.success({
        message: "Logged Out",
        description: `${role} logout successful`,
        placement: "topRight",
      });
    } catch (error) {
      api.error({
        message: "Logout Failed",
        description: `${role} logout unsuccessful`,
        placement: "topRight",
      });
    }

    webSocketService.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("lastRemarkTime");
    localStorage.removeItem("remarkReminderDismissed");

    dispatch(logout());
    navigate("/login");
  };

  const markWhatsappAsRead = async (notificationId) => {
    await notificationDB.markAsRead("whatsapp", notificationId);
    setWhatsappUnreadCount((prev) => Math.max(0, prev - 1));
    await loadNotifications();
  };

  const markAllWhatsappAsRead = async () => {
    await notificationDB.markAllAsRead("whatsapp");
    setWhatsappUnreadCount(0);
    await loadNotifications();
  };

  const deleteWhatsapp = async (notificationId) => {
    const notification = whatsappNotifications.find(
      (n) => n.notification_id === notificationId,
    );
    if (notification && !notification.read) {
      setWhatsappUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await notificationDB.deleteNotification("whatsapp", notificationId);
    await loadNotifications();
  };

  const clearAllWhatsapp = async () => {
    await notificationDB.clearAll("whatsapp");
    setWhatsappUnreadCount(0);
    setWhatsappNotifications([]);
    setShowWhatsappModal(false);
  };

  const handleWhatsappNotificationClick = async (notification) => {
    await markWhatsappAsRead(notification.notification_id);

    setSelectedStudent({
      student_name: notification.student_name,
      student_phone: notification.student_phone,
      number_of_unread_messages: 1,
    });
    setOpenChatModal(true);
    setShowWhatsappModal(false);
  };

  const onCloseWhatsApp = () => {
    setOpenChatModal(false);
    setSelectedStudent(null);
  };

  const markAllLeadsAsRead = async () => {
    await notificationDB.markAllAsRead("leads");
    setLeadUnreadCount(0);
    await loadNotifications();
  };

  const deleteLead = async (notificationId) => {
    const notification = leadNotifications.find(
      (n) => n.notification_id === notificationId,
    );
    if (notification && !notification.read) {
      setLeadUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await notificationDB.deleteNotification("leads", notificationId);
    await loadNotifications();
  };

  const clearAllLeads = async () => {
    await notificationDB.clearAll("leads");
    setLeadUnreadCount(0);
    setLeadNotifications([]);
    setShowLeadModal(false);
  };

  const handleLeadNotificationClick = async (notification) => {
    await deleteLead(notification.notification_id);
    if (notification.student_id) {
      navigate(`/student/${notification.student_id}`);
    } else {
      navigate("/students");
    }
    setShowLeadModal(false);
  };

  const deleteCallback = async (notificationId) => {
    const notification = callbackNotifications.find(
      (n) => n.notification_id === notificationId,
    );
    if (notification && !notification.read) {
      setCallbackUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await notificationDB.deleteNotification("callbacks", notificationId);
    await loadNotifications();
  };

  const clearAllCallbacks = async () => {
    await notificationDB.clearAll("callbacks");
    setCallbackUnreadCount(0);
    setCallbackNotifications([]);
    setShowCallbackModal(false);
  };

  const handleCallbackNotificationClick = async (notification) => {
    console.log("Callback notification clicked:", notification);

    await deleteCallback(notification.notification_id);

    try {
      // Parse the students field if it's a string
      let students = [];
      if (typeof notification.students === "string") {
        students = JSON.parse(notification.students);
      } else if (Array.isArray(notification.students)) {
        students = notification.students;
      }

      console.log("Parsed students:", students);

      if (students && students.length > 0 && students[0].student_id) {
        console.log("Navigating to student:", students[0].student_id);
        navigate(`/student/${students[0].student_id}`);
      } else {
        console.warn("No valid student ID found, navigating to students page");
        navigate("/students");
      }
    } catch (error) {
      console.error("Error parsing students data:", error);
      // Fallback navigation
      navigate("/students");
    }

    setShowCallbackModal(false);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Just now";

    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getTargetTime = (notification) => {
    // First check for target_time or targetTime
    if (notification.target_time) return notification.target_time;
    if (notification.targetTime) return notification.targetTime;

    // If not found, try to get from first student's callback_time
    if (
      notification.students &&
      notification.students[0] &&
      notification.students[0].callback_time
    ) {
      return notification.students[0].callback_time;
    }

    return "Unknown time";
  };

  const getCallbackDate = (notification) => {
    // Try to get from first student's callback_date
    try {
      let students = [];
      if (typeof notification.students === "string") {
        students = JSON.parse(notification.students);
      } else if (Array.isArray(notification.students)) {
        students = notification.students;
      }

      if (students && students[0] && students[0].callback_date) {
        return students[0].callback_date;
      }
    } catch (error) {
      console.error("Error parsing students in getCallbackDate:", error);
    }

    // Fallback to today's date
    return new Date().toISOString().split("T")[0];
  };

  const userMenu = (
    <Menu className="w-48">
      <Menu.Item key="user-info" className="px-4 py-2 bg-blue-50">
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          <div className="mt-1">
            <Tag color="blue" className="text-xs">
              {role?.charAt(0).toUpperCase() + role?.slice(1)}
            </Tag>
          </div>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        className="text-red-600 hover:text-red-700"
      >
        <div className="flex items-center space-x-2">
          <LogoutOutlined />
          <span>Logout</span>
        </div>
      </Menu.Item>
    </Menu>
  );

  const dismissRemarkReminder = () => {
    setShowRemarkReminder(false);
    localStorage.setItem("remarkReminderDismissed", "true");
    localStorage.setItem("lastRemarkTime", Date.now().toString());
    setTimeout(
      () => {
        localStorage.removeItem("remarkReminderDismissed");
      },
      5 * 60 * 1000,
    );
  };

  return (
    <>
      {contextHolder}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img
                  className="h-10 md:h-12"
                  src="https://res.cloudinary.com/dkdkkikss/image/upload/v1745058903/logo_eqxzlm.png"
                  alt="DegreeFyd Logo"
                />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {role !== "Supervisor" && role !== "Analyser" && (
                <Tooltip title="Refresh Notifications">
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={loadNotifications}
                    loading={loading}
                    size="small"
                  />
                </Tooltip>
              )}

              {role !== "Supervisor" &&
                role !== "Analyser" &&
                role !== "to" && <BreakModel />}

              {/* Website Chat for Everyone including Supervisors */}
              {(role !== "to") && (
                <Tooltip title="Website Chat">
                  <Badge
                    count={chatUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: chatUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#52c41a",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MessageOutlined style={{ fontSize: 18 }} />}
                      className="text-gray-600 hover:text-green-600"
                      onClick={() => navigate("/website-chat")}
                    />
                  </Badge>
                </Tooltip>
              )}

              {role !== "Supervisor" &&
                role !== "Analyser" &&
                role !== "to" && (
                  <div className="flex items-center gap-3">
                    {/* Other icons removed from here if they were previously grouped */}

                    <Tooltip title="WhatsApp Messages">
                      <Badge
                        count={whatsappUnreadCount}
                        size="small"
                        overflowCount={9}
                        style={{
                          display:
                            whatsappUnreadCount > 0 ? "inline-flex" : "none",
                          backgroundColor: "#25D366",
                        }}
                      >
                        <Button
                          type="text"
                          icon={
                            <WhatsAppOutlined
                              style={{ fontSize: 18, color: "#25D366" }}
                            />
                          }
                          className="text-gray-600 hover:text-green-600 h-10"
                          onClick={() => setShowWhatsappModal(true)}
                          loading={loading}
                        />
                      </Badge>
                    </Tooltip>

                    <Tooltip title="Callback Reminders">
                      <Badge
                        count={callbackUnreadCount}
                        size="small"
                        overflowCount={9}
                        style={{
                          display:
                            callbackUnreadCount > 0 ? "inline-flex" : "none",
                          backgroundColor: "#fa8c16",
                        }}
                      >
                        <Button
                          type="text"
                          icon={
                            <ClockCircleOutlined style={{ fontSize: 18 }} />
                          }
                          className="text-gray-600 hover:text-amber-600 h-10"
                          onClick={() => setShowCallbackModal(true)}
                          loading={loading}
                        />
                      </Badge>
                    </Tooltip>

                    <Tooltip title="Lead Notifications">
                      <Badge
                        count={leadUnreadCount}
                        size="small"
                        overflowCount={9}
                        style={{
                          display: leadUnreadCount > 0 ? "inline-flex" : "none",
                          backgroundColor: "#1890ff",
                        }}
                      >
                        <Button
                          type="text"
                          icon={<BellOutlined style={{ fontSize: 18 }} />}
                          className="text-gray-600 hover:text-blue-600"
                          onClick={() => setShowLeadModal(true)}
                          loading={loading}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                )}
              {role === "to" && (
                <Tooltip title="Lead Notifications">
                  <Badge
                    count={leadUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: leadUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#1890ff",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<BellOutlined style={{ fontSize: 18 }} />}
                      className="text-gray-600 hover:text-blue-600"
                      onClick={() => setShowLeadModal(true)}
                      loading={loading}
                    />
                  </Badge>
                </Tooltip>
              )}
              <Dropdown
                overlay={userMenu}
                trigger={["click"]}
                placement="bottomRight"
              >
                <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                  <Avatar
                    size="small"
                    icon={<UserOutlined style={{ fontSize: 18 }} />}
                    className="bg-blue-100 text-blue-600"
                  />
                  <span className="font-medium text-gray-900 text-sm">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                </div>
              </Dropdown>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <>
                  <Badge
                    count={chatUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: chatUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#52c41a",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MessageOutlined />}
                      size="small"
                      onClick={() => navigate("/website-chat")}
                      loading={loading}
                    />
                  </Badge>
                  <Badge
                    count={whatsappUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: whatsappUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#25D366",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
                      size="small"
                      onClick={() => setShowWhatsappModal(true)}
                      loading={loading}
                    />
                  </Badge>
                  <Badge
                    count={callbackUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: callbackUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#fa8c16",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<ClockCircleOutlined />}
                      size="small"
                      onClick={() => setShowCallbackModal(true)}
                      loading={loading}
                    />
                  </Badge>
                  <Badge
                    count={leadUnreadCount}
                    size="small"
                    overflowCount={9}
                    style={{
                      display: leadUnreadCount > 0 ? "inline-flex" : "none",
                      backgroundColor: "#1890ff",
                    }}
                  >
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      size="small"
                      onClick={() => setShowLeadModal(true)}
                      loading={loading}
                    />
                  </Badge>
                  <Dropdown
                    overlay={userMenu}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button type="text" icon={<MenuOutlined />} />
                  </Dropdown>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* WhatsApp Messages Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WhatsAppOutlined style={{ color: "#25D366", fontSize: 20 }} />
              <span className="font-bold">WhatsApp Messages</span>
              {whatsappUnreadCount > 0 && (
                <Tag color="green" className="text-xs">
                  {whatsappUnreadCount} new
                </Tag>
              )}
            </div>
            <div className="space-x-2 mr-4">
              {whatsappUnreadCount > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={clearAllWhatsapp}
                  className="text-green-600"
                  loading={loading}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        }
        open={showWhatsappModal}
        onCancel={() => setShowWhatsappModal(false)}
        footer={null}
        width={700}
        className="notification-modal"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : whatsappNotifications.length === 0 ? (
          <div className="text-center py-8">
            <WhatsAppOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">No WhatsApp messages</p>
          </div>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-y-auto">
              <List
                dataSource={whatsappNotifications}
                renderItem={(notification) => (
                  <List.Item
                    className={`px-2 py-3 rounded-lg mb-2 transition-colors cursor-pointer hover:bg-green-50 ${!notification.read ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}
                    onClick={() =>
                      handleWhatsappNotificationClick(notification)
                    }
                    actions={[
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWhatsapp(notification.notification_id);
                          }}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <WhatsAppOutlined style={{ fontSize: 18 }} />
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-green-800">
                              {notification.student_name}
                            </span>
                            <span className="ml-3">
                              <PhoneOutlined /> {notification.student_phone}
                            </span>
                            {notification.urgency === "high" && (
                              <Tag color="red" className="ml-1 text-xs">
                                Urgent
                              </Tag>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      }
                      description={
                        <div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 mt-2">
                            <div className="flex justify-between">
                              <p className="text-gray-800 text-sm">
                                {notification.message_preview ||
                                  notification.message?.substring(0, 60)}
                                {notification.message?.length > 60 && "..."}
                              </p>
                              <div className="flex gap-3">
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            {whatsappNotifications.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Showing {whatsappNotifications.length} WhatsApp message
                  {whatsappNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Callback Reminders Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClockCircleOutlined className="text-amber-600" />
              <span className="font-bold">Callback Reminders</span>
              {callbackUnreadCount > 0 && (
                <Tag color="orange" className="text-xs">
                  {callbackUnreadCount} new
                </Tag>
              )}
            </div>
            <div className="space-x-2">
              {callbackUnreadCount > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={clearAllCallbacks}
                  className="text-amber-600"
                  loading={loading}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        }
        open={showCallbackModal}
        onCancel={() => setShowCallbackModal(false)}
        footer={null}
        width={500}
        className="notification-modal"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : callbackNotifications.length === 0 ? (
          <div className="text-center py-8">
            <ClockCircleOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">No callback reminders</p>
          </div>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-y-auto">
              <List
                dataSource={callbackNotifications}
                renderItem={(notification) => {
                  return (
                    <List.Item
                      className={`px-2 py-3 rounded-lg mb-2 transition-colors cursor-pointer ${!notification.read ? "bg-amber-50 border-l-4 border-l-amber-500" : ""} ${notification.immediate_count > 0 ? "border-l-red-500" : ""}`}
                      onClick={() =>
                        handleCallbackNotificationClick(notification)
                      }
                      actions={[
                        <Tooltip title="Delete">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCallback(notification.notification_id);
                            }}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${notification.immediate_count > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                          >
                            {notification.immediate_count > 0 ? (
                              <BellOutlined />
                            ) : (
                              <ClockCircleOutlined />
                            )}
                          </div>
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <div>
                              <span
                                className={`font-semibold ${notification.immediate_count > 0 ? "text-red-700" : "text-amber-800"}`}
                              >
                                {notification.immediate_count > 0 ? "⚡ " : ""}
                                {notification.count || 1} Callback
                                {notification.count > 1 ? "s" : ""}
                              </span>
                              <Tag
                                color={
                                  notification.immediate_count > 0
                                    ? "red"
                                    : "orange"
                                }
                                className="ml-2 text-xs"
                              >
                                {getTargetTime(notification)}
                              </Tag>
                              {notification.immediate_count > 0 && (
                                <Tag color="red" className="ml-1 text-xs">
                                  {notification.immediate_count} urgent
                                </Tag>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        }
                        description={
                          <div>
                            <div className="text-xs text-gray-600 mb-1">
                              Date: {getCallbackDate(notification)}
                            </div>

                            {notification.students &&
                              notification.students.length > 0 && (
                                <div className="mt-1 mb-2">
                                  <div className="text-xs text-gray-600 mb-1">
                                    Callback Times:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      try {
                                        let students = [];
                                        if (
                                          typeof notification.students ===
                                          "string"
                                        ) {
                                          students = JSON.parse(
                                            notification.students,
                                          );
                                        } else if (
                                          Array.isArray(notification.students)
                                        ) {
                                          students = notification.students;
                                        }

                                        return students
                                          .filter((s) => s.callback_time)
                                          .slice(0, 3)
                                          .map((student, idx) => (
                                            <Tag
                                              key={idx}
                                              color="blue"
                                              className="text-xs"
                                            >
                                              {student.callback_time}
                                            </Tag>
                                          ));
                                      } catch (error) {
                                        console.error(
                                          "Error parsing students for display:",
                                          error,
                                        );
                                        return null;
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}

                            <div className="mt-2 text-xs text-gray-500">
                              <span>{formatTime(notification.timestamp)}</span>
                              <span className="mx-1">•</span>
                              <span>{formatDate(notification.timestamp)}</span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </div>
            {callbackNotifications.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Showing {callbackNotifications.length} callback notification
                  {callbackNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Lead Notifications Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellOutlined className="text-blue-600" />
              <span className="font-bold">Lead Notifications</span>
              {leadUnreadCount > 0 && (
                <Tag color="blue" className="text-xs">
                  {leadUnreadCount} new
                </Tag>
              )}
            </div>
            <div className="space-x-2 mr-3">
              {leadUnreadCount > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={markAllLeadsAsRead}
                  className="text-blue-600"
                  loading={loading}
                >
                  Mark all read
                </Button>
              )}
              {leadNotifications.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={clearAllLeads}
                  loading={loading}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        }
        open={showLeadModal}
        onCancel={() => setShowLeadModal(false)}
        footer={null}
        width={500}
      >
        {console.log(leadNotifications)}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : leadNotifications.length === 0 ? (
          <div className="text-center py-8">
            <BellOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">No lead notifications</p>
          </div>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-y-auto">
              <List
                dataSource={leadNotifications}
                renderItem={(notification) => (
                  <List.Item
                    className={`px-2 py-3 rounded-lg mb-2 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""} ${notification.is_premium ? "border-l-red-500" : ""}`}
                    onClick={() => handleLeadNotificationClick(notification)}
                    actions={[
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLead(notification.notification_id);
                          }}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ml-2 ${notification.is_premium ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                        >
                          {notification.is_premium ? (
                            <FireOutlined />
                          ) : (
                            <UserAddOutlined />
                          )}
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <div>
                            <span
                              className={`font-semibold ${notification.is_premium ? "text-red-700" : "text-blue-800"}`}
                            >
                              {notification.is_premium
                                ? "Priority Lead"
                                : "New Lead"}
                            </span>
                            <Tag
                              color={notification.is_premium ? "red" : "blue"}
                              className="ml-2 text-xs"
                            >
                              {notification.is_premium ? "Premium" : "Regular"}
                            </Tag>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      }
                      description={
                        <div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="font-medium text-gray-900">
                              {notification.student_name}
                            </p>
                            <span className="text-sm text-gray-600">
                              <PhoneOutlined /> {notification.student_phone}
                            </span>
                            <span className="text-sm text-gray-600">
                              {notification.source}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <span>Click to view student details</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            {leadNotifications.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Showing {leadNotifications.length} lead notification
                  {leadNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {openChatModal && selectedStudent && (
        <WatsaapChat
          setOpenwhatsappPopup={onCloseWhatsApp}
          student={{
            ...selectedStudent,
            number_of_unread_messages: 1,
          }}
        />
      )}

      <Modal
        open={showRemarkReminder}
        onCancel={dismissRemarkReminder}
        footer={null}
        centered
        closable={false}
        width={400}
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">
            <BellOutlined />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-3">
            Time's Ticking!
          </h2>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Hey {user?.name}, still with us?
          </h3>
          <p className="text-gray-700 mb-6">
            It's been over <strong>15 minutes</strong> since your last remark!
            <br />
            <span className="text-red-600 font-bold">
              Let's stay productive — drop your updates now!
            </span>
          </p>
          <Button
            type="primary"
            danger
            size="large"
            block
            onClick={dismissRemarkReminder}
            className="h-12 text-lg font-bold"
          >
            I'm On It — Adding Remarks!
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
