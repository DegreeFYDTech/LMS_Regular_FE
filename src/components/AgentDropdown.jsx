import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserOutlined,
  DownOutlined,
  UpOutlined,
  SearchOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Input, Badge, Avatar, Tag } from 'antd';

const AgentsDropdown = ({ agents, onAgentSelect, selectedAgentProp, sidebarCollapsed }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAgent, setSelectedAgent] = useState(() => {
        if (selectedAgentProp && (selectedAgentProp.counsellor_id || selectedAgentProp.name)) {
            return selectedAgentProp;
        }
        try {
            const savedAgent = localStorage.getItem("agent");
            return savedAgent ? JSON.parse(savedAgent) : {
                name: "All Agents",
                counsellor_id: null,
            };
        } catch {
            return {
                name: "All Agents",
                counsellor_id: null,
            };
        }
    });
    const dropdownRef = useRef(null);
    
    // Sync state if prop changes
    useEffect(() => {
        if (selectedAgentProp && (selectedAgentProp.counsellor_id !== selectedAgent.counsellor_id || selectedAgentProp.name !== selectedAgent.name)) {
            setSelectedAgent(selectedAgentProp);
        }
    }, [selectedAgentProp]);

    // Helper function to get the correct ID from agent object
    const getAgentId = useCallback((agent) => {
        return agent.counsellor_id || agent._id || agent.id;
    }, []);

    // Helper function to get the display name for the selected agent
    const getDisplayName = useCallback((agent) => {
        if (!agent) return "Select Counsellor";
        // For "All Agents" option, use the name property
        if (agent.name === "All Agents" || agent.counsellor_id === null) {
            return "All Agents";
        }
        // For regular agents, use counsellor_name
        return agent.counsellor_name || agent.name || "Select Counsellor";
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAgentClick = useCallback((agent) => {
        setSelectedAgent(agent);
        localStorage.setItem("agent", JSON.stringify(agent));
        if (onAgentSelect) {
            onAgentSelect(agent);
        }
        setIsOpen(false);
        setSearchTerm("");
    }, [onAgentSelect]);

    const filteredAgents = agents?.filter((agent) =>
        agent?.counsellor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="w-full" ref={dropdownRef}>
            {!sidebarCollapsed && (
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Select Agent
                </div>
            )}

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between w-full text-left bg-white border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
                        sidebarCollapsed ? 'p-2 rounded-lg' : 'px-3 py-1 rounded-lg'
                    }`}
                >
                    <div className="flex items-center">
                        
                        {!sidebarCollapsed && (
                            <span className="ml-2 text-sm font-medium text-gray-700 truncate max-w-[120px]">
                                {getDisplayName(selectedAgent)}
                            </span>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <div className="text-gray-400">
                            {isOpen ? <UpOutlined size={1}/> : <DownOutlined size={1}/>}
                        </div>
                    )}
                </button>

                {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        Agents
                    </div>
                )}

                {isOpen && !sidebarCollapsed && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {/* Search input */}
                        <div className="p-2 border-b border-gray-100">
                            <Input
                                placeholder="Search agents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                prefix={<SearchOutlined className="text-gray-400" />}
                                className="rounded-md"
                                size="middle"
                                autoFocus
                            />
                        </div>

                        {/* Dropdown list */}
                        <div className="max-h-60 overflow-y-auto">
                            <div
                                onClick={() => handleAgentClick({ name: "All Agents", counsellor_id: null })}
                                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-blue-50 flex items-center justify-between ${
                                    selectedAgent.name === "All Agents" 
                                        ? 'bg-blue-50 text-blue-600 font-medium' 
                                        : 'text-gray-700 hover:text-blue-600'
                                }`}
                            >
                                <div className="flex items-center">
                                    {/* <Avatar 
                                        size="small" 
                                        icon={<UserOutlined />} 
                                        className="bg-blue-100 text-blue-600"
                                    /> */}
                                    <span className="ml-2">All Agents</span>
                                </div>
                                <Badge 
                                    count={agents?.length || 0} 
                                    size="small" 
                                    style={{ backgroundColor: '#1890ff' }}
                                />
                            </div>

                            {filteredAgents.length > 0 ? (
                                filteredAgents.map((agent) => (
                                    <div
                                        key={getAgentId(agent)}
                                        onClick={() => handleAgentClick(agent)}
                                        className={`px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-blue-50 ${
                                            getAgentId(selectedAgent) === getAgentId(agent) 
                                                ? 'bg-blue-50 text-blue-600 font-medium' 
                                                : 'text-gray-700 hover:text-blue-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                              
                                                <div className="ml-2">
                                                    <div className="font-medium truncate max-w-[140px]">
                                                        {agent.counsellor_name}
                                                        <span className="ml-1">({agent.role})</span>
                                                    </div>
                                                  
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {agent.status === 'active' && (
                                                    <CheckCircleOutlined className="text-green-500" />
                                                )}
                                                {agent.leadCount > 0 && (
                                                    <Tag 
                                                        color="blue" 
                                                        style={{ margin: 0, fontSize: '11px', padding: '0 6px' }}
                                                    >
                                                        {agent.leadCount}
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                                    No agents found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentsDropdown;