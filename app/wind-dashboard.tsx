"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { WindData } from "@/lib/open-meteo";
import { formatDateTime, formatDateTimeWithSeconds } from "@/lib/open-meteo";

const AUTO_REFRESH_SECONDS = 60;

const toneClasses = {
  calm: "border-emerald-200 bg-emerald-50 text-emerald-800",
  notice: "border-sky-200 bg-sky-50 text-sky-800",
  caution: "border-amber-200 bg-amber-50 text-amber-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  danger: "border-red-200 bg-red-50 text-red-800"
};

type WindDashboardProps = {
  initialData: WindData;
};

export function WindDashboard({ initialData }: WindDashboardProps) {
  const [data, setData] = useState<WindData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(AUTO_REFRESH_SECONDS);
  const isRefreshingRef = useRef(false);

  const refreshWindData = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/wind", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to refresh wind data.");
      }

      const nextData = (await response.json()) as WindData;
      setData(nextData);
    } catch {
      setData({
        ok: false,
        fetchedAt: new Date().toISOString(),
        source: "Open-Meteo",
        latitude: 35.4437,
        longitude: 139.638
      });
    } finally {
      setRemainingSeconds(AUTO_REFRESH_SECONDS);
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setRemainingSeconds((seconds) => (seconds <= 1 ? AUTO_REFRESH_SECONDS : seconds - 1));
    }, 1000);

    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshWindData();
      }
    }, AUTO_REFRESH_SECONDS * 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearInterval(refreshTimer);
    };
  }, [refreshWindData]);

  return (
    <>
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
              <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-600">
                {data.safetyLevel.memo}
              </p>
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-lg bg-bay-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-bay-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isRefreshing}
            type="button"
            onClick={() => void refreshWindData()}
          >
            {isRefreshing ? "更新中..." : "最新の風速を取得"}
          </button>
          <div className="text-sm leading-6 text-slate-600">
            <p className="font-bold text-slate-800">最終更新：{formatDateTimeWithSeconds(data.fetchedAt)}</p>
            <p>自動更新まで：{remainingSeconds}秒</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          このアプリは60秒ごとに最新データを取得します。観測値の更新頻度はデータ提供元に依存します。
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-950">過去60分の風速推移</h2>
        {data.ok && data.history.length > 0 ? (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={formatChartData(data.history)} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={18} stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis
                  domain={[0, "dataMax + 1"]}
                  label={{ value: "m/s", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12 }}
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(2)} m/s`, "風速"]}
                  labelFormatter={(label) => `時刻 ${label}`}
                />
                <Bar dataKey="windSpeed" isAnimationActive={false} radius={[6, 6, 0, 0]}>
                  {data.history.map((point) => (
                    <Cell fill={getBarColor(point.windSpeed)} key={`${point.time}-${point.windSpeed}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
            過去60分の推移データを取得できません
          </p>
        )}
        <p className="mt-3 text-xs leading-6 text-slate-500">
          赤色は強風域の目安です。実際の危険性は周囲の状況、地形、建物、交通状況によって変わります。
        </p>
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
        <p>最終更新時刻: {formatDateTimeWithSeconds(data.fetchedAt)}</p>
        <p>
          地点: 横浜市中心部 latitude={data.latitude}, longitude={data.longitude}
        </p>
        <p>データソース: {data.source}</p>
      </footer>
    </>
  );
}

function getBarColor(windSpeed: number) {
  if (windSpeed >= 15) {
    return "#991b1b";
  }

  if (windSpeed >= 10) {
    return "#ef4444";
  }

  return "#0f766e";
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function formatChartData(history: Array<{ time: string; windSpeed: number }>) {
  return history.map((point) => ({
    ...point,
    label: formatChartTime(point.time)
  }));
}

function formatChartTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
