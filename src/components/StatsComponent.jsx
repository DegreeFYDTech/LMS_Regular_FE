import React, { useMemo } from 'react';
import {
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
  theme,
  Typography
} from 'antd';
import {
  InboxOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MessageOutlined,
  TeamOutlined,
  RiseOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { useToken } = theme;
const { Text } = Typography;

const StatsComponent = ({ overallStats, filters, activeRole, onFilterChange }) => {
  const { token } = useToken();

  const handleCardClick = (cardLabel) => {
    const dateFilters = {
      ...(filters.createdAt_start && { createdAt_start: filters.createdAt_start }),
      ...(filters.createdAt_end && { createdAt_end: filters.createdAt_end }),
    };

    let newFilters = {};

    switch (cardLabel) {
      case 'Fresh Leads':
        newFilters = {
          ...dateFilters,
          freshLeads: 'Fresh',
          data: activeRole
        };
        break;
      case 'Today CB Pending':
        newFilters = {
          ...dateFilters,
          callback: 'today',
          data: activeRole,
          sort: 'createdAt:asc'
        };
        break;
      case 'Not Connected Yet':
        newFilters = {
          ...dateFilters,
          data: activeRole,
          isconnectedyet: 'Not Connected'
        };
        break;
      case 'Unread Messages':
        newFilters = {
          ...dateFilters,
          data: activeRole,
          number_of_unread_messages: "true"
        };
        break;
      case 'Students Reactivity':
        newFilters = {
          ...dateFilters,
          data: activeRole,
          lead_reactive: true
        };
        break;
      case 'Total Leads':
        newFilters = {
          ...dateFilters,
          data: activeRole
        };
        break;
      default:
        return;
    }

    onFilterChange('bulk', newFilters, filters);
  };

  const statsCards = useMemo(() => {
    if (!overallStats) return [];

    const stats = overallStats;

    return [
      {
        key: 'fresh',
        label: 'Fresh Leads',
        count: stats.freshLeads || 0,
        subText: 'New inquiries',
        icon: InboxOutlined,
        color: '#1890ff', // Blue
        clickable: true,
      },
      {
        key: 'reactivity',
        label: 'Students Reactivity',
        count: stats.reactivityCount || 0,
        subText: 'Reactive students',
        icon: RiseOutlined,
        color: '#fa541c', // Orange/Red
        clickable: true,
      },
      {
        key: 'callback',
        label: 'Today CB Pending',
        count: stats.todayCallbacks || 0,
        subText: 'Callbacks due today',
        icon: CalendarOutlined,
        color: '#52c41a', // Green
        clickable: true,
      },
      {
        key: 'notconnected',
        label: 'Not Connected Yet',
        count: stats.notConnectedYet || 0,
        subText: 'Awaiting connection',
        icon: PhoneOutlined,
        color: '#f5222d', // Red
        clickable: true,
      },
      {
        key: 'unread',
        label: 'Unread Messages',
        count: stats.allUnreadMessagesCount || 0,
        subText: 'Unread messages',
        icon: MessageOutlined,
        color: '#722ed1', // Purple
        clickable: true,
      },
      {
        key: 'total',
        label: 'Total Leads',
        count: stats.total || 0,
        subText: 'Assigned to you',
        icon: TeamOutlined,
        color: '#2f54eb', // Dark Blue
        clickable: true,
      }
    ];
  }, [overallStats]);

  return (
    <div className="stats-container" style={{ padding: '16px 0' }}>
      <Row gutter={[16, 16]}>
        {statsCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={card.key}>
              <Tooltip 
                title={card.clickable ? `Click to filter by ${card.label}` : null}
                placement="top"
              >
                <Card
                  hoverable={card.clickable}
                  onClick={card.clickable ? () => handleCardClick(card.label) : undefined}
                  style={{
                    borderRadius: '8px',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    backgroundColor: 'white',
                    height: '100%',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                  bodyStyle={{
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <Text type="secondary" style={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      color: token.colorTextSecondary
                    }}>
                      {card.label}
                    </Text>
                    <div style={{
                      backgroundColor: `${card.color}15`,
                      borderRadius: '6px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent style={{ 
                        color: card.color,
                        fontSize: '16px'
                      }} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ flex: 1 }}>
                    <Statistic
                      value={card.count}
                      valueStyle={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: token.colorText,
                        lineHeight: 1.2,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px'
                    }}>
                      <Text type="secondary" style={{ 
                        fontSize: '12px',
                        color: token.colorTextTertiary
                      }}>
                        {card.subText}
                      </Text>
                      {card.clickable && (
                        <ArrowRightOutlined 
                          style={{ 
                            fontSize: '12px',
                            color: token.colorTextTertiary,
                            opacity: 0.6
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Bottom Accent Line */}
                  <div style={{ 
                    height: '2px',
                    backgroundColor: card.color,
                    borderRadius: '1px',
                    marginTop: '12px',
                    opacity: 0.3,
                    width: '100%'
                  }} />
                </Card>
              </Tooltip>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default StatsComponent;