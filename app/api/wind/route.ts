import { getYokohamaWindData } from "@/lib/open-meteo";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getYokohamaWindData();

  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
