export type CsvRow = Record<string, string>;

/** Minimal RFC4180-ish CSV parser for local dataset files. */
export function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };

  const pushRow = () => {
    // Ignore fully empty trailing rows.
    if (currentRow.length === 1 && currentRow[0] === "" && rows.length > 0) {
      currentRow = [];
      return;
    }
    rows.push(currentRow);
    currentRow = [];
  };

  const text = content.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushField();
      continue;
    }

    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((header) => header.trim());
  const dataRows = rows.slice(1).map((values) => {
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { headers, rows: dataRows };
}
