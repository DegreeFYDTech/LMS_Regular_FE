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
    DatePicker,
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
    CalendarOutlined,
    DollarOutlined,
    TagOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../network/coupons';

const { Title, Text } = Typography;
const { Search } = Input;

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [pageSlugOptions, setPageSlugOptions] = useState([]);
    const [campusOptions, setCampusOptions] = useState([]);

    useEffect(() => {
        fetchCoupons();
        fetchPricingOptions();
    }, []);

    const fetchPricingOptions = async () => {
        try {
            const { getPricingRules } = await import('../network/pricingRules');
            const res = await getPricingRules();
            if (res && res.success) {
                const slugs = [...new Set(res.data.map(r => r.pageSlug).filter(Boolean))];
                const campuses = [...new Set(res.data.map(r => r.campusLocation).filter(Boolean))];
                setPageSlugOptions(slugs.map(s => ({ value: s, label: s })));
                setCampusOptions(campuses.map(c => ({ value: c, label: c })));
            }
        } catch (err) {
            console.error("Failed to fetch pricing options", err);
        }
    };

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const response = await getCoupons();
            if (response && response.success) {
                setCoupons(response.data);
            }
        } catch (error) {
            message.error('Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                code: values.code.toUpperCase(),
                validFrom: values.validRange[0].toISOString(),
                validTill: values.validRange[1].toISOString(),
                applicablePages: values.applicablePages || []
            };
            delete payload.validRange;

            let response;
            if (editingCoupon) {
                response = await updateCoupon(editingCoupon.id, payload);
                if (response.success) message.success('Coupon updated successfully');
            } else {
                response = await createCoupon(payload);
                if (response.success) message.success('Coupon created successfully');
            }

            setIsModalOpen(false);
            form.resetFields();
            setEditingCoupon(null);
            fetchCoupons();
        } catch (error) {
            message.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await deleteCoupon(id);
            if (response.success) {
                message.success('Coupon deleted successfully');
                fetchCoupons();
            }
        } catch (error) {
            message.error('Failed to delete coupon');
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            form.setFieldsValue({
                ...coupon,
                isActive: !!coupon.isActive,
                validRange: [dayjs(coupon.validFrom), dayjs(coupon.validTill)]
            });
        } else {
            setEditingCoupon(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'Details',
            key: 'details',
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text strong className="text-blue-600 text-base flex items-center gap-2">
                        <TagOutlined />
                        {record.code}
                    </Text>
                    <Text type="secondary" className="text-xs">{record.description || 'No description'}</Text>
                </div>
            ),
        },
        {
            title: 'Discount',
            key: 'discount',
            render: (_, record) => (
                <Tag color={record.discountType === 'FLAT' ? 'green' : 'blue'} className="px-2 py-0.5 text-sm font-medium">
                    {record.discountType === 'FLAT' ? `₹${record.discountValue}` : `${record.discountValue}%`}
                </Tag>
            ),
        },
        {
            title: 'Validity',
            key: 'validity',
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    <Text className="text-xs flex items-center">
                        <CalendarOutlined className="mr-1" />
                        {dayjs(record.validFrom).format('DD MMM YYYY')} - {dayjs(record.validTill).format('DD MMM YYYY')}
                    </Text>
                    {dayjs().isAfter(dayjs(record.validTill)) ? (
                        <Tag color="error" className="w-fit">Expired</Tag>
                    ) : (
                        <Tag color="success" className="w-fit">Active</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Usage',
            key: 'usage',
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text className="text-sm">Used: <b className="text-gray-900">{record.usedCount}</b> / {record.usageLimitGlobal}</Text>
                    <Text type="secondary" className="text-[11px]">Per User Limit: {record.usageLimitPerUser}</Text>
                </div>
            ),
        },
        {
            title: 'Pages',
            dataIndex: 'applicablePages',
            key: 'applicablePages',
            render: (pages, record) => (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {pages && pages.length > 0 ? (
                        pages.map(page => <Tag key={page} className="m-0">{page}</Tag>)
                    ) : (
                        <Tag color="default" className="m-0">All Pages</Tag>
                    )}
                    {record.applicableCampuses && record.applicableCampuses.length > 0 && (
                        record.applicableCampuses.map(campus => <Tag key={campus} color="purple" className="m-0">{campus}</Tag>)
                    )}
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Switch checked={isActive} disabled className={isActive ? 'bg-blue-600' : ''} />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button
                            type="primary"
                            ghost
                            icon={<EditOutlined />}
                            onClick={() => openModal(record)}
                            className="hover:scale-110 transition-transform"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure you want to delete this coupon?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button type="primary" danger ghost icon={<DeleteOutlined />} className="hover:scale-110 transition-transform" />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <Card bordered={false} className="shadow-md rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Title level={2} className="!m-0 flex items-center gap-3 text-gray-800">
                            <TagOutlined className="text-blue-600" />
                            Coupon Management
                        </Title>
                        <Text type="secondary" className="text-gray-500 mt-1 block">
                            Create and manage promotional discount coupons for landing pages
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => openModal()}
                        className="h-12 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center border-none"
                    >
                        Create New Coupon
                    </Button>
                </div>

                <div className="mb-6 flex items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search
                            placeholder="Search by coupon code..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={setSearchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="custom-search"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                    <Table
                        columns={columns}
                        dataSource={coupons.filter(c =>
                            c.code.toLowerCase().includes(searchText.toLowerCase()) ||
                            (c.description && c.description.toLowerCase().includes(searchText.toLowerCase())) ||
                            (c.applicableCampuses && c.applicableCampuses.some(campus => campus.toLowerCase().includes(searchText.toLowerCase())))
                        )}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            className: "px-4 py-3"
                        }}
                        className="ant-table-custom"
                    />
                </div>
            </Card>

            <Modal
                title={<div className="text-lg font-bold text-gray-800 pb-2 border-b">{editingCoupon ? "Edit Coupon Details" : "Create New Coupon"}</div>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
                destroyOnHidden
                className="rounded-2xl"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateOrUpdate}
                    initialValues={{
                        discountType: 'FLAT',
                        isActive: true,
                        minOrderAmount: 0,
                        usageLimitGlobal: 1000,
                        usageLimitPerUser: 1,
                        applicablePages: []
                    }}
                    className="mt-6"
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label={<span className="font-semibold text-gray-700">Coupon Code</span>}
                                rules={[{ required: true, message: 'Please enter coupon code' }]}
                            >
                                <Input placeholder="e.g. WELCOME500" className="h-10 rounded-md uppercase" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="isActive"
                                label={<span className="font-semibold text-gray-700">Status</span>}
                                valuePropName="checked"
                                help={<span className="text-sm text-gray-500 font-medium">Active for users</span>}
                            >
                                <Switch className="bg-gray-300" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label={<span className="font-semibold text-gray-700">Description</span>}
                    >
                        <Input.TextArea rows={2} placeholder="Briefly describe what this coupon is for..." className="rounded-md" />
                    </Form.Item>

                    <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-100">
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item
                                    name="discountType"
                                    label={<span className="font-semibold text-blue-800">Discount Strategy</span>}
                                    rules={[{ required: true }]}
                                >
                                    <Select className="h-11">
                                        <Select.Option value="FLAT">Flat Amount (INR)</Select.Option>
                                        <Select.Option value="PERCENTAGE">Percentage (%)</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="discountValue"
                                    label={<span className="font-semibold text-blue-800">Value</span>}
                                    rules={[{ required: true, message: 'Value required' }]}
                                >
                                    <InputNumber className="w-full h-11 flex items-center rounded-md" min={0} placeholder="0.00" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item
                                    name="maxDiscountAmount"
                                    label={<span className="font-semibold text-blue-800">Max Cap (Optional)</span>}
                                >
                                    <InputNumber className="w-full h-10 flex items-center rounded-md" min={0} placeholder="Limit in ₹" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="minOrderAmount"
                                    label={<span className="font-semibold text-blue-800">Min Order Requirement</span>}
                                >
                                    <InputNumber className="w-full h-10 flex items-center rounded-md" min={0} placeholder="Min ₹" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Form.Item
                        name="validRange"
                        label={<span className="font-semibold text-gray-700">Active Validity Period</span>}
                        rules={[{ required: true, message: 'Please select date range' }]}
                    >
                        <DatePicker.RangePicker className="w-full h-11 rounded-md" />
                    </Form.Item>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="usageLimitGlobal"
                                label={<span className="font-semibold text-gray-700">Total Usage Limit</span>}
                                rules={[{ required: true }]}
                            >
                                <InputNumber className="w-full h-10 flex items-center rounded-md" min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="usageLimitPerUser"
                                label={<span className="font-semibold text-gray-700">Usage Per Customer</span>}
                                rules={[{ required: true }]}
                            >
                                <InputNumber className="w-full h-10 flex items-center rounded-md" min={1} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="applicablePages"
                                label={<span className="font-semibold text-gray-700">Whitelist Page Slugs</span>}
                                help={<span className="text-xs text-gray-400">Select existing or type new slugs. Leave blank for all.</span>}
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Select or add page slugs"
                                    className="custom-select-tags"
                                    options={pageSlugOptions}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="applicableCampuses"
                                label={<span className="font-semibold text-gray-700">Whitelist Campuses</span>}
                                help={<span className="text-xs text-gray-400">Select existing or type new campuses. Leave blank for all.</span>}
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Select or add campus names"
                                    className="custom-select-tags"
                                    options={campusOptions}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-6 rounded-md border-gray-300 text-gray-600 hover:text-blue-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="h-10 px-8 rounded-md bg-blue-600 hover:bg-blue-700"
                        >
                            {editingCoupon ? "Save Changes" : "Confirm & Create"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CouponManagement;
