import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { generatePaymentSchedule } from '../utils/scheduleGenerator.js';
import { emitWebhookEvent } from '../services/webhookEmitter.js';

const router = Router();

// List contracts
router.get('/', (req: Request, res: Response) => {
  const { status, tenant_id, unit_id } = req.query;
  let sql = `
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name,
           (SELECT COUNT(*) FROM contract_files cf WHERE cf.contract_id = c.id) as file_count
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  if (tenant_id) { sql += ' AND c.tenant_id = ?'; params.push(tenant_id); }
  if (unit_id) { sql += ' AND c.unit_id = ?'; params.push(unit_id); }

  sql += ' ORDER BY c.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Get single contract with payments and deposit
router.get('/:id', (req: Request, res: Response) => {
  const contract = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           t.phone as tenant_phone, t.email as tenant_email,
           u.unit_number, p.name as property_name
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const payments = db.prepare(
    'SELECT * FROM payments WHERE contract_id = ? ORDER BY payment_number'
  ).all(req.params.id);

  const deposit = db.prepare(
    'SELECT * FROM deposits WHERE contract_id = ?'
  ).get(req.params.id);

  const files = db.prepare(
    'SELECT * FROM contract_files WHERE contract_id = ? ORDER BY uploaded_at DESC'
  ).all(req.params.id);

  res.json({ ...contract as any, payments, deposit: deposit || null, files });
});

// Create contract with payment schedule and optional deposit
router.post('/', (req: Request, res: Response) => {
  const {
    unit_id, tenant_id, start_date, end_date,
    rent_amount, payment_frequency, total_payments,
    status, notes, deposit_amount, currency
  } = req.body;

  const createContract = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO contracts (unit_id, tenant_id, start_date, end_date, rent_amount, payment_frequency, total_payments, status, notes, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(unit_id, tenant_id, start_date, end_date, rent_amount, payment_frequency || 'monthly', total_payments, status || 'active', notes || null, currency || 'AED');

    const contractId = result.lastInsertRowid as number;

    // Generate payment schedule
    const payments = generatePaymentSchedule({
      contractId,
      startDate: start_date,
      rentAmount: rent_amount,
      frequency: payment_frequency || 'monthly',
      totalPayments: total_payments,
    });

    const insertPayment = db.prepare(
      'INSERT INTO payments (contract_id, payment_number, due_date, amount, status) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of payments) {
      insertPayment.run(p.contract_id, p.payment_number, p.due_date, p.amount, p.status);
    }

    // Create deposit if amount provided
    if (deposit_amount && deposit_amount > 0) {
      db.prepare(
        'INSERT INTO deposits (contract_id, amount, date_received, status) VALUES (?, ?, ?, ?)'
      ).run(contractId, deposit_amount, start_date, 'held');
    }

    // Mark unit as occupied
    if (!status || status === 'active') {
      db.prepare("UPDATE units SET status = 'occupied', updated_at = datetime('now') WHERE id = ?").run(unit_id);
    }

    return contractId;
  });

  const id = createContract();
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  emitWebhookEvent('contract.created', contract as object);
  res.status(201).json(contract);
});

// Update contract
router.put('/:id', (req: Request, res: Response) => {
  const { start_date, end_date, rent_amount, payment_frequency, total_payments, status, notes } = req.body;
  db.prepare(`
    UPDATE contracts SET start_date=?, end_date=?, rent_amount=?, payment_frequency=?, total_payments=?, status=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(start_date, end_date, rent_amount, payment_frequency, total_payments, status, notes || null, req.params.id);

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  res.json(contract);
});

// Renew contract
router.post('/:id/renew', (req: Request, res: Response) => {
  const oldContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
  if (!oldContract) return res.status(404).json({ error: 'Contract not found' });

  const {
    start_date, end_date, rent_amount,
    payment_frequency, total_payments, deposit_amount, notes
  } = req.body;

  const renewContract = db.transaction(() => {
    // Mark old contract as renewed
    db.prepare("UPDATE contracts SET status = 'renewed', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    // Create new contract
    const result = db.prepare(`
      INSERT INTO contracts (unit_id, tenant_id, start_date, end_date, rent_amount, payment_frequency, total_payments, status, renewal_of, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      oldContract.unit_id, oldContract.tenant_id,
      start_date, end_date,
      rent_amount || oldContract.rent_amount,
      payment_frequency || oldContract.payment_frequency,
      total_payments,
      req.params.id,
      notes || null
    );

    const newId = result.lastInsertRowid as number;

    // Generate new payment schedule
    const payments = generatePaymentSchedule({
      contractId: newId,
      startDate: start_date,
      rentAmount: rent_amount || oldContract.rent_amount,
      frequency: payment_frequency || oldContract.payment_frequency,
      totalPayments: total_payments,
    });

    const insertPayment = db.prepare(
      'INSERT INTO payments (contract_id, payment_number, due_date, amount, status) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of payments) {
      insertPayment.run(p.contract_id, p.payment_number, p.due_date, p.amount, p.status);
    }

    if (deposit_amount && deposit_amount > 0) {
      db.prepare(
        'INSERT INTO deposits (contract_id, amount, date_received, status) VALUES (?, ?, ?, ?)'
      ).run(newId, deposit_amount, start_date, 'held');
    }

    return newId;
  });

  const newId = renewContract();
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(newId);
  emitWebhookEvent('contract.renewed', contract as object);
  res.status(201).json(contract);
});

// Terminate contract
router.post('/:id/terminate', (req: Request, res: Response) => {
  const terminateContract = db.transaction(() => {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (!contract) throw { status: 404, message: 'Contract not found' };

    db.prepare("UPDATE contracts SET status = 'terminated', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE payments SET status = 'cancelled', updated_at = datetime('now') WHERE contract_id = ? AND status = 'pending'").run(req.params.id);
    db.prepare("UPDATE units SET status = 'vacant', updated_at = datetime('now') WHERE id = ?").run(contract.unit_id);
  });

  terminateContract();
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  emitWebhookEvent('contract.terminated', contract as object);
  res.json(contract);
});

// Create contract from AI analysis — creates tenant, property, unit, contract, payments, and deposit in one transaction
router.post('/create-from-analysis', (req: Request, res: Response) => {
  const { tenant, property, unit, contract } = req.body;

  const createAll = db.transaction(() => {
    // 1. Find or create tenant
    let tenantId: number;
    const existingTenant = db.prepare(
      'SELECT id FROM tenants WHERE phone = ? OR (first_name = ? AND last_name = ?)'
    ).get(tenant.phone, tenant.first_name, tenant.last_name) as any;

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const tenantResult = db.prepare(
        'INSERT INTO tenants (first_name, last_name, email, phone, id_number, company_name) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(tenant.first_name, tenant.last_name, tenant.email || null, tenant.phone, tenant.id_number || null, tenant.company_name || null);
      tenantId = tenantResult.lastInsertRowid as number;
    }

    // 2. Create property
    const propResult = db.prepare(
      'INSERT INTO properties (name, type, emirate, city, neighborhood, street, villa_number) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      property.name, property.type || 'apartment', property.emirate || 'Dubai',
      property.city || null, property.neighborhood || null, property.street || null, property.villa_number || null
    );
    const propertyId = propResult.lastInsertRowid as number;

    // 3. Create unit
    const unitResult = db.prepare(
      'INSERT INTO units (property_id, unit_number, floor, bedrooms, bathrooms, area_sqm) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      propertyId, unit.unit_number || '1', unit.floor || null,
      unit.bedrooms || null, unit.bathrooms || null, unit.area_sqm || null
    );
    const unitId = unitResult.lastInsertRowid as number;

    // 4. Create contract
    const contractResult = db.prepare(`
      INSERT INTO contracts (unit_id, tenant_id, start_date, end_date, rent_amount, payment_frequency, total_payments, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      unitId, tenantId, contract.start_date, contract.end_date,
      contract.rent_amount, contract.payment_frequency || 'monthly',
      contract.total_payments, contract.notes || null
    );
    const contractId = contractResult.lastInsertRowid as number;

    // 5. Generate payment schedule
    const payments = generatePaymentSchedule({
      contractId,
      startDate: contract.start_date,
      rentAmount: contract.rent_amount,
      frequency: contract.payment_frequency || 'monthly',
      totalPayments: contract.total_payments,
    });

    const insertPayment = db.prepare(
      'INSERT INTO payments (contract_id, payment_number, due_date, amount, status) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of payments) {
      insertPayment.run(p.contract_id, p.payment_number, p.due_date, p.amount, p.status);
    }

    // 6. Create deposit if provided
    if (contract.deposit_amount && contract.deposit_amount > 0) {
      db.prepare(
        'INSERT INTO deposits (contract_id, amount, date_received, status) VALUES (?, ?, ?, ?)'
      ).run(contractId, contract.deposit_amount, contract.start_date, 'held');
    }

    // 7. Mark unit as occupied
    db.prepare("UPDATE units SET status = 'occupied', updated_at = datetime('now') WHERE id = ?").run(unitId);

    return contractId;
  });

  try {
    const contractId = createAll();
    const created = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);
    emitWebhookEvent('contract.created_from_ai', created as object);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create contract from analysis' });
  }
});

export default router;
