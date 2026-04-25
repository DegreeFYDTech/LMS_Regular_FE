import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BASE_URL } from '../../config/api';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Modal,
  Card,
  Tag,
  Typography,
  Steps,
  Input,
  Badge,
  Progress,
  Avatar,
  Alert,
  notification,
  Row,
  Col,
  Radio,
  Checkbox
} from 'antd';
import {
  ClockCircleOutlined,
  CoffeeOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  SmileOutlined,
  TeamOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const BreakContext = React.createContext();

// Only Meal and Meeting break types
const BREAK_TYPES = [
  {
    id: 'meal',
    name: 'Meal Break',
    icon: <SmileOutlined />,
    color: '#10B981',
    description: 'Lunch, dinner, or snack time',
    suggestedDuration: '30-60 mins'
  },
  {
    id: 'meeting',
    name: 'Meeting',
    icon: <TeamOutlined />,
    color: '#3B82F6',
    description: 'Team meetings or appointments',
    suggestedDuration: '15-90 mins'
  }
];

// Watch Component with rotating hands
const WatchDisplay = ({ elapsedSeconds }) => {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  
  // Calculate angles for watch hands
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour, 0.5 degrees per minute
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  return (
    <div className="relative mx-auto w-64 h-64">
      {/* Watch outer ring with gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-500 to-blue-500 p-1">
        <div className="absolute inset-1 rounded-full bg-white" />
      </div>
      
      {/* Watch face */}
      <div className="absolute inset-8 rounded-full bg-white shadow-inner" />
      
      {/* Watch markers */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = i * 6; // 6 degrees per marker
        const radian = (angle - 90) * (Math.PI / 180);
        const radius = 112;
        const x = 128 + radius * Math.cos(radian);
        const y = 128 + radius * Math.sin(radian);
        const isHourMarker = i % 5 === 0;
        
        return (
          <div
            key={i}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
              isHourMarker 
                ? 'w-1.5 h-6 bg-gray-800' 
                : 'w-0.5 h-3 bg-gray-400'
            }`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            }}
          />
        );
      })}
      
  
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full z-10" />
      
     
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-32 bg-red-500 rounded-full origin-bottom z-5"
        style={{
          transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
        }}
      />
      
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg px-4 py-2 shadow-lg">
          <div className="text-white font-mono font-bold text-xl text-center">
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};



const BreakTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div className="space-y-4">
   

      <Radio.Group 
        value={selectedType?.id} 
        onChange={(e) => {
          const type = BREAK_TYPES.find(t => t.id === e.target.value);
          onSelect(type);
        }}
        className="w-full"
      >
        <Row gutter={[16, 16]}>
          {BREAK_TYPES.map((type) => (
            <Col span={24} key={type.id}>
              <Radio value={type.id} className="w-full hidden">
                {type.name}
              </Radio>
              <Card
                hoverable
                className={`border-2 cursor-pointer transition-all ${
                  selectedType?.id === type.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => onSelect(type)}
                bodyStyle={{ padding: '20px' }}
              >
                <div className="flex items-center space-x-4">
                  <Avatar
                    size="large"
                    icon={type.icon}
                    className={selectedType?.id === type.id ? 'bg-blue-500' : 'bg-gray-100'}
                    style={{
                      backgroundColor: selectedType?.id === type.id ? type.color : '#f3f4f6',
                      color: selectedType?.id === type.id ? '#fff' : type.color,
                      fontSize: '20px'
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text strong className="text-gray-800 text-lg">{type.name}</Text>
                        <div className="mt-1">
                          <Text type="secondary" className="text-sm">{type.description}</Text>
                        </div>
                      </div>
                      {selectedType?.id === type.id && (
                        <CheckOutlined className="text-blue-500 text-xl" />
                      )}
                    </div>
                    <div className="mt-3">
                      <Tag color={selectedType?.id === type.id ? "blue" : "default"}>
                        {type.suggestedDuration}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Radio.Group>
    </div>
  );
};

// Break Context Provider
const BreakContextProvider = ({ children }) => {
  const storedid = useSelector((state) => state.auth.user?.id);
  const location = useLocation();
  const [counsellor_id, setCounsellor_id] = useState(storedid);
  const [breakStatus, setBreakStatus] = useState({
    break_start: null,
    break_end: null,
    break_type: null,
    break_notes: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${BASE_URL}/counsellor/get-latest-break/${storedid}`);
        if (res.data?.success) {
          setBreakStatus(res.data.data);
          if (res.data.data?.break_start && !res.data.data?.break_end) {
            localStorage.setItem('breakActive', 'true');
          } else {
            localStorage.setItem('breakActive', 'false');
          }
        }
      } catch (error) {
        console.error('Error fetching break data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (storedid) {
      fetchdata();
    }
  }, [storedid, location.pathname, location?.search]);

  const updateBreakStatus = (newStatus) => {
    setBreakStatus(newStatus);
    if (newStatus.break_start && !newStatus.break_end) {
      localStorage.setItem('breakActive', 'true');
    } else {
      localStorage.setItem('breakActive', 'false');
    }
  };

  return (
    <BreakContext.Provider
      value={{
        ...breakStatus,
        updateBreakStatus,
        counsellor_id,
        isLoading,
      }}
    >
      {children}
    </BreakContext.Provider>
  );
};

// Main Break Component
const BreakModel = () => {
  const { break_start, break_end, break_type, break_notes, updateBreakStatus, counsellor_id } = useContext(BreakContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isOnBreak = break_start && !break_end;
  const currentBreakType = break_type ? BREAK_TYPES.find(type => type.id === break_type) : null;

  // Calculate elapsed time
  const getElapsedSeconds = () => {
    if (!break_start) return 0;
    const breakStartTime = new Date(break_start);
    return Math.floor((currentTime - breakStartTime) / 1000);
  };

  const elapsedSeconds = getElapsedSeconds();

  // Update current time every second when on break
  useEffect(() => {
    let interval;
    if (isOnBreak) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak]);

  // Open modal handler
  const showModal = () => {
    if (!isOnBreak) {
      setSelectedType(null);
      setNotes('');
      setIsModalOpen(true);
    }
  };

  // Handle start break
  const handleStartBreak = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/counsellor/break/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          break_start: new Date().toISOString(),
          break_type: selectedType.id,
          break_notes: notes || null,
          counselor_id: counsellor_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        updateBreakStatus({
          break_start: new Date().toISOString(),
          break_end: null,
          break_type: selectedType.id,
          break_notes: notes || null,
        });
        localStorage.setItem('breakActive', 'true');
        notification.success({
          message: 'Break Started',
          description: `${selectedType.name} started successfully!`,
          placement: 'topRight',
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to start break. Please try again.',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle end break
  const handleEndBreak = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/counsellor/break/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          break_end: new Date().toISOString(),
          counselor_id: counsellor_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        updateBreakStatus({
          break_start,
          break_end: new Date().toISOString(),
          break_type,
          break_notes,
        });
        localStorage.setItem('breakActive', 'false');
        notification.success({
          message: 'Break Ended',
          description: 'Break ended successfully! You are now available.',
          placement: 'topRight',
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to end break. Please try again.',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Main button render
  return (
    <div>
      {/* Break Button */}
      <Button
        type="primary"
        onClick={showModal}
        icon={isOnBreak ? <ClockCircleOutlined /> : <CoffeeOutlined />}
        className={`flex items-center justify-center gap-2 px-6 py-3 h-auto rounded-lg font-medium ${
          isOnBreak 
            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
        }`}
        size="large"
      >
        {isOnBreak ? (
          <>
            <Badge status="processing" className="mr-2" />
            {currentBreakType?.name || 'Break'} Active
            <Tag color="orange" className="ml-2 font-semibold">
              {Math.floor(elapsedSeconds / 3600)}h {Math.floor((elapsedSeconds % 3600) / 60)}m
            </Tag>
          </>
        ) : (
          'Take a Break'
        )}
      </Button>

      {/* Break Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-3">
            {isOnBreak ? (
              <>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <ClockCircleOutlined className="text-xl text-orange-600" />
                </div>
                <div>
                  <Title level={4} className="!mb-0 !text-gray-800">Active Break</Title>
                  <Text type="secondary" className="text-sm">Break is currently in progress</Text>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CoffeeOutlined className="text-xl text-blue-600" />
                </div>
                <div>
                  <Title level={4} className="!mb-0 !text-gray-800">Take a Break</Title>
                  <Text type="secondary" className="text-sm">Select break type to get started</Text>
                </div>
              </>
            )}
          </div>
        }
        open={isModalOpen || isOnBreak}
        onCancel={() => !isOnBreak && setIsModalOpen(false)}
        footer={null}
        width={600}
        closable={!isOnBreak}
        maskClosable={!isOnBreak}
        className="break-modal"
        centered
      >
        {isOnBreak ? (
          <div className="space-y-8 py-4">
            {/* WATCH DISPLAY - Center piece */}
            <div className="text-center">
              <WatchDisplay elapsedSeconds={elapsedSeconds} />
            </div>

            

            {/* End Break Button */}
            <div className="text-center">
              <Button
                type="primary"
                danger
                size="large"
                onClick={handleEndBreak}
                loading={loading}
                className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 rounded-xl"
                icon={<CheckCircleOutlined />}
              >
                End Break
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Break Type Selection */}
            <BreakTypeSelector 
              selectedType={selectedType}
              onSelect={setSelectedType}
            />

            {/* Notes Section */}
            {selectedType && (
              <div className="mt-6">
                <Text strong className="text-gray-700 mb-2 block">Notes (Optional)</Text>
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any details about your break..."
                  rows={3}
                  maxLength={200}
                  className="rounded-lg"
                />
                <Text type="secondary" className="text-right block mt-1 text-sm">
                  {notes.length}/200 characters
                </Text>
              </div>
            )}

            {/* Start Break Button */}
            <div className="pt-4">
              <Button
                type="primary"
                onClick={handleStartBreak}
                loading={loading}
                disabled={!selectedType}
                block
                size="large"
                className="py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 rounded-xl"
                icon={<PlayCircleOutlined />}
              >
                Start Break
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Main Export
const BreakModelWithProvider = () => (
  <BreakContextProvider>
    <BreakModel />
  </BreakContextProvider>
);

export default BreakModelWithProvider;