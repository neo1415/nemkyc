import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import ExcelJS from 'exceljs';
import {
  CORPORATE_TEMPLATE_HEADERS,
  INDIVIDUAL_TEMPLATE_HEADERS,
} from '../../utils/templateGenerator';
import { createExcelTemplateBuffer } from '../../utils/excelWorkbook';

type TemplateType = 'individual' | 'corporate';

async function readTemplate(type: TemplateType) {
  const headersForType = type === 'individual' ? INDIVIDUAL_TEMPLATE_HEADERS : CORPORATE_TEMPLATE_HEADERS;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await createExcelTemplateBuffer(headersForType) as any);
  const worksheet = workbook.worksheets[0];
  const headers = (worksheet.getRow(1).values as unknown[])
    .slice(1)
    .map(value => String(value));
  return { workbook, worksheet, headers };
}

describe('Property 21: Template Download Completeness', () => {
  it('generates the correct first-row headers for every template type', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom<TemplateType>('individual', 'corporate'),
      async type => {
        const { headers } = await readTemplate(type);
        const expected = type === 'individual'
          ? INDIVIDUAL_TEMPLATE_HEADERS
          : CORPORATE_TEMPLATE_HEADERS;
        expect(headers).toEqual(expected);
      },
    ), { numRuns: 6 });
  });

  it('includes every required Individual column', async () => {
    const { headers } = await readTemplate('individual');
    [
      'Title', 'First Name', 'Last Name', 'Phone Number', 'Email', 'Address',
      'Gender', 'Policy Number', 'BVN', 'Date of Birth', 'Occupation',
      'Nationality', 'NIN',
    ].forEach(column => expect(headers).toContain(column));
  });

  it('includes every required Corporate column', async () => {
    const { headers } = await readTemplate('corporate');
    [
      'Company Name', 'Company Address', 'Email Address', 'Company Type',
      'Phone Number', 'Policy Number', 'Registration Number',
      'Registration Date', 'Business Address', 'CAC',
    ].forEach(column => expect(headers).toContain(column));
  });

  it('creates exactly one sheet named Template', async () => {
    const { workbook } = await readTemplate('individual');
    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0].name).toBe('Template');
  });

  it('creates only the header row', async () => {
    const { worksheet } = await readTemplate('corporate');
    expect(worksheet.rowCount).toBe(1);
  });

  it('uses non-empty, unique string headers', async () => {
    const { headers } = await readTemplate('individual');
    headers.forEach(header => {
      expect(typeof header).toBe('string');
      expect(header.trim().length).toBeGreaterThan(0);
    });
    expect(new Set(headers.map(header => header.toLowerCase())).size).toBe(headers.length);
  });

  it('uses the exported header contracts', async () => {
    expect((await readTemplate('individual')).headers).toEqual(INDIVIDUAL_TEMPLATE_HEADERS);
    expect((await readTemplate('corporate')).headers).toEqual(CORPORATE_TEMPLATE_HEADERS);
  });

  it('keeps Individual and Corporate schemas distinct', async () => {
    const individual = (await readTemplate('individual')).headers;
    const corporate = (await readTemplate('corporate')).headers;
    expect(individual).not.toEqual(corporate);
    expect(individual).toContain('First Name');
    expect(corporate).toContain('Company Name');
    expect(corporate).not.toContain('First Name');
  });
});
