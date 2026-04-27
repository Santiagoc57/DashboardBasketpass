"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const LEAGUE_LOGO_BASE_PATH = "/LogosPNG/Logos%20Ligas%20500x500";

const LEAGUE_LOGO_MAP: Record<string, string> = {
  acb: "Liga Endesa.png",
  euroliga: "Euroliga.png",
  euroleague: "Euroliga.png",
  "liga argentina": "Liga Argentina.png",
  "liga 3x3": "Liga 3x3.png",
  "la liga 3x3": "Liga 3x3.png",
  "circuito 3x3": "Liga 3x3.png",
  "liga chery": "Liga Chery.png",
  "liga chery chile": "Liga Chery.png",
  "liga endesa": "Liga Endesa.png",
  "liga federal": "Liga Federal.png",
  "liga femenina": "Liga Femenina.png",
  "liga metropolitana": "Liga Metro.png",
  "liga metro": "Liga Metro.png",
  "liga metropolitana fem": "Liga Femenina.png",
  "liga nacional": "Liga Nacional.png",
  "liga nacional liga proximo": "Liga Nacional.png",
  "liga proximo": "Liga Proximo.png",
  "liga dos": "Liga Dos.png",
  "liga ecuador fem": "LBP Femenina.png",
  "ecuador fem": "LBP Femenina.png",
  "liga u22": "Liga U22.png",
  "liga uno chery": "Liga Chery.png",
  "lba serie a": "LBA Serie A.png",
  "lba": "LBA Serie A.png",
  lbp: "LBP Masculina.png",
  "lbp femenina": "LBP Femenina.png",
  "lbp masculina": "LBP Masculina.png",
  lda: "LDA.png",
  "lnf chile": "LNF Chile.png",
  "libo basquet": "Libo Basquet.png",
  lub: "LUB.png",
  "primera feb": "Primera FEB.png",
  "metro 3x3": "Liga 3x3.png",
  "super copa endesa": "Super Copa Endesa.png",
  "supercopa": "Super Copa Endesa.png",
  "tour 3x3": "Liga 3x3.png",
};

function normalizeLeague(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getLeagueInitials(league: string) {
  const parts = league.split(/\s+/).filter(Boolean);
  const usableParts =
    parts[0]?.toLowerCase() === "liga" && parts.length > 2 ? parts.slice(1) : parts;

  return (
    usableParts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "LG"
  );
}

function getLeagueLogoSrc(league: string) {
  const normalized = normalizeLeague(league);
  const fileName = LEAGUE_LOGO_MAP[normalized];

  return fileName ? `${LEAGUE_LOGO_BASE_PATH}/${encodeURIComponent(fileName)}` : null;
}

export function LeagueLogoMarkClient({
  league,
  className,
}: {
  league: string;
  className?: string;
}) {
  const src = getLeagueLogoSrc(league);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-lg bg-transparent",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`Logo de ${league}`}
          fill
          sizes="80px"
          className="object-contain p-0.5"
        />
      ) : (
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#70819b]">
          {getLeagueInitials(league)}
        </span>
      )}
    </div>
  );
}
