import skPdfTemplate from "../assets/skpdf.png";

export type PdfReportColumn<T> = {
  align?: "left" | "right";
  header: string;
  value: (row: T, index: number) => string | number | null | undefined;
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

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export function openOfficialPdfReport<T>({
  columns,
  fileName,
  generatedAt = new Date(),
  rows,
  summary = [],
  subtitle,
  title,
}: PdfReportOptions<T>) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");

  if (!reportWindow) {
    throw new Error("Allow pop-ups to export the PDF report.");
  }

  const summaryHtml = summary.length
    ? `<section class="summary">${summary
        .map(
          (item) => `
            <div>
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `,
        )
        .join("")}</section>`
    : "";
  const tableRows = rows.length
    ? rows
        .map(
          (row, rowIndex) => `
            <tr>
              ${columns
                .map(
                  (column) => `
                    <td class="${column.align === "right" ? "right" : ""}">
                      ${escapeHtml(column.value(row, rowIndex))}
                    </td>
                  `,
                )
                .join("")}
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty" colspan="${columns.length}">No records available.</td></tr>`;

  reportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page { margin: 0; size: A4 portrait; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #dce3ec;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
          }
          .toolbar {
            align-items: center;
            background: #0b1f3b;
            color: white;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding: 12px 18px;
            position: sticky;
            top: 0;
            z-index: 2;
          }
          .toolbar button {
            background: white;
            border: 0;
            border-radius: 6px;
            color: #0b1f3b;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            padding: 9px 14px;
          }
          .page {
            background: white;
            box-shadow: 0 12px 40px rgba(15, 23, 42, 0.22);
            margin: 24px auto;
            min-height: 297mm;
            overflow: hidden;
            padding: 70mm 22mm 24mm;
            position: relative;
            width: 210mm;
          }
          .template {
            height: 100%;
            inset: 0;
            object-fit: cover;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 0;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          h1 {
            font-size: 20px;
            letter-spacing: 0;
            margin: 0;
            text-align: center;
            text-transform: uppercase;
          }
          .subtitle {
            color: #475569;
            font-size: 12px;
            margin-top: 6px;
            text-align: center;
          }
          .generated {
            color: #64748b;
            font-size: 11px;
            margin-top: 14px;
            text-align: right;
          }
          .summary {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(3, 1fr);
            margin: 18px 0;
          }
          .summary div {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
          }
          .summary span {
            color: #64748b;
            display: block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .summary strong {
            display: block;
            font-size: 14px;
            margin-top: 4px;
          }
          table {
            border-collapse: collapse;
            font-size: 10.5px;
            margin-top: 18px;
            width: 100%;
          }
          th {
            background: #0b1f3b;
            color: white;
            font-size: 9px;
            letter-spacing: 0.04em;
            padding: 8px 7px;
            text-align: left;
            text-transform: uppercase;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 7px;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background: rgba(248, 250, 252, 0.72);
          }
          .right {
            text-align: right;
          }
          .empty {
            color: #64748b;
            padding: 24px;
            text-align: center;
          }
          @media print {
            body { background: white; }
            .toolbar { display: none; }
            .page {
              box-shadow: none;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <span>${escapeHtml(fileName)}</span>
          <button onclick="window.print()">Print / Save PDF</button>
        </div>
        <main class="page">
          <img alt="" class="template" src="${skPdfTemplate}" />
          <section class="content">
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
            <p class="generated">Generated ${escapeHtml(formatGeneratedDate(generatedAt))}</p>
            ${summaryHtml}
            <table>
              <thead>
                <tr>
                  ${columns
                    .map(
                      (column) =>
                        `<th class="${column.align === "right" ? "right" : ""}">${escapeHtml(column.header)}</th>`,
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 350);

  return fileName;
}
