import React, { useState } from 'react';
import { Edit3, Copy, Trash2, Power, Users, Calendar } from 'lucide-react';
import Tooltip from './Tooltip';

const RuleCards = ({ rules, onEditRule, onDeleteRule, onToggleRule, onDuplicateRule, idKey = 'lead_assignment_rule_l2_id', type = 'l2' }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleExpand = (ruleId) => {
    setExpandedCard(expandedCard === ruleId ? null : ruleId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getConditionCount = (rule) => {
    if (type === 'l3') {
      let count = 0;
      if (rule.university_name?.length > 0) count++;
      if (rule.source?.length > 0) count++;
      if (rule.course_conditions) {
        Object.values(rule.course_conditions).forEach(val => {
          if (Array.isArray(val) && val.length > 0) count++;
        });
      }
      return count;
    }
    return Object.values(rule.conditions || {}).filter(val =>
      Array.isArray(val) && val.length > 0
    ).length;
  };

  const getAgents = (rule) => {
    return rule.counsellors || rule.assignedCounsellorDetails || [];
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => {
          const ruleId = rule[idKey];
          const conditionCount = getConditionCount(rule);
          const isExpanded = expandedCard === ruleId;
          const agents = getAgents(rule);

          return (
            <div key={ruleId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {rule.custom_rule_name || rule.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">ID: {ruleId}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tooltip text="Toggle Status">
                      <button
                        onClick={() => onToggleRule(ruleId)}
                        className={`p-1 rounded ${rule.is_active ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                      >
                        <Power size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Edit">
                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded"
                      >
                        <Edit3 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users size={12} />
                      <span>{agents.length || 0} agents</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {conditionCount} conditions
                  </span>
                </div>
              </div>

              {/* Card Body - Summary */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Key Conditions Summary */}
                  {type === 'l3' ? (
                    <>
                      {rule.university_name?.length > 0 && (
                        <div className="flex items-start">
                          <div className="w-24 text-xs text-gray-500 font-medium">Univ:</div>
                          <div className="flex-1 text-xs truncate">{rule.university_name.slice(0, 2).join(', ')}</div>
                        </div>
                      )}
                      {rule.course_conditions?.stream?.length > 0 && (
                        <div className="flex items-start">
                          <div className="w-24 text-xs text-gray-500 font-medium">Stream:</div>
                          <div className="flex-1 text-xs truncate">{rule.course_conditions.stream.slice(0, 2).join(', ')}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    Object.entries(rule.conditions || {}).slice(0, 3).map(([key, value]) => {
                      if (!Array.isArray(value) || value.length === 0) return null;

                      const displayNames = {
                        preferred_degree: 'Degree',
                        preferred_specialization: 'Specialization',
                        preferred_budget: 'Budget',
                        preferred_state: 'State'
                      };

                      if (!displayNames[key]) return null;

                      return (
                        <div key={key} className="flex items-start">
                          <div className="w-24 text-xs text-gray-500 font-medium">
                            {displayNames[key]}:
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1">
                              {value.slice(0, 2).map((item, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {item}
                                </span>
                              ))}
                              {value.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{value.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Expand/Collapse Button */}
                {conditionCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleExpand(ruleId)}
                      className="text-sm text-blue-600 hover:text-blue-800 w-full flex items-center justify-center"
                    >
                      {isExpanded ? 'Show Less' : 'Show All Conditions'}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Conditions */}
              {isExpanded && conditionCount > 0 && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">All Conditions</h4>
                    <div className="space-y-3">
                      {type === 'l3' ? (
                        <>
                          {[
                            { label: 'University', value: rule.university_name },
                            { label: 'Stream', value: rule.course_conditions?.stream },
                            { label: 'Specialization', value: rule.course_conditions?.specialization },
                            { label: 'Source', value: rule.source }
                          ].map(item => {
                            if (!item.value || item.value.length === 0) return null;
                            return (
                              <div key={item.label} className="text-sm">
                                <div className="font-medium text-gray-600 mb-1">{item.label}:</div>
                                <div className="flex flex-wrap gap-1">
                                  {item.value.map((v, i) => (
                                    <span key={i} className="text-xs bg-white text-gray-700 px-2 py-1 rounded border">{v}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        Object.entries(rule.conditions || {}).map(([key, value]) => {
                          if (!Array.isArray(value) || value.length === 0) return null;

                          const displayNames = {
                            utmCampaign: 'UTM Campaign',
                            first_source_url: 'Domain URLs',
                            source: 'Source',
                            mode: 'Mode',
                            preferred_budget: 'Budget Range',
                            current_profession: 'Profession',
                            preferred_level: 'Level',
                            preferred_degree: 'Degree',
                            preferred_specialization: 'Specialization',
                            preferred_city: 'City',
                            preferred_state: 'State'
                          };

                          return (
                            <div key={key} className="text-sm">
                              <div className="font-medium text-gray-600 mb-1">
                                {displayNames[key] || key}:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {key === 'first_source_url' ? (
                                  <div className="space-y-1">
                                    {value.map((url, idx) => (
                                      <div key={idx} className="text-gray-700 text-xs bg-white p-2 rounded border">
                                        {url}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  value.map((item, idx) => (
                                    <span key={idx} className="text-xs bg-white text-gray-700 px-2 py-1 rounded border">
                                      {item}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="px-4 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {agents.slice(0, 2).map((agent) => (
                      <Tooltip key={agent.counsellor_id} text={agent.counsellor_name}>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {agent.counsellor_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                    {agents.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{agents.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tooltip text="Duplicate">
                      <button
                        onClick={() => onDuplicateRule(rule)}
                        className="text-gray-400 hover:text-yellow-600"
                      >
                        <Copy size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip text="Delete">
                      <button
                        onClick={() => onDeleteRule(ruleId)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No rules configured</div>
          <div className="text-gray-500 text-sm">Click "New Rule" to create your first rule</div>
        </div>
      )}
    </div>
  );
};

export default RuleCards;