// Reads the bulk download CSV: column 1 is the file name, column 2 is the name printed on the certificate.

export type BulkRow = {
  line: number
  fileName: string
  name: string
}

export type BulkCsv = {
  rows: BulkRow[]
  // Line numbers of rows skipped because the certificate name was empty.
  skipped: number[]
}

export const MAX_BULK_ROWS = 500

// Splits CSV text into rows of cells. Handles quoted cells, doubled quotes, and line breaks inside quotes.
function parseCsv(text: string, delimiter: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"'
        index++
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"' && cell === "") {
      quoted = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += char
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// Excel in many locales, including Indonesian, saves CSV with semicolons.
function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ""
  return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
}

const headerWords = /^(file ?name|filename|download(able)? name|nama file|name|nama|recipient|penerima)$/i

export function readBulkCsv(text: string): BulkCsv {
  const clean = text.replace(/^﻿/, "")
  const parsed = parseCsv(clean, detectDelimiter(clean))
    .map((cells, index) => ({ line: index + 1, cells: cells.map((cell) => cell.trim()) }))
    .filter(({ cells }) => cells.some(Boolean))

  // A first row like "file name,name" is a header, not a certificate.
  const [first] = parsed
  if (first && first.cells.slice(0, 2).every((cell) => headerWords.test(cell))) parsed.shift()

  const rows: BulkRow[] = []
  const skipped: number[] = []
  for (const { line, cells } of parsed) {
    const [fileName = "", name = ""] = cells
    if (!name) {
      skipped.push(line)
      continue
    }
    rows.push({ line, fileName: fileName || name, name })
  }
  return { rows, skipped }
}

// Turns a file name from the CSV into a safe, unique one with the right extension.
export function uniqueFileNames(rows: BulkRow[], extension: string) {
  const used = new Map<string, number>()
  return rows.map(({ fileName }) => {
    const base = fileName
      .replace(/\.(pdf|png)$/i, "")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "certificate"
    const key = base.toLowerCase()
    const count = (used.get(key) ?? 0) + 1
    used.set(key, count)
    return `${count > 1 ? `${base} (${count})` : base}.${extension}`
  })
}

export const exampleCsv = "file name,name\nalex-morgan,Alex Morgan\njordan-lee,Jordan Lee\n"
