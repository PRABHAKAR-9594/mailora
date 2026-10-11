import Papa from "papaparse";

export interface ParsedRecipient {
  email: string;
  companyName?: string;
  hrName?: string;
  role?: string;
  contactNo?: string;
  [key: string]: string | undefined; // allow extra columns
}

export interface ParseResult {
  data: ParsedRecipient[];
  errors: string[];
}

/**
 * Parses a CSV string and returns an array of recipient objects.
 * Requires at least an 'email' column.
 */
export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = [];

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ""),
  });

  if (result.errors.length > 0) {
    result.errors.forEach((e) => errors.push(e.message));
  }

  // Validate email column exists
  if (result.data.length === 0) {
    return { data: [], errors: ["CSV file is empty or has no valid rows."] };
  }

  const firstRow = result.data[0];
  const hasEmailColumn =
    "email" in firstRow ||
    "emailaddress" in firstRow ||
    "e-mail" in firstRow;

  if (!hasEmailColumn) {
    return {
      data: [],
      errors: [
        "CSV must contain an 'email' column. Please download the sample CSV template for the correct format.",
      ],
    };
  }

  const parsed: ParsedRecipient[] = result.data
    .map((row) => {
      const email =
        (row["email"] || row["emailaddress"] || row["e-mail"] || "").trim();
      if (!email) return null;

      return {
        email,
        companyName: row["companyname"] || row["company"] || "",
        hrName: row["hrname"] || row["hr"] || row["name"] || "",
        role: row["role"] || row["jobtitle"] || row["position"] || "",
        contactNo: row["contactno"] || row["phone"] || row["contact"] || "",
        ...row,
      };
    })
    .filter(Boolean) as ParsedRecipient[];

  if (parsed.length === 0) {
    errors.push("No valid email addresses found in the CSV.");
  }

  return { data: parsed, errors };
}
