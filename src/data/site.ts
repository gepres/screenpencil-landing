// Enlaces y constantes del ecosistema ScreenPencil.
// Un único punto de verdad: cambia aquí versión y URLs.

export const site = {
  name: "ScreenPencil",
  version: "v0.2.1",
  // Marketing
  url: "https://gepres.github.io/screenpencil-landing/",
  // Releases (repo público de vitrina)
  releasesRepo: "https://github.com/gepres/screenpencil-releases",
  releasesLatest: "https://github.com/gepres/screenpencil-releases/releases/latest",
  downloadWindows:
    "https://github.com/gepres/screenpencil-releases/releases/download/v0.2.1/ScreenPencil-Setup-0.2.1.exe",
  // GitHub API para el badge de versión
  releasesApi:
    "https://api.github.com/repos/gepres/screenpencil-releases/releases/latest",
  // Donaciones
  coffee: "https://buymeacoffee.com/genaropreta",
  sponsors: "https://github.com/sponsors/gepres",
  paypal: "https://www.paypal.com/paypalme/gepresdonacion",
  // Backend de analítica (panel /admin)
  analyticsApi: "https://screenpencil-backend.onrender.com",
} as const;
