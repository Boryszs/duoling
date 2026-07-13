# Angielskie słówka — 1000 pytań

Paczka zawiera 20 kategorii po 50 pytań, czyli łącznie 1000 unikalnych
angielskich słów i wyrażeń.

## Import do aplikacji

1. Rozpakuj archiwum.
2. Otwórz katalog `categories`.
3. Zaznacz wybrane pliki JSON albo wszystkie 20 plików.
4. Zaimportuj je do aplikacji.

Każdy plik z katalogu `categories` jest osobną kategorią w formacie:

- `category.id`
- `category.name`
- `questions[].id`
- `questions[].question`
- `questions[].answers`
- `questions[].correctAnswerId`
- `questions[].explanation`

Każde pytanie ma cztery odpowiedzi. Nie importuj pliku `manifest.json`;
zawiera on wyłącznie raport i listę plików.
