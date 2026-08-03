# Entrega académica: LazosTech Supabase para Microsoft Access

Copia de solo lectura y anonimizada del esquema `public` del proyecto Supabase **LazosTech** (ref. `dvaohhsopccezgsoqems`), tomada el 14 de julio de 2026.

## Archivo principal

- `LazosTech_Supabase_Academico.accdb`: base lista para abrir en Access.
- `csv/`: una exportación CSV por tabla.
- `diccionario_datos.csv`: equivalencias de campos y tipos.
- `relaciones.csv`: claves foráneas incluidas y omitidas.
- `esquema_access.sql`: esquema de referencia.

## Privacidad

Solo se incluyeron las 10 tablas de aplicación de `public`. Se excluyeron `auth`, `storage`, sesiones, contraseñas, tokens y claves. Nombres, correos, teléfonos, documentos, códigos estudiantiles, identificadores de usuario, billeteras y token QR fueron sustituidos de forma consistente para conservar las relaciones.

## Inventario

- `profiles`: 31 filas
- `recycling_events`: 0 filas
- `ticket_turn_events`: 0 filas
- `ticket_turn_monitor_roles`: 4 filas
- `ticket_turn_reactivations`: 1 filas
- `ticket_turn_services`: 1 filas
- `ticket_turns`: 36 filas
- `token_rewards`: 0 filas
- `user_notifications`: 0 filas
- `user_profiles`: 2 filas

Total: 75 filas.

Las referencias a `auth.users` no se crearon en Access porque ese esquema interno fue excluido por seguridad. Las relaciones entre tablas públicas sí fueron conservadas.
