// اسم الكاش - غيّره لو عدّلت الملفات الأساسية عشان يعمل تحديث
const CACHE_NAME = "gis-tool-cache-v1";

// الملفات الأساسية اللي هتتخزن عشان الأداة تفتح حتى من غير نت
// عدّل القائمة دي حسب أسماء ملفاتك الفعلية (JS, CSS, إلخ)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// وقت التثبيت: نخزن الملفات الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// وقت التفعيل: نمسح أي كاش قديم من نسخة سابقة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// عند كل طلب: نجرب الشبكة الأول، ولو فشلت نرجع للكاش
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
