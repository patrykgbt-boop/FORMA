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
2. Projekt Expo został utworzony: `patryk9xk3s-team/forma-sleep`, Project ID: `070ad17e-2d91-4253-be1f-bd0075a777de` (publiczny i już skonfigurowany w app.config.js). **Nie twórz drugiego projektu**.
3. W Expo Account settings → Access tokens wygeneruj token dla konta posiadającego dostęp do projektu. W GitHub repo FORMA → Settings → Secrets and variables → Actions → **Secrets** dodaj `FORMA`. Nie ujawniaj tokenu w kodzie, zrzutach ekranu ani rozmowie.
4. Uruchom workflow `FORMA Sleep Android - APK bez sklepu` ręcznie. Pobierz artefakt `FORMA-Sleep-Android-APK` **wyłącznie po sukcesie workflow** i zainstaluj `app-release.apk`.
5. Uruchom workflow `FORMA Sleep Android - publish OTA` ręcznie, aby opublikować pierwszą aktualizację kanału `production` (jeżeli jeszcze żadna nie została wydana). Następne zmiany w App.js i src/** na `main` publikują OTA automatycznie po skonfigurowaniu tokenu.
6. W aplikacji otwórz „Aktualizacje aplikacji”. Komunikat `OTA nieaktywne` oznacza, że masz APK bez połączenia z Expo.
7. Przetestuj aktualizację na Samsungu przy włączonym internecie i wyłączonym nagrywaniu. Sprawdź potem działanie monitorowania przy zablokowanym ekranie.

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
