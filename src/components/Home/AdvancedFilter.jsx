import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Select, Input, Typography, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { BASE_URL } from '../../config/api';

const { Text } = Typography;
const { Option } = Select;

const AdvancedFilter = ({ onApply, onClear, isOpen, onClose, initialFilters = [] }) => {
  const [fields, setFields] = useState([]);
  const [localFilters, setLocalFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
      // Initialize with either existing filters or one empty condition
      if (initialFilters && initialFilters.length > 0) {
        setLocalFilters(initialFilters.map(f => ({ ...f })));
      } else if (localFilters.length === 0) {
        setLocalFilters([{ field: '', operator: 'Equals', value: '' }]);
      }
    }
  }, [isOpen, initialFilters]);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/student/advanced-filter/schema`, {
        withCredentials: true
      });
      if (response.data.success) {
        setFields(response.data.fields);
      }
    } catch (error) {
      console.error('Error fetching filter schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFilterCondition = () => {
    setLocalFilters([...localFilters, { field: '', operator: 'Equals', value: '' }]);
  };

  const removeFilterCondition = (index) => {
    const newFilters = localFilters.filter((_, i) => i !== index);
    if (newFilters.length === 0) {
      setLocalFilters([{ field: '', operator: 'Equals', value: '' }]);
    } else {
      setLocalFilters(newFilters);
    }
  };

  const updateFilterCondition = (index, key, value) => {
    const newFilters = [...localFilters];
    const updates = { [key]: value };
    
    // Reset value if field changes and it has options
    if (key === 'field') {
      const fieldData = fields.find(f => f.key === value);
      if (fieldData?.options?.length > 0) {
        updates.value = []; // Use array for multi-select
      } else {
        updates.value = '';
      }
    }
    
    newFilters[index] = { ...newFilters[index], ...updates };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    const validFilters = localFilters.filter(f => 
      f.field && (f.operator === 'Is Empty' || (Array.isArray(f.value) ? f.value.length > 0 : f.value))
    );
    onApply(validFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters([{ field: '', operator: 'Equals', value: '' }]);
    onClear();
  };

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold text-slate-800">Advanced Filters</div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={850}
      footer={[
        <Button 
          key="clear" 
          type="link" 
          className="float-left text-slate-400" 
          onClick={handleClear}
          loading={loading}
        >
          Clear all filters
        </Button>,
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button 
          key="apply" 
          type="primary" 
          onClick={handleApply} 
          className="bg-blue-600"
          loading={loading}
          style={{ background: '#2563eb' }} 
        >
          Apply Filters
        </Button>
      ]}
      styles={{ body: { padding: '24px' } }}
    >
      <div className="space-y-4">
        {localFilters.map((filter, index) => (
          <div key={index} className="flex items-center gap-3">
            <div style={{ 
              background: '#f8fafc', 
              padding: '4px 8px', 
              borderRadius: '4px',
              minWidth: '100px',
              textAlign: 'center'
            }}>
                <Text type="secondary" className="text-[10px] font-bold uppercase text-slate-500">WHERE</Text>
            </div>
            
            <Select 
              placeholder="Select column..." 
              className="flex-1"
              showSearch
              value={filter.field || undefined}
              onChange={(val) => updateFilterCondition(index, 'field', val)}
            >
              {fields.map(f => (
                <Option key={f.key} value={f.key}>
                  {f.label}
                </Option>
              ))}
            </Select>
            
            <Select 
              defaultValue="Equals" 
              className="w-32"
              value={filter.operator}
              onChange={(val) => updateFilterCondition(index, 'operator', val)}
            >
              <Option value="Contains">Contains</Option>
              <Option value="Equals">Equals</Option>
              <Option value="Is Empty">Is Empty</Option>
            </Select>

            {filter.operator !== 'Is Empty' && (() => {
              const selectedField = fields.find(f => f.key === filter.field);
              if (selectedField?.options?.length > 0) {
                return (
                  <Select
                    mode="multiple"
                    placeholder="Select value..."
                    className="flex-1 min-w-[200px]"
                    showSearch
                    optionFilterProp="children"
                    value={Array.isArray(filter.value) ? filter.value : []}
                    onChange={(val) => updateFilterCondition(index, 'value', val)}
                  >
                    {selectedField.options.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                );
              }
              return (
                <Input 
                  placeholder="Value..." 
                  className="flex-1"
                  value={filter.value}
                  onChange={(e) => updateFilterCondition(index, 'value', e.target.value)}
                />
              );
            })()}

            <Button 
              type="text" 
              icon={<DeleteOutlined className="text-slate-300 hover:text-red-500" />} 
              onClick={() => removeFilterCondition(index)}
            />
          </div>
        ))}
        
        <Button 
          type="link" 
          icon={<PlusOutlined />} 
          onClick={addFilterCondition}
          className="p-0 text-blue-600 font-medium"
          style={{ color: '#2563eb' }}
        >
          Add condition
        </Button>
      </div>
    </Modal>
  );
};

export default AdvancedFilter;
