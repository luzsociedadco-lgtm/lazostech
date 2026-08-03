$ErrorActionPreference='Stop'
$dbPath='C:\Users\INICIO\lazos-dapp\NUDOS\entrega_access_supabase_espanol\LazosTech_Supabase_Espanol.accdb'
$root='C:\Users\INICIO\lazos-dapp\NUDOS\entrega_access_supabase_espanol'
$lock=Join-Path $root 'LazosTech_Supabase_Espanol.laccdb'
if(Test-Path -LiteralPath $lock){throw 'La base esta abierta. Cierra Microsoft Access y vuelve a ejecutar.'}
$backupDir=Join-Path $root 'Respaldos'
[IO.Directory]::CreateDirectory($backupDir)|Out-Null
$backup=Join-Path $backupDir ('LazosTech_Supabase_Espanol_antes_consultas_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'.accdb')
Copy-Item -LiteralPath $dbPath -Destination $backup
$a=$null
try{
$a=New-Object -ComObject Access.Application
$a.Visible=$false
$a.OpenCurrentDatabase($dbPath)
$db=$a.CurrentDb()
try{$db.QueryDefs.Delete('Consulta_00_Listado_Estudiantes')}catch{}
$q=$db.CreateQueryDef('Consulta_00_Listado_Estudiantes','SELECT E.* FROM [Estudiantes_Registrados] AS E ORDER BY E.[Nombre_Completo], E.[Correo_Electronico];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Listado general de estudiantes registrados, ordenado por nombre.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_01_Buscar_Por_Nombre')}catch{}
$q=$db.CreateQueryDef('Consulta_01_Buscar_Por_Nombre','PARAMETERS [Ingrese nombre o parte del nombre] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Nombre_Completo] Like "*" & [Ingrese nombre o parte del nombre] & "*"
ORDER BY E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca cualquier parte del nombre. Usa Like "*" & parametro & "*".'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_02_Buscar_Por_Codigo')}catch{}
$q=$db.CreateQueryDef('Consulta_02_Buscar_Por_Codigo','PARAMETERS [Ingrese codigo o una parte] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Codigo_Estudiante] Like "*" & [Ingrese codigo o una parte] & "*"
ORDER BY E.[Codigo_Estudiante];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca una parte del codigo estudiantil usando * y &.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_03_Buscar_Por_Correo')}catch{}
$q=$db.CreateQueryDef('Consulta_03_Buscar_Por_Correo','PARAMETERS [Ingrese correo o una parte] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Correo_Electronico] Like "*" & [Ingrese correo o una parte] & "*"
ORDER BY E.[Correo_Electronico];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca texto en cualquier parte del correo electronico.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_04_Buscar_Por_Dominio_Correo')}catch{}
$q=$db.CreateQueryDef('Consulta_04_Buscar_Por_Dominio_Correo','PARAMETERS [Ingrese dominio sin arroba] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Correo_Electronico] Like "*@" & [Ingrese dominio sin arroba]
ORDER BY E.[Correo_Electronico];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca estudiantes por el dominio ubicado despues de @.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_05_Buscar_Por_Cedula_Exacta')}catch{}
$q=$db.CreateQueryDef('Consulta_05_Buscar_Por_Cedula_Exacta','PARAMETERS [Ingrese cedula completa] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Documento_Identidad] = [Ingrese cedula completa];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca por documento de identidad exacto usando =.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_06_Buscar_Por_Patron_Codigo')}catch{}
$q=$db.CreateQueryDef('Consulta_06_Buscar_Por_Patron_Codigo','PARAMETERS [Ingrese patron de codigo usando asterisco interrogacion o numeral] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Codigo_Estudiante] Like [Ingrese patron de codigo usando asterisco interrogacion o numeral]
ORDER BY E.[Codigo_Estudiante];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Permite escribir un patron completo con *, ? y #, por ejemplo COD-####*.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_07_Busqueda_Combinada')}catch{}
$q=$db.CreateQueryDef('Consulta_07_Busqueda_Combinada','PARAMETERS [pNombre] Text (255), [pCorreo] Text (255), [pCodigo] Text (255), [pCedula] Text (255), [pUniversidad] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE (Nz([pNombre],"")="" OR E.[Nombre_Completo] Like "*" & [pNombre] & "*")
  AND (Nz([pCorreo],"")="" OR E.[Correo_Electronico] Like "*" & [pCorreo] & "*")
  AND (Nz([pCodigo],"")="" OR E.[Codigo_Estudiante] Like "*" & [pCodigo] & "*")
  AND (Nz([pCedula],"")="" OR E.[Documento_Identidad] Like "*" & [pCedula] & "*")
  AND (Nz([pUniversidad],"")="" OR E.[Universidad] Like "*" & [pUniversidad] & "*")
ORDER BY E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Combina nombre, correo, codigo, cedula y universidad. Los parametros vacios se ignoran.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_08_Turnos_Por_Estudiante')}catch{}
$q=$db.CreateQueryDef('Consulta_08_Turnos_Por_Estudiante','PARAMETERS [Ingrese nombre codigo o correo] Text (255);
SELECT E.[Id_Estudiante], E.[Nombre_Completo], E.[Codigo_Estudiante], E.[Correo_Electronico],
       T.[Codigo_Turno], T.[Fecha_Turno], T.[Numero_Secuencia], T.[Estado], T.[Fecha_Asignacion]
FROM [Estudiantes_Registrados] AS E INNER JOIN [Turnos] AS T
ON E.[Id_Estudiante] = T.[Id_Estudiante]
WHERE E.[Nombre_Completo] Like "*" & [Ingrese nombre codigo o correo] & "*"
   OR E.[Codigo_Estudiante] Like "*" & [Ingrese nombre codigo o correo] & "*"
   OR E.[Correo_Electronico] Like "*" & [Ingrese nombre codigo o correo] & "*"
ORDER BY T.[Fecha_Turno] DESC, T.[Numero_Secuencia];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Une estudiantes y turnos, filtrando por nombre, codigo o correo.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_09_Turnos_Por_Rango_Fechas')}catch{}
$q=$db.CreateQueryDef('Consulta_09_Turnos_Por_Rango_Fechas','PARAMETERS [Ingrese fecha inicial dd/mm/aaaa] DateTime, [Ingrese fecha final dd/mm/aaaa] DateTime;
SELECT T.* FROM [Turnos] AS T
WHERE T.[Fecha_Turno] Between [Ingrese fecha inicial dd/mm/aaaa] And [Ingrese fecha final dd/mm/aaaa]
ORDER BY T.[Fecha_Turno], T.[Numero_Secuencia];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Busca turnos entre dos fechas. En Colombia puede ingresarse dd/mm/aaaa.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_10_Turnos_Activos')}catch{}
$q=$db.CreateQueryDef('Consulta_10_Turnos_Activos','SELECT T.* FROM [Turnos] AS T
WHERE T.[Estado] In ("activo","en_fila")
ORDER BY T.[Fecha_Turno] DESC, T.[Numero_Secuencia];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Ejemplo de textos entre comillas e IN: estados "activo" o "en_fila".'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_11_Turnos_Codigo_Estado')}catch{}
$q=$db.CreateQueryDef('Consulta_11_Turnos_Codigo_Estado','PARAMETERS [pCodigoTurno] Text (255), [pEstado] Text (255);
SELECT T.* FROM [Turnos] AS T
WHERE (Nz([pCodigoTurno],"")="" OR T.[Codigo_Turno] Like "*" & [pCodigoTurno] & "*")
  AND (Nz([pEstado],"")="" OR T.[Estado] = [pEstado])
ORDER BY T.[Fecha_Turno] DESC, T.[Numero_Secuencia];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Filtra turnos por fragmento de codigo y estado; cualquiera puede dejarse vacio.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_12_Estudiantes_Sin_Codigo')}catch{}
$q=$db.CreateQueryDef('Consulta_12_Estudiantes_Sin_Codigo','SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Codigo_Estudiante] Is Null OR E.[Codigo_Estudiante] = ""
ORDER BY E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Usa Is Null y = "" para detectar datos faltantes.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_13_Registrados_Hoy')}catch{}
$q=$db.CreateQueryDef('Consulta_13_Registrados_Hoy','SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE Left(E.[Fecha_Registro],10) = Format(Date(),"yyyy-mm-dd")
ORDER BY E.[Fecha_Registro] DESC;')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Compara la fecha ISO de registro con la fecha actual usando Left() y Format().'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_14_Resumen_Turnos_Estudiante')}catch{}
$q=$db.CreateQueryDef('Consulta_14_Resumen_Turnos_Estudiante','SELECT E.[Id_Estudiante], E.[Nombre_Completo], E.[Correo_Electronico],
       Count(T.[Id_Turno]) AS [Total_Turnos],
       Sum(IIf(T.[Estado]="atendido",1,0)) AS [Turnos_Atendidos],
       Round(Sum(IIf(T.[Estado]="atendido",1,0))*100/IIf(Count(T.[Id_Turno])=0,1,Count(T.[Id_Turno])),2) AS [Porcentaje_Atendidos]
FROM [Estudiantes_Registrados] AS E LEFT JOIN [Turnos] AS T
ON E.[Id_Estudiante] = T.[Id_Estudiante]
GROUP BY E.[Id_Estudiante], E.[Nombre_Completo], E.[Correo_Electronico]
ORDER BY Count(T.[Id_Turno]) DESC, E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Cuenta turnos y calcula porcentaje atendido usando / para division.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_15_Turnos_Ultimos_N_Dias')}catch{}
$q=$db.CreateQueryDef('Consulta_15_Turnos_Ultimos_N_Dias','PARAMETERS [Ingrese cantidad de dias] Long;
SELECT T.* FROM [Turnos] AS T
WHERE T.[Fecha_Turno] >= DateAdd("d",-[Ingrese cantidad de dias],Date())
ORDER BY T.[Fecha_Turno] DESC, T.[Numero_Secuencia];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Usa DateAdd("d",-N,Date()) para buscar los ultimos N dias.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_16_Estudiantes_Correo_Edu')}catch{}
$q=$db.CreateQueryDef('Consulta_16_Estudiantes_Correo_Edu','SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Correo_Electronico] Like "*@*.edu*"
ORDER BY E.[Correo_Electronico];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Usa una regla fija Like "*@*.edu*" para correos educativos.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_17_Estudiantes_Con_Billetera')}catch{}
$q=$db.CreateQueryDef('Consulta_17_Estudiantes_Con_Billetera','SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE E.[Billetera_Vinculada] Is Not Null AND E.[Billetera_Vinculada] <> ""
ORDER BY E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Selecciona registros donde la billetera no sea nula ni vacia.'))}catch{}
$q.Close()
try{$db.QueryDefs.Delete('Consulta_18_Por_Universidad_O_Tipo')}catch{}
$q=$db.CreateQueryDef('Consulta_18_Por_Universidad_O_Tipo','PARAMETERS [pUniversidad] Text (255), [pTipoEstudiante] Text (255);
SELECT E.* FROM [Estudiantes_Registrados] AS E
WHERE (Nz([pUniversidad],"")<>"" AND E.[Universidad] Like "*" & [pUniversidad] & "*")
   OR (Nz([pTipoEstudiante],"")<>"" AND E.[Tipo_Estudiante] Like "*" & [pTipoEstudiante] & "*")
ORDER BY E.[Nombre_Completo];')
try{$q.Properties.Append($q.CreateProperty('Description',10,'Demuestra OR y parentesis para buscar por universidad o tipo estudiantil.'))}catch{}
$q.Close()
$a.CloseCurrentDatabase()
Write-Output ('BACKUP='+$backup)
Write-Output 'QUERIES=19'
}finally{if($a-ne$null){try{$a.Quit()}catch{};[Runtime.InteropServices.Marshal]::ReleaseComObject($a)|Out-Null}}
