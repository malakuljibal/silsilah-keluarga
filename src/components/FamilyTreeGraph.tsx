'use client';

import React, { useMemo } from 'react';
import { Person } from '@/types/family';
import { Heart, Users, ChevronDown } from 'lucide-react';

interface FamilyTreeGraphProps {
  members: Person[];
  onSelectMember: (m: Person) => void;
  selectedMemberId?: string;
}

export default function FamilyTreeGraph({ members, onSelectMember, selectedMemberId }: FamilyTreeGraphProps) {
  // Hitung kedalaman generasi (Level 1 = Kakek/Leluhur Tertinggi, Level 2 = Anak mereka / Orang tua, Level 3 = Cucu / Anak, dst)
  const memberLevelMap = useMemo(() => {
    const map = new Map<string, number>();
    const memberMap = new Map<string, Person>(members.map((m) => [m.id, m]));

    // Helper rekursif menghitung depth berdasarkan rantai parents
    const getLevel = (person: Person, visited = new Set<string>()): number => {
      if (visited.has(person.id)) return 1;
      visited.add(person.id);

      // Jika person punya manual generation, jadikan pertimbangan awal
      if (!person.parents || person.parents.length === 0) {
        // Cek jika pasangannya punya level atau orang tua
        if (person.spouseId && !visited.has(person.spouseId)) {
          const spouse = memberMap.get(person.spouseId);
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

      return maxParentLevel + 1;
    };

    // First pass
    for (const m of members) {
      map.set(m.id, getLevel(m));
    }

    // Second pass: Pastikan pasangan suami/istri berada di level yang sama persis
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

  // Kelompokkan anggota keluarga per Level / Tingkatan Generasi
  const levels = useMemo(() => {
    const grouped = new Map<number, Person[]>();
    for (const m of members) {
      const lvl = memberLevelMap.get(m.id) || 1;
      if (!grouped.has(lvl)) {
        grouped.set(lvl, []);
      }
      grouped.get(lvl)!.push(m);
    }

    // Urutkan key level 1, 2, 3, ...
    const sortedLevelKeys = Array.from(grouped.keys()).sort((a, b) => a - b);
    return sortedLevelKeys.map((lvl) => ({
      level: lvl,
      members: grouped.get(lvl)!,
    }));
  }, [members, memberLevelMap]);

  // Helper judul tingkatan
  const getLevelLabel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Tingkat 1 — Kakek / Nenek / Tetua Pertama';
      case 2:
        return 'Tingkat 2 — Orang Tua / Bapak & Ibu (Anak dari Tingkat 1)';
      case 3:
        return 'Tingkat 3 — Anak & Saudara (Keturunan / Cucu)';
      case 4:
        return 'Tingkat 4 — Cicit / Generasi Berikutnya';
      default:
        return `Tingkat ${lvl} — Generasi Penerus`;
    }
  };

  const renderMemberCard = (member: Person) => {
    const isSelected = member.id === selectedMemberId;
    const spouse = member.spouseId ? members.find((m) => m.id === member.spouseId) : null;
    const parents = (member.parents || [])
      .map((pId) => members.find((m) => m.id === pId))
      .filter(Boolean) as Person[];

    return (
      <div
        key={member.id}
        onClick={() => onSelectMember(member)}
        className={`group cursor-pointer relative flex flex-col p-3.5 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 ${
          isSelected
            ? 'bg-emerald-50/95 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/30'
            : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-md shadow-sm'
        }`}
        style={{ width: '270px' }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={member.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`}
              alt={member.fullName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-emerald-400 transition"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white ${
                member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
              }`}
            >
              {member.gender === 'male' ? '♂' : '♀'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition">
              {member.fullName}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {member.callName ? `"${member.callName}"` : member.occupation || 'Warga Desa'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
              <span>{member.birthYear || '-'}</span>
              {member.deathYear && <span>– {member.deathYear}</span>}
            </div>
          </div>
        </div>

        {/* Info Relasi Singkat di Kartu */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[10px]">
          {parents.length > 0 && (
            <div className="flex items-center gap-1 text-slate-500 truncate">
              <span className="font-semibold text-slate-600">Anak dari:</span>
              <span className="truncate text-emerald-700 font-medium">
                {parents.map((p) => p.callName || p.fullName).join(' & ')}
              </span>
            </div>
          )}
          {spouse && (
            <div className="flex items-center gap-1 text-rose-500 truncate font-medium">
              <Heart className="w-2.5 h-2.5 fill-rose-500 flex-shrink-0" />
              <span className="text-slate-600 font-semibold">Pasangan:</span>
              <span className="truncate">{spouse.callName || spouse.fullName}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-10 pt-4">
      <div className="min-w-[850px] flex flex-col items-center gap-10">
        {levels.map((lvlData, idx) => {
          const isFirst = idx === 0;
          return (
            <React.Fragment key={lvlData.level}>
              {/* Panah / Aliran Penghubung Antar Tingkat */}
              {!isFirst && (
                <div className="flex flex-col items-center -my-4 z-10">
                  <div className="w-0.5 h-7 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-0.5 h-3 bg-emerald-600" />
                </div>
              )}

              {/* Kolam Wadah Per Generasi / Tingkatan */}
              <div
                className={`w-full rounded-2xl p-5 border flex flex-col items-center transition-all ${
                  lvlData.level === 1
                    ? 'bg-gradient-to-b from-emerald-50/70 to-slate-50/50 border-emerald-200 shadow-sm'
                    : lvlData.level === 2
                    ? 'bg-gradient-to-b from-blue-50/50 to-slate-50/50 border-blue-200 shadow-sm'
                    : 'bg-gradient-to-b from-slate-50 to-white border-slate-200/90 shadow-sm'
                }`}
              >
                {/* Header Kolam / Tingkatan */}
                <div className="flex items-center justify-between w-full mb-4 pb-2.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                        lvlData.level === 1
                          ? 'bg-emerald-600 text-white'
                          : lvlData.level === 2
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {lvlData.level}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {getLevelLabel(lvlData.level)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {lvlData.members.length} Kerabat
                  </span>
                </div>

                {/* Anggota dalam Kolam ini */}
                <div className="flex flex-wrap justify-center items-center gap-5 w-full">
                  {lvlData.members.map((member) => renderMemberCard(member))}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}