# Shipaton 2026 — LazosTech UniMarket

Documento de preparación local. No implica commit, push ni envío en Devpost.

## Estado actual

- Demo público preparado en `lazos-frontend/app/unimarket/page.tsx`.
- Ruta prevista para el video: `/unimarket`.
- La ruta existente `/marketplace` se conserva sin cambios y mantiene su capa `Coming soon`.
- El demo público no exige autenticación: permite buscar, filtrar, abrir una publicación, solicitar intercambio y crear un borrador de publicación.
- `npm.cmd run check-types` pasa.
- No se activará RevenueCat Web Billing ni Stripe en el demo web: no aporta valor al piloto y el beneficio de Stripe solo cubre comisiones de una transacción real.
- RevenueCat se integrará en la capa Android con Google Play Billing, que es la ruta relevante para cumplir Shipaton.
- No se hizo commit ni push; no se cambiaron tokens ni credenciales.
- El entorno local actual no tiene Android SDK ni Java detectables; la compilación móvil deberá hacerse con un entorno configurado o con Codemagic.
- `ROADMAP.md` tiene cambios previos ajenos a esta preparación y no debe incluirse en un commit de Shipaton.

## Requisitos que aún deben cerrarse

### 1. Elegibilidad técnica

La integración de código con RevenueCat Web Billing ya está preparada, pero la configuración de dashboard todavía falta. Las reglas publicadas también exigen que el proyecto funcione en iOS, macOS o Android y que use RevenueCat SDK para compras dentro de la app. El demo web por sí solo no es suficiente para declarar elegibilidad técnica.

Next Gen sí elimina la necesidad de publicar en tienda, pero exige video, repositorio público de código abierto y licencia visible. El repositorio ya contiene un `LICENSE` MIT en la raíz. Para cerrar la brecha de plataforma quedan estas rutas:

1. envolver UniMarket como app Android/iOS (Expo/React Native) e integrar RevenueCat en esa app; o
2. pedir confirmación escrita a Shipaton antes de enviar si aceptan el flujo web como proyecto móvil equivalente.

### 2. Código público

Para enviar se necesitará una URL pública de código abierto. Esto sí requerirá push a un repositorio accesible para los jueces. Ese push queda bloqueado hasta:

- confirmar la identidad/token de LazosTech;
- crear una rama de publicación separada;
- revisar que no se incluya `ROADMAP.md` ni secretos;
- revisar el diff final y obtener aprobación explícita.

### 3. Material audiovisual

- Video público en YouTube o Vimeo, máximo 2 minutos de metraje esencial.
- Captura vertical de la app, 1179×2556 px y sin marco de dispositivo.
- Icono de app de 1024×1024 px.
- La página de la convocatoria también menciona prueba gratuita o código promocional para probar la compra; confirmar si Next Gen sustituye este requisito cuando se publiquen sus reglas completas.

### 4. Datos de la postulación

- Nombre: `LazosTech UniMarket`.
- Organización: iniciativa impulsada por LuzSociedad.
- Equipo: estudiantes activos de la Universidad del Valle; usar el correo institucional `.edu.co` para la verificación estudiantil.
- Categoría principal sugerida: `Next Gen Award`.
- Categoría secundaria potencial: `RevenueCat Peace Prize`, solo si el producto móvil y la integración de monetización quedan implementados de forma real.
- No declarar usuarios masivos: 35 estudiantes de Univalle se presentan como validación del piloto.

## Narrativa aprobada

UniMarket es un marketplace circular para estudiantes: permite comprar, vender o intercambiar libros, tecnología, ropa y productos de emprendimientos dentro de la comunidad universitaria. La verificación estudiantil y los puntos de encuentro en campus reducen fricción y riesgo; la reutilización extiende la vida útil de los objetos y mantiene el valor dentro de la comunidad.

## Guion de video (máximo 2 minutos)

1. **0:00–0:12** — Problema: estudiantes con objetos útiles, pero sin un canal confiable dentro del campus.
2. **0:12–0:28** — Presentación de UniMarket y la comunidad universitaria verificada.
3. **0:28–0:52** — Buscar y filtrar una publicación.
4. **0:52–1:15** — Abrir la publicación, revisar vendedor, precio y punto de entrega.
5. **1:15–1:35** — Solicitar intercambio y mostrar la coordinación segura dentro del campus.
6. **1:35–1:50** — Publicar un nuevo item como borrador.
7. **1:50–2:00** — Impacto del piloto y cierre: “LazosTech convierte el intercambio universitario en una red circular y verificable”.

## Orden seguro para completar el envío

1. Confirmar la regla de plataforma/RevenueCat con Shipaton o decidir la envoltura móvil.
2. Implementar y probar RevenueCat sin subir secretos al repositorio.
3. Generar icono, captura vertical y video.
4. Preparar rama Git de publicación, revisar diff y publicar con la identidad LazosTech.
5. Abrir el formulario de Devpost y completar los campos sin enviar.
6. Revisar elegibilidad, enlaces públicos y materiales con el equipo.
7. Enviar únicamente después de aprobación final.

## Fuentes oficiales revisadas

- https://revenuecat-shipaton-2026.devpost.com/
- https://revenuecat-shipaton-2026.devpost.com/rules
- https://revenuecat-shipaton-2026.devpost.com/forum_topics/44575-eligibility-for-next-gen-award-and-other-categories
