# Kandydaci audio — 2026-10-24

Wstępny wybór na podstawie opisów autorów, bez odsłuchu, pobierania ani integracji. Kierunek: miejskie tło, konkretne kroki i krótkie efekty walki, pasujące do kamery z góry i atmosfery końca lat 90. Obecny prototyp ma ruch i menu; broń jest planowana.

## Dostęp

Katalog https://itch.io/game-assets/free/tag-royalty-free/tag-sound-effects zwrócił w narzędziu WWW 403. Strony poniższych paczek są czytelne. Próba uruchomienia computer-use zakończyła się błędem `sandboxCwd is not a local file URI` dla katalogu projektu WSL; nie sprawdzono strony w Chrome.

## Propozycje

| Zastosowanie                             | Paczka                                                                                                        | Potwierdzone informacje autora                                                                                                                                                                                                                  | Kierunek selekcji po odsłuchu                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chód i bieg                              | [Free Footsteps Sound Effects — Mayra](https://mayragandra.itch.io/free-footsteps-sound-effects)              | Beton, trawa, żwir i inne podłoża; ZIP 1,2 MB. Aktualny opis dopuszcza użycie komercyjne bez obowiązkowego uznania autorstwa. Starszy komentarz autorki wskazuje inne zasady kredytowania; zachować aktualne warunki z archiwum i dodać credit. | Beton na chodnikach/ulicach, trawa w parkach, żwir na odpowiednim podłożu. Sprawdzić, czy pliki to pojedyncze kroki czy dłuższe nagrania; dobrać warianty.    |
| Menu, mapa, pauza                        | [Interface SFX Pack 1 — ObsydianX](https://obsydianx.itch.io/interface-sfx-pack-1)                            | Ponad 200 efektów, inspiracja RPG z epoki PSX; Confirm, Back, Cursor, Error; WAV i OGG; CC0, opcjonalna wpłata.                                                                                                                                 | Krótki, stonowany cursor i para confirm/back; odrzucić zbyt melodyjne warianty.                                                                               |
| Tło miasta                               | [Free City Ambiences — rawAmbience](https://rawambience.itch.io/free-city-ambiences)                          | 10 nagrań, 21:12, WAV stereo 48 kHz/24 bit, 359 MB; darmowe pobranie przez zewnętrzny Gumroad. Autor deklaruje darmowe royalty-free użycie osobiste i komercyjne na swoim profilu: https://itch.io/profile/rawambience.                         | Cichy szum ruchu ulicznego. Wybrać fragment i przygotować pętlę z crossfadem; opis nie gwarantuje gotowych pętli. Sprawdzić pełną licencję w pobranej paczce. |
| Pistolet, SMG, strzelba — przyszła walka | [Snake’s SECOND Authentic Gun Sounds Pack](https://f8studios.itch.io/snakes-second-authentic-gun-sounds-pack) | 68 unikalnych dźwięków, 9 mm, .308, 20 Gauge, mechanizmy i przeładowania; WAV/MP3, warianty z naturalnym pogłosem i bez. ZIP 12 MB; darmowe użycie komercyjne bez obowiązkowych credits, autor potwierdza public domain/CC0 w komentarzach.     | 9 mm na broń startową, 20 Gauge na strzelbę; zacząć od wersji bez pogłosu i ocenić zmęczenie przy częstym auto shoot.                                         |
| Karabiny — przyszła walka                | [Snake’s Authentic Gun Sounds](https://f8studios.itch.io/snakes-authentic-gun-sounds)                         | 54 unikalne efekty; .22LR, 5.56, 7.62x39, 7.62x54r i obsługa broni. WAV/MP3; ZIP 11 MB; darmowe użycie komercyjne, credit opcjonalny.                                                                                                           | 5.56 lub 7.62x39 jako wyraźnie odmienna broń; krótkie warianty.                                                                                               |

## Następny krok

### Wymagania attribution — sprawdzenie 2026-10-24

- Mayra: aktualny opis mówi, że credit nie jest wymagany, ale mile widziany. Starszy komentarz sugeruje obowiązek podpisu dla darmowej wersji; przed integracją zachować warunki z pobranej paczki. Zgodnie z zasadą projektu i tak podajemy autorkę.
- ObsydianX: CC0 1.0, bez obowiązku attribution; podpis dodamy dobrowolnie.
- SnakeF8: oba opisy wprost zwalniają z obowiązku credit i dopuszczają użycie komercyjne; podpis dodamy dobrowolnie.
- rawAmbience: wymagania dla darmowej paczki pozostają niepotwierdzone. [Ogólne warunki](https://rawambience.com/terms-conditions/) nie nakazują podpisu, lecz dotyczą zakupu, dopuszczają gry i jednocześnie zawierają szeroki zakaz redystrybucji materiału as-is, także w większym dziele. Przed użyciem trzeba ustalić warunki konkretnej darmowej paczki i dystrybucji w grze przeglądarkowej; sam tag royalty-free nie wystarcza. Status: nie wdrażać do czasu wyjaśnienia.

Wszystkie propozycje pozostają kandydatami, nie wpisami listy materiałów użytych w grze. Przy integracji obowiązuje `../AGENTS.md` i rejestr `THIRD-PARTY-ASSETS.md`.

Najpierw odsłuchać kroki i UI oraz przetestować ciche tło w obecnym sandboxie. Przy dodawaniu walki dobrać broń i osobno znaleźć trafienia, obrażenia gracza, pickup XP i awans. Przed integracją zapisać licencję, źródło i nazwy wybranych plików; tworzyć małe wersje do przeglądarki zamiast publikować całe archiwa.
