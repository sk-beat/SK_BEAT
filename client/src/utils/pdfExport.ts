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

const pageWidth = 1240;
const pageHeight = 1754;
const marginX = 130;
const headerTop = 420;
const rowHeight = 42;

function text(value: string | number | null | undefined) {
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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load PDF template image."));
    image.src = src;
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1] ?? "";
    if (context.measureText(value).width > maxWidth * maxLines) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 3))}...`;
    }
  }

  return lines.length ? lines : [""];
}

function drawCellText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  align: "left" | "right" = "left",
) {
  const padding = 10;
  const maxWidth = width - padding * 2;
  const lines = wrapText(context, value, maxWidth, 2);
  context.textAlign = align;

  lines.forEach((line, index) => {
    context.fillText(
      line,
      align === "right" ? x + width - padding : x + padding,
      y + 17 + index * 14,
      maxWidth,
    );
  });
}

function getColumnWidths<T>(columns: Array<PdfReportColumn<T>>, tableWidth: number) {
  const fixedWidth = columns.reduce((sum, column) => sum + (column.width ?? 0), 0);
  const flexibleColumns = columns.filter((column) => !column.width).length;
  const flexibleWidth = flexibleColumns ? (tableWidth - fixedWidth) / flexibleColumns : 0;

  return columns.map((column) => column.width ?? flexibleWidth);
}

function drawReportPage<T>({
  columns,
  generatedAt,
  pageNumber,
  rows,
  rowsStartIndex,
  summary,
  subtitle,
  template,
  title,
}: {
  columns: Array<PdfReportColumn<T>>;
  generatedAt: Date;
  pageNumber: number;
  rows: T[];
  rowsStartIndex: number;
  summary: Array<{ label: string; value: string | number | null | undefined }>;
  subtitle?: string;
  template: HTMLImageElement;
  title: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare PDF canvas.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);
  context.drawImage(template, 0, 0, pageWidth, pageHeight);

  context.fillStyle = "#111827";
  context.textAlign = "center";
  context.font = "700 28px Arial";
  context.fillText(title.toUpperCase(), pageWidth / 2, headerTop, pageWidth - marginX * 2);

  if (subtitle) {
    context.fillStyle = "#475569";
    context.font = "18px Arial";
    context.fillText(subtitle, pageWidth / 2, headerTop + 32, pageWidth - marginX * 2);
  }

  context.textAlign = "right";
  context.fillStyle = "#64748b";
  context.font = "15px Arial";
  context.fillText(`Generated ${formatGeneratedDate(generatedAt)}`, pageWidth - marginX, headerTop + 68);

  let y = headerTop + 100;
  if (pageNumber === 1 && summary.length > 0) {
    const summaryWidth = (pageWidth - marginX * 2 - 24) / 3;
    summary.slice(0, 3).forEach((item, index) => {
      const x = marginX + index * (summaryWidth + 12);
      context.fillStyle = "rgba(248, 250, 252, 0.85)";
      context.strokeStyle = "#cbd5e1";
      context.lineWidth = 1;
      context.fillRect(x, y, summaryWidth, 68);
      context.strokeRect(x, y, summaryWidth, 68);
      context.fillStyle = "#64748b";
      context.font = "700 13px Arial";
      context.textAlign = "left";
      context.fillText(item.label.toUpperCase(), x + 12, y + 24, summaryWidth - 24);
      context.fillStyle = "#111827";
      context.font = "700 19px Arial";
      context.fillText(text(item.value), x + 12, y + 50, summaryWidth - 24);
    });
    y += 96;
  }

  const tableWidth = pageWidth - marginX * 2;
  const columnWidths = getColumnWidths(columns, tableWidth);
  let x = marginX;
  context.fillStyle = "#0b1f3b";
  context.fillRect(marginX, y, tableWidth, rowHeight);
  context.fillStyle = "#ffffff";
  context.font = "700 13px Arial";
  columns.forEach((column, index) => {
    const width = columnWidths[index] ?? 0;
    drawCellText(context, column.header.toUpperCase(), x, y + 7, width, column.align);
    x += width;
  });
  y += rowHeight;

  context.font = "15px Arial";
  if (rows.length === 0) {
    context.fillStyle = "rgba(248, 250, 252, 0.85)";
    context.fillRect(marginX, y, tableWidth, rowHeight * 2);
    context.strokeStyle = "#cbd5e1";
    context.strokeRect(marginX, y, tableWidth, rowHeight * 2);
    context.fillStyle = "#64748b";
    context.textAlign = "center";
    context.fillText("No records available.", pageWidth / 2, y + 48);
  } else {
    rows.forEach((row, rowIndex) => {
      context.fillStyle = rowIndex % 2 === 0 ? "rgba(255,255,255,0.72)" : "rgba(248,250,252,0.82)";
      context.fillRect(marginX, y, tableWidth, rowHeight);
      context.strokeStyle = "#cbd5e1";
      context.strokeRect(marginX, y, tableWidth, rowHeight);

      x = marginX;
      context.fillStyle = "#111827";
      columns.forEach((column, columnIndex) => {
        const width = columnWidths[columnIndex] ?? 0;
        drawCellText(
          context,
          text(column.value(row, rowsStartIndex + rowIndex)),
          x,
          y + 5,
          width,
          column.align,
        );
        x += width;
      });
      y += rowHeight;
    });
  }

  context.fillStyle = "#64748b";
  context.font = "13px Arial";
  context.textAlign = "center";
  context.fillText(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 58);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function binaryFromDataUrl(dataUrl: string) {
  return atob(dataUrl.split(",")[1] ?? "");
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfFromJpegs(images: string[], fileName: string) {
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  images.forEach((dataUrl, index) => {
    const imageData = binaryFromDataUrl(dataUrl);
    const imageObjectId = objects.length + 1;
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${pageWidth} /Height ${pageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageData.length} >>\nstream\n${imageData}\nendstream`);

    const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im${index} Do Q`;
    const contentObjectId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    const pageObjectId = objects.length + 1;
    pageObjectIds.push(pageObjectId);
    objects.push(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
  });

  const pagesObjectId = objects.length + 1;
  objects.push(`<< /Type /Pages /Kids ${pageObjectIds.map((id) => `${id} 0 R`).join(" ")} /Count ${pageObjectIds.length} >>`);
  const catalogObjectId = objects.length + 1;
  objects.push(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
  const infoObjectId = objects.length + 1;
  objects.push(`<< /Title (${pdfEscape(fileName)}) /Producer (SK BEAT) >>`);

  const fixedObjects = objects.map((object) =>
    object.replace("/Parent 0 0 R", `/Parent ${pagesObjectId} 0 R`),
  );
  let pdf = "%PDF-1.3\n";
  const offsets = [0];
  fixedObjects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${fixedObjects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${fixedObjects.length + 1} /Root ${catalogObjectId} 0 R /Info ${infoObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }

  return new Blob([bytes], { type: "application/pdf" });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  const template = await loadImage(skPdfTemplate);
  const firstPageRows = 21;
  const otherPageRows = 25;
  const pages: string[] = [];
  let rowIndex = 0;

  if (rows.length === 0) {
    pages.push(
      drawReportPage({
        columns,
        generatedAt,
        pageNumber: 1,
        rows: [],
        rowsStartIndex: 0,
        summary,
        subtitle,
        template,
        title,
      }),
    );
  }

  while (rowIndex < rows.length) {
    const rowsPerPage = pages.length === 0 ? firstPageRows : otherPageRows;
    const pageRows = rows.slice(rowIndex, rowIndex + rowsPerPage);
    pages.push(
      drawReportPage({
        columns,
        generatedAt,
        pageNumber: pages.length + 1,
        rows: pageRows,
        rowsStartIndex: rowIndex,
        summary,
        subtitle,
        template,
        title,
      }),
    );
    rowIndex += rowsPerPage;
  }

  downloadBlob(buildPdfFromJpegs(pages, fileName), fileName);
  return fileName;
}
