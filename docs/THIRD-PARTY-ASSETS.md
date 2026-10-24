# Rejestr użytych materiałów zewnętrznych

Weryfikacja: 2026-10-24. Zasady: `../AGENTS.md`. Lista UI: sekcja „Autorzy i licencje” w `src/ui/shell.html`. Kopie licencji w `public/licenses/` są kopiowane przez Vite do publikowanego builda.

## Fonty

Źródłem warunków i poniższych oznaczeń praw są pliki `LICENSE` i metadane zainstalowanych paczek Fontsource, wersja 5.3.0 (wersje rozstrzyga `package-lock.json`). Pliki WOFF2 i warianty zapasowe WOFF są osadzane lokalnie przez `src/theme/index.css`; nie modyfikujemy fontów. W tabeli podano pliki WOFF2; dla każdego do builda trafia również plik WOFF o tej samej nazwie bazowej. Nie ustalono daty pierwotnego pobrania; data audytu powyżej.

| Materiał / podpis                                                                                     | Źródło paczki                                                   | Użyte pliki / zastosowanie                                                                                               | Licencja w buildzie                         |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Big Shoulders Display — Google Inc. (oznaczenie praw w paczce)                                        | https://www.npmjs.com/package/@fontsource/big-shoulders-display | `files/big-shoulders-display-latin-900-normal.woff2`, `files/big-shoulders-display-latin-ext-900-normal.woff2`; nagłówki | `public/licenses/big-shoulders-display.txt` |
| Barlow Semi Condensed — Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow)     | https://www.npmjs.com/package/@fontsource/barlow-semi-condensed | `files/barlow-semi-condensed-latin-600-normal.woff2`, `files/barlow-semi-condensed-latin-ext-600-normal.woff2`; tekst UI | `public/licenses/barlow-semi-condensed.txt` |
| Martian Mono — Copyright 2020 The Martian Mono Project Authors (https://github.com/evilmartians/mono) | https://www.npmjs.com/package/@fontsource/martian-mono          | `files/martian-mono-{latin,latin-ext}-{400,700}-normal.woff2`; etykiety i liczby                                         | `public/licenses/martian-mono.txt`          |

Wszystkie trzy: SIL Open Font License 1.1. Warunek dystrybucji: zachować oznaczenia praw i pełny tekst licencji z fontami (spełniany przez dołączone kopie). Podpis w UI jest dodatkową zasadą projektu, sama OFL nie wymaga osobnego ekranu credits. Przy zmianach fontów sprawdzić także zastrzeżone nazwy i pozostałe warunki OFL.

## Audio, modele i grafiki

Proponowane paczki audio nie zostały jeszcze użyte; pozostają w `AUDIO-CANDIDATES.md`. Grafika świata jest rysowana przez kod projektu, nie pochodzi z tych paczek. Rejestr dotyczy materiałów twórczych; licencje zależności programistycznych wymagają osobnej ewidencji przed publikacją.

## Szablon nowego wpisu

Weryfikacja wdrożenia sekcji UI (2026-10-24): build produkcyjny poprawny; sprawdzono rozwinięcie credits, dostępność wszystkich trzech pełnych licencji w buildzie i brak poziomego przepełnienia przy szerokości 390 px. Pełny zestaw E2E: 7/9 poprawnych; nie przeszły test zatrzymania na budynkach (x=1343 wobec oczekiwanego <1340) i test restartu sceny (licznik 1 zamiast 2). Przyczyny tych dwóch niepowodzeń nie zostały ustalone w ramach zmiany dokumentacji i credits.

- Tytuł, autor/podmiot praw i źródło:
- Wersja, data pobrania i data weryfikacji:
- Dokładne pliki oraz miejsce użycia w grze:
- Modyfikacje (lub „brak”):
- Nazwa/wersja licencji, źródło warunków i ścieżka zachowanej kopii:
- Użycie komercyjne / modyfikacje / dystrybucja w buildzie / ograniczenia:
- Attribution wymagane czy dobrowolne, dokładna treść podpisu i pozostałe notices:
- Miejsce w UI i dokumenty dołączane do publikowanego builda:
