import XLSX from 'xlsx';

export function generateReportExcel(report: any): Buffer {
  const wb = XLSX.utils.book_new();

  const data = Array.isArray(report.data) ? report.data : null;

  if (data && data.length > 0) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, report.title.slice(0, 31));
  } else if (report.data && typeof report.data === 'object') {
    // For P&L style reports with nested data
    const obj = report.data;
    const summaryRows: any[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        // Add array data as a separate sheet
        if ((value as any[]).length > 0) {
          const ws = XLSX.utils.json_to_sheet(value as any[]);
          XLSX.utils.book_append_sheet(wb, ws, key.replace(/_/g, ' ').slice(0, 31));
        }
      } else {
        summaryRows.push({ metric: key.replace(/_/g, ' '), value });
      }
    }

    if (summaryRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    }
  } else {
    const ws = XLSX.utils.json_to_sheet([{ message: 'No data' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
  }

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
