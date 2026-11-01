export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">Jareb</p>
        <h1 className="mt-3 text-4xl font-black">الملف الشخصي</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">التصنيفات</p>
            <p className="mt-3 text-3xl font-bold text-sky-400">6</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">المصادر</p>
            <p className="mt-3 text-3xl font-bold text-sky-400">12</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">المفضلة</p>
            <p className="mt-3 text-3xl font-bold text-sky-400">24</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h2 className="text-xl font-bold">الفوائد الحالية</h2>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li>• دعم RSS مخصص حسب المجال</li>
            <li>• فلترة حسب البرمجة، الذكاء الاصطناعي، الأخبار، الفيديوهات</li>
            <li>• حفظ المفضلة لكل مستخدم</li>
            <li>• واجهة جاهزة للتوسيع لاحقًا</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
