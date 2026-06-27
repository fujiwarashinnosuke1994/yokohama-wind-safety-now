import { getYokohamaWindData } from "@/lib/open-meteo";
import { WindDashboard } from "./wind-dashboard";

export const dynamic = "force-dynamic";

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
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-600">
              強風時の外出、自転車、海沿い移動、子どもの送迎、車の運転判断を助ける外出判断の補助ツールです。
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-bay-100 bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-bold text-bay-700">OSS</p>
            <p className="text-[11px] text-slate-500">Civic Tech</p>
          </div>
        </header>

        <WindDashboard initialData={data} />
      </div>
    </main>
  );
}
