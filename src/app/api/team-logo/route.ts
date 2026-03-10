import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/auth";
import { getTeamLogoPath } from "@/lib/team-logos";

export async function GET(request: Request) {
  const user = await getUserContext();

  if (!user.userId) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para consultar los escudos." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const teamName = url.searchParams.get("teamName")?.trim();
  const competition = url.searchParams.get("competition")?.trim() ?? null;

  if (!teamName) {
    return NextResponse.json(
      { error: "El nombre del equipo es obligatorio." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    src: getTeamLogoPath({ teamName, competition }),
  });
}
