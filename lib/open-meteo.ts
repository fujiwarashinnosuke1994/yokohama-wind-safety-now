const YOKOHAMA_LATITUDE = 35.4437;
const YOKOHAMA_LONGITUDE = 139.638;
const FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";
const LOCATION_QUERY = `latitude=${YOKOHAMA_LATITUDE}&longitude=${YOKOHAMA_LONGITUDE}`;
const COMMON_QUERY = "wind_speed_unit=ms&timezone=Asia%2FTokyo";
const CURRENT_URL = `${FORECAST_BASE_URL}?${LOCATION_QUERY}&current=wind_speed_10m,wind_direction_10m&minutely_15=wind_speed_10m&${COMMON_QUERY}&past_minutely_15=4&forecast_minutely_15=1`;
const WEATHER_URL = `${FORECAST_BASE_URL}?${LOCATION_QUERY}&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&minutely_15=wind_speed_10m&${COMMON_QUERY}&forecast_days=10&past_minutely_15=4&forecast_minutely_15=1`;

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  rain?: number;
  weather_code?: number;
  cloud_cover?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
};

type OpenMeteoTimeSeries = {
  time?: string[];
  wind_speed_10m?: Array<number | null>;
  wind_speed_10m_max?: Array<number | null>;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  current_units?: {
    wind_speed_10m?: string;
    wind_direction_10m?: string;
  };
  minutely_15?: OpenMeteoTimeSeries;
  hourly?: OpenMeteoTimeSeries;
  daily?: OpenMeteoTimeSeries;
};

type OpenMeteoDaily = OpenMeteoTimeSeries & {
  weather_code?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  wind_gusts_10m_max?: Array<number | null>;
};

type OpenMeteoWeatherResponse = Omit<OpenMeteoResponse, "daily"> & {
  daily?: OpenMeteoDaily;
};

export type SafetyTone = "calm" | "notice" | "caution" | "warning" | "danger" | "extreme";

export type SafetyLevel = {
  label: string;
  memo: string;
  tone: SafetyTone;
};

export type TrendPeriod = "60m" | "12h" | "30d";

export type WindHistoryPoint = {
  time: string;
  windSpeed: number;
};

export type CurrentWeather = {
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  precipitationProbability: number;
  rain: number;
  cloudCover: number;
  windGusts: number;
  observedAt: string;
  attentionTone: SafetyTone;
};

export type DailyForecast = {
  date: string;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  windGustsMax: number;
  attentionTone: SafetyTone;
  schoolMemo: string;
};

export type WindTrendData =
  | {
      ok: true;
      fetchedAt: string;
      source: "Open-Meteo";
      period: TrendPeriod;
      points: WindHistoryPoint[];
    }
  | {
      ok: false;
      fetchedAt: string;
      source: "Open-Meteo";
      period: TrendPeriod;
    };

export type WindData =
  | {
      ok: true;
      fetchedAt: string;
      source: "Open-Meteo";
      latitude: number;
      longitude: number;
      windSpeed: number;
      windSpeedUnit: string;
      windDirectionDegree: number;
      windDirectionText: string;
      observedAt: string;
      safetyLevel: SafetyLevel;
      history: WindHistoryPoint[];
      currentWeather: CurrentWeather;
      dailyForecast: DailyForecast[];
    }
  | {
      ok: false;
      fetchedAt: string;
      source: "Open-Meteo";
      latitude: number;
      longitude: number;
    };

export async function getYokohamaWindData(): Promise<WindData> {
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(WEATHER_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Open-Meteo request failed.");
    }

    const data = (await response.json()) as OpenMeteoWeatherResponse;
    const windSpeed = data.current?.wind_speed_10m;
    const windDirectionDegree = data.current?.wind_direction_10m;
    const observedAt = data.current?.time;
    const currentWeather = parseCurrentWeather(data.current, data.daily?.precipitation_probability_max?.[0]);

    if (
      typeof windSpeed !== "number" ||
      typeof windDirectionDegree !== "number" ||
      typeof observedAt !== "string" ||
      !currentWeather
    ) {
      throw new Error("Open-Meteo response did not include wind data.");
    }

    return {
      ok: true,
      fetchedAt,
      source: "Open-Meteo",
      latitude: YOKOHAMA_LATITUDE,
      longitude: YOKOHAMA_LONGITUDE,
      windSpeed,
      windSpeedUnit: data.current_units?.wind_speed_10m ?? "m/s",
      windDirectionDegree,
      windDirectionText: degreeToDirection(windDirectionDegree),
      observedAt,
      safetyLevel: getSafetyLevel(windSpeed),
      history: parseWindSeries(data.minutely_15, "wind_speed_10m"),
      currentWeather,
      dailyForecast: parseDailyForecast(data.daily)
    };
  } catch {
    return {
      ok: false,
      fetchedAt,
      source: "Open-Meteo",
      latitude: YOKOHAMA_LATITUDE,
      longitude: YOKOHAMA_LONGITUDE
    };
  }
}

export function getWeatherDescription(weatherCode: number): string {
  if (weatherCode === 0) {
    return "快晴";
  }

  if (weatherCode === 1) {
    return "晴れ";
  }

  if (weatherCode === 2) {
    return "一部曇り";
  }

  if (weatherCode === 3) {
    return "曇り";
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return "霧";
  }

  if ([51, 53, 55].includes(weatherCode)) {
    return "霧雨";
  }

  if ([61, 63, 65].includes(weatherCode)) {
    return "雨";
  }

  if ([71, 73, 75].includes(weatherCode)) {
    return "雪";
  }

  if ([80, 81, 82].includes(weatherCode)) {
    return "にわか雨";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "雷雨";
  }

  return "天気不明";
}

export function getWeatherIcon(weatherCode: number): string {
  if (weatherCode === 0 || weatherCode === 1) {
    return "☀️";
  }

  if (weatherCode === 2) {
    return "🌤️";
  }

  if (weatherCode === 3) {
    return "☁️";
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return "🌫️";
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return "🌧️";
  }

  if ([71, 73, 75].includes(weatherCode)) {
    return "❄️";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "⛈️";
  }

  return "🌡️";
}

export async function getYokohamaWindTrend(period: TrendPeriod): Promise<WindTrendData> {
  const fetchedAt = new Date().toISOString();

  try {
    if (period === "60m") {
      const currentData = await getYokohamaWindData();

      if (!currentData.ok || currentData.history.length === 0) {
        throw new Error("60 minute trend was not available.");
      }

      return {
        ok: true,
        fetchedAt,
        source: "Open-Meteo",
        period,
        points: currentData.history
      };
    }

    if (period === "12h") {
      const response = await fetch(
        `${FORECAST_BASE_URL}?${LOCATION_QUERY}&hourly=wind_speed_10m&${COMMON_QUERY}&past_hours=12&forecast_hours=1`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Open-Meteo hourly request failed.");
      }

      const data = (await response.json()) as OpenMeteoResponse;
      const points = parseWindSeries(data.hourly, "wind_speed_10m");

      if (points.length === 0) {
        throw new Error("12 hour trend was not available.");
      }

      return {
        ok: true,
        fetchedAt,
        source: "Open-Meteo",
        period,
        points
      };
    }

    const { startDate, endDate } = getArchiveDateRange();
    const response = await fetch(
      `${ARCHIVE_BASE_URL}?${LOCATION_QUERY}&daily=wind_speed_10m_max&${COMMON_QUERY}&start_date=${startDate}&end_date=${endDate}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Open-Meteo archive request failed.");
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const points = parseWindSeries(data.daily, "wind_speed_10m_max");

    if (points.length === 0) {
      throw new Error("30 day trend was not available.");
    }

    return {
      ok: true,
      fetchedAt,
      source: "Open-Meteo",
      period,
      points
    };
  } catch {
    return {
      ok: false,
      fetchedAt,
      source: "Open-Meteo",
      period
    };
  }
}

export function getSafetyLevel(windSpeed: number): SafetyLevel {
  if (windSpeed >= 20) {
    return {
      label: "非常に危険",
      memo: "非常に強い風の目安。外出や移動の可否は公式情報と周囲の状況を必ず確認",
      tone: "extreme"
    };
  }

  if (windSpeed >= 15) {
    return {
      label: "危険",
      memo: "強い風の目安。不要不急の外出を控える判断材料として確認",
      tone: "danger"
    };
  }

  if (windSpeed >= 10) {
    return {
      label: "強風注意",
      memo: "外出、送迎、自転車、車のドア開閉、飛来物リスクに注意",
      tone: "warning"
    };
  }

  if (windSpeed >= 6) {
    return {
      label: "注意",
      memo: "海沿い・橋の上・自転車移動では風の影響を受けやすい目安",
      tone: "caution"
    };
  }

  if (windSpeed >= 3) {
    return {
      label: "やや風あり",
      memo: "危険表示ではなく、風を感じやすい状態の情報表示",
      tone: "notice"
    };
  }

  return {
    label: "通常",
    memo: "比較的穏やかな風の目安。安全を保証するものではありません",
    tone: "calm"
  };
}

export function getWindColor(windSpeed: number): string {
  if (windSpeed >= 20) {
    return "#7e22ce";
  }

  if (windSpeed >= 15) {
    return "#dc2626";
  }

  if (windSpeed >= 10) {
    return "#f97316";
  }

  if (windSpeed >= 6) {
    return "#eab308";
  }

  if (windSpeed >= 3) {
    return "#0ea5e9";
  }

  return "#10b981";
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function formatDateTimeWithSeconds(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function parseWindSeries(series: OpenMeteoTimeSeries | undefined, field: "wind_speed_10m" | "wind_speed_10m_max"): WindHistoryPoint[] {
  const times = series?.time;
  const windSpeeds = series?.[field];

  if (!times || !windSpeeds) {
    return [];
  }

  return times
    .map((time, index) => {
      const windSpeed = windSpeeds[index];

      if (typeof windSpeed !== "number") {
        return null;
      }

      return {
        time,
        windSpeed
      };
    })
    .filter((point): point is WindHistoryPoint => point !== null);
}

function parseCurrentWeather(current: OpenMeteoCurrent | undefined, precipitationProbability: number | null | undefined): CurrentWeather | null {
  if (!current || typeof current.time !== "string") {
    return null;
  }

  const {
    apparent_temperature: apparentTemperature,
    cloud_cover: cloudCover,
    precipitation,
    rain,
    temperature_2m: temperature,
    weather_code: weatherCode,
    wind_gusts_10m: windGusts,
    wind_speed_10m: windSpeed
  } = current;

  if (
    typeof apparentTemperature !== "number" ||
    typeof cloudCover !== "number" ||
    typeof precipitation !== "number" ||
    typeof rain !== "number" ||
    typeof temperature !== "number" ||
    typeof weatherCode !== "number" ||
    typeof windGusts !== "number" ||
    typeof windSpeed !== "number"
  ) {
    return null;
  }

  return {
    weatherCode,
    weatherDescription: getWeatherDescription(weatherCode),
    weatherIcon: getWeatherIcon(weatherCode),
    temperature,
    apparentTemperature,
    precipitation,
    precipitationProbability: typeof precipitationProbability === "number" ? precipitationProbability : 0,
    rain,
    cloudCover,
    windGusts,
    observedAt: current.time,
    attentionTone: getWeatherAttentionTone({
      precipitation,
      precipitationProbability: typeof precipitationProbability === "number" ? precipitationProbability : 0,
      weatherCode,
      windGusts,
      windSpeed
    })
  };
}

function parseDailyForecast(daily: OpenMeteoDaily | undefined): DailyForecast[] {
  const times = daily?.time;

  if (!times) {
    return [];
  }

  return times
    .map((date, index) => {
      const weatherCode = daily.weather_code?.[index];
      const temperatureMax = daily.temperature_2m_max?.[index];
      const temperatureMin = daily.temperature_2m_min?.[index];
      const precipitationProbabilityMax = daily.precipitation_probability_max?.[index];
      const precipitationSum = daily.precipitation_sum?.[index];
      const windSpeedMax = daily.wind_speed_10m_max?.[index];
      const windGustsMax = daily.wind_gusts_10m_max?.[index];

      if (
        typeof weatherCode !== "number" ||
        typeof temperatureMax !== "number" ||
        typeof temperatureMin !== "number" ||
        typeof precipitationProbabilityMax !== "number" ||
        typeof precipitationSum !== "number" ||
        typeof windSpeedMax !== "number" ||
        typeof windGustsMax !== "number"
      ) {
        return null;
      }

      const attentionTone = getWeatherAttentionTone({
        precipitation: precipitationSum,
        precipitationProbability: precipitationProbabilityMax,
        weatherCode,
        windGusts: windGustsMax,
        windSpeed: windSpeedMax
      });

      return {
        date,
        weatherCode,
        weatherDescription: getWeatherDescription(weatherCode),
        weatherIcon: getWeatherIcon(weatherCode),
        temperatureMax,
        temperatureMin,
        precipitationProbabilityMax,
        precipitationSum,
        windSpeedMax,
        windGustsMax,
        attentionTone,
        schoolMemo: getSchoolCommuteMemo({
          precipitationProbability: precipitationProbabilityMax,
          precipitationSum,
          weatherCode,
          windGusts: windGustsMax,
          windSpeed: windSpeedMax
        })
      };
    })
    .filter((forecast): forecast is DailyForecast => forecast !== null);
}

function getWeatherAttentionTone({
  precipitation,
  precipitationProbability,
  weatherCode,
  windGusts,
  windSpeed
}: {
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  windGusts: number;
  windSpeed: number;
}): SafetyTone {
  if (windGusts >= 25 || windSpeed >= 20 || [95, 96, 99].includes(weatherCode)) {
    return "extreme";
  }

  if (windGusts >= 20 || windSpeed >= 15 || precipitation >= 30) {
    return "danger";
  }

  if (windGusts >= 15 || windSpeed >= 10 || precipitation >= 10 || precipitationProbability >= 80) {
    return "warning";
  }

  if (windSpeed >= 6 || precipitation >= 3 || precipitationProbability >= 60 || [61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return "caution";
  }

  if (windSpeed >= 3 || precipitationProbability >= 40 || [2, 3, 45, 48, 51, 53, 55].includes(weatherCode)) {
    return "notice";
  }

  return "calm";
}

function getSchoolCommuteMemo({
  precipitationProbability,
  precipitationSum,
  weatherCode,
  windGusts,
  windSpeed
}: {
  precipitationProbability: number;
  precipitationSum: number;
  weatherCode: number;
  windGusts: number;
  windSpeed: number;
}) {
  if ([95, 96, 99].includes(weatherCode)) {
    return "雷雨の可能性があります。通学・通塾・送迎前に公式情報と周囲の状況を確認してください。";
  }

  if (precipitationSum >= 10) {
    return "雨が強い可能性があります。通学・通塾・送迎時は足元に注意してください。";
  }

  if (windSpeed >= 10 || windGusts >= 15) {
    return "風が強い可能性があります。自転車、海沿い移動、車のドア開閉に注意してください。";
  }

  if (precipitationProbability >= 60) {
    return "降水確率が高めです。傘や雨具の準備を検討してください。";
  }

  return "穏やかな天気の見込みですが、最新情報を確認してください。";
}

function getArchiveDateRange() {
  const end = new Date();
  end.setDate(end.getDate() - 1);

  const start = new Date(end);
  start.setDate(start.getDate() - 29);

  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end)
  };
}

function formatDateOnly(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function degreeToDirection(degree: number): string {
  const directions = [
    "北",
    "北北東",
    "北東",
    "東北東",
    "東",
    "東南東",
    "南東",
    "南南東",
    "南",
    "南南西",
    "南西",
    "西南西",
    "西",
    "西北西",
    "北西",
    "北北西"
  ];
  const index = Math.round((((degree % 360) + 360) % 360) / 22.5) % 16;

  return directions[index];
}
