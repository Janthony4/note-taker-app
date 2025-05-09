# Note Taker

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass Folgendes auf Ihrem System installiert ist:
- **Docker** 
- **Docker Compose** 
- **Git** 

## Erste Schritte

```bash
git clone https://github.com/Janthony4/note-taker-app
cd note-taker-app

docker-compose up -d --build

```
Docker sollte automatisch alle Voraussetzungen für die Ausführung der Anwendung installieren. Anschließend kann das Frontend auf [http://localhost:5173](http://localhost:5173/) geöffnet werden.

Öffnen Sie Postman und importieren Sie die folgende Datei: „NoteTakerAPI.postman_collection.json“.
Jetzt können Sie die API mit die Postman-Sammlung testen. 

Beachten Sie: Wenn Sie das Hochladen, Anzeigen und Löschen von Anhänge testen möchten, müssen Sie in der „Create Note“ endpunkt im Abschnitt „attachments“ der Body tab eine hochzuladende Datei (5MB oder kleiner) auswählen.
