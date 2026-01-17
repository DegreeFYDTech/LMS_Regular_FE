import React, { useState, useEffect } from 'react';
import statesData from '../data/cityandstatejson.json';
import {
  fetchLeadAssignmentRules,
  createLeadAssignmentRule,
  updateLeadAssignmentRule,
  deleteLeadAssignmentRule,
  toggleLeadAssignmentRule,
  fetchL2Agents,
  fetchLeadOptions,
} from '../network/leadassignmentl2';
import RuleForm from '../components/RuleForm';
import RuleTable from '../components/RuleTable';
import RuleCards from '../components/RuleCards';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import { Table, Grid, Plus, Settings, Filter } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const LeadAssignmentRules = () => {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); 
  const [newRule, setNewRule] = useState({
    conditions: {
      utmCampaign: [],
      first_source_url: '',
      source: [],
      mode: [],
      preferred_budget: [],
      current_profession: [],
      preferred_level: [],
      preferred_degree: [],
      preferred_specialization: [],
      preferred_city: [],
      preferred_state: []
    },
    assigned_counsellor_ids: [], 
    is_active: true,
    custom_rule_name: ''
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [options, setOptions] = useState({
    utmCampaign: ['Any'],
    first_source_url: ['Any'],
    source: ['Any'],
    mode: ['Any'],
    preferred_budget: ['Any', '0-50000', '50000-70000', '70000-100000', '100000-150000', '150000-200000', '200000-999999999'],
    current_profession: ['Any', 'Working Professional', 'Government Exam Prep', 'Looking for Job', 'Skill Course', 'Business Owner', 'Other'],
    preferred_level: ['Any', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate'],
    preferred_degree: ['Any'],
    preferred_specialization: ['Any'],
    preferred_city: ['Any'],
    preferred_state: ["Any"],
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
        loadLeadOptions(),
        loadFilterOptions()
      ]);
      initializeStatesCities();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await fetchLeadAssignmentRules();
      if (response.success) {
        setRules(response.data || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await fetchL2Agents();
      setAgents(data);
      setOptions(prev => ({ ...prev, counsellors: [...data] }));
    } catch (error) {
      console.error('Error loading agents:', error);
      setOptions(prev => ({ ...prev, counsellors: ["Any"] }));
    }
  };

  const loadLeadOptions = async () => {
    try {
      const data = await fetchLeadOptions();
      setOptions(prev => ({
        ...prev,
        mode: [...(data?.data.mode || []), 'Any'],
        source: [...(data?.data.source || []), 'Any'],
        utmCampaign: [...(data?.data.utm_campaign || data?.data?.campaign_name || []), 'Any']
      }));
    } catch (error) {
      console.error('Error loading lead options:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
       const data = await axios.get(
          `${BASE_URL}/universitycourse/dropdown`
        );;
      console.log("data",data.data)
      const degrees = data.data.data.degrees || [];
      const specializations = data.data.data.specializations || [];
      
      setOptions(prev => ({
        ...prev,
        preferred_degree: ['Any', ...degrees],
        preferred_specialization: ['Any', ...specializations]
      }));
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const initializeStatesCities = () => {
    const stateNames = statesData.map(state => state.name);
    const allCities = statesData.flatMap(state => state.cities);

    setOptions(prev => ({
      ...prev,
      preferred_state: ["Any", ...stateNames],
      preferred_city: ["Any", ...allCities]
    }));
  };

  const processFirstSourceUrl = (value) => {
    if (typeof value === 'string') {
      return value.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    }
    return Array.isArray(value) ? value : [];
  };

  const prepareRulePayload = (rule) => {
    const transformedCounsellors = rule.assigned_counsellor_ids.map(counsellor => {
      if (typeof counsellor === 'string') {
        return counsellor;
      }
      return counsellor.counsellor_id || counsellor._id;
    });

    const processedConditions = { ...rule.conditions };
    if (processedConditions.first_source_url) {
      processedConditions.first_source_url = processFirstSourceUrl(processedConditions.first_source_url);
    }

    const payload = {
      ...rule,
      assigned_counsellor_ids: transformedCounsellors,
      conditions: processedConditions
    };

    const allowedFields = [
      'utmCampaign', 'first_source_url', 'source', 'mode', 'preferred_budget',
      'current_profession', 'preferred_level', 'preferred_degree', 
      'preferred_specialization', 'preferred_city', 'preferred_state'
    ];
    
    Object.keys(payload.conditions).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete payload.conditions[key];
      } else if (Array.isArray(payload.conditions[key]) && payload.conditions[key].length === 0) {
        delete payload.conditions[key];
      }
    });

    return payload;
  };

  const handleAddRule = async () => {
    if (newRule.assigned_counsellor_ids.length === 0) {
      alert('Please select at least one counsellor');
      return;
    }

    setSubmitting(true);
    try {
      const payload = prepareRulePayload(newRule);
      const response = await createLeadAssignmentRule(payload);
      if (response.success) {
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
      const payload = prepareRulePayload(editingRule);
      const response = await updateLeadAssignmentRule(editingRule.lead_assignment_rule_l2_id, payload);
      if (response.success) {
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
      const response = await deleteLeadAssignmentRule(ruleId);
      if (response.success) {
        await loadRules();
        alert('Rule deleted successfully!');
      }
    } catch (error) {
      alert('Error deleting rule: ' + error.message);
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const response = await toggleLeadAssignmentRule(ruleId);
      if (response.success) {
        await loadRules();
      }
    } catch (error) {
      alert('Error toggling rule status: ' + error.message);
    }
  };

  const handleDuplicateRule = (rule) => {
    const duplicatedRule = {
      conditions: { ...rule.conditions },
      assigned_counsellor_ids: rule.assigned_counsellor_ids ? [...rule.assigned_counsellor_ids] : [],
      is_active: true,
      custom_rule_name: rule.custom_rule_name + ' (Copy)'
    };
    setNewRule(duplicatedRule);
    setEditingRule(null);
    setShowFormModal(true);
  };

  const handleEditRule = (rule) => {
    const editRule = {
      ...rule,
      conditions: {
        utmCampaign: rule?.conditions?.utmCampaign || [],
        first_source_url: Array.isArray(rule.conditions.first_source_url)
          ? rule.conditions.first_source_url.join('\n')
          : rule.conditions.first_source_url || '',
        source: rule?.conditions?.source || [],
        mode: rule?.conditions?.mode || [],
        preferred_budget: rule?.conditions?.preferred_budget || [],
        current_profession: rule?.conditions?.current_profession || [],
        preferred_level: rule?.conditions?.preferred_level || [],
        preferred_degree: rule?.conditions?.preferred_degree || [],
        preferred_specialization: rule?.conditions?.preferred_specialization || [],
        preferred_city: rule?.conditions?.preferred_city || [],
        preferred_state: rule?.conditions?.preferred_state || []
      }
    };
    setEditingRule(editRule);
    setShowFormModal(true);
  };

  const resetNewRule = () => {
    setNewRule({
      conditions: {
        utmCampaign: [],
        first_source_url: '',
        source: [],
        mode: [],
        preferred_budget: [],
        current_profession: [],
        preferred_level: [],
        preferred_degree: [],
        preferred_specialization: [],
        preferred_city: [],
        preferred_state: []
      },
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">L2 Lead Assignment Rules</h1>
              <p className="text-gray-600 mt-1">Configure rules for assigning leads to L2 counsellors</p>
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
            />
          ) : (
            <RuleCards
              rules={rules}
              onEditRule={handleEditRule}
              onDeleteRule={handleDeleteRule}
              onToggleRule={handleToggleRule}
              onDuplicateRule={handleDuplicateRule}
            />
          )}
        </div>

        {rules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-6">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Rules Configured</h3>
              <p className="text-gray-600 mb-6">Create your first rule to start assigning leads to L2 counsellors.</p>
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
          title={editingRule ? "Edit Rule" : "Create New Rule"}
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
          <RuleForm
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

export default LeadAssignmentRules;