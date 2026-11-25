import { Person } from '@/types/family';

export function parseCsvToMembers(csvText: string): Person[] {
  // Parsing CSV baris per baris dengan penanganan koma di dalam tanda kutip
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const parsedMembers: Person[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (!cols || cols.length === 0) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });

    // Cari value berdasarkan kemungkinan nama header
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rowObj[cleanK] !== undefined && rowObj[cleanK] !== '') {
          return rowObj[cleanK];
        }
      }
      return '';
    };

    const id = getVal('id', 'kode');
    const fullName = getVal('namalengkap', 'nama', 'fullname');
    if (!id || !fullName) continue;

    const callName = getVal('namapanggilan', 'panggilan', 'callname') || fullName.split(' ')[0];
    const rawGender = getVal('jeniskelamin', 'gender', 'jk', 'kelamin').toUpperCase();
    const gender: 'male' | 'female' = rawGender.startsWith('P') || rawGender.startsWith('F') || rawGender.includes('PEREMPUAN') ? 'female' : 'male';
    const clan = getVal('margafam', 'marga', 'fam', 'clan') || undefined;
    const dusun = getVal('dusun', 'lingkungan', 'rt', 'rw') || undefined;
    const nik = getVal('nik', 'ktp', 'nomorinduk') || undefined;

    const birthYear = parseInt(getVal('tahunlahir', 'lahir', 'birthyear'), 10) || 1990;
    const deathYearVal = getVal('tahunwafat', 'wafat', 'meninggal', 'deathyear');
    const deathYear = deathYearVal ? parseInt(deathYearVal, 10) : null;
    const genVal = getVal('generasi', 'gen', 'generation');
    const generation = genVal ? parseInt(genVal, 10) : undefined;

    const parseList = (val: string): string[] => {
      if (!val) return [];
      return val
        .split(/[,;\/]/)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const parents = parseList(getVal('idayahibu', 'orangtua', 'parents', 'ortu'));
    const spouseId = getVal('idpasangan', 'pasangan', 'suami', 'istri', 'spouseid') || null;
    const children = parseList(getVal('idanak', 'anak', 'children'));
    const occupation = getVal('pekerjaan', 'profesi', 'occupation') || undefined;
    const phone = getVal('nohp', 'hp', 'telepon', 'phone', 'wa') || undefined;
    const address = getVal('alamat', 'domisili', 'address') || undefined;
    const bio = getVal('catatan', 'bio', 'keterangan') || undefined;

    parsedMembers.push({
      id,
      fullName,
      callName,
      clan,
      dusun,
      nik,
      gender,
      birthYear,
      deathYear,
      generation,
      occupation,
      phone,
      address,
      bio,
      parents,
      spouseId,
      children,
      updatedAt: new Date().toISOString(),
    });
  }

  return parsedMembers;
}
