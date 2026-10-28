# FORMA Sleep iOS — instalacja bez dodatkowych opłat na Windows

**Wybrana metoda (bez 99 USD/rok):** GitHub Actions na bezpłatnym runnerze macOS dla publicznego repozytorium buduje NIEPODPISANY plik IPA, a bezpłatny Sideloadly podpisuje go na komputerze Windows przy użyciu darmowego Apple ID. MacBook i TestFlight nie są potrzebne.

1. Otwórz https://github.com/patrykgbt-boop/FORMA/actions/workflows/forma-sleep-unsigned-ipa.yml
2. Jeżeli nie ma gotowego pliku, użyj Run workflow → main → Run workflow. Poczekaj na wynik. Zielony wynik oznacza zakończony build i dostępny artifact, czerwony — błąd; nie instaluj wtedy niczego.
3. Kliknij udany workflow → Artifacts → FORMA-Sleep-iOS-unsigned-IPA. Pobierz archiwum GitHub i wyodrębnij `FORMA-Sleep-unsigned.ipa` na Windowsie.
4. Zainstaluj https://sideloadly.io/ oraz wymagane przez Sideloadly składniki Apple iTunes/iCloud. Nie przesyłaj hasła do Apple ID przez ChatGPT.
5. Podłącz iPhone kablem, odblokuj go i zatwierdź „Ufaj temu komputerowi”.
6. Otwórz Sideloadly, wybierz pobrany IPA i iPhone, wykonaj podpisanie i instalację bezpłatnym Apple ID. Jeśli iPhone wymaga trybu deweloperskiego, włącz go w Ustawienia → Prywatność i ochrona → Tryb dewelopera.
7. Otwórz FORMA Sleep, przyznaj mikrofon, zrób krótką sesję z zablokowanym ekranem, a dopiero potem test nocny.
8. **Co 7 dni** Sideloadly musi ponownie podpisać aplikację. Włącz funkcję automatycznego odświeżania i zapewnij połączenie iPhone–Windows w tej samej sieci lub USB. Przy aktualizacji podpisuj tę samą aplikację tym samym Apple ID.

**Uwaga:** kod natywny oraz kompilacja wymagają pierwszego udanego przebiegu CI; ich zgodność z rzeczywistym iPhone 16 Pro nie została jeszcze potwierdzona. Zmiany w kodzie PWA nie zastępują instalacji IPA.

## Alternatywa opcjonalna

TestFlight / EAS Build wymaga płatnego członkostwa Apple Developer i jest opcjonalną drogą dystrybucji — **nie korzystamy z niej** w wariancie bezpłatnym.

## Dokumentacja programistyczna (poprzedni wariant płatny, tylko referencyjnie)

# FORMA Sleep iOS — natywny monitor

Stan: kod źródłowy przygotowany; nie skompilowano ani nie zainstalowano go jeszcze na iPhonie. Nie mylić z już działającym modułem FORMA Sleep w PWA.

## Funkcje
- Logowanie do tego samego konta Supabase Auth co FORMA (e-mail i hasło).
- Ręczne uruchamianie nocnego nagrywania, po wyrażeniu zgody na dostęp do mikrofonu.
- iOS background audio przez wtyczkę Expo Audio, także podczas zablokowanego ekranu (do zweryfikowania na iPhonie).
- Po zakończeniu: analiza pliku lokalnie przez natywny moduł Swift Apple SoundAnalysis.
- Rozpoznanie dostępnych etykiet klasyfikatora związanych z chrapaniem i kaszlem. Brak etykiety = brak danych, nie zero chrapania.
- Poranne potwierdzenie zasypiania, czuwania i jakości snu, synchronizacja z sleep_nights i daily_entries w Supabase FORMA.
- Podsumowania oczekujące na synchronizację pozostają lokalnie w SQLite/localStorage.
- Surowy dźwięk nigdy nie jest przesyłany do Supabase; po analizie plik jest usuwany. Po przerwaniu mogą zostać pliki do ręcznego wyczyszczenia.

## Kompilacja na Windows
Wymagane: Node.js 22+, konto Expo, płatne konto Apple Developer Program do podpisania aplikacji na fizyczny iPhone, App Store Connect do TestFlight.
1. Sklonuj repo FORMA. Wejdź do katalogu mobile/forma-sleep-ios.
2. Uruchom npm install, a następnie npx expo install --check. W razie ostrzeżeń uruchom npx expo install --fix i zapisz package-lock.json.
3. Skopiuj .env.example do .env i wstaw publiczny klucz Supabase publishable z panelu projektu (nie service_role).
4. Uruchom npx expo login oraz npx eas-cli@latest init. Zweryfikuj unikalność ios.bundleIdentifier.
4a. W Expo (Project settings > Environment variables) skonfiguruj dla środowiska production dwie zmienne publiczne: EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, tak aby były dostępne w EAS Build (same lokalne pliki .env są ignorowane przez Git). Alternatywnie użyj eas env:set --name ... --value ... --environment production --visibility plaintext.
5. Uruchom npx eas-cli@latest build --platform ios --profile production.
6. Uruchom npx eas-cli@latest submit --platform ios --profile production, skonfiguruj test wewnętrzny App Store Connect i zaproś swoje konto do TestFlight.
7. Zainstaluj aplikację przez TestFlight na iPhonie 16 Pro i przeprowadź poniższy test.
Mac ani publiczna publikacja w App Store nie są wymagane. Samo Expo Go nie obsługuje naszej lokalnej warstwy Swift.

## Testy
- [ ] Zaloguj się tym samym kontem co FORMA.
- [ ] Nagraj 2 minuty z zablokowanym ekranem, sprawdź czas i działanie mikrofonu.
- [ ] Zatrzymaj, uruchom lokalną analizę, sprawdź, czy etykiety Apple obejmują snoring.
- [ ] Przy braku etykiety chrapania powinna pojawić się informacja o braku danych, nie 0 min.
- [ ] Sprawdź zachowanie po odłączeniu internetu i ponowną synchronizację.
- [ ] Sprawdź wpis w FORMA PWA na Windows oraz iPhonie.
- [ ] Sprawdź przerwania połączeniem telefonicznym, pracę przy zablokowanym ekranie, usuwanie plików, baterię i pamięć.

## Ograniczenia
- Monitoring jest uruchamiany ręcznie; aplikacja nie może niezawodnie włączyć mikrofonu automatycznie przy zablokowanym ekranie.
- Długość snu to oszacowanie na podstawie czasu sesji i danych deklarowanych rano, nie pomiar EEG.
- Apple SoundAnalysis nie jest walidowanym medycznie detektorem chrapania lub bezdechu; wyniki mogą zawierać fałszywe alarmy.
- Może przechwycić dźwięki innych osób w pomieszczeniu; konieczna jest ich świadomość.
- Telefon należy trzymać na szafce nocnej, nie pod poduszką.

Źródła: https://docs.expo.dev/versions/latest/sdk/audio/ oraz https://developer.apple.com/documentation/soundanalysis
