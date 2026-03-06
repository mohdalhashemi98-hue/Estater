import db from '../db/connection.js';

// Check if we have sample data, seed if not
function ensureSampleData() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM adrec_transactions').get() as any).c;
  if (count > 0) return;
  seedAdrecTransactions();
}

function seedAdrecTransactions() {
  // Real Abu Dhabi areas with buildings/projects based on ADREC 2025 report data
  const areas = [
    { area: 'Saadiyat Island', buildings: ['Saadiyat Beach Residences', 'Mamsha Al Saadiyat', 'Park View', 'Soho Square', 'Saadiyat Lagoons', 'Nudra', 'Louvre Abu Dhabi Residences', 'The Dunes'] },
    { area: 'Yas Island', buildings: ['Yas Acres', 'Waters Edge', 'Mayan', 'Ansam', 'Yas Bay Residences', 'Yas Golf Collection', 'Gardenia Bay', 'The Cedars'] },
    { area: 'Al Reem Island', buildings: ['Sun & Sky Towers', 'Marina Square', 'Hydra Avenue', 'City of Lights', 'Shams Abu Dhabi', 'Tala Tower', 'The Gate Tower', 'Arc Tower'] },
    { area: 'Al Raha Beach', buildings: ['Al Muneera', 'Al Zeina', 'Al Bandar', 'Canal Residence', 'Al Hadeel', 'Lofts East'] },
    { area: 'Al Maryah Island', buildings: ['The Residences at Al Maryah Island', 'Four Seasons Residences', 'Cleveland Clinic Residences', 'Al Maryah Vista'] },
    { area: 'Khalifa City', buildings: ['Al Rayyana', 'Bloom Gardens', 'Bloom Living', 'Al Forsan Village', 'Jouri Hills'] },
    { area: 'Al Reef', buildings: ['Al Reef Villas', 'Al Reef Downtown', 'Desert Village', 'Contemporary Village', 'Arabian Village'] },
    { area: 'Mohammed Bin Zayed City', buildings: ['Mazyad Mall Residences', 'Shabia', 'Officers City', 'MBZ Villas'] },
    { area: 'Masdar City', buildings: ['Oasis Residences', 'The Gate Residences', 'Leonardo Residences', 'Makers District'] },
    { area: 'Al Ghadeer', buildings: ['Al Ghadeer Villas', 'Al Ghadeer Townhouses', 'The Community'] },
    { area: 'Corniche', buildings: ['Etihad Towers', 'Nation Towers', 'Corniche Tower', 'Beach Tower', 'Bab Al Qasr Residences'] },
    { area: 'Ramhan Island', buildings: ['Ramhan Villas', 'Nova', 'Eagle Hills Residences'] },
  ];

  const types = ['apartment', 'villa', 'townhouse', 'penthouse'];
  const regTypes = ['Sale', 'Resale', 'Off-Plan'];
  const rooms = ['Studio', '1BR', '2BR', '3BR', '4BR', '5BR+'];

  const insert = db.prepare(`
    INSERT INTO adrec_transactions (transaction_id, area, building, property_type, property_sub_type, reg_type, rooms, actual_worth, meter_sale_price, area_sqm, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = db.transaction(() => {
    let txId = 1;
    for (const { area, buildings } of areas) {
      const basePricePerSqm = getBasePrice(area);

      for (const building of buildings) {
        // Generate 6-12 transactions per building over last 2 years
        const numTx = 6 + Math.floor(Math.random() * 7);
        for (let i = 0; i < numTx; i++) {
          const daysAgo = Math.floor(Math.random() * 730);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          const dateStr = date.toISOString().split('T')[0];

          const propType = types[Math.floor(Math.random() * 3)]; // weight toward residential
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          const areaSqm = getAreaForRoom(room);
          const priceVariation = 0.82 + Math.random() * 0.36; // +-18% variation
          const priceSqm = basePricePerSqm * priceVariation;
          const totalPrice = areaSqm * priceSqm;
          const regType = regTypes[Math.floor(Math.random() * regTypes.length)];

          insert.run(
            `ADREC-${String(txId++).padStart(8, '0')}`,
            area, building, propType, room,
            regType, room,
            Math.round(totalPrice),
            Math.round(priceSqm),
            Math.round(areaSqm),
            dateStr
          );
        }
      }
    }
  });

  batch();
  console.log('Seeded ADREC Abu Dhabi sample transaction data');
}

// Prices per sqm based on ADREC 2025 market report
function getBasePrice(area: string): number {
  const prices: Record<string, number> = {
    'Saadiyat Island': 23000,
    'Al Maryah Island': 21000,
    'Ramhan Island': 20000,
    'Yas Island': 18000,
    'Al Raha Beach': 16500,
    'Corniche': 15000,
    'Al Reem Island': 14000,
    'Masdar City': 12000,
    'Khalifa City': 10000,
    'Al Reef': 8500,
    'Mohammed Bin Zayed City': 7500,
    'Al Ghadeer': 6000,
  };
  return prices[area] || 12000;
}

function getAreaForRoom(room: string): number {
  const areas: Record<string, number> = {
    'Studio': 35 + Math.random() * 15,
    '1BR': 65 + Math.random() * 25,
    '2BR': 100 + Math.random() * 35,
    '3BR': 150 + Math.random() * 50,
    '4BR': 220 + Math.random() * 80,
    '5BR+': 350 + Math.random() * 150,
  };
  return areas[room] || 110;
}

// ---- Public API ----

export function getTransactions(filters: {
  area?: string;
  building?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  ensureSampleData();

  let where = '1=1';
  const params: any[] = [];

  if (filters.area) { where += ' AND area = ?'; params.push(filters.area); }
  if (filters.building) { where += ' AND building = ?'; params.push(filters.building); }
  if (filters.type) { where += ' AND property_type = ?'; params.push(filters.type); }
  if (filters.dateFrom) { where += ' AND transaction_date >= ?'; params.push(filters.dateFrom); }
  if (filters.dateTo) { where += ' AND transaction_date <= ?'; params.push(filters.dateTo); }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const rows = db.prepare(`SELECT * FROM adrec_transactions WHERE ${where} ORDER BY transaction_date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) as c FROM adrec_transactions WHERE ${where}`).get(...params) as any).c;

  return { transactions: rows, total, limit, offset };
}

export function getAreas() {
  ensureSampleData();
  return db.prepare(`
    SELECT area,
      COUNT(*) as transaction_count,
      ROUND(AVG(meter_sale_price)) as avg_price_sqm,
      ROUND(AVG(actual_worth)) as avg_price,
      MIN(transaction_date) as earliest,
      MAX(transaction_date) as latest
    FROM adrec_transactions
    GROUP BY area
    ORDER BY transaction_count DESC
  `).all();
}

export function getAreaTrends(area: string) {
  ensureSampleData();
  return db.prepare(`
    SELECT
      strftime('%Y-%m', transaction_date) as month,
      COUNT(*) as count,
      ROUND(AVG(meter_sale_price)) as avg_price_sqm,
      ROUND(AVG(actual_worth)) as avg_price,
      ROUND(MIN(actual_worth)) as min_price,
      ROUND(MAX(actual_worth)) as max_price
    FROM adrec_transactions
    WHERE area = ?
    GROUP BY strftime('%Y-%m', transaction_date)
    ORDER BY month
  `).all(area);
}

export function searchAreasAndBuildings(query: string) {
  ensureSampleData();
  const q = `%${query}%`;
  const areas = db.prepare(`SELECT DISTINCT area FROM adrec_transactions WHERE area LIKE ? LIMIT 10`).all(q);
  const buildings = db.prepare(`SELECT DISTINCT building, area FROM adrec_transactions WHERE building LIKE ? LIMIT 10`).all(q);
  return { areas, buildings };
}

// Market summary stats based on ADREC 2025 report
export function getMarketSummary() {
  ensureSampleData();
  return {
    total_transaction_value: 142_000_000_000,
    total_transaction_value_change: 44,
    residential_sales: 76_000_000_000,
    residential_sales_change: 67,
    foreign_investment_share: 69,
    apartment_price_change: 19,
    villa_price_change: 13,
    apartment_rental_change: 16,
    villa_rental_yield: 14,
    total_residential_inventory: 401_000,
    retail_occupancy: 94,
    office_occupancy: 96,
    cash_transactions_pct: 87,
    year: 2025,
  };
}
