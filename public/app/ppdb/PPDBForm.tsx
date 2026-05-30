"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export default function PPDBForm({
  heroEyebrow,
  heroTitle,
  heroContent,
  formEyebrow,
  formTitle,
  formContent
}: {
  heroEyebrow: string;
  heroTitle: string;
  heroContent: string;
  formEyebrow: string;
  formTitle: string;
  formContent: string;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "",
    nisn: "",
    birth_date: "",
    gender: "",
    religion: "",
    place_of_birth: "",
    address: "",
    previous_school: "",
    father_name: "",
    father_occupation: "",
    father_phone: "",
    mother_name: "",
    mother_occupation: "",
    mother_phone: "",
    parent_phone: "",
    parent_income: "",
    document_kk: "",
    document_akta: "",
  });

  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("document", file);

    setIsUploading(true);
    setStatus("Mengupload dokumen...");
    try {
      const res = await fetch(`${API_BASE}/public/ppdb/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengupload");
      setForm(prev => ({ ...prev, [fieldName]: data.document_url }));
      setStatus("Dokumen berhasil diupload.");
    } catch (err: any) {
      setStatus(err.message || "Gagal mengupload dokumen");
    } finally {
      setIsUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!form.full_name || !form.nisn || !form.birth_date)) {
      setStatus("Mohon lengkapi Nama, NISN, dan Tanggal Lahir.");
      return;
    }
    if (step === 3 && !form.parent_phone) {
      setStatus("Mohon lengkapi No. HP Aktif Orang Tua / Wali.");
      return;
    }
    setStatus("");
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setStatus("");
    setStep(s => s - 1);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setStatus("Jawaban Captcha salah. Coba lagi.");
      generateCaptcha();
      return;
    }

    let pPhone = form.parent_phone || form.father_phone || form.mother_phone;

    setStatus("Mengirim formulir pendaftaran...");
    try {
      const res = await fetch(`${API_BASE}/public/ppdb/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parent_phone: pPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal mendaftar");
      setStatus(`Pendaftaran berhasil! Nomor pendaftaran Anda: ${data.registration_no || "-"}`);
      setStep(6);
    } catch (err: any) {
      setStatus(err.message || "Pendaftaran gagal");
    }
  };

  return (
    <div className="container section--spacious">
      <section className="ppdb-shell">
        <div className="ppdb-copy">
          <span className="eyebrow">{heroEyebrow}</span>
          <h1 style={{ margin: "18px 0 14px", fontSize: "clamp(38px, 5vw, 62px)", lineHeight: 0.95, letterSpacing: "-0.06em" }}>
            {heroTitle}
          </h1>
          <div className="muted" dangerouslySetInnerHTML={{ __html: heroContent }} />
          <div className="tag-row">
            <span className="tag">Step {Math.min(step, 5)} of 5</span>
            <span className="tag">Registrasi Online Lengkap</span>
          </div>
        </div>

        <div className="panel">
          {step === 6 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h2 style={{ color: "var(--brand)" }}>Berhasil!</h2>
              <p style={{ fontSize: 18 }}>{status}</p>
              <p className="muted" style={{ marginTop: 16 }}>Silakan simpan nomor pendaftaran ini untuk mengecek status PPDB Anda di kemudian hari.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {/* STEP 1: DATA SISWA */}
              {step === 1 && (
                <div>
                  <div className="form-grid">
                    <div className="span-2">
                      <label>Nama Lengkap *</label>
                      <input value={form.full_name} onChange={e => setForm(x => ({ ...x, full_name: e.target.value }))} required />
                    </div>
                    <div>
                      <label>NISN *</label>
                      <input value={form.nisn} onChange={e => setForm(x => ({ ...x, nisn: e.target.value }))} required />
                    </div>
                    <div>
                      <label>Tanggal Lahir *</label>
                      <input type="date" value={form.birth_date} onChange={e => setForm(x => ({ ...x, birth_date: e.target.value }))} required />
                    </div>
                    <div>
                      <label>Tempat Lahir</label>
                      <input value={form.place_of_birth} onChange={e => setForm(x => ({ ...x, place_of_birth: e.target.value }))} />
                    </div>
                    <div>
                      <label>Jenis Kelamin</label>
                      <select value={form.gender} onChange={e => setForm(x => ({ ...x, gender: e.target.value }))}>
                        <option value="">-- Pilih --</option>
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="span-2">
                      <label>Agama</label>
                      <input value={form.religion} onChange={e => setForm(x => ({ ...x, religion: e.target.value }))} />
                    </div>
                    <div className="span-2">
                      <label>Alamat Lengkap</label>
                      <textarea rows={3} value={form.address} onChange={e => setForm(x => ({ ...x, address: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ASAL SEKOLAH */}
              {step === 2 && (
                <div>
                  <div className="form-grid">
                    <div className="span-2">
                      <label>Nama Sekolah Asal</label>
                      <input value={form.previous_school} onChange={e => setForm(x => ({ ...x, previous_school: e.target.value }))} placeholder="Cth: SMPN 1 Jakarta" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DATA ORANG TUA */}
              {step === 3 && (
                <div>
                  <div className="form-grid">
                    <div className="span-2">
                      <label>No. HP Aktif Orang Tua / Wali *</label>
                      <input value={form.parent_phone} onChange={e => setForm(x => ({ ...x, parent_phone: e.target.value }))} required placeholder="Cth: 081234567890" />
                    </div>

                    <div style={{ gridColumn: "1 / -1", height: 16 }}></div>

                    <div>
                      <label>Nama Ayah</label>
                      <input value={form.father_name} onChange={e => setForm(x => ({ ...x, father_name: e.target.value }))} />
                    </div>
                    <div>
                      <label>Pekerjaan Ayah</label>
                      <input value={form.father_occupation} onChange={e => setForm(x => ({ ...x, father_occupation: e.target.value }))} />
                    </div>
                    <div>
                      <label>No. HP Ayah</label>
                      <input value={form.father_phone} onChange={e => setForm(x => ({ ...x, father_phone: e.target.value }))} />
                    </div>

                    <div style={{ gridColumn: "1 / -1", height: 16 }}></div>

                    <div>
                      <label>Nama Ibu</label>
                      <input value={form.mother_name} onChange={e => setForm(x => ({ ...x, mother_name: e.target.value }))} />
                    </div>
                    <div>
                      <label>Pekerjaan Ibu</label>
                      <input value={form.mother_occupation} onChange={e => setForm(x => ({ ...x, mother_occupation: e.target.value }))} />
                    </div>
                    <div>
                      <label>No. HP Ibu</label>
                      <input value={form.mother_phone} onChange={e => setForm(x => ({ ...x, mother_phone: e.target.value }))} />
                    </div>

                    <div className="span-2" style={{ marginTop: 16 }}>
                      <label>Rata-rata Penghasilan Orang Tua</label>
                      <select value={form.parent_income} onChange={e => setForm(x => ({ ...x, parent_income: e.target.value }))}>
                        <option value="">-- Pilih Penghasilan --</option>
                        <option value="< 2.000.000">Kurang dari Rp 2.000.000</option>
                        <option value="2.000.000 - 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                        <option value="5.000.000 - 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                        <option value="> 10.000.000">Lebih dari Rp 10.000.000</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: UPLOAD DOKUMEN */}
              {step === 4 && (
                <div>
                  <div className="form-grid">
                    <div className="span-2">
                      <label>Kartu Keluarga (PDF/JPG/PNG max 5MB)</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileUpload(e, "document_kk")} disabled={isUploading} />
                      {form.document_kk && <p style={{ color: "green", fontSize: 13, marginTop: 4 }}>✓ Dokumen KK terupload</p>}
                    </div>
                    <div className="span-2">
                      <label>Akte Kelahiran (PDF/JPG/PNG max 5MB)</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileUpload(e, "document_akta")} disabled={isUploading} />
                      {form.document_akta && <p style={{ color: "green", fontSize: 13, marginTop: 4 }}>✓ Dokumen Akte terupload</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: CAPTCHA & SUBMIT */}
              {step === 5 && (
                <div>
                  <p className="muted" style={{ marginBottom: 16 }}>Pastikan semua data sudah benar. Setelah dikirim, data akan masuk ke panitia PPDB.</p>
                  <div className="form-grid">
                    <div className="span-2">
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
                </div>
              )}

              <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
                {step > 1 && (
                  <button type="button" className="btn btn-outline" onClick={prevStep} disabled={isUploading}>
                    Kembali
                  </button>
                )}

                {step < 5 ? (
                  <button type="button" className="btn" onClick={nextStep} disabled={isUploading}>
                    Selanjutnya
                  </button>
                ) : (
                  <button type="submit" className="btn" disabled={isUploading || !captchaAnswer}>
                    {isUploading ? "Memproses..." : "Kirim Pendaftaran"}
                  </button>
                )}
              </div>

              {status && step !== 6 && <div className="status-message" style={{ marginTop: 16 }}>{status}</div>}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
