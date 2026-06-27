import { formatDateTime, getYokohamaWindData } from "@/lib/open-meteo";

export const dynamic = "force-dynamic";

const toneClasses = {
  calm: "border-emerald-200 bg-emerald-50 text-emerald-800",
  notice: "border-sky-200 bg-sky-50 text-sky-800",
  caution: "border-amber-200 bg-amber-50 text-amber-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  danger: "border-red-200 bg-red-50 text-red-800"
};

export default async function Home() {
  const data = await getYokohamaWindData();

  return (
    <main className="min-h-svh px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-bay-700">横浜 風速・防災ナウ</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-normal text-slate-950 sm:text-4xl">
              横浜市の現在風速
            </h1>
          </div>
          <div className="shrink-0 rounded-lg border border-bay-100 bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-bold text-bay-700">OSS</p>
            <p className="text-[11px] text-slate-500">Civic Tech</p>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="px-5 py-7 text-center sm:px-8 sm:py-10">
            {data.ok ? (
              <>
                <p className="text-sm font-bold text-slate-500">横浜市中心部の風速</p>
                <div className="mt-4 flex items-end justify-center gap-2">
                  <span className="text-7xl font-black leading-none tracking-normal text-slate-950 sm:text-8xl">
                    {data.windSpeed.toFixed(1)}
                  </span>
                  <span className="pb-2 text-2xl font-extrabold text-slate-600">{data.windSpeedUnit}</span>
                </div>
                <div
                  className={`mx-auto mt-5 inline-flex max-w-full rounded-full border px-4 py-2 text-base font-extrabold ${toneClasses[data.safetyLevel.tone]}`}
                >
                  {data.safetyLevel.label}
                </div>
              </>
            ) : (
              <div className="py-10">
                <p className="text-3xl font-black leading-tight text-slate-900">現在データを取得できません</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  通信状況やデータ提供元の状態を確認して、少し時間をおいて再読み込みしてください。
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 border-t border-slate-200 bg-slate-50 sm:grid-cols-3">
            <InfoBlock label="風向" value={data.ok ? `${data.windDirectionText}（${Math.round(data.windDirectionDegree)}°）` : "不明"} />
            <InfoBlock label="取得時刻" value={data.ok ? formatDateTime(data.observedAt) : formatDateTime(data.fetchedAt)} />
            <InfoBlock label="データソース" value={data.source} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-950">防災メモ</h2>
          <p className="mt-3 text-base font-bold leading-7 text-slate-800">
            {data.ok ? data.safetyLevel.memo : "風速データが取得できないため、公式情報や周囲の状況を確認してください。"}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <p className="rounded-lg bg-slate-50 p-3">自転車やベビーカーは横風でふらつきやすくなります。</p>
            <p className="rounded-lg bg-slate-50 p-3">海沿い、橋の上、高層ビル周辺では体感風速が強くなることがあります。</p>
            <p className="rounded-lg bg-slate-50 p-3">車のドア開閉や子どもの送迎時は、突風に注意してください。</p>
            <p className="rounded-lg bg-slate-50 p-3">観光やイベント前の外出判断にも使えます。</p>
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-950">
          これは避難情報ではなく、外出判断の補助情報です。警報、避難情報、交通情報が必要な場合は、気象庁・横浜市・交通機関などの公式情報を確認してください。
        </section>

        <footer className="pb-4 text-xs leading-6 text-slate-500">
          <p>最終更新時刻: {formatDateTime(data.fetchedAt)}</p>
          <p>
            地点: 横浜市中心部 latitude={data.latitude}, longitude={data.longitude}
          </p>
          <p>データソース: {data.source}</p>
        </footer>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold text-slate-950">{value}</p>
    </div>
  );
}
