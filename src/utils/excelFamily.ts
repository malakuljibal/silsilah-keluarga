import * as XLSX from 'xlsx';
import { Person } from '@/types/family';

export interface ExcelRow {
  ID: string;
  'Nama Lengkap': string;
  'Nama Panggilan': string;
  'Jenis Kelamin (L/P)': string;
  'Marga/Fam'?: string;
  Dusun?: string;
  NIK?: string;
  'Tahun Lahir': number | string;
  'Tahun Wafat'?: number | string;
  Generasi?: number | string;
  Pekerjaan?: string;
  No_HP?: string;
  Alamat?: string;
  'ID Ayah/Ibu (pisahkan koma)'?: string;
  'ID Pasangan'?: string;
  'ID Anak (pisahkan koma)'?: string;
  Catatan?: string;
}

export function downloadExcelTemplate() {
  const sampleData: ExcelRow[] = [
    {
      ID: 'LK-001',
      'Nama Lengkap': 'Haji Hasan Tombo',
      'Nama Panggilan': 'Hasan',
      'Jenis Kelamin (L/P)': 'L',
      'Marga/Fam': 'Tombo',
      Dusun: 'Dusun 1',
      NIK: '7108000000000001',
      'Tahun Lahir': 1945,
      'Tahun Wafat': 2015,
      Generasi: 1,
      Pekerjaan: 'Petani / Tokoh Adat',
      No_HP: '081234567890',
      Alamat: 'Desa Lungkap RT 01',
      'ID Ayah/Ibu (pisahkan koma)': '',
      'ID Pasangan': 'LK-002',
      'ID Anak (pisahkan koma)': 'LK-003, LK-004',
      Catatan: 'Perintis / Tetua Fam Tombo',
    },
    {
      ID: 'LK-002',
      'Nama Lengkap': 'Hajjah Aminah',
      'Nama Panggilan': 'Aminah',
      'Jenis Kelamin (L/P)': 'P',
      'Marga/Fam': 'Tombo',
      Dusun: 'Dusun 1',
      NIK: '7108000000000002',
      'Tahun Lahir': 1950,
      'Tahun Wafat': '',
      Generasi: 1,
      Pekerjaan: 'Ibu Rumah Tangga',
      No_HP: '',
      Alamat: 'Desa Lungkap RT 01',
      'ID Ayah/Ibu (pisahkan koma)': '',
      'ID Pasangan': 'LK-001',
      'ID Anak (pisahkan koma)': 'LK-003, LK-004',
      Catatan: 'Istri Hj. Hasan',
    },
    {
      ID: 'LK-003',
      'Nama Lengkap': 'Alfiki Tombo',
      'Nama Panggilan': 'Alfiki',
      'Jenis Kelamin (L/P)': 'L',
      'Marga/Fam': 'Tombo',
      Dusun: 'Dusun 1',
      NIK: '7108000000000003',
      'Tahun Lahir': 1975,
      'Tahun Wafat': '',
      Generasi: 2,
      Pekerjaan: 'Wiraswasta',
      No_HP: '081300000000',
      Alamat: 'Desa Lungkap Dusun 1',
      'ID Ayah/Ibu (pisahkan koma)': 'LK-001, LK-002',
      'ID Pasangan': 'LK-005',
      'ID Anak (pisahkan koma)': '',
      Catatan: '',
    },
    {
      ID: 'LK-005',
      'Nama Lengkap': 'Lin Marlina',
      'Nama Panggilan': 'Lin',
      'Jenis Kelamin (L/P)': 'P',
      'Marga/Fam': 'Lungkap',
      Dusun: 'Dusun 2',
      NIK: '7108000000000005',
      'Tahun Lahir': 1978,
      'Tahun Wafat': '',
      Generasi: 2,
      Pekerjaan: 'Guru',
      No_HP: '',
      Alamat: 'Desa Lungkap Dusun 2',
      'ID Ayah/Ibu (pisahkan koma)': '',
      'ID Pasangan': 'LK-003',
      'ID Anak (pisahkan koma)': '',
      Catatan: 'Istri Alfiki (Menikah beda rumpun/fam)',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Lebar kolom otomatis cantik
  worksheet['!cols'] = [
    { wch: 12 }, // ID
    { wch: 25 }, // Nama Lengkap
    { wch: 16 }, // Nama Panggilan
    { wch: 18 }, // Jenis Kelamin
    { wch: 16 }, // Marga
    { wch: 14 }, // Dusun
    { wch: 20 }, // NIK
    { wch: 12 }, // Thn Lahir
    { wch: 12 }, // Thn Wafat
    { wch: 10 }, // Generasi
    { wch: 20 }, // Pekerjaan
    { wch: 16 }, // No HP
    { wch: 25 }, // Alamat
    { wch: 26 }, // ID Ortu
    { wch: 14 }, // ID Pasangan
    { wch: 26 }, // ID Anak
    { wch: 25 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Warga');
  XLSX.writeFile(workbook, 'Template_Silsilah_Desa_Lungkap.xlsx');
}

export function exportFamilyToExcel(members: Person[]) {
  const rows: ExcelRow[] = members.map((m) => ({
    ID: m.id,
    'Nama Lengkap': m.fullName || '',
    'Nama Panggilan': m.callName || '',
    'Jenis Kelamin (L/P)': m.gender === 'female' ? 'P' : 'L',
    'Marga/Fam': m.clan || '',
    Dusun: m.dusun || '',
    NIK: m.nik || '',
    'Tahun Lahir': m.birthYear || '',
    'Tahun Wafat': m.deathYear || '',
    Generasi: m.generation || '',
    Pekerjaan: m.occupation || '',
    No_HP: m.phone || '',
    Alamat: m.address || '',
    'ID Ayah/Ibu (pisahkan koma)': (m.parents || []).join(', '),
    'ID Pasangan': m.spouseId || '',
    'ID Anak (pisahkan koma)': (m.children || []).join(', '),
    Catatan: m.bio || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Silsilah Warga');
  XLSX.writeFile(workbook, `Silsilah_Desa_Lungkap_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function parseExcelToMembers(file: File): Promise<Person[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

  const parsedMembers: Person[] = [];

  for (const row of rawRows) {
    const id = String(row['ID'] || row['id'] || '').trim();
    const fullName = String(row['Nama Lengkap'] || row['nama'] || row['fullName'] || '').trim();
    if (!id || !fullName) continue;

    const rawGender = String(row['Jenis Kelamin (L/P)'] || row['gender'] || '').toUpperCase();
    const gender: 'male' | 'female' = rawGender.startsWith('P') ? 'female' : 'male';

    const parseList = (val: any): string[] => {
      if (!val) return [];
      return String(val)
        .split(/[,;\/]/)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const birthYear = parseInt(row['Tahun Lahir'] || row['birthYear'], 10) || 1990;
    const deathYearVal = row['Tahun Wafat'] || row['deathYear'];
    const deathYear = deathYearVal ? parseInt(deathYearVal, 10) : null;
    const genVal = row['Generasi'] || row['generation'];
    const generation = genVal ? parseInt(genVal, 10) : undefined;

    const person: Person = {
      id,
      fullName,
      callName: String(row['Nama Panggilan'] || row['callName'] || fullName.split(' ')[0] || id).trim(),
      clan: row['Marga/Fam'] || row['clan'] ? String(row['Marga/Fam'] || row['clan']).trim() : undefined,
      dusun: row['Dusun'] || row['dusun'] ? String(row['Dusun'] || row['dusun']).trim() : undefined,
      nik: row['NIK'] || row['nik'] ? String(row['NIK'] || row['nik']).trim() : undefined,
      gender,
      birthYear,
      deathYear,
      generation,
      occupation: row['Pekerjaan'] || row['occupation'] ? String(row['Pekerjaan'] || row['occupation']).trim() : undefined,
      phone: row['No_HP'] || row['phone'] ? String(row['No_HP'] || row['phone']).trim() : undefined,
      address: row['Alamat'] || row['address'] ? String(row['Alamat'] || row['address']).trim() : undefined,
      bio: row['Catatan'] || row['bio'] ? String(row['Catatan'] || row['bio']).trim() : undefined,
      parents: parseList(row['ID Ayah/Ibu (pisahkan koma)'] || row['parents']),
      spouseId: row['ID Pasangan'] || row['spouseId'] ? String(row['ID Pasangan'] || row['spouseId']).trim() : null,
      children: parseList(row['ID Anak (pisahkan koma)'] || row['children']),
      updatedAt: new Date().toISOString(),
    };

    parsedMembers.push(person);
  }

  return parsedMembers;
}
