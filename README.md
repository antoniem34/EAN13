# Generador EAN-13 SVG

Herramienta local para generar codigos de barras EAN-13 en formato SVG, lista para usar en Illustrator u otros programas de diseno.

## Usarlo en esta computadora

Instala dependencias una vez:

```bash
npm install
```

Abre la app:

```bash
npm start
```

Luego entra en:

```text
http://127.0.0.1:5173
```

## Funcionamiento

- Escribe 12 digitos y la app calcula automaticamente el digito verificador.
- Escribe 13 digitos y la app valida si el EAN-13 es correcto.
- Descarga un SVG individual.
- Copia el SVG al portapapeles.
- Usa el modo lote para generar una hoja SVG con varios codigos.

## Publicarlo en GitHub Pages

Este repositorio incluye un workflow de GitHub Actions que publica la app en GitHub Pages cada vez que se sube un cambio a `main`.

Despues de subirlo a GitHub:

1. Entra al repositorio en GitHub.
2. Ve a `Settings` > `Pages`.
3. En `Build and deployment`, elige `GitHub Actions`.
4. Espera a que termine el workflow `Deploy GitHub Pages`.

La app quedara disponible en una URL similar a:

```text
https://TU-USUARIO.github.io/EAN13/
```

## Validacion

```bash
npm test
npm run build
```
