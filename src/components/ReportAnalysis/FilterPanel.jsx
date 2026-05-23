import { useState, useEffect } from 'react';
import {
  X,
  Filter,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Select, DatePicker, Checkbox } from "antd";
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

const { RangePicker } = DatePicker;

const FilterPanel = ({
  activeTab,
  fromDate,
  toDate,
  statsFilter,
  remarksFilters,
  filterOptions,
  setFromDate,
  setToDate,
  handleStatsFilterChange,
  setRemarksFilters,
  handleApplyFilters,
  handleResetFilters,
  getStatsFilterOptions,
  showFilters,
  setShowFilters,
  leadFilters,
  setLeadFilters,
  handleLeadSubfilter,
  pivotFilters,
  setPivotFilters,
  pivotData = [],
  leadSubTab
}) => {
  const [counsellors, setCounsellors] = useState([]);
  const [activeLeadFilters, setActiveLeadFilters] = useState({});
  const [activePivotFilters, setActivePivotFilters] = useState({});
  const [pivotFilterOptions, setPivotFilterOptions] = useState({
    colleges: [],
    supervisors: [],
    counsellors: [],
    collegeTypes: []
  });
  const storedRole = useSelector((state) => state.auth.role);

  useEffect(() => {
    if (pivotData && pivotData.length > 0) {
      const colleges = [...new Set(pivotData
        .map(item => item.college_name)
        .filter(name => name && typeof name === 'string' && name.trim() !== '')
      )].sort();

      const supervisors = [...new Set(pivotData
        .map(item => item.supervisor || 'No Supervisor')
        .filter(name => name && typeof name === 'string' && name.trim() !== '')
      )].sort();

      const counsellors = [...new Set(pivotData
        .map(item => item.counsellor)
        .filter(name => name && typeof name === 'string' && name.trim() !== '')
      )].sort();

      const collegeTypes = [...new Set(pivotData
        .map(item => {
          if (item.college_name) {
            const collegeName = item.college_name.toLowerCase();
            if (collegeName.includes('online') || collegeName.includes('virtual')) {
              return 'Online';
            } else {
              return 'Regular';
            }
          }
          return null;
        })
        .filter(type => type !== null)
      )].sort();

      setPivotFilterOptions({
        colleges: colleges.map(college => ({
          value: college,
          label: college
        })),
        supervisors: supervisors.map(supervisor => ({
          value: supervisor,
          label: supervisor
        })),
        counsellors: counsellors.map(counsellor => ({
          value: counsellor,
          label: counsellor
        })),
        collegeTypes: collegeTypes.map(type => ({
          value: type,
          label: type
        }))
      });
    }
  }, [pivotData]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    if (statsFilter[activeTab] && statsFilter[activeTab] !== 'default') count++;

    if (activeTab === 'remarks') {
      if (remarksFilters.mode) count++;
      if (remarksFilters.role && remarksFilters.role !== 'L1') count++;
      if (remarksFilters.source) count++;
      if (remarksFilters.campaign) count++;
      if (remarksFilters?.counsellors?.length > 0) count++;
    }

    if (activeTab === 'lead') {
      if (leadFilters?.source?.length > 0) count++;
      if (leadFilters?.sourceUrl?.length > 0) count++;
      if (leadFilters?.utmCampaign?.length > 0) count++;
      if (leadFilters?.counsellorId?.length > 0) count++;
      if (leadFilters?.counsellorStatus) count++;
      if (leadFilters?.dateRange) count++;

      if (pivotFilters?.colleges?.length > 0) count++;
      if (pivotFilters?.supervisors?.length > 0) count++;
      if (pivotFilters?.counsellors?.length > 0) count++;
      if (pivotFilters?.counsellorStatus) count++;
      if (pivotFilters?.collegeTypes?.length > 0) count++;
    }

    return count;
  };

  const handleCounsellorChange = (values) => {
    const selectedCounsellors = counsellors.filter((c) =>
      values?.includes(c.counsellor_id)
    );

    setRemarksFilters((prev) => ({
      ...prev,
      counsellors: values || [],
      counsellorNames: selectedCounsellors.map(c => c.counsellor_name),
    }));
  };

  const handleLeadFilterChange = (field, value) => {
    setLeadFilters((prev) => ({
      ...prev,
      [field]: value || (field === 'counsellorStatus' ? '' : []), // Handle string vs array values
    }));
  };



  const handlePivotFilterChange = (field, value) => {
    setPivotFilters(prev => ({
      ...prev,
      [field]: value || (field === 'counsellorStatus' ? '' : []) // Handle string vs array values
    }));
  };
  const handleQuickSelect = (type) => {
    if (type === 'online') {
      const onlineColleges = pivotFilterOptions.colleges
        .filter(college =>
          college.label.toLowerCase().includes('online') ||
          college.label.toLowerCase().includes('virtual')
        )
        .map(college => college.value);

      setPivotFilters(prev => ({
        ...prev,
        colleges: onlineColleges,
        collegeTypes: ['Online']
      }));
    } else if (type === 'regular') {
      const regularColleges = pivotFilterOptions.colleges
        .filter(college =>
          !college.label.toLowerCase().includes('online') &&
          !college.label.toLowerCase().includes('virtual')
        )
        .map(college => college.value);

      setPivotFilters(prev => ({
        ...prev,
        colleges: regularColleges,
        collegeTypes: ['Regular']
      }));
    } else if (type === 'both') {
      const allColleges = pivotFilterOptions.colleges.map(college => college.value);
      setPivotFilters(prev => ({
        ...prev,
        colleges: allColleges,
        collegeTypes: ['Online', 'Regular']
      }));
    }
  };

  const applyLeadFilters = () => {
    const newActive = {};
    const newPivotActive = {};

    if (leadFilters?.source?.length > 0) {
      newActive.source = leadFilters.source.join(", ");
    }

    if (leadFilters?.sourceUrl?.length > 0) {
      newActive.sourceUrl = leadFilters.sourceUrl.join(", ");
    }

    if (leadFilters?.utmCampaign?.length > 0) {
      newActive.utmCampaign = leadFilters.utmCampaign.join(", ");
    }

    if (leadFilters?.counsellorId?.length > 0) {
      newActive.counsellor = leadFilters.counsellorNames.join(", ");
    }
    if (leadFilters?.counsellorStatus) {
      newActive.counsellorStatus = leadFilters.counsellorStatus === 'active' ? 'Active' : 'Inactive';
    }
    if (leadFilters?.dateRange?.length === 2) {
      newActive.dateRange = `${leadFilters.dateRange[0].format("YYYY-MM-DD")} to ${leadFilters.dateRange[1].format("YYYY-MM-DD")}`;
    }

    if (pivotFilters?.colleges?.length > 0) {
      newPivotActive.colleges = `${pivotFilters.colleges.length} colleges selected`;
    }

    if (pivotFilters?.supervisors?.length > 0) {
      newPivotActive.supervisors = pivotFilters.supervisors.join(", ");
    }

    if (pivotFilters?.counsellors?.length > 0) {
      newPivotActive.counsellors = pivotFilters.counsellors.join(", ");
    }
    if (pivotFilters?.counsellorStatus) {
      newPivotActive.counsellorStatus = pivotFilters.counsellorStatus === 'active' ? 'Active' : 'Inactive';
    }
    if (pivotFilters?.collegeTypes?.length > 0) {
      newPivotActive.collegeTypes = pivotFilters.collegeTypes.join(", ");
    }

    setActiveLeadFilters(newActive);
    setActivePivotFilters(newPivotActive);

    const params = {};

    if (leadFilters?.source?.length > 0) {
      params.source = leadFilters.source;
    }

    if (leadFilters?.sourceUrl?.length > 0) {
      params.source_url = leadFilters.sourceUrl.join(",");
    }

    if (leadFilters?.utmCampaign?.length > 0) {
      params.utm_campaign = leadFilters.utmCampaign;
    }

    if (leadFilters?.counsellorId?.length > 0) {
      params.counsellor_id = leadFilters.counsellorId;
    }
    if (leadFilters?.counsellorStatus) {
      params.counsellor_status = leadFilters.counsellorStatus;
    }
    if (leadFilters?.dateRange?.length === 2) {
      params.created_at_start = leadFilters.dateRange[0].format("YYYY-MM-DD");
      params.created_at_end = leadFilters.dateRange[1].format("YYYY-MM-DD");
    }

    handleLeadSubfilter?.(params);
  };



  const getTabTitle = () => {
    switch (activeTab) {
      case 'admission': return 'Admission Filters';
      case 'application': return 'Application Filters';
      case 'lead': return 'Lead Filters';
      case 'remarks': return 'Remarks Filters';
      default: return 'Filters';
    }
  };

  const handleApply = () => {
    if (activeTab === 'lead') {
      applyLeadFilters();
    }
    handleApplyFilters();
    setShowFilters(false);
  };

  const handleReset = () => {
    if (activeTab === 'lead') {
      setLeadFilters({
        source: [],
        sourceUrl: [],
        utmCampaign: [],
        counsellorId: [],
        counsellorNames: [],
        dateRange: null,
        counsellorStatus: ''
      });
      setPivotFilters({
        colleges: [],
        supervisors: [],
        counsellors: [],
        counsellorStatus: '',
        collegeTypes: []
      });
      setActiveLeadFilters({});
      setActivePivotFilters({});
      handleLeadSubfilter?.({});
    }
    handleResetFilters();
    setShowFilters(false);
  };

  if (!showFilters) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={() => setShowFilters(false)}
      />

      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col animate-slideIn shadow-lg"
      >
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Filter className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{getTabTitle()}</h2>
                <p className="text-gray-500 text-sm">
                  {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activeTab === 'lead' && (
              <>
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Lead Filters</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <Select
                      mode="multiple"
                      placeholder="Select Sources"
                      value={leadFilters?.source || []}
                      onChange={(value) => handleLeadFilterChange("source", value)}
                      allowClear
                      showSearch
                      options={filterOptions.source?.map((s) => ({ value: s, label: s })) || []}
                      className="w-full"
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source URL</label>
                    <Select
                      mode="multiple"
                      placeholder="Select Source URLs"
                      value={leadFilters?.sourceUrl || []}
                      onChange={(value) => handleLeadFilterChange("sourceUrl", value)}
                      allowClear
                      showSearch
                      options={filterOptions.sourceUrl?.map((u) => ({ value: u, label: u })) || []}
                      className="w-full"
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UTM Campaign</label>
                    <Select
                      mode="multiple"
                      showSearch
                      placeholder="Select Campaigns"
                      value={leadFilters?.utmCampaign || []}
                      onChange={(value) => handleLeadFilterChange("utmCampaign", value)}
                      allowClear
                      options={filterOptions.utmCampaign?.map((c) => ({ value: c, label: c })) || []}
                      className="w-full"
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <RangePicker
                      value={leadFilters?.dateRange}
                      onChange={(dates) => handleLeadFilterChange("dateRange", dates)}
                      className="w-full"
                    />
                  </div>
                  {activeTab === 'lead' && leadSubTab === "agent" && <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counsellor Status
                    </label>
                    <Select
                      placeholder="Select Status"
                      value={leadFilters?.counsellorStatus || ''}
                      onChange={(value) => handleLeadFilterChange("counsellorStatus", value)}
                      allowClear
                      className="w-full"
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                    />
                  </div>}

                </div>

                {storedRole !== "Analyser" && activeTab === 'lead' && leadSubTab === "api" && (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-base font-medium text-gray-900">Pivot Table Filters</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quick Selection</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleQuickSelect('online')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${pivotFilters.collegeTypes?.includes('Online')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                        >
                          Online Colleges
                        </button>
                        <button
                          onClick={() => handleQuickSelect('regular')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${pivotFilters.collegeTypes?.includes('Regular')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                        >
                          Regular Colleges
                        </button>
                        <button
                          onClick={() => handleQuickSelect('both')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${pivotFilters.collegeTypes?.length === 2
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                        >
                          Both Types
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Colleges</label>
                      <Select
                        mode="multiple"
                        showSearch
                        placeholder="Select Colleges"
                        value={pivotFilters?.colleges || []}
                        onChange={(value) => handlePivotFilterChange("colleges", value)}
                        allowClear
                        options={pivotFilterOptions.colleges}
                        className="w-full"
                        filterOption={(input, option) =>
                          option?.label?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>
                  
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Supervisors</label>
                      <Select
                        mode="multiple"
                        showSearch
                        placeholder="Select Supervisors"
                        value={pivotFilters?.supervisors || []}
                        onChange={(value) => handlePivotFilterChange("supervisors", value)}
                        allowClear
                        options={pivotFilterOptions.supervisors}
                        className="w-full"
                        filterOption={(input, option) =>
                          option?.label?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Counsellors</label>
                      <Select
                        mode="multiple"
                        showSearch
                        placeholder="Select Counsellors"
                        value={pivotFilters?.counsellors || []}
                        onChange={(value) => handlePivotFilterChange("counsellors", value)}
                        allowClear
                        options={pivotFilterOptions.counsellors}
                        className="w-full"
                        filterOption={(input, option) =>
                          option?.label?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">College Type</label>
                      <Select
                        mode="multiple"
                        placeholder="Select College Types"
                        value={pivotFilters?.collegeTypes || []}
                        onChange={(value) => handlePivotFilterChange("collegeTypes", value)}
                        allowClear
                        options={[
                          { value: 'Online', label: 'Online' },
                          { value: 'Regular', label: 'Regular' }
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab !== 'lead' && (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Date Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <DatePicker
                      value={fromDate ? dayjs(fromDate) : null}
                      onChange={(date) => setFromDate(date ? date.format('YYYY-MM-DD') : '')}
                      placeholder="Select start date"
                      className="w-full"
                      format="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <DatePicker
                      value={toDate ? dayjs(toDate) : null}
                      onChange={(date) => setToDate(date ? date.format('YYYY-MM-DD') : '')}
                      placeholder="Select end date"
                      className="w-full"
                      format="YYYY-MM-DD"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'remarks' && activeTab !== 'lead' && (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Statistics Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stats Based On</label>
                  <Select
                    value={statsFilter[activeTab]}
                    onChange={handleStatsFilterChange}
                    options={getStatsFilterOptions()}
                    placeholder="Select filter type"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'remarks' && (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Remarks Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                    <Select
                      value={remarksFilters.mode || undefined}
                      onChange={(value) => setRemarksFilters(prev => ({ ...prev, mode: value }))}
                      options={filterOptions.mode?.map(mode => ({ value: mode, label: mode })) || []}
                      placeholder="Select mode"
                      allowClear
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <Select
                      value={remarksFilters.role}
                      onChange={(value) => setRemarksFilters(prev => ({ ...prev, role: value }))}
                      options={[
                        { value: 'l2', label: 'L2' },
                        { value: 'l3', label: 'L3' }
                      ]}
                      placeholder="Select role"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Counsellor</label>
                    <Select
                      mode="multiple"
                      showSearch
                      placeholder="Select Counsellors"
                      value={remarksFilters.counsellors}
                      onChange={handleCounsellorChange}
                      allowClear
                      options={counsellors.map((c) => ({
                        value: c.counsellor_id,
                        label: c.counsellor_name,
                      }))}
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                    <Select
                      value={remarksFilters.source || undefined}
                      onChange={(value) => setRemarksFilters(prev => ({ ...prev, source: value }))}
                      options={filterOptions.source?.map(source => ({ value: source, label: source })) || []}
                      placeholder="Select source"
                      allowClear
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
                    <Select
                      value={remarksFilters.campaign || undefined}
                      onChange={(value) => setRemarksFilters(prev => ({ ...prev, campaign: value }))}
                      options={filterOptions.utmCampaign?.map(campaign => ({ value: campaign, label: campaign })) || []}
                      placeholder="Select campaign"
                      allowClear
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FilterPanel;