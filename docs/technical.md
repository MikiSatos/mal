# Dokumentacja techniczna

## Architektura systemu
Aplikacja została zaprojektowana w architekturze klient–serwer.

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express.js
- **Baza danych:** MongoDB (Mongoose)
- **Autoryzacja:** Google OAuth 2.0 (Passport.js)
- **Przechowywanie plików:** Cloudinary
- **Sesje:** express-session

## Struktura backendu
- `server.js` – punkt startowy aplikacji
- `routes/` – definicje endpointów API
- `controllers/` – logika obsługi żądań
- `models/` – modele danych (Mongoose)

## Endpointy API (przykłady)

### Artykuły
- `GET /articles`  
  Zwraca listę wszystkich artykułów.

- `POST /articles`  
  Tworzy nowy artykuł.  
  **Body:** title, content, image

- `GET /articles/:id`  
  Zwraca szczegóły pojedynczego artykułu.

### Komentarze
- `POST /articles/:id/comments`  
  Dodaje komentarz do artykułu.  
  **Body:** content

- `POST /comments/:id/replies`  
  Dodaje odpowiedź do komentarza.  
  **Body:** content

## Model danych

### Artykuł
- title: String
- content: String
- imageUrl: String
- author: User
- createdAt: Date

### Komentarz
- content: String
- author: User
- articleId: Article
- replies: [Comment]
- createdAt: Date

## Relacje
- Jeden artykuł → wiele komentarzy
- Jeden komentarz → wiele odpowiedzi

## Autoryzacja
Logowanie użytkowników realizowane jest za pomocą Google OAuth 2.0.
Sesje użytkowników są zarządzane przy użyciu `express-session`.
