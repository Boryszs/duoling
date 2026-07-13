import type { QuizAnswer, QuizCategory, QuizQuestion, SourceType } from "../models/quiz";
import { createId } from "../utils/id";

type RawJsonQuestion = {
  id?: string;
  question?: string;
  answers?: Array<{ id?: string; text?: string }>;
  correctAnswerId?: string;
  explanation?: string;
};

type RawJsonFile = {
  category?: { id?: string; name?: string };
  questions?: RawJsonQuestion[];
};

type XlsxRow = Record<string, unknown>;

function fileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function normalizeAnswerId(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function validateQuestion(question: QuizQuestion, position: number): void {
  if (!question.question.trim()) {
    throw new Error(`Pytanie ${position}: brak treści pytania.`);
  }
  if (question.answers.length < 2) {
    throw new Error(`Pytanie ${position}: wymagane są co najmniej dwie odpowiedzi.`);
  }
  if (!question.answers.some((answer) => answer.id === question.correctAnswerId)) {
    throw new Error(`Pytanie ${position}: poprawna odpowiedź nie istnieje na liście odpowiedzi.`);
  }
}

function buildCategory(
  file: File,
  sourceType: SourceType,
  name: string,
  categoryId: string | undefined,
  questions: QuizQuestion[]
): QuizCategory {
  if (questions.length === 0) {
    throw new Error("Plik nie zawiera żadnych pytań.");
  }

  questions.forEach((question, index) => validateQuestion(question, index + 1));

  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) {
      throw new Error(`Powtórzony identyfikator pytania: ${question.id}`);
    }
    ids.add(question.id);
  }

  return {
    id: categoryId?.trim() || createId("category"),
    name: name.trim() || fileNameWithoutExtension(file.name),
    sourceFileName: file.name,
    sourceType,
    importedAt: new Date().toISOString(),
    questions
  };
}

async function importJson(file: File): Promise<QuizCategory> {
  let parsed: RawJsonFile;
  try {
    parsed = JSON.parse(await file.text()) as RawJsonFile;
  } catch {
    throw new Error("Nieprawidłowy format JSON.");
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error("JSON musi zawierać tablicę questions.");
  }

  const questions = parsed.questions.map((raw, index): QuizQuestion => {
    const answers: QuizAnswer[] = Array.isArray(raw.answers)
      ? raw.answers
          .map((answer, answerIndex) => ({
            id: answer.id?.trim() || String.fromCharCode(97 + answerIndex),
            text: answer.text?.trim() || ""
          }))
          .filter((answer) => answer.text.length > 0)
      : [];

    return {
      id: raw.id?.trim() || createId(`question-${index + 1}`),
      question: raw.question?.trim() || "",
      answers,
      correctAnswerId: normalizeAnswerId(raw.correctAnswerId),
      explanation: raw.explanation?.trim() || undefined
    };
  });

  return buildCategory(
    file,
    "JSON",
    parsed.category?.name || fileNameWithoutExtension(file.name),
    parsed.category?.id,
    questions
  );
}

function getCell(row: XlsxRow, ...names: string[]): string {
  for (const name of names) {
    const foundKey = Object.keys(row).find((key) => key.trim().toLowerCase() === name.toLowerCase());
    if (foundKey) {
      return String(row[foundKey] ?? "").trim();
    }
  }
  return "";
}

async function importXlsx(file: File): Promise<QuizCategory> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Plik XLSX nie zawiera arkusza.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<XlsxRow>(sheet, { defval: "" });

  const questions = rows.map((row, index): QuizQuestion => {
    const answerPairs = [
      ["a", getCell(row, "answer_a", "a")],
      ["b", getCell(row, "answer_b", "b")],
      ["c", getCell(row, "answer_c", "c")],
      ["d", getCell(row, "answer_d", "d")],
      ["e", getCell(row, "answer_e", "e")],
      ["f", getCell(row, "answer_f", "f")]
    ] as const;

    const answers = answerPairs
      .filter(([, text]) => text.length > 0)
      .map(([id, text]) => ({ id, text }));

    return {
      id: getCell(row, "id") || createId(`question-${index + 1}`),
      question: getCell(row, "question", "pytanie"),
      answers,
      correctAnswerId: normalizeAnswerId(getCell(row, "correct_answer", "correctanswer", "poprawna_odpowiedz")),
      explanation: getCell(row, "explanation", "wyjasnienie") || undefined
    };
  });

  const firstRow = rows[0] ?? {};
  const categoryName = getCell(firstRow, "category", "category_name", "kategoria") || fileNameWithoutExtension(file.name);

  return buildCategory(file, "XLSX", categoryName, undefined, questions);
}

export async function importQuizFile(file: File): Promise<QuizCategory> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json") {
    return importJson(file);
  }
  if (extension === "xlsx") {
    return importXlsx(file);
  }
  throw new Error("Obsługiwane są wyłącznie pliki JSON i XLSX.");
}
