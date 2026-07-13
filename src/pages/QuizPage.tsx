import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ProgressBar } from "../components/ProgressBar";
import type { QuizCategory, QuizQuestion, QuizResultAnswer } from "../models/quiz";
import { getCategories, saveLastResult } from "../services/storage";
import { shuffle } from "../utils/shuffle";

function getNextRandomIndex(total: number, currentIndex: number) {
  if (total <= 1) return 0;
  const offset = Math.floor(Math.random() * (total - 1)) + 1;
  return (currentIndex + offset) % total;
}

export function QuizPage() {
  const { categoryId = "", mode = "all" } = useParams();
  const navigate = useNavigate();
  const isRandom = mode === "random";
  const [category, setCategory] = useState<QuizCategory | null | undefined>(undefined);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomRound, setRandomRound] = useState(1);
  const [randomSelectedAnswerId, setRandomSelectedAnswerId] = useState<string | undefined>();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getCategories().then((items) => {
      const found = items.find((item) => item.id === decodeURIComponent(categoryId)) ?? null;
      setCategory(found);
      if (found) {
        setQuestions(shuffle(found.questions));
        setCurrentIndex(0);
        setRandomRound(1);
        setRandomSelectedAnswerId(undefined);
        setSelectedAnswers({});
        setChecked(false);
      }
    });
  }, [categoryId]);

  useEffect(() => {
    if (checked) feedbackRef.current?.focus();
  }, [checked]);

  useEffect(() => {
    if (currentIndex > 0) questionHeadingRef.current?.focus();
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const selectedAnswerId = isRandom
    ? randomSelectedAnswerId
    : currentQuestion
      ? selectedAnswers[currentQuestion.id]
      : undefined;
  const isCorrect = Boolean(currentQuestion && selectedAnswerId === currentQuestion.correctAnswerId);

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );
  const unansweredCount = Math.max(questions.length - answeredCount, 0);

  if (category === undefined) return <p role="status">Wczytywanie quizu…</p>;
  if (category === null) return <Navigate to="/" replace />;
  if (!currentQuestion) return <p>Brak pytań.</p>;

  function selectAnswer(answerId: string) {
    if (isRandom && checked) return;
    if (isRandom) {
      setRandomSelectedAnswerId(answerId);
      return;
    }
    setSelectedAnswers((current) => ({ ...current, [currentQuestion.id]: answerId }));
  }

  function nextRandomQuestion() {
    setChecked(false);
    setRandomSelectedAnswerId(undefined);
    setRandomRound((round) => round + 1);
    setCurrentIndex((index) => getNextRandomIndex(questions.length, index));
    window.setTimeout(() => questionHeadingRef.current?.focus(), 0);
  }

  async function finishAllQuiz() {
    const answers: QuizResultAnswer[] = questions.map((question) => ({
      questionId: question.id,
      selectedAnswerId: selectedAnswers[question.id]
    }));

    await saveLastResult({
      categoryId: category!.id,
      categoryName: category!.name,
      mode: "ALL",
      answers,
      finishedAt: new Date().toISOString()
    });

    navigate(`/result/${encodeURIComponent(category!.id)}`);
  }

  function requestFinishQuiz() {
    if (unansweredCount > 0) {
      setShowFinishConfirmation(true);
      return;
    }
    void finishAllQuiz();
  }

  return (
    <section className="quiz-page" aria-labelledby="question-title">
      <div className="quiz-header">
        <button
          className="text-button close-button"
          type="button"
          aria-label="Zamknij quiz i wróć"
          onClick={() => navigate(-1)}
        >
          <span aria-hidden="true">✕</span>
        </button>
        {isRandom ? (
          <p className="quiz-counter" aria-live="polite">Runda {randomRound}</p>
        ) : (
          <ProgressBar current={answeredCount} total={questions.length} />
        )}
      </div>

      <div className="question-card">
        <span className="eyebrow">{isRandom ? "Tryb losowy" : `Pytanie ${currentIndex + 1}`}</span>
        <h1 id="question-title" ref={questionHeadingRef} tabIndex={-1}>{currentQuestion.question}</h1>

        <div className="answer-list" role="group" aria-label="Wybierz jedną odpowiedź">
          {currentQuestion.answers.map((answer) => {
            const selected = selectedAnswerId === answer.id;
            const correct = checked && answer.id === currentQuestion.correctAnswerId;
            const wrong = checked && selected && !correct;
            const classNames = ["answer-button", selected ? "selected" : "", correct ? "correct" : "", wrong ? "wrong" : ""]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                type="button"
                className={classNames}
                key={answer.id}
                aria-pressed={selected}
                disabled={isRandom && checked}
                onClick={() => selectAnswer(answer.id)}
              >
                <span className="answer-letter" aria-hidden="true">{answer.id.toUpperCase()}</span>
                <span>{answer.text}</span>
                {correct && <span className="sr-only">Poprawna odpowiedź</span>}
                {wrong && <span className="sr-only">Wybrana niepoprawna odpowiedź</span>}
              </button>
            );
          })}
        </div>
      </div>

      {isRandom ? (
        <div className="quiz-footer">
          {!checked ? (
            <button
              className="primary-button wide"
              type="button"
              disabled={!selectedAnswerId}
              onClick={() => setChecked(true)}
            >
              Sprawdź odpowiedź
            </button>
          ) : (
            <div
              ref={feedbackRef}
              className={isCorrect ? "feedback correct-feedback" : "feedback wrong-feedback"}
              role="status"
              aria-live="polite"
              tabIndex={-1}
            >
              <div>
                <h2>{isCorrect ? "Dobrze!" : "Niepoprawna odpowiedź"}</h2>
                {!isCorrect && (
                  <p>
                    Poprawna odpowiedź: <strong>{currentQuestion.answers.find((answer) => answer.id === currentQuestion.correctAnswerId)?.text}</strong>
                  </p>
                )}
                {currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}
              </div>
              <button className="primary-button" type="button" onClick={nextRandomQuestion}>Następne pytanie</button>
            </div>
          )}
        </div>
      ) : (
        <div className="quiz-navigation">
          <button
            className="secondary-button"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            Poprzednie
          </button>

          {currentIndex < questions.length - 1 ? (
            <button className="primary-button" type="button" onClick={() => setCurrentIndex((index) => index + 1)}>
              Następne
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={requestFinishQuiz}>
              Zakończ quiz
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showFinishConfirmation}
        title="Zakończyć niepełny quiz?"
        description={`Nie udzielono odpowiedzi na ${unansweredCount} ${unansweredCount === 1 ? "pytanie" : "pytań"}. Zostaną one oznaczone jako bez odpowiedzi.`}
        confirmLabel="Zakończ mimo to"
        onCancel={() => setShowFinishConfirmation(false)}
        onConfirm={() => {
          setShowFinishConfirmation(false);
          void finishAllQuiz();
        }}
      />
    </section>
  );
}
