import PDFDocument from 'pdfkit';

export function generateReportPdf(report: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text(report.title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
        .text(`Generated: ${new Date(report.generated_at).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1);
      doc.fillColor('#000000');

      const data = Array.isArray(report.data) ? report.data : null;

      if (data && data.length > 0) {
        const keys = Object.keys(data[0]).filter(k => !k.includes('created_at') && !k.includes('updated_at'));

        // Table header
        doc.fontSize(8).font('Helvetica-Bold');
        const colWidth = (doc.page.width - 100) / Math.min(keys.length, 8);
        const displayKeys = keys.slice(0, 8);
        let x = 50;
        for (const key of displayKeys) {
          doc.text(key.replace(/_/g, ' ').toUpperCase(), x, doc.y, { width: colWidth, continued: false });
          x += colWidth;
        }
        doc.moveDown(0.5);

        // Draw line
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#E5E7EB');
        doc.moveDown(0.3);

        // Table rows
        doc.font('Helvetica').fontSize(8);
        for (const row of data.slice(0, 100)) {
          const y = doc.y;
          if (y > doc.page.height - 80) {
            doc.addPage();
          }
          x = 50;
          for (const key of displayKeys) {
            const val = row[key] ?? '';
            doc.text(String(val).slice(0, 30), x, doc.y, { width: colWidth, continued: false });
            x += colWidth;
          }
          doc.moveDown(0.2);
        }
      } else if (report.data && typeof report.data === 'object') {
        // Key-value report (like P&L)
        const obj = report.data;
        doc.fontSize(10);
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            doc.moveDown(0.5).font('Helvetica-Bold').fontSize(12)
              .text(key.replace(/_/g, ' ').toUpperCase());
            doc.font('Helvetica').fontSize(9);
            for (const item of value as any[]) {
              doc.text(`  ${(item as any).category || (item as any).metric || ''}: ${(item as any).total || (item as any).value || ''}`);
            }
          } else {
            doc.font('Helvetica').fontSize(10)
              .text(`${key.replace(/_/g, ' ')}: ${value}`);
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
