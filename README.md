# English Quiz App

Responsywna aplikacja React + TypeScript do nauki angielskiego z dynamicznie importowanych plików JSON i XLSX.

## Funkcje

- import wielu plików JSON i XLSX,
- każdy plik jako osobna kategoria,
- zapis danych w IndexedDB,
- tryb losowych pytań z natychmiastową informacją zwrotną,
- tryb wszystkich pytań z wynikiem i przeglądem odpowiedzi na końcu,
- responsywny interfejs na telefon i komputer,
- poprawiony kontrast, widoczny fokus i obsługa klawiatury,
- komunikaty dla czytników ekranu i semantyczny pasek postępu,
- potwierdzanie usunięcia kategorii oraz zakończenia niepełnego quizu,
- publikacja przez GitHub Pages,
- konfiguracja Capacitor dla Androida.

## Uruchomienie

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Zmień nazwę repozytorium w `vite.config.ts`, jeśli repozytorium nie nazywa się `english-quiz-app`.
2. W GitHub przejdź do `Settings -> Pages`.
3. Ustaw `Source` na `GitHub Actions`.
4. Wypchnij kod do gałęzi `main`.

## Android przez Capacitor

Po instalacji zależności:

```bash
npm run build
npx cap add android
npm run cap:android
```

## Format XLSX

Pierwszy arkusz powinien zawierać nagłówki:

```text
id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation
```

`correct_answer` przyjmuje wartości `A`, `B`, `C`, `D`, `E` lub `F`.
