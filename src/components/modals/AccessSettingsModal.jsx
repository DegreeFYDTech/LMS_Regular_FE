import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, TimePicker, Spin, message } from 'antd';
import dayjs from 'dayjs';
import { getCounsellorAccessSettings, updateCounsellorAccessSettings } from '../../network/counsellor';

const DEVICE_OPTIONS = [
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Desktop', value: 'Desktop' },
  { label: 'Tablet', value: 'Tablet' },
];

const SESSION_OPTIONS = [1, 2, 3, 4, 5].map(n => ({ label: `${n} session${n > 1 ? 's' : ''}`, value: n }));

function AccessSettingsModal({ isOpen, onClose, user, onSaved }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    getCounsellorAccessSettings(user.counsellor_id)
      .then(data => {
        const settings = data.settings || data;
        form.setFieldsValue({
          allowed_ips: settings.allowed_ips || [],
          allowed_devices: settings.allowed_devices || [],
          max_active_sessions: settings.max_active_sessions || 1,
          time_range: (settings.login_start_time && settings.login_end_time)
            ? [dayjs(settings.login_start_time, 'HH:mm:ss'), dayjs(settings.login_end_time, 'HH:mm:ss')]
            : null,
        });
      })
      .catch(() => message.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        allowed_ips: values.allowed_ips || [],
        allowed_devices: values.allowed_devices || [],
        max_active_sessions: values.max_active_sessions || 1,
        login_start_time: values.time_range ? values.time_range[0].format('HH:mm:ss') : null,
        login_end_time: values.time_range ? values.time_range[1].format('HH:mm:ss') : null,
      };
      await updateCounsellorAccessSettings(user.counsellor_id, payload);
      message.success('Access settings saved');
      onSaved?.();
      onClose();
    } catch {
      message.error('Failed to save settings');
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
      title={`Access Settings — ${user?.counsellor_name || ''}`}
      okText="Save"
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item label="Login Time Window" name="time_range">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Allowed IPs (leave empty = any)" name="allowed_ips">
            <Select
              mode="tags"
              placeholder="e.g. 192.168.1.1 or 103.88"
              tokenSeparators={[',']}
              className="w-full"
            />
          </Form.Item>
          <Form.Item label="Allowed Devices (leave empty = any)" name="allowed_devices">
            <Select mode="multiple" options={DEVICE_OPTIONS} placeholder="Select allowed devices" className="w-full" />
          </Form.Item>
          <Form.Item label="Max Active Sessions" name="max_active_sessions">
            <Select options={SESSION_OPTIONS} className="w-full" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default AccessSettingsModal;
