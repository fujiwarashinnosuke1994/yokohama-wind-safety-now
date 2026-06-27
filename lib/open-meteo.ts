const YOKOHAMA_LATITUDE = 35.4437;
const YOKOHAMA_LONGITUDE = 139.638;
const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=35.4437&longitude=139.6380&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=Asia%2FTokyo";

type OpenMeteoCurrent = {
  time?: string;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  current_units?: {
    wind_speed_10m?: string;
    wind_direction_10m?: string;
  };
};

export type SafetyLevel = {
  label: string;
  memo: string;
  tone: "calm" | "notice" | "caution" | "warning" | "danger";
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
    const response = await fetch(OPEN_METEO_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Open-Meteo request failed.");
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const windSpeed = data.current?.wind_speed_10m;
    const windDirectionDegree = data.current?.wind_direction_10m;
    const observedAt = data.current?.time;

    if (
      typeof windSpeed !== "number" ||
      typeof windDirectionDegree !== "number" ||
      typeof observedAt !== "string"
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
      safetyLevel: getSafetyLevel(windSpeed)
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

export function getSafetyLevel(windSpeed: number): SafetyLevel {
  if (windSpeed >= 15) {
    return {
      label: "危険",
      memo: "不要不急の外出を避ける目安",
      tone: "danger"
    };
  }

  if (windSpeed >= 10) {
    return {
      label: "強風",
      memo: "外出、送迎、自転車、車のドア開閉に注意",
      tone: "warning"
    };
  }

  if (windSpeed >= 6) {
    return {
      label: "強め",
      memo: "海沿い・橋の上・自転車移動に注意",
      tone: "caution"
    };
  }

  if (windSpeed >= 3) {
    return {
      label: "やや風あり",
      memo: "自転車やベビーカーは少し注意",
      tone: "notice"
    };
  }

  return {
    label: "穏やか",
    memo: "通常の外出はしやすい",
    tone: "calm"
  };
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
