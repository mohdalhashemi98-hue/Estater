import * as cheerio from 'cheerio';

export async function scrapePropertyValue(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try multiple selectors for different property sites
    const selectors = [
      // Zillow
      '[data-testid="zestimate-text"]',
      'span[data-testid="zestimate"] span',
      // Redfin
      '.statsValue',
      '.HomeMainStats .stat-block .value',
      // Realtor.com
      '[data-testid="list-price"]',
      '.list-price',
      // Generic price patterns
      '.price',
      '.property-price',
      '.listing-price',
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        const value = parseFloat(text.replace(/[$,\s]/g, ''));
        if (!isNaN(value) && value > 10000) {
          return value;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
