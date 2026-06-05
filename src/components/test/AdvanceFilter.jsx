import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Input,
  Button,
  Select,
  DatePicker,
  Drawer,
  Badge,
  Card,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  ConfigProvider,
  theme
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BASE_URL } from '../../config/api';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;


const filterOptions = {
  leadStatus: ['Pre Application', 'Application', 'Admission', 'Not Interested', 'Fresh'],
  leadSubStatus: [
    'Untouched Lead',
    'Counselling Yet to be Done',
    'Initial Counseling Completed',
    'Ready to Pay',
    'Form Filled_Degreefyd',
    'Form Filled_Partner website',
    'Walkin Completed',
    'Registration Done',
    'Semester Paid',
    'Multiple Attempts made',
    'Invalid number / Wrong Number',
    'Language Barrier',
    'Not Enquired',
    'Already Enrolled_Partner',
    'First call Not Interested',
    'Not Eligible',
    'Dublicate_Same student exists',
    'Only_Regular course',
    'Next Year',
    'Budget issue',
    'Already Enrolled_NP',
    'Reason not shared',
    'Location issue'
  ],
  mode: ['Online', 'Offline'],
  source: ['Website', 'Facebook', 'Google', 'Instagram', 'LinkedIn', 'Referral', 'Direct', 'WhatsApp'],
  callingStatus: ['Called', 'Not Called', 'Busy', 'No Answer', 'Invalid Number', 'Callback Scheduled'],
  subCallingStatus: ['Hot', 'Warm', 'Cold', 'Not Interested', 'Callback Required', 'Follow-up Needed'],
  campaignName: ['Campaign A', 'Campaign B', 'Campaign C', 'Holiday Sale', 'Spring Promo'],
  connectionStatus: ['Connected', 'Not Connected'],
  unreadMessages: ['true', 'false']
};

// Search Bar Component
const SearchBar = ({ value, onChange, onSearch, loading }) => (
  <div style={{ marginBottom: 16 }}>
    <Input.Search
      placeholder="Search by name, email, phone or lead ID..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onSearch={onSearch}
      enterButton={
        <Button
          type="primary"
          icon={loading ? <ReloadOutlined spin /> : <SearchOutlined />}
          loading={loading}
        >
          Search
        </Button>
      }
      size="large"
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    />
  </div>
);

// Filter Item Component
const FilterItem = ({ label, children, required = false }) => (
  <div style={{ marginBottom: 16 }}>
    <Text strong style={{ display: 'block', marginBottom: 4, color: '#1f2937' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </Text>
    {children}
  </div>
);

// Active Filters Display Component
const ActiveFilters = ({ filters, onClear, onRemoveFilter }) => {
  const getActiveFilters = () => {
    const active = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        if (key === 'createdAt_start' || key === 'createdAt_end') {
          // Skip individual date fields as we'll show them as a range
          return;
        }
        if (key.includes('createdAt') && Array.isArray(value) && value.length === 2) {
          active.push({
            key: 'dateRange',
            label: 'Date Range',
            value: `${dayjs(value[0]).format('MMM DD')} - ${dayjs(value[1]).format('MMM DD')}`
          });
        } else if (Array.isArray(value)) {
          active.push({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: `${value.length} selected`
          });
        } else {
          active.push({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value)
          });
        }
      }
    });
    return active;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>Active Filters ({activeFilters.length})</Text>
        <Button 
          type="link" 
          size="small" 
          onClick={onClear}
          icon={<ClearOutlined />}
        >
          Clear All
        </Button>
      </div>
      <Space size={[8, 8]} wrap>
        {activeFilters.map((filter) => (
          <Tag
            key={filter.key}
            closable
            onClose={() => onRemoveFilter(filter.key)}
            color="blue"
            style={{ margin: '2px', borderRadius: 12 }}
          >
            <strong>{filter.label}:</strong> {filter.value}
          </Tag>
        ))}
      </Space>
    </div>
  );
};

// Desktop Filters Component
const DesktopFilters = ({ filters, onFilterChange, filterOptions, universityOptions }) => (
  <Card style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 4px 4px rgba(0,0,0,0.05)' }}>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Date Range">
          <RangePicker
            style={{ width: '100%' }}
            value={filters.dateRange}
            onChange={(dates) => onFilterChange('dateRange', dates)}
            placeholder={['Start Date', 'End Date']}
            suffixIcon={<CalendarOutlined />}
          />
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Mode">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Mode"
            value={filters.mode}
            onChange={(value) => onFilterChange('mode', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.mode.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Source">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Source"
            value={filters.source}
            onChange={(value) => onFilterChange('source', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.source.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Lead Status">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Lead Status"
            value={filters.leadStatus}
            onChange={(value) => onFilterChange('leadStatus', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.leadStatus.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Lead Sub Status">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Lead Sub Status"
            value={filters.leadSubStatus}
            onChange={(value) => onFilterChange('leadSubStatus', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.leadSubStatus.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Connection Status">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Connection Status"
            value={filters.connectionStatus}
            onChange={(value) => onFilterChange('connectionStatus', value)}
            allowClear
          >
            {filterOptions.connectionStatus.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Calling Status">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Calling Status"
            value={filters.callingStatus}
            onChange={(value) => onFilterChange('callingStatus', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.callingStatus.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Sub Calling Status">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Sub Calling Status"
            value={filters.subCallingStatus}
            onChange={(value) => onFilterChange('subCallingStatus', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.subCallingStatus.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Unread Messages">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Unread Messages"
            value={filters.unreadMessages}
            onChange={(value) => onFilterChange('unreadMessages', value)}
            allowClear
          >
            {filterOptions.unreadMessages.map(option => (
              <Option key={option} value={option}>
                {option === 'true' ? 'Has Unread' : 'No Unread'}
              </Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="Campaign Name">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select Campaign Name"
            value={filters.campaignName}
            onChange={(value) => onFilterChange('campaignName', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filterOptions.campaignName.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <FilterItem label="University Name (Journey First Entry)">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select University"
            value={filters.universityName}
            onChange={(value) => onFilterChange('universityName', value)}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {universityOptions.map(opt => (
              <Option key={opt} value={opt}>{opt}</Option>
            ))}
          </Select>
        </FilterItem>
      </Col>
    </Row>
  </Card>
);

// Mobile Filter Drawer Component
const MobileFilterDrawer = ({ visible, onClose, filters, onFilterChange, filterOptions, universityOptions, onApply, onClear }) => (
  <Drawer
    title={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Filters</span>
        <Button type="link" onClick={onClear} icon={<ClearOutlined />}>
          Clear All
        </Button>
      </div>
    }
    placement="bottom"
    height="80vh"
    onClose={onClose}
    visible={visible}
    footer={
      <div style={{ textAlign: 'center' }}>
        <Space>
          <Button onClick={onClose} size="large">
            Cancel
          </Button>
          <Button type="primary" onClick={onApply} size="large">
            Apply Filters
          </Button>
        </Space>
      </div>
    }
  >
    <div style={{ paddingBottom: 60 }}>
      <FilterItem label="Date Range">
        <RangePicker
          style={{ width: '100%' }}
          value={filters.dateRange}
          onChange={(dates) => onFilterChange('dateRange', dates)}
          placeholder={['Start Date', 'End Date']}
          suffixIcon={<CalendarOutlined />}
        />
      </FilterItem>
      
      <FilterItem label="Mode">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Mode"
          value={filters.mode}
          onChange={(value) => onFilterChange('mode', value)}
          showSearch
        >
          {filterOptions.mode.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Source">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Source"
          value={filters.source}
          onChange={(value) => onFilterChange('source', value)}
          showSearch
        >
          {filterOptions.source.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Lead Status">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Lead Status"
          value={filters.leadStatus}
          onChange={(value) => onFilterChange('leadStatus', value)}
          showSearch
        >
          {filterOptions.leadStatus.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Lead Sub Status">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Lead Sub Status"
          value={filters.leadSubStatus}
          onChange={(value) => onFilterChange('leadSubStatus', value)}
          showSearch
        >
          {filterOptions.leadSubStatus.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Connection Status">
        <Select
          style={{ width: '100%' }}
          placeholder="Select Connection Status"
          value={filters.connectionStatus}
          onChange={(value) => onFilterChange('connectionStatus', value)}
          allowClear
        >
          {filterOptions.connectionStatus.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Calling Status">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Calling Status"
          value={filters.callingStatus}
          onChange={(value) => onFilterChange('callingStatus', value)}
          showSearch
        >
          {filterOptions.callingStatus.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Sub Calling Status">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Sub Calling Status"
          value={filters.subCallingStatus}
          onChange={(value) => onFilterChange('subCallingStatus', value)}
          showSearch
        >
          {filterOptions.subCallingStatus.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Unread Messages">
        <Select
          style={{ width: '100%' }}
          placeholder="Select Unread Messages"
          value={filters.unreadMessages}
          onChange={(value) => onFilterChange('unreadMessages', value)}
          allowClear
        >
          {filterOptions.unreadMessages.map(option => (
            <Option key={option} value={option}>
              {option === 'true' ? 'Has Unread' : 'No Unread'}
            </Option>
          ))}
        </Select>
      </FilterItem>
      
      <FilterItem label="Campaign Name">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select Campaign Name"
          value={filters.campaignName}
          onChange={(value) => onFilterChange('campaignName', value)}
          showSearch
        >
          {filterOptions.campaignName.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      </FilterItem>

      <FilterItem label="University Name (Journey First Entry)">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select University"
          value={filters.universityName}
          onChange={(value) => onFilterChange('universityName', value)}
          showSearch
        >
          {universityOptions.map(opt => (
            <Option key={opt} value={opt}>{opt}</Option>
          ))}
        </Select>
      </FilterItem>
    </div>
  </Drawer>
);

// Main Component
const EnhancedFilters = ({
  filters: initialFilters = {},
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  loading = false
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [universityOptions, setUniversityOptions] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/StudentCourseStatusLogs/colleges-list`, { withCredentials: true })
      .then(res => { if (res.data.success) setUniversityOptions(res.data.data || []); })
      .catch(() => {});
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync with parent filters
  useEffect(() => {
    setFilters(initialFilters);
    setSearchTerm(initialFilters.searchTerm || '');
  }, [initialFilters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange?.(key, value);
  };

  // Handle search
  const handleSearch = () => {
    const updatedFilters = { ...filters, searchTerm };
    setFilters(updatedFilters);
    onApplyFilters?.(updatedFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    setSearchTerm('');
    onClearFilters?.();
  };

  // Handle remove single filter
  const handleRemoveFilter = (key) => {
    if (key === 'dateRange') {
      handleFilterChange('dateRange', null);
    } else {
      handleFilterChange(key, Array.isArray(filters[key]) ? [] : '');
    }
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
   <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        minHeight: '50vh'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
           
            <Text type="secondary">
              Search and filter your leads with advanced options
            </Text>
          </div>

          {/* Search Bar */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            loading={loading}
          />

          {/* Mobile Filter Button */}
          {isMobile && (
            <div style={{ marginBottom: 16 }}>
              <Badge count={activeFilterCount} offset={[10, 0]}>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  size="large"
                  style={{ width: '100%', borderRadius: 12 }}
                >
                  Open Filters
                </Button>
              </Badge>
            </div>
          )}

          {/* Active Filters */}
          <ActiveFilters
            filters={filters}
            onClear={handleClearFilters}
            onRemoveFilter={handleRemoveFilter}
          />

          {/* Desktop Filters */}
          {!isMobile && (
            <DesktopFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
              universityOptions={universityOptions}
            />
          )}

         

          {/* Mobile Filter Drawer */}
          <MobileFilterDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOptions={filterOptions}
            universityOptions={universityOptions}
            onApply={() => {
              onApplyFilters?.(filters);
              setDrawerVisible(false);
            }}
            onClear={handleClearFilters}
          />

         
        </div>
      </div>
  );
};

export default EnhancedFilters;