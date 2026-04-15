import React, { useState } from 'react';
import { Button, Tooltip, notification } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const AIFloatButton = () => {
    const [loading, setLoading] = useState(false);
    const { user, role } = useSelector((state) => state.auth);
    const location = useLocation();

    if (location.pathname !== "/" || role !== "Supervisor") {
        return null;
    }

    const AI_PLATFORM_URL = import.meta.env.VITE_AI_PLATFORM_URL || "http://localhost:5173"; 
    const AI_BE_PLATFORM_URL = import.meta.env.VITE_AI_BE_PLATFORM_URL || "http://localhost:5000/api/auth"; 

    const handleSSO = async () => {
        if (!user || !user.id) {
            notification.error({ message: "Auth Error", description: "User ID not found" });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${AI_BE_PLATFORM_URL}/sso/initiate`, { id: user.id });
            const { token } = response.data;

            if (token) {
                const ssoUrl = `${AI_PLATFORM_URL}/sso-login?token=${token}`;
                window.open(ssoUrl, '_blank');
            }
        } catch (error) {
            console.error("SSO Initiation failed:", error);
            notification.error({
                message: "AI Login Failed",
                description: error.response?.data?.error || "Could not generate SSO token"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 1000,
        }}>
            <Tooltip title="Grep SQL" placement="left">
                <Button
                    type="primary"
                    shape="circle"
                    icon={<RobotOutlined style={{ fontSize: '24px' }} />}
                    loading={loading}
                    onClick={handleSSO}
                    style={{
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1677ff', 
                        border: 'none',
                        boxShadow: '0 2px 1px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }}
                />
            </Tooltip>
        </div>
    );
};

export default AIFloatButton;
