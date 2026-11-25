'use client';

import React, { useState, useEffect } from 'react';
import { 
  TreePine, Users, Search, PlusCircle, LogIn, LogOut, 
  MapPin, ShieldCheck, Heart, Sparkles, Filter, 
  ChevronRight, Calendar, UserCheck
} from 'lucide-react';
import { Person } from '@/types/family';
import LoginModal from '@/components/LoginModal';
import AddMemberModal from '@/components/AddMemberModal';
import MemberDetailModal from '@/components/MemberDetailModal';
import FamilyTreeGraph from '@/components/FamilyTreeGraph';

export default function HomePage() {
  const [members, setMembers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'directory'>('tree');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.callName && m.callName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.occupation && m.occupation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.address && m.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGen = selectedGen === 'all' || m.generation.toString() === selectedGen;

    return matchesSearch && matchesGen;
  });

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
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
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
                Menelusuri jejak darah, ikatan persaudaraan, dan tali silaturahmi antar generasi keluarga besar Desa Lungkap secara teratur, rapi, dan mudah diakses oleh anak cucu.
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
                  <TreePine className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-800">
                    {Array.from(new Set(members.map((m) => m.generation))).length}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">Tingkat Generasi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Tabs Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
            {/* View Switcher */}
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
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'directory'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Direktori Kerabat ({filteredMembers.length})
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, panggilan, alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedGen}
                  onChange={(e) => setSelectedGen(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium shadow-sm cursor-pointer"
                >
                  <option value="all">Semua Generasi</option>
                  <option value="1">Generasi I (Leluhur)</option>
                  <option value="2">Generasi II (Orang Tua)</option>
                  <option value="3">Generasi III (Penerus)</option>
                  <option value="4">Generasi IV (Cucu)</option>
                </select>
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                    Interaktif
                  </span>
                </div>
                <FamilyTreeGraph
                  members={filteredMembers}
                  onSelectMember={(m) => setSelectedPerson(m)}
                  selectedMemberId={selectedPerson?.id}
                />
              </div>
            ) : (
              /* Directory Grid */
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
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Gen {person.generation}
                            </span>
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
                      <span className="truncate max-w-[170px]">{person.occupation || person.address}</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition">
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
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
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchMembers}
        allMembers={members}
      />

      <MemberDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        allMembers={members}
        onSelectPerson={(p) => setSelectedPerson(p)}
      />
    </div>
  );
}
