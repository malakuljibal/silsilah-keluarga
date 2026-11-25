import { Person } from '@/types/family';

export function parseCsvToMembers(csvText: string): Person[] {
  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];

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

  // 1. Cari baris header tabel utama (yang mengandung "nama lengkap" atau "nama")
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const cols = parseLine(rawLines[i]);
    const cleaned = cols.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (
      cleaned.includes('namalengkap') ||
      (cleaned.includes('nama') &&
        (cleaned.includes('ayah') ||
          cleaned.includes('fammarga') ||
          cleaned.includes('marga') ||
          cleaned.includes('pasangan')))
    ) {
      headerIndex = i;
      headers = cleaned;
      break;
    }
  }

  // Jika tidak ditemukan baris ber-header nama, gunakan baris pertama sebagai fallback
  if (headerIndex === -1) {
    headerIndex = 0;
    headers = parseLine(rawLines[0]).map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
  }

  interface RawRow {
    rawName: string;
    callName: string;
    clan: string;
    spouseName: string;
    fatherName: string;
    motherName: string;
    childrenNames: string[];
    gender?: 'male' | 'female';
    dusun?: string;
    nik?: string;
    birthYear?: number;
    deathYear?: number | null;
    generation?: number;
    occupation?: string;
    phone?: string;
    address?: string;
    bio?: string;
    id?: string;
  }

  const rawRows: RawRow[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cols = parseLine(rawLines[i]);
    if (!cols || cols.length === 0) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });

    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rowObj[cleanK] !== undefined && rowObj[cleanK] !== '') {
          return rowObj[cleanK];
        }
      }
      return '';
    };

    const rawName = getVal('namalengkap', 'nama', 'fullname');
    if (!rawName) continue;

    const callName = getVal('namapanggilan', 'panggilan', 'callname') || rawName.split(' ')[0];
    const clan = getVal('fammarga', 'marga', 'fam', 'clan');
    const spouseName = getVal('pasangan', 'suami', 'istri', 'namapasangan');
    const fatherName = getVal('ayah', 'namaayah', 'bapak');
    const motherName = getVal('ibu', 'namaibu');
    const rawChildren = getVal('anak', 'namaanak', 'children');
    const childrenNames = rawChildren
      ? rawChildren.split(/[,;\/]/).map((s) => s.trim()).filter(Boolean)
      : [];

    const explicitId = getVal('id', 'kode');
    const explicitGender = getVal('jeniskelamin', 'gender', 'jk', 'kelamin').toUpperCase();
    let gender: 'male' | 'female' | undefined = undefined;
    if (
      explicitGender.startsWith('P') ||
      explicitGender.startsWith('F') ||
      explicitGender.includes('PEREMPUAN') ||
      explicitGender.includes('WANITA')
    ) {
      gender = 'female';
    } else if (
      explicitGender.startsWith('L') ||
      explicitGender.startsWith('M') ||
      explicitGender.includes('LAKI') ||
      explicitGender.includes('PRIA')
    ) {
      gender = 'male';
    }

    const dusun = getVal('dusun', 'lingkungan', 'rt', 'rw');
    const nik = getVal('nik', 'ktp', 'nomorinduk');
    const birthYearVal = getVal('tahunlahir', 'lahir', 'birthyear');
    const birthYear = birthYearVal ? parseInt(birthYearVal, 10) : undefined;
    const deathYearVal = getVal('tahunwafat', 'wafat', 'meninggal', 'deathyear');
    const deathYear = deathYearVal ? parseInt(deathYearVal, 10) : null;
    const genVal = getVal('generasi', 'gen', 'generation');
    const generation = genVal ? parseInt(genVal, 10) : undefined;

    const occupation = getVal('pekerjaan', 'profesi', 'occupation');
    const phone = getVal('nohp', 'hp', 'telepon', 'phone', 'wa');
    const address = getVal('alamat', 'domisili', 'address');
    const bio = getVal('catatan', 'bio', 'keterangan');

    rawRows.push({
      rawName,
      callName,
      clan,
      spouseName,
      fatherName,
      motherName,
      childrenNames,
      gender,
      dusun,
      nik,
      birthYear,
      deathYear,
      generation,
      occupation,
      phone,
      address,
      bio,
      id: explicitId,
    });
  }

  // 2. Resolve nama menjadi ID dan hubungkan relasi Ayah, Ibu, Pasangan, & Anak
  const nameToIdMap = new Map<string, string>();
  const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  rawRows.forEach((r, idx) => {
    const assignedId = r.id || `LK-${String(idx + 1).padStart(3, '0')}`;
    r.id = assignedId;
    nameToIdMap.set(slugify(r.rawName), assignedId);
    if (r.callName) {
      nameToIdMap.set(slugify(r.callName), assignedId);
    }
  });

  const members: Person[] = [];

  rawRows.forEach((r, idx) => {
    const parentsIds: string[] = [];
    if (r.fatherName) {
      const fId = nameToIdMap.get(slugify(r.fatherName));
      if (fId) parentsIds.push(fId);
    }
    if (r.motherName) {
      const mId = nameToIdMap.get(slugify(r.motherName));
      if (mId) parentsIds.push(mId);
    }

    let resolvedSpouseId: string | null = null;
    if (r.spouseName) {
      resolvedSpouseId = nameToIdMap.get(slugify(r.spouseName)) || null;
    }

    const resolvedChildrenIds: string[] = [];
    r.childrenNames.forEach((cName) => {
      const cId = nameToIdMap.get(slugify(cName));
      if (cId) resolvedChildrenIds.push(cId);
    });

    // Tebak gender jika belum terdefinisi secara eksplisit
    let finalGender: 'male' | 'female' = r.gender || 'male';
    if (!r.gender) {
      const isMother = rawRows.some((other) => slugify(other.motherName) === slugify(r.rawName));
      const femaleKeywords = ['ibu', 'siti', 'dewi', 'ratna', 'nur', 'fatimah', 'aminah', 'sari', 'ani', 'yanti'];
      if (isMother || femaleKeywords.some((w) => r.rawName.toLowerCase().includes(w))) {
        finalGender = 'female';
      }
    }

    members.push({
      id: r.id!,
      fullName: r.rawName,
      callName: r.callName,
      clan: r.clan || undefined,
      dusun: r.dusun || 'Dusun 1',
      nik: r.nik || undefined,
      gender: finalGender,
      birthYear: r.birthYear || 1960 + idx * 5,
      deathYear: r.deathYear,
      generation: r.generation || (parentsIds.length > 0 ? 2 : 1),
      occupation: r.occupation || undefined,
      phone: r.phone || undefined,
      address: r.address || 'Desa Lungkap',
      bio: r.bio || undefined,
      parents: parentsIds,
      spouseId: resolvedSpouseId,
      children: resolvedChildrenIds,
      updatedAt: new Date().toISOString(),
    });
  });

  // Cross-link relasi dua arah (Orang Tua <-> Anak & Pasangan)
  members.forEach((m) => {
    if (m.children && m.children.length > 0) {
      m.children.forEach((cId) => {
        const child = members.find((x) => x.id === cId);
        if (child && !child.parents.includes(m.id)) {
          child.parents.push(m.id);
        }
      });
    }
    if (m.parents && m.parents.length > 0) {
      m.parents.forEach((pId) => {
        const parent = members.find((x) => x.id === pId);
        if (parent && (!parent.children || !parent.children.includes(m.id))) {
          if (!parent.children) parent.children = [];
          parent.children.push(m.id);
        }
      });
    }
    if (m.spouseId) {
      const partner = members.find((x) => x.id === m.spouseId);
      if (partner && !partner.spouseId) {
        partner.spouseId = m.id;
      }
    }
  });

  return members;
}
