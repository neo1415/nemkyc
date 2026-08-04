import ExcelJS from 'exceljs';

const MAX_EXCEL_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXCEL_ROWS = 10_000;
const MAX_EXCEL_COLUMNS = 200;

function normalizeCellValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if ('result' in value) return value.result ?? '';
  if ('richText' in value) return value.richText.map(part => part.text).join('');
  if ('text' in value) return value.text;
  return String(value);
}

export async function parseExcelRecords(input: ArrayBuffer): Promise<Record<string, unknown>[]> {
  if (input.byteLength > MAX_EXCEL_FILE_BYTES) {
    throw new Error('Excel file is too large. The maximum supported size is 10 MB.');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Excel file contains no sheets');
  if (worksheet.rowCount < 2) throw new Error('Excel file contains no data');
  if (worksheet.rowCount > MAX_EXCEL_ROWS + 1) {
    throw new Error(`Excel file contains too many rows. The maximum is ${MAX_EXCEL_ROWS}.`);
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  const seenHeaders = new Set<string>();
  const columnCount = Math.min(headerRow.cellCount, worksheet.columnCount);
  if (columnCount > MAX_EXCEL_COLUMNS) {
    throw new Error(`Excel file contains too many columns. The maximum is ${MAX_EXCEL_COLUMNS}.`);
  }

  for (let column = 1; column <= columnCount; column += 1) {
    const header = String(normalizeCellValue(headerRow.getCell(column).value)).trim();
    if (!header) throw new Error(`Excel header in column ${column} is empty.`);
    if (seenHeaders.has(header.toLowerCase())) throw new Error(`Excel contains a duplicate header: ${header}`);
    seenHeaders.add(header.toLowerCase());
    headers.push(header);
  }

  const records: Record<string, unknown>[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      const value = normalizeCellValue(row.getCell(index + 1).value);
      if (value !== '') hasValue = true;
      record[header] = value;
    });
    if (hasValue) records.push(record);
  }

  if (records.length === 0) throw new Error('Excel file contains no data');
  return records;
}

export async function createExcelTemplateBuffer(headers: string[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template');
  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns = headers.map(header => ({ width: Math.max(14, header.length + 2) }));
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
