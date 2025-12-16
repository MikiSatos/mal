# Dokumentacja funkcjonalna

## Widoki aplikacji
- Lista artykułów
- Szczegóły artykułu
- Dodawanie artykułu
- Logowanie użytkownika (Google)

## Scenariusze użytkownika

### Przeglądanie artykułów
1. Użytkownik otwiera stronę główną.
2. System wyświetla listę dostępnych artykułów.

### Dodawanie artykułu
1. Użytkownik loguje się za pomocą Google.
2. Przechodzi do formularza dodawania artykułu.
3. Wprowadza tytuł, treść oraz opcjonalnie obraz.
4. Artykuł zostaje zapisany w bazie danych.

### Dodawanie komentarza
1. Użytkownik otwiera szczegóły artykułu.
2. Wprowadza treść komentarza.
3. Komentarz zostaje przypisany do wybranego artykułu.

### Odpowiadanie na komentarz
1. Użytkownik wybiera komentarz.
2. Dodaje odpowiedź.
3. Odpowiedź jest zapisywana jako element powiązany z komentarzem.

## Ograniczenia
- Dodawanie artykułów i komentarzy wymaga zalogowania użytkownika.
- Niezalogowani użytkownicy mogą jedynie przeglądać treści.
