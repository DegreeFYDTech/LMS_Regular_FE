import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import {
    getAllCounsellors,
    assignCounsellorsToStudents,
    getDistinctL3CounsellorsByStudentIds,
    replaceL3CounsellorForStudents,
    replaceL3CounsellorForSpecificJourney
} from '../network/counsellor';
import { Search, X, ChevronDown, User, ArrowRight, Info, Layers, Users, GitBranch } from 'lucide-react';

const AssignedLeadManually = ({
    setIsAssignedtoL2,
    setIsAssignedtoL3,
    selectedStudent,
    isAssignedtoL3,
    isAssignedtoL2
}) => {
    // State for L2 assignment
    const [counsellors, setCounsellors] = useState([]);
    const [filteredCounsellors, setFilteredCounsellors] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assignLoader, setassignLoader] = useState(false);

    // State for L3 replacement
    const [allL3Counsellors, setAllL3Counsellors] = useState([]);
    const [filteredAllL3Counsellors, setFilteredAllL3Counsellors] = useState([]);
    const [selectedNewCounsellor, setSelectedNewCounsellor] = useState(null);
    const [currentCounsellorInfo, setCurrentCounsellorInfo] = useState(null);
    const [replaceSearchTerm, setReplaceSearchTerm] = useState('');
    const [isNewCounsellorDropdownOpen, setIsNewCounsellorDropdownOpen] = useState(false);
    const [replaceLoading, setReplaceLoading] = useState(false);

    // State for journey data
    const [journeyDetails, setJourneyDetails] = useState([]);
    const [hasMultipleJourneys, setHasMultipleJourneys] = useState(false);
    const [journeyReplacements, setJourneyReplacements] = useState({});

    // New state for tab management
    const [activeTab, setActiveTab] = useState('single'); // 'single' or 'multiple'
    const [studentsWithSingleJourney, setStudentsWithSingleJourney] = useState([]);
    const [studentsWithMultipleJourneys, setStudentsWithMultipleJourneys] = useState([]);
    const [multipleJourneyDetails, setMultipleJourneyDetails] = useState([]);
    const [singleJourneyDetails, setSingleJourneyDetails] = useState([]);

    const isL3Assignment = isAssignedtoL3;
    const isL2Assignment = isAssignedtoL2;

    // Fetch L2 counsellors
    useEffect(() => {
        if (isL2Assignment) {
            const fetchCounsellors = async () => {
                try {
                    setLoading(true);
                    const res = await getAllCounsellors('l2');
                    setCounsellors(res.data || res || []);
                    setFilteredCounsellors(res.data || res || []);
                } catch (error) {
                    console.error('Error fetching L2 counsellors:', error);
                    setCounsellors([]);
                    setFilteredCounsellors([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchCounsellors();
        }
    }, [isL2Assignment]);

    // Fetch L3 data and categorize students
    useEffect(() => {
        if (isL3Assignment) {
            const fetchL3Data = async () => {
                try {
                    setReplaceLoading(true);
                    const studentIds = selectedStudent.map(s => s.student_id);

                    const response = await getDistinctL3CounsellorsByStudentIds({ studentIds });
                    const data = response.data || {};

                    // Set journey details
                    setJourneyDetails(data.journeyDetails || []);
                    setHasMultipleJourneys(data.hasMultipleJourneys || false);

                    // Categorize students based on journey count
                    const journeysByStudent = data.journeysByStudent || {};

                    const singleJourneyStudents = [];
                    const multipleJourneyStudents = [];
                    const singleJourneys = [];
                    const multipleJourneys = [];

                    Object.keys(journeysByStudent).forEach(studentId => {
                        const studentData = journeysByStudent[studentId];
                        if (studentData.journey_count === 1) {
                            singleJourneyStudents.push(studentId);
                            singleJourneys.push(...studentData.journeys);
                        } else {
                            multipleJourneyStudents.push(studentId);
                            multipleJourneys.push(...studentData.journeys);
                        }
                    });

                    setStudentsWithSingleJourney(singleJourneyStudents);
                    setStudentsWithMultipleJourneys(multipleJourneyStudents);
                    setSingleJourneyDetails(singleJourneys);
                    setMultipleJourneyDetails(multipleJourneys);

                    if (singleJourneyStudents.length === 0 && multipleJourneyStudents.length > 0) {
                        setActiveTab('multiple');
                    } else {
                        setActiveTab('single');
                    }

                    // Set current counsellor info for single journey students if they all have the same counsellor
                    if (singleJourneys.length > 0) {
                        const uniqueCounsellors = [...new Set(singleJourneys.map(j => j.current_counsellor_id))];
                        if (uniqueCounsellors.length === 1) {
                            setCurrentCounsellorInfo({
                                assigned_l3_counsellor_id: singleJourneys[0].current_counsellor_id,
                                counsellor_name: singleJourneys[0].current_counsellor_name
                            });
                        }
                    }

                    // Fetch all L3 counsellors
                    const allRes = await getAllCounsellors('l3');
                    setAllL3Counsellors(allRes.data || allRes || []);
                    setFilteredAllL3Counsellors(allRes.data || allRes || []);

                } catch (error) {
                    console.error('Error fetching L3 data:', error);
                } finally {
                    setReplaceLoading(false);
                }
            };

            fetchL3Data();
        }
    }, [isL3Assignment, selectedStudent]);

    // Filter L2 counsellors
    useEffect(() => {
        if (!searchTerm) {
            setFilteredCounsellors(counsellors);
        } else {
            const filtered = counsellors.filter(counsellor =>
                counsellor.counsellor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                counsellor.counsellor_email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCounsellors(filtered);
        }
    }, [searchTerm, counsellors]);

    // Filter L3 counsellors
    useEffect(() => {
        if (!replaceSearchTerm) {
            setFilteredAllL3Counsellors(allL3Counsellors);
        } else {
            const filteredAll = allL3Counsellors.filter(c =>
                c.counsellor_name?.toLowerCase().includes(replaceSearchTerm.toLowerCase()) ||
                c.counsellor_email?.toLowerCase().includes(replaceSearchTerm.toLowerCase())
            );
            setFilteredAllL3Counsellors(filteredAll);
        }
    }, [replaceSearchTerm, allL3Counsellors]);

    // L2 Assignment Handlers
    const handleAgentSelect = (agent) => {
        setSelectedAgents(prev => {
            const isAlreadySelected = prev.some(selected => selected.counsellor_id === agent.counsellor_id);
            if (isAlreadySelected) {
                return prev.filter(selected => selected.counsellor_id !== agent.counsellor_id);
            } else {
                return [...prev, agent];
            }
        });
    };

    const handleRemoveAgent = (agentId) => {
        setSelectedAgents(prev => prev.filter(agent => agent.counsellor_id !== agentId));
    };

    const handleAssign = async () => {
        try {
            setassignLoader(true);

            const assignmentData = {
                assignmentType: 'L2',
                selectedStudents: selectedStudent.map(student => student.student_id),
                selectedAgents: selectedAgents.map(agent => ({
                    counsellorId: agent.counsellor_id,
                    name: agent.counsellor_name,
                    email: agent.counsellor_email
                }))
            };

            const response = await assignCounsellorsToStudents(assignmentData);

            if (response.success) {
                alert(`Successfully assigned ${selectedStudent.length} students to ${selectedAgents.length} L2 counsellor(s)`);
                window.location.reload();
            } else {
                alert('Assignment failed: ' + response.message);
            }
        } catch (error) {
            console.error('Error in handleAssign:', error);
            alert('Assignment failed. Please try again.');
        } finally {
            setIsAssignedtoL2(false);
            setassignLoader(false);
        }
    };

    const handleSingleReplace = async () => {
        if (!selectedNewCounsellor) {
            alert('Please select a new L3 counsellor');
            return;
        }

        try {
            setReplaceLoading(true);

            // Filter students with single journey
            const singleJourneyStudentIds = studentsWithSingleJourney;

            if (singleJourneyStudentIds.length === 0) {
                alert('No students with single journey found');
                return;
            }

            const replaceData = {
                studentIds: singleJourneyStudentIds,
                fromCounsellorId: currentCounsellorInfo?.assigned_l3_counsellor_id,
                toCounsellorId: selectedNewCounsellor.counsellor_id
            };

            const response = await replaceL3CounsellorForStudents(replaceData);

            if (response.success) {
                alert(`Successfully replaced counsellor for ${response.data.recordsUpdated} single journey entries`);
                window.location.reload();
            } else {
                alert('Failed to replace counsellor: ' + response.message);
            }
        } catch (error) {
            console.error('Error in handleSingleReplace:', error);
            alert('Failed to replace counsellor: ' + (error.response?.data?.message || error.message));
        } finally {
            setReplaceLoading(false);
        }
    };

    const handleMultipleReplace = async () => {
        try {
            const replacementsToProcess = Object.entries(journeyReplacements)
                .filter(([key, value]) => value && value !== '');

            if (replacementsToProcess.length === 0) {
                alert('Please select at least one replacement');
                return;
            }

            setReplaceLoading(true);

            const results = [];
            for (const [journeyKey, toCounsellorId] of replacementsToProcess) {
                const [studentId, courseId] = journeyKey.split('_');

                const replaceData = {
                    studentId,
                    courseId,
                    toCounsellorId
                };

                const response = await replaceL3CounsellorForSpecificJourney(replaceData);
                results.push(response);
            }

            const successCount = results.filter(r => r.success).length;
            alert(`Successfully processed ${successCount} out of ${replacementsToProcess.length} replacements for multiple journey students`);

            if (successCount === replacementsToProcess.length) {
                window.location.reload();
            }

        } catch (error) {
            console.error('Error in handleMultipleReplace:', error);
            alert('Failed to process replacements: ' + (error.response?.data?.message || error.message));
        } finally {
            setReplaceLoading(false);
        }
    };

    const handleClose = () => {
        if (isL3Assignment) {
            setIsAssignedtoL3(false);
        } else {
            setIsAssignedtoL2(false);
        }
    };

    const handleJourneyReplacementChange = (journeyKey, counsellorId) => {
        setJourneyReplacements(prev => ({
            ...prev,
            [journeyKey]: counsellorId
        }));
    };

    // Render L2 Assignment UI
    if (isL2Assignment) {
        return (
            <Modal
                isOpen={true}
                onClose={handleClose}
                title="Assign to L2 Agent"
                size="2xl"
                loading={assignLoader}
                loadingText={'Assigning...'}
                onConfirm={handleAssign}
                confirmText={`Assign to ${selectedAgents.length} Agent${selectedAgents.length !== 1 ? 's' : ''}`}
                cancelText="Cancel"
                confirmColor="blue"
                confirmDisabled={selectedAgents.length === 0}
            >
                <div className="space-y-6">
                    <p className="text-sm text-gray-600">
                        Select L2 agents to assign {selectedStudent?.length || 0} selected leads
                    </p>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">
                            Selected Leads ({selectedStudent?.length || 0})
                        </h3>
                        <div className="max-h-24 overflow-y-auto">
                            {selectedStudent?.map((student, index) => (
                                <div key={student.student_id || index} className="text-xs text-blue-800 py-1">
                                    {student.student_name} - {student.student_id}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select L2 Agents
                        </label>

                        {selectedAgents.length > 0 && (
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                    {selectedAgents.map((agent) => (
                                        <div
                                            key={agent.counsellor_id}
                                            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                                        >
                                            <User size={14} className="mr-1" />
                                            {agent.counsellor_name}
                                            <button
                                                onClick={() => handleRemoveAgent(agent.counsellor_id)}
                                                className="ml-2 text-blue-600 hover:text-blue-800"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <span className="text-gray-700">
                                    {selectedAgents.length > 0
                                        ? `${selectedAgents.length} agent(s) selected`
                                        : 'Select L2 agents'
                                    }
                                </span>
                                <ChevronDown
                                    className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    size={16}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search L2 agents..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto">
                                        {loading ? (
                                            <div className="p-4 text-center text-gray-500">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                <span className="block mt-2 text-sm">Loading agents...</span>
                                            </div>
                                        ) : filteredCounsellors.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                {searchTerm
                                                    ? 'No agents found matching your search'
                                                    : 'No L2 agents available.'
                                                }
                                            </div>
                                        ) : (
                                            filteredCounsellors.map((counsellor) => {
                                                const isSelected = selectedAgents.some(agent => agent.counsellor_id === counsellor.counsellor_id);
                                                return (
                                                    <div
                                                        key={counsellor.counsellor_id}
                                                        onClick={() => handleAgentSelect(counsellor)}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <User size={16} className="text-gray-400 mr-3" />
                                                            <div>
                                                                <div className="font-medium text-gray-900 text-sm">
                                                                    {counsellor.counsellor_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {counsellor.counsellor_email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }

    // Render L3 Replacement UI with Tabs
    if (isL3Assignment) {
        const hasSingleJourneyStudents = studentsWithSingleJourney.length > 0;
        const hasMultipleJourneyStudents = studentsWithMultipleJourneys.length > 0;
        console.log()
        return (
            <Modal
                isOpen={true}
                onClose={handleClose}
                title="Replace L3 Counsellor"
                size={activeTab === 'multiple' ? "5xl" : "2xl"}
                loading={replaceLoading}
                loadingText="Processing..."
                onConfirm={activeTab === 'multiple' ? handleMultipleReplace : handleSingleReplace}
                confirmText={activeTab === 'multiple' ? "Apply Selected Replacements" : "Replace Counsellor"}
                cancelText="Cancel"
                confirmColor="blue"
                confirmDisabled={activeTab === 'multiple'
                    ? Object.values(journeyReplacements).filter(v => v && v !== '').length === 0
                    : !selectedNewCounsellor
                }
            >
                <div className="space-y-6 p-2">
                    {/* Summary Section */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center justify-between">
                            <span>Selected Leads ({selectedStudent?.length || 0})</span>
                            <div className="flex gap-2">
                                {hasSingleJourneyStudents && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        <Users size={14} className="inline mr-1" />
                                        {studentsWithSingleJourney.length} with single journey
                                    </span>
                                )}
                                {hasMultipleJourneyStudents && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        <GitBranch size={14} className="inline mr-1" />
                                        {studentsWithMultipleJourneys.length} with multiple journeys
                                    </span>
                                )}
                            </div>
                        </h3>
                        <div className="max-h-24 overflow-y-auto">
                            {selectedStudent?.map((student) => {
                                const isMultiple = studentsWithMultipleJourneys.includes(student.student_id);
                                return (
                                    <div key={student.student_id} className="text-xs text-blue-800 py-1 flex justify-between">
                                        <span>{student.student_name} - {student.student_id}</span>
                                        {isMultiple && (
                                            <span className="bg-yellow-100 text-yellow-800 px-2 rounded-full text-xs">
                                                Multiple journeys
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabs - Show only if both types exist */}
                    {hasSingleJourneyStudents && hasMultipleJourneyStudents && (
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('single')}
                                    className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'single'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Users size={16} className="inline mr-2" />
                                    Single Journey ({studentsWithSingleJourney.length} students)
                                </button>
                                <button
                                    onClick={() => setActiveTab('multiple')}
                                    className={`py-2 px-4 font-medium text-sm border-b-2 ml-4 ${activeTab === 'multiple'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <GitBranch size={16} className="inline mr-2" />
                                    Multiple Journeys ({studentsWithMultipleJourneys.length} students, {multipleJourneyDetails.length} journeys)
                                </button>
                            </nav>
                        </div>
                    )}

                    {/* Single Journey Tab Content */}
                    {(activeTab === 'single' || !hasMultipleJourneyStudents) && hasSingleJourneyStudents && (
                        <div className="space-y-6">
                            {currentCounsellorInfo && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current L3 Counsellor for Single Journey Students
                                    </label>
                                    <div className="flex items-center">
                                        <User size={20} className="text-gray-500 mr-3" />
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {currentCounsellorInfo.counsellor_name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">
                                                Currently assigned to {studentsWithSingleJourney.length} student(s) with single journey
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New L3 Counsellor to Assign
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsNewCounsellorDropdownOpen(!isNewCounsellorDropdownOpen)}
                                        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <span className="text-gray-700">
                                            {selectedNewCounsellor
                                                ? selectedNewCounsellor.counsellor_name
                                                : 'Select new counsellor'
                                            }
                                        </span>
                                        <ChevronDown
                                            className={`transition-transform ${isNewCounsellorDropdownOpen ? 'rotate-180' : ''}`}
                                            size={16}
                                        />
                                    </button>

                                    {isNewCounsellorDropdownOpen && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search L3 counsellors..."
                                                        value={replaceSearchTerm}
                                                        onChange={(e) => setReplaceSearchTerm(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto">
                                                {replaceLoading ? (
                                                    <div className="p-4 text-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                    </div>
                                                ) : filteredAllL3Counsellors.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500">
                                                        No L3 counsellors available
                                                    </div>
                                                ) : (
                                                    filteredAllL3Counsellors.map((counsellor) => (
                                                        <div
                                                            key={counsellor.counsellor_id}
                                                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${selectedNewCounsellor?.counsellor_id === counsellor.counsellor_id
                                                                ? 'bg-green-50 border-l-4 border-l-green-500'
                                                                : ''
                                                                } ${currentCounsellorInfo?.assigned_l3_counsellor_id === counsellor.counsellor_id
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : ''
                                                                }`}
                                                            onClick={() => {
                                                                if (currentCounsellorInfo?.assigned_l3_counsellor_id === counsellor.counsellor_id) {
                                                                    return;
                                                                }
                                                                setSelectedNewCounsellor(counsellor);
                                                                setIsNewCounsellorDropdownOpen(false);
                                                                setReplaceSearchTerm('');
                                                            }}
                                                        >
                                                            <div className="flex items-center">
                                                                <User size={16} className="text-gray-400 mr-3" />
                                                                <div>
                                                                    <div className="font-medium text-gray-900 text-sm">
                                                                        {counsellor.counsellor_name}
                                                                        {currentCounsellorInfo?.assigned_l3_counsellor_id === counsellor.counsellor_id && (
                                                                            <span className="ml-2 text-xs text-gray-500">(Current)</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {counsellor.counsellor_email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {selectedNewCounsellor?.counsellor_id === counsellor.counsellor_id && (
                                                                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentCounsellorInfo && selectedNewCounsellor && (
                                <div className="p-4 bg-blue-50 rounded-lg flex items-center">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-900">Replacement Summary</div>
                                        <div className="flex items-center mt-2">
                                            <div className="bg-white px-3 py-2 rounded-lg border border-blue-200">
                                                <span className="text-xs text-gray-500">From:</span>
                                                <div className="font-medium text-blue-700">
                                                    {currentCounsellorInfo.counsellor_name || 'Unknown'}
                                                </div>
                                            </div>
                                            <ArrowRight className="mx-3 text-blue-400" size={20} />
                                            <div className="bg-white px-3 py-2 rounded-lg border border-green-200">
                                                <span className="text-xs text-gray-500">To:</span>
                                                <div className="font-medium text-green-700">
                                                    {selectedNewCounsellor.counsellor_name}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-2">
                                            This will update {studentsWithSingleJourney.length} student(s) with single journey
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Multiple Journey Tab Content */}
                    {(activeTab === 'multiple' || !hasSingleJourneyStudents) && hasMultipleJourneyStudents && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <Info className="h-5 w-5 text-yellow-400" />
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            These students have multiple journeys. Select the new L3 counsellor for each journey individually.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                College Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Course Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current L3 Counsellor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                New L3 Counsellor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {multipleJourneyDetails.map((journey) => {
                                            const journeyKey = `${journey.student_id}_${journey.course_id}`;
                                            return (
                                                <tr key={journey.status_history_id || journeyKey} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {journey.student_id}
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {journey.student_journey_count} total
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {journey.university_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {journey.course_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            {journey.current_counsellor_name || 'Not Assigned'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <select
                                                            value={journeyReplacements[journeyKey] || ''}
                                                            onChange={(e) => handleJourneyReplacementChange(journeyKey, e.target.value)}
                                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                        >
                                                            <option value="">Select new counsellor</option>
                                                            {allL3Counsellors.map(counsellor => (
                                                                <option
                                                                    key={counsellor.counsellor_id}
                                                                    value={counsellor.counsellor_id}
                                                                    disabled={counsellor.counsellor_id === journey.current_counsellor_id}
                                                                >
                                                                    {counsellor.counsellor_name} {counsellor.counsellor_id === journey.current_counsellor_id ? '(Current)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        );
    }

    return null;
};

export default AssignedLeadManually;