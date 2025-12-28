# BreakApp Frontend

لوحة تحكم الإدارة لتطبيق BreakApp.

## التقنيات المستخدمة

- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - للبرمجة الآمنة بالنوع
- **Vite** - أداة البناء السريعة
- **CSS Modules** - للتصميم المعزول

## التثبيت

```bash
npm install
```

## التشغيل

```bash
# وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة الإنتاج
npm run preview
```

## البنية

```
frontend/
├── src/
│   ├── pages/              # صفحات التطبيق
│   │   └── AdminDashboard.tsx
│   ├── main.tsx            # نقطة الدخول
│   ├── index.css           # الأنماط العامة
│   └── vite-env.d.ts       # تعريفات Vite
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## التطوير

المشروع يستخدم Vite كأداة بناء، مما يوفر:
- Hot Module Replacement (HMR) سريع
- TypeScript دعم مباشر
- CSS Modules دعم كامل

## البيئة

تأكد من أن Backend يعمل على `http://localhost:3000`، أو قم بتعديل `vite.config.ts` لإعداد proxy مختلف.

