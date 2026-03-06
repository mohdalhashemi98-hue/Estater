import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const ANALYSIS_PROMPT = `You are a real estate contract analyst. Analyze the following rental/lease contract and extract structured information.

Return your analysis as a JSON object with this exact structure:
{
  "extracted_start_date": "YYYY-MM-DD or null if not found",
  "extracted_end_date": "YYYY-MM-DD or null if not found",
  "extracted_payment_due": ["description of when payments are due"],
  "key_terms": [
    {"term": "term name", "description": "brief description", "importance": "high|medium|low"}
  ],
  "obligations": [
    {"party": "landlord|tenant", "obligation": "description", "deadline": "date or null"}
  ],
  "summary": "2-3 paragraph summary of the contract's key points",
  "milestones": [
    {"date": "YYYY-MM-DD", "description": "what happens on this date"}
  ]
}

Focus on:
1. Lease start and end dates
2. Rent amount and payment schedule/due dates
3. Security deposit terms
4. Maintenance responsibilities
5. Termination clauses and penalties
6. Renewal terms and conditions
7. Any unusual or notable clauses
8. Key deadlines and milestones

Return ONLY valid JSON, no markdown formatting.`;

export interface ContractAnalysisResult {
  extracted_start_date: string | null;
  extracted_end_date: string | null;
  extracted_payment_due: string[];
  key_terms: Array<{
    term: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  obligations: Array<{
    party: 'landlord' | 'tenant';
    obligation: string;
    deadline?: string;
  }>;
  summary: string;
  milestones: Array<{
    date: string;
    description: string;
  }>;
}

function parseAnalysisResponse(response: Anthropic.Message): ContractAnalysisResult {
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as ContractAnalysisResult;
  } catch {
    // Try to extract partial results
    return {
      extracted_start_date: null,
      extracted_end_date: null,
      extracted_payment_due: [],
      key_terms: [],
      obligations: [],
      summary: textBlock.text,
      milestones: [],
    };
  }
}

const CREATION_PROMPT = `You are a real estate contract analyst for UAE properties. Analyze the following rental/lease contract and extract ALL information needed to create a new contract record.

Return your analysis as a JSON object with this exact structure:
{
  "tenant": {
    "first_name": "string",
    "last_name": "string",
    "email": "string or null",
    "phone": "string",
    "id_number": "Emirates ID or passport number or null",
    "company_name": "string or null"
  },
  "property": {
    "name": "property/building name",
    "type": "villa|apartment|townhouse|penthouse|studio|duplex|commercial|warehouse|office|retail|land|mixed_use|building|standalone",
    "emirate": "Dubai|Abu Dhabi|Sharjah|Ajman|Umm Al Quwain|Ras Al Khaimah|Fujairah",
    "city": "city/area name or null",
    "neighborhood": "neighborhood or null",
    "street": "street name or null",
    "villa_number": "villa/building number or null"
  },
  "unit": {
    "unit_number": "unit/apartment number (use '1' if not specified)",
    "floor": "floor number or null",
    "bedrooms": "number or null",
    "bathrooms": "number or null",
    "area_sqm": "number or null"
  },
  "contract": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "rent_amount": "number (per payment period)",
    "payment_frequency": "monthly|quarterly|semi_annual|annual",
    "total_payments": "number of payments/cheques",
    "deposit_amount": "number or null",
    "notes": "any important notes"
  },
  "summary": "Brief 1-2 sentence summary of the contract"
}

Important:
- For UAE, the emirate should be one of the 7 UAE emirates
- Rent amount should be per payment period (not total)
- If total annual rent is given, divide by the payment frequency
- Default to "Dubai" if emirate is unclear
- Default to "monthly" if payment frequency is unclear
- Extract cheque numbers/counts if mentioned as total_payments

Return ONLY valid JSON, no markdown formatting.`;

export interface ContractCreationResult {
  tenant: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    id_number: string | null;
    company_name: string | null;
  };
  property: {
    name: string;
    type: string;
    emirate: string;
    city: string | null;
    neighborhood: string | null;
    street: string | null;
    villa_number: string | null;
  };
  unit: {
    unit_number: string;
    floor: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqm: number | null;
  };
  contract: {
    start_date: string;
    end_date: string;
    rent_amount: number;
    payment_frequency: string;
    total_payments: number;
    deposit_amount: number | null;
    notes: string | null;
  };
  summary: string;
}

function parseCreationResponse(response: Anthropic.Message): ContractCreationResult {
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr) as ContractCreationResult;
}

export async function analyzeContractForCreation(filePath: string, mimeType: string): Promise<ContractCreationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic();

  if (mimeType.startsWith('image/')) {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: CREATION_PROMPT },
        ],
      }],
    });

    return parseCreationResponse(response);
  }

  let content: string;
  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    content = pdfData.text;
  } else {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `${CREATION_PROMPT}\n\n--- CONTRACT TEXT ---\n${content.slice(0, 100000)}`,
    }],
  });

  return parseCreationResponse(response);
}

export async function analyzeContractFile(filePath: string, mimeType: string): Promise<ContractAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic();

  if (mimeType.startsWith('image/')) {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT,
          },
        ],
      }],
    });

    return parseAnalysisResponse(response);
  }

  // For PDFs and text files, extract text first
  let content: string;

  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    content = pdfData.text;
  } else {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `${ANALYSIS_PROMPT}\n\n--- CONTRACT TEXT ---\n${content.slice(0, 100000)}`,
    }],
  });

  return parseAnalysisResponse(response);
}

const MORTGAGE_PROMPT = `You are a UAE mortgage document analyst. Analyze the following bank mortgage/loan document and extract all loan details.

Return your analysis as a JSON object with this exact structure:
{
  "lender_name": "bank name",
  "loan_amount": "number",
  "interest_rate": "number (percentage, e.g. 3.99)",
  "term_months": "number",
  "monthly_payment": "number or null",
  "loan_type": "fixed|variable|interest_only",
  "account_number": "string or null",
  "start_date": "YYYY-MM-DD or null",
  "notes": "any important terms, conditions, or notes"
}

Important:
- For UAE banks, common lenders include: Emirates NBD, ADCB, FAB, Mashreq, DIB, ENBD, RAKBank, ADIB, CBD
- Interest rates in UAE are often quoted as base rate + margin
- Term is typically 25 years (300 months) for residential
- Extract the actual monthly EMI/payment if stated
- If the document shows annual percentage, convert to the rate format
- Look for processing fees, early settlement fees, and insurance requirements in notes

Return ONLY valid JSON, no markdown formatting.`;

export interface MortgageAnalysisResult {
  lender_name: string;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number | null;
  loan_type: 'fixed' | 'variable' | 'interest_only';
  account_number: string | null;
  start_date: string | null;
  notes: string;
}

function parseMortgageResponse(response: Anthropic.Message): MortgageAnalysisResult {
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr) as MortgageAnalysisResult;
}

export async function analyzeMortgageDocument(filePath: string, mimeType: string): Promise<MortgageAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic();

  if (mimeType.startsWith('image/')) {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: MORTGAGE_PROMPT },
        ],
      }],
    });

    return parseMortgageResponse(response);
  }

  let content: string;
  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    content = pdfData.text;
  } else {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `${MORTGAGE_PROMPT}\n\n--- MORTGAGE DOCUMENT TEXT ---\n${content.slice(0, 100000)}`,
    }],
  });

  return parseMortgageResponse(response);
}
