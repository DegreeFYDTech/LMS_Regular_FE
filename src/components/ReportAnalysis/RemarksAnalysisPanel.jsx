import React, { useRef } from 'react';
import RemarksStackedBarChart from './RemarksStackedBarChart';
import ConnectedCallsTable from './ConnectedCallsTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

const safeToPng = async (node) => {
  try {
    return await toPng(node, {
      backgroundColor: '#FFFFFF',
      quality: 0.8,
      pixelRatio: 1,
      skipFonts: true,
      filter: (node) => {
        if (node.tagName === 'LINK' && node.rel === 'stylesheet') return false;
        if (node.tagName === 'STYLE') return false;
        return true;
      },
    });
  } catch (err) {
    console.warn('Error generating PNG, using fallback:', err);
    return await toPng(node, {
      backgroundColor: '#FFFFFF',
      quality: 0.7,
      skipFonts: true,
    });
  }
};

export default function RemarksAnalysisPanel({ chartData, tableData, remarksTableData, onCellClick }) {
  const chartRef = useRef();

  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Remarks Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      if (chartRef.current) {
        try {
          const chartImage = await safeToPng(chartRef.current);
          if (chartImage) {
            const maxWidth = pageWidth - 20;
            const maxHeight = 80;

            const imgProps = pdf.getImageProperties(chartImage);
            const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
            const imgWidth = imgProps.width * ratio;
            const imgHeight = imgProps.height * ratio;

            if (imgWidth > 0 && imgHeight > 0) {
              pdf.addImage(chartImage, 'PNG', 10, yPosition, imgWidth, imgHeight, undefined, 'FAST');
              yPosition += imgHeight + 15;
            } else {
              throw new Error('Invalid image dimensions');
            }
          }
        } catch (imgError) {
          console.warn('Failed to add chart image:', imgError);
          pdf.setFontSize(12);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Chart preview not available', 10, yPosition);
          yPosition += 20;
        }
      }

      if (tableData && tableData.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Connected Calls Analysis', 10, yPosition);
        yPosition += 10;

        const connectedHeaders = [
          'Counsellor',
          'Total',
          'Connected',
          '%',
          '9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19'
        ];

        const connectedRows = tableData.map(item => {
          const perc = item.totalRemarks
            ? Math.round((item.totalConnectedCalls / item.totalRemarks) * 100)
            : 0;

          const row = [
            item.counsellorName?.substring(0, 12) || '-',
            item.totalRemarks?.toString() || '0',
            item.totalConnectedCalls?.toString() || '0',
            `${perc}%`
          ];

          for (let i = 9; i <= 19; i++) {
            const slotLabel = `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`;
            row.push((item.timeSlots?.[slotLabel]?.count || 0).toString());
          }

          return row;
        });

        try {
          autoTable(pdf, {
            head: [connectedHeaders],
            body: connectedRows,
            startY: yPosition,
            styles: {
              fontSize: 6,
              cellPadding: 1,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: {
              fillColor: [59, 130, 246],
              fontSize: 6,
              cellPadding: 1
            },
            margin: { left: 5, right: 5 },
            tableWidth: 'auto',
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 15 },
              2: { cellWidth: 18 },
              3: { cellWidth: 12 },
              ...Object.fromEntries(
                Array.from({ length: 11 }, (_, i) => [i + 4, { cellWidth: 12 }])
              )
            }
          });

          yPosition = pdf.lastAutoTable.finalY + 10;
        } catch (tableError) {
          console.error('Error creating connected calls table:', tableError);
          yPosition += 30;
        }
      }

      if (remarksTableData && remarksTableData.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Remarks Analysis (Hourly Breakdown)', 10, yPosition);
        yPosition += 10;

        const remarksHeaders = [
          'Counsellor',
          'Total',
          '9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19'
        ];

        const remarksRows = remarksTableData.map(item => {
          const row = [
            item.counsellorName?.substring(0, 12) || '-',
            item.totalRemarks?.toString() || '0'
          ];

          for (let i = 9; i <= 19; i++) {
            const slotLabel = `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`;
            row.push((item.timeSlots?.[slotLabel]?.count || 0).toString());
          }

          return row;
        });

        try {
          autoTable(pdf, {
            head: [remarksHeaders],
            body: remarksRows,
            startY: yPosition,
            styles: {
              fontSize: 6,
              cellPadding: 1,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: {
              fillColor: [34, 197, 94],
              fontSize: 6,
              cellPadding: 1
            },
            margin: { left: 5, right: 5 },
            tableWidth: 'auto',
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 15 },
              ...Object.fromEntries(
                Array.from({ length: 11 }, (_, i) => [i + 2, { cellWidth: 12 }])
              )
            }
          });
        } catch (tableError) {
          console.error('Error creating remarks table:', tableError);
        }
      }

      pdf.save('remarks_analysis_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow ">
      <div className="grid grid-cols-1 gap-20 mb-6">
        <div
          ref={chartRef}
          className="bg-white p-4"
          style={{
            fontFamily: 'Arial, sans-serif',
            width: '100%',
            height: '400px'
          }}
        >
          <RemarksStackedBarChart data={chartData} hideDownload />
        </div>

        <div className="bg-white p-4 overflow-auto max-h-[700px] ">
          <ConnectedCallsTable data={tableData} compact onCellClick={onCellClick} />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          <Download className="w-5 h-5" />
          Download Complete Report (PDF)
        </button>
      </div>
    </div>
  );
}
