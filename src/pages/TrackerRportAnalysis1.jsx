import React, { useEffect, useState, useRef } from 'react';
import { FiRefreshCw, FiClock, FiFileText, FiCheckCircle, FiFilter, FiX, FiDownload, FiBarChart2, FiGrid, FiPercent, FiHash, FiDatabase } from 'react-icons/fi';
import ReportTable from '../components/MainReport/ReportTable';
import DashboardHeader from '../components/MainReport/DashboardHeader';
import dayjs from 'dayjs';
import { BASE_URL } from '../config/api';
import { fetchFilterOptions } from '../network/filterOptions';
import { Switch, Modal, Table, Spin, Empty } from 'antd';
import ExportFieldSelectModal from '../components/modals/ExportFieldSelectModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2canvas from 'html2canvas';
import { useSelector } from 'react-redux';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const LeadAttemptReport = ({ forcedGroupBy = null }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [sourceOptions, setSourceOptions] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [expandedSupervisors, setExpandedSupervisors] = useState({});
    const [supervisorGroups, setSupervisorGroups] = useState([]);
    const userRole = useSelector((state) => state.auth.role);

    const groupBySupervisor = (data) => {
        const groups = {};
        data.forEach(row => {
            const supervisor = row.supervisorName || 'Unassigned';
            if (!groups[supervisor]) {
                groups[supervisor] = {
                    supervisorName: supervisor,
                    counsellors: [],
                    totals: { leadsAssigned: 0, attempted: 0, within15: 0, min1530: 0, gt30: 0 }
                };
            }
            groups[supervisor].counsellors.push(row);
            // Add to supervisor totals
            groups[supervisor].totals.leadsAssigned += row.leadsAssigned;
            groups[supervisor].totals.attempted += row.attempted;
            groups[supervisor].totals.within15 += row.within15;
            groups[supervisor].totals.min1530 += row.min1530;
            groups[supervisor].totals.gt30 += row.gt30;
        });

        // Convert to array and calculate percentages
        return Object.values(groups).map(group => ({
            ...group,
            totals: {
                ...group.totals,
                percAttempted: group.totals.leadsAssigned ? ((group.totals.attempted / group.totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
                perc15: group.totals.leadsAssigned ? ((group.totals.within15 / group.totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
                perc30: group.totals.leadsAssigned ? ((group.totals.min1530 / group.totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
                percGt30: group.totals.leadsAssigned ? ((group.totals.gt30 / group.totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%'
            }
        }));
    };
    const toggleSupervisor = (supervisorName) => {
        setExpandedSupervisors(prev => ({
            ...prev,
            [supervisorName]: !prev[supervisorName]
        }));
    };

    const toggleAllSupervisors = () => {
        const allExpanded = Object.values(expandedSupervisors).every(val => val);
        const newState = {};
        supervisorGroups.forEach(group => {
            newState[group.supervisorName] = !allExpanded;
        });
        setExpandedSupervisors(newState);
    };
    const chartRef = useRef(null);
    const hiddenChartRef = useRef(null);

    const [filters, setFilters] = useState({
        dateRange: [dayjs().subtract(7, 'days'), dayjs()],
        source: '',
        groupBy: forcedGroupBy || 'counsellor',
    });

    const BUCKET_LABELS = {
        leadsAssigned: 'Total Leads',
        attempted: 'Attempted',
        within15: '< 15 Min',
        min1530: '15 - 30 Min',
        gt30: '> 30 Min',
    };

    const [drillDown, setDrillDown] = useState({
        visible: false, loading: false, data: [], groupLabel: '', bucket: '',
    });

    const handleCellClick = async (groupLabel, bucket, drillBy = 'counsellor') => {
        setDrillDown({ visible: true, loading: true, data: [], groupLabel, bucket });
        try {
            const params = new URLSearchParams();
            if (filters.dateRange && filters.dateRange.length === 2) {
                params.append('date_start', filters.dateRange[0].format('YYYY-MM-DD'));
                params.append('date_end', filters.dateRange[1].format('YYYY-MM-DD'));
            }
            if (filters.source) params.append('source', filters.source);
            params.append('group_by', filters.groupBy === 'hour' ? 'hour' : 'counsellor');
            params.append('drill_group', groupLabel);
            if (drillBy === 'supervisor') params.append('drill_by', 'supervisor');
            if (bucket !== 'leadsAssigned') params.append('drill_bucket', bucket);

            const res = await fetch(`${BASE_URL}/studentcoursestatus/lead-attempt-report-drilldown?${params.toString()}`, {
                credentials: 'include',
            });
            const result = await res.json();
            setDrillDown(prev => ({ ...prev, loading: false, data: result.success ? result.data : [] }));
        } catch (err) {
            console.error('Drill-down fetch failed:', err);
            setDrillDown(prev => ({ ...prev, loading: false, data: [] }));
        }
    };

    const drillColumns = [
        {
            title: 'Student ID', dataIndex: 'student_id', key: 'student_id', width: 130,
            render: (v) => (
                <span className="text-blue-600 hover:underline cursor-pointer font-mono text-sm"
                    onClick={() => window.open(`/student/${v}`, '_blank')}>{v}</span>
            ),
        },
        { title: 'Name', dataIndex: 'student_name', key: 'student_name', width: 150 },
        { title: 'Counsellor', dataIndex: 'counsellor_name', key: 'counsellor_name', width: 150 },
        { title: 'Supervisor', dataIndex: 'supervisor_name', key: 'supervisor_name', width: 150 },
        { title: 'Lead Created At', dataIndex: 'lead_created_time', key: 'lead_created_time', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--' },
        { title: 'First Remark At', dataIndex: 'first_remark_time', key: 'first_remark_time', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : <span className="text-slate-400">No remark</span> },
        { title: 'Attempt (min)', dataIndex: 'attempt_minutes', key: 'attempt_minutes', width: 120, align: 'center', render: (v) => v == null ? <span className="text-slate-400">—</span> : `${v} min` },
        { title: 'Status', dataIndex: 'current_student_status', key: 'current_student_status', width: 150 },
        { title: 'Source', dataIndex: 'source', key: 'source', width: 120 },
    ];

    // Update filters when forcedGroupBy changes
    useEffect(() => {
        if (forcedGroupBy) {
            setFilters(prev => ({ ...prev, groupBy: forcedGroupBy }));
        }
    }, [forcedGroupBy]);

    const timeSlots = [
        'Till 9 AM', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
        '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
        '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
        '20:00 - 21:00', 'After 9 PM'
    ];
    const RAW_EXPORT_FIELD_LABELS = {
        student_id: 'Student ID',
        student_name: 'Student Name',
        phone: 'Phone',
        email: 'Email',
        source: 'Source',
        counsellor_name: 'Counsellor Name',
        supervisor_name: 'Supervisor Name',
        lead_date: 'Lead Date',
        lead_time: 'Lead Time',
        lead_datetime: 'Lead Datetime',
        first_attempt_date: 'First Attempt Date',
        first_attempt_time: 'First Attempt Time',
        first_attempt_datetime: 'First Attempt Datetime',
        attempt_minutes: 'Attempt Minutes',
        attempt_category: 'Attempt Category',
        status: 'Status',
    };

    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportPendingData, setExportPendingData] = useState([]);

    const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const confirmRawExport = (selectedFields) => {
        const headerRow = selectedFields.map((k) => escapeCSV(RAW_EXPORT_FIELD_LABELS[k] || k)).join(',');
        const dataRows = exportPendingData.map((row) =>
            selectedFields.map((k) => escapeCSV(row[k])).join(',')
        ).join('\n');
        const csvContent = `${headerRow}\n${dataRows}`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `lead-attempt-raw-data-${filters.dateRange[0].format('YYYY-MM-DD')}-${filters.dateRange[1].format('YYYY-MM-DD')}.csv`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportModalOpen(false);
    };

    const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);
    const downloadRawData = async () => {
        setIsDownloadingRaw(true);
        try {
            const params = new URLSearchParams();
            if (filters.dateRange && filters.dateRange.length === 2) {
                params.append('date_start', filters.dateRange[0].format('YYYY-MM-DD'));
                params.append('date_end', filters.dateRange[1].format('YYYY-MM-DD'));
            }
            if (filters.source) params.append('source', filters.source);
            params.append('group_by', 'detailed'); // Always get detailed data

            const res = await fetch(`${BASE_URL}/studentcoursestatus/lead-attempt-report-raw?${params.toString()}`);

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }

            const result = await res.json();

            if (result.success && Array.isArray(result.data)) {
                setExportPendingData(result.data.map(row => ({
                    student_id: row.student_id || '',
                    student_name: row.student_name || '',
                    phone: row.phone || '',
                    email: row.email || '',
                    source: row.source || '',
                    counsellor_name: row.counsellor_name || '',
                    supervisor_name: row.supervisor_name || '',
                    lead_date: row.lead_date || '',
                    lead_time: row.lead_time || '',
                    lead_datetime: row.lead_datetime || '',
                    first_attempt_date: row.first_attempt_date || '',
                    first_attempt_time: row.first_attempt_time || '',
                    first_attempt_datetime: row.first_attempt_datetime || '',
                    attempt_minutes: row.attempt_minutes || '0',
                    attempt_category: row.attempt_category || '',
                    status: row.status || '',
                })));
                setExportModalOpen(true);
            } else {
                throw new Error(result.error || 'Failed to fetch raw data');
            }
        } catch (err) {
            console.error('Error downloading raw data:', err);
            alert('Failed to download raw data. Please check console for details.');
        } finally {
            setIsDownloadingRaw(false);
        }
    };
    const fetchData = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (filters.dateRange && filters.dateRange.length === 2) {
                params.append('date_start', filters.dateRange[0].format('YYYY-MM-DD'));
                params.append('date_end', filters.dateRange[1].format('YYYY-MM-DD'));
            }

            if (filters.source) params.append('source', filters.source);
            params.append('group_by', filters.groupBy);

            const res = await fetch(
                `${BASE_URL}/studentcoursestatus/lead-attempt-report?${params.toString()}`,
                {
                    method: 'GET',
                    credentials: 'include',  // ⬅️ This passes cookies 🍪
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = await res.json();

            if (result.success) {
                if (filters.groupBy === 'hour') {
                    const filledSlots = timeSlots.map(slot =>
                        result.rows.find(r => r.groupName === slot) || {
                            groupName: slot,
                            leadsAssigned: 0,
                            attempted: 0,
                            percAttempted: '0%',
                            within15: 0,
                            perc15: '0%',
                            min1530: 0,
                            perc30: '0%',
                            gt30: 0,
                            percGt30: '0%',
                        }
                    );

                    setData(filledSlots);
                    setSupervisorGroups([]);
                } else {
                    setData(result.rows);

                    const groupedData = groupBySupervisor(result.rows);
                    setSupervisorGroups(groupedData);

                    const initialExpanded = {};
                    groupedData.forEach(group => {
                        initialExpanded[group.supervisorName] = true;
                    });
                    setExpandedSupervisors(initialExpanded);
                }
            } else {
                message.error(result.message || 'Something went wrong');
            }

        } catch (err) {
            console.error('Fetch error:', err);
            message.error('API Request Failed');
        } finally {
            setLoading(false);
        }
    };


    const fetchFilters = async () => {
        try {
            const response = await fetchFilterOptions();
            setSourceOptions(response.data.source || []);
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchData();
        fetchFilters();
    }, [filters]);

    const totals = data.reduce((acc, r) => ({
        leadsAssigned: acc.leadsAssigned + r.leadsAssigned,
        attempted: acc.attempted + r.attempted,
        within15: acc.within15 + r.within15,
        min1530: acc.min1530 + r.min1530,
        gt30: acc.gt30 + r.gt30,
    }), { leadsAssigned: 0, attempted: 0, within15: 0, min1530: 0, gt30: 0 });

    const totalPercentages = {
        percAttempted: totals.leadsAssigned ? ((totals.attempted / totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
        perc15: totals.leadsAssigned ? ((totals.within15 / totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
        perc30: totals.leadsAssigned ? ((totals.min1530 / totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%',
        percGt30: totals.leadsAssigned ? ((totals.gt30 / totals.leadsAssigned) * 100).toFixed(1) + '%' : '0%'
    };

    // Chart data for stacked bar chart
    const getChartData = () => {
        const labels = data.map(r => r.groupName);
        const dataWithPercentages = data.map(row => {
            const total = row.leadsAssigned || 1;
            return {
                within15Perc: (row.within15 / total) * 100,
                min1530Perc: (row.min1530 / total) * 100,
                gt30Perc: (row.gt30 / total) * 100,
            };
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Within 15 mins',
                    data: dataWithPercentages.map(d => d.within15Perc),
                    backgroundColor: '#10b981', // Green
                    borderColor: '#10b981',
                    borderWidth: 0
                },
                {
                    label: '15 - 30 minutes',
                    data: dataWithPercentages.map(d => d.min1530Perc),
                    backgroundColor: '#ef4444', // Red
                    borderColor: '#ef4444',
                    borderWidth: 0
                },
                {
                    label: '> 30 minutes',
                    data: dataWithPercentages.map(d => d.gt30Perc),
                    backgroundColor: '#3b82f6', // Blue
                    borderColor: '#3b82f6',
                    borderWidth: 0
                }
            ]
        };
    };

    // Enhanced chart options for PDF with data labels
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { size: 12, weight: 'bold' },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'rect'
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 11 },
                padding: 10,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y.toFixed(1);
                        return `${label}: ${value}% of leads`;
                    },
                    afterBody: function (context) {
                        const dataIndex = context[0].dataIndex;
                        const row = data[dataIndex];
                        if (row) {
                            return [
                                '',
                                `Total Leads: ${row.leadsAssigned}`,
                                `Attempted: ${row.attempted}`,
                                `< 15 min: ${row.within15}`,
                                `15-30 min: ${row.min1530}`,
                                `> 30 min: ${row.gt30}`
                            ];
                        }
                        return [];
                    }
                }
            },
            datalabels: {
                display: true,
                color: '#fff',
                font: {
                    weight: 'bold',
                    size: 9
                },
                formatter: (value) => {
                    return value > 5 ? value.toFixed(1) + '%' : '';
                },
                anchor: 'center',
                align: 'center'
            },
            title: {
                display: true,
                text: `Response Time Distribution - ${filters.groupBy === 'counsellor' ? 'By Counsellor' : 'By Time Slot'}`,
                font: {
                    size: 15,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 15
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: {
                    font: { size: 10 },
                    maxRotation: 45,
                    minRotation: 45
                },
                title: {
                    display: true,
                    text: filters.groupBy === 'counsellor' ? '' : 'Time Slot',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    },
                    font: { size: 11 }
                },
                title: {
                    display: true,
                    text: 'Percentage of Total Leads',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            }
        }
    };

    // Generate chart image helper
    const generateChartImage = (chartData, groupBy) => {
        return new Promise((resolve) => {
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '1200px';
            tempContainer.style.height = '700px';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.padding = '20px';
            document.body.appendChild(tempContainer);

            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 700;
            tempContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            const customOptions = {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        ...chartOptions.plugins.title,
                        text: `Response Time Distribution - ${groupBy === 'counsellor' ? 'By Counsellor' : 'By Time Slot'}`
                    }
                },
                scales: {
                    ...chartOptions.scales,
                    x: {
                        ...chartOptions.scales.x,
                        title: {
                            ...chartOptions.scales.x.title,
                            text: groupBy === 'counsellor' ? '' : 'Time Slot'
                        }
                    }
                }
            };

            new ChartJS(ctx, {
                type: 'bar',
                data: chartData,
                options: customOptions
            });

            setTimeout(async () => {
                const chartCanvas = await html2canvas(tempContainer, {
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                const imgData = chartCanvas.toDataURL('image/png');
                document.body.removeChild(tempContainer);
                resolve(imgData);
            }, 500);
        });
    };

    const downloadPDF = async () => {
        setIsDownloading(true);

        try {
            const doc = new jsPDF('l', 'mm', 'a4');

            // === TITLE PAGE ===
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Lead Attempt Time Report', 148, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('Complete Analysis - Counsellor & Time Based', 148, 28, { align: 'center' });

            // Info box
            doc.setFillColor(239, 246, 255);
            doc.rect(14, 35, 268, 25, 'F');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Report Details:', 18, 42);

            doc.setFont('helvetica', 'normal');
            doc.text(`Date Range: ${filters.dateRange[0].format('YYYY-MM-DD')} to ${filters.dateRange[1].format('YYYY-MM-DD')}`, 18, 48);
            doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 18, 54);
            if (filters.source) {
                doc.text(`Filtered by Source: ${filters.source}`, 18, 60);
            }

            // === STATISTICS CARDS (REPLACING TEXT SUMMARY) ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Metrics Overview', 18, 75);

            // Card dimensions
            const cardWidth = 50;
            const cardHeight = 28;
            const cardSpacing = 4;
            const startX = 18;
            const startY = 82;

            // Card 1: Total Leads
            doc.setFillColor(239, 246, 255); // Light blue
            doc.roundedRect(startX, startY, cardWidth, cardHeight, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Total Leads', startX + 4, startY + 6);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175); // Blue
            doc.text(totals.leadsAssigned.toString(), startX + 4, startY + 18);

            // Card 2: Attempted
            const card2X = startX + cardWidth + cardSpacing;
            doc.setFillColor(240, 253, 244); // Light green
            doc.roundedRect(card2X, startY, cardWidth, cardHeight, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Attempted', card2X + 4, startY + 6);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // Green
            doc.text(`${totals.attempted}`, card2X + 4, startY + 16);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`(${totalPercentages.percAttempted}%)`, card2X + 4, startY + 23);

            // Card 3: Quick Response
            const card3X = card2X + cardWidth + cardSpacing;
            doc.setFillColor(254, 249, 195); // Light yellow
            doc.roundedRect(card3X, startY, cardWidth, cardHeight, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Quick (<15 min)', card3X + 4, startY + 6);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(234, 179, 8); // Dark yellow
            doc.text(`${totals.within15}`, card3X + 4, startY + 16);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`(${totalPercentages.perc15}%)`, card3X + 4, startY + 23);

            // Card 4: Moderate
            const card4X = card3X + cardWidth + cardSpacing;
            doc.setFillColor(255, 237, 213); // Light orange
            doc.roundedRect(card4X, startY, cardWidth, cardHeight, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Moderate (15-30)', card4X + 4, startY + 6);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(249, 115, 22); // Orange
            doc.text(`${totals.min1530}`, card4X + 4, startY + 16);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`(${totalPercentages.perc30}%)`, card4X + 4, startY + 23);

            // Card 5: Slow Response
            const card5X = card4X + cardWidth + cardSpacing;
            doc.setFillColor(254, 226, 226); // Light red
            doc.roundedRect(card5X, startY, cardWidth, cardHeight, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Slow (>30 min)', card5X + 4, startY + 6);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38); // Red
            doc.text(`${totals.gt30}`, card5X + 4, startY + 16);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`(${totalPercentages.percGt30}%)`, card5X + 4, startY + 23);

            // Reset text color
            doc.setTextColor(0, 0, 0);

            // === PAGE 1: Counsellor-wise Table ===
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Report by Counsellor', 14, 15);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('This table shows lead attempt metrics grouped by counsellor', 14, 22);

            // Fetch counsellor data
            const counsellorParams = new URLSearchParams();
            if (filters.dateRange && filters.dateRange.length === 2) {
                counsellorParams.append('datestart', filters.dateRange[0].format('YYYY-MM-DD'));
                counsellorParams.append('dateend', filters.dateRange[1].format('YYYY-MM-DD'));
            }
            if (filters.source) {
                counsellorParams.append('source', filters.source);
            }
            counsellorParams.append('groupby', 'counsellor');

            const counsellorRes = await fetch(`${BASE_URL}/studentcoursestatus/lead-attempt-report?${counsellorParams.toString()}`);
            const counsellorResult = await counsellorRes.json();
            const counsellorData = counsellorResult.success ? counsellorResult.rows : [];

            const counsellorHeaders = [['Counsellor', 'Leads', 'Attempted', '%', '<15 min', '%', '15-30', '%', '>30 min', '%']];

            const counsellorRows = counsellorData.map(row => [
                row.groupName,
                row.leadsAssigned,
                row.attempted,
                row.percAttempted,
                row.within15,
                row.perc15,
                row.min1530,
                row.perc30,
                row.gt30,
                row.percGt30
            ]);

            const counsellorTotals = counsellorData.reduce((acc, r) => ({
                leadsAssigned: acc.leadsAssigned + r.leadsAssigned,
                attempted: acc.attempted + r.attempted,
                within15: acc.within15 + r.within15,
                min1530: acc.min1530 + r.min1530,
                gt30: acc.gt30 + r.gt30,
            }), { leadsAssigned: 0, attempted: 0, within15: 0, min1530: 0, gt30: 0 });

            const counsellorTotalPerc = {
                percAttempted: counsellorTotals.leadsAssigned ? ((counsellorTotals.attempted / counsellorTotals.leadsAssigned) * 100).toFixed(1) : '0',
                perc15: counsellorTotals.leadsAssigned ? ((counsellorTotals.within15 / counsellorTotals.leadsAssigned) * 100).toFixed(1) : '0',
                perc30: counsellorTotals.leadsAssigned ? ((counsellorTotals.min1530 / counsellorTotals.leadsAssigned) * 100).toFixed(1) : '0',
                percGt30: counsellorTotals.leadsAssigned ? ((counsellorTotals.gt30 / counsellorTotals.leadsAssigned) * 100).toFixed(1) : '0'
            };

            counsellorRows.push([
                'Total',
                counsellorTotals.leadsAssigned,
                counsellorTotals.attempted,
                counsellorTotalPerc.percAttempted,
                counsellorTotals.within15,
                counsellorTotalPerc.perc15,
                counsellorTotals.min1530,
                counsellorTotalPerc.perc30,
                counsellorTotals.gt30,
                counsellorTotalPerc.percGt30
            ]);

            autoTable(doc, {
                head: counsellorHeaders,
                body: counsellorRows,
                startY: 28,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                didParseCell: (data) => {
                    if (data.row.index === counsellorRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [219, 234, 254];
                    }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Note: Percentages calculated relative to total leads assigned', 14, finalY);

            // === PAGE 2: Time Slot-wise Table ===
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Report by Time Slot', 14, 15);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('This table shows lead attempt metrics grouped by hourly time slots', 14, 22);

            // Fetch time slot data
            const timeParams = new URLSearchParams();
            if (filters.dateRange && filters.dateRange.length === 2) {
                timeParams.append('datestart', filters.dateRange[0].format('YYYY-MM-DD'));
                timeParams.append('dateend', filters.dateRange[1].format('YYYY-MM-DD'));
            }
            if (filters.source) {
                timeParams.append('source', filters.source);
            }
            timeParams.append('groupby', 'hour');

            const timeRes = await fetch(`${BASE_URL}/studentcoursestatus/lead-attempt-report?${timeParams.toString()}`);
            const timeResult = await timeRes.json();
            let timeData = timeResult.success ? timeResult.rows : [];

            if (timeData.length === 0) {
                timeData = timeSlots.map(slot =>
                    timeData.find(r => r.groupName === slot) || {
                        groupName: slot,
                        leadsAssigned: 0,
                        attempted: 0,
                        percAttempted: '0',
                        within15: 0,
                        perc15: '0',
                        min1530: 0,
                        perc30: '0',
                        gt30: 0,
                        percGt30: '0'
                    }
                );
            }

            const timeHeaders = [['Time Slot', 'Leads', 'Attempted', '%', '<15 min', '%', '15-30', '%', '>30 min', '%']];

            const timeRows = timeData.map(row => [
                row.groupName,
                row.leadsAssigned,
                row.attempted,
                row.percAttempted,
                row.within15,
                row.perc15,
                row.min1530,
                row.perc30,
                row.gt30,
                row.percGt30
            ]);

            const timeTotals = timeData.reduce((acc, r) => ({
                leadsAssigned: acc.leadsAssigned + r.leadsAssigned,
                attempted: acc.attempted + r.attempted,
                within15: acc.within15 + r.within15,
                min1530: acc.min1530 + r.min1530,
                gt30: acc.gt30 + r.gt30,
            }), { leadsAssigned: 0, attempted: 0, within15: 0, min1530: 0, gt30: 0 });

            const timeTotalPerc = {
                percAttempted: timeTotals.leadsAssigned ? ((timeTotals.attempted / timeTotals.leadsAssigned) * 100).toFixed(1) : '0',
                perc15: timeTotals.leadsAssigned ? ((timeTotals.within15 / timeTotals.leadsAssigned) * 100).toFixed(1) : '0',
                perc30: timeTotals.leadsAssigned ? ((timeTotals.min1530 / timeTotals.leadsAssigned) * 100).toFixed(1) : '0',
                percGt30: timeTotals.leadsAssigned ? ((timeTotals.gt30 / timeTotals.leadsAssigned) * 100).toFixed(1) : '0'
            };

            timeRows.push([
                'Total',
                timeTotals.leadsAssigned,
                timeTotals.attempted,
                timeTotalPerc.percAttempted,
                timeTotals.within15,
                timeTotalPerc.perc15,
                timeTotals.min1530,
                timeTotalPerc.perc30,
                timeTotals.gt30,
                timeTotalPerc.percGt30
            ]);

            autoTable(doc, {
                head: timeHeaders,
                body: timeRows,
                startY: 28,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                didParseCell: (data) => {
                    if (data.row.index === timeRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [219, 234, 254];
                    }
                }
            });

            // === PAGE 3: Counsellor Chart (NEW COLORS) ===
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Response Time Distribution - By Counsellor', 148, 15, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Chart shows percentage breakdown of response times for each counsellor', 148, 22, { align: 'center' });

            const counsellorChartData = {
                labels: counsellorData.map(r => r.groupName),
                datasets: [
                    {
                        label: 'Within 15 mins',
                        data: counsellorData.map(row => (row.within15 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#10b981', // Green
                    },
                    {
                        label: '15 - 30 minutes',
                        data: counsellorData.map(row => (row.min1530 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#ef4444', // Red
                    },
                    {
                        label: '> 30 minutes',
                        data: counsellorData.map(row => (row.gt30 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#3b82f6', // Blue
                    }
                ]
            };

            const counsellorChartImg = await generateChartImage(counsellorChartData, 'counsellor');
            doc.addImage(counsellorChartImg, 'PNG', 14, 30, 270, 160);

            // === PAGE 4: Time Slot Chart (NEW COLORS) ===
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Response Time Distribution - By Time Slot', 148, 15, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Chart shows percentage breakdown of response times for each hour of the day', 148, 22, { align: 'center' });

            const timeChartData = {
                labels: timeData.map(r => r.groupName),
                datasets: [
                    {
                        label: 'Within 15 mins',
                        data: timeData.map(row => (row.within15 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#10b981', // Green
                    },
                    {
                        label: '15 - 30 minutes',
                        data: timeData.map(row => (row.min1530 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#ef4444', // Red
                    },
                    {
                        label: '> 30 minutes',
                        data: timeData.map(row => (row.gt30 / (row.leadsAssigned || 1)) * 100),
                        backgroundColor: '#3b82f6', // Blue
                    }
                ]
            };

            const timeChartImg = await generateChartImage(timeChartData, 'hour');
            doc.addImage(timeChartImg, 'PNG', 14, 30, 270, 160);

            // Save PDF
            doc.save(`lead-attempt-complete-report-${filters.dateRange[0].format('YYYY-MM-DD')}.pdf`);

        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };


  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <DashboardHeader 
        title="Lead Attempt Analysis"
        actions={
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-1 flex shadow-sm">
                <button
                    onClick={() => setShowChart(false)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-xs font-bold ${!showChart ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FiGrid size={14} />
                    TABLE
                </button>
                <button
                    onClick={() => setShowChart(true)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-xs font-bold ${showChart ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FiBarChart2 size={14} />
                    CHART
                </button>
            </div>

            {userRole !== "Analyser" && (
              <>
                <button
                    onClick={downloadRawData}
                    disabled={loading || isDownloadingRaw}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100/50 font-bold text-xs"
                >
                    <FiDatabase size={14} />
                    EXPORT
                </button>
                <button
                    onClick={downloadPDF}
                    disabled={data.length === 0 || loading || isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md font-bold text-xs"
                >
                    <FiDownload size={14} />
                    PDF REPORT
                </button>
              </>
            )}

            <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all font-bold text-xs shadow-sm"
            >
                <FiFilter size={14} />
                FILTERS
            </button>
          </>
        }
      />

            <div className=" mx-auto">
                {!showChart ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        {filters.groupBy === 'counsellor' && supervisorGroups.length > 0 && (
                            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                                <h3 className="font-semibold text-gray-700">Supervisor-wise View</h3>
                                <button
                                    onClick={toggleAllSupervisors}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    {Object.values(expandedSupervisors).every(val => val) ? 'Collapse All' : 'Expand All'}
                                </button>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-blue-600 border-b border-blue-700">
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">
                                            {filters.groupBy === 'counsellor' ? 'Supervisor / Counsellor' : 'Time Slot'}
                                        </th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">Leads</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">Attempted</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">%</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">{"<15 min"}</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">%</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">15-30</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">%</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">{">30 min"}</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wider">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <FiRefreshCw className="animate-spin text-blue-600" size={20} />
                                                    <span className="text-gray-600">Loading data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filters.groupBy === 'counsellor' ? (
                                        supervisorGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                                    No data available
                                                </td>
                                            </tr>
                                        ) : (
                                            supervisorGroups.map((group, gIdx) => (
                                                <React.Fragment key={gIdx}>
                                                    {/* Supervisor Row */}
                                                    <tr
                                                        className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-semibold"
                                                        onClick={() => toggleSupervisor(group.supervisorName)}
                                                    >
                                                        <td className="px-4 py-2.5 font-medium text-gray-900 flex items-center gap-2">
                                                            {expandedSupervisors[group.supervisorName] ? '▼' : '▶'}
                                                            <span className="text-blue-600 text-xs">{group.supervisorName}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCellClick(group.supervisorName, 'leadsAssigned', 'supervisor'); }}>{group.totals.leadsAssigned}</span></td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCellClick(group.supervisorName, 'attempted', 'supervisor'); }}>{group.totals.attempted}</span></td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs">{group.totals.percAttempted}</td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCellClick(group.supervisorName, 'within15', 'supervisor'); }}>{group.totals.within15}</span></td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs">{group.totals.perc15}</td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCellClick(group.supervisorName, 'min1530', 'supervisor'); }}>{group.totals.min1530}</span></td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs">{group.totals.perc30}</td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCellClick(group.supervisorName, 'gt30', 'supervisor'); }}>{group.totals.gt30}</span></td>
                                                        <td className="px-4 py-2.5 text-center text-gray-900 text-xs">{group.totals.percGt30}</td>
                                                    </tr>

                                                    {/* Counsellor Rows (conditional) */}
                                                    {expandedSupervisors[group.supervisorName] && group.counsellors.map((counsellor, cIdx) => (
                                                        <tr key={`${gIdx}-${cIdx}`} className="hover:bg-gray-50 bg-gray-50/50">
                                                            <td className="px-4 py-2.5 font-medium text-gray-900 pl-12">
                                                                <span className="ml-2 text-xs">{counsellor.groupName}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(counsellor.groupName, 'leadsAssigned', 'counsellor')}>{counsellor.leadsAssigned}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(counsellor.groupName, 'attempted', 'counsellor')}>{counsellor.attempted}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{counsellor.percAttempted}</td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(counsellor.groupName, 'within15', 'counsellor')}>{counsellor.within15}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{counsellor.perc15}</td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(counsellor.groupName, 'min1530', 'counsellor')}>{counsellor.min1530}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{counsellor.perc30}</td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(counsellor.groupName, 'gt30', 'counsellor')}>{counsellor.gt30}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{counsellor.percGt30}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        )
                                    ) : (
                                        // Time slot view (original logic)
                                        data.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                                    No data available
                                                </td>
                                            </tr>
                                        ) : (
                                            data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors text-sm">
                                                    <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white text-xs">{row.groupName}</td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupName, 'leadsAssigned', 'hour')}>{row.leadsAssigned}</span></td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupName, 'attempted', 'hour')}>{row.attempted}</span></td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{row.percAttempted}</td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupName, 'within15', 'hour')}>{row.within15}</span></td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{row.perc15}</td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupName, 'min1530', 'hour')}>{row.min1530}</span></td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{row.perc30}</td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs"><span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupName, 'gt30', 'hour')}>{row.gt30}</span></td>
                                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{row.percGt30}</td>
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                                {!loading && (
                                    filters.groupBy === 'counsellor' ? (
                                        supervisorGroups.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                                    <td className="px-6 py-2 text-gray-900 sticky left-0 bg-blue-50">Total</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.leadsAssigned}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.attempted}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.percAttempted}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.within15}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.perc15}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.min1530}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.perc30}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.gt30}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.percGt30}</td>
                                                </tr>
                                            </tfoot>
                                        )
                                    ) : (
                                        data.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                                    <td className="px-6 py-2 text-gray-900 sticky left-0 bg-blue-50">Total</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.leadsAssigned}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.attempted}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.percAttempted}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.within15}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.perc15}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.min1530}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.perc30}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totals.gt30}</td>
                                                    <td className="px-6 py-2 text-center text-gray-900 text-xs">{totalPercentages.percGt30}</td>
                                                </tr>
                                            </tfoot>
                                        )
                                    )
                                )}
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8" ref={chartRef}>
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Response Time Distribution</h3>
                        <div style={{ height: '500px' }}>
                            <Bar data={getChartData()} options={chartOptions} />
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Drawer */}
            {drawerOpen && (
                <>
                    <div
                        className="fixed inset-0 backdrop-blur-xs bg-opacity-50 z-40 transition-opacity"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <FiFilter className="text-blue-600" size={18} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Date Range</label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={filters.dateRange[0].format('YYYY-MM-DD')}
                                                onChange={(e) => setFilters(f => ({
                                                    ...f,
                                                    dateRange: [dayjs(e.target.value), f.dateRange[1]]
                                                }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={filters.dateRange[1].format('YYYY-MM-DD')}
                                                onChange={(e) => setFilters(f => ({
                                                    ...f,
                                                    dateRange: [f.dateRange[0], dayjs(e.target.value)]
                                                }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Source</label>
                                    <select
                                        value={filters.source}
                                        onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        <option value="">All Sources</option>
                                        {sourceOptions.map(source => (
                                            <option key={source} value={source}>{source}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Filters</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFilters(f => ({
                                                ...f,
                                                dateRange: [dayjs(), dayjs()]
                                            }))}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => setFilters(f => ({
                                                ...f,
                                                dateRange: [dayjs().subtract(7, 'days'), dayjs()]
                                            }))}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Last 7 Days
                                        </button>
                                        <button
                                            onClick={() => setFilters(f => ({
                                                ...f,
                                                dateRange: [dayjs().subtract(30, 'days'), dayjs()]
                                            }))}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Last 30 Days
                                        </button>
                                        <button
                                            onClick={() => setFilters(f => ({
                                                ...f,
                                                dateRange: [dayjs().startOf('month'), dayjs()]
                                            }))}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            This Month
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 space-y-3">
                                <button
                                    onClick={() => {
                                        fetchData();
                                        setDrawerOpen(false);
                                    }}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiRefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                                    {loading ? 'Loading...' : 'Apply Filters'}
                                </button>
                                <button
                                    onClick={() => {
                                        setFilters({
                                            dateRange: [dayjs().subtract(7, 'days'), dayjs()],
                                            source: '',
                                            groupBy: 'counsellor',
                                        });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Export field-selection modal */}
            <ExportFieldSelectModal
                open={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onExport={confirmRawExport}
                title="Select Fields to Export"
                fieldGroups={[
                    {
                        label: 'Available Fields',
                        color: 'blue',
                        fields: Object.keys(RAW_EXPORT_FIELD_LABELS).map((key) => ({
                            key,
                            label: RAW_EXPORT_FIELD_LABELS[key],
                        })),
                    },
                ]}
            />

            {/* Drill-down modal */}
            <Modal
                open={drillDown.visible}
                onCancel={() => setDrillDown(prev => ({ ...prev, visible: false }))}
                width="92vw"
                style={{ top: 20 }}
                footer={null}
                title={
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800">{drillDown.groupLabel || '—'}</span>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {BUCKET_LABELS[drillDown.bucket] || drillDown.bucket}
                        </span>
                    </div>
                }
            >
                <Spin spinning={drillDown.loading} tip="Loading students...">
                    {drillDown.data.length > 0 ? (
                        <Table
                            columns={drillColumns}
                            dataSource={drillDown.data}
                            rowKey="student_id"
                            pagination={{ pageSize: 20, showSizeChanger: false }}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    ) : !drillDown.loading ? (
                        <Empty description="No students found" />
                    ) : null}
                </Spin>
            </Modal>
        </div>
    );
};

export default LeadAttemptReport;
