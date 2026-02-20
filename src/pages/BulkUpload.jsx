import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Users, UserCheck, AlertCircle, CheckCircle, Download, FileDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { bulkinsertion, bulkReassignment } from '../network/student';
import ErrorTable from './InsertionErrors'

const BulkUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('lead_creation');
  const [reassignmentLevel, setReassignmentLevel] = useState('L2'); 
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errors, setErrors] = useState([]);
  const [InsertionErrors, SetInsertionErrors] = useState([])

  const getTemplateData = () => {
    if (uploadType === 'lead_creation') {
      return [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '1234567890',
          counsellorId: 'AGT001',
          city: 'Mumbai',
          state: 'Maharashtra',
          preferred_degree: 'MBA',
          specialization: 'Finance',
          stream: 'Business',
          remarks: 'Interested in finance courses',
          level: 'Graduate',
          budget: '500000',
          source: 'Website',
          sourceUrl: 'https://example.com/mba',
          secondary_email: 'john.secondary@example.com',
          whatsapp: '1234567890',
          calling_status: 'Not Called',
          sub_calling_status: 'Fresh Lead',
          mode: 'Online',
          cta_name: 'Apply Now',
          form_name: 'MBA Application Form',
          currentcity: 'Mumbai',
          currentstate: 'Maharashtra',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_keyword: 'mba finance',
          utm_campaign: 'MBA Campaign 2025'
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phoneNumber: '9876543210',
          counsellorId: 'AGT002',
          city: 'Delhi',
          state: 'Delhi',
          preferred_degree: 'B.Tech',
          specialization: 'Computer Science',
          stream: 'Engineering',
          remarks: 'Looking for AI/ML specialization',
          level: 'Undergraduate',
          budget: '300000',
          source: 'Facebook',
          sourceUrl: 'https://facebook.com/ad/123',
          secondary_email: 'jane.alt@example.com',
          whatsapp: '9876543210',
          calling_status: 'Called',
          sub_calling_status: 'Interested',
          mode: 'Hybrid',
          cta_name: 'Learn More',
          form_name: 'Engineering Inquiry Form',
          currentcity: 'Delhi',
          currentstate: 'Delhi',
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_keyword: 'computer science',
          utm_campaign: 'Engineering Campaign 2025'
        }
      ];
    } else if (uploadType === 'lead_reassignment' && reassignmentLevel === 'L2') {
      return [
        { studentId: 'STU001', counsellorId: 'AGT001' },
        { studentId: 'STU002', counsellorId: 'AGT002' },
        { studentId: 'STU003', counsellorId: 'AGT003' }
      ];
    } else {
      // L3 Reassignment template with courseId
      return [
        { 
          studentId: 'STU001', 
          counsellorId: 'AGT001',
          courseId: 'CRS001' 
        },
        { 
          studentId: 'STU002', 
          counsellorId: 'AGT002',
          courseId: 'CRS002' 
        },
        { 
          studentId: 'STU003', 
          counsellorId: 'AGT003',
          courseId: 'CRS003' 
        }
      ];
    }
  };

  // Download template Excel file
  const downloadTemplate = () => {
    const templateData = getTemplateData();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    let fileName;
    if (uploadType === 'lead_creation') {
      fileName = 'lead_creation_template.xlsx';
    } else if (reassignmentLevel === 'L2') {
      fileName = 'lead_reassignment_l2_template.xlsx';
    } else {
      fileName = 'lead_reassignment_l3_with_courseid_template.xlsx';
    }

    XLSX.writeFile(workbook, fileName);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel') {
        setSelectedFile(file);
        setUploadStatus(null);
        setErrors([]);
        setParsedData([]);
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  // Parse Excel file
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  // Validate data based on upload type
  const validateData = (data) => {
    const validationErrors = [];
    const validData = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;

      if (uploadType === 'lead_creation') {
        // Required fields for lead creation (matching API)
        const requiredFields = ['name', 'email', 'phoneNumber', 'counsellorId'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');

        if (missingFields.length > 0) {
          validationErrors.push(`Row ${rowNum}: Missing required fields - ${missingFields.join(', ')}`);
        } else {
          // Email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            validationErrors.push(`Row ${rowNum}: Invalid email format`);
          }

          // Phone number validation
          const phoneRegex = /^\d{10,15}$/;
          if (!phoneRegex.test(row.phoneNumber.toString().replace(/\D/g, ''))) {
            validationErrors.push(`Row ${rowNum}: Invalid phone number format`);
          }

          // If no validation errors for this row, add to valid data
          if (!validationErrors.some(err => err.includes(`Row ${rowNum}`))) {
            validData.push({
              name: row.name.toString().trim(),
              email: row.email.toString().trim().toLowerCase(),
              phoneNumber: row.phoneNumber.toString().trim(),
              counsellorId: row.counsellorId.toString().trim(),
              city: row.city ? row.city.toString().trim() : '',
              state: row.state ? row.state.toString().trim() : '',
              preferred_degree: row.preferred_degree ? row.preferred_degree.toString().trim() : '',
              specialization: row.specialization ? row.specialization.toString().trim() : '',
              stream: row.stream ? row.stream.toString().trim() : '',
              remarks: row.remarks ? row.remarks.toString().trim() : '',
              level: row.level ? row.level.toString().trim() : '',
              budget: row.budget ? row.budget.toString().trim() : '',
              source: row.source ? row.source.toString().trim() : '',
              sourceUrl: row.sourceUrl ? row.sourceUrl.toString().trim() : '',
              secondary_email: row.secondary_email ? row.secondary_email.toString().trim() : '',
              whatsapp: row.whatsapp ? row.whatsapp.toString().trim() : '',
              calling_status: row.calling_status ? row.calling_status.toString().trim() : '',
              sub_calling_status: row.sub_calling_status ? row.sub_calling_status.toString().trim() : '',
              mode: row.mode ? row.mode.toString().trim() : '',
              cta_name: row.cta_name ? row.cta_name.toString().trim() : '',
              form_name: row.form_name ? row.form_name.toString().trim() : '',
              currentcity: row.currentcity ? row.currentcity.toString().trim() : '',
              currentstate: row.currentstate ? row.currentstate.toString().trim() : '',
              utm_source: row.utm_source ? row.utm_source.toString().trim() : '',
              utm_medium: row.utm_medium ? row.utm_medium.toString().trim() : '',
              utm_keyword: row.utm_keyword ? row.utm_keyword.toString().trim() : '',
              utm_campaign: row.utm_campaign ? row.utm_campaign.toString().trim() : ''
            });
          }
        }
      } else if (uploadType === 'lead_reassignment' && reassignmentLevel === 'L2') {
        // L2 reassignment validation
        const requiredFields = ['studentId', 'counsellorId'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');

        if (missingFields.length > 0) {
          validationErrors.push(`Row ${rowNum}: Missing fields - ${missingFields.join(', ')}`);
        } else {
          validData.push({
            studentId: row.studentId.toString().trim(),
            counsellorId: row.counsellorId.toString().trim()
          });
        }
      } else if (uploadType === 'lead_reassignment' && reassignmentLevel === 'L3') {
        // L3 reassignment validation - requires courseId
        const requiredFields = ['studentId', 'counsellorId', 'courseId'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');

        if (missingFields.length > 0) {
          validationErrors.push(`Row ${rowNum}: Missing fields for L3 reassignment - ${missingFields.join(', ')}`);
        } else {
          validData.push({
            studentId: row.studentId.toString().trim(),
            counsellorId: row.counsellorId.toString().trim(),
            courseId: row.courseId.toString().trim()
          });
        }
      }
    });

    return { validData, validationErrors };
  };

  // Process uploaded file
  const handleProcessFile = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const rawData = await parseExcelFile(selectedFile);

      if (rawData.length === 0) {
        throw new Error('Excel file is empty');
      }

      const { validData, validationErrors } = validateData(rawData);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploadStatus('error');
      }

      if (validData.length > 0) {
        setParsedData(validData);
        setUploadStatus('success');
      }

    } catch (error) {
      console.error('Error processing file:', error);
      setErrors([`Error processing file: ${error.message}`]);
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // API call with reassignment level
  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      alert('No valid data to submit');
      return;
    }

    setIsProcessing(true);

    try {
      let response;

      if (uploadType === 'lead_creation') {
        response = await bulkinsertion(parsedData);
      } else {
        // Include reassignment level and data in the API call
        const reassignmentData = {
          data: parsedData,
          level: reassignmentLevel // Send L2 or L3 to backend
        };
        response = await bulkReassignment(reassignmentData);
      }

      const result = response?.data;

      if (response) {
        // Show detailed success message
        let successMessage;
        if (uploadType === 'lead_creation') {
          successMessage = `Successfully processed ${result.summary?.total_processed || parsedData.length} leads:\n• Created: ${result.summary?.successful_count || 0}\n• Failed: ${result.summary?.failed_count || 0}\n• Success Rate: ${result.summary?.success_rate || '0%'}`;
        } else if (reassignmentLevel === 'L2') {
          successMessage = `Successfully processed ${parsedData.length} L2 reassignments:\n• Reassigned: ${result.results?.reassigned || 0}\n• Failed: ${result.results?.errors || 0}`;
        } else {
          successMessage = `Successfully processed ${parsedData.length} L3 journey reassignments:\n• Reassigned: ${result.results?.reassigned || 0}\n• Failed: ${result.results?.errors || 0}\n• Note: Only journey entries with matching courseId were updated`;
        }

        alert(successMessage);
        
        if (result?.results?.failed_leads?.length > 0) {
          SetInsertionErrors(result?.results.failed_leads);
        } else {
          // Reset form
          setSelectedFile(null);
          setParsedData([]);
          setUploadStatus(null);
          setErrors([]);
          SetInsertionErrors([]);
        }
      } else {
        throw new Error(result.message || 'API request failed');
      }

    } catch (error) {
      console.error('API Error:', error);
      alert(`Error: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const templateData = getTemplateData();

  return (
    <div className="mx-auto p-6 px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Upload</h1>
        <p className="text-gray-600">Upload Excel files for lead creation or reassignment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Upload Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {/* Upload Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Select Upload Type</h3>
              <div className="flex gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadType"
                    value="lead_creation"
                    checked={uploadType === 'lead_creation'}
                    onChange={(e) => {
                      setUploadType(e.target.value);
                      setParsedData([]);
                      setUploadStatus(null);
                      setErrors([]);
                      SetInsertionErrors([]);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">Lead Creation</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadType"
                    value="lead_reassignment"
                    checked={uploadType === 'lead_reassignment'}
                    onChange={(e) => {
                      setUploadType(e.target.value);
                      setParsedData([]);
                      setUploadStatus(null);
                      setErrors([]);
                      SetInsertionErrors([]);
                    }}
                    className="w-4 h-4 text-green-600"
                  />
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 font-medium">Lead Reassignment</span>
                </label>
              </div>
            </div>

            {/* L2/L3 Toggle - Only show for reassignment */}
            {uploadType === 'lead_reassignment' && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-gray-700 mb-3">Reassignment Level</h4>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-medium ${reassignmentLevel === 'L2' ? 'text-blue-600' : 'text-gray-500'}`}>
                    L2
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignmentLevel(reassignmentLevel === 'L2' ? 'L3' : 'L2');
                      // Reset data when level changes
                      setParsedData([]);
                      setUploadStatus(null);
                      setErrors([]);
                      SetInsertionErrors([]);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      reassignmentLevel === 'L3' ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reassignmentLevel === 'L3' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${reassignmentLevel === 'L3' ? 'text-green-600' : 'text-gray-500'}`}>
                    L3
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Current selection: <strong>{reassignmentLevel} Reassignment</strong>
                  {reassignmentLevel === 'L3' && ' (Updates only journey entries with matching courseId)'}
                </p>
              </div>
            )}

            {/* Requirements Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Required Excel Columns:</h4>
              {uploadType === 'lead_creation' ? (
                <div className="text-sm text-gray-600">
                  <p><strong>Lead Creation Required:</strong> name, email, phoneNumber, counsellorId</p>
                  <p className="mt-2"><strong>Optional Fields:</strong> city, state, preferred_degree, specialization, stream, remarks, level, budget, source, sourceUrl, secondary_email, whatsapp, calling_status, sub_calling_status, mode, cta_name, form_name, currentcity, currentstate, utm_source, utm_medium, utm_keyword, utm_campaign</p>
                  <p className="mt-1 text-xs">• Email must be valid format • Phone number should be 10-15 digits</p>
                </div>
              ) : reassignmentLevel === 'L2' ? (
                <div className="text-sm text-gray-600">
                  <p><strong>L2 Lead Reassignment Required:</strong> studentId, counsellorId</p>
                  <p className="mt-1 text-xs">• Both fields are required for each row</p>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p><strong>L3 Journey Reassignment Required:</strong> studentId, counsellorId, courseId</p>
                  <p className="mt-2 text-xs text-orange-600">• All three fields are required for L3 reassignment</p>
                  <p className="mt-1 text-xs">• Updates will only apply to journey entries with matching courseId</p>
                  <p className="mt-1 text-xs">• The counsellorId will be updated in the assigned_l3_counsellor_id field of journey table</p>
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">(.xlsx or .xls files only)</p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleProcessFile}
                disabled={!selectedFile || isProcessing}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Process File'}</span>
              </button>

              {parsedData.length > 0 && (
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isProcessing 
                      ? 'Submitting...' 
                      : `Submit ${uploadType === 'lead_creation' ? 'Leads' : `${reassignmentLevel} Reassignments`}`
                    }
                  </span>
                </button>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus === 'success' && parsedData.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Successfully processed {parsedData.length} records
                    {uploadType === 'lead_reassignment' && ` for ${reassignmentLevel} reassignment`}
                    {reassignmentLevel === 'L3' && ' with courseId'}
                  </span>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium mb-2">Validation Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {InsertionErrors.length > 0 && (
              <ErrorTable errorData={InsertionErrors} />
            )}

            {/* Data Preview */}
            {parsedData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Data Preview ({parsedData.length} records)
                  {uploadType === 'lead_reassignment' && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - {reassignmentLevel} Level
                      {reassignmentLevel === 'L3' && ' (with courseId)'}
                    </span>
                  )}
                </h3>
                <div className="overflow-x-auto bg-gray-50 rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        {uploadType === 'lead_creation' ? (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Degree</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Counsellor ID</th>
                          </>
                        ) : reassignmentLevel === 'L2' ? (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Counsellor ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Counsellor ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="text-sm">
                          {uploadType === 'lead_creation' ? (
                            <>
                              <td className="px-4 py-2 text-gray-900">{row.name}</td>
                              <td className="px-4 py-2 text-gray-900">{row.email}</td>
                              <td className="px-4 py-2 text-gray-900">{row.phoneNumber}</td>
                              <td className="px-4 py-2 text-gray-900">{row.city}</td>
                              <td className="px-4 py-2 text-gray-900">{row.preferred_degree}</td>
                              <td className="px-4 py-2 text-gray-900">{row.counsellorId}</td>
                            </>
                          ) : reassignmentLevel === 'L2' ? (
                            <>
                              <td className="px-4 py-2 text-gray-900">{row.studentId}</td>
                              <td className="px-4 py-2 text-gray-900">{row.counsellorId}</td>
                              <td className="px-4 py-2 text-gray-900">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  L2
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2 text-gray-900">{row.studentId}</td>
                              <td className="px-4 py-2 text-gray-900">{row.counsellorId}</td>
                              <td className="px-4 py-2 text-gray-900">{row.courseId}</td>
                              <td className="px-4 py-2 text-gray-900">
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  L3
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <p className="text-xs text-gray-500 p-4 text-center">
                      ... and {parsedData.length - 5} more records
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Template Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm h-fit sticky top-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Excel Template</h3>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {uploadType === 'lead_creation' 
                    ? 'Lead Creation Template' 
                    : reassignmentLevel === 'L2'
                      ? 'L2 Lead Reassignment Template'
                      : 'L3 Journey Reassignment Template (with Course ID)'
                  }
                </p>
                <div className="text-xs text-gray-500">
                  Download this template and fill in your data
                </div>
              </div>

              {/* Template Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Template Preview</span>
                    {uploadType === 'lead_reassignment' && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        reassignmentLevel === 'L2' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {reassignmentLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-green-50">
                      <tr>
                        {uploadType === 'lead_creation' ? (
                          <>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">name*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">email*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">phoneNumber*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">city</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">preferred_degree</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">counsellorId*</th>
                          </>
                        ) : reassignmentLevel === 'L2' ? (
                          <>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">studentId*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">counsellorId*</th>
                          </>
                        ) : (
                          <>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">studentId*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700 border-r">counsellorId*</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-700">courseId*</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {templateData.slice(0, 2).map((row, index) => (
                        <tr key={index} className="text-xs">
                          {uploadType === 'lead_creation' ? (
                            <>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.name}</td>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.email}</td>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.phoneNumber}</td>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.city}</td>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.preferred_degree}</td>
                              <td className="px-2 py-1 text-gray-900">{row.counsellorId}</td>
                            </>
                          ) : reassignmentLevel === 'L2' ? (
                            <>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.studentId}</td>
                              <td className="px-2 py-1 text-gray-900">{row.counsellorId}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.studentId}</td>
                              <td className="px-2 py-1 text-gray-900 border-r">{row.counsellorId}</td>
                              <td className="px-2 py-1 text-gray-900">{row.courseId}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Instructions:</p>
                    <ul className="space-y-1">
                      <li>• Download the template file</li>
                      <li>• Keep the exact column headers</li>
                      <li>• Fields marked with * are required</li>
                      <li>• Fill in your data below headers</li>
                      <li>• Upload the completed file</li>
                      {uploadType === 'lead_reassignment' && reassignmentLevel === 'L3' && (
                        <>
                          <li className="text-orange-600 font-medium mt-1">• L3 Note: Updates only journey entries with matching courseId</li>
                          <li className="text-orange-600">• CourseId is required for L3 reassignment</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;