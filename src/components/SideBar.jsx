import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  DashboardOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  BookOutlined,
  PlusOutlined,
  TeamOutlined,
  SettingOutlined,
  FilterOutlined,
  UploadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TrophyOutlined,
  CoffeeOutlined,
  UserAddOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  DatabaseOutlined,
  DownOutlined,
  UpOutlined,
  DollarOutlined,
  DashboardTwoTone,
} from "@ant-design/icons";
import AgentsDropdown from "./AgentDropdown";

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  handleTabChange,
  setIsAddLeadModalOpen,
  agents,
  selectedAgent,
  handleAgentClick,
  navigate,
}) => {
  const storedRole = useSelector((state) => state.auth.role);
  const [openDropdown, setOpenDropdown] = useState(null);

  const isSupervisor = storedRole === "Supervisor";
  const isTORole = storedRole === "to" || storedRole === "to_l3";
  const isAnalyser = storedRole === "Analyser";
  const isL2Role = storedRole === "l2";
  const isL3Role = storedRole === "l3";
  const isSupervisorOrTO = isSupervisor || isTORole;

  // ============================================
  // L2 Role - Only Fresh and Callbacks tabs
  // ============================================
  const getL2NavItems = () => {
    if (isL2Role) {
      return [
        {
          key: "fresh",
          icon: <InboxOutlined className="text-lg" />,
          label: "Fresh Leads",
          onClick: () => handleTabChange("fresh"),
        },
        {
          key: "callback",
          icon: <ClockCircleOutlined className="text-lg" />,
          label: "Callback Leads",
          onClick: () => handleTabChange("callback"),
        },
      ];
    }
    return [];
  };

  // ============================================
  // L3 Role Navigation Items
  // ============================================
  const getL3NavItems = () => {
    if (isL3Role) {
      return [
        {
          key: "dashboard",
          icon: <DashboardOutlined className="text-lg" />,
          label: "Dashboard",
          onClick: () => handleTabChange("dashboard"),
        },
        {
          key: "fresh",
          icon: <InboxOutlined className="text-lg" />,
          label: "Fresh Leads",
          onClick: () => handleTabChange("fresh"),
        },
        {
          key: "callback",
          icon: <ClockCircleOutlined className="text-lg" />,
          label: "Callback Leads",
          onClick: () => handleTabChange("callback"),
        },
        {
          key: "wishlist",
          icon: <HeartOutlined className="text-lg" />,
          label: "WishList",
          onClick: () => handleTabChange("wishlist"),
        },
        {
          key: "library",
          icon: <BookOutlined className="text-lg" />,
          label: "Library",
          onClick: () => navigate("/college-brochure"),
        },
      ];
    }
    return [];
  };

  // ============================================
  // Supervisor/TO Navigation Items
  // ============================================
  const getSupervisorNavItems = () => {
    if (isSupervisorOrTO) {
      return [
        {
          key: "dashboard",
          icon: <DashboardOutlined className="text-lg" />,
          label: "Dashboard",
          onClick: () => handleTabChange("dashboard"),
        },
        {
          key: "fresh",
          icon: <InboxOutlined className="text-lg" />,
          label: "Fresh Leads",
          count: 12,
          onClick: () => handleTabChange("fresh"),
        },
        {
          key: "callback",
          icon: <ClockCircleOutlined className="text-lg" />,
          label: "Callback Leads",
          count: 5,
          onClick: () => handleTabChange("callback"),
        },
        {
          key: "wishlist",
          icon: <HeartOutlined className="text-lg" />,
          label: "WishList",
          onClick: () => handleTabChange("wishlist"),
        },
        {
          key: "library",
          icon: <BookOutlined className="text-lg" />,
          label: "Library",
          onClick: () => navigate("/college-brochure"),
        },
        {
          key: "payment-reports",
          icon: <DollarOutlined className="text-lg" />,
          label: "Payment Reports",
          onClick: () => navigate("/payment-reports"),
        },
        ...(isSupervisor
          ? [
              {
                key: "form-dashboard",
                icon: <DashboardTwoTone className="text-lg" />,
                label: "Form Dashboard",
                onClick: () => navigate("/form-dashboard"),
              },
            ]
          : []),
      ];
    }
    return [];
  };

  // ============================================
  // Analyser Navigation Items
  // ============================================
  const analyserNavItems = isAnalyser
    ? [
        {
          key: "dashboard",
          icon: <DashboardOutlined className="text-lg" />,
          label: "Dashboard",
          onClick: () => handleTabChange("dashboard"),
        },
        {
          key: "analysisreport",
          icon: <BarChartOutlined className="text-lg" />,
          label: "Analysis Report",
          onClick: () => navigate("/analysisreport"),
        },
      ]
    : [];

  // ============================================
  // Determine which nav items to show based on role
  // ============================================
  let mainNavItems = [];
  
  if (isL2Role) {
    mainNavItems = getL2NavItems();
  } else if (isL3Role) {
    mainNavItems = getL3NavItems();
  } else if (isSupervisorOrTO) {
    mainNavItems = getSupervisorNavItems();
  } else if (isAnalyser) {
    mainNavItems = analyserNavItems;
  }

  // ============================================
  // Quick Access Items (based on role)
  // ============================================
  const getQuickAccessItems = () => {
    // L2 has no quick access
    if (isL2Role) {
      return [];
    }

    const quickAccessDropdown = {
      key: "quick-access",
      icon: <TeamOutlined />,
      label: "Quick Access",
      dropdownItems: isSupervisor
        ? [
            {
              key: "scoreboard",
              icon: <TrophyOutlined />,
              label: "ScoreBoard",
              onClick: () => navigate("/scroreboard"),
            },
            {
              key: "break-analysis",
              icon: <CoffeeOutlined />,
              label: "Break Analysis",
              onClick: () => navigate("/counsellors-break-dashboard"),
            },
            {
              key: "users",
              icon: <TeamOutlined />,
              label: "Users",
              onClick: () => navigate("/counsellorslisting"),
            },
            {
              key: "add-agent",
              icon: <UserAddOutlined />,
              label: "Add Agent",
              onClick: () => navigate("/addcounsellor"),
            },
          ]
        : isTORole
        ? [
            {
              key: "break-analysis",
              icon: <CoffeeOutlined />,
              label: "Break Analysis",
              onClick: () => navigate("/counsellors-break-dashboard"),
            },
            {
              key: "users",
              icon: <TeamOutlined />,
              label: "Users",
              onClick: () => navigate("/counsellorslisting"),
            },
          ]
        : [],
    };

    return quickAccessDropdown;
  };

  // ============================================
  // Admin Actions Items (based on role)
  // ============================================
  const getAdminActionsItems = () => {
    // L2 has no admin actions
    if (isL2Role) {
      return [];
    }

    const rulesetDropdown = {
      key: "ruleset",
      icon: <FilterOutlined />,
      label: "Manage RuleSet",
      dropdownItems: [
        {
          key: "ruleset-l2",
          icon: <SettingOutlined />,
          label: "L2 RuleSet",
          onClick: () => navigate("/leadassignmentl2"),
        },
        {
          key: "ruleset-l3",
          icon: <FilterOutlined />,
          label: "L3 RuleSet",
          onClick: () => navigate("/leadassignmentl3"),
        },
        {
          key: "ruleset-recon",
          icon: <FilterOutlined />,
          label: "Recon RuleSet",
          onClick: () => navigate("/reconRuleset"),
        },
        {
          key: "ruleset-ni",
          icon: <FilterOutlined />,
          label: "NI Leads RuleSet",
          onClick: () => navigate("/managenileads"),
        },
        {
          key: "rulesetdb",
          icon: <FilterOutlined />,
          label: "DB RuleSet",
          onClick: () => navigate("/rulesetdb"),
        },
      ],
    };

    const templatesDropdown = {
      key: "templates",
      icon: <FileTextOutlined />,
      label: "Templates",
      dropdownItems: [
        {
          key: "manage-templates",
          icon: <FileTextOutlined />,
          label: "Manage Templates",
          onClick: () => navigate("/manangetemplates"),
        },
        {
          key: "bulk-upload",
          icon: <UploadOutlined />,
          label: "Bulk Upload",
          onClick: () => navigate("/bulkupload"),
        },
        {
          key: "college-pricing",
          icon: <DollarOutlined />,
          label: "College Pricing",
          onClick: () => navigate("/college-pricing"),
        },
        {
          key: "coupon-management",
          icon: <SettingOutlined />,
          label: "Coupon Management",
          onClick: () => navigate("/coupon-management"),
        },
      ],
    };

    const adminItems = isSupervisor
      ? [
          templatesDropdown,
          rulesetDropdown,
          {
            key: "reports",
            icon: <SolutionOutlined />,
            label: "Reports Portal",
            onClick: () => navigate("/analysisreport"),
          },
          {
            key: "manage-courses",
            icon: <AppstoreOutlined />,
            label: "Manage Courses",
            onClick: () => navigate("/manageCourses"),
          },
          {
            key: "analyser-bucket",
            icon: <DatabaseOutlined />,
            label: "Analyser Bucket",
            onClick: () => navigate("/analyserbucket"),
          },
        ]
      : isTORole
      ? [
          {
            key: "reports",
            icon: <SolutionOutlined />,
            label: "Reports Portal",
            onClick: () => navigate("/analysisreport"),
          },
          {
            key: "bulk-upload",
            icon: <UploadOutlined />,
            label: "Bulk Upload",
            onClick: () => navigate("/bulkupload"),
          },
        ]
      : [];

    return adminItems;
  };

  // ============================================
  // UI Display Flags based on role
  // ============================================
  const showAddLead = isSupervisorOrTO || isL2Role || isL3Role;
  const showAgentsDropdown = isSupervisorOrTO;
  const showQuickAccess = (isSupervisor || isTORole) && !isL2Role && !isL3Role;
  const showAdminActions = (isSupervisor || isTORole) && !isL2Role && !isL3Role;

  const quickAccessDropdown = getQuickAccessItems();
  const adminActionsItems = getAdminActionsItems();

  // Process items to add dropdown state and toggle functions
  const processItemsWithDropdown = (items) => {
    return items.map((item) => ({
      ...item,
      hasDropdown: !!item.dropdownItems,
      isOpen: openDropdown === item.key,
      onToggle: () =>
        setOpenDropdown(openDropdown === item.key ? null : item.key),
    }));
  };

  const quickAccessItems = showQuickAccess
    ? processItemsWithDropdown([quickAccessDropdown])
    : [];
  const processedAdminItems = showAdminActions
    ? processItemsWithDropdown(adminActionsItems)
    : [];

  const renderNavItem = (item, isCollapsed, showTooltip = true) => {
    if (item.hasDropdown) {
      return (
        <div className="relative">
          <button
            onClick={item.onToggle}
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} w-full p-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors`}
          >
            <div className="flex items-center">
              {item.icon}
              {!isCollapsed && (
                <span className="ml-3 text-sm">{item.label}</span>
              )}
            </div>
            {!isCollapsed &&
              (item.isOpen ? (
                <UpOutlined className="text-xs" />
              ) : (
                <DownOutlined className="text-xs" />
              ))}
          </button>

          {showTooltip && isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          )}

          {item.isOpen && !isCollapsed && (
            <div className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-1">
              {item.dropdownItems.map((dropdownItem) => (
                <button
                  key={dropdownItem.key}
                  onClick={dropdownItem.onClick}
                  className="flex items-center w-full p-2 pl-4 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors text-sm"
                >
                  {dropdownItem.icon}
                  <span className="ml-3">{dropdownItem.label}</span>
                </button>
              ))}
            </div>
          )}

          {item.isOpen && isCollapsed && (
            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48 z-50">
              {item.dropdownItems.map((dropdownItem) => (
                <button
                  key={dropdownItem.key}
                  onClick={dropdownItem.onClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                >
                  {dropdownItem.icon}
                  <span className="ml-3">{dropdownItem.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.key}
        onClick={item.onClick}
        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"} w-full p-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors relative group`}
      >
        {item.icon}
        {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}

        {showTooltip && isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {!sidebarCollapsed && (
              <div className="ml-3">
                <h2 className="font-semibold text-gray-800 text-base">
                  {isL2Role ? "Dialer System" : "Lead Manager"}
                </h2>
                <p className="text-xs text-gray-500">
                  {isL2Role ? "Call Management" : "Management System"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors"
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
      </div>

      <div className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`}
              >
                <div className={`${isActive ? "text-white" : "text-gray-500"}`}>
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}

          {showAddLead && !isL2Role && (
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className={`flex items-center justify-center w-full px-3 py-2 mt-4 rounded-lg border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all ${sidebarCollapsed ? "p-3" : ""}`}
            >
              <PlusOutlined />
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium text-sm">Add New Lead</span>
              )}
            </button>
          )}
        </div>

        {/* Agents Dropdown - Only for Supervisor/TO, not for L2 */}
        {showAgentsDropdown && !sidebarCollapsed && !isL2Role && (
          <div className="px-3 mt-6">
            <AgentsDropdown
              agents={agents}
              onAgentSelect={handleAgentClick}
              selectedAgentProp={selectedAgent}
              sidebarCollapsed={sidebarCollapsed}
            />
          </div>
        )}

        {/* Quick Access - Not for L2 */}
        {showQuickAccess && (
          <div className="mt-6">
            {!sidebarCollapsed && (
              <>
                <div className="px-3 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Access
                  </p>
                </div>
                <div className="px-3 space-y-1">
                  {quickAccessItems.map((item) => renderNavItem(item, false))}
                </div>
              </>
            )}
            {sidebarCollapsed && (
              <div className="space-y-1">
                {quickAccessItems.map((item) => renderNavItem(item, true))}
              </div>
            )}
          </div>
        )}

        {/* Admin Actions - Not for L2 */}
        {showAdminActions && (
          <div className="mt-6">
            {!sidebarCollapsed && (
              <>
                <div className="px-3 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isSupervisor ? "Administration" : "Reports"}
                  </p>
                </div>
                <div className="px-3 space-y-1">
                  {processedAdminItems.map((item) =>
                    renderNavItem(item, false),
                  )}
                </div>
              </>
            )}

            {sidebarCollapsed && (
              <div className="space-y-1">
                {processedAdminItems.map((item) => renderNavItem(item, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;