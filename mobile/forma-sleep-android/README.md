# FORMA Sleep Android — Samsung Galaxy A52s

Bezpłatny APK z GitHub Actions. Monitorowanie i synchronizacja z FORMA (Supabase); brak rozpoznawania chrapania w wersji testowej.

## Aktualizacje OTA — Expo EAS Update

Aplikacja zawiera `expo-updates`. Po poprawnym połączeniu projektu Expo i zainstalowaniu **nowego APK OTA**:
- Przy pełnym uruchomieniu automatycznie sprawdza i pobiera aktualizacje kodu JS. Zwykle zaczynają działać przy kolejnym pełnym uruchomieniu.
- W sekcji **Aktualizacje aplikacji** można ręcznie sprawdzić, pobrać i zastosować aktualizację.
- Nie restartuje się samoczynnie w trakcie nagrywania. Ręczne zastosowanie jest zablokowane podczas aktywnej sesji.
- Nowa biblioteka natywna, zmiana uprawnień, Expo SDK lub Android wymaga nowego APK i zmiany `runtimeVersion` przy niekompatybilnych zmianach.
- Stary APK sprzed wdrożenia OTA **nie potrafi** otrzymywać OTA.

### Pierwsze uruchomienie usługi (jednorazowo)

1. Załóż bezpłatne konto na https://expo.dev/ (nie jest potrzebny Play Store ani Mac).
2. Utwórz projekt Expo dla `forma-sleep-android` (np. przez `npx eas-cli@latest init` uruchomione w `mobile/forma-sleep-android` na Windows; instalacja Node.js wymagana) i odczytaj **Project ID** (UUID) w Expo. Nie twórz kolejnych projektów przy każdym buildzie.
3. W GitHub repo FORMA → Settings → Secrets and variables → Actions → **Variables** ustaw `EXPO_EAS_PROJECT_ID` = Project ID.
4. W Expo Account settings → Access tokens wygeneruj token. W GitHub → Actions → **Secrets** dodaj `EXPO_TOKEN`. Token powinien mieć możliwie ograniczony zakres uprawnień. Nigdy nie wpisuj tokenu do kodu ani GitHub Variables.
5. Uruchom workflow `FORMA Sleep Android - APK bez sklepu` ręcznie. Pobierz artefakt `FORMA-Sleep-Android-APK` **wyłącznie po sukcesie workflow** i zainstaluj `app-release.apk`.
6. Uruchom workflow `FORMA Sleep Android - publish OTA` ręcznie, aby opublikować pierwszą aktualizację kanału `production` (jeżeli jeszcze żadna nie została wydana). Następne zmiany w App.js i src/** na `main` publikują OTA automatycznie po skonfigurowaniu tokenu.
7. W aplikacji otwórz „Aktualizacje aplikacji”. Komunikat `OTA nieaktywne` oznacza, że masz APK bez połączenia z Expo.
8. Przetestuj aktualizację na Samsungu przy włączonym internecie i wyłączonym nagrywaniu. Sprawdź potem działanie monitorowania przy zablokowanym ekranie.

**Ograniczenie:** EAS Update ma plan Free z limitami. Nie wymaga karty płatniczej ani dodatkowej opłaty w ramach limitu. GitHub Actions pozostaje budowniczym APK (EAS Build nie jest używany).

### Uwagi o instalacji APK
- APK z workflow jest podpisany testowo. Jeżeli podpis zmienił się między kompilacjami, Android może zażądać odinstalowania starej aplikacji. **Przed odinstalowaniem zsynchronizuj sesje**, ponieważ lokalne wyniki i logowanie mogą zostać utracone.
- Po pierwszym OTA-APK dalsze aktualizacje JS nie wymagają ponownej instalacji.
- Pobieraj APK wyłącznie z https://github.com/patrykgbt-boop/FORMA/actions/workflows/forma-sleep-android-apk.yml.

## Monitorowanie i ograniczenia
- Włącz mikrofon i zezwól na pracę podczas zablokowanego ekranu: Ustawienia → Aplikacje → FORMA Sleep → Bateria → Bez ograniczeń.
- Rozpoczynaj nagrywanie ręcznie; system Android może przerwać je przy małej ilości pamięci, ograniczeniach baterii lub przychodzącym połączeniu.
- Po nocy wpisz zasypianie, czuwanie i ocenę, następnie zapisz wynik do FORMA.
- Pliki audio nie są wysyłane do Supabase; jeśli pozostały po awarii, możesz użyć „Wyczyść nagrania lokalne”.
- Nie mierzymy REM, bezdechu ani snu głębokiego. Przy telefonie na wspólnej szafce nocnej uszanowanie prywatności innych osób jest konieczne.

Dokumentacja: https://docs.expo.dev/eas-update/getting-started/ ; https://docs.expo.dev/versions/latest/sdk/updates/
