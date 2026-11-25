'use client';

import React from 'react';
import { Person } from '@/types/family';
import { Heart, ChevronDown, Award } from 'lucide-react';

interface FamilyTreeGraphProps {
  members: Person[];
  onSelectMember: (m: Person) => void;
  selectedMemberId?: string;
}

export default function FamilyTreeGraph({ members, onSelectMember, selectedMemberId }: FamilyTreeGraphProps) {
  // Group members by generation (1, 2, 3, etc.)
  const generations = Array.from(new Set(members.map((m) => m.generation))).sort((a, b) => a - b);

  const getGenerationTitle = (gen: number) => {
    switch (gen) {
      case 1:
        return 'Generasi I — Tetua Pendiri & Leluhur Lungkap';
      case 2:
        return 'Generasi II — Paman, Bibi & Orang Tua';
      case 3:
        return 'Generasi III — Generasi Sekarang / Penerus';
      case 4:
        return 'Generasi IV — Cucu Keluarga';
      default:
        return `Generasi ${gen}`;
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-8 pt-4">
      <div className="min-w-[850px] flex flex-col items-center gap-10">
        {generations.map((gen, idx) => {
          const genMembers = members.filter((m) => m.generation === gen);

          return (
            <div key={gen} className="w-full flex flex-col items-center relative">
              {/* Generation Header Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-200 text-slate-700 text-xs font-semibold mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{getGenerationTitle(gen)}</span>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                  {genMembers.length} Anggota
                </span>
              </div>

              {/* Members Row */}
              <div className="flex flex-wrap justify-center items-center gap-6">
                {genMembers.map((member) => {
                  const isSelected = member.id === selectedMemberId;
                  const spouse = member.spouseId ? members.find((m) => m.id === member.spouseId) : null;

                  return (
                    <div
                      key={member.id}
                      onClick={() => onSelectMember(member)}
                      className={`group cursor-pointer relative flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md shadow-sm'
                      }`}
                      style={{ width: '260px' }}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={member.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`}
                          alt={member.fullName}
                          className="w-13 h-13 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-emerald-400 transition"
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
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{member.birthYear}</span>
                          {member.deathYear && <span>- {member.deathYear}</span>}
                          {spouse && (
                            <span className="flex items-center gap-0.5 text-rose-500 ml-auto font-medium" title={`Pasangan: ${spouse.fullName}`}>
                              <Heart className="w-2.5 h-2.5 fill-rose-500" />
                              <span className="truncate max-w-[65px]">{spouse.callName || spouse.fullName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connecting line to next generation */}
              {idx < generations.length - 1 && (
                <div className="flex flex-col items-center mt-6">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-slate-300 to-emerald-400" />
                  <ChevronDown className="w-4 h-4 text-emerald-500 -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
