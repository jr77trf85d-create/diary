# Diary veröffentlichen (GitHub Pages) und auf dem iPhone installieren

Warum nicht nur ein lokaler Server? Der Offline-Speicher der App (Service Worker)
funktioniert auf iOS nur über `https://`. Über `http://<IP-des-Mac>` entsteht nur ein
Lesezeichen, das ohne Server nicht öffnet. GitHub Pages stellt die App kostenlos
über `https://` bereit. Deine Trainingsdaten liegen trotzdem nur lokal auf dem iPhone.

## Teil 1: Repository anlegen (am Mac, im Browser)

1. Auf github.com einloggen.
2. Oben rechts auf **+** klicken, dann **New repository**.
3. **Repository name:** `diary` (nur Kleinbuchstaben, ohne Leerzeichen).
4. **Public** auswählen. Das ist bei kostenlosen Accounts Voraussetzung für Pages.
5. Alle Haken darunter (README, .gitignore, License) **nicht** setzen.
6. **Create repository** klicken.

## Teil 2: Dateien hochladen

1. Auf der neuen, leeren Repository-Seite den Link **uploading an existing file** anklicken.
2. Im Finder den Ordner
   `Documents/Claude/Projects/Training/DiaryWeb` öffnen.
3. Mit `Cmd + A` alles darin markieren (versteckte Dateien wie `.git` sind
   standardmäßig unsichtbar und werden nicht mitmarkiert, das ist gewollt).
4. Die markierten Dateien und Ordner in das GitHub-Browserfenster ziehen
   (Ordner `js`, `styles`, `icons` sowie `index.html`, `manifest.json`,
   `service-worker.js`, `INSTALLATION.md`).
5. Warten, bis alle Dateien in der Liste erscheinen (es sollten rund 30 sein).
6. Unten **Commit changes** klicken.

## Teil 3: GitHub Pages einschalten

1. Im Repository oben auf **Settings** klicken.
2. Links in der Seitenleiste **Pages** wählen.
3. Unter **Build and deployment** bei **Source** den Eintrag **Deploy from a branch** wählen.
4. Bei **Branch** `main` und `/ (root)` einstellen, dann **Save**.
5. 1 bis 2 Minuten warten und die Seite neu laden. Oben erscheint dann
   **"Your site is live at https://DEIN-NAME.github.io/diary/"**.

## Teil 4: Auf dem iPhone installieren

1. Das alte Diary-Icon vom Homescreen löschen (gedrückt halten, **App entfernen**).
2. In Safari `https://DEIN-NAME.github.io/diary/` öffnen und kurz warten.
3. Teilen-Symbol, **Zum Home-Bildschirm**, **Hinzufügen**.
4. Die App vom Homescreen starten und einmal mit Internetverbindung ein paar Sekunden
   offen lassen, damit sie sich offline speichert.
5. Test: Flugmodus an, App neu starten. Sie muss normal öffnen.

## Updates einspielen

Geänderte Dateien im Repository über **Add file, Upload files** erneut hochladen
(gleiche Dateinamen werden ersetzt). Beim nächsten Öffnen mit Internetverbindung holt
sich die App die neue Version. Eventuell einmal komplett schließen und neu starten.

## Gut zu wissen

- Kein Kabel, kein Mac, keine 7-Tage-Begrenzung, keine Kosten.
- Daten sind an die Adresse gebunden. Wenn sich die Adresse ändert (anderer
  Benutzername oder Repo-Name), startet die App leer.
