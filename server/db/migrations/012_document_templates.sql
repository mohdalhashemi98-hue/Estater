CREATE TABLE IF NOT EXISTS document_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK(template_type IN ('contract','receipt','notice')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO document_templates (id, name, template_type, content) VALUES (1, 'Standard Rental Contract', 'contract', '<h1>Rental Agreement</h1>
<p><strong>Date:</strong> {{contract_start_date}}</p>
<h2>Parties</h2>
<p><strong>Landlord:</strong> Estater Property Management</p>
<p><strong>Tenant:</strong> {{tenant_name}}</p>
<p>Email: {{tenant_email}} | Phone: {{tenant_phone}}</p>
<h2>Property</h2>
<p><strong>Property:</strong> {{property_name}}</p>
<p><strong>Unit:</strong> {{unit_number}}</p>
<h2>Lease Terms</h2>
<p><strong>Start Date:</strong> {{contract_start_date}}</p>
<p><strong>End Date:</strong> {{contract_end_date}}</p>
<p><strong>Monthly Rent:</strong> {{rent_amount}} {{currency}}</p>
<p><strong>Payment Frequency:</strong> {{payment_frequency}}</p>
<p><strong>Total Payments:</strong> {{total_payments}}</p>
<h2>Signatures</h2>
<p>Landlord: _________________________ Date: ___________</p>
<p>Tenant: _________________________ Date: ___________</p>');
