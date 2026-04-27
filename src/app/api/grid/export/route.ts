import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/auth";
import { getGridMatchesForDateRange } from "@/lib/data/dashboard";
import { parseGridSearchParams } from "@/lib/search-params";

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: Request) {
  const user = await getUserContext();

  if (!user.userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesion para exportar la grilla." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const filters = parseGridSearchParams(url.searchParams);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!isDateString(startDate) || !isDateString(endDate)) {
    return NextResponse.json(
      { error: "Selecciona un rango de fechas valido para exportar." },
      { status: 400 },
    );
  }

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "La fecha inicial no puede ser mayor que la fecha final." },
      { status: 400 },
    );
  }

  const matches = await getGridMatchesForDateRange({
    startDate,
    endDate,
    q: filters.q,
    league: filters.league,
    mode: filters.mode,
    status: filters.status,
    owner: filters.owner,
    timezone: filters.timezone,
  });

  return NextResponse.json({
    startDate,
    endDate,
    total: matches.length,
    matches,
  });
}
