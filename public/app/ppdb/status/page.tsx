"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export default function PPDBStatusPage() {
  const [form, setForm] = useState({ nisn: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  // Captcha state
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer("");
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nisn) {
      setError("Silakan masukkan NISN Anda.");
      return;
    }
    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setError("Jawaban Captcha salah. Coba lagi.");
      generateCaptcha();
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/public/ppdb/status?nisn=${form.nisn}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Data tidak ditemukan");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memeriksa status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'baru': return <span style={{ color: "#3b82f6", fontWeight: "bold", background: "#eff6ff", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>BARU</span>;
      case 'verifikasi_berkas': return <span style={{ color: "#a16207", fontWeight: "bold", background: "#fef08a", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>VERIFIKASI BERKAS</span>;
      case 'lulus': return <span style={{ color: "#047857", fontWeight: "bold", background: "#d1fae5", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>LULUS</span>;
      case 'cadangan': return <span style={{ color: "#c2410c", fontWeight: "bold", background: "#ffedd5", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>CADANGAN</span>;
      case 'ditolak': return <span style={{ color: "#b91c1c", fontWeight: "bold", background: "#fee2e2", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>DITOLAK</span>;
      case 'daftar_ulang': return <span style={{ color: "#6d28d9", fontWeight: "bold", background: "#ede9fe", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>DAFTAR ULANG SELESAI</span>;
      default: return <span style={{ color: "#374151", fontWeight: "bold", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>{(status || "DRAFT").toUpperCase().replace('_', ' ')}</span>;
    }
  }

  return (
    <div className="container section--spacious">
      <section className="ppdb-shell">
        <div className="ppdb-copy">
          <span className="eyebrow">Cek Status</span>
          <h1 style={{ margin: "18px 0 14px", fontSize: "clamp(38px, 5vw, 62px)", lineHeight: 0.95, letterSpacing: "-0.06em" }}>
            Status Pendaftaran
          </h1>
          <div className="muted">
            <p>Masukkan NISN yang Anda gunakan saat mendaftar untuk melihat hasil seleksi dan status berkas Anda.</p>
          </div>
          <div className="tag-row" style={{ marginTop: 24 }}>
            <Link href="/ppdb" className="btn btn-outline" style={{ textDecoration: 'none' }}>
              ← Kembali ke Pendaftaran
            </Link>
          </div>
        </div>

        <div className="panel">
          {!result ? (
            <form onSubmit={handleCheck}>
              <div className="form-grid">
                <div className="span-2">
                  <label>NISN (Nomor Induk Siswa Nasional)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 0012345678" 
                    value={form.nisn} 
                    onChange={e => setForm({ nisn: e.target.value })} 
                    required 
                  />
                </div>
                <div className="span-2" style={{ marginTop: 12 }}>
                  <label>Verifikasi Keamanan: Berapa hasil {captchaNum1} + {captchaNum2}?</label>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    placeholder="Masukkan angka jawaban"
                    required
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 22 }}>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Memeriksa..." : "Cek Status"}
                </button>
              </div>

              {error && <div className="status-message" style={{ marginTop: 16, color: "red" }}>{error}</div>}
            </form>
          ) : (
            <div>
              <h2 style={{ marginBottom: 20 }}>Hasil Pencarian</h2>
              
              <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>NISN</span>
                  <strong>{result.nisn || "-"}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>Nama Calon Siswa</span>
                  <strong>{result.full_name}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>Asal Sekolah</span>
                  <strong>{result.previous_school || "-"}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>Status Saat Ini</span>
                  <div style={{ fontSize: 18, marginTop: 4 }}>{getStatusBadge(result.status)}</div>
                </div>
                {result.notes_panitia && (
                  <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderLeft: "4px solid #ffc107", borderRadius: 4 }}>
                    <span className="muted" style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Catatan Panitia:</span>
                    <p style={{ margin: 0, fontSize: 14 }}>{result.notes_panitia}</p>
                  </div>
                )}
              </div>
              
              <button type="button" className="btn btn-outline" onClick={() => { setResult(null); setForm({nisn: ""}); }}>
                Cek Data Lain
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
