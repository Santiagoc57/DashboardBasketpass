"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PersonListItem } from "@/lib/types";
import { getAssignmentStateDisplayName, getRoleDisplayName } from "@/lib/display";
import { getPersonRoleValues, parsePersonNotesMeta } from "@/lib/people-notes";
import { cn } from "@/lib/utils";

type PeopleExportFormat = "excel" | "pdf";

function buildExportRows(people: PersonListItem[]) {
  return people.map((person) => {
    const meta = parsePersonNotesMeta(person.notes);
    const roles = getPersonRoleValues(meta, person.primary_role);

    return {
      nombre: person.full_name,
      rol: roles.map((role) => getRoleDisplayName(role)).join(", "),
      ciudad: meta.city || "",
      cobertura: meta.coverage || "",
      telefono: person.phone ?? "",
      email: person.email ?? "",
      estado: getAssignmentStateDisplayName(person.assignment_state),
      notas: meta.notes ?? "",
    };
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

function buildCsvContent(rows: ReturnType<typeof buildExportRows>) {
  const table = [
    ["Nombre", "Rol", "Ciudad", "Responsable de equipos", "Telefono", "Email", "Estado", "Notas"],
    ...rows.map((row) => [
      row.nombre,
      row.rol,
      row.ciudad,
      row.cobertura,
      row.telefono,
      row.email,
      row.estado,
      row.notas,
    ]),
  ];

  return table
    .map((line) =>
      line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
}

export function PeopleExportButton({
  people,
}: {
  people: PersonListItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<PeopleExportFormat>("excel");
  const rows = useMemo(() => buildExportRows(people), [people]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isExporting, isOpen]);

  async function handleExport() {
    if (!rows.length) {
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === "excel") {
        const csvContent = buildCsvContent(rows);
        downloadBlob(
          new Blob([csvContent], { type: "text/csv;charset=utf-8" }),
          "basket-production-personal.csv",
        );
      } else {
        const [{ jsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = autoTableModule.default;
        const pdfDocument = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a4",
        });

        pdfDocument.setFont("helvetica", "bold");
        pdfDocument.setFontSize(16);
        pdfDocument.text("Directorio de personal", 40, 42);
        pdfDocument.setFont("helvetica", "normal");
        pdfDocument.setFontSize(10);
        pdfDocument.setTextColor(100, 116, 139);
        pdfDocument.text(`Total exportado: ${rows.length} personas`, 40, 60);

        autoTable(pdfDocument, {
          startY: 78,
          head: [[
            "Nombre",
            "Rol",
            "Ciudad",
            "Responsable de equipos",
            "Telefono",
            "Email",
            "Estado",
          ]],
          body: rows.map((row) => [
            row.nombre,
            row.rol,
            row.ciudad,
            row.cobertura,
            row.telefono,
            row.email,
            row.estado,
          ]),
          styles: {
            fontSize: 9,
            cellPadding: 6,
            textColor: [31, 41, 55],
            lineColor: [226, 232, 240],
            lineWidth: 0.5,
          },
          headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          margin: {
            left: 40,
            right: 40,
            top: 78,
            bottom: 32,
          },
        });

        pdfDocument.save("basket-production-personal.pdf");
      }

      setIsOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!people.length || isExporting}
        aria-label={isExporting ? "Preparando exportacion" : "Configurar exportacion"}
        title={isExporting ? "Preparando exportacion" : "Configurar exportacion"}
        className="inline-flex size-[52px] items-center justify-center rounded-[var(--panel-radius)] bg-[#7c3aed] text-white shadow-[0_14px_28px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="size-4" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[310] flex items-center justify-center bg-[#101828]/60 p-4 backdrop-blur-sm"
              onClick={() => !isExporting && setIsOpen(false)}
            >
              <div
                className="panel-surface relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Configurar exportacion de personal"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#f3e8ff] text-[#7c3aed]">
                      <Download className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                        Exportar personal
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Elige como quieres descargar el directorio visible.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                    aria-label="Cerrar modal"
                    disabled={isExporting}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#70819b]">
                      <FileText className="size-4 text-[#7c3aed]" />
                      Formato
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setExportFormat("excel")}
                        aria-pressed={exportFormat === "excel"}
                        className={cn(
                          "rounded-[var(--panel-radius)] border px-4 py-4 text-left transition",
                          exportFormat === "excel"
                            ? "border-[#c8b5ff] bg-[#f5f0ff] shadow-sm"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[#fafbfd]",
                        )}
                      >
                        <p className="text-sm font-black text-[var(--foreground)]">
                          Excel
                        </p>
                        <p className="mt-1 text-sm text-[#617187]">
                          Descarga una planilla editable del personal visible.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("pdf")}
                        aria-pressed={exportFormat === "pdf"}
                        className={cn(
                          "rounded-[var(--panel-radius)] border px-4 py-4 text-left transition",
                          exportFormat === "pdf"
                            ? "border-[#c8b5ff] bg-[#f5f0ff] shadow-sm"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[#fafbfd]",
                        )}
                      >
                        <p className="text-sm font-black text-[var(--foreground)]">
                          PDF
                        </p>
                        <p className="mt-1 text-sm text-[#617187]">
                          Genera un documento listo para compartir o imprimir.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-[var(--panel-radius)] border border-[var(--border)] bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {rows.length} personas visibles
                      </p>
                      <p className="text-sm text-[#617187]">
                        Se exporta exactamente lo que ves en esta pantalla.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      <Download className="size-4" />
                      {isExporting
                        ? "Preparando..."
                        : exportFormat === "pdf"
                          ? "Descargar PDF"
                          : "Descargar Excel"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
