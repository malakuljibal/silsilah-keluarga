'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2 } from 'lucide-react';
import { Person } from '@/types/family';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onSuccess: (updatedPerson: Person) => void;
  onDelete?: (id: string) => void;
  allMembers: Person[];
}

export default function EditMemberModal({
  isOpen,
  onClose,
  person,
  onSuccess,
  onDelete,
  allMembers,
}: EditMemberModalProps) {
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
    generation: 1,
    parents: [] as string[],
    spouseId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (person) {
      setFormData({
        fullName: person.fullName || '',
        callName: person.callName || '',
        clan: person.clan || '',
        gender: person.gender || 'male',
        birthYear: person.birthYear || 1990,
        deathYear: person.deathYear ? String(person.deathYear) : '',
        photo: person.photo || '',
        occupation: person.occupation || '',
        address: person.address || 'Desa Lungkap',
        bio: person.bio || '',
        phone: person.phone || '',
        generation: person.generation || 1,
        parents: person.parents || [],
        spouseId: person.spouseId || '',
      });
    }
  }, [person]);

  if (!isOpen || !person) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedPerson: Person = {
        ...person,
        fullName: formData.fullName,
        callName: formData.callName,
        clan: formData.clan,
        gender: formData.gender as 'male' | 'female',
        birthYear: Number(formData.birthYear) || 1990,
        deathYear: formData.deathYear ? Number(formData.deathYear) : null,
        photo: formData.photo || person.photo || (formData.gender === 'male'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
        occupation: formData.occupation,
        address: formData.address,
        bio: formData.bio,
        phone: formData.phone,
        generation: Number(formData.generation) || 1,
        parents: formData.parents || [],
        spouseId: formData.spouseId || undefined,
      };

      // Simpan ke localStorage updates
      const savedUpdatesRaw = localStorage.getItem('silsilah_edited_members') || '{}';
      const savedUpdates = JSON.parse(savedUpdatesRaw);
      savedUpdates[person.id] = updatedPerson;

      // Sinkronkan juga spouseId dua arah jika spouseId diubah
      if (formData.spouseId) {
        const spouseObj = allMembers.find((m) => m.id === formData.spouseId);
        if (spouseObj) {
          savedUpdates[formData.spouseId] = {
            ...(savedUpdates[formData.spouseId] || spouseObj),
            spouseId: person.id,
          };
        }
      }
      localStorage.setItem('silsilah_edited_members', JSON.stringify(savedUpdates));

      // Jika anggota ini juga ada di silsilah_custom_members, perbarui juga di sana
      const customRaw = localStorage.getItem('silsilah_custom_members');
      if (customRaw) {
        try {
          const customList: Person[] = JSON.parse(customRaw);
          const idx = customList.findIndex((m) => m.id === person.id);
          if (idx !== -1) {
            customList[idx] = updatedPerson;
            localStorage.setItem('silsilah_custom_members', JSON.stringify(customList));
          }
        } catch (err) {
          console.error(err);
        }
      }

      onSuccess(updatedPerson);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memperbarui data anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!confirm(`Yakin ingin menghapus data "${person.fullName}" dari silsilah?`)) {
      return;
    }
    // Tambahkan ID ke deleted list di localStorage
    const deletedRaw = localStorage.getItem('silsilah_deleted_members') || '[]';
    const deletedList: string[] = JSON.parse(deletedRaw);
    if (!deletedList.includes(person.id)) {
      deletedList.push(person.id);
      localStorage.setItem('silsilah_deleted_members', JSON.stringify(deletedList));
    }

    // Hapus dari custom_members jika ada
    const customRaw = localStorage.getItem('silsilah_custom_members');
    if (customRaw) {
      try {
        let customList: Person[] = JSON.parse(customRaw);
        customList = customList.filter((m) => m.id !== person.id);
        localStorage.setItem('silsilah_custom_members', JSON.stringify(customList));
      } catch (e) {
        console.error(e);
      }
    }

    if (onDelete) {
      onDelete(person.id);
    }
    onClose();
  };

  const potentialParents = allMembers.filter((m) => m.id !== person.id);
  const potentialSpouse = allMembers.filter((m) => m.id !== person.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Edit3 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Edit Data Anggota Keluarga</h3>
              <p className="text-xs text-emerald-100/90">{person.fullName}</p>
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Panggilan</label>
              <input
                type="text"
                value={formData.callName}
                onChange={(e) => setFormData({ ...formData, callName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marga / Rumpun Fam</label>
              <input
                type="text"
                value={formData.clan}
                onChange={(e) => setFormData({ ...formData, clan: e.target.value })}
                placeholder="Misal: Daeng Matarang, Baso..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Wafat (Kosong bila hidup)</label>
              <input
                type="number"
                value={formData.deathYear}
                onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                placeholder="Contoh: 2021"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Generasi (1 - 9)</label>
              <select
                value={formData.generation}
                onChange={(e) => setFormData({ ...formData, generation: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Profil</label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan / Jabatan</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Domisili</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Singkat / Bio / Kisah</label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Relasi Keluarga */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Relasi Keluarga</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Orang Tua (Pilih 1 atau 2)</label>
                <select
                  multiple
                  value={formData.parents}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setFormData({ ...formData, parents: selected });
                  }}
                  className="w-full h-24 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {potentialParents.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.clan ? `[${m.clan}]` : ''} ({m.gender === 'male' ? 'L' : 'P'})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Tahan Ctrl/Cmd untuk memilih lebih dari 1 orang tua</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pasangan Hidup (Suami / Istri)</label>
                <select
                  value={formData.spouseId}
                  onChange={(e) => setFormData({ ...formData, spouseId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Tidak Ada / Belum Terdata --</option>
                  {potentialSpouse.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.clan ? `[${m.clan}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
