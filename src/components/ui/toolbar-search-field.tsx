"use client";

import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import type { ChangeEventHandler, ReactNode } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

type ToolbarSearchFieldProps = {
  placeholder: string;
  className?: string;
  shellClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  children?: ReactNode;
} & (
  | {
      as?: "form";
      action?: string;
    }
  | {
      as: "div";
      action?: never;
    }
);

export function ToolbarSearchField({
  as = "form",
  action,
  placeholder,
  className,
  shellClassName,
  inputClassName,
  iconClassName,
  name = "q",
  defaultValue,
  value,
  onChange,
  children,
}: ToolbarSearchFieldProps) {
  const Comp = as;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialValue =
    typeof value === "string"
      ? value
      : typeof defaultValue === "string"
        ? defaultValue
        : "";
  const [isExpanded, setIsExpanded] = useState(() => Boolean(initialValue.trim()));
  const isSearchExpanded = isExpanded || Boolean(value?.trim());

  function focusSearchInput() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus({ preventScroll: true });
    input.select();
  }

  function openSearchInput() {
    setIsExpanded(true);
    window.requestAnimationFrame(() => {
      focusSearchInput();
    });
  }

  function collapseSearchIfEmpty() {
    const currentValue =
      inputRef.current?.value?.trim() ??
      (typeof value === "string" ? value.trim() : "");

    if (!currentValue) {
      setIsExpanded(false);
    }
  }

  function handleShellClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    openSearchInput();
  }

  return (
    <Comp
      {...(as === "form" ? { action } : {})}
      className={cn(
        "flex min-w-0 w-full max-w-full flex-1 items-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm transition-all duration-200",
        className,
        isSearchExpanded
          ? "sm:min-w-[17rem]"
          : "xl:w-[3.5rem] xl:max-w-[3.5rem] xl:min-w-[3.5rem] xl:flex-none",
      )}
    >
      {children}
      <div
        onClick={handleShellClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-[var(--panel-radius)] bg-transparent px-3 transition-all duration-200",
          !isSearchExpanded && "xl:justify-center xl:bg-transparent xl:px-0",
          shellClassName,
        )}
      >
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openSearchInput();
          }}
          aria-label="Enfocar buscador"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--panel-radius)] text-[var(--accent)] transition hover:bg-white/70"
        >
          <Search className={cn("size-4", iconClassName)} />
        </button>
        <Input
          ref={inputRef}
          name={name}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onBlur={collapseSearchIfEmpty}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
          className={cn(
            "h-10 border-0 bg-transparent px-0 shadow-none transition-all duration-200 focus-visible:ring-0",
            !isSearchExpanded &&
              "xl:w-0 xl:min-w-0 xl:overflow-hidden xl:border-0 xl:opacity-0 xl:pointer-events-none xl:px-0",
            inputClassName,
          )}
        />
      </div>
    </Comp>
  );
}
