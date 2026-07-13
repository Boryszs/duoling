import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { QuizCategory, QuizResult } from "../models/quiz";
import { getCategories, getLastResult } from "../services/storage";

export function ResultPage() {
  const { categoryId = "" } = useParams();
  const [category, setCategory] = useState<QuizCategory | null | undefined>(undefined);
  const [result, setResult] = useState<QuizResult | null | undefined>(undefined);

  useEffect(() => {
    Promise.all([getCategories(), getLastResult()]).then(([categories, storedResult]) => {
      setCategory(categories.find((item) => item.id === decodeURIComponent(categoryId)) ?? null);
      setResult(storedResult ?? null);
    });
  }, [categoryId]);

  const stats = useMemo(() => {
    if (!category || !result) return null;
    const correct = result.answers.filter((answer) => {
      const question = category.questions.find((item) => item.id === answer.questionId);
      return question?.correctAnswerId === answer.selectedAnswerId;
    }).length;
    const unanswered = result.answers.filter((answer) => !answer.selectedAnswerId).length;
    const wrong = result.answers.length - correct - unanswered;
    const percent = result.answers.length === 0 ? 0 : Math.round((correct / result.answers.length) * 100);
    return { correct, wrong, unanswered, percent };
  }, [category, result]);

  if (category === undefined || result === undefined) return <p role="status">Obliczanie wyniku…</p>;
  if (!category || !result || !stats || result.categoryId !== category.id) return <Navigate to="/" replace />;

  return (
    <section className="result-page" aria-labelledby="result-title">
      <div className="result-card">
        <span className="eyebrow">Wynik</span>
        <div className="score-circle" role="img" aria-label={`Wynik: ${stats.percent} procent`}>{stats.percent}%</div>
        <h1 id="result-title">{category.name}</h1>
        <div className="stats-grid" aria-label="Podsumowanie wyniku">
          <div><strong>{stats.correct}</strong><span>poprawnych</span></div>
          <div><strong>{stats.wrong}</strong><span>błędnych</span></div>
          <div><strong>{stats.unanswered}</strong><span>bez odpowiedzi</span></div>
        </div>
        <div className="result-actions">
          <Link className="primary-button" to={`/quiz/${encodeURIComponent(category.id)}/all`}>Rozwiąż ponownie</Link>
          <Link className="secondary-button" to="/">Kategorie</Link>
        </div>
      </div>

      <div className="review-list">
        <h2>Przegląd odpowiedzi</h2>
        {result.answers.map((resultAnswer, index) => {
          const question = category.questions.find((item) => item.id === resultAnswer.questionId);
          if (!question) return null;
          const selected = question.answers.find((answer) => answer.id === resultAnswer.selectedAnswerId);
          const correct = question.answers.find((answer) => answer.id === question.correctAnswerId);
          const isCorrect = resultAnswer.selectedAnswerId === question.correctAnswerId;
          const unanswered = !resultAnswer.selectedAnswerId;

          return (
            <article className={isCorrect ? "review-card review-correct" : "review-card review-wrong"} key={question.id}>
              <div className="review-card-heading">
                <span className="eyebrow">Pytanie {index + 1}</span>
                <span className={isCorrect ? "review-status correct-status" : "review-status wrong-status"}>
                  {isCorrect ? "✓ Poprawna" : unanswered ? "— Bez odpowiedzi" : "✕ Błędna"}
                </span>
              </div>
              <h3>{question.question}</h3>
              <p>Twoja odpowiedź: <strong>{selected?.text ?? "Brak odpowiedzi"}</strong></p>
              {!isCorrect && <p>Poprawna odpowiedź: <strong>{correct?.text}</strong></p>}
              {question.explanation && <p className="explanation">{question.explanation}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
