export interface Person {
  id: string;
  fullName: string;
  callName: string;
  clan?: string; // Marga / Rumpun Fam
  gender: 'male' | 'female';
  birthYear: number;
  deathYear?: number | null;
  photo?: string;
  occupation?: string;
  address?: string;
  bio?: string;
  phone?: string;
  generation?: number;
  parents: string[];
  spouseId?: string | null;
  children: string[];
}
