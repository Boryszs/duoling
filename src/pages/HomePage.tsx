import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { QuizCategory } from "../models/quiz";
import { importQuizFile } from "../services/importer";
import { getCategories, saveCategories } from "../services/storage";

interface ImportStatus {
  fileName: string;
  success: boolean;
  message: string;
}

export function HomePage() {
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [statuses, setStatuses] = useState<ImportStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryToRemove, setCategoryToRemove] = useState<QuizCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const nextCategories = [...categories];
    const nextStatuses: ImportStatus[] = [];

    for (const file of Array.from(files)) {
      try {
        const category = await importQuizFile(file);
        const existingIndex = nextCategories.findIndex(
          (item) => item.sourceFileName === category.sourceFileName || item.id === category.id
        );
        if (existingIndex >= 0) {
          nextCategories[existingIndex] = category;
        } else {
          nextCategories.push(category);
        }
        nextStatuses.push({
          fileName: file.name,
          success: true,
          message: `Zaimportowano ${category.questions.length} pytań.`
        });
      } catch (error) {
        nextStatuses.push({
          fileName: file.name,
          success: false,
          message: error instanceof Error ? error.message : "Nieznany błąd importu."
        });
      }
    }

    setCategories(nextCategories);
    setStatuses(nextStatuses);
    await saveCategories(nextCategories);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirmRemoveCategory() {
    if (!categoryToRemove) return;

    const next = categories.filter((category) => category.id !== categoryToRemove.id);
    setCategories(next);
    setCategoryToRemove(null);
    await saveCategories(next);
  }

  return (
    <section aria-labelledby="home-title">
      <div className="hero-card">
        <div>
          <span className="eyebrow">Nauka angielskiego</span>
          <h1 id="home-title">Dynamiczne quizy z własnych plików</h1>
          <p>Dodaj wiele plików JSON lub XLSX. Każdy plik utworzy osobną kategorię.</p>
        </div>
        <label className="primary-button file-button">
          Importuj pliki
          <input
            ref={fileInputRef}
            className="visually-hidden-file-input"
            type="file"
            accept=".json,.xlsx"
            multiple
            aria-label="Wybierz pliki JSON lub XLSX do zaimportowania"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </label>
      </div>

      {statuses.length > 0 && (
        <div className="status-list" role="status" aria-live="polite" aria-atomic="true">
          {statuses.map((status) => (
            <div
              key={`${status.fileName}-${status.message}`}
              className={status.success ? "status success" : "status error"}
            >
              <strong>{status.fileName}</strong>: {status.message}
            </div>
          ))}
        </div>
      )}

      <div className="section-heading">
        <div>
          <span className="eyebrow">Biblioteka</span>
          <h2>Kategorie</h2>
        </div>
        <a className="secondary-button" href="./samples/irregular-verbs.json" download>
          Pobierz przykładowy JSON
        </a>
      </div>

      {loading ? (
        <p role="status">Wczytywanie danych…</p>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <h3>Brak kategorii</h3>
          <p>Zaimportuj pierwszy plik JSON lub XLSX, aby rozpocząć naukę.</p>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((category) => (
            <article className="category-card" key={category.id}>
              <div>
                <span className="source-badge">{category.sourceType}</span>
                <h3>{category.name}</h3>
                <p>{category.questions.length} pytań</p>
                <small>{category.sourceFileName}</small>
              </div>
              <div className="card-actions">
                <Link className="primary-button" to={`/category/${encodeURIComponent(category.id)}`}>
                  Rozpocznij
                </Link>
                <button
                  className="danger-button"
                  type="button"
                  aria-label={`Usuń kategorię ${category.name}`}
                  onClick={() => setCategoryToRemove(category)}
                >
                  Usuń
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={categoryToRemove !== null}
        title="Usunąć kategorię?"
        description={categoryToRemove
          ? `Kategoria „${categoryToRemove.name}” i wszystkie jej pytania zostaną usunięte z tego urządzenia.`
          : "Kategoria zostanie usunięta."}
        confirmLabel="Usuń kategorię"
        dangerous
        onCancel={() => setCategoryToRemove(null)}
        onConfirm={() => void confirmRemoveCategory()}
      />
    </section>
  );
}
