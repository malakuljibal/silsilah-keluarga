'use client';

import React, { useMemo } from 'react';
import { Person } from '@/types/family';
import { Heart, Users, ChevronDown, Bookmark, ArrowRight, UserCheck } from 'lucide-react';

interface FamilyTreeGraphProps {
  members: Person[];
  onSelectMember: (m: Person) => void;
  selectedMemberId?: string;
}

interface FamilyPool {
  id: string; // misal clan atau key keluarga
  name: string;
  clan: string;
  members: Person[];
  couples: {
    husband: Person;
    wife?: Person;
    isWifeExternal?: boolean;
    children: Person[];
  }[];
  singles: Person[];
}

export default function FamilyTreeGraph({ members, onSelectMember, selectedMemberId }: FamilyTreeGraphProps) {
  // Hitung kedalaman generasi fleksibel 1 s.d 9
  // Memprioritaskan penentuan generasi: jika ada m.generation disesuaikan, jika tidak hitung dari relasi parents
  const memberLevelMap = useMemo(() => {
    const map = new Map<string, number>();
    const memberMap = new Map<string, Person>(members.map((m) => [m.id, m]));

    // Helper rekursif
    const getLevel = (person: Person, visited = new Set<string>()): number => {
      if (visited.has(person.id)) return person.generation || 1;
      visited.add(person.id);

      // Jika person secara eksplisit sudah diset generation-nya
      if (person.generation && person.generation >= 1 && person.generation <= 9) {
        return person.generation;
      }

      // Jika tidak punya orang tua di database
      if (!person.parents || person.parents.length === 0) {
        // Cek pasangan apakah punya relasi orang tua
        if (person.spouseId && !visited.has(person.spouseId)) {
          const spouse = memberMap.get(person.spouseId);
          if (spouse && spouse.generation) return spouse.generation;
          if (spouse && spouse.parents && spouse.parents.length > 0) {
            return getLevel(spouse, visited);
          }
        }
        return 1;
      }

      let maxParentLevel = 0;
      for (const pId of person.parents) {
        const parent = memberMap.get(pId);
        if (parent) {
          const parentLvl = getLevel(parent, visited);
          if (parentLvl > maxParentLevel) {
            maxParentLevel = parentLvl;
          }
        } else {
          maxParentLevel = Math.max(maxParentLevel, 1);
        }
      }

      const calculated = maxParentLevel + 1;
      return Math.min(Math.max(calculated, 1), 9);
    };

    for (const m of members) {
      map.set(m.id, getLevel(m));
    }

    // Pastikan pasangan berada di level yang sama
    for (const m of members) {
      if (m.spouseId) {
        const spouse = memberMap.get(m.spouseId);
        if (spouse) {
          const lvlM = map.get(m.id) || 1;
          const lvlS = map.get(spouse.id) || 1;
          const commonLvl = Math.max(lvlM, lvlS);
          map.set(m.id, commonLvl);
          map.set(spouse.id, commonLvl);
        }
      }
    }

    return map;
  }, [members]);

  // Kelompokkan data per Level Generasi (1 s.d 9)
  // Di dalam setiap level, pecah ke dalam Kolam-Kolam Keluarga (Family Pools) berdasarkan Marga/Patriarki
  const generationData = useMemo(() => {
    const memberMap = new Map<string, Person>(members.map((m) => [m.id, m]));
    const genGroups = new Map<number, Person[]>();

    for (const m of members) {
      const lvl = memberLevelMap.get(m.id) || 1;
      if (!genGroups.has(lvl)) {
        genGroups.set(lvl, []);
      }
      genGroups.get(lvl)!.push(m);
    }

    const sortedLevels = Array.from(genGroups.keys()).sort((a, b) => a - b);

    return sortedLevels.map((lvl) => {
      const currentGenMembers = genGroups.get(lvl) || [];

      // Kelompokkan anggota di generasi ini berdasarkan Marga (Patriarki)
      const clanMap = new Map<string, Person[]>();
      currentGenMembers.forEach((m) => {
        const clanName = m.clan?.trim() || 'Keluarga';
        if (!clanMap.has(clanName)) {
          clanMap.set(clanName, []);
        }
        clanMap.get(clanName)!.push(m);
      });

      // Bentuk pools terstruktur
      const pools = Array.from(clanMap.entries()).map(([clanName, clanMembers]) => {
        // Cari unit keluarga (pasangan bapak-ibu dan keturunan)
        const processedMemberIds = new Set<string>();
        const familyUnits: {
          father: Person;
          mother?: Person;
          isMotherExternal?: boolean;
          motherOriginalClan?: string;
          childMembers: Person[];
        }[] = [];

        // Pertama, prioritaskan laki-laki sebagai kepala keluarga (patriarki)
        clanMembers
          .filter((m) => m.gender === 'male' && m.spouseId)
          .forEach((father) => {
            let mother: Person | undefined = undefined;
            let isMotherExternal = false;
            let motherOriginalClan = '';

            if (father.spouseId) {
              const spouseObj = memberMap.get(father.spouseId);
              if (spouseObj) {
                mother = spouseObj;
                if (spouseObj.clan && spouseObj.clan.trim() !== clanName) {
                  isMotherExternal = true;
                  motherOriginalClan = spouseObj.clan.trim();
                }
              }
            }

            // Cari anak-anak dari bapak ini (yang ada di generasi berikutnya)
            const childrenIds = father.children || [];
            const childMembers = childrenIds
              .map((cId) => memberMap.get(cId))
              .filter(Boolean) as Person[];

            processedMemberIds.add(father.id);
            if (mother && !isMotherExternal) {
              processedMemberIds.add(mother.id);
            }

            familyUnits.push({
              father,
              mother,
              isMotherExternal,
              motherOriginalClan,
              childMembers,
            });
          });

        // Sisa anggota di marga ini yang belum masuk pasangan suami di atas
        const remainingMembers = clanMembers.filter((m) => !processedMemberIds.has(m.id));

        return {
          clanName,
          clanMembers,
          familyUnits,
          remainingMembers,
        };
      });

      return {
        level: lvl,
        pools,
      };
    });
  }, [members, memberLevelMap]);

  const getGenerationTitle = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Generasi 1 (Leluhur / Pendiri Garis Keturunan)';
      case 2:
        return 'Generasi 2 (Bapak / Ibu / Orang Tua Tertua)';
      case 3:
        return 'Generasi 3 (Anak & Menantu)';
      case 4:
        return 'Generasi 4 (Cucu)';
      case 5:
        return 'Generasi 5 (Cicit)';
      case 6:
        return 'Generasi 6 (Piut / Keturunan Keenam)';
      case 7:
        return 'Generasi 7 (Keturunan Ketujuh)';
      case 8:
        return 'Generasi 8 (Keturunan Kedelapan)';
      case 9:
        return 'Generasi 9 (Keturunan Kesembilan)';
      default:
        return `Generasi ${lvl}`;
    }
  };

  const renderCard = (
    person: Person,
    options?: {
      isExternalSpouse?: boolean;
      originalClan?: string;
      customRoleLabel?: string;
    }
  ) => {
    const isSelected = person.id === selectedMemberId;
    const isExternal = options?.isExternalSpouse;

    return (
      <div
        key={`${person.id}-${isExternal ? 'ext' : 'orig'}`}
        onClick={() => onSelectMember(person)}
        className={`group cursor-pointer relative flex flex-col p-3 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 ${
          isExternal
            ? 'bg-amber-50/70 border-dashed border-amber-300 hover:border-amber-400'
            : isSelected
            ? 'bg-emerald-50/95 border-emerald-500 shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/30'
            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
        }`}
        style={{ width: '220px' }}
      >
        {/* Badge jika pasangan dari keluarga/marga lain */}
        {isExternal && (
          <div className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-extrabold shadow-xs flex items-center gap-1">
            <span>Dipersunting dr Fam {options?.originalClan || 'Lain'}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <img
              src={person.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${person.id}`}
              alt={person.fullName}
              className={`w-10 h-10 rounded-xl object-cover ring-2 transition ${
                isExternal ? 'ring-amber-200' : 'ring-slate-100 group-hover:ring-emerald-400'
              }`}
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold border-2 border-white ${
                person.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
              }`}
            >
              {person.gender === 'male' ? '♂' : '♀'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[12px] font-bold text-slate-800 truncate group-hover:text-emerald-700 transition">
              {person.fullName}
            </h4>
            <p className="text-[10px] text-slate-500 truncate">
              {person.callName ? `"${person.callName}"` : person.occupation || 'Warga Desa'}
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <span>{person.birthYear || '-'}</span>
              {person.deathYear && <span>– {person.deathYear}</span>}
              {person.clan && (
                <span className="font-semibold text-slate-500">• {person.clan}</span>
              )}
            </div>
          </div>
        </div>

        {options?.customRoleLabel && (
          <div className="mt-2 pt-1.5 border-t border-slate-100/80 text-[9px] text-slate-500 flex items-center gap-1">
            <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
            <span className="font-medium truncate">{options.customRoleLabel}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-12 pt-4">
      <div className="min-w-[960px] flex flex-col gap-10">
        {/* Catatan Panduan Patriarki & Relasi */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>
              <strong>Sistem Silsilah Desa Lungkap:</strong> Kolam bertingkat 9 generasi dengan pemisahan tegas bapak & keturunan, serta penyambungan garis marga pasangan.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white border border-slate-300" /> Garis Fam Asli
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Dipersunting dr Fam Lain
            </span>
          </div>
        </div>

        {generationData.map((gen, idx) => {
          const isFirst = idx === 0;

          return (
            <React.Fragment key={gen.level}>
              {/* Konektor Aliran Vertikal Antar Generasi */}
              {!isFirst && (
                <div className="flex flex-col items-center -my-5 z-10">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <div className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <ChevronDown className="w-3 h-3" />
                    <span>Melahirkan Generasi {gen.level}</span>
                  </div>
                  <div className="w-0.5 h-4 bg-emerald-600" />
                </div>
              )}

              {/* Wadah Generasi */}
              <div className="w-full rounded-3xl p-6 border border-slate-200/80 bg-slate-50/50 shadow-sm flex flex-col gap-6">
                {/* Header Tingkat Generasi */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {gen.level}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        {getGenerationTitle(gen.level)}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pemisahan kolam keluarga dan pasangan berdasarkan relasi patriarki Desa Lungkap
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                    {gen.pools.reduce((acc, p) => acc + p.clanMembers.length, 0)} Kerabat
                  </span>
                </div>

                {/* Grid Kolam Keluarga Berdasarkan Marga / Rumpun */}
                <div className="flex flex-col gap-6">
                  {gen.pools.map((pool) => (
                    <div
                      key={pool.clanName}
                      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col gap-4"
                    >
                      {/* Sub-Header Kolam Marga */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-xs text-slate-800">
                            Kolam Keluarga: Marga {pool.clanName}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {pool.clanMembers.length} Orang
                        </span>
                      </div>

                      {/* Tampilan Pasangan & Sambungan ke Kolam Baru */}
                      <div className="flex flex-wrap items-start gap-6">
                        {/* Unit Keluarga Pasangan (Suami + Istri) */}
                        {pool.familyUnits.map((unit) => (
                          <div
                            key={unit.father.id}
                            className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3 shadow-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pb-1.5 border-b border-slate-200/60">
                              <span>Kepala Keluarga & Istri</span>
                              {unit.childMembers.length > 0 && (
                                <span className="text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                                  {unit.childMembers.length} Anak
                                </span>
                              )}
                            </div>

                            {/* Kartu Suami & Istri Berdampingan */}
                            <div className="flex items-center gap-3">
                              {/* Suami (Patriarki Marga) */}
                              {renderCard(unit.father, {
                                customRoleLabel: `Bapak / Suami (Fam ${pool.clanName})`,
                              })}

                              {/* Simbol Pernikahan */}
                              {unit.mother && (
                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shadow-xs">
                                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                                  </div>
                                  <span className="text-[8px] font-bold text-rose-400 mt-0.5">Nikah</span>
                                </div>
                              )}

                              {/* Istri (Bisa dari marga yang sama atau marga lain) */}
                              {unit.mother &&
                                renderCard(unit.mother, {
                                  isExternalSpouse: unit.isMotherExternal,
                                  originalClan: unit.motherOriginalClan,
                                  customRoleLabel: unit.isMotherExternal
                                    ? `Istri (Berasal dr Fam ${unit.motherOriginalClan})`
                                    : `Istri (Fam ${pool.clanName})`,
                                })}
                            </div>

                            {/* Petunjuk Anak di Kolam Generasi Berikutnya */}
                            {unit.childMembers.length > 0 && (
                              <div className="mt-1 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                                <span className="flex items-center gap-1 font-medium">
                                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                                  Melahirkan di Kolam Gen {gen.level + 1}:
                                </span>
                                <span className="font-semibold text-emerald-800">
                                  {unit.childMembers.map((c) => c.callName || c.fullName).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Anggota Lain / Belum Menikah di Marga ini */}
                        {pool.remainingMembers.map((person) => (
                          <div key={person.id} className="flex flex-col gap-1">
                            {renderCard(person, {
                              customRoleLabel: person.gender === 'male' ? 'Laki-laki' : 'Perempuan',
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}