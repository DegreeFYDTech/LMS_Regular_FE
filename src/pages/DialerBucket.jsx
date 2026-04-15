import React, { useState, useEffect } from 'react'
import { Table, Tag, Space, Input, Button, Card, Avatar, Badge, message, Select, Modal, Drawer, DatePicker, Divider, Tooltip, Pagination, Spin, Empty, Slider } from 'antd'
import { SearchOutlined, ReloadOutlined, UserOutlined, PauseCircleOutlined, PlayCircleOutlined, EditOutlined, FilterOutlined, CalendarOutlined, StarOutlined, TeamOutlined, PhoneOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import axios from 'axios'
import { BASE_URL } from '../config/api'
import { useSearchParams } from 'react-router-dom'
import { fetchLeadOptions } from "../network/leadassignmentl2"

const { RangePicker } = DatePicker

const DialerBucket = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isLeadView = searchParams.get('isLeadView') === 'true'
  
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialerData, setDialerData] = useState([])
  const [leadsData, setLeadsData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    fresh: 0,
    callbacks: 0,
    pause: 0
  })
  const [leadsStats, setLeadsStats] = useState({
    fresh: 0,
    attempted: 0,
    inQueue: 0
  })
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)
  const [newStage, setNewStage] = useState('')
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  
  // Lead view states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: null,
    source: null,
    campaign: null,
    sourceUrl: null,
    remarkCount: null,
    churnCount: null,
    scoreRange: [0, 100] // Added score range filter
  })
  
  const [options, setOptions] = useState({
    sources: [],
    campaigns: []
  })
  
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0)

  // Fetch dialer data from API (Counsellor View)
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

  // Fetch leads data for lead view
  const fetchLeadsData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage)
      params.append('limit', pageSize)
      
      if (searchText) params.append('search', searchText)
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'))
      }
      if (filters.source && filters.source !== 'Any') params.append('source', filters.source)
      if (filters.campaign && filters.campaign !== 'Any') params.append('campaign', filters.campaign)
      if (filters.sourceUrl) params.append('sourceUrl', filters.sourceUrl)
      if (filters.remarkCount) params.append('remarkCount', filters.remarkCount)
      if (filters.churnCount) params.append('churnCount', filters.churnCount)
      
      // Add score range filter
      if (filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100)) {
        params.append('minScore', filters.scoreRange[0])
        params.append('maxScore', filters.scoreRange[1])
      }
      
      const response = await axios.get(`${BASE_URL}/scorecard/get-leads-bucket?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.data.success) {
        setLeadsData(response.data.data.leads)
        setTotalLeads(response.data.data.total)
        setLeadsStats(response.data.data.stats)
      } else {
        message.error(response.data.message || 'Failed to fetch leads data')
      }
    } catch (error) {
      console.error('Error fetching leads data:', error)
      message.error('Failed to fetch leads data')
    } finally {
      setLoading(false)
    }
  }

  // Load filter options
  const loadLeadOptions = async () => {
    try {
      const data = await fetchLeadOptions();
      setOptions({
        sources: [...(data?.data?.source || data?.data?.sources || []), "Any"],
        campaigns: [...(data?.data?.utm_campaign || data?.data?.campaign_name || []), "Any"],
      });
    } catch (error) {
      console.error("Error loading lead options:", error);
      setOptions({
        sources: ["Google", "Facebook", "Instagram", "LinkedIn", "Twitter", "Direct", "Referral", "Any"],
        campaigns: ["Summer Campaign", "Winter Campaign", "Festival Campaign", "Weekend Campaign", "Any"],
      });
    }
  };

  useEffect(() => {
    if (!isLeadView) {
      fetchDialerData()
    } else {
      fetchLeadsData()
      loadLeadOptions()
    }
  }, [isLeadView, currentPage, pageSize])

  // Update stage for a counsellor
  const updateStage = async () => {
    if (!selectedCounsellor || !newStage) return
    
    setLoading(true)
    try {
      const response = await axios.put(`${BASE_URL}/dialer/update-stage`, 
        { 
          counsellorId: selectedCounsellor._id,
          stage: newStage 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.data.success) {
        message.success('Stage updated successfully')
        setUpdateModalVisible(false)
        fetchDialerData()
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

  // Apply filters
  const applyFilters = () => {
    let count = 0
    if (filters.dateRange) count++
    if (filters.source && filters.source !== 'Any') count++
    if (filters.campaign && filters.campaign !== 'Any') count++
    if (filters.sourceUrl) count++
    if (filters.remarkCount) count++
    if (filters.churnCount) count++
    // Count score range if not default
    if (filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100)) count++
    setAppliedFiltersCount(count)
    
    setCurrentPage(1)
    fetchLeadsData()
    setFilterDrawerVisible(false)
    message.success('Filters applied successfully')
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: null,
      source: null,
      campaign: null,
      sourceUrl: null,
      remarkCount: null,
      churnCount: null,
      scoreRange: [0, 100]
    })
    setAppliedFiltersCount(0)
    setCurrentPage(1)
    setTimeout(() => {
      fetchLeadsData()
      message.info('Filters reset')
    }, 100)
  }

  // Clear single filter
  const clearFilter = (filterKey) => {
    if (filterKey === 'scoreRange') {
      setFilters(prev => ({
        ...prev,
        scoreRange: [0, 100]
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: null
      }))
    }
    setCurrentPage(1)
    setTimeout(() => {
      fetchLeadsData()
    }, 100)
  }

  // Handle page change
  const handlePageChange = (page, size) => {
    setCurrentPage(page)
    if (size !== pageSize) {
      setPageSize(size)
      setCurrentPage(1)
    }
  }

  // Get stage color and icon
  const getStageConfig = (stage) => {
    const stageConfig = {
      'fresh': { color: 'green', text: 'Fresh' },
      'callbacks': { color: 'blue', text: 'Callbacks' },
      'pause': { color: 'orange', text: 'Pause' }
    }
    return stageConfig[stage] || { color: 'default', text: stage }
  }

  // Get lead score color
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  // Dialer view columns (Counsellor View)
  const dialerColumns = [
    {
      title: 'Counsellor Name',
      dataIndex: 'counsellorName',
      key: 'counsellorName',
      width: 250,
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#3b82f6' }}>
            {text?.charAt(0).toUpperCase()}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      )
    },
    {
      title: 'Current Stage',
      dataIndex: 'currentStage',
      key: 'currentStage',
      width: 150,
      render: (stage) => {
        const config = getStageConfig(stage)
        return <Badge color={config.color} text={config.text} />
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedCounsellor(record)
            setNewStage(record.currentStage)
            setUpdateModalVisible(true)
          }}
        >
          Update
        </Button>
      )
    }
  ]

  // Lead view columns
  const leadColumns = [
    {
      title: 'Student ID',
      dataIndex: 'STUDENT_ID',
      key: 'STUDENT_ID',
      width: 130,
      fixed: 'left',
      render: (id) => (
        <Tag color="geekblue" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {id}
        </Tag>
      )
    },
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 140,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontWeight: 500 }}>{text || 'N/A'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      ellipsis: true,
      render: (source) => (
        <Tooltip title={source}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {source || 'N/A'}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Source URL',
      dataIndex: 'sourceUrl',
      key: 'sourceUrl',
      width: 180,
      ellipsis: true,
      render: (url) => url ? (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '12px' }}>
            {url.length > 35 ? `${url.substring(0, 35)}...` : url}
          </a>
        </Tooltip>
      ) : 'N/A'
    },
    {
      title: 'Campaign',
      dataIndex: 'campaignName',
      key: 'campaignName',
      width: 150,
      ellipsis: true,
      render: (campaign) => (
        <Tooltip title={campaign}>
          <Tag color="purple" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {campaign || 'N/A'}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Churn',
      dataIndex: 'churnCount',
      key: 'churnCount',
      width: 70,
      align: 'center',
      render: (count) => (
        <Badge 
          count={count || 0} 
          showZero 
          style={{ backgroundColor: count > 0 ? '#ef4444' : '#10b981' }} 
        />
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarksCount',
      key: 'remarksCount',
      width: 70,
      align: 'center',
      render: (count) => (
        <Badge 
          count={count || 0} 
          showZero 
          style={{ backgroundColor: count > 0 ? '#3b82f6' : '#9ca3af' }} 
        />
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 70,
      align: 'center',
      render: (score) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 8px',
          borderRadius: '20px',
          backgroundColor: getScoreColor(score),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          <StarOutlined style={{ fontSize: '10px', marginRight: '4px' }} />
          {score || 0}
        </div>
      )
    },
    {
      title: 'Temp',
      dataIndex: 'temp_counsellor_id',
      key: 'temp_counsellor_id',
      width: 100,
      align: 'center',
      render: (tempId) => tempId ? (
        <Tag color="orange" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
          Assigned
        </Tag>
      ) : (
        <Tag color="default" style={{ margin: 0 }}>Not Assigned</Tag>
      )
    }
  ]

  // Toggle view
  const toggleView = () => {
    if (isLeadView) {
      setSearchParams({})
    } else {
      setSearchParams({ isLeadView: 'true' })
    }
    setCurrentPage(1)
    setSearchText('')
    setFilters({
      dateRange: null,
      source: null,
      campaign: null,
      sourceUrl: null,
      remarkCount: null,
      churnCount: null,
      scoreRange: [0, 100]
    })
    setAppliedFiltersCount(0)
  }

  // Handle refresh
  const handleRefresh = () => {
    if (!isLeadView) {
      fetchDialerData()
    } else {
      fetchLeadsData()
    }
  }

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
    fetchLeadsData()
  }

  // Filter drawer content
  const filterDrawerContent = (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          Date Range
        </label>
        <RangePicker
          style={{ width: '100%' }}
          value={filters.dateRange}
          onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          placeholder={['Start Date', 'End Date']}
          format="YYYY-MM-DD"
        />
      </div>

      <Divider />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Source
        </label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select source"
          value={filters.source}
          onChange={(value) => setFilters({ ...filters, source: value })}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {options.sources.map(source => (
            <Select.Option key={source} value={source}>
              {source}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Campaign
        </label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select campaign"
          value={filters.campaign}
          onChange={(value) => setFilters({ ...filters, campaign: value })}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {options.campaigns.map(campaign => (
            <Select.Option key={campaign} value={campaign}>
              {campaign}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Source URL
        </label>
        <Input
          placeholder="Search by source URL"
          value={filters.sourceUrl}
          onChange={(e) => setFilters({ ...filters, sourceUrl: e.target.value })}
          allowClear
        />
      </div>

      <Divider />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          <StarOutlined style={{ marginRight: '8px', color: '#f59e0b' }} />
          Score Range
        </label>
        <div style={{ padding: '0 8px' }}>
          <Slider
            range
            min={0}
            max={100}
            value={filters.scoreRange}
            onChange={(value) => setFilters({ ...filters, scoreRange: value })}
            marks={{
              0: '0',
              25: '25',
              50: '50',
              75: '75',
              100: '100'
            }}
            tooltipVisible
            tipFormatter={(value) => `${value} pts`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Min: {filters.scoreRange[0]}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Max: {filters.scoreRange[1]}
            </span>
          </div>
        </div>
      </div>

      <Divider />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Remark Count
        </label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select remark count range"
          value={filters.remarkCount}
          onChange={(value) => setFilters({ ...filters, remarkCount: value })}
          allowClear
        >
          <Select.Option value="0">0 Remarks</Select.Option>
          <Select.Option value="1-5">1-5 Remarks</Select.Option>
          <Select.Option value="6-10">6-10 Remarks</Select.Option>
          <Select.Option value="10+">10+ Remarks</Select.Option>
        </Select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Churn Count
        </label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select churn count range"
          value={filters.churnCount}
          onChange={(value) => setFilters({ ...filters, churnCount: value })}
          allowClear
        >
          <Select.Option value="0">0 Churns</Select.Option>
          <Select.Option value="1-3">1-3 Churns</Select.Option>
          <Select.Option value="4-7">4-7 Churns</Select.Option>
          <Select.Option value="8+">8+ Churns</Select.Option>
        </Select>
      </div>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={resetFilters}>Reset All</Button>
        <Button type="primary" onClick={applyFilters}>Apply Filters</Button>
      </div>
    </div>
  )

  // Active filters display
  const ActiveFilters = () => {
    if (appliedFiltersCount === 0) return null
    
    return (
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {filters.dateRange && (
          <Tag closable onClose={() => clearFilter('dateRange')} color="blue">
            Date: {filters.dateRange[0]?.format('YYYY-MM-DD')} → {filters.dateRange[1]?.format('YYYY-MM-DD')}
          </Tag>
        )}
        {filters.source && filters.source !== 'Any' && (
          <Tag closable onClose={() => clearFilter('source')} color="cyan">
            Source: {filters.source}
          </Tag>
        )}
        {filters.campaign && filters.campaign !== 'Any' && (
          <Tag closable onClose={() => clearFilter('campaign')} color="purple">
            Campaign: {filters.campaign}
          </Tag>
        )}
        {filters.sourceUrl && (
          <Tag closable onClose={() => clearFilter('sourceUrl')} color="geekblue">
            URL: {filters.sourceUrl}
          </Tag>
        )}
        {filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) && (
          <Tag closable onClose={() => clearFilter('scoreRange')} color="gold">
            Score: {filters.scoreRange[0]} - {filters.scoreRange[1]}
          </Tag>
        )}
        {filters.remarkCount && (
          <Tag closable onClose={() => clearFilter('remarkCount')} color="orange">
            Remarks: {filters.remarkCount}
          </Tag>
        )}
        {filters.churnCount && (
          <Tag closable onClose={() => clearFilter('churnCount')} color="red">
            Churns: {filters.churnCount}
          </Tag>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Card style={{ borderRadius: '12px' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {isLeadView ? 'Leads Bucket' : 'Dialer Bucket'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {isLeadView 
                ? 'Manage and track leads in queue with advanced filtering' 
                : 'Manage and track counsellor call assignments'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              type={!isLeadView ? "primary" : "default"}
              onClick={toggleView}
              icon={<TeamOutlined />}
            >
              {isLeadView ? 'Switch to Dialer View' : 'Switch to Leads Bucket'}
            </Button>
            
            {isLeadView && (
              <Badge count={appliedFiltersCount} offset={[10, 0]}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                >
                  Filters
                </Button>
              </Badge>
            )}
            
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {!isLeadView ? (
          // Dialer View Stats
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Card style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.fresh}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Fresh Calls</div>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.callbacks}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Callbacks</div>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.pause}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Paused</div>
            </Card>
          </div>
        ) : (
          // Leads View Stats
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Card 
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                setFilters({ ...filters, remarkCount: '0' })
                setAppliedFiltersCount(prev => prev + 1)
                setTimeout(() => fetchLeadsData(), 100)
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.fresh}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Fresh Leads</div>
              <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>No remarks, not assigned</div>
            </Card>
            <Card 
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                setFilters({ ...filters, remarkCount: '1-5' })
                setAppliedFiltersCount(prev => prev + 1)
                setTimeout(() => fetchLeadsData(), 100)
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.attempted}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Attempted</div>
              <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>Has remarks, not assigned</div>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.inQueue}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Leads in Queue</div>
              <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>Total pending leads</div>
            </Card>
          </div>
        )}

        {/* Search Bar for Lead View */}
        {isLeadView && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                placeholder="Search by Student ID, Name, Source, or Campaign..."
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ flex: 1 }}
                size="large"
                allowClear
              />
              <Button type="primary" onClick={handleSearch} size="large">
                Search
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Display (Leads View only) */}
        {isLeadView && <ActiveFilters />}

        {/* Table Section */}
        <Spin spinning={loading}>
          <Table
            columns={isLeadView ? leadColumns : dialerColumns}
            dataSource={isLeadView ? leadsData : dialerData}
            pagination={false}
            rowKey={isLeadView ? "STUDENT_ID" : "_id"}
            scroll={{ x: isLeadView ? 1100 : 550 }}
            locale={{
              emptyText: <Empty description={isLeadView ? "No leads found" : "No counsellors found"} />
            }}
          />
        </Spin>

        {/* Pagination for Lead View */}
        {isLeadView && totalLeads > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalLeads}
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `Total ${total} leads`}
              pageSizeOptions={['20', '50', '100', '200']}
            />
          </div>
        )}
      </Card>

      {/* Update Stage Modal (Dialer View only) */}
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
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>Counsellor:</strong> {selectedCounsellor?.counsellorName}
          </p>
          <p style={{ marginBottom: '16px' }}>
            <strong>Current Stage:</strong>{' '}
            <Badge 
              color={getStageConfig(selectedCounsellor?.currentStage).color}
              text={getStageConfig(selectedCounsellor?.currentStage).text}
            />
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              New Stage
            </label>
            <Select
              style={{ width: '100%' }}
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

      {/* Filter Drawer for Lead View */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><FilterOutlined style={{ marginRight: '8px' }} /> Filter Leads</span>
            <Button type="link" onClick={resetFilters} icon={<CloseOutlined />}>
              Reset All
            </Button>
          </div>
        }
        placement="right"
        width={450}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
      >
        {filterDrawerContent}
      </Drawer>
    </div>
  )
}

export default DialerBucket