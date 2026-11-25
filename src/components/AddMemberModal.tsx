'use client';

import React, { useState } from 'react';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { Person } from '@/types/family';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPerson?: Person) => void;
  allMembers: Person[];
  defaultParentId?: string;
}

export default function AddMemberModal({ isOpen, onClose, onSuccess, allMembers, defaultParentId }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    callName: '',
    clan: '',
    gender: 'male',
    birthYear: 1990,
    deathYear: '',
    photo: '',
    occupation: '',
    address: 'Desa Lungkap',
    bio: '',
    phone: '',
    generation: 3,
    parents: (defaultParentId ? [defaultParentId] : []) as string[],
    spouseId: '',
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (defaultParentId) {
      setFormData((prev) => ({
        ...prev,
        parents: [defaultParentId],
      }));
    }
  }, [defaultParentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newId = String(Date.now());
      const newPerson: Person = {
        id: newId,
        fullName: formData.fullName,
        callName: formData.callName,
        clan: formData.clan,
        gender: formData.gender as 'male' | 'female',
        birthYear: Number(formData.birthYear) || 1990,
        deathYear: formData.deathYear ? Number(formData.deathYear) : null,
        photo: formData.photo || (formData.gender === 'male'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
        occupation: formData.occupation,
        address: formData.address,
        bio: formData.bio,
        phone: formData.phone,
        generation: Number(formData.generation) || 1,
        parents: formData.parents || [],
        spouseId: formData.spouseId || undefined,
        children: [],
      };

      // Save directly to localStorage in static export environment
      const localAdded = JSON.parse(localStorage.getItem('silsilah_custom_members') || '[]');
      localAdded.push(newPerson);
      localStorage.setItem('silsilah_custom_members', JSON.stringify(localAdded));

      // Also update parents' children array if parents are selected
      if (formData.parents && formData.parents.length > 0) {
        const savedUpdatesRaw = localStorage.getItem('silsilah_edited_members') || '{}';
        const savedUpdates = JSON.parse(savedUpdatesRaw);
        
        formData.parents.forEach((parentId) => {
          const parentObj = allMembers.find((m) => m.id === parentId);
          if (parentObj) {
            const currentChildren = savedUpdates[parentId]?.children || parentObj.children || [];
            if (!currentChildren.includes(newId)) {
              savedUpdates[parentId] = {
                ...(savedUpdates[parentId] || parentObj),
                children: [...currentChildren, newId],
              };
            }
          }
        });
        localStorage.setItem('silsilah_edited_members', JSON.stringify(savedUpdates));
      }

      // Also update spouse's spouseId symmetrically if spouse is selected
      if (formData.spouseId) {
        const savedUpdatesRaw = localStorage.getItem('silsilah_edited_members') || '{}';
        const savedUpdates = JSON.parse(savedUpdatesRaw);
        const spouseObj = allMembers.find((m) => m.id === formData.spouseId);
        if (spouseObj) {
          savedUpdates[formData.spouseId] = {
            ...(savedUpdates[formData.spouseId] || spouseObj),
            spouseId: newId,
          };
          localStorage.setItem('silsilah_edited_members', JSON.stringify(savedUpdates));
        }
      }

      onSuccess(newPerson);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data anggota.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserPlus className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tambah Kerabat Baru</h3>
              <p className="text-xs text-emerald-100/90">Silsilah Keluarga Besar Desa Lungkap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Contoh: H. Amirullah Daeng"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marga / Rumpun Fam</label>
              <input
                type="text"
                value={formData.clan}
                onChange={(e) => setFormData({ ...formData, clan: e.target.value })}
                placeholder="Contoh: Ismail / Daeng Matarang"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Panggilan / Gelar Akrab</label>
              <input
                type="text"
                value={formData.callName}
                onChange={(e) => setFormData({ ...formData, callName: e.target.value })}
                placeholder="Contoh: Kakek Amir"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan / Peran</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Contoh: Tokoh Adat / Guru"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="male">Laki-laki ♂</option>
                <option value="female">Perempuan ♀</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Lahir *</label>
              <input
                type="number"
                required
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Wafat (Kosong jika hidup)</label>
              <input
                type="number"
                value={formData.deathYear}
                onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                placeholder="Kosongkan jika masih hidup"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Generasi (1 - 9)</label>
              <select
                value={formData.generation}
                onChange={(e) => setFormData({ ...formData, generation: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="1">Generasi 1 (Leluhur Tertinggi / Pendiri)</option>
                <option value="2">Generasi 2</option>
                <option value="3">Generasi 3</option>
                <option value="4">Generasi 4</option>
                <option value="5">Generasi 5</option>
                <option value="6">Generasi 6</option>
                <option value="7">Generasi 7</option>
                <option value="8">Generasi 8</option>
                <option value="9">Generasi 9</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pasangan (Suami / Istri)</label>
              <select
                value={formData.spouseId}
                onChange={(e) => setFormData({ ...formData, spouseId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="">-- Belum ada / Tidak dipilih --</option>
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.callName || 'Tanpa Panggilan'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Orang Tua (Pilih Ayah / Ibu)</label>
            <select
              multiple
              value={formData.parents}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, parents: selected });
              }}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 h-24"
            >
              {allMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.callName || 'Tanpa Panggilan'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Tahan tombol Ctrl (Windows) atau Cmd (Mac) untuk memilih 2 orang tua.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan / Aktivitas</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="misal: Petani Cengkeh, Pengusaha, Guru"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. Kontak / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="misal: 081234567890"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat / Domisili</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="misal: Dusun II, Desa Lungkap"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Riwayat / Sekilas Info (Bio)</label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Ceritakan jasa, kiprah di Desa Lungkap, atau kebiasaan khas beliau..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium shadow-md shadow-emerald-600/20 active:scale-[0.98] transition disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kerabat'}
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
