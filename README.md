# Projekt Blogowy

## Opis projektu
Jest to aplikacja typu full-stack umożliwiająca tworzenie artykułów, komentowanie ich oraz odpowiadanie na komentarze.
Projekt posiada backend oparty o REST API, bazę danych oraz autoryzację użytkowników.

## Główne funkcjonalności
- Przeglądanie listy artykułów
- Dodawanie nowych artykułów (z możliwością dodania obrazu)
- Wyświetlanie szczegółów artykułu
- Dodawanie komentarzy do artykułów
- Odpowiadanie na komentarze
- Logowanie użytkowników za pomocą Google OAuth

## Wykorzystane technologie
### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Passport.js (Google OAuth 2.0)
- Express Session

### Dodatkowe narzędzia
- Multer & Cloudinary (upload obrazów)
- CORS

## Struktura projektu
```
project-root/
│── server.js
│── package.json
│── models/
│── routes/
│── controllers/
│── docs/
│   ├── technical.md
│   └── functional.md
```

## Uruchomienie lokalne
1. Sklonuj repozytorium:
```bash
git clone https://github.com/USERNAME/REPOSITORY_NAME.git
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Uruchom serwer:
```bash
npm start
```

4. Otwórz aplikację w przeglądarce:
```
https://mal-usev.onrender.com
```

## Materiały projektowe
- Prezentacja PDF: [Zobacz prezentację](docs/prezentacja.pdf)
- Nagranie wideo: https://youtu.be/FA6vkxsV9U4

## Autorzy
- Ilya Raiko 68949
- Aidana Abylkasymova 69486
