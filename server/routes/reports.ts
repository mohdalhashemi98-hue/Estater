import { Router, Request, Response } from 'express';
import * as reportGen from '../services/reportGenerator.js';
import { generateReportPdf } from '../services/pdfExporter.js';
import { generateReportExcel } from '../services/excelExporter.js';

const router = Router();

const REPORT_TYPES = [
  { id: 'portfolio_overview', name: 'Portfolio Overview', description: 'Summary of all properties with revenue and expenses' },
  { id: 'property_pnl', name: 'Property P&L', description: 'Profit & Loss for a specific property', requires_property: true },
  { id: 'rent_roll', name: 'Rent Roll', description: 'All active leases with rent details' },
  { id: 'payment_history', name: 'Payment History', description: 'History of all paid payments' },
  { id: 'occupancy_report', name: 'Occupancy Report', description: 'Unit occupancy status across all properties' },
];

// GET /types
router.get('/types', (_req: Request, res: Response) => {
  res.json(REPORT_TYPES);
});

// POST /generate
router.post('/generate', async (req: Request, res: Response) => {
  const { report_type, format = 'pdf', property_id, from_date, to_date } = req.body;

  let report: any;
  try {
    switch (report_type) {
      case 'portfolio_overview':
        report = reportGen.portfolioOverview();
        break;
      case 'property_pnl':
        if (!property_id) return res.status(400).json({ error: 'property_id required for P&L report' });
        report = reportGen.propertyPnL(property_id, from_date, to_date);
        break;
      case 'rent_roll':
        report = reportGen.rentRoll();
        break;
      case 'payment_history':
        report = reportGen.paymentHistory(property_id, from_date, to_date);
        break;
      case 'occupancy_report':
        report = reportGen.occupancyReport();
        break;
      default:
        return res.status(400).json({ error: `Unknown report type: ${report_type}` });
    }

    if (format === 'json') {
      return res.json(report);
    }

    if (format === 'excel') {
      const buffer = generateReportExcel(report);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title}.xlsx"`);
      return res.send(buffer);
    }

    // Default: PDF
    const buffer = await generateReportPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.title}.pdf"`);
    return res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Report generation failed' });
  }
});

export default router;
