import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Share2, 
  LogIn, 
  LogOut, 
  ChevronRight, 
  Search,
  Package,
  Clock,
  Tag,
  Info,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FurnitureItem {
  id: number;
  timestamp: string;
  kategori: string;
  harga: string;
  diskon: string;
  tanggal_diskon_sampai: string;
  keterangan: string; // Changed from promo_percent
  stock: string;
  status: string;
  photo64base: string; // Changed from photo_url
}

// Helper to normalize Google Drive links to high-performance format
const normalizeImageUrl = (url: string) => {
  if (!url) return `https://picsum.photos/seed/furniture/800/600`;
  if (url.startsWith('data:image')) return url;
  
  // Handle Google Drive links
  const driveMatch = url.match(/(?:drive\.google\.com\/.*(?:id=|file\/d\/)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  
  return url;
};

const SEED_DATA: FurnitureItem[] = [
  { id: 1, timestamp: "2026-03-16", kategori: "Sofa Minimalis C", harga: "Rp 4.500.000", diskon: "", tanggal_diskon_sampai: "", keterangan: "KOLEKSI TERBARU", stock: "10", status: "Ready", photo64base: "https://drive.google.com/uc?export=view&id=1PxdovVbl9u2V84otVFpuV-vj562" },
  { id: 2, timestamp: "2026-03-16", kategori: "Meja Makan Kayu", harga: "Rp 7.200.000", diskon: "", tanggal_diskon_sampai: "", keterangan: "KOLEKSI TERBARU", stock: "10", status: "Ready", photo64base: "https://drive.google.com/uc?export=view&id=1Q0uDrBowEW7ZstW-xE7v-vj562" },
  { id: 3, timestamp: "2026-03-16", kategori: "Tempat Tidur Lux", harga: "Rp 12.000.000", diskon: "", tanggal_diskon_sampai: "", keterangan: "KOLEKSI TERBARU", stock: "10", status: "Ready", photo64base: "https://drive.google.com/uc?export=view&id=1wl0GMzLfluwJ5kyflxtFw-vj562" },
  { id: 4, timestamp: "2026-03-16", kategori: "Lemari Pakaian", harga: "Rp 3.800.000", diskon: "", tanggal_diskon_sampai: "", keterangan: "KOLEKSI TERBARU", stock: "10", status: "Ready", photo64base: "https://drive.google.com/uc?export=view&id=1-3W1RPsKyTBj_UAwT0v-vj562" },
  { id: 5, timestamp: "2026-03-16", kategori: "Kursi Kerja Ergo", harga: "Rp 1.500.000", diskon: "Rp 1.600.000", tanggal_diskon_sampai: "", keterangan: "KOLEKSI TERBARU", stock: "10", status: "Ready", photo64base: "https://drive.google.com/uc?export=view&id=1iP49F6_hvskoJyer-vj5629GpANqxnoN" },
];

export default function App() {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Semua');
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Admin Management State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<FurnitureItem | null>(null);
  const [formData, setFormData] = useState({
    kategori: '',
    harga: '',
    diskon: '',
    tanggal_diskon_sampai: '',
    keterangan: '',
    stock: '',
    status: 'Ready',
    photo64base: ''
  });

  const categories = ['Semua', ...Array.from(new Set(items.map(item => item.kategori)))];

  useEffect(() => {
    fetchFurniture();
  }, []);

  const fetchFurniture = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/furniture');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch furniture:', err);
      // Fallback to seed data if fetch fails completely and we have no items
      if (items.length === 0) setItems(SEED_DATA);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAdmin(true);
        setShowLogin(false);
        alert('Selamat datang, Admin Indra!');
      } else {
        // Tampilkan pesan error spesifik dari server
        alert(data.message || 'Login Gagal, Bosku. Cek lagi ya!');
      }
    } catch (err) {
      console.error('Login error detail:', err);
      alert('Gagal terhubung ke server. Pastikan URL Apps Script sudah diisi di Settings (WEB_APP_URL)!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Sesuai untuk mobile
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Kompres kualitas ke 0.6 agar muat di Google Sheets (limit 50rb karakter)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setFormData({ ...formData, photo64base: compressedBase64 });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/furniture/${editingItem.id}` : '/api/furniture';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await res.json();
      if (result.success) {
        alert(editingItem ? 'Produk Berhasil Diupdate!' : 'Produk Berhasil Ditambah!');
        setEditingItem(null);
        setFormData({
          kategori: '', harga: '', diskon: '', tanggal_diskon_sampai: '',
          keterangan: '', stock: '', status: 'Ready', photo64base: ''
        });
        // Refresh halaman utama sesuai permintaan
        window.location.reload();
      } else {
        alert('Gagal: ' + result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Yakin mau hapus produk ini, Bosku?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/furniture/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        alert('Produk Terhapus!');
        fetchFurniture();
      } else {
        alert('Gagal hapus: ' + result.error);
      }
    } catch (err) {
      alert('Gagal koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: FurnitureItem) => {
    setEditingItem(item);
    setFormData({
      kategori: item.kategori,
      harga: item.harga,
      diskon: item.diskon,
      tanggal_diskon_sampai: item.tanggal_diskon_sampai,
      keterangan: item.keterangan,
      stock: item.stock,
      status: item.status,
      photo64base: item.photo64base
    });
    setShowAdminPanel(true);
  };

  const shareLocation = () => {
    const url = 'https://www.google.com/maps/place/Jl.+Husni+Thamrin+No.60,+Orang+Kayo+Hitam,+Kec.+Ps.+Jambi,+Kota+Jambi,+Jambi+36111';
    window.open(url, '_blank');
  };

  const contactWA = (item?: FurnitureItem) => {
    const phone = '6285366529875';
    const message = item 
      ? `Halo Indra Furniture, saya tertarik dengan ${item.kategori} seharga ${item.harga}. Apakah masih Ready?`
      : 'Halo Indra Furniture, saya ingin bertanya tentang produk Anda.';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredItems = category === 'Semua' 
    ? items 
    : items.filter(item => item.kategori === category);

  return (
    <div className="android-container min-h-screen flex flex-col bg-[#0a0502]">
      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] p-8 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter italic">
                {editingItem ? 'EDIT PRODUK' : 'TAMBAH PRODUK'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Kategori</label>
                  <input 
                    type="text" 
                    required
                    value={formData.kategori}
                    onChange={e => setFormData({...formData, kategori: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-neon-amber outline-none transition-all"
                    placeholder="Contoh: Sofa, Meja..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Harga</label>
                    <input 
                      type="text" 
                      required
                      value={formData.harga}
                      onChange={e => setFormData({...formData, harga: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-neon-amber outline-none transition-all"
                      placeholder="Rp 1.000.000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Stock</label>
                    <input 
                      type="number" 
                      required
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-neon-amber outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Diskon (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.diskon}
                    onChange={e => setFormData({...formData, diskon: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-neon-amber outline-none transition-all"
                    placeholder="Harga Coret (Rp 1.200.000)"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Keterangan / Promo</label>
                  <input 
                    type="text" 
                    value={formData.keterangan}
                    onChange={e => setFormData({...formData, keterangan: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-neon-amber outline-none transition-all"
                    placeholder="Contoh: 15% OFF, NEW, HOT"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Foto Produk</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-white/40 text-xs"
                  />
                  {formData.photo64base && (
                    <img 
                      src={normalizeImageUrl(formData.photo64base)} 
                      className="mt-2 w-20 h-20 object-cover rounded-xl border border-white/20" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/preview/800/600`;
                      }}
                    />
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-neon-amber text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,157,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'PROSES...' : (editingItem ? 'UPDATE SEKARANG' : 'TAMBAH PRODUK')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowAdminPanel(false); setEditingItem(null); }}
                    className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    BATAL
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <header className="relative z-10">
        <div className="p-4 flex justify-between items-center bg-transparent backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img 
              src="https://jambijohan0-cpu.github.io/Johan/img/logoindra2.jpeg" 
              alt="Logo Indra Furniture" 
              className="h-12 rounded-lg neon-glow-amber"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-serif font-black text-red-600 italic tracking-[0.1em] drop-shadow-[2px_2px_0px_#1e40af]">
                INDRA
              </span>
              <span className="text-[8px] font-sans font-black text-blue-500 tracking-[0.6em] mt-1 uppercase">
                FURNITURE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchFurniture()}
              className={cn(
                "p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all",
                loading && "animate-spin"
              )}
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-neon-cyan" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => { setEditingItem(null); setShowAdminPanel(true); }}
                className="px-3 py-1.5 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
              >
                + PRODUK
              </button>
            )}
            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
            >
              {isAdmin ? <LogOut className="w-5 h-5 text-neon-amber" /> : <LogIn className="w-5 h-5 text-neon-amber" />}
            </button>
          </div>
        </div>

        <div className="relative h-64 w-full overflow-hidden">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="https://jambijohan0-cpu.github.io/Johan/img/imgtoko.png" 
            alt="Main Store" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-bold text-white tracking-tighter uppercase italic"
            >
              Indra <span className="text-neon-amber">Furniture</span>
            </motion.h1>
            <p className="text-xs text-white/60 font-mono uppercase tracking-widest mt-1">
              Techno Wood & Luxury Living
            </p>
          </div>
        </div>
      </header>

      {/* Info Section */}
      <section className="p-4 space-y-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="glass p-4 rounded-2xl space-y-3"
        >
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neon-amber shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium">Jl. Husni Thamrin No.60</p>
              <p className="text-xs text-white/50">Orang Kayo Hitam, Kec. Ps. Jambi, Kota Jambi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-neon-cyan shrink-0" />
            <p className="text-sm font-mono">0853-6652-9875</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={shareLocation}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              <Share2 className="w-4 h-4 text-neon-amber" />
              Share Lokasi
            </button>
            <button 
              onClick={() => contactWA()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neon-amber/20 border border-neon-amber/30 text-xs font-bold uppercase tracking-wider hover:bg-neon-amber/30 transition-all text-neon-amber"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </motion.div>
      </section>

      {/* Category Filter */}
      <div className="px-4 py-2 sticky top-[81px] z-40 bg-transparent backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                category === cat 
                  ? "bg-neon-amber border-neon-amber text-black shadow-[0_0_10px_rgba(255,157,0,0.5)]" 
                  : "glass border-white/10 text-white/60"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Furniture Grid */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-neon-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-neon-amber font-mono text-xs animate-pulse">LOADING MEBEL MEWAH...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => contactWA(item)}
                  className="group relative glass rounded-3xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Action Buttons for Admin */}
                  {isAdmin && (
                    <div className="absolute top-4 left-4 flex gap-2 z-30">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                        className="p-2 rounded-xl bg-neon-cyan text-black hover:scale-110 transition-all shadow-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-2 rounded-xl bg-red-500 text-white hover:scale-110 transition-all shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={normalizeImageUrl(item.photo64base) || `https://picsum.photos/seed/${item.kategori}-${item.id}/800/600`} 
                      alt={item.kategori}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.kategori}-${item.id}/800/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                      <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                        {item.kategori}
                      </span>
                      {item.status === 'Terjual' && (
                        <span className="px-3 py-1 rounded-lg bg-red-500/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
                          TERJUAL
                        </span>
                      )}
                    </div>

                    {/* GAUL DISCOUNT TAG */}
                    {item.diskon && (
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [-12, -8, -12],
                          opacity: [1, 0.8, 1]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut"
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] pointer-events-none flex items-center justify-center"
                      >
                        <div className="relative">
                          {/* The Tag Shape */}
                          <div className="bg-red-600 text-white px-5 py-2 rounded-sm shadow-[0_0_30px_rgba(220,38,38,0.8)] border-2 border-white/40 flex flex-col items-center justify-center min-w-[130px] transform -rotate-12">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white/30" />
                            <span className="text-[9px] font-black tracking-[0.3em] opacity-90 mb-0.5">DISKON</span>
                            <span className="text-2xl font-black tracking-tighter drop-shadow-2xl">
                              {item.diskon.replace(/Rp/gi, '').trim()}
                            </span>
                            <div className="absolute -right-1 -bottom-1 w-full h-full border-2 border-white/20 rounded-sm -z-10 translate-x-1 translate-y-1" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {item.keterangan && (
                      <div className="absolute top-3 right-3">
                        <div className="w-12 h-12 rounded-full bg-neon-amber flex flex-col items-center justify-center shadow-lg rotate-12">
                          <span className="text-[10px] font-black leading-none">PROMO</span>
                          <span className="text-[10px] font-black text-center px-1">{item.keterangan}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        {item.harga_asli && (
                          <div className="flex flex-col mb-1">
                            <motion.div 
                              animate={{ 
                                x: [-2, 2, -2],
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.5,
                                ease: "linear"
                              }}
                              className="flex items-center gap-2 mb-1"
                            >
                              <motion.span 
                                className="text-[10px] font-black text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-sm w-fit animate-pulse"
                              >
                                {item.gaul_label}
                              </motion.span>
                              <motion.span
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-[10px] font-black text-neon-amber uppercase tracking-tighter"
                              >
                                HEMAT {item.diskon}!!
                              </motion.span>
                            </motion.div>
                            <span className="text-xs text-white/40 line-through decoration-neon-amber/50">
                              {item.harga_asli}
                            </span>
                          </div>
                        )}
                        <p className="text-2xl font-black tracking-tighter italic">
                          {item.harga}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          item.stock === '0' ? "text-red-400" : "text-neon-cyan"
                        )}>
                          Stock: {item.stock}
                        </p>
                      </div>
                    </div>

                    {item.tanggal_diskon_sampai && (
                      <div className="flex items-center gap-2 text-[10px] text-neon-amber font-mono">
                        <Clock className="w-3 h-3" />
                        <span>PROMO SAMPAI: {item.tanggal_diskon_sampai}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] text-white/30 font-mono">#{item.timestamp?.split('T')[0]}</span>
                      <div className="flex items-center gap-1 text-neon-amber text-xs font-bold uppercase italic group-hover:translate-x-1 transition-transform">
                        Cek Ready? <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 space-y-2">
            <Package className="w-12 h-12 opacity-20" />
            <p className="text-sm italic">Belum ada koleksi di kategori ini, Bosku.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 text-center space-y-4 border-t border-white/5">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
          © 2026 Indra Furniture Jambi
        </p>
        <div className="flex justify-center gap-4">
          <div className="w-1 h-1 rounded-full bg-neon-amber" />
          <div className="w-1 h-1 rounded-full bg-neon-cyan" />
          <div className="w-1 h-1 rounded-full bg-neon-amber" />
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass w-full max-w-sm p-8 rounded-[2rem] space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-amber to-neon-cyan" />
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Admin <span className="text-neon-amber">Access</span></h2>
                <p className="text-xs text-white/40 font-mono">KHUSUS BOS INDRA FURNITURE</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-2">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-neon-amber transition-all"
                    placeholder="Nama Bos..."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-2">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-neon-amber transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-neon-amber text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,157,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  MASUK BOSKU
                </button>
              </form>

              <button 
                onClick={() => setShowLogin(false)}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all"
              >
                KEMBALI KE KATALOG
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => contactWA()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-neon-cyan flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,242,255,0.5)] sm:hidden"
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </div>
  );
}
