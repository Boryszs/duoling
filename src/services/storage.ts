import { get, set } from "idb-keyval";
import type { QuizCategory, QuizResult } from "../models/quiz";

const CATEGORIES_KEY = "english-quiz.categories";
const LAST_RESULT_KEY = "english-quiz.last-result";

export async function getCategories(): Promise<QuizCategory[]> {
  return (await get<QuizCategory[]>(CATEGORIES_KEY)) ?? [];
}

export async function saveCategories(categories: QuizCategory[]): Promise<void> {
  await set(CATEGORIES_KEY, categories);
}

export async function saveLastResult(result: QuizResult): Promise<void> {
  await set(LAST_RESULT_KEY, result);
}

export async function getLastResult(): Promise<QuizResult | undefined> {
  return get<QuizResult>(LAST_RESULT_KEY);
}
