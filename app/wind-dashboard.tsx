"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DailyForecast, SafetyTone, TrendPeriod, WindData, WindTrendData } from "@/lib/open-meteo";
import { formatDateTime, formatDateTimeWithSeconds, getWindColor } from "@/lib/open-meteo";

const AUTO_REFRESH_SECONDS = 60;

const toneClasses = {
  calm: "border-emerald-200 bg-emerald-50 text-emerald-800",
  notice: "border-sky-200 bg-sky-50 text-sky-800",
  caution: "border-yellow-200 bg-yellow-50 text-yellow-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  danger: "border-red-200 bg-red-50 text-red-800",
  extreme: "border-purple-200 bg-purple-50 text-purple-800"
};

const tonePanelClasses: Record<SafetyTone, string> = {
  calm: "border-emerald-200 bg-emerald-50",
  notice: "border-sky-200 bg-sky-50",
  caution: "border-yellow-200 bg-yellow-50",
  warning: "border-orange-200 bg-orange-50",
  danger: "border-red-200 bg-red-50",
  extreme: "border-purple-200 bg-purple-50"
};

const toneLabel: Record<SafetyTone, string> = {
  calm: "通常",
  notice: "やや注意",
  caution: "注意",
  warning: "強風・雨に注意",
  danger: "危険度高め",
  extreme: "非常に危険"
};

const periodLabels: Record<TrendPeriod, string> = {
  "60m": "過去60分",
  "12h": "過去12時間",
  "30d": "過去30日"
};

const targetCards = [
  {
    title: "子育て世帯",
    body: "お子様の送迎、ベビーカー移動、公園や習い事前の確認"
  },
  {
    title: "中学生・高校生",
    body: "登校、下校、塾への移動、部活動前後の確認"
  },
  {
    title: "保護者様",
    body: "通学・通塾・送迎時の判断補助"
  },
  {
    title: "通勤者",
    body: "駅までの移動、自転車通勤、強風時の外出判断"
  },
  {
    title: "車を運転する方",
    body: "車のドア開閉、橋や海沿い道路、飛来物リスクの把握"
  },
  {
    title: "横浜観光・海沿い移動",
    body: "みなとみらい、山下公園、横浜港周辺の移動判断"
  }
];

type WindDashboardProps = {
  initialData: WindData;
};

export function WindDashboard({ initialData }: WindDashboardProps) {
  const [data, setData] = useState<WindData>(initialData);
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("60m");
  const [trendData, setTrendData] = useState<WindTrendData>(() => trendFromWindData(initialData));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(AUTO_REFRESH_SECONDS);
  const isRefreshingRef = useRef(false);

  const refreshTrendData = useCallback(async (period: TrendPeriod) => {
    if (period === "60m") {
      setTrendData(trendFromWindData(data));
      return;
    }

    setIsTrendLoading(true);

    try {
      const response = await fetch(`/api/trend?period=${period}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to refresh trend data.");
      }

      const nextTrendData = (await response.json()) as WindTrendData;
      setTrendData(nextTrendData);
    } catch {
      setTrendData({
        ok: false,
        fetchedAt: new Date().toISOString(),
        source: "Open-Meteo",
        period
      });
    } finally {
      setIsTrendLoading(false);
    }
  }, [data]);

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

      if (selectedPeriod === "60m") {
        setTrendData(trendFromWindData(nextData));
      }
    } catch {
      const failedData: WindData = {
        ok: false,
        fetchedAt: new Date().toISOString(),
        source: "Open-Meteo",
        latitude: 35.4437,
        longitude: 139.638
      };
      setData(failedData);

      if (selectedPeriod === "60m") {
        setTrendData(trendFromWindData(failedData));
      }
    } finally {
      setRemainingSeconds(AUTO_REFRESH_SECONDS);
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [selectedPeriod]);

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

  useEffect(() => {
    void refreshTrendData(selectedPeriod);
  }, [refreshTrendData, selectedPeriod]);

  const chartPoints = useMemo(
    () => (trendData.ok ? formatChartData(trendData.points, trendData.period) : []),
    [trendData]
  );

  return (
    <>
      <section className="rounded-lg border border-bay-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-extrabold text-bay-700">開発：株式会社数強塾 / 藤原進之介</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          株式会社数強塾 代表 藤原進之介が、通学・送迎・外出判断の補助を目的として開発した防災・Civic Techアプリです。
        </p>
      </section>

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

      {data.ok ? (
        <section className={`rounded-lg border p-5 shadow-sm sm:p-6 ${tonePanelClasses[data.currentWeather.attentionTone]}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-bay-700">横浜市の現在天気</p>
              <h2 className="mt-2 flex items-center gap-3 text-2xl font-black text-slate-950">
                <span className="text-4xl" aria-hidden="true">{data.currentWeather.weatherIcon}</span>
                <span>{data.currentWeather.weatherDescription}</span>
              </h2>
              <p className="mt-2 text-xs font-bold text-slate-500">
                注意度：{toneLabel[data.currentWeather.attentionTone]} / 取得時刻：{formatDateTime(data.currentWeather.observedAt)}
              </p>
            </div>
            <p className="rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm">
              外出判断補助
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <WeatherInfoBlock label="気温" value={`${data.currentWeather.temperature.toFixed(1)}℃`} />
            <WeatherInfoBlock label="体感温度" value={`${data.currentWeather.apparentTemperature.toFixed(1)}℃`} />
            <WeatherInfoBlock label="降水量" value={`${data.currentWeather.precipitation.toFixed(1)}mm`} />
            <WeatherInfoBlock label="降水確率" value={`${Math.round(data.currentWeather.precipitationProbability)}%`} />
            <WeatherInfoBlock label="雲量" value={`${Math.round(data.currentWeather.cloudCover)}%`} />
            <WeatherInfoBlock label="風速" value={`${data.windSpeed.toFixed(1)}m/s`} />
            <WeatherInfoBlock label="風向" value={data.windDirectionText} />
            <WeatherInfoBlock label="最大瞬間風速" value={`${data.currentWeather.windGusts.toFixed(1)}m/s`} />
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-600">
            降水確率は当日予報の最大値を表示しています。観測値や予報の更新頻度・粒度は提供元に依存します。
          </p>
        </section>
      ) : null}

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
        <h2 className="text-lg font-extrabold text-slate-950">こんな場面で役立ちます</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {targetCards.map((card) => (
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={card.title}>
              <h3 className="text-sm font-extrabold text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {data.ok ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">8日後までの天気予報</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                通学・通塾・送迎・通勤・車の運転判断の補助として確認できます。公式情報の代替ではありません。
              </p>
            </div>
          </div>
          {data.dailyForecast.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.dailyForecast.map((forecast) => (
                <ForecastCard forecast={forecast} key={forecast.date} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
              8日後までの予報を取得できません
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold text-slate-950">過去60分の風速推移</h2>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
            {(["60m", "12h", "30d"] as TrendPeriod[]).map((period) => (
              <button
                className={`rounded-md px-3 py-2 text-xs font-extrabold transition ${
                  selectedPeriod === period ? "bg-white text-bay-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          データの更新頻度・粒度は提供元に依存します。
        </p>
        {isTrendLoading ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">読み込み中...</p>
        ) : trendData.ok && chartPoints.length > 0 ? (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer height="100%" width="100%">
              {selectedPeriod === "60m" ? (
                <BarChart data={chartPoints} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
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
                    {trendData.points.map((point) => (
                      <Cell fill={getWindColor(point.windSpeed)} key={`${point.time}-${point.windSpeed}`} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartPoints} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <ReferenceArea y1={10} y2={15} fill="#fed7aa" fillOpacity={0.35} />
                  <ReferenceArea y1={15} fill="#fecaca" fillOpacity={0.35} />
                  <ReferenceLine label={{ value: "10m/s", fill: "#c2410c", fontSize: 11 }} stroke="#f97316" y={10} />
                  <ReferenceLine label={{ value: "15m/s", fill: "#b91c1c", fontSize: 11 }} stroke="#dc2626" y={15} />
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
                  <Line
                    dataKey="windSpeed"
                    dot={{ r: 2, strokeWidth: 2 }}
                    isAnimationActive={false}
                    stroke="#0f766e"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
            この期間の推移データを取得できません
          </p>
        )}
        <p className="mt-3 text-xs leading-6 text-slate-500">
          10m/s以上は強風注意域の目安、15m/s以上は危険域の目安として強調しています。実際の危険性は周囲の状況、地形、建物、交通状況によって変わります。
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-950">防災メモ</h2>
        <p className="mt-3 text-base font-bold leading-7 text-slate-800">
          {data.ok ? data.safetyLevel.memo : "風速データが取得できないため、公式情報や周囲の状況を確認してください。"}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
          <p className="rounded-lg bg-slate-50 p-3">青は危険表示ではなく「やや風あり」の情報表示です。</p>
          <p className="rounded-lg bg-slate-50 p-3">海沿い、橋の上、高層ビル周辺では体感風速が強くなることがあります。</p>
          <p className="rounded-lg bg-slate-50 p-3">車のドア開閉や子どもの送迎時は、突風や飛来物に注意してください。</p>
          <p className="rounded-lg bg-slate-50 p-3">通学・通塾・習い事・観光前の確認にも使えます。</p>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-950">
        これは避難情報ではなく、外出判断の補助情報です。「運転できる」「外出して安全」と断定するものではありません。警報、避難情報、交通情報が必要な場合は、気象庁・横浜市・交通機関などの公式情報を確認してください。
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

function trendFromWindData(data: WindData): WindTrendData {
  if (!data.ok || data.history.length === 0) {
    return {
      ok: false,
      fetchedAt: data.fetchedAt,
      source: "Open-Meteo",
      period: "60m"
    };
  }

  return {
    ok: true,
    fetchedAt: data.fetchedAt,
    source: data.source,
    period: "60m",
    points: data.history
  };
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function WeatherInfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 p-3 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: DailyForecast }) {
  return (
    <article className={`rounded-lg border p-4 ${tonePanelClasses[forecast.attentionTone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-950">
            {formatForecastDate(forecast.date)}（{formatWeekday(forecast.date)}）
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">注意度：{toneLabel[forecast.attentionTone]}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl" aria-hidden="true">{forecast.weatherIcon}</p>
          <p className="text-xs font-extrabold text-slate-700">{forecast.weatherDescription}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <WeatherInfoBlock label="最高気温" value={`${forecast.temperatureMax.toFixed(1)}℃`} />
        <WeatherInfoBlock label="最低気温" value={`${forecast.temperatureMin.toFixed(1)}℃`} />
        <WeatherInfoBlock label="降水確率" value={`${Math.round(forecast.precipitationProbabilityMax)}%`} />
        <WeatherInfoBlock label="降水量" value={`${forecast.precipitationSum.toFixed(1)}mm`} />
        <WeatherInfoBlock label="最大風速" value={`${forecast.windSpeedMax.toFixed(1)}m/s`} />
        <WeatherInfoBlock label="最大瞬間風速" value={`${forecast.windGustsMax.toFixed(1)}m/s`} />
      </div>

      <p className="mt-3 rounded-lg bg-white/70 p-3 text-xs font-bold leading-6 text-slate-700">
        {forecast.schoolMemo}
      </p>
    </article>
  );
}

function formatChartData(history: Array<{ time: string; windSpeed: number }>, period: TrendPeriod) {
  return history.map((point) => ({
    ...point,
    label: formatChartTime(point.time, period)
  }));
}

function formatChartTime(value: string, period: TrendPeriod) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (period === "30d") {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric"
    }).format(date);
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatForecastDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric"
  }).format(date);
}

function formatWeekday(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    weekday: "short"
  }).format(date);
}
