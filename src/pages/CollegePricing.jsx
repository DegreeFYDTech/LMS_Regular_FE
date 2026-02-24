import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Card,
    Row,
    Col,
    Typography,
    Input,
    Modal,
    Form,
    Select,
    InputNumber,
    Switch,
    message,
    Tag,
    Space,
    Popconfirm,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    DollarOutlined,
    GlobalOutlined,
    InfoCircleOutlined,
    BankOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule } from '../network/pricingRules';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const CollegePricing = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await getPricingRules();
            if (response && response.success) {
                setRules(response.data);
            }
        } catch (error) {
            message.error('Failed to fetch pricing rules');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (values) => {
        setLoading(true);
        try {
            let response;
            if (editingRule) {
                response = await updatePricingRule(editingRule.id, values);
                if (response.success) message.success('Pricing rule updated successfully');
            } else {
                response = await createPricingRule(values);
                if (response.success) message.success('Pricing rule created successfully');
            }

            setIsModalOpen(false);
            form.resetFields();
            setEditingRule(null);
            fetchRules();
        } catch (error) {
            message.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await deletePricingRule(id);
            if (response.success) {
                message.success('Pricing rule deleted successfully');
                fetchRules();
            }
        } catch (error) {
            message.error('Failed to delete pricing rule');
        }
    };

    const openModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            form.setFieldsValue(rule);
        } else {
            setEditingRule(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'College / Page',
            key: 'college',
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-gray-800 text-[15px] flex items-center gap-2">
                        <BankOutlined className="text-blue-500" />
                        {record.collegeName}
                    </Text>
                    <div className="mt-1">
                        <Tag color="cyan" className="m-0 text-[10px] font-mono lowercase">{record.pageSlug || 'no-slug'}</Tag>
                    </div>
                </div>
            ),
        },
        {
            title: 'Base Amount',
            key: 'amount',
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-base text-green-600 font-bold">
                        {record.currency === 'INR' ? '₹' : record.currency}{record.baseAmount}
                    </Text>
                    <Text type="secondary" className="text-[10px] uppercase font-semibold">Currency: {record.currency}</Text>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'pageType',
            key: 'pageType',
            render: (type) => <Tag color="blue" className="rounded-full px-3">{type || 'N/A'}</Tag>
        },
        {
            title: 'Settings',
            key: 'settings',
            render: (_, record) => (
                <div className="flex flex-wrap gap-2">
                    <Tag color={record.allowCoupons ? 'green' : 'orange'} className="border-none bg-opacity-10 text-xs py-0.5">
                        {record.allowCoupons ? '✓ Coupons' : '✕ Coupons'}
                    </Tag>
                    <Tag color={record.isActive ? 'blue' : 'default'} className="border-none bg-opacity-10 text-xs py-0.5">
                        {record.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                </div>
            ),
        },
        {
            title: 'Last Updated',
            key: 'updated_at',
            render: (_, record) => (
                <div className="text-gray-500 text-xs">
                    {record.updatedAt || record.updated_at
                        ? dayjs(record.updatedAt || record.updated_at).format('DD MMM YYYY')
                        : '—'}
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit Pricing">
                        <Button
                            type="primary"
                            ghost
                            icon={<EditOutlined />}
                            onClick={() => openModal(record)}
                            className="hover:bg-blue-50 border-blue-200"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this pricing configuration?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button type="primary" danger ghost icon={<DeleteOutlined />} className="hover:bg-red-50 border-red-200" />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 min-h-screen bg-slate-50">
            <Card bordered={false} className="shadow-lg rounded-2xl overflow-hidden border-t-4 border-t-blue-500">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                            <DollarOutlined className="text-2xl text-blue-600" />
                        </div>
                        <div>
                            <Title level={2} className="!m-0 text-slate-800 font-extrabold tracking-tight">
                                College Pricing
                            </Title>
                            <Text type="secondary" className="text-slate-500 text-sm italic">
                                Manage university-specific payment amounts and checkout behavior
                            </Text>
                        </div>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => openModal()}
                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold border-none shadow-xl shadow-blue-200"
                    >
                        New Configuration
                    </Button>
                </div>

                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full max-w-md">
                        <Search
                            placeholder="Search college name or slug..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={setSearchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="pricing-search"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Tag color="processing" className="m-0 px-3 py-1 border-none bg-blue-100 text-blue-700 font-semibold rounded-lg">
                            Total: {rules.length}
                        </Tag>
                    </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <Table
                        columns={columns}
                        dataSource={rules.filter(r =>
                            r.collegeName.toLowerCase().includes(searchText.toLowerCase()) ||
                            r.pageSlug.toLowerCase().includes(searchText.toLowerCase())
                        )}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            className: "px-6 py-4"
                        }}
                        className="custom-ant-table"
                    />
                </div>
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <InfoCircleOutlined className="text-blue-500" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">
                            {editingRule ? "Edit Configuration" : "New Pricing Configuration"}
                        </span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={650}
                destroyOnClose
                className="rounded-3xl"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateOrUpdate}
                    initialValues={{
                        currency: 'INR',
                        isActive: true,
                        allowCoupons: true,
                        pageType: 'Admission'
                    }}
                    className="mt-8 px-2"
                >
                    <Form.Item
                        name="collegeName"
                        label={<span className="font-bold text-slate-700">Display College Name</span>}
                        rules={[{ required: true, message: 'Please enter university name' }]}
                    >
                        <Input placeholder="e.g. Lovely Professional University" className="h-11 rounded-xl" />
                    </Form.Item>

                    <Row gutter={20}>
                        <Col span={14}>
                            <Form.Item
                                name="pageSlug"
                                label={<span className="font-bold text-slate-700">Integration Slug (Unique)</span>}
                                rules={[{ required: true, message: 'Unique slug required' }]}
                                tooltip="This must be unique and match the 'pageSlug' sent from the application form frontend."
                            >
                                <Input placeholder="e.g. lpu-admission-form" disabled={!!editingRule} className="h-11 rounded-xl font-mono" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item
                                name="pageType"
                                label={<span className="font-bold text-slate-700">Rule Category</span>}
                            >
                                <Select className="h-11 custom-select-rounded">
                                    <Option value="Admission">Admission Fee</Option>
                                    <Option value="Registration">Registration Fee</Option>
                                    <Option value="Course">Course Fee</Option>
                                    <Option value="Other">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-inner">
                        <Row gutter={20}>
                            <Col span={12}>
                                <Form.Item
                                    name="baseAmount"
                                    label={<span className="font-bold text-slate-700">Base Amount</span>}
                                    rules={[{ required: true, message: 'Enter numeric amount' }]}
                                >
                                    <InputNumber
                                        className="w-full h-12 flex items-center rounded-xl font-bold text-lg text-emerald-600"
                                        min={0}
                                        placeholder="0.00"
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="currency"
                                    label={<span className="font-bold text-slate-700">Currency</span>}
                                    rules={[{ required: true }]}
                                >
                                    <Select className="h-12 custom-select-rounded">
                                        <Select.Option value="INR">INR (Indian Rupee)</Select.Option>
                                        <Select.Option value="USD">USD (US Dollar)</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="grid grid-cols-2 gap-6 mt-2 pt-4 border-t border-slate-200">
                            <Form.Item
                                name="allowCoupons"
                                label={<span className="font-semibold text-slate-600">Enable Coupons?</span>}
                                valuePropName="checked"
                                className="mb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Switch className="bg-slate-300" />
                                    <span className="text-xs text-slate-500 italic">Allow discount codes</span>
                                </div>
                            </Form.Item>
                            <Form.Item
                                name="isActive"
                                label={<span className="font-semibold text-slate-600">Active Rule?</span>}
                                valuePropName="checked"
                                className="mb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Switch className="bg-slate-300 shadow-sm" />
                                    <span className="text-xs text-slate-500 italic">Live in production</span>
                                </div>
                            </Form.Item>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            className="h-11 px-8 rounded-xl font-semibold text-slate-500 border-none hover:bg-slate-100"
                        >
                            Dismiss
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="h-11 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
                        >
                            {editingRule ? "Apply Changes" : "Save Configuration"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CollegePricing;
