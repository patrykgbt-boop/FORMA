# FORMA Sleep Android — Samsung Galaxy A52s

**Pierwsza wersja testowa.** Bez Google Play, bez płatnego konta deweloperskiego i bez MacBooka. APK przygotowuje GitHub Actions w repozytorium publicznym.

## Funkcje i ograniczenia
- Logowanie istniejącym kontem FORMA (Supabase).
- Nagrywanie mikrofonu uruchamiane przez użytkownika. Android używa foreground service z widocznym stałym powiadomieniem podczas blokady ekranu (do sprawdzenia na prawdziwym Samsungu).
- Obliczenie czasu trwania sesji; rano wpisujesz minuty zasypiania, czuwanie i ocenę snu.
- Synchronizacja z public.sleep_nights (source: android) oraz daily_entries.sleep_hours; wynik oczekujący na synchronizację pozostaje na telefonie.
- Plik surowego audio jest usuwany lokalnie po zatrzymaniu sesji (o ile system na to pozwoli), nigdy nie wysyłamy go do Supabase.
- W tej wersji **nie ma jeszcze rozpoznawania chrapania**. Nie udajemy, że 0 min to wynik badania. Nie mierzymy snu REM, głębokiego ani bezdechu.

## Jak zainstalować
1. Otwórz https://github.com/patrykgbt-boop/FORMA/actions/workflows/forma-sleep-android-apk.yml.
2. Gdy przebieg ma status success (zielony), kliknij go i w sekcji Artifacts pobierz FORMA-Sleep-Android-APK (ZIP).
3. Rozpakuj ZIP, skopiuj app-release.apk na Samsunga (USB lub dysk prywatny) i otwórz w Moje pliki.
4. Udziel Moje pliki jednorazowej zgody na instalację aplikacji z tego źródła, gdy Android o to poprosi.
5. Włącz FORMA Sleep, nadaj mikrofon i zaloguj się tym samym kontem FORMA co na iPhonie.
6. W ustawieniach Samsung: Aplikacje → FORMA Sleep → Bateria → Bez ograniczeń (nazwy w One UI mogą się różnić).
7. Przetestuj 2–5 minut z zablokowanym ekranem, po czym zakończ i zapisz wynik.
8. Na iPhonie otwórz główną FORMA → Sen; zobaczysz zsynchronizowane dane z Androida.

## Aktualizacje
- APK jest podpisany kluczem kompilacji testowej. Jeżeli podpis zmieni się między buildami, Android może wymagać odinstalowania wcześniejszej wersji przed zainstalowaniem nowej. Zawsze zsynchronizuj zaległe pomiary.
- Nie instaluj z przypadkowych stron; pobieraj wyłącznie z GitHub projektu FORMA.

## Ważne
- Mikrofon uruchamiaj w widocznej aplikacji. Praca w tle wymaga usługi z powiadomieniem i pozwolenia na mikrofon.
- Oszczędzanie baterii, przychodzące rozmowy lub brak pamięci mogą przerwać nagrywanie.
- Nie zostawiaj telefonu pod poduszką przy ładowaniu. Nagrywanie może przechwycić dźwięki współlokatorów — uzgodnij to z nimi.

Źródła: https://docs.expo.dev/versions/latest/sdk/audio/ ; https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
