import db from '../db/connection.js';

// Check if we have sample data, seed if not
function ensureSampleData() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM dld_transactions').get() as any).c;
  if (count > 0) return;
  seedSampleTransactions();
}

function seedSampleTransactions() {
  const areas = [
    { area: 'Dubai Marina', buildings: ['Marina Gate', 'Cayan Tower', 'Princess Tower', 'The Torch', 'Damac Heights', 'Marina Promenade', 'Sulafa Tower', 'Elite Residence'] },
    { area: 'Downtown Dubai', buildings: ['Burj Khalifa', 'The Address Downtown', 'Boulevard Point', 'Vida Residences', 'The Lofts', 'Claren Tower', 'Act One Act Two', 'Opera Grand'] },
    { area: 'Palm Jumeirah', buildings: ['Atlantis The Royal Residences', 'One Palm', 'Shoreline Apartments', 'Golden Mile', 'Palm Views', 'Tiara Residences', 'Fairmont Residences', 'Oceana'] },
    { area: 'Business Bay', buildings: ['Executive Towers', 'The Opus', 'Damac Towers', 'Marasi Business Bay', 'Bay Square', 'Capital Bay', 'Noora Tower', 'The Sterling'] },
    { area: 'JBR', buildings: ['Sadaf', 'Bahar', 'Murjan', 'Shams', 'Rimal', 'Amwaj'] },
    { area: 'JLT', buildings: ['Lake Point Tower', 'Jumeirah Bay X1', 'Armada Tower', 'Mazaya Business Avenue', 'Green Lakes', 'Lake View Tower', 'Bonnington Tower', 'Goldcrest Views'] },
    { area: 'Dubai Hills', buildings: ['Park Heights', 'Golf Place', 'Collective', 'Elora', 'Golfville', 'Acacia'] },
    { area: 'Arabian Ranches', buildings: ['Saheel', 'Palmera', 'Savannah', 'Mirador', 'Alma', 'Aseel'] },
    { area: 'DIFC', buildings: ['Index Tower', 'Sky Gardens', 'Limestone House', 'Central Park', 'Duja Tower'] },
    { area: 'Dubai Creek Harbour', buildings: ['Creek Rise', 'Harbour Gate', 'Creek Edge', 'Palace Residences', 'Vida Creek Harbour'] },
  ];

  const types = ['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail'];
  const regTypes = ['Sale', 'Resale', 'Gift', 'Mortgage'];
  const rooms = ['Studio', '1BR', '2BR', '3BR', '4BR', '5BR+'];

  const insert = db.prepare(`
    INSERT INTO dld_transactions (transaction_id, area, building, project, property_type, property_sub_type, reg_type, rooms, actual_worth, meter_sale_price, area_sqm, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = db.transaction(() => {
    let txId = 1;
    for (const { area, buildings } of areas) {
      // Base price per sqm varies by area
      const basePricePerSqm = getBasePrice(area);

      for (const building of buildings) {
        // Generate 5-8 transactions per building over last 2 years
        const numTx = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numTx; i++) {
          const daysAgo = Math.floor(Math.random() * 730);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          const dateStr = date.toISOString().split('T')[0];

          const propType = types[Math.floor(Math.random() * 3)]; // weight toward residential
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          const areaSqm = getAreaForRoom(room);
          const priceVariation = 0.8 + Math.random() * 0.4; // +-20% variation
          const priceSqm = basePricePerSqm * priceVariation;
          const totalPrice = areaSqm * priceSqm;
          const regType = regTypes[Math.floor(Math.random() * 2)]; // weight toward Sale/Resale

          insert.run(
            `DLD-${String(txId++).padStart(8, '0')}`,
            area, building, area, propType, room,
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
  console.log('Seeded DLD sample transaction data');
}

function getBasePrice(area: string): number {
  const prices: Record<string, number> = {
    'Palm Jumeirah': 22000,
    'Downtown Dubai': 20000,
    'DIFC': 19000,
    'Dubai Marina': 16000,
    'Dubai Creek Harbour': 17000,
    'JBR': 15000,
    'Business Bay': 14000,
    'Dubai Hills': 13000,
    'JLT': 11000,
    'Arabian Ranches': 10000,
  };
  return prices[area] || 12000;
}

function getAreaForRoom(room: string): number {
  const areas: Record<string, number> = {
    'Studio': 35 + Math.random() * 15,
    '1BR': 60 + Math.random() * 20,
    '2BR': 95 + Math.random() * 30,
    '3BR': 140 + Math.random() * 40,
    '4BR': 200 + Math.random() * 60,
    '5BR+': 300 + Math.random() * 100,
  };
  return areas[room] || 100;
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

  const rows = db.prepare(`SELECT * FROM dld_transactions WHERE ${where} ORDER BY transaction_date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) as c FROM dld_transactions WHERE ${where}`).get(...params) as any).c;

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
    FROM dld_transactions
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
    FROM dld_transactions
    WHERE area = ?
    GROUP BY strftime('%Y-%m', transaction_date)
    ORDER BY month
  `).all(area);
}

export function getBuildingComparables(building: string) {
  ensureSampleData();
  return db.prepare(`
    SELECT * FROM dld_transactions
    WHERE building = ?
    ORDER BY transaction_date DESC
    LIMIT 20
  `).all(building);
}

export function searchAreasAndBuildings(query: string) {
  ensureSampleData();
  const q = `%${query}%`;
  const areas = db.prepare(`SELECT DISTINCT area FROM dld_transactions WHERE area LIKE ? LIMIT 10`).all(q);
  const buildings = db.prepare(`SELECT DISTINCT building, area FROM dld_transactions WHERE building LIKE ? LIMIT 10`).all(q);
  return { areas, buildings };
}

export function autoMatchProperty(propertyId: number) {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
  if (!property) throw new Error('Property not found');

  // Try to match by name similarity
  const searchTerms = [property.name, property.neighborhood, property.city].filter(Boolean);
  let bestMatch: any = null;

  for (const term of searchTerms) {
    if (!term) continue;
    const results = db.prepare(`
      SELECT DISTINCT area, building, COUNT(*) as cnt
      FROM dld_transactions
      WHERE building LIKE ? OR area LIKE ?
      GROUP BY area, building
      ORDER BY cnt DESC
      LIMIT 1
    `).get(`%${term}%`, `%${term}%`) as any;

    if (results) {
      bestMatch = results;
      break;
    }
  }

  if (bestMatch) {
    db.prepare('UPDATE properties SET dld_area = ?, dld_building = ? WHERE id = ?')
      .run(bestMatch.area, bestMatch.building, propertyId);

    db.prepare(`
      INSERT OR REPLACE INTO property_dld_match (property_id, dld_area, dld_building, match_confidence)
      VALUES (?, ?, ?, 'auto')
    `).run(propertyId, bestMatch.area, bestMatch.building);
  }

  return bestMatch;
}

export function getEstimatedValue(propertyId: number) {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
  if (!property) throw new Error('Property not found');

  const area = property.dld_area;
  const building = property.dld_building;

  if (!area) return null;

  let where = 'area = ?';
  const params: any[] = [area];

  if (building) {
    where += ' AND building = ?';
    params.push(building);
  }

  // Get recent transactions (last 6 months)
  where += " AND transaction_date >= date('now', '-6 months')";

  const stats = db.prepare(`
    SELECT
      COUNT(*) as count,
      ROUND(AVG(meter_sale_price)) as avg_price_sqm,
      ROUND(MIN(meter_sale_price)) as min_price_sqm,
      ROUND(MAX(meter_sale_price)) as max_price_sqm,
      ROUND(AVG(area_sqm)) as avg_area
    FROM dld_transactions
    WHERE ${where}
  `).get(...params) as any;

  if (!stats || stats.count === 0) return null;

  // Get property total area from units
  const unitArea = db.prepare(`
    SELECT COALESCE(SUM(area_sqm), 0) as total_area FROM units WHERE property_id = ?
  `).get(propertyId) as any;

  const propArea = unitArea.total_area || stats.avg_area || 100;

  return {
    estimated_value: Math.round(propArea * stats.avg_price_sqm),
    price_per_sqm: stats.avg_price_sqm,
    based_on: stats.count,
    area_sqm: propArea,
    range: {
      low: Math.round(propArea * stats.min_price_sqm),
      high: Math.round(propArea * stats.max_price_sqm),
    },
    area: area,
    building: building,
  };
}
