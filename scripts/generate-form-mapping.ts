// scripts/generate-form-mapping.ts

import fs from 'fs';
import path from 'path';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'email' | 'url' | 'array' | 'object' | 'boolean' | 'number' | 'currency' | 'textarea' | 'file';
  editable?: boolean;
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

interface FormSection {
  title: string;
  fields: FormField[];
}

interface FormMapping {
  [formType: string]: {
    title: string;
    sections: FormSection[];
  };
}

const PAGES_DIR = path.join(__dirname, '../src/pages');
const FORM_DIRECTORIES = ['cdd', 'claims', 'kyc'];
const OUTPUT_FILE = path.join(__dirname, '../src/generated/form-mapping.generated.ts');

function getAllFormFiles(): string[] {
  const files: string[] = [];
  for (const dir of FORM_DIRECTORIES) {
    const fullDir = path.join(PAGES_DIR, dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const file of fs.readdirSync(fullDir)) {
      if (file.endsWith('.tsx')) files.push(path.join(fullDir, file));
    }
  }
  return files;
}

function extractFieldKeys(source: string): string[] {
  const regex = /register\(['"]([\w.\[\]]+)['"]\)/g;
  const keys = new Set<string>();
  let match;
  while ((match = regex.exec(source)) !== null) {
    const raw = match[1];
    const topKey = raw.split('.')[0];
    keys.add(topKey);
  }
  return Array.from(keys);
}

function extractUploadedFiles(source: string): string[] {
  const regex = /uploadedFiles\[['"]([\w]+)['"]\]/g;
  const keys = new Set<string>();
  let match;
  while ((match = regex.exec(source)) !== null) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

function inferFieldType(key: string): FormField['type'] {
  if (key === 'agreeToDataPrivacy') return 'boolean';
  if (key === 'directors') return 'array';
  if (key === 'signature') return 'text';
  if (key.includes('date')) return 'date';
  if (key.includes('email')) return 'email';
  if (key.includes('url') || key.includes('website')) return 'url';
  if (key.includes('description') || key.includes('address') || key.includes('details')) return 'textarea';
  if (key.includes('certificate') || key === 'identification') return 'file';
  return 'text';
}

function humanize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
}

function generateFormMapping(formFilePath: string): { formType: string; form: { title: string; sections: FormSection[] } } {
  const source = fs.readFileSync(formFilePath, 'utf-8');
  const fieldKeys = extractFieldKeys(source);
  const fileKeys = extractUploadedFiles(source);

  const allKeys = new Set([...fieldKeys, ...fileKeys]);
  const formType = path.basename(formFilePath).replace('.tsx', '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const title = humanize(path.basename(formFilePath).replace('.tsx', ''));

  const fields: FormField[] = Array.from(allKeys).map(key => ({
    key,
    label: humanize(key),
    type: fileKeys.includes(key) ? 'file' : inferFieldType(key),
    editable: true // default editable unless you want custom logic here
  }));

  const sections: FormSection[] = [
    {
      title: 'General Information',
      fields
    }
  ];

  return { formType, form: { title, sections } };
}

function run(): void {
  const files = getAllFormFiles();
  const mappings = files.map(generateFormMapping);

  const content = `// AUTO-GENERATED FILE: DO NOT EDIT MANUALLY

export const FORM_MAPPINGS = {
${mappings.map(({ formType, form }) => {
    return `  '${formType}': ${JSON.stringify(form, null, 2)},`;
  }).join('\n')}
} as const;
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log('✅ Form mappings generated to:', OUTPUT_FILE);
}

run();