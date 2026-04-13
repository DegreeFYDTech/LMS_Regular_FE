import React, { useState, useEffect } from 'react'
import { Table, Tag, Space, Input, Button, Card, Avatar, Badge, message, Select, Modal } from 'antd'
import { SearchOutlined, ReloadOutlined, UserOutlined, PauseCircleOutlined, PlayCircleOutlined, EditOutlined } from '@ant-design/icons'
import axios from 'axios'
import { BASE_URL } from '../config/api'
import { PhoneCall } from 'lucide-react'

const DialerBucket = () => {
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialerData, setDialerData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    fresh: 0,
    callbacks: 0,
    pause: 0
  })
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)
  const [newStage, setNewStage] = useState('')

  // Fetch dialer data from API
  const fetchDialerData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${BASE_URL}/counsellor/get-dailer-stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.data.success) {
        setDialerData(response.data.data.dialerList)
        setStats(response.data.data.stats)
      } else {
        message.error(response.data.message || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching dialer data:', error)
      message.error('Failed to fetch dialer data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDialerData()
  }, [])

  // Update stage for a counsellor
  const updateStage = async () => {
    if (!selectedCounsellor || !newStage) return
    
    setLoading(true)
    try {
      const response = await axios.put('/api/dialer/update-stage', 
        { stage: newStage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.data.success) {
        message.success('Stage updated successfully')
        setUpdateModalVisible(false)
        fetchDialerData() // Refresh data
        setSelectedCounsellor(null)
        setNewStage('')
      } else {
        message.error(response.data.message || 'Failed to update stage')
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      message.error('Failed to update stage')
    } finally {
      setLoading(false)
    }
  }

  // Get stage color and icon
  const getStageConfig = (stage) => {
    const stageConfig = {
      'fresh': { color: 'green', icon: <PlayCircleOutlined />, text: 'Fresh' },
      'callbacks': { color: 'blue', icon: <PhoneCall />, text: 'Callbacks' },
      'pause': { color: 'orange', icon: <PauseCircleOutlined />, text: 'Pause' }
    }
    return stageConfig[stage] || { color: 'default', icon: null, text: stage }
  }

  // Table columns configuration
  const columns = [
    {
      title: 'Counsellor Name',
      dataIndex: 'counsellorName',
      key: 'counsellorName',
      render: (text, record) => (
        <Space className="cursor-pointer">
          <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500">
            {text?.charAt(0).toUpperCase()}
          </Avatar>
          <span className="font-medium text-gray-700">{text}</span>
        </Space>
      )
    },
    {
      title: 'Current Stage',
      dataIndex: 'currentStage',
      key: 'currentStage',
      render: (stage, record) => {
        const config = getStageConfig(stage)
        return (
          <Badge 
            color={config.color} 
            text={
              <Space>
                {/* {config.icon} */}
                <span className="font-medium">{config.text}</span>
              </Space>
            }
          />
        )
      }
    },
    // {
    //   title: 'Counsellor ID',
    //   dataIndex: 'STUDENT_ID',
    //   key: 'STUDENT_ID',
    //   render: (id) => (
    //     <Tag color="geekblue" className="font-mono">
    //       {id}
    //     </Tag>
    //   )
    // },
 
  ]

  // Filter data based on search
  const filteredData = dialerData.filter(item =>
    item.counsellorName?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.STUDENT_ID?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.currentStage?.toLowerCase().includes(searchText.toLowerCase())
  )

  // Handle refresh
  const handleRefresh = () => {
    fetchDialerData()
  }

  return (
    <div className="dialer-bucket p-6 min-h-screen">
      <Card className="rounded-xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Dialer Bucket
            </h2>
            <p className="text-gray-500 text-sm">
              Manage and track counsellor call assignments
            </p>
          </div>
          
          <Space className="w-full md:w-auto">
            {/* <Input
              placeholder="Search by name, ID or stage..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-80"
              allowClear
            /> */}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.fresh}</div>
              <div className="text-sm opacity-90">Fresh Calls</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.callbacks}</div>
              <div className="text-sm opacity-90">Callbacks</div>
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.pause}</div>
              <div className="text-sm opacity-90">Paused</div>
            </div>
          </Card>
        </div>

        {/* Table Section */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} counsellors`,
            className: "mt-4"
          }}
          className="dialer-table"
          scroll={{ x: 800 }}
          rowClassName="hover:bg-gray-50 transition-colors duration-200"
        />
      </Card>

      {/* Update Stage Modal */}
      <Modal
        title="Update Stage"
        open={updateModalVisible}
        onOk={updateStage}
        onCancel={() => {
          setUpdateModalVisible(false)
          setSelectedCounsellor(null)
          setNewStage('')
        }}
        confirmLoading={loading}
      >
        <div className="py-4">
          <p className="mb-4">
            <strong>Counsellor:</strong> {selectedCounsellor?.counsellorName}
          </p>
          <p className="mb-4">
            <strong>Current Stage:</strong>{' '}
            <Badge 
              color={getStageConfig(selectedCounsellor?.currentStage).color}
              text={getStageConfig(selectedCounsellor?.currentStage).text}
            />
          </p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Stage
            </label>
            <Select
              className="w-full"
              value={newStage}
              onChange={setNewStage}
              options={[
                { value: 'fresh', label: 'Fresh' },
                { value: 'callbacks', label: 'Callbacks' },
                { value: 'pause', label: 'Pause' }
              ]}
            />
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .dialer-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .dialer-table .ant-table-tbody > tr > td {
          padding: 12px 16px;
        }
        
        .dialer-table .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9;
        }
        
        .ant-card {
          border-radius: 12px;
        }
        
        .ant-tag {
          border-radius: 6px;
          padding: 2px 8px;
        }
      `}</style>
    </div>
  )
}

export default DialerBucket