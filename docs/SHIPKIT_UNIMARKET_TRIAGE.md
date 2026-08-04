# ShipKit — decisión para LazosTech UniMarket

Fuente: correo personal de Shipaton recibido después del registro. Los códigos únicos no se copian al repositorio ni a esta nota.

## Beneficios que sí encajan

| Beneficio | Decisión | Uso previsto |
|---|---|---|
| Stripe Projects / crédito posterior a una transacción real | No usar ahora | Es solo crédito para comisiones después de una compra real; no es dinero disponible y no justifica añadir checkout web al piloto. |
| Codemagic, 500 minutos de build gratuitos | Prioridad alta si hacemos Android | Compilar y distribuir un wrapper/app móvil sin pagar CI. |
| OneSignal, Growth gratis por hasta 3 meses | Prioridad media | Notificaciones de publicaciones y solicitudes cuando el flujo móvil/web esté listo. |
| Tenjin, Plan S gratis por 3 meses | Prioridad media | Analítica móvil si finalmente usamos una app Android/iOS. |
| Lance, acceso gratis por 3 meses | Prioridad media | Publicación móvil solo si decidimos ir más allá de Next Gen. |
| Layers, acceso gratis por 2 meses | Posterior | Difusión y crecimiento después de tener una demo estable. |
| Argent, plan gratuito | Opcional | QA/performance asistido; no es requisito para la postulación. |

## Beneficios que no usaremos ahora

- Replit Pro: descuento de pago y duplicaría el stack existente.
- JetBrains Junie: beneficio útil, pero no necesario para este flujo.
- Noise: el matching requiere gasto; no es una estrategia segura para el piloto.
- Bitrig: descuento de pago y orientado a otro stack.

## Regla de seguridad

No poner códigos promocionales, claves de RevenueCat, Stripe, Supabase ni enlaces privados de redención en Git, capturas o video. Los códigos permanecen en el correo y se redimen manualmente cuando decidamos usar cada beneficio.

## Qué significa el beneficio de Stripe

No es dinero que Shipaton deposite ni saldo que podamos retirar. Es un crédito condicionado para compensar comisiones de procesamiento de Stripe después de una transacción real. Como no necesitamos checkout web para el piloto, no lo activaremos. La monetización de Shipaton se resolverá en la app Android con RevenueCat y Google Play Billing.

## Próxima decisión técnica

El beneficio decisivo es Codemagic: solo se activa si UniMarket se empaqueta como app móvil. Next Gen no exige publicar en tienda, pero las reglas sí exigen que el proyecto funcione en iOS, macOS o Android y que use RevenueCat; por eso debemos decidir entre construir el wrapper Android y mantener el demo web como apoyo, o pedir confirmación escrita a Shipaton antes de enviar.
