# Damm Pulse

Prototip per al repte de Damm a UAB THE HACK! 2026: mesurar el clima laboral de manera àgil, contínua i anònima.

Tot el codi de l'app és a [`frontend/`](frontend/). És només frontend: les dades són sintètiques i es desen al `localStorage` del navegador. Encara no hi ha backend ni enviaments reals per WhatsApp, correu o Teams.

## Posar-lo en marxa

```bash
cd frontend
npm install
npm run dev
```

Obre l'adreça que mostra Vite (per defecte http://localhost:5173).

## Què hi ha

| Ruta | Pantalla |
|---|---|
| `#/` | Selector de rol (sense autenticació) |
| `#/rrhh` | Portal RRHH: inici, mapa del clima, propostes de la IA |
| `#/rrhh/crear` | Crear enquesta amb IA en 4 passos (objectiu, preguntes, públic i canals, revisió) |
| `#/rrhh/enquestes` | Gestió d'enquestes per estat |
| `#/rrhh/enquestes/:id` | Difusió: enllaç únic, QR i missatges preparats per canal |
| `#/rrhh/participacio`, `#/rrhh/analisi` | Participació, biaix i anàlisi |
| `#/rrhh/world`, `#/rrhh/placa` | Damm World i La Plaça en 3D (vista RRHH) |
| `#/rrhh/accions` | Tauler d'accions i microenquestes de seguiment |
| `#/app` | App del treballador, amb el botó d'enquesta sempre a un toc |
| `#/app/placa`, `#/app/world` | La Plaça i Damm World en 3D |
| `#/e/:id` | L'enquesta: destí comú del QR, l'app i tots els canals |
| `#/cartell/:id` | Cartell A4 imprimible amb el QR |

## Tecnologia

React 18, TypeScript, Vite, Tailwind CSS, React Router, lucide-react, qrcode.react i three.js r128 per a les escenes 3D (`frontend/src/three/engine.js`).

## Privacitat (principis del prototip)

- Cap personatge representa una persona real.
- Una zona no mostra resultats si té menys de 10 respostes.
- El text obert passa per una moderació i anonimització simulades.
- La IA proposa, però RRHH aprova abans de publicar.
- Recompenses: proposta conceptual, amb un saldo separat de les respostes i sense rànquings.

El requadre "LOGO DAMM" és un espai reservat per al logotip oficial, que no s'inclou al repositori.
