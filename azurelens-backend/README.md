# AzureLens — Backend

## هيكل المشروع

```
azurelens-backend/
├── index.js          ← نقطة البداية — شغّل المشروع من هنا
├── db.js             ← قاعدة البيانات — لا تغيّر شيئاً
├── .env              ← ⚠️ أضف بياناتك هنا (انظر الخطوات أدناه)
├── .env.example      ← نموذج لملف .env
├── package.json      ← قائمة المكتبات
├── services/
│   └── azure.js      ← كود الاتصال بـ Azure API
└── routes/
    └── api.js        ← كل الـ API Endpoints
```

---

## الخطوات (من الصفر)

### 1. تثبيت Node.js
إذا لم يكن مثبتاً: https://nodejs.org — حمّل النسخة LTS

### 2. تثبيت المكتبات
```bash
cd azurelens-backend
npm install
```

### 3. إعداد ملف .env
انسخ الملف:
```bash
cp .env.example .env
```
ثم افتح `.env` وأضف قيمك الحقيقية (انظر الخطوة التالية).

### 4. الحصول على بيانات Azure

اذهب إلى: https://portal.azure.com

**الخطوة أ — إنشاء App Registration:**
1. ابحث عن "App registrations" في الـ search bar
2. اضغط "New registration"
3. أعطِه اسماً مثل "azurelens-app"
4. اضغط Register
5. انسخ **Application (client) ID** → ضعه في `AZURE_CLIENT_ID`
6. انسخ **Directory (tenant) ID** → ضعه في `AZURE_TENANT_ID`

**الخطوة ب — إنشاء Client Secret:**
1. من نفس الصفحة، اضغط "Certificates & secrets"
2. اضغط "New client secret"
3. أعطه وصفاً واختر مدة (24 months مثلاً)
4. اضغط Add — **انسخ القيمة فوراً** (لن تظهر مرة ثانية)
5. ضعها في `AZURE_CLIENT_SECRET`

**الخطوة ج — الحصول على Subscription ID:**
1. ابحث عن "Subscriptions" في الـ search bar
2. انسخ الـ ID → ضعه في `AZURE_SUBSCRIPTION_ID`

**الخطوة د — إعطاء الصلاحيات (Reader):**
1. اذهب إلى Subscriptions → اختر subscription الخاص بك
2. اضغط "Access control (IAM)"
3. اضغط "Add role assignment"
4. اختر Role: **Reader**
5. في Members، ابحث عن اسم الـ App ("azurelens-app")
6. اضغط Save

### 5. تشغيل المشروع
```bash
node index.js
```

ستشوف:
```
🚀 AzureLens Backend running on http://localhost:3001
```

### 6. أول scan
```bash
curl -X POST http://localhost:3001/api/scan
```
أو من المتصفح افتح: http://localhost:3001/api/summary

---

## API Endpoints

| Method | URL | الوصف |
|--------|-----|-------|
| GET | /api/summary | إحصائيات عامة للداشبورد |
| GET | /api/waste | قائمة الـ waste items |
| GET | /api/waste?type=idle | فلترة حسب النوع |
| GET | /api/waste?severity=high | فلترة حسب الأولوية |
| GET | /api/resources | كل الـ resources |
| GET | /api/history | سجل الـ scans |
| POST | /api/scan | تشغيل scan جديد |

---

## ربط Lovable بالـ Backend

في كود Lovable، استبدل البيانات الثابتة بـ:

```javascript
// جلب الإحصائيات
const res = await fetch('http://localhost:3001/api/summary');
const summary = await res.json();

// جلب قائمة الـ waste
const res2 = await fetch('http://localhost:3001/api/waste');
const wasteItems = await res2.json();
```

---

## ملاحظات مهمة

- ملف `.env` سري — لا ترفعه على GitHub أبداً
- الـ `.gitignore` موجود ويحمي الملفات السرية تلقائياً
- قاعدة البيانات `azurelens.db` تُنشأ تلقائياً عند أول تشغيل
