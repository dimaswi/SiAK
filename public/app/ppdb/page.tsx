import PPDBForm from "./PPDBForm";
import { fetchSiteConfig } from "../../lib/api";

export default async function PPDBPage() {
  const config = await fetchSiteConfig();

  const heroEyebrow = "Penerimaan Siswa Baru";
  const heroTitle = config?.hero_title || "Formulir PPDB yang lebih jelas, cepat, dan ramah untuk orang tua.";
  const heroContent = "<p>Halaman ini menjadi titik masuk resmi untuk calon siswa. Form dirancang sesederhana mungkin agar proses pendaftaran terasa ringan namun tetap rapi secara administratif.</p>";

  const formEyebrow = "Formulir";
  const formTitle = "Isi Data Diri";
  const formContent = "Lengkapi data di bawah ini dengan benar.";

  return (
    <PPDBForm
      heroEyebrow={heroEyebrow}
      heroTitle={heroTitle}
      heroContent={heroContent}
      formEyebrow={formEyebrow}
      formTitle={formTitle}
      formContent={formContent}
    />
  );
}
