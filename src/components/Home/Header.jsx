import React, { memo } from 'react';
import { 
  PlusOutlined, 
  DownloadOutlined, 
  SwapOutlined, 
  LoadingOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { Button, Space, Typography, theme } from 'antd';

const { Title } = Typography;
const { useToken } = theme;

const Header = memo(({
  activeTab,
  storedRole,
  activeRole,
  onAddLead,
  onExport,
  onRoleSwitch,
  onOpenAdvancedFilter,
  isExporting = false
}) => {
  const { token } = useToken();

  const getTitle = () => {
    switch (activeTab) {
      case "fresh": return "Fresh Leads";
      case "callback": return "Callback Leads";
      default: return "Lead Dashboards";
    }
  };

  const isSupervisor = storedRole === "Supervisor";
  const isAnalyser = storedRole === "Analyser";
  
  // Get role display name for switch button
  const getSwitchRoleName = () => {
    return activeRole === "l3" ? "L2" : "L3";
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      // marginBottom: token.marginLG,
      // padding: `0 ${token.paddingLG}px`,
      flexWrap: 'wrap',
      gap: token.marginMD
    }}>
      <Title level={3} style={{ margin: 0 }}>
        {getTitle()}
      </Title>

      <Space wrap size="middle">
          

        <Button
          icon={<FilterOutlined />}
          onClick={onOpenAdvancedFilter}
          size="large"
          className="flex items-center"
        >
          Advanced Filter
        </Button>

        {(isSupervisor || activeRole=="to") && (
          <Button
            type="primary"
            icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
            onClick={onExport}
            loading={isExporting}
            disabled={isExporting}
            size="large"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        )}
        
        {isSupervisor && (
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={onRoleSwitch}
            size="large"
            style={{
              background: token.colorPrimary,
              borderColor: token.colorPrimary
            }}
          >
            Switch to {getSwitchRoleName()} (Current: {activeRole.toUpperCase()})
          </Button>
        )}
      </Space>
    </div>
  );
});

export default Header;