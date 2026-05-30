import { fetchPublicPage } from "../../lib/api";
import PPDBForm from "./PPDBForm";

export default async function PPDBPage() {
  const [hero, form] = await Promise.all([
    fetchPublicPage("ppdb-hero"),
    fetchPublicPage("ppdb-form"),
  ]);

  const heroEyebrow = hero?.meta_title || "Penerimaan Siswa Baru";
  const heroTitle = hero?.title || "Formulir PPDB yang lebih jelas, cepat, dan ramah untuk orang tua.";
  const heroContent = hero?.content || "<p>Halaman ini menjadi titik masuk resmi untuk calon siswa. Form dirancang sesederhana mungkin agar proses pendaftaran terasa ringan namun tetap rapi secara administratif.</p>";

  const formEyebrow = form?.meta_title || "Formulir";
  const formTitle = form?.title || "";
  const formContent = form?.content || "";

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
