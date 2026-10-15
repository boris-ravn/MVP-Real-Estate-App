# Prototipo MVP · Red de propiedades compartidas (Cochabamba)

Prototipo clicable para pruebas con 3 a 5 asesores inmobiliarios. No tiene backend ni login: todo vive en el `localStorage` del teléfono. La especificación (PRD) y el plan de implementación se mantienen fuera de este repositorio.

Stack: Vite + React + TypeScript + Tailwind CSS v4 + React Router (HashRouter) + Vitest.

## Correrlo

Requiere Node 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitarios (parser, filtros, frescura, compartir, feedback…)
npm run build      # build estático en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

Para probarlo en tu celular dentro de la misma red Wi‑Fi: `npm run dev -- --host` y abre la URL "Network" que aparece en la consola.

## Configuración (`src/config.ts`)

| Constante | Para qué sirve |
|---|---|
| `PRODUCT_NAME` | Nombre visible del producto: `Real Estate App`. |
| `DEMO_MODE` | Con `true`, "Consultar por WhatsApp" muestra primero un aviso con el mensaje, porque los números de la semilla son ficticios. |
| `FEEDBACK_WHATSAPP_NUMBER` | Opcional. Si se deja vacío (así viene), "Opinar" no abre WhatsApp: muestra un aviso de que en la app real se enviaría por WhatsApp, junto con el mensaje. Las respuestas quedan en `/#/debug` del teléfono. Si pones un número (solo dígitos y con código de país, por ejemplo `59170000000`), se abre WhatsApp hacia ese número. |

Después de cambiar la configuración, vuelve a hacer el build y el deploy.

## Durante las pruebas con usuarios

- **Reiniciar la demo entre participantes:** mantén presionado el logo de la pantalla de inicio unos segundos, o abre `/#/debug` y toca **Reiniciar demo**. Así se restauran las propiedades de ejemplo y se borran el perfil y los eventos.
- **Ver qué hizo el participante:** en `/#/debug` aparecen los eventos agrupados por sesión, con el botón **Copiar eventos** (JSON).
- **Feedback:** el botón flotante **Opinar** junta las 3 respuestas, el resumen de eventos de la sesión y cuántos campos detectó el parser. Sin número configurado, recupera las respuestas en `/#/debug` (evento `feedback_sent`, incluye el comentario) antes de tocar **Reiniciar demo**.
- **Tareas de la prueba (PRD §12):**
  1. Buscar un departamento en alquiler de 2 dormitorios, con garaje, que acepte mascotas y cueste hasta Bs 4.000 → la semilla tiene 3 resultados.
  2. Publicar pegando un mensaje de WhatsApp.
  3. "Una de tus propiedades ya se alquiló" → en Mis propiedades está el departamento de Queru Queru en alquiler.
  4. Compartir una propiedad en un grupo.

## Deploy (sitio estático)

El build usa rutas relativas (`base: './'`) y HashRouter, así que funciona en cualquier hosting estático sin configurar redirecciones.

**Vercel:** en vercel.com → *Add New… → Project*, importa este repositorio. Detecta *Vite* solo (build `npm run build`, output `dist`) y no hay que cambiar nada. Cada push a `main` vuelve a desplegar.

**Netlify:** usa `npm run build` como comando de build y `dist` como carpeta de publicación. Otra opción es arrastrar la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop).

El bundle pesa ~110 KB con gzip y no usa fuentes ni imágenes externas, así que carga rápido con 4G.

## Estructura

```
src/
  config.ts               configuración única (ver arriba)
  domain/                 lógica pura y testeada: modelo, frescura, formato, filtros, borrador, WhatsApp, compartir, feedback
  parser/parseListing.ts  "pegar mensaje → ficha" (regex + diccionarios; se puede cambiar por un LLM sin tocar la UI)
  seed/                   28 propiedades, 9 asesores ficticios y 8 mensajes de ejemplo; las fechas son relativas a hoy
  store/                  estado + localStorage, log de eventos y filtros
  screens/                Home (F1), Detail (F2/F3), Publish (F4), MyListings (F5), Debug
  components/             tarjeta, hojas inferiores, compartir (F6), botón Opinar (F7)…
```

## Limitaciones conocidas del prototipo

- Los datos son locales a cada teléfono: lo que publica un participante no lo ve otro, y el link "Ver ficha" del texto para compartir solo abre en ese mismo dispositivo.
- La frescura, la comisión y la autorización del propietario las declara el propio asesor; no se verifica nada.
- Las fotos son placeholders (gradiente + ícono).
