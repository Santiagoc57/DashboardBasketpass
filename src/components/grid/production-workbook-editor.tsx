"use client";

import { useEffect, useRef } from "react";
import { LocaleType, mergeLocales, type IWorkbookData } from "@univerjs/core";
import { createUniver } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import esES from "@univerjs/preset-sheets-core/locales/es-ES";
import type { FDataValidationBuilder } from "@univerjs/preset-sheets-data-validation";

type ProductionWorkbookEditorProps = {
  snapshot: IWorkbookData;
  mapping: Record<string, unknown>;
  dropdowns: ProductionWorkbookDropdowns;
  onReady: (api: { save: () => IWorkbookData; dispose: () => void }) => void;
};

export type ProductionWorkbookDropdowns = {
  teamNames: string[];
  peopleNames: string[];
  leagues: string[];
  productionModes: string[];
  statuses: string[];
  commentaryPlans: string[];
};

type UniverApiWithDataValidation = {
  newDataValidation: () => FDataValidationBuilder;
};

type RangeWithValidation = {
  setDataValidation: (rule: unknown) => void;
};

type WorksheetWithRanges = {
  getRange: (row: number, column: number, numRows: number, numColumns: number) => RangeWithValidation;
};

type WorkbookWithActiveSheet = {
  getActiveSheet: () => WorksheetWithRanges | null;
};

function toColumnIndex(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 500);
}

function setDropdown(
  univerAPI: unknown,
  workbook: unknown,
  column: unknown,
  options: string[],
  rowCount: number,
) {
  const columnIndex = toColumnIndex(column);
  const values = uniqueOptions(options);
  const editableRows = Math.max(1, rowCount - 1);

  if (columnIndex == null || !values.length) {
    return;
  }

  const api = univerAPI as UniverApiWithDataValidation;
  const sheet = (workbook as WorkbookWithActiveSheet).getActiveSheet();
  if (!sheet || typeof api.newDataValidation !== "function") {
    return;
  }

  const rule = api
    .newDataValidation()
    .requireValueInList(values, false, true)
    .setAllowBlank(true)
    .setAllowInvalid(true)
    .build();

  sheet.getRange(1, columnIndex, editableRows, 1).setDataValidation(rule);
}

function applyDropdowns(
  univerAPI: unknown,
  workbook: unknown,
  mapping: Record<string, unknown>,
  dropdowns: ProductionWorkbookDropdowns,
  snapshot: IWorkbookData,
) {
  const sheetId = snapshot.sheetOrder[0];
  const rowCount = snapshot.sheets[sheetId]?.rowCount ?? 120;
  const peopleFields = [
    "owner",
    "realizador",
    "graphicsOperator",
    "camera1",
    "camera2",
    "camera3",
    "camera4",
    "camera5",
    "relator",
    "commentator1",
    "commentator2",
    "controlOperator",
    "supportTech",
    "passengers",
  ];

  setDropdown(univerAPI, workbook, mapping.homeTeam, dropdowns.teamNames, rowCount);
  setDropdown(univerAPI, workbook, mapping.awayTeam, dropdowns.teamNames, rowCount);
  setDropdown(univerAPI, workbook, mapping.match, dropdowns.teamNames, rowCount);
  setDropdown(univerAPI, workbook, mapping.competition, dropdowns.leagues, rowCount);
  setDropdown(univerAPI, workbook, mapping.productionMode, dropdowns.productionModes, rowCount);
  setDropdown(univerAPI, workbook, mapping.status, dropdowns.statuses, rowCount);
  setDropdown(univerAPI, workbook, mapping.commentaryPlan, dropdowns.commentaryPlans, rowCount);

  for (const field of peopleFields) {
    setDropdown(univerAPI, workbook, mapping[field], dropdowns.peopleNames, rowCount);
  }
}

export function ProductionWorkbookEditor({
  snapshot,
  mapping,
  dropdowns,
  onReady,
}: ProductionWorkbookEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ UniverSheetsDataValidationPreset }, { default: dataValidationEsES }] =
        await Promise.all([
          import("@univerjs/preset-sheets-data-validation"),
          import("@univerjs/preset-sheets-data-validation/locales/es-ES"),
        ]);

      if (disposed || !containerRef.current) {
        return;
      }

      const { univer, univerAPI } = createUniver({
        locale: LocaleType.ES_ES,
        locales: {
          [LocaleType.ES_ES]: mergeLocales(esES, dataValidationEsES, {
            ribbon: {
              ...esES.ribbon,
              start: "Inicio",
              formulas: "Fórmulas",
              data: "Datos",
            },
            fontFamily: {
              ...esES.fontFamily,
              arial: "Arial",
            },
            sheet: {
              ...esES.sheet,
              numfmt: {
                ...esES.sheet?.numfmt,
                general: "General",
              },
            },
          }),
        },
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
            toolbar: true,
            formulaBar: true,
            footer: { sheetBar: true, statisticBar: true, menus: true, zoomSlider: true },
          }),
          UniverSheetsDataValidationPreset({
            showSearchOnDropdown: true,
            showEditOnDropdown: false,
          }),
        ],
      });

      const workbook = univerAPI.createWorkbook(snapshot);
      let editorDisposed = false;
      const disposeEditor = () => {
        if (editorDisposed) {
          return;
        }

        editorDisposed = true;
        workbook.dispose();
        univer.dispose();
      };

      try {
        applyDropdowns(univerAPI, workbook, mapping, dropdowns, snapshot);
      } catch (error) {
        console.warn("No se pudieron cargar los dropdowns de la planilla.", error);
      }

      cleanup = disposeEditor;
      onReady({
        save: () => workbook.save(),
        dispose: disposeEditor,
      });
    })().catch((error: unknown) => {
      console.warn("No se pudo iniciar el editor de planilla.", error);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [dropdowns, mapping, onReady, snapshot]);

  return <div ref={containerRef} className="h-full min-h-0 w-full" />;
}
