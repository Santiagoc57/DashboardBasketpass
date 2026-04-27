"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPinned, Search, Shield } from "lucide-react";

import { ClientTeamLogoMark } from "@/components/team-logo-mark-client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TeamCoverageOption = {
  name: string;
  stadium?: string | null;
  competition?: string | null;
};

function getActiveQuerySegment(value: string) {
  const segments = value.split(",");
  return segments[segments.length - 1]?.trim() ?? "";
}

function replaceLastSegment(currentValue: string, nextSegment: string) {
  const segments = currentValue.split(",");
  segments[segments.length - 1] = ` ${nextSegment}`;

  return segments
    .join(",")
    .replace(/^ /, "")
    .replace(/\s+,/g, ",")
    .trim();
}

export function TeamCoverageField({
  name,
  defaultValue = "",
  options,
  disabled = false,
  placeholder,
  className,
  helperText,
}: {
  name: string;
  defaultValue?: string;
  options: TeamCoverageOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  helperText?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const activeSegment = useMemo(
    () => getActiveQuerySegment(value).toLocaleLowerCase("es"),
    [value],
  );
  const suggestions = useMemo(() => {
    if (!activeSegment) {
      return options.slice(0, 8);
    }

    return options
      .filter((option) =>
        [option.name, option.stadium ?? "", option.competition ?? ""]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(activeSegment),
      )
      .slice(0, 8);
  }, [activeSegment, options]);
  const showSuggestions = isFocused && suggestions.length > 0;

  function handlePick(optionName: string) {
    setValue((current) => replaceLastSegment(current, optionName));
    setIsFocused(false);
  }

  return (
    <div ref={containerRef} className="group relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3] transition group-focus-within:text-[var(--accent)]" />
        <Input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(className, "pl-11")}
        />
      </div>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-[22rem] overflow-y-auto rounded-[var(--panel-radius)] border border-[#e5e7eb] bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
          <div className="space-y-2">
            {suggestions.map((option) => (
              <button
                key={`${option.name}::${option.competition ?? ""}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePick(option.name)}
                className="flex w-full items-center gap-3 rounded-[var(--panel-radius)] border border-[#edf1f5] bg-white px-4 py-3 text-left transition hover:border-[#d8dee8] hover:bg-[#fbfcfe]"
              >
                <ClientTeamLogoMark
                  teamName={option.name}
                  competition={option.competition}
                  className="size-12 rounded-[var(--panel-radius)] border-[#e5e7eb] bg-white"
                  imageClassName="p-2"
                  initialsClassName="text-[10px]"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-[#20161f]">
                    {option.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-[#7182a0]">
                    <MapPinned className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {option.stadium ?? "Sin estadio cargado"}
                    </span>
                  </div>
                </div>

                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[11px] font-semibold text-[#70819b] xl:inline-flex">
                  <Shield className="size-3" />
                  {option.competition ?? "Equipo"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {helperText ? (
        <p className="pl-1 text-[11px] italic text-[#98a2b3]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
