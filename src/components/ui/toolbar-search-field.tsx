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
        "flex min-w-0 max-w-full items-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-200",
        className,
        isSearchExpanded
          ? "w-full flex-1 p-1.5 sm:min-w-[17rem]"
          : "!size-[52px] !max-h-[52px] !max-w-[52px] !min-h-[52px] !min-w-[52px] !flex-none overflow-hidden p-0",
      )}
    >
      {children}
      <div
        onClick={handleShellClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-[var(--panel-radius)] bg-transparent px-3 transition-all duration-200",
          !isSearchExpanded && "justify-center bg-transparent px-0",
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
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-[var(--panel-radius)] text-[var(--accent)] transition hover:bg-white/70",
            isSearchExpanded ? "size-10" : "size-full",
          )}
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
              "w-0 min-w-0 overflow-hidden border-0 opacity-0 pointer-events-none px-0",
            inputClassName,
          )}
        />
      </div>
    </Comp>
  );
}
