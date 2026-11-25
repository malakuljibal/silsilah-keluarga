'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TreePine, Users, Search, PlusCircle, LogIn, LogOut, 
  MapPin, ShieldCheck, Heart, Sparkles, Filter, 
  ChevronRight, Calendar, UserCheck, Bookmark, Crown, ChevronDown,
  FileSpreadsheet, Upload, Download, Eye, Focus
} from 'lucide-react';
import { Person } from '@/types/family';
import LoginModal from '@/components/LoginModal';
import AddMemberModal from '@/components/AddMemberModal';
import EditMemberModal from '@/components/EditMemberModal';
import MemberDetailModal from '@/components/MemberDetailModal';
import FamilyTreeGraph from '@/components/FamilyTreeGraph';
import ExcelModal from '@/components/ExcelModal';

export default function HomePage() {
  const [members, setMembers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClan, setSelectedClan] = useState<string>('all');
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'directory' | 'clans'>('tree');
  const [selectedDusun, setSelectedDusun] = useState<string>('all');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/silsilah/api/members');
      let baseData: Person[] = [];
      if (res.ok) {
        baseData = await res.json();
      }

      // Check localStorage for deleted members
      const deletedRaw = typeof window !== 'undefined' ? localStorage.getItem('silsilah_deleted_members') : null;
      let deletedIds = new Set<string>();
      if (deletedRaw) {
        try {
          deletedIds = new Set(JSON.parse(deletedRaw));
        } catch (err) {
          console.error(err);
        }
      }

      // Filter out deleted members
      if (deletedIds.size > 0) {
        baseData = baseData.filter((m) => !deletedIds.has(m.id));
      }

      // Check localStorage for client-added members
      const customRaw = typeof window !== 'undefined' ? localStorage.getItem('silsilah_custom_members') : null;
      if (customRaw) {
        try {
          const customMembers: Person[] = JSON.parse(customRaw);
          const baseIds = new Set(baseData.map((m) => m.id));
          const additions = customMembers.filter((m) => !baseIds.has(m.id) && !deletedIds.has(m.id));
          baseData = [...baseData, ...additions];
        } catch (err) {
          console.error(err);
        }
      }

      // Check localStorage for edited members
      const editedRaw = typeof window !== 'undefined' ? localStorage.getItem('silsilah_edited_members') : null;
      if (editedRaw) {
        try {
          const editedMap: { [id: string]: Person } = JSON.parse(editedRaw);
          baseData = baseData.map((m) => (editedMap[m.id] ? { ...m, ...editedMap[m.id] } : m));
        } catch (err) {
          console.error(err);
        }
      }

      setMembers(baseData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Bersihkan cache lama agar data baru Google Sheet tampil segar
    const version = 'v2_sheet_sync';
    if (typeof window !== 'undefined' && localStorage.getItem('silsilah_cache_version') !== version) {
      localStorage.removeItem('silsilah_deleted_members');
      localStorage.removeItem('silsilah_custom_members');
      localStorage.removeItem('silsilah_edited_members');
      localStorage.setItem('silsilah_cache_version', version);
    }
    fetchMembers();
    const saved = localStorage.getItem('silsilah_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('silsilah_user');
    setUser(null);
  };

  const handleImportSuccess = (imported: Person[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      localStorage.setItem('silsilah_custom_members', JSON.stringify(imported));
      localStorage.removeItem('silsilah_edited_members');
      localStorage.removeItem('silsilah_deleted_members');
      setMembers(imported);
    } else {
      // Merge
      const customRaw = localStorage.getItem('silsilah_custom_members');
      let currentCustom: Person[] = [];
      try {
        currentCustom = customRaw ? JSON.parse(customRaw) : [];
      } catch (e) {
        currentCustom = [];
      }

      const importedMap = new Map<string, Person>();
      imported.forEach((m) => importedMap.set(m.id, m));

      // Update existing custom or add new
      const updatedCustom = currentCustom.map((m) => {
        if (importedMap.has(m.id)) {
          const matched = importedMap.get(m.id)!;
          importedMap.delete(m.id);
          return matched;
        }
        return m;
      });

      // Add remaining imported
      importedMap.forEach((m) => {
        updatedCustom.push(m);
      });

      localStorage.setItem('silsilah_custom_members', JSON.stringify(updatedCustom));
      fetchMembers();
    }
  };

  // Group members by Clan / Marga
  const clansSummary = useMemo(() => {
    const clanMap: { [key: string]: Person[] } = {};
    members.forEach((m) => {
      const clanName = m.clan?.trim() || 'Lainnya';
      if (!clanMap[clanName]) {
        clanMap[clanName] = [];
      }
      clanMap[clanName].push(m);
    });
    return Object.entries(clanMap).map(([name, people]) => ({
      name,
      count: people.length,
      people,
    })).sort((a, b) => b.count - a.count);
  }, [members]);

  const uniqueClans = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.clan?.trim()) set.add(m.clan.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  const uniqueDusuns = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.dusun?.trim()) set.add(m.dusun.trim());
      else if (m.address?.toLowerCase().includes('dusun 1') || m.address?.toLowerCase().includes('dusun i')) set.add('Dusun 1');
      else if (m.address?.toLowerCase().includes('dusun 2') || m.address?.toLowerCase().includes('dusun ii')) set.add('Dusun 2');
      else if (m.address?.toLowerCase().includes('dusun 3') || m.address?.toLowerCase().includes('dusun iii')) set.add('Dusun 3');
    });
    return Array.from(set).sort();
  }, [members]);

  // Filtered members for Directory and Tree
  const filteredMembers = useMemo(() => {
    let list = members;

    // Filter Marga
    if (selectedClan !== 'all') {
      const clanMembers = list.filter((m) => m.clan?.trim() === selectedClan);
      const includedIds = new Set<string>(clanMembers.map((m) => m.id));

      clanMembers.forEach((m) => {
        if (m.spouseId) includedIds.add(m.spouseId);
        const partner = list.find((other) => other.spouseId === m.id);
        if (partner) includedIds.add(partner.id);
      });

      list = list.filter((m) => includedIds.has(m.id));
    }

    // Filter Dusun
    if (selectedDusun !== 'all') {
      list = list.filter((m) => {
        if (m.dusun && m.dusun.toLowerCase().includes(selectedDusun.toLowerCase())) return true;
        if (m.address && m.address.toLowerCase().includes(selectedDusun.toLowerCase())) return true;
        return false;
      });
    }

    // Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => {
        return (
          m.fullName.toLowerCase().includes(q) ||
          (m.callName && m.callName.toLowerCase().includes(q)) ||
          (m.clan && m.clan.toLowerCase().includes(q)) ||
          (m.dusun && m.dusun.toLowerCase().includes(q)) ||
          (m.nik && m.nik.includes(q)) ||
          (m.occupation && m.occupation.toLowerCase().includes(q)) ||
          (m.address && m.address.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [members, searchQuery, selectedClan, selectedDusun]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-base tracking-tight">Silsilah Desa Lungkap</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Resmi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Tarombo & Garis Keturunan Leluhur
              </p>
            </div>
          </div>

          {/* User Auth Info / Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsExcelOpen(true)}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              title="Sync Google Sheets / Impor Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Sync Sheets / Excel</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">{user.role}</span>
                </div>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Kerabat</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Masuk Pengurus</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-200/60 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Dokumentasi Silsilah & Silaturahmi Keluarga
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Pohon Kekerabatan & Warisan Leluhur Desa Lungkap
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Menelusuri jejak darah, ikatan persaudaraan, dan rumpun marga keluarga besar Desa Lungkap secara teratur, rapi, dan mudah diakses oleh anak cucu.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-3">
              <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-800">{members.length}</div>
                  <div className="text-[11px] font-medium text-slate-500">Anggota Terdata</div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-800">{clansSummary.length}</div>
                  <div className="text-[11px] font-medium text-slate-500">Rumpun Marga</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Tabs Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
            {/* View Switcher with Marga Tab */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 self-start">
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'tree'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TreePine className="w-3.5 h-3.5" />
                Bagan Silsilah Pohon
              </button>
              <button
                onClick={() => setActiveTab('clans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'clans'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Daftar Marga ({clansSummary.length})
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'directory'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Semua Kerabat ({filteredMembers.length})
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dusun Filter */}
              {uniqueDusuns.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedDusun}
                    onChange={(e) => setSelectedDusun(e.target.value)}
                    className="pl-3 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm appearance-none cursor-pointer text-slate-700"
                  >
                    <option value="all">Semua Dusun / Wilayah</option>
                    {uniqueDusuns.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Clan Quick Filter */}
              <div className="relative">
                <select
                  value={selectedClan}
                  onChange={(e) => setSelectedClan(e.target.value)}
                  className="pl-3 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm appearance-none cursor-pointer text-slate-700"
                >
                  <option value="all">Semua Marga</option>
                  {uniqueClans.map((c) => (
                    <option key={c} value={c}>Marga {c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIK, marga, dusun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Memuat data silsilah Desa Lungkap...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tree' ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Visualisasi Bagan Pohon Keluarga</h3>
                    <p className="text-xs text-slate-500">Klik salah satu kerabat untuk melihat hubungan dan riwayat lengkapnya</p>
                  </div>
                  {selectedClan !== 'all' && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <Bookmark className="w-3 h-3 text-emerald-600" /> Marga: {selectedClan}
                    </span>
                  )}
                </div>
                <FamilyTreeGraph
                  members={filteredMembers}
                  onSelectMember={(m) => setSelectedPerson(m)}
                  selectedMemberId={selectedPerson?.id}
                />
              </div>
            ) : activeTab === 'clans' ? (
              /* Menu & Tampilan Marga */
              <div className="space-y-6">
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-emerald-600" />
                      Rumpun Marga & Garis Keturunan Desa Lungkap
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Pengelompokan keluarga besar berdasarkan marga atau nama fam leluhur. Klik salah satu marga untuk melihat seluruh anggota kerabat.
                    </p>
                  </div>
                  <div className="text-xs font-semibold px-3 py-1.5 bg-white text-emerald-800 rounded-xl border border-emerald-200 shadow-sm">
                    {clansSummary.length} Rumpun Keluarga
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clansSummary.map((clan) => (
                    <div 
                      key={clan.name}
                      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-black text-sm">
                              {clan.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base">
                                Marga {clan.name}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium">
                                {clan.count} Anggota Keluarga
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            Fam
                          </span>
                        </div>

                        {/* List of members in this clan */}
                        <div className="space-y-2 mb-4">
                          {clan.people.map((person) => (
                            <div
                              key={person.id}
                              onClick={() => setSelectedPerson(person)}
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-100/80 hover:border-emerald-200 transition cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={person.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${person.id}`}
                                  alt={person.fullName}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <div className="truncate">
                                  <div className="font-bold text-xs text-slate-800 truncate">{person.fullName}</div>
                                  <div className="text-[10px] text-slate-400">{person.occupation || person.address}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedClan(clan.name);
                            setActiveTab('tree');
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                        >
                          <TreePine className="w-3.5 h-3.5" /> Lihat di Bagan Pohon
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClan(clan.name);
                            setActiveTab('directory');
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                        >
                          Lihat Direktori
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Directory Grid */
              <div className="space-y-4">
                {selectedClan !== 'all' && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                    <span>Menampilkan anggota keluarga dari <strong>Marga {selectedClan}</strong></span>
                    <button
                      onClick={() => setSelectedClan('all')}
                      className="font-bold underline hover:text-emerald-950"
                    >
                      Tampilkan Semua Marga
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMembers.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className="group bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start gap-3.5 mb-3">
                          <img
                            src={person.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${person.id}`}
                            alt={person.fullName}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-emerald-400 transition"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {person.clan && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  Marga {person.clan}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {person.birthYear} {person.deathYear ? `- ${person.deathYear}` : ''}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition truncate">
                              {person.fullName}
                            </h4>
                            {person.callName && (
                              <p className="text-xs text-slate-500 font-medium">"{person.callName}"</p>
                            )}
                          </div>
                        </div>

                        {person.bio && (
                          <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80 mb-3">
                            "{person.bio}"
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[130px]">{person.occupation || person.address}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPerson(person);
                              setIsEditOpen(true);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-medium text-slate-600 transition"
                          >
                            Edit
                          </button>
                          <span className="font-semibold text-emerald-600 flex items-center gap-0.5 text-[11px] group-hover:translate-x-0.5 transition">
                            Detail <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">Aplikasi Silsilah Keluarga Besar Desa Lungkap</p>
        <p className="mt-1 text-[11px] text-slate-400">Dibuat khusus dan terdedikasi untuk menjaga kebersamaan & sejarah keluarga besar.</p>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />

      <AddMemberModal
        isOpen={isAddOpen}
        defaultParentId={defaultParentId}
        onClose={() => {
          setIsAddOpen(false);
          setDefaultParentId(undefined);
        }}
        onSuccess={(newPerson) => {
          if (newPerson) {
            setMembers((prev) => {
              const exists = prev.some((p) => p.id === newPerson.id);
              if (exists) return prev;
              return [...prev, newPerson];
            });
          } else {
            fetchMembers();
          }
        }}
        allMembers={members}
      />

      <MemberDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        allMembers={members}
        onSelectPerson={(p) => setSelectedPerson(p)}
        onEditPerson={(p) => {
          setEditingPerson(p);
          setIsEditOpen(true);
        }}
        onAddChild={(parent: Person) => {
          setDefaultParentId(parent.id);
          setSelectedPerson(null);
          setIsAddOpen(true);
        }}
      />

      <EditMemberModal
        isOpen={isEditOpen}
        person={editingPerson}
        onClose={() => {
          setIsEditOpen(false);
          setEditingPerson(null);
        }}
        allMembers={members}
        onSuccess={(updated) => {
          setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          if (selectedPerson && selectedPerson.id === updated.id) {
            setSelectedPerson(updated);
          }
        }}
        onDelete={(deletedId) => {
          setMembers((prev) => prev.filter((m) => m.id !== deletedId));
          if (selectedPerson && selectedPerson.id === deletedId) {
            setSelectedPerson(null);
          }
        }}
      />

      <ExcelModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        members={members}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
