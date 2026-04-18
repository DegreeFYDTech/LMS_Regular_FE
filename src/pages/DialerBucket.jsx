// DialerBucket.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Table, Tag, Space, Input, Button, Card, Avatar, Badge, message, Select, Modal, Drawer, DatePicker, Divider, Tooltip, Pagination, Spin, Empty, Slider, Tabs, Switch } from 'antd'
import { SearchOutlined, ReloadOutlined, UserOutlined, EditOutlined, FilterOutlined, CalendarOutlined, StarOutlined, TeamOutlined, CloseOutlined, ClockCircleOutlined, RocketOutlined, PhoneOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import { BASE_URL } from '../config/api'
import { useSearchParams } from 'react-router-dom'
import { fetchLeadOptions } from "../network/leadassignmentl2"

const { RangePicker } = DatePicker
const { Option } = Select

const DialerBucket = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isLeadView = searchParams.get('isLeadView') === 'true'

  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialerData, setDialerData] = useState([])
  const [clusterStatsData, setClusterStatsData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    fresh: 0,
    callbacks: 0,
    pause: 0
  })
  const [leadsStats, setLeadsStats] = useState({
    total: 0,
    fresh: 0,
    attempted: 0,
    freshLeadsCount: 0,
    withRulesCount: 0
  })
  const [clusterStats, setClusterStats] = useState({})
  const [freshLeads, setFreshLeads] = useState([])
  const [updateModalVisible, setUpdateModalVisible] = useState(false)
  const [selectedCounsellor, setSelectedCounsellor] = useState(null)
  const [newStage, setNewStage] = useState('')
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [freshLeadsDrawerVisible, setFreshLeadsDrawerVisible] = useState(false)
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)

  const [filters, setFilters] = useState({
    dateRange: null,
    sources: [],
    campaigns: [],
    sourceUrl: null,
    remarkCount: null,
    churnCount: null,
    scoreRange: [0, 100]
  })

  const [options, setOptions] = useState({
    sources: [],
    campaigns: []
  })

  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0)

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

      if (filters.sources && filters.sources.length > 0 && !filters.sources.includes('Any')) {
        params.append('source', filters.sources.join(','))
      }

      if (filters.campaigns && filters.campaigns.length > 0 && !filters.campaigns.includes('Any')) {
        params.append('campaign', filters.campaigns.join(','))
      }

      if (filters.sourceUrl) params.append('sourceUrl', filters.sourceUrl)
      if (filters.remarkCount) params.append('remarkCount', filters.remarkCount)
      if (filters.churnCount) params.append('churnCount', filters.churnCount)

      if (filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100)) {
        params.append('minScore', filters.scoreRange[0])
        params.append('maxScore', filters.scoreRange[1])
      }

      const response = await axios.get(`${BASE_URL}/scorecard/get-bucket-data?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        // Update stats with the new structure
        setLeadsStats({
          total: response.data.data.stats?.total || 0,
          fresh: response.data.data.stats?.fresh || 0,
          attempted: response.data.data.stats?.attempted || 0,
          freshLeadsCount: response.data.data.stats?.freshLeadsCount || 0,
          withRulesCount: response.data.data.stats?.withRulesCount || 0
        })
        setClusterStats(response.data.data.clusterStats || {})
        setFreshLeads(response.data.data.freshLeads || [])
        setTotalLeads(response.data.data.stats?.total || 0)
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

  // Auto-refresh setup
  useEffect(() => {
    // Only setup auto-refresh for dialer view (not lead view)
    if (!isLeadView && autoRefresh) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      // Set up new interval
      intervalRef.current = setInterval(() => {
        console.log('Auto-refreshing dialer data...')
        fetchDialerData()
      }, 10000) // 10 seconds
      
      console.log('Auto-refresh enabled (every 10 seconds)')
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('Auto-refresh disabled')
      }
    }
  }, [isLeadView, autoRefresh]) // Re-run when view changes or autoRefresh toggles

  // Convert clusterStats object to array for table
  useEffect(() => {
    if (clusterStats && Object.keys(clusterStats).length > 0) {
      const tableData = Object.entries(clusterStats).map(([ruleName, stats]) => ({
        key: ruleName,
        ruleName: ruleName,
        fresh: stats.fresh || 0,
        attempted: stats.attempted || 0,
        remarks1_4: stats.remarks1_4 || 0,
        remarks5_7: stats.remarks5_7 || 0,
        remarks7Plus: stats.remarks7Plus || 0,
        total: stats.total || 0
      }))
      setClusterStatsData(tableData)
    }
  }, [clusterStats])

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
  }, [isLeadView, currentPage, pageSize, JSON.stringify(filters)])

  const updateStage = async () => {
    if (!selectedCounsellor || !newStage) return

    setLoading(true)
    try {
      const response = await axios.put(`${BASE_URL}/dialer/update-stage`,
        {
          counsellorId: selectedCounsellor.key,
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

  const applyFilters = () => {
    let count = 0
    if (filters.dateRange) count++
    if (filters.sources && filters.sources.length > 0 && !filters.sources.includes('Any')) count++
    if (filters.campaigns && filters.campaigns.length > 0 && !filters.campaigns.includes('Any')) count++
    if (filters.sourceUrl) count++
    if (filters.remarkCount) count++
    if (filters.churnCount) count++
    if (filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100)) count++
    setAppliedFiltersCount(count)

    setCurrentPage(1)
    fetchLeadsData()
    setFilterDrawerVisible(false)
    message.success('Filters applied successfully')
  }

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      sources: [],
      campaigns: [],
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

  const clearFilter = (filterKey) => {
    if (filterKey === 'scoreRange') {
      setFilters(prev => ({
        ...prev,
        scoreRange: [0, 100]
      }))
    } else if (filterKey === 'sources') {
      setFilters(prev => ({
        ...prev,
        sources: []
      }))
    } else if (filterKey === 'campaigns') {
      setFilters(prev => ({
        ...prev,
        campaigns: []
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

  const getStageConfig = (stage) => {
    const stageConfig = {
      'fresh': { color: 'green', text: 'Fresh' },
      'callbacks': { color: 'blue', text: 'Callbacks' },
      'pause': { color: 'orange', text: 'Pause' }
    }
    return stageConfig[stage] || { color: 'default', text: stage }
  }

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
      title: 'Time in Stage',
      dataIndex: 'timeSinceLastRemarkFormatted',
      key: 'timeSinceLastRemarkFormatted',
      width: 150,
      render: (time) => {
        return <span>{time || 'N/A'}</span>
      }
    }
  ]

  // Table columns for rule-wise breakdown
  const ruleBreakdownColumns = [
    {
      title: 'Rule Name',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 200,
      render: (text) => (
        <Tag 
          color={text === 'Fresh Leads' ? 'green' : text === 'Unassigned' ? 'default' : 'purple'} 
          style={{ fontWeight: 500, fontSize: '14px' }}
          icon={text === 'Fresh Leads' ? <RocketOutlined /> : null}
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Fresh Leads',
      dataIndex: 'fresh',
      key: 'fresh',
      width: 120,
      align: 'center',
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: count > 0 ? '#10b981' : '#9ca3af', fontSize: '14px' }}
        />
      )
    },
    {
      title: 'Attempted',
      dataIndex: 'attempted',
      key: 'attempted',
      width: 100,
      align: 'center',
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: count > 0 ? '#f59e0b' : '#9ca3af', fontSize: '14px' }}
        />
      )
    },
    {
      title: '1-4 Remarks',
      dataIndex: 'remarks1_4',
      key: 'remarks1_4',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '14px' }}>{count}</span>
      )
    },
    {
      title: '5-7 Remarks',
      dataIndex: 'remarks5_7',
      key: 'remarks5_7',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '14px' }}>{count}</span>
      )
    },
    {
      title: '7+ Remarks',
      dataIndex: 'remarks7Plus',
      key: 'remarks7Plus',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '14px' }}>{count}</span>
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tag color="geekblue">{count}</Tag>
      )
    }
  ]

  // Fresh Leads Table Columns
  const freshLeadsColumns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      width: 150,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 200,
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#10b981' }} />
          <span>{text || 'N/A'}</span>
        </Space>
      )
    },
    {
      title: 'Lead Score',
      dataIndex: 'lead_score',
      key: 'lead_score',
      width: 100,
      align: 'center',
      render: (score) => (
        <Tag color={score >= 70 ? 'green' : score >= 40 ? 'orange' : 'red'}>
          {score || 0}
        </Tag>
      )
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source) => <Tag color="cyan">{source || 'N/A'}</Tag>
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          icon={<PhoneOutlined />}
          onClick={() => message.info(`Call ${record.student_name || record.student_id}`)}
        >
          Call
        </Button>
      )
    }
  ]

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
      sources: [],
      campaigns: [],
      sourceUrl: null,
      remarkCount: null,
      churnCount: null,
      scoreRange: [0, 100]
    })
    setAppliedFiltersCount(0)
  }

  const handleRefresh = () => {
    if (!isLeadView) {
      fetchDialerData()
    } else {
      fetchLeadsData()
    }
  }

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
          Sources (Multi-Select)
        </label>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select one or more sources"
          value={filters.sources}
          onChange={(value) => setFilters({ ...filters, sources: value })}
          allowClear
          showSearch
          optionFilterProp="children"
          maxTagCount="responsive"
        >
          {options.sources.map(source => (
            <Option key={source} value={source}>
              {source}
            </Option>
          ))}
        </Select>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          You can select multiple sources
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
          Campaigns (Multi-Select)
        </label>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select one or more campaigns"
          value={filters.campaigns}
          onChange={(value) => setFilters({ ...filters, campaigns: value })}
          allowClear
          showSearch
          optionFilterProp="children"
          maxTagCount="responsive"
        >
          {options.campaigns.map(campaign => (
            <Option key={campaign} value={campaign}>
              {campaign}
            </Option>
          ))}
        </Select>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          You can select multiple campaigns
        </div>
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
          <Option value="0">0 Remarks</Option>
          <Option value="1-5">1-5 Remarks</Option>
          <Option value="6-10">6-10 Remarks</Option>
          <Option value="10+">10+ Remarks</Option>
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
          <Option value="0">0 Churns</Option>
          <Option value="1-3">1-3 Churns</Option>
          <Option value="4-7">4-7 Churns</Option>
          <Option value="8+">8+ Churns</Option>
        </Select>
      </div>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={resetFilters}>Reset All</Button>
        <Button type="primary" onClick={applyFilters}>Apply Filters</Button>
      </div>
    </div>
  )

  const ActiveFilters = () => {
    if (appliedFiltersCount === 0) return null

    return (
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {filters.dateRange && (
          <Tag closable onClose={() => clearFilter('dateRange')} color="blue">
            Date: {filters.dateRange[0]?.format('YYYY-MM-DD')} → {filters.dateRange[1]?.format('YYYY-MM-DD')}
          </Tag>
        )}
        {filters.sources && filters.sources.length > 0 && !filters.sources.includes('Any') && (
          <Tag closable onClose={() => clearFilter('sources')} color="cyan">
            Sources: {filters.sources.join(', ')}
          </Tag>
        )}
        {filters.campaigns && filters.campaigns.length > 0 && !filters.campaigns.includes('Any') && (
          <Tag closable onClose={() => clearFilter('campaigns')} color="purple">
            Campaigns: {filters.campaigns.join(', ')}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {isLeadView ? 'Leads Bucket' : 'Dialer Bucket'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {isLeadView
                ? `Rule-wise breakdown of leads (${leadsStats.total} total leads)`
                : 'Manage and track counsellor call assignments'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!isLeadView && (
              <Tooltip title={autoRefresh ? "Auto-refresh is ON (every 10s)" : "Auto-refresh is OFF"}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    checkedChildren={<PlayCircleOutlined />}
                    unCheckedChildren={<PauseCircleOutlined />}
                    style={{ backgroundColor: autoRefresh ? '#10b981' : '#9ca3af' }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                  </span>
                </div>
              </Tooltip>
            )}
            
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
              Refresh {!isLeadView && autoRefresh && <span style={{ fontSize: '11px' }}>(Auto)</span>}
            </Button>
          </div>
        </div>

        {!isLeadView ? (
          <div>
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
              <Card style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.total}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Counsellors</div>
              </Card>
            </div>
            
            {autoRefresh && (
              <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockCircleOutlined style={{ color: '#10b981' }} />
                <span style={{ fontSize: '13px', color: '#065f46' }}>
                  Auto-refreshing every 10 seconds
                </span>
              </div>
            )}
            
            <Table
              columns={dialerColumns}
              dataSource={dialerData}
              rowKey="key"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: dialerData.length,
                onChange: (page, size) => {
                  setCurrentPage(page)
                  if (size !== pageSize) setPageSize(size)
                },
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} counsellors`
              }}
              locale={{
                emptyText: <Empty description="No counsellor data found" />
              }}
            />
          </div>

        ) : (
          <>
            {/* Top Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <Card
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => leadsStats.freshLeadsCount > 0 && setFreshLeadsDrawerVisible(true)}
                hoverable
              >
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.freshLeadsCount}</div>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>Fresh Leads</div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>No remarks, no rule assignment</div>
              </Card>
              <Card
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', textAlign: 'center' }}
              >
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.attempted}</div>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>Attempted Leads</div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>Has remarks, not assigned</div>
              </Card>
              <Card
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', textAlign: 'center' }}
              >
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{leadsStats.withRulesCount}</div>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>Rules Active</div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '8px' }}>Distinct rules in use</div>
              </Card>
            </div>

            {/* Active Filters */}
            <ActiveFilters />

            {/* Rule-wise Breakdown Table */}
            <Spin spinning={loading}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Rule-wise Breakdown
                </h3>
                <Table
                  columns={ruleBreakdownColumns}
                  dataSource={clusterStatsData}
                  pagination={false}
                  rowKey="ruleName"
                  locale={{
                    emptyText: <Empty description="No rules found" />
                  }}
                  summary={(pageData) => {
                    let totalFresh = 0
                    let totalAttempted = 0
                    let totalRemarks1_4 = 0
                    let totalRemarks5_7 = 0
                    let totalRemarks7Plus = 0
                    let totalTotal = 0

                    pageData.forEach(({ fresh, attempted, remarks1_4, remarks5_7, remarks7Plus, total }) => {
                      totalFresh += fresh || 0
                      totalAttempted += attempted || 0
                      totalRemarks1_4 += remarks1_4 || 0
                      totalRemarks5_7 += remarks5_7 || 0
                      totalRemarks7Plus += remarks7Plus || 0
                      totalTotal += total || 0
                    })

                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="center">
                            <Badge count={totalFresh} style={{ backgroundColor: '#10b981' }} />
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="center">
                            <Badge count={totalAttempted} style={{ backgroundColor: '#f59e0b' }} />
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="center">
                            <span style={{ color: '#3b82f6', fontWeight: 600 }}>{totalRemarks1_4}</span>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="center">
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{totalRemarks5_7}</span>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="center">
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>{totalRemarks7Plus}</span>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6} align="center">
                            <Tag color="geekblue">{totalTotal}</Tag>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  }}
                />
              </div>
            </Spin>
          </>
        )}
      </Card>

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

      {/* Fresh Leads Drawer */}
      <Drawer
        title={
          <div>
            <RocketOutlined style={{ marginRight: '8px', color: '#10b981' }} />
            Fresh Leads Details
            <Badge count={freshLeads.length} style={{ marginLeft: '12px', backgroundColor: '#10b981' }} />
          </div>
        }
        placement="right"
        width={800}
        onClose={() => setFreshLeadsDrawerVisible(false)}
        open={freshLeadsDrawerVisible}
      >
        <Table
          columns={freshLeadsColumns}
          dataSource={freshLeads}
          rowKey="student_id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} fresh leads`
          }}
          locale={{
            emptyText: <Empty description="No fresh leads found" />
          }}
        />
      </Drawer>
    </div>
  )
}

export default DialerBucket