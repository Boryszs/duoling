import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { QuizCategory } from "../models/quiz";
import { getCategories } from "../services/storage";

export function CategoryPage() {
  const { categoryId = "" } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<QuizCategory | null | undefined>(undefined);

  useEffect(() => {
    getCategories().then((items) => {
      setCategory(items.find((item) => item.id === decodeURIComponent(categoryId)) ?? null);
    });
  }, [categoryId]);

  if (category === undefined) return <p>Wczytywanie kategorii…</p>;
  if (category === null) {
    return (
      <div className="empty-state">
        <h2>Nie znaleziono kategorii</h2>
        <Link className="primary-button" to="/">Wróć do kategorii</Link>
      </div>
    );
  }

  return (
    <section className="mode-page">
      <button className="text-button" type="button" onClick={() => navigate(-1)}>← Wstecz</button>
      <span className="eyebrow">{category.questions.length} pytań</span>
      <h1>{category.name}</h1>
      <p>Wybierz sposób nauki.</p>

      <div className="mode-grid">
        <Link className="mode-card" to={`/quiz/${encodeURIComponent(category.id)}/random`}>
          <span className="mode-icon" aria-hidden="true">⚡</span>
          <h2>Losowe pytania</h2>
          <p>Po każdej odpowiedzi od razu zobaczysz wynik i poprawną odpowiedź.</p>
        </Link>

        <Link className="mode-card" to={`/quiz/${encodeURIComponent(category.id)}/all`}>
          <span className="mode-icon" aria-hidden="true">🏁</span>
          <h2>Wszystkie pytania</h2>
          <p>Rozwiąż pełny quiz. Wynik oraz poprawne odpowiedzi zobaczysz na końcu.</p>
        </Link>
      </div>
    </section>
  );
}
