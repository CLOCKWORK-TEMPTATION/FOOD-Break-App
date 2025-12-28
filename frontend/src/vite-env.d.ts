/// <reference types="vite/client" />

// تعريف متغيرات البيئة لـ Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // أضف متغيرات بيئة أخرى حسب الحاجة
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
