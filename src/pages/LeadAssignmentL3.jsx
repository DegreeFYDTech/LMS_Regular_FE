import React, { useState, useEffect } from 'react';
import {
    fetchLeadAssignmentRulesL3,
    createLeadAssignmentRuleL3,
    updateLeadAssignmentRuleL3,
    deleteLeadAssignmentRuleL3,
    toggleLeadAssignmentRuleL3,
    fetchL3Agents,
} from '../network/leadassignmentl3';
import RuleFormL3 from '../components/RuleFormL3';
import RuleTable from '../components/RuleTable';
import RuleCards from '../components/RuleCards';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import { Table, Grid, Plus, Settings, Filter } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const LeadAssignmentL3 = () => {
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [newRule, setNewRule] = useState({
        university_name: [],
        course_conditions: {
            stream: [],
            degree: [],
            specialization: [],
            level: [],
            courseName: []
        },
        source: [],
        assigned_counsellor_ids: [],
        is_active: true,
        custom_rule_name: ''
    });
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [options, setOptions] = useState({
        universities: [],
        streams: [],
        degrees: [],
        specializations: [],
        levels: [],
        courses: [],
        source: [],
        counsellors: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadRules(),
                loadAgents(),
                loadInitialDropdownData(),
                fetchSources()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRules = async () => {
        try {
            const response = await fetchLeadAssignmentRulesL3();
            setRules(response || []);
        } catch (error) {
            console.error('Error loading rules:', error);
        }
    };

    const loadAgents = async () => {
        try {
            const data = await fetchL3Agents();
            setAgents(data);
            setOptions(prev => ({ ...prev, counsellors: [...data] }));
        } catch (error) {
            console.error('Error loading agents:', error);
        }
    };

    const fetchSources = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/filterOption`, {
                withCredentials: true
            });
            setOptions(prev => ({ ...prev, source: response?.data?.data?.source || [] }));
        } catch (err) {
            console.log("Error fetching sources:", err);
        }
    };

    const loadInitialDropdownData = async () => {
        try {
            const response = await fetch(`${BASE_URL}/universitycourse/dropdown`);
            const Jsondata = await response.json();
            if (Jsondata.success) {
                setOptions(prev => ({
                    ...prev,
                    universities: Jsondata.data.universities || Jsondata.data.university_name || [],
                    streams: Jsondata.data.streams || [],
                    degrees: Jsondata.data.degrees || [],
                    specializations: Jsondata.data.specializations || [],
                    levels: Jsondata.data.levels || [],
                    courses: Jsondata.data.courses || []
                }));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleAddRule = async () => {
        if (newRule.assigned_counsellor_ids.length === 0) {
            alert('Please select at least one counsellor');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...newRule,
                custom_rule_name: newRule.custom_rule_name.trim()
            };
            const response = await createLeadAssignmentRuleL3(payload);
            if (response) {
                await loadRules();
                resetNewRule();
                setShowFormModal(false);
                alert('Rule created successfully!');
            }
        } catch (error) {
            alert('Error creating rule: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRule = async () => {
        if (editingRule.assigned_counsellor_ids.length === 0) {
            alert('Please select at least one counsellor');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...editingRule,
                custom_rule_name: editingRule.custom_rule_name.trim()
            };
            const response = await updateLeadAssignmentRuleL3(editingRule.l3_assignment_rulesets_id, payload);
            if (response) {
                await loadRules();
                setEditingRule(null);
                setShowFormModal(false);
                alert('Rule updated successfully!');
            }
        } catch (error) {
            alert('Error updating rule: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) {
            return;
        }

        try {
            const response = await deleteLeadAssignmentRuleL3(ruleId);
            if (response) {
                await loadRules();
                alert('Rule deleted successfully!');
            }
        } catch (error) {
            alert('Error deleting rule: ' + error.message);
        }
    };

    const handleToggleRule = async (ruleId) => {
        try {
            const response = await toggleLeadAssignmentRuleL3(ruleId);
            if (response) {
                await loadRules();
            }
        } catch (error) {
            alert('Error toggling rule status: ' + error.message);
        }
    };

    const handleDuplicateRule = (rule) => {
        const duplicatedRule = {
            university_name: Array.isArray(rule.university_name) ? [...rule.university_name] : [],
            course_conditions: {
                stream: Array.isArray(rule.course_conditions?.stream) ? [...rule.course_conditions.stream] : [],
                degree: Array.isArray(rule.course_conditions?.degree) ? [...rule.course_conditions.degree] : [],
                specialization: Array.isArray(rule.course_conditions?.specialization) ? [...rule.course_conditions.specialization] : [],
                level: Array.isArray(rule.course_conditions?.level) ? [...rule.course_conditions.level] : [],
                courseName: Array.isArray(rule.course_conditions?.courseName) ? [...rule.course_conditions.courseName] : []
            },
            source: Array.isArray(rule.source) ? [...rule.source] : [],
            assigned_counsellor_ids: rule.assigned_counsellor_ids ? [...rule.assigned_counsellor_ids] : [],
            is_active: true,
            custom_rule_name: (rule.custom_rule_name || 'Rule') + ' (Copy)'
        };
        setNewRule(duplicatedRule);
        setEditingRule(null);
        setShowFormModal(true);
    };

    const handleEditRule = (rule) => {
        const editRule = {
            ...rule,
            assigned_counsellor_ids: rule.assigned_counsellor_ids?.map(agent => typeof agent === 'object' ? agent.counsellor_id : agent) || []
        };
        setEditingRule(editRule);
        setShowFormModal(true);
    };

    const resetNewRule = () => {
        setNewRule({
            university_name: [],
            course_conditions: {
                stream: [],
                degree: [],
                specialization: [],
                level: [],
                courseName: []
            },
            source: [],
            assigned_counsellor_ids: [],
            is_active: true,
            custom_rule_name: ''
        });
    };

    const handleCancelForm = () => {
        setShowFormModal(false);
        setEditingRule(null);
        resetNewRule();
    };

    const handleFormSubmit = () => {
        if (editingRule) {
            handleUpdateRule();
        } else {
            handleAddRule();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:py-6 md:px-14">
            <div className="mx-auto">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">L3 Lead Assignment Rules</h1>
                            <p className="text-gray-600 mt-1">Configure rules for assigning leads to L3 counsellors</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>{rules.filter(r => r.is_active).length} Active</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>{rules.filter(r => !r.is_active).length} Inactive</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Settings size={16} />
                                <span>{rules.length} Total Rules</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter size={16} />
                                <span>{agents.length} Agents Available</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-white border border-gray-300 rounded-lg flex">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 flex items-center space-x-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Table size={18} />
                                    <span>Table</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`px-3 py-2 flex items-center space-x-2 ${viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Grid size={18} />
                                    <span>Cards</span>
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    resetNewRule();
                                    setEditingRule(null);
                                    setShowFormModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <Plus size={20} />
                                <span>New Rule</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {viewMode === 'table' ? (
                        <RuleTable
                            rules={rules}
                            onEditRule={handleEditRule}
                            onDeleteRule={handleDeleteRule}
                            onToggleRule={handleToggleRule}
                            onDuplicateRule={handleDuplicateRule}
                            idKey="l3_assignment_rulesets_id"
                            type="l3"
                        />
                    ) : (
                        <RuleCards
                            rules={rules}
                            onEditRule={handleEditRule}
                            onDeleteRule={handleDeleteRule}
                            onToggleRule={handleToggleRule}
                            onDuplicateRule={handleDuplicateRule}
                            idKey="l3_assignment_rulesets_id"
                            type="l3"
                        />
                    )}
                </div>

                {rules.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-6">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rules Configured</h3>
                            <p className="text-gray-600 mb-6">Create your first rule to start assigning leads to L3 counsellors.</p>
                            <button
                                onClick={() => {
                                    resetNewRule();
                                    setShowFormModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto"
                            >
                                <Plus size={20} />
                                <span>Create First Rule</span>
                            </button>
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={showFormModal}
                    onClose={handleCancelForm}
                    title={editingRule ? "Edit L3 Rule" : "Create New L3 Rule"}
                    iconColor="blue"
                    size="5xl"
                    height="lg"
                    confirmText={editingRule ? "Update Rule" : "Create Rule"}
                    cancelText="Cancel"
                    confirmColor="blue"
                    onConfirm={handleFormSubmit}
                    loading={submitting}
                    loadingText={editingRule ? "Updating..." : "Creating..."}
                >
                    <RuleFormL3
                        rule={editingRule || newRule}
                        options={options}
                        submitting={submitting}
                        isEditing={!!editingRule}
                        onRuleChange={editingRule ? setEditingRule : setNewRule}
                    />
                </Modal>
            </div>
        </div>
    );
};

export default LeadAssignmentL3;