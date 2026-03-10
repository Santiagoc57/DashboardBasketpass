"use client";

import Image from "next/image";
import { Camera, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

export function UserProfileChip({
  userId,
  fullName,
  email,
  roleLabel,
  className,
}: {
  userId: string | null;
  fullName: string;
  email: string | null;
  roleLabel: string;
  className?: string;
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

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    const syncAvatar = () => {
      setAvatarSrc(window.localStorage.getItem(storageKey));
    };

    window.addEventListener("storage", syncAvatar);
    window.addEventListener(AVATAR_CHANGE_EVENT, syncAvatar);

    return () => {
      window.removeEventListener("storage", syncAvatar);
      window.removeEventListener(AVATAR_CHANGE_EVENT, syncAvatar);
    };
  }, [storageKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : null;
      if (!nextValue) {
        return;
      }

      setAvatarSrc(nextValue);

      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, nextValue);
          window.dispatchEvent(new Event(AVATAR_CHANGE_EVENT));
        } catch {
          // If localStorage is full, keep the preview for this session only.
        }
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="hidden text-right sm:block">
        <p className="text-[15px] font-extrabold leading-none text-[var(--foreground)]">
          {fullName}
        </p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--accent)]">
          {roleLabel}
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex size-14 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[#edf1f4] shadow-sm ring-2 ring-white transition hover:border-[var(--accent)]"
        title="Cambiar foto de perfil"
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={`Foto de perfil de ${fullName}`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[#d8e3e2] text-[#324b53]">
            {fullName.trim() ? (
              <span className="text-sm font-extrabold">{getInitials(fullName)}</span>
            ) : (
              <UserRound className="size-6" />
            )}
          </div>
        )}
        <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)] text-white shadow-sm transition group-hover:scale-105">
          <Camera className="size-3.5" />
        </span>
      </button>

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
