# Guía de consultas y criterios en Microsoft Access

La base `LazosTech_Supabase_Espanol.accdb` contiene 19 consultas guardadas. Se encuentran en el panel **Consultas** y sus nombres comienzan por `Consulta_`.

## Recordatorio rápido de símbolos y operadores

| Elemento | Para qué sirve | Ejemplo de criterio |
|---|---|---|
| `&` | Une o concatena textos y parámetros. | `Like "*" & [Ingrese nombre] & "*"` |
| `/` | Divide números. No es un comodín. | `[Atendidos]*100/[Total]` |
| `"texto"` | Delimita un texto literal. | `[Estado]="activo"` |
| `*` | Con `Like`, representa cero o muchos caracteres. | `Like "*maria*"` |
| `?` | Con `Like`, representa exactamente un carácter. | `Like "2026-??"` |
| `#` | Dentro de `Like`, representa un dígito. Fuera de `Like`, delimita una fecha literal. | `Like "COD-####"`; `#15/07/2026#` |
| `[ ]` | Encierra nombres de campos o crea parámetros. | `[Correo_Electronico]`; `[Ingrese correo]` |
| `=` | Coincidencia exacta. | `[Documento_Identidad]=[Ingrese cedula]` |
| `<>` | Distinto de. | `[Estado]<>"expirado"` |
| `>`, `>=`, `<`, `<=` | Comparaciones numéricas o de fecha. | `[Fecha_Turno]>=Date()` |
| `Like` | Activa búsquedas por patrones. | `[Nombre_Completo] Like "*ana*"` |
| `And` | Exige que todas las condiciones se cumplan. | `[Estado]="activo" And [Es_Especial]=False` |
| `Or` | Acepta que se cumpla cualquiera de las condiciones. | `[Estado]="activo" Or [Estado]="en_fila"` |
| `Not` | Niega una condición. | `Not Like "*@gmail.com"` |
| `Between ... And ...` | Define un rango inclusivo. | `Between [Fecha inicial] And [Fecha final]` |
| `In (...)` | Compara contra una lista de valores. | `In ("activo","en_fila")` |
| `Is Null` / `Is Not Null` | Detecta ausencia o presencia de un valor. | `[Telefono] Is Null` |
| `Nz(valor,"")` | Sustituye un valor nulo; sirve para parámetros opcionales. | `Nz([pCorreo],"")=""` |
| `Date()` | Devuelve la fecha actual. | `[Fecha_Turno]=Date()` |
| `DateAdd()` | Suma o resta periodos a una fecha. | `DateAdd("d",-30,Date())` |
| `( )` | Agrupa condiciones y controla el orden lógico. | `([A] Or [B]) And [C]` |

## Diferencia importante entre `*`, `?` y `#`

- `*`: cualquier cantidad de caracteres, incluso ninguno.
- `?`: exactamente un carácter de cualquier clase.
- `#`: exactamente un dígito del 0 al 9 cuando se usa dentro de `Like`.
- En una fecha escrita directamente en SQL, `#` actúa como delimitador: `#15/07/2026#`.
- Cuando una consulta solicita una fecha como parámetro, puedes escribirla como `15/07/2026`; Access la interpreta según la configuración regional.

## Uso de las comillas

- Texto: `"activo"`.
- Nombre de campo o parámetro: `[Estado]` o `[Ingrese estado]`.
- Fecha literal: `#15/07/2026#`.
- Número: sin comillas, por ejemplo `100`.

## Consultas incluidas

- `Consulta_00_Listado_Estudiantes`: Listado general de estudiantes registrados, ordenado por nombre.
- `Consulta_01_Buscar_Por_Nombre`: Busca cualquier parte del nombre. Usa Like "*" & parametro & "*".
- `Consulta_02_Buscar_Por_Codigo`: Busca una parte del codigo estudiantil usando * y &.
- `Consulta_03_Buscar_Por_Correo`: Busca texto en cualquier parte del correo electronico.
- `Consulta_04_Buscar_Por_Dominio_Correo`: Busca estudiantes por el dominio ubicado despues de @.
- `Consulta_05_Buscar_Por_Cedula_Exacta`: Busca por documento de identidad exacto usando =.
- `Consulta_06_Buscar_Por_Patron_Codigo`: Permite escribir un patron completo con *, ? y #, por ejemplo COD-####*.
- `Consulta_07_Busqueda_Combinada`: Combina nombre, correo, codigo, cedula y universidad. Los parametros vacios se ignoran.
- `Consulta_08_Turnos_Por_Estudiante`: Une estudiantes y turnos, filtrando por nombre, codigo o correo.
- `Consulta_09_Turnos_Por_Rango_Fechas`: Busca turnos entre dos fechas. En Colombia puede ingresarse dd/mm/aaaa.
- `Consulta_10_Turnos_Activos`: Ejemplo de textos entre comillas e IN: estados "activo" o "en_fila".
- `Consulta_11_Turnos_Codigo_Estado`: Filtra turnos por fragmento de codigo y estado; cualquiera puede dejarse vacio.
- `Consulta_12_Estudiantes_Sin_Codigo`: Usa Is Null y = "" para detectar datos faltantes.
- `Consulta_13_Registrados_Hoy`: Compara la fecha ISO de registro con la fecha actual usando Left() y Format().
- `Consulta_14_Resumen_Turnos_Estudiante`: Cuenta turnos y calcula porcentaje atendido usando / para division.
- `Consulta_15_Turnos_Ultimos_N_Dias`: Usa DateAdd("d",-N,Date()) para buscar los ultimos N dias.
- `Consulta_16_Estudiantes_Correo_Edu`: Usa una regla fija Like "*@*.edu*" para correos educativos.
- `Consulta_17_Estudiantes_Con_Billetera`: Selecciona registros donde la billetera no sea nula ni vacia.
- `Consulta_18_Por_Universidad_O_Tipo`: Demuestra OR y parentesis para buscar por universidad o tipo estudiantil.

## Consejos para evitar resultados inesperados

1. Usa `=` cuando conozcas el valor completo.
2. Usa `Like` y `*` cuando solo conozcas una parte.
3. Agrupa combinaciones de `And` y `Or` con paréntesis.
4. No compares un campo vacío únicamente con `""`; puede ser `Null`. Comprueba ambos casos.
5. En los parámetros opcionales, deja el cuadro vacío para ignorar ese filtro.
6. Para buscar un asterisco literal y no como comodín, en Access suele usarse `[*]`; para un interrogante literal, `[?]`.
7. Si el proyecto cambia a modo ANSI-92, los comodines pueden ser `%` y `_`; esta base usa los comodines tradicionales de Access: `*` y `?`.
