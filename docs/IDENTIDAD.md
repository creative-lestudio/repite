# Identidad visual de Repite

Fuente: tablero de identidad (`docs/identidad/tablero.webp`). Lema: **«Buen servicio + sistema = más recurrencia.»** (titular de la web: «Hacemos que tus clientes vuelvan.»)

## Paleta

| Token                      | Valor     | Uso                                                                                                 |
| -------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `red-500` · rojo de marca  | `#FF3B2E` | Logotipo, sellos, iconos grandes, acentos. **No** para texto pequeño ni texto blanco pequeño encima |
| `red-600` · rojo de acción | `#C9281B` | Botones, enlaces y texto rojo (`text-primary`, `bg-primary`)                                        |
| `wine-800` · rojo vino     | `#7A0D12` | Hover/pulsado, texto sobre crema, secciones oscuras cálidas                                         |
| `ink-950` · negro          | `#111111` | Texto principal, pie de página, fondos oscuros                                                      |
| `ink-900`                  | `#1C1B1A` | Superficies sobre negro (tarjeta oscura)                                                            |
| `cream-50`                 | `#FBF7F3` | Fondo de la app                                                                                     |
| `cream-100`                | `#F6EDE6` | Crema de marca: superficies suaves, estados seleccionados                                           |
| `cream-200`                | `#E6D8CC` | Bordes y separadores                                                                                |
| `stone-600`                | `#6B655E` | Texto secundario                                                                                    |
| `stone-400`                | `#A7A39C` | Gris de marca (decorativo y texto sobre negro)                                                      |

El rojo de la marca (`#FF3B2E`) con texto blanco da 3,55:1 (no llega a AA para texto normal). Por eso el **rojo de acción `#C9281B`** (5,5:1) es el color de botones y enlaces, y el rojo vivo queda para lo decorativo y grande. Los campos de formulario usan `border-input` (`#A1978D`, ≥ 3:1 sobre blanco).

### Contrastes comprobados (WCAG AA ≥ 4,5:1 para texto)

| Par                                            | Ratio |
| ---------------------------------------------- | ----- |
| Negro / crema 50                               | 17,7  |
| Gris texto / crema 50                          | 5,4   |
| Blanco / rojo acción                           | 5,5   |
| Rojo acción / crema 50                         | 5,2   |
| Vino / crema 100                               | 9,6   |
| Crema 200 / negro                              | 13,5  |
| Blanco / rojo marca (solo grande o decorativo) | 3,6   |

## Logotipo

- Vectorizado del tablero en `src/components/brand/paths.json` (logotipo completo y «R» sola). Componentes: `Logo`, `LogoMark`, `AppIcon` en `src/components/brand/logo.tsx`. Usan `currentColor`: se tiñen con `text-ink-950`, `text-cream-100`, `text-red-500`…
- Icono de aplicación: cuadrado redondeado rojo con la «R» en crema (`src/app/icon.svg`). Los PNG de la PWA salen de ahí con `pnpm icons`.
- Tamaño mínimo del logotipo completo: 28 px de alto. Sobre fondo oscuro, en crema; sobre claro, en negro o rojo de marca.
- **Pendiente**: el trazado viene de una imagen de baja resolución; para producción conviene sustituirlo por los vectores originales (SVG/AI) y reemplazar `paths.json`.

## Reglas de uso

1. Colores solo con tokens (`bg-primary`, `text-ink-950`, `bg-cream-100`…), nunca hex sueltos en componentes.
2. Una sola acción principal por pantalla, en rojo de acción.
3. Sellos siempre en `bg-brand` (rojo de marca o el color del local).
4. Títulos en Plus Jakarta Sans 800 con espaciado compacto; texto en Inter.
5. Fondos oscuros: negro `ink-950` con crema y acentos rojos, como en el tablero. Para texto largo sobre rojo, usar vino (`wine-800`), no el rojo de marca.
