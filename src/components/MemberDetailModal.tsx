'use client';

import React from 'react';
import { X, Heart, Phone, MapPin, Briefcase, Calendar, Users, Award, Shield } from 'lucide-react';
import { Person } from '@/types/family';

interface MemberDetailModalProps {
  person: Person | null;
  onClose: () => void;
  allMembers: Person[];
  onSelectPerson: (p: Person) => void;
}

export default function MemberDetailModal({ person, onClose, allMembers, onSelectPerson }: MemberDetailModalProps) {
  if (!person) return null;

  const parents = allMembers.filter((m) => person.parents?.includes(m.id));
  const spouse = allMembers.find((m) => m.id === person.spouseId);
  const children = allMembers.filter((m) => person.children?.includes(m.id) || m.parents?.includes(person.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Profile Cover */}
        <div className="relative h-32 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 p-6 flex justify-end items-start">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Header Info */}
        <div className="px-6 pb-6 relative pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 mb-4">
            <img
              src={person.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${person.id}`}
              alt={person.fullName}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl ring-2 ring-emerald-500/20 bg-emerald-50"
            />
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${person.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {person.gender === 'male' ? 'Laki-laki ♂' : 'Perempuan ♀'}
                </span>
                {person.clan && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Marga {person.clan}
                  </span>
                )}
                {person.deathYear && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Almarhum/ah ({person.deathYear})
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{person.fullName}</h2>
              {person.callName && (
                <p className="text-sm font-medium text-emerald-600">"{person.callName}"</p>
              )}
            </div>
          </div>

          {/* Details Tabs / Info */}
          <div className="space-y-4 text-sm text-slate-600">
            {/* Bio quote */}
            {person.bio && (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl italic text-slate-700 text-xs leading-relaxed">
                "{person.bio}"
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Kelahiran</div>
                  <div className="font-semibold text-slate-700">
                    {person.birthYear} {person.deathYear ? ` - ${person.deathYear}` : '(Masih Hidup)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Pekerjaan / Peran</div>
                  <div className="font-semibold text-slate-700">{person.occupation || 'Warga Lungkap'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Alamat Domisili</div>
                  <div className="font-semibold text-slate-700">{person.address || 'Desa Lungkap'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <Phone className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Kontak WhatsApp</div>
                  <div className="font-semibold text-slate-700">{person.phone || '-'}</div>
                </div>
              </div>
            </div>

            {/* Hubungan Keluarga */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Hubungan Garis Keturunan
              </h4>

              {/* Parents */}
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Orang Tua:
                </div>
                {parents.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parents.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectPerson(p)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200/60 transition flex items-center gap-1.5"
                      >
                        <span>{p.fullName}</span>
                        {p.callName && <span className="opacity-75">({p.callName})</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tetua / Nenek Moyang Awal</p>
                )}
              </div>

              {/* Spouse */}
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Pasangan Hidup:
                </div>
                {spouse ? (
                  <button
                    onClick={() => onSelectPerson(spouse)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-medium border border-rose-200/60 transition"
                  >
                    {spouse.fullName} {spouse.callName ? `(${spouse.callName})` : ''}
                  </button>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum terdata</p>
                )}
              </div>

              {/* Children */}
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" /> Keturunan / Anak ({children.length}):
                </div>
                {children.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {children.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectPerson(c)}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-medium border border-teal-200/60 transition flex items-center gap-1.5"
                      >
                        <span>{c.fullName}</span>
                        {c.callName && <span className="opacity-75">({c.callName})</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada data keturunan tercatat</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
