import { jsPDF } from "jspdf";
import skPdfTemplate from "../assets/skpdf.png";

export type PdfReportColumn<T> = {
  align?: "left" | "right";
  header: string;
  value: (row: T, index: number) => string | number | null | undefined;
  width?: number;
};

export type PdfReportOptions<T> = {
  columns: Array<PdfReportColumn<T>>;
  fileName: string;
  generatedAt?: Date;
  rows: T[];
  summary?: Array<{ label: string; value: string | number | null | undefined }>;
  subtitle?: string;
  title: string;
};

const pageWidth = 210;
const pageHeight = 297;
const marginX = 20;
const contentTop = 72;
const rowHeight = 8;

function valueText(value: string | number | null | undefined) {
  return String(value ?? "");
}

function formatGeneratedDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function loadPngDataUrl(src: string) {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error("Unable to load PDF template image.");
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to prepare PDF template."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to prepare PDF template."));
    reader.readAsDataURL(blob);
  });
}

function getColumnWidths<T>(columns: Array<PdfReportColumn<T>>, tableWidth: number) {
  const fixedWidth = columns.reduce((sum, column) => sum + (column.width ?? 0), 0);
  const flexibleColumns = columns.filter((column) => !column.width).length;
  const flexibleWidth = flexibleColumns ? (tableWidth - fixedWidth) / flexibleColumns : 0;

  return columns.map((column) => column.width ?? flexibleWidth);
}

function addTemplatePage(pdf: jsPDF, templateDataUrl: string) {
  pdf.addImage(templateDataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
}

function drawHeader(
  pdf: jsPDF,
  title: string,
  subtitle: string | undefined,
  generatedAt: Date,
) {
  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title.toUpperCase(), pageWidth / 2, contentTop, {
    align: "center",
    maxWidth: pageWidth - marginX * 2,
  });

  if (subtitle) {
    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(subtitle, pageWidth / 2, contentTop + 6, {
      align: "center",
      maxWidth: pageWidth - marginX * 2,
    });
  }

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(7);
  pdf.text(`Generated ${formatGeneratedDate(generatedAt)}`, pageWidth - marginX, contentTop + 13, {
    align: "right",
  });
}

function drawSummary(
  pdf: jsPDF,
  summary: Array<{ label: string; value: string | number | null | undefined }>,
  y: number,
) {
  if (summary.length === 0) return y;

  const cardGap = 3;
  const cardWidth = (pageWidth - marginX * 2 - cardGap * 2) / 3;
  const cardHeight = 14;

  summary.slice(0, 3).forEach((item, index) => {
    const x = marginX + index * (cardWidth + cardGap);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, y, cardWidth, cardHeight, "S");
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.text(item.label.toUpperCase(), x + 2.5, y + 4.5, { maxWidth: cardWidth - 5 });
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(8);
    pdf.text(valueText(item.value), x + 2.5, y + 10, { maxWidth: cardWidth - 5 });
  });

  return y + cardHeight + 7;
}

function drawTableHeader<T>(
  pdf: jsPDF,
  columns: Array<PdfReportColumn<T>>,
  columnWidths: number[],
  y: number,
) {
  let x = marginX;
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(marginX, y, pageWidth - marginX * 2, rowHeight, "S");
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.3);

  columns.forEach((column, index) => {
    const width = columnWidths[index] ?? 0;
    if (index > 0) {
      pdf.line(x, y, x, y + rowHeight);
    }
    pdf.text(column.header.toUpperCase(), x + width / 2, y + 5, {
      align: "center",
      maxWidth: width - 4,
    });
    x += width;
  });

  return y + rowHeight;
}

function drawTableRow<T>(
  pdf: jsPDF,
  columns: Array<PdfReportColumn<T>>,
  columnWidths: number[],
  row: T,
  rowIndex: number,
  y: number,
) {
  let x = marginX;
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(marginX, y, pageWidth - marginX * 2, rowHeight, "S");
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.7);

  columns.forEach((column, columnIndex) => {
    const width = columnWidths[columnIndex] ?? 0;
    const cellText = valueText(column.value(row, rowIndex));
    const lines = pdf.splitTextToSize(cellText, width - 4).slice(0, 2);
    if (columnIndex > 0) {
      pdf.line(x, y, x, y + rowHeight);
    }
    pdf.text(lines, x + width / 2, y + 3.4, {
      align: "center",
      maxWidth: width - 4,
    });
    x += width;
  });
}

export async function downloadOfficialPdfReport<T>({
  columns,
  fileName,
  generatedAt = new Date(),
  rows,
  summary = [],
  subtitle,
  title,
}: PdfReportOptions<T>) {
  const templateDataUrl = await loadPngDataUrl(skPdfTemplate);
  const pdf = new jsPDF({
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  });
  const tableWidth = pageWidth - marginX * 2;
  const columnWidths = getColumnWidths(columns, tableWidth);
  const firstPageRows = 21;
  const otherPageRows = 25;
  let rowIndex = 0;
  let pageNumber = 1;

  function addPage(pageRows: T[], startIndex: number) {
    if (pageNumber > 1) {
      pdf.addPage();
    }

    addTemplatePage(pdf, templateDataUrl);
    drawHeader(pdf, title, subtitle, generatedAt);
    let y = contentTop + 20;

    if (pageNumber === 1) {
      y = drawSummary(pdf, summary, y);
    }

    y = drawTableHeader(pdf, columns, columnWidths, y);

    if (pageRows.length === 0) {
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(marginX, y, tableWidth, rowHeight * 2, "S");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.text("No records available.", pageWidth / 2, y + 11, { align: "center" });
    } else {
      pageRows.forEach((row, index) => {
        drawTableRow(pdf, columns, columnWidths, row, startIndex + index, y);
        y += rowHeight;
      });
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(7);
    pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    pageNumber += 1;
  }

  if (rows.length === 0) {
    addPage([], 0);
  }

  while (rowIndex < rows.length) {
    const rowsPerPage = pageNumber === 1 ? firstPageRows : otherPageRows;
    addPage(rows.slice(rowIndex, rowIndex + rowsPerPage), rowIndex);
    rowIndex += rowsPerPage;
  }

  pdf.save(fileName);
  return fileName;
}
