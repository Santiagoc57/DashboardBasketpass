"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, PencilLine, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { saveProfileNameAction } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AVATAR_CHANGE_EVENT,
  getAvatarStorageKey,
} from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function splitFullName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function ProfileDetailCard({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.6rem] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-2.5",
        className,
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#95a3ba]">
        {label}
      </p>
      <div className="min-w-0 text-sm font-semibold text-[var(--foreground)]">
        {children}
      </div>
    </div>
  );
}

export function ProfileAvatarSettings({
  userId,
  email,
  fullName,
  editHref,
  roleLabel,
  linkedPersonStatus,
  phone,
  city,
  coverage,
  notes,
  roles,
}: {
  userId: string | null;
  email: string | null;
  fullName: string;
  editHref: string;
  roleLabel: string;
  linkedPersonStatus: string;
  phone?: string | null;
  city?: string | null;
  coverage?: string | null;
  notes?: string | null;
  roles?: string[];
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storageKey = useMemo(
    () => getAvatarStorageKey({ userId, email, fullName }),
    [email, fullName, userId],
  );
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => {
    if (!storageKey || typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(storageKey);
  });

  const applyAvatar = (nextValue: string | null) => {
    setAvatarSrc(nextValue);

    if (!storageKey || typeof window === "undefined") {
      return;
    }

    if (nextValue) {
      window.localStorage.setItem(storageKey, nextValue);
    } else {
      window.localStorage.removeItem(storageKey);
    }

    window.dispatchEvent(new Event(AVATAR_CHANGE_EVENT));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : null;
      if (nextValue) {
        applyAvatar(nextValue);
      }
    };

    reader.readAsDataURL(file);
  };

  const { firstName, lastName } = splitFullName(fullName);
  const detailCardClass =
    "flex min-h-[4.6rem] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-2.5";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Cambiar avatar"
            title="Cambiar avatar"
            className="group relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[#edf1f4] shadow-sm transition hover:border-[var(--accent)] sm:size-[84px]"
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={`Avatar de ${fullName}`}
                fill
                sizes="84px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-[#d8e3e2] text-[#324b53]">
                {fullName.trim() ? (
                  <span className="text-base font-extrabold sm:text-lg">
                    {getInitials(fullName)}
                  </span>
                ) : (
                  <UserRound className="size-6" />
                )}
              </div>
            )}
            <span className="pointer-events-none absolute bottom-0.5 right-0.5 inline-flex size-6 items-center justify-center rounded-full border border-white bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm">
              <Camera className="size-3.5" />
            </span>
          </button>
        </div>

        <div className="min-w-0 space-y-4 lg:-mt-2">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className="w-fit border-[#f0c8d1] bg-[#fff0f3] text-[var(--accent)]">
                {roleLabel}
              </Badge>
              <Link
                href={editHref}
                aria-label="Editar ficha en Personal"
                title="Editar ficha en Personal"
                className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[#f4f7fb] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#617187] transition hover:border-[var(--accent)] hover:bg-[#eef2f6] hover:text-[var(--accent)]"
              >
                <PencilLine className="size-3.5" />
                Editar ficha
              </Link>
            </div>
            <Badge
              className={cn(
                "flex w-full justify-start whitespace-normal leading-4",
                linkedPersonStatus.includes("Activo")
                  ? "border-[#cce8db] bg-[#effaf4] text-[#17654d]"
                  : linkedPersonStatus.includes("Inactivo")
                    ? "border-[#ece0b4] bg-[#fff8ea] text-[#9a5a0f]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              )}
            >
              {linkedPersonStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={saveProfileNameAction} className="contents">
          <input type="hidden" name="redirectTo" value="/settings" />
          <label className={detailCardClass}>
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#95a3ba]">
              Nombre
            </span>
            <Input
              name="profileFirstName"
              defaultValue={firstName}
              placeholder="Nombre"
              className="h-8 border-0 bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus:bg-transparent focus:ring-0"
            />
          </label>
          <label className={detailCardClass}>
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#95a3ba]">
              Apellido
            </span>
            <Input
              name="profileLastName"
              defaultValue={lastName}
              placeholder="Apellido"
              className="h-8 border-0 bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus:bg-transparent focus:ring-0"
            />
          </label>
        </form>

        <ProfileDetailCard label="Correo" className={detailCardClass}>
          <p className="truncate whitespace-nowrap">
            {email ?? "Sin correo"}
          </p>
        </ProfileDetailCard>
        <ProfileDetailCard label="Ciudad" className={detailCardClass}>
          <p>{city ?? "Sin ciudad"}</p>
        </ProfileDetailCard>
        <ProfileDetailCard label="Teléfono" className={detailCardClass}>
          <p>{phone ?? "Sin teléfono"}</p>
        </ProfileDetailCard>
        <ProfileDetailCard label="Roles" className={detailCardClass}>
          <p className="leading-6">
            {roles?.length ? roles.join(" · ") : "Sin roles cargados"}
          </p>
        </ProfileDetailCard>
      </div>

      {coverage || notes ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {coverage ? (
            <ProfileDetailCard label="Cobertura" className={`${detailCardClass} py-4`}>
              <p className="font-medium leading-6">
                {coverage}
              </p>
            </ProfileDetailCard>
          ) : null}
          {notes ? (
            <ProfileDetailCard
              label="Notas"
              className={`${detailCardClass} py-4 sm:col-span-2`}
            >
              <p className="font-medium leading-6">
                {notes}
              </p>
            </ProfileDetailCard>
          ) : null}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
