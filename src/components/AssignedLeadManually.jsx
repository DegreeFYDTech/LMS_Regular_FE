import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  getAllCounsellors, 
  assignCounsellorsToStudents,
  getDistinctL3CounsellorsByStudentIds,
  replaceL3CounsellorForStudents
} from '../network/counsellor';
import { Search, X, ChevronDown, User, RefreshCw, ArrowRight } from 'lucide-react';

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
    const [existingCounsellors, setExistingCounsellors] = useState([]);
    const [filteredExistingCounsellors, setFilteredExistingCounsellors] = useState([]);
    const [allL3Counsellors, setAllL3Counsellors] = useState([]);
    const [filteredAllL3Counsellors, setFilteredAllL3Counsellors] = useState([]);
    const [selectedFromCounsellor, setSelectedFromCounsellor] = useState(null);
    const [selectedToCounsellor, setSelectedToCounsellor] = useState(null);
    const [replaceSearchTerm, setReplaceSearchTerm] = useState('');
    const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
    const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
    const [replaceLoading, setReplaceLoading] = useState(false);
    
    const isL3Assignment = isAssignedtoL3;
    const isL2Assignment = isAssignedtoL2;

    // Fetch L2 counsellors when it's L2 assignment
    useEffect(() => {
        if (isL2Assignment) {
            const fetchCounsellors = async () => {
                try {
                    setLoading(true);
                    const res = await getAllCounsellors('l2');
                    console.log('L2 counsellors response:', res);
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

    // Fetch L3 data when it's L3 assignment
    useEffect(() => {
        if (isL3Assignment) {
            const fetchL3Data = async () => {
                try {
                    setReplaceLoading(true);
                    const studentIds = selectedStudent.map(s => s.student_id);
                    
                    const distinctRes = await getDistinctL3CounsellorsByStudentIds({ studentIds });
                    console.log('Distinct L3 counsellors:', distinctRes);
                    setExistingCounsellors(distinctRes.data || []);
                    setFilteredExistingCounsellors(distinctRes.data || []);
                    
                    const allRes = await getAllCounsellors('l3');
                    console.log('All L3 counsellors:', allRes);
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

    // Filter L2 counsellors based on search term
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

    // Filter L3 counsellors in replace modal
    useEffect(() => {
        if (!replaceSearchTerm) {
            setFilteredExistingCounsellors(existingCounsellors);
            setFilteredAllL3Counsellors(allL3Counsellors);
        } else {
            const filteredExisting = existingCounsellors.filter(c =>
                c.counsellor_name?.toLowerCase().includes(replaceSearchTerm.toLowerCase()) ||
                c.counsellor_email?.toLowerCase().includes(replaceSearchTerm.toLowerCase())
            );
            setFilteredExistingCounsellors(filteredExisting);
            
            const filteredAll = allL3Counsellors.filter(c =>
                c.counsellor_name?.toLowerCase().includes(replaceSearchTerm.toLowerCase()) ||
                c.counsellor_email?.toLowerCase().includes(replaceSearchTerm.toLowerCase())
            );
            setFilteredAllL3Counsellors(filteredAll);
        }
    }, [replaceSearchTerm, existingCounsellors, allL3Counsellors]);

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
            
            // Prepare the data exactly as backend expects
            const assignmentData = {
                assignmentType: 'L2',
                selectedStudents: selectedStudent.map(student => student.student_id),
                selectedAgents: selectedAgents.map(agent => ({
                    counsellorId: agent.counsellor_id,
                    name: agent.counsellor_name,
                    email: agent.counsellor_email
                }))
            };
            
            console.log('Sending assignment data:', assignmentData);
            
            const response = await assignCounsellorsToStudents(assignmentData);
            console.log('Assignment response:', response);

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

    // L3 Replacement Handler
    const handleReplace = async () => {
        if (!selectedFromCounsellor || !selectedToCounsellor) {
            alert('Please select both source and target counsellors');
            return;
        }

        if (selectedFromCounsellor.assigned_l3_counsellor_id === selectedToCounsellor.counsellor_id) {
            alert('Source and target counsellors cannot be the same');
            return;
        }

        try {
            setReplaceLoading(true);
            const studentIds = selectedStudent.map(s => s.student_id);
            
            const replaceData = {
                studentIds,
                fromCounsellorId: selectedFromCounsellor.assigned_l3_counsellor_id,
                toCounsellorId: selectedToCounsellor.counsellor_id
            };
            
            console.log('Sending replace data:', replaceData);
            
            const response = await replaceL3CounsellorForStudents(replaceData);
            console.log('Replace response:', response);

            if (response.success) {
                alert(`Successfully replaced counsellor for ${response.data.recordsUpdated} journey entries`);
                window.location.reload();
            } else {
                alert('Failed to replace counsellor: ' + response.message);
            }
        } catch (error) {
            console.error('Error in handleReplace:', error);
            alert('Failed to replace counsellor: ' + (error.response?.data?.message || error.message));
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

    // Render L3 Replacement UI
    if (isL3Assignment) {
        return (
            <Modal
                isOpen={true}
                onClose={handleClose}
                title="Replace L3 Counsellor"
                size="3xl"
                loading={replaceLoading}
                loadingText="Loading..."
                onConfirm={handleReplace}
                confirmText="Replace Counsellor"
                cancelText="Cancel"
                confirmColor="blue"
                confirmDisabled={!selectedFromCounsellor || !selectedToCounsellor}
            >
                <div className="space-y-6 p-2">
                    <p className="text-sm text-gray-600">
                        Select the existing L3 counsellor to replace and the new L3 counsellor to assign.
                        This will update all journey entries for the selected students.
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

                 

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current L3 Counsellor to Replace
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <span className="text-gray-700">
                                        {selectedFromCounsellor 
                                            ? selectedFromCounsellor.counsellor_name || 'Unknown'
                                            : 'Select counsellor to replace'
                                        }
                                    </span>
                                    <ChevronDown
                                        className={`transition-transform ${isFromDropdownOpen ? 'rotate-180' : ''}`}
                                        size={16}
                                    />
                                </button>

                                {isFromDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                        <div className="max-h-60 overflow-y-auto">
                                            {replaceLoading ? (
                                                <div className="p-4 text-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                </div>
                                            ) : filteredExistingCounsellors.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    No existing L3 counsellors found
                                                </div>
                                            ) : (
                                                filteredExistingCounsellors.map((counsellor) => (
                                                    <div
                                                        key={counsellor.assigned_l3_counsellor_id}
                                                        onClick={() => {
                                                            setSelectedFromCounsellor(counsellor);
                                                            setIsFromDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                                            selectedFromCounsellor?.assigned_l3_counsellor_id === counsellor.assigned_l3_counsellor_id
                                                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <User size={16} className="text-gray-400 mr-3" />
                                                            <div>
                                                                <div className="font-medium text-gray-900 text-sm">
                                                                    {counsellor.counsellor_name || 'Unknown'}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {counsellor.counsellor_email || 'No email'}
                                                                </div>
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    {counsellor.student_count || 0} student(s)
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedFromCounsellor?.assigned_l3_counsellor_id === counsellor.assigned_l3_counsellor_id && (
                                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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
                            {selectedFromCounsellor && (
                                <p className="text-xs text-blue-600 mt-1">
                                    {selectedFromCounsellor.student_count || 0} student(s) assigned to this counsellor
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New L3 Counsellor to Assign
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <span className="text-gray-700">
                                        {selectedToCounsellor 
                                            ? selectedToCounsellor.counsellor_name
                                            : 'Select new counsellor'
                                        }
                                    </span>
                                    <ChevronDown
                                        className={`transition-transform ${isToDropdownOpen ? 'rotate-180' : ''}`}
                                        size={16}
                                    />
                                </button>

                                {isToDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
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
                                                        onClick={() => {
                                                            setSelectedToCounsellor(counsellor);
                                                            setIsToDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                                                            selectedToCounsellor?.counsellor_id === counsellor.counsellor_id
                                                                ? 'bg-green-50 border-l-4 border-l-green-500'
                                                                : ''
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
                                                        {selectedToCounsellor?.counsellor_id === counsellor.counsellor_id && (
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
                    </div>

                    {selectedFromCounsellor && selectedToCounsellor && (
                        <div className="p-4 bg-blue-50 rounded-lg flex items-center">
                            <div className="flex-1">
                                <div className="text-sm font-medium text-blue-900">Replacement Summary</div>
                                <div className="flex items-center mt-2">
                                    <div className="bg-white px-3 py-2 rounded-lg border border-blue-200">
                                        <span className="text-xs text-gray-500">From:</span>
                                        <div className="font-medium text-blue-700">
                                            {selectedFromCounsellor.counsellor_name || 'Unknown'}
                                        </div>
                                    </div>
                                    <ArrowRight className="mx-3 text-blue-400" size={20} />
                                    <div className="bg-white px-3 py-2 rounded-lg border border-green-200">
                                        <span className="text-xs text-gray-500">To:</span>
                                        <div className="font-medium text-green-700">
                                            {selectedToCounsellor.counsellor_name}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-700 mt-2">
                                    This will update {selectedFromCounsellor.student_count || 0} journey entries
                                </p>
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