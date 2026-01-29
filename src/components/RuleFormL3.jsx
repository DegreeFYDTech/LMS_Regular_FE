import React from 'react';
import MultiSelect from './MultiSelect';

const RuleFormL3 = ({
    rule,
    options,
    submitting,
    isEditing,
    onRuleChange
}) => {
    const handleUniversityChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            university_name: value,
            // Reset nested fields when university changes if desired, 
            // but following the legacy logic we just update university
        }));
    };

    const handleCourseChange = (field, value) => {
        onRuleChange(prev => ({
            ...prev,
            course_conditions: {
                ...prev.course_conditions,
                [field]: value
            }
        }));
    };

    const handleSourceChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            source: value
        }));
    };

    const handleCounsellorChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            assigned_counsellor_ids: value
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                </label>
                <input
                    type="text"
                    value={rule?.custom_rule_name || ''}
                    onChange={(e) =>
                        onRuleChange(prev => ({
                            ...prev,
                            custom_rule_name: e.target.value
                        }))
                    }
                    placeholder="Enter rule name (e.g., L3 International Sales)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                    <MultiSelect
                        options={options.universities || []}
                        value={rule.university_name || []}
                        onChange={handleUniversityChange}
                        placeholder="Select Universities"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <MultiSelect
                        options={options.source || []}
                        value={rule.source || []}
                        onChange={handleSourceChange}
                        placeholder="Select Sources"
                    />
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 capitalize">Course Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Streams</label>
                        <MultiSelect
                            options={options.streams || []}
                            value={rule.course_conditions?.stream || []}
                            onChange={(val) => handleCourseChange('stream', val)}
                            placeholder="Select Streams"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Degrees</label>
                        <MultiSelect
                            options={options.degrees || []}
                            value={rule.course_conditions?.degree || []}
                            onChange={(val) => handleCourseChange('degree', val)}
                            placeholder="Select Degrees"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                        <MultiSelect
                            options={options.specializations || []}
                            value={rule.course_conditions?.specialization || []}
                            onChange={(val) => handleCourseChange('specialization', val)}
                            placeholder="Select Specializations"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Levels</label>
                        <MultiSelect
                            options={options.levels || []}
                            value={rule.course_conditions?.level || []}
                            onChange={(val) => handleCourseChange('level', val)}
                            placeholder="Select Levels"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Names</label>
                        <MultiSelect
                            options={options.courses || []}
                            value={rule.course_conditions?.courseName || []}
                            onChange={(val) => handleCourseChange('courseName', val)}
                            placeholder="Select Course Names"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to L3 Agents *
                </label>
                <MultiSelect
                    options={options.counsellors}
                    value={rule.assigned_counsellor_ids}
                    onChange={handleCounsellorChange}
                    placeholder="Select counsellor(s)"
                />
                <p className="text-xs text-blue-600 mt-2">
                    Leads matching this rule will be assigned to selected L3 agents using round-robin
                </p>
            </div>
        </div>
    );
};

export default RuleFormL3;
