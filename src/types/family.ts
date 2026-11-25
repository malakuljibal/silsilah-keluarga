export interface Person {
  id: string;
  fullName: string;
  callName: string;
  clan?: string; // Marga / Rumpun Fam (Tombo, Lungkap, dll)
  dusun?: string; // Dusun 1, Dusun 2, RT/RW
  nik?: string; // NIK / No. KTP (opsional arsip desa)
  gender: 'male' | 'female';
  birthYear: number;
  deathYear?: number | null;
  photo?: string;
  occupation?: string;
  address?: string;
  bio?: string;
  phone?: string;
  generation?: number; // 1 s.d 9 fleksibel
  parents: string[];
  spouseId?: string | null;
  children: string[];
  updatedAt?: string;
}
