'use client';

import React, { useMemo } from 'react';
import { Person } from '@/types/family';
import { Heart, User, Sparkles } from 'lucide-react';

interface FamilyTreeGraphProps {
  members: Person[];
  onSelectMember: (m: Person) => void;
  selectedMemberId?: string;
}

interface TreeNode {
  person: Person;
  spouse?: Person;
  isSpouseExternal?: boolean;
  spouseOriginalClan?: string;
  children: TreeNode[];
}

export default function FamilyTreeGraph({ members, onSelectMember, selectedMemberId }: FamilyTreeGraphProps) {
  // Bangun struktur pohon (Tree Structure) hierarkis murni tanpa wadah berpetak/kolam
  const { rootNodes, unlinkedMembers } = useMemo(() => {
    const memberMap = new Map<string, Person>(members.map((m) => [m.id, m]));
    const childIdsSet = new Set<string>();

    // Buat pemetaan dua arah: orang tua -> anak (gabungkan person.children DAN child.parents)
    const parentToChildrenMap = new Map<string, Set<string>>();

    members.forEach((m) => {
      // 1. Dari properti children milik parent
      if (m.children && m.children.length > 0) {
        if (!parentToChildrenMap.has(m.id)) {
          parentToChildrenMap.set(m.id, new Set());
        }
        m.children.forEach((cId) => {
          parentToChildrenMap.get(m.id)!.add(cId);
          childIdsSet.add(cId);
        });
      }

      // 2. Dari properti parents milik anak
      if (m.parents && m.parents.length > 0) {
        childIdsSet.add(m.id);
        m.parents.forEach((pId) => {
          if (!parentToChildrenMap.has(pId)) {
            parentToChildrenMap.set(pId, new Set());
          }
          parentToChildrenMap.get(pId)!.add(m.id);
        });
      }
    });

    const visitedNodes = new Set<string>();

    const buildNode = (p: Person): TreeNode => {
      visitedNodes.add(p.id);

      let spouse: Person | undefined = undefined;
      let isSpouseExternal = false;
      let spouseOriginalClan = '';

      if (p.spouseId) {
        const sp = memberMap.get(p.spouseId);
        if (sp) {
          spouse = sp;
          visitedNodes.add(sp.id);
          if (p.clan && sp.clan && p.clan.trim().toLowerCase() !== sp.clan.trim().toLowerCase()) {
            isSpouseExternal = true;
            spouseOriginalClan = sp.clan.trim();
          }
        }
      }

      // Kumpulkan anak-anak dari person ini (dan pasangannya) secara dua arah
      const pChildren = Array.from(parentToChildrenMap.get(p.id) || []);
      const spChildren = spouse ? Array.from(parentToChildrenMap.get(spouse.id) || []) : [];
      const allChildIds = Array.from(new Set([...pChildren, ...spChildren]));

      const childrenNodes: TreeNode[] = [];
      allChildIds.forEach((cId) => {
        const child = memberMap.get(cId);
        if (child && !visitedNodes.has(child.id)) {
          childrenNodes.push(buildNode(child));
        }
      });

      return {
        person: p,
        spouse,
        isSpouseExternal,
        spouseOriginalClan,
        children: childrenNodes,
      };
    };

    // Temukan root (leluhur puncak): orang yang tidak punya orang tua terdaftar
    const roots: TreeNode[] = [];

    const potentialRoots = members.filter((m) => {
      const hasParentInDb = m.parents && m.parents.some((pId) => memberMap.has(pId));
      return !hasParentInDb && !childIdsSet.has(m.id);
    });

    // Urutkan laki-laki lebih dulu jika ada relasi pasangan
    potentialRoots.sort((a, b) => {
      if (a.gender === 'male' && b.gender !== 'male') return -1;
      if (a.gender !== 'male' && b.gender === 'male') return 1;
      return (a.generation || 1) - (b.generation || 1);
    });

    potentialRoots.forEach((rootPerson) => {
      if (!visitedNodes.has(rootPerson.id)) {
        roots.push(buildNode(rootPerson));
      }
    });

    // Sisa anggota yang belum terhubung ke pohon mana pun
    const unlinked = members.filter((m) => !visitedNodes.has(m.id));

    return { rootNodes: roots, unlinkedMembers: unlinked };
  }, [members]);

  // Render kartu anggota bagan
  const renderPersonCard = (
    person: Person,
    options?: { isSpouse?: boolean; isExternal?: boolean; originalClan?: string }
  ) => {
    const isSelected = person.id === selectedMemberId;
    const isFemale = person.gender === 'female';

    return (
      <div
        key={person.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMember(person);
        }}
        className={`relative group cursor-pointer w-48 rounded-xl p-2.5 bg-white border transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none ${
          isSelected
            ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40'
            : options?.isExternal
            ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
            : isFemale
            ? 'border-pink-200 hover:border-pink-300'
            : 'border-blue-200 hover:border-blue-300'
        }`}
      >
        {/* Label jika pasangan dari Fam lain */}
        {options?.isExternal && (
          <div className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded shadow-xs uppercase tracking-wider">
            Fam {options.originalClan || 'Lain'}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <img
              src={person.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${person.id}`}
              alt={person.fullName}
              className="w-10 h-10 rounded-lg object-cover bg-slate-100 ring-1 ring-slate-200"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold border border-white ${
                isFemale ? 'bg-pink-500' : 'bg-blue-500'
              }`}
            >
              {isFemale ? '♀' : '♂'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
              {person.fullName}
            </h5>
            <p className="text-[10px] text-slate-500 truncate">
              {person.callName ? `"${person.callName}"` : person.occupation || 'Warga'}
            </p>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
              <span>{person.birthYear || '-'}</span>
              {person.deathYear && <span>– {person.deathYear}</span>}
              {person.clan && <span className="text-slate-600 font-bold">• {person.clan}</span>}
            </div>
          </div>
        </div>

        {person.generation && (
          <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
            <span>Gen {person.generation}</span>
            {options?.isSpouse && <span className="text-rose-500 font-semibold">Pasangan</span>}
          </div>
        )}
      </div>
    );
  };

  // Komponen rekursif Bagan Pohon Bergaris Ortogonal
  const renderBranch = (node: TreeNode) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.person.id} className="flex flex-col items-center">
        {/* Simpul Orang / Pasangan Suami & Istri */}
        <div className="flex items-center gap-2 relative z-10">
          {renderPersonCard(node.person)}

          {node.spouse && (
            <>
              {/* Garis Penghubung Pernikahan */}
              <div className="flex flex-col items-center justify-center px-1">
                <div className="w-4 h-0.5 bg-rose-300" />
                <div className="w-5 h-5 -my-2.5 rounded-full bg-rose-50 border border-rose-300 flex items-center justify-center text-rose-500 z-10 shadow-xs">
                  <Heart className="w-2.5 h-2.5 fill-rose-500" />
                </div>
              </div>

              {renderPersonCard(node.spouse, {
                isSpouse: true,
                isExternal: node.isSpouseExternal,
                originalClan: node.spouseOriginalClan,
              })}
            </>
          )}
        </div>

        {/* Garis Bagan ke Bawah menuju Anak-Anak */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Garis vertikal batang utama dari orang tua */}
            <div className="w-0.5 h-6 bg-slate-300" />

            {/* Cabang garis horizontal ortogonal untuk menghubungkan anak-anak */}
            <div className="relative flex justify-center pt-6">
              {node.children.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-slate-300"
                  style={{
                    left: `calc(${100 / (node.children.length * 2)}%)`,
                    right: `calc(${100 / (node.children.length * 2)}%)`,
                  }}
                />
              )}

              {/* Node Anak-Anak */}
              <div className="flex items-start gap-8">
                {node.children.map((childNode) => (
                  <div key={childNode.person.id} className="relative flex flex-col items-center">
                    {/* Garis vertikal cabang turun dari garis horizontal ke kartu anak */}
                    <div className="absolute -top-6 w-0.5 h-6 bg-slate-300" />
                    {renderBranch(childNode)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-16 pt-4">
      <div className="min-w-max px-8 flex flex-col gap-10">
        {/* Info Legend Bagan */}
        <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-5 py-3 text-xs text-slate-600 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Bagan Silsilah Pohon Keluarga
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-400" /> Laki-laki
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-pink-100 border border-pink-400" /> Perempuan
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400" /> Pasangan dr Marga Lain
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total {members.length} Kerabat Terdaftar
          </span>
        </div>

        {/* Bagan Pohon Murni */}
        <div className="flex flex-col items-center gap-16">
          {rootNodes.map((root) => (
            <div key={root.person.id} className="w-full flex justify-center py-2">
              {renderBranch(root)}
            </div>
          ))}

          {/* Kerabat Lepas yang Belum Terhubung Orang Tua */}
          {unlinkedMembers.length > 0 && (
            <div className="mt-8 pt-8 border-t border-dashed border-slate-300 w-full flex flex-col items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kerabat Lainnya (Belum Terhubung Jalur Garis Orang Tua)
              </span>
              <div className="flex flex-wrap justify-center gap-4">
                {unlinkedMembers.map((m) => renderPersonCard(m))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}