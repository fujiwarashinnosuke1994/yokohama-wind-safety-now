import { getYokohamaWindTrend, type TrendPeriod } from "@/lib/open-meteo";

export const dynamic = "force-dynamic";

const allowedPeriods = new Set<TrendPeriod>(["60m", "12h", "30d"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPeriod = searchParams.get("period");
  const period: TrendPeriod = allowedPeriods.has(requestedPeriod as TrendPeriod)
    ? (requestedPeriod as TrendPeriod)
    : "60m";
  const data = await getYokohamaWindTrend(period);

  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
