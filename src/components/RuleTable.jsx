import React, { useState } from 'react';
import { Edit3, Copy, Trash2, Power, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import Tooltip from './Tooltip';

const RuleTable = ({ rules, onEditRule, onDeleteRule, onToggleRule, onDuplicateRule, idKey = 'lead_assignment_rule_l2_id', type = 'l2' }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleExpand = (ruleId) => {
    setExpandedRow(expandedRow === ruleId ? null : ruleId);
  };

  const formatConditions = (rule) => {
    if (type === 'l3') {
      const parts = [];
      if (rule.university_name?.length > 0) parts.push(`University: ${rule.university_name.join(', ')}`);
      if (rule.course_conditions?.stream?.length > 0) parts.push(`Streams: ${rule.course_conditions.stream.join(', ')}`);
      if (rule.course_conditions?.degree?.length > 0) parts.push(`Degrees: ${rule.course_conditions.degree.join(', ')}`);
      if (rule.source?.length > 0) parts.push(`Source: ${rule.source.join(', ')}`);
      return parts.join(' • ') || 'Any';
    }

    const conditions = rule.conditions || {};
    const displayFields = [
      { key: 'preferred_degree', label: 'Degree' },
      { key: 'preferred_specialization', label: 'Specialization' },
      { key: 'preferred_budget', label: 'Budget' },
      { key: 'preferred_state', label: 'State' },
      { key: 'preferred_city', label: 'City' },
      { key: 'current_profession', label: 'Profession' },
      { key: 'preferred_level', label: 'Level' },
      { key: 'source', label: 'Source' },
      { key: 'mode', label: 'Mode' },
      { key: 'utmCampaign', label: 'UTM' }
    ];

    return displayFields
      .filter(field => conditions[field.key] && conditions[field.key].length > 0)
      .map(field => `${field.label}: ${conditions[field.key].join(', ')}`)
      .join(' • ') || 'Any';
  };

  const getAgents = (rule) => {
    return rule.counsellors || rule.assignedCounsellorDetails || [];
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rule
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conditions
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agents
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rules.map((rule) => {
            const ruleId = rule[idKey];
            const agents = getAgents(rule);
            return (
              <React.Fragment key={ruleId}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rule.custom_rule_name || rule.name}</div>
                      <div className="text-xs text-gray-500">ID: {ruleId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="text-sm text-gray-900 truncate" title={formatConditions(rule)}>
                        {formatConditions(rule)}
                      </div>
                      <button
                        onClick={() => toggleExpand(ruleId)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                      >
                        {expandedRow === ruleId ? (
                          <>
                            <ChevronUp size={12} className="mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} className="mr-1" />
                            Show More
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {agents.slice(0, 2).map((agent) => (
                        <span key={agent.counsellor_id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {agent.counsellor_name}
                        </span>
                      ))}
                      {agents.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{agents.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Tooltip text="Toggle Status">
                        <button
                          onClick={() => onToggleRule(ruleId)}
                          className={`p-1 rounded ${rule.is_active ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                        >
                          {rule.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
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
                      <Tooltip text="Duplicate">
                        <button
                          onClick={() => onDuplicateRule(rule)}
                          className="p-1 text-yellow-600 hover:text-yellow-800 rounded"
                        >
                          <Copy size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete">
                        <button
                          onClick={() => onDeleteRule(ruleId)}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRow === ruleId && (
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-6 py-4">
                      {type === 'l3' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[
                            { key: 'university_name', label: 'University', value: rule.university_name },
                            { key: 'stream', label: 'Stream', value: rule.course_conditions?.stream },
                            { key: 'specialization', label: 'Specialization', value: rule.course_conditions?.specialization },
                            { key: 'degree', label: 'Degree', value: rule.course_conditions?.degree },
                            { key: 'level', label: 'Level', value: rule.course_conditions?.level },
                            { key: 'courseName', label: 'Course Name', value: rule.course_conditions?.courseName },
                            { key: 'source', label: 'Source', value: rule.source }
                          ].map(item => {
                            if (!item.value || (Array.isArray(item.value) && item.value.length === 0)) return null;
                            return (
                              <div key={item.key} className="bg-white p-3 rounded border">
                                <div className="text-xs font-medium text-gray-500 uppercase mb-1">{item.label}</div>
                                <div className="text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {(Array.isArray(item.value) ? item.value : [item.value]).map((val, idx) => (
                                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{val}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.entries(rule.conditions || {}).map(([key, value]) => {
                            if (!Array.isArray(value) || value.length === 0) return null;

                            const displayNames = {
                              preferred_degree: 'Degree',
                              preferred_specialization: 'Specialization',
                              preferred_budget: 'Budget Range',
                              preferred_state: 'State',
                              preferred_city: 'City',
                              current_profession: 'Profession',
                              preferred_level: 'Level',
                              source: 'Source',
                              mode: 'Mode',
                              utmCampaign: 'UTM Campaign',
                              first_source_url: 'Domains'
                            };

                            return (
                              <div key={key} className="bg-white p-3 rounded border">
                                <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                  {displayNames[key] || key}
                                </div>
                                <div className="text-sm">
                                  {key === 'first_source_url' ? (
                                    <div className="space-y-1">
                                      {value.map((url, idx) => (
                                        <div key={idx} className="text-gray-700 truncate">{url}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {value.map((item, idx) => (
                                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No rules found</div>
          <div className="text-gray-500 text-sm">Create your first rule to get started</div>
        </div>
      )}
    </div>
  );
};

export default RuleTable;