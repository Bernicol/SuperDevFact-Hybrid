# SUPER DEV FACT — Client hybride (Web + WebView2)

Même produit, même socle métier que le client lourd natif : [SuperDevFact-Heavy](https://github.com/Bernicol/SuperDevFact-Heavy),
avec une interface entièrement différente : une API HTTP + un front React, empaquetés
dans un shell natif WebView2 (même famille d'approche qu'Electron). Aucune ligne de
logique métier n'a été dupliquée pour construire ce second client.

> POC réalisé dans un contexte de démonstration technique, en environ 8 heures de
> travail. Ce délai reflète la contrainte de l'exercice (aller vite vers un résultat
> démontrable), pas la vélocité visée en conditions de production réelles.

## Architecture

```
src/
  SuperDevFact.Domain          → règles métier pures (identique au client lourd)
  SuperDevFact.Application     → cas d'usage, DTOs, orchestration (identique)
  SuperDevFact.Infrastructure  → EF Core / PostgreSQL (identique)
  SuperDevFact.Api             → API ASP.NET Core exposant les cas d'usage en HTTP/JSON
  SuperDevFact.Shell           → shell natif WebView2 (démarre l'API, ouvre la fenêtre)
client/                        → front React + Vite + Tailwind + Recharts
tests/
installer/
  SuperDevFact-Light.iss       → script Inno Setup (packaging Windows)
```

Domain/Application/Infrastructure sont la copie exacte de ceux du client lourd :
c'est la démonstration concrète qu'un même socle métier peut être exposé par
plusieurs interfaces sans duplication de logique.

## Prérequis

- .NET 9 SDK
- Node.js 18+ (pour le front React)
- Une base PostgreSQL accessible (locale ou distante)
- [Inno Setup](https://jrsoftware.org/isinfo.php) (uniquement pour générer l'installeur)

## Configuration

Créer `src/SuperDevFact.Api/appsettings.Secrets.json` (ignoré par Git) :

```json
{
  "ConnectionStrings": {
    "Default": "Host=...;Port=5432;Database=...;Username=...;Password=..."
  }
}
```

## Lancer le projet en développement

```bash
dotnet ef database update --project src/SuperDevFact.Infrastructure --connection "<votre chaîne de connexion>"

# Terminal 1 : API
dotnet run --project src/SuperDevFact.Api --urls http://localhost:5080

# Terminal 2 : front (proxy vers l'API sur /api)
cd client && npm install && npm run dev
```

Le jeu de données de démonstration se crée automatiquement au premier lancement de
l'API si la base est vide.

## Lancer le shell natif (WebView2)

```bash
cd client && npm run build   # génère src/SuperDevFact.Api/wwwroot
dotnet run --project src/SuperDevFact.Shell
```

## Tests

```bash
dotnet test
```

## Publier / packager

```bash
cd client && npm run build
dotnet publish src/SuperDevFact.Shell -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o publish/shell
```

Le build republie automatiquement l'API (self-contained) dans `publish/shell/api/`.

Avant de compiler l'installeur, télécharger le bootstrap WebView2 (non versionné) :

```bash
curl -L -o installer/assets/MicrosoftEdgeWebview2Setup.exe "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
ISCC.exe installer/SuperDevFact-Light.iss
```
