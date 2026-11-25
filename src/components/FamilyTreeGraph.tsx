'use client';

import React from 'react';
import { Person } from '@/types/family';
import { Heart, Users } from 'lucide-react';

interface FamilyTreeGraphProps {
  members: Person[];
  onSelectMember: (m: Person) => void;
  selectedMemberId?: string;
}

export default function FamilyTreeGraph({ members, onSelectMember, selectedMemberId }: FamilyTreeGraphProps) {
  // Ambil leluhur utama (tanpa orang tua terdata) sebagai akar silsilah
  const roots = members.filter((m) => !m.parents || m.parents.length === 0);
  // Sisanya adalah anak/keturunan
  const descendants = members.filter((m) => m.parents && m.parents.length > 0);

  // Grouping anak berdasarkan orang tua (ayah/ibu)
  const renderMemberCard = (member: Person) => {
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
  };

  return (
    <div className="w-full overflow-x-auto pb-8 pt-4">
      <div className="min-w-[700px] flex flex-col items-center gap-8">
        {/* Pasangan Leluhur / Tetua Keluarga */}
        <div className="w-full flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6 shadow-sm">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Keluarga Inti & Leluhur Desa Lungkap</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6">
            {roots.map((member) => renderMemberCard(member))}
          </div>

          {/* Garis Penghubung Aliran Keluarga */}
          {descendants.length > 0 && (
            <div className="flex flex-col items-center mt-6 mb-2">
              <div className="w-0.5 h-8 bg-gradient-to-b from-slate-300 to-emerald-400" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>

        {/* Keturunan & Kerabat */}
        {descendants.length > 0 && (
          <div className="w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-6 shadow-sm">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Anak & Keturunan Keluarga</span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6">
              {descendants.map((member) => renderMemberCard(member))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
