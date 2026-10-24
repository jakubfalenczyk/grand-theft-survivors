# Zasady współpracy i architektury

## Globalne zasady współpracy

- Pytaj użytkownika o dodatkowe uprawnienia lub zgodę dopiero wtedy, gdy potrzebna czynność wykracza poza dotychczasowe upoważnienie, jest nieodwracalna albo wybór istotnie zmieni rezultat. Najpierw przygotuj kompletny, możliwy do oceny wynik w granicach udzielonego upoważnienia.
- Nie opieraj trwałego stanu pracy wyłącznie na historii rozmowy ani plikach tymczasowych, takich jak `/tmp`; istotne ustalenia zapisuj w odpowiednich, trwałych plikach projektu.
- Jeśli automatyzacja Chromium nie wystarcza do zweryfikowania zachowania, użyj rzeczywistego Chrome na Windows za pośrednictwem dostępnego rozszerzenia lub pluginu. Dobieraj metodę do scenariusza i nie traktuj ograniczeń trybu headless jako ograniczeń całej dostępnej weryfikacji.

## Obowiązujący stos

- Phaser **3.90**, TypeScript `strict`, Vite 7, Node.js 22.12+, npm z jednym `package-lock.json`. Typy Phasera pochodzą z jego pakietu; nie dodawaj `@types/phaser`.
- Używaj `.ts`, jawnych kontraktów danych i `import type`. Nie dodawaj `any`, `@ts-ignore` ani wyłączenia `strict` w celu obejścia błędów. Zawężaj typy; asercje ograniczaj do sprawdzonych granic bibliotek.
- Nie aktualizuj głównej wersji Phasera ani nie dodawaj drugiego menedżera pakietów w ramach zwykłego feature. Uzasadnienie wyboru narzędzi: `docs/ARCHITECTURE.md`.

## Granice modułów

- `src/main.ts` to wyłącznie importy stylów i bootstrap. `src/app` składa aplikację, zarządza rozmiarem i sprzątaniem.
- `src/game/scenes` koordynuje systemy i cykl życia sceny. Każda scena ma własny plik. Logikę gracza, generacji, renderowania i przyszłych feature umieszczaj w `src/game/features/<nazwa>/`.
- `src/game` nie odwołuje się do `document`/`window` ani nie importuje `ui`/`app`. `src/ui` nie importuje Phasera ani klas scen. Łącz je przez typowane zdarzenia, `GameSession` i niemutowalne snapshoty danych.
- `src/shared` zawiera wyłącznie kontrakty i kod niezależny od silnika, DOM oraz motywu. Nie przenoś tam kodu tylko dlatego, że trudno znaleźć mu miejsce.
- Dane świata, obrysy kolizji i renderer to odrębne odpowiedzialności. Generator zwraca zwykłe dane i przyjmuje seed; bez `Math.random`, GameObjectów i odwołań do sceny. Renderer nie dopisuje obiektów Phasera do wygenerowanego layoutu.
- Nie twórz na zapas pustych feature, frameworka ECS, globalnych singletonów ani generycznego systemu pluginów. Dodawaj abstrakcję po pojawieniu się rzeczywistej potrzeby.

## Kerbside

- Przeczytaj `design-system/kerbside-design-system/README.md` i `docs/THEMING.md` przed pracą nad wyglądem.
- Jedynym źródłem tokenów jest `design-system/kerbside-design-system/tokens.json`. Nowy token dodaj tam, potem `npm run theme:build`. Nie edytuj wygenerowanego `tokens.css`.
- Wspólne komponenty `.kb-*` są w kanonicznym `components.css`. Układ aplikacji jest w `src/ui/styles`. Kolory JS/Canvas/Phaser bierz z `src/theme/theme.ts`. Zakaz lokalnych literałów kolorów w UI i rendererach.
- Zachowuj role akcentów, fonty, twarde cienie, ścięcia i rozmiar celów 48 px. Bez rozmyć, świecenia, miękkich gradientów i zaokrąglonych kart. Frakcja zawsze z etykietą i właściwym kolorem tekstu; `muted` tylko dla tekstu nieaktywnego.
- Dialogi korzystają z `DialogController`, zatrzymują grę przez `GameSession`, zarządzają focusem i mają dostępne etykiety. Nie dopisuj niezależnych booleans dla mapy/pauzy/pomocy.

## Cykl życia, wydajność i weryfikacja

- Każda subskrypcja ma właściciela i cleanup. Zdarzenia na `game.events` usuwaj z konkretną funkcją podczas `SHUTDOWN`; nigdy cudzych listenerów. Sprzątaj DOM listenery, obserwatory i debug bridge przy odmontowaniu aplikacji.
- Tekstury są globalne w obrębie gry. Używaj stabilnych kluczy i sprawdzaj istnienie przed utworzeniem; restart sceny nie może mnożyć zasobów.
- Ruch licz w jednostkach świata/s, obrót w rad/s. Zachowaj jednakowy chód przód/tył (105), bieg do przodu (176), obrót (4.8). Nie zmieniaj balansu przy refaktorze.
- HUD aktualizuj snapshotami, nie zapisami do DOM w każdej klatce. Render świata nie może zależeć od fps. Pooling przeciwników i pocisków wprowadzaj z tymi feature, nie wcześniej.
- `npm run check` musi przejść: tokeny, typy, lint, format, unit, build, E2E. Testuj kontrakty, zachowanie i regresje; nie pisz testów wyłącznie odtwarzających implementację.
- Vite transpiluje TS bez sprawdzania typów. Udany dev server/build nie zastępuje `npm run typecheck`.
- Ustalenia architektury utrzymuj w `docs/ARCHITECTURE.md`, kierunek gry w `docs/DESIGN.md`, zasady motywu w `docs/THEMING.md`. Dokumentację aktualizuj razem z kodem.
