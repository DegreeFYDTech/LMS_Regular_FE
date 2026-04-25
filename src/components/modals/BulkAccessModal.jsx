import React, { useState } from 'react';
import { Modal, Form, Select, TimePicker, message } from 'antd';
import dayjs from 'dayjs';
import { bulkUpdateCounsellorAccessSettings } from '../../network/counsellor';

const DEVICE_OPTIONS = [
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Desktop', value: 'Desktop' },
  { label: 'Tablet', value: 'Tablet' },
];

const SESSION_OPTIONS = [1, 2, 3, 4, 5].map(n => ({ label: `${n} session${n > 1 ? 's' : ''}`, value: n }));

function BulkAccessModal({ isOpen, onClose, selectedIds, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {};
      if (values.allowed_ips?.length) payload.allowed_ips = values.allowed_ips;
      if (values.allowed_devices?.length) payload.allowed_devices = values.allowed_devices;
      if (values.max_active_sessions) payload.max_active_sessions = values.max_active_sessions;
      if (values.time_range) {
        payload.login_start_time = values.time_range[0].format('HH:mm:ss');
        payload.login_end_time = values.time_range[1].format('HH:mm:ss');
      }
      await bulkUpdateCounsellorAccessSettings(selectedIds, payload);
      message.success(`Settings applied to ${selectedIds.length} counsellors`);
      form.resetFields();
      onSaved?.();
      onClose();
    } catch {
      message.error('Failed to apply bulk settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      title={
        <span>
          Bulk Access Settings&nbsp;
          <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            {selectedIds?.length} selected
          </span>
        </span>
      }
      okText="Apply to All"
      destroyOnClose
    >
      <p className="text-sm text-gray-500 mb-4">Only filled fields will be updated. Empty fields are skipped.</p>
      <Form form={form} layout="vertical">
        <Form.Item label="Login Time Window" name="time_range">
          <TimePicker.RangePicker format="HH:mm" className="w-full" />
        </Form.Item>
        <Form.Item label="Allowed IPs" name="allowed_ips">
          <Select
            mode="tags"
            placeholder="e.g. 192.168.1.1 or 103.88"
            tokenSeparators={[',']}
            className="w-full"
          />
        </Form.Item>
        <Form.Item label="Allowed Devices" name="allowed_devices">
          <Select mode="multiple" options={DEVICE_OPTIONS} placeholder="Select allowed devices" className="w-full" />
        </Form.Item>
        <Form.Item label="Max Active Sessions" name="max_active_sessions">
          <Select options={SESSION_OPTIONS} placeholder="Select max sessions" className="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default BulkAccessModal;
