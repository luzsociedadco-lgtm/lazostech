$ErrorActionPreference='Stop'
$root='C:\Users\INICIO\lazos-dapp\NUDOS\entrega_access_supabase_espanol'
$out=Join-Path $root 'LazosTech_Supabase_Espanol.accdb'
if(Test-Path -LiteralPath $out){throw "Ya existe: $out"}
$a=$null
try{
$a=New-Object -ComObject Access.Application
$a.Visible=$false
$a.NewCurrentDatabase($out)
$db=$a.CurrentDb()
$a.DoCmd.TransferText(0,'','Perfiles',(Join-Path $root 'csv\Perfiles.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Roles_Monitores',(Join-Path $root 'csv\Roles_Monitores.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Reactivaciones_Turnos',(Join-Path $root 'csv\Reactivaciones_Turnos.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Servicios_Turnos',(Join-Path $root 'csv\Servicios_Turnos.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Turnos',(Join-Path $root 'csv\Turnos.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Datos_Estudiantiles',(Join-Path $root 'csv\Datos_Estudiantiles.csv'),$true,'',65001)
$a.DoCmd.TransferText(0,'','Estudiantes_Registrados',(Join-Path $root 'csv\Estudiantes_Registrados.csv'),$true,'',65001)
$db.Execute('CREATE TABLE [Eventos_Reciclaje] ([Id_Evento_Reciclaje] TEXT(36), [Id_Estudiante] TEXT(36), [Tipo_Material] TEXT(255), [Cantidad] DOUBLE, [Validado] YESNO, [Fecha_Creacion] DATETIME, CONSTRAINT [PK_Eventos_Reciclaje] PRIMARY KEY ([Id_Evento_Reciclaje]))')
$db.Execute('CREATE TABLE [Eventos_Turnos] ([Id_Evento_Turno] TEXT(36), [Id_Turno] TEXT(36), [Id_Servicio] TEXT(36), [Id_Usuario_Actor] TEXT(36), [Tipo_Evento] TEXT(255), [Datos_Evento] LONGTEXT, [Fecha_Creacion] DATETIME, CONSTRAINT [PK_Eventos_Turnos] PRIMARY KEY ([Id_Evento_Turno]))')
$db.Execute('CREATE TABLE [Recompensas_Tokens] ([Id_Recompensa] TEXT(36), [Id_Estudiante] TEXT(36), [Id_Evento_Reciclaje] TEXT(36), [Cantidad_Tokens] DOUBLE, [Hash_Transaccion] TEXT(255), [Fecha_Creacion] DATETIME, CONSTRAINT [PK_Recompensas_Tokens] PRIMARY KEY ([Id_Recompensa]))')
$db.Execute('CREATE TABLE [Notificaciones] ([Id_Notificacion] TEXT(36), [Id_Estudiante] TEXT(36), [Tipo] TEXT(255), [Titulo] TEXT(255), [Mensaje] TEXT(255), [Enlace] TEXT(255), [Leida] YESNO, [Fecha_Creacion] DATETIME, CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([Id_Notificacion]))')
$db.Execute('ALTER TABLE [Perfiles] ADD CONSTRAINT [PK_Perfiles] PRIMARY KEY ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Roles_Monitores] ADD CONSTRAINT [PK_Roles_Monitores] PRIMARY KEY ([Id_Rol_Monitor])')
$db.Execute('ALTER TABLE [Reactivaciones_Turnos] ADD CONSTRAINT [PK_Reactivaciones_Turnos] PRIMARY KEY ([Id_Reactivacion])')
$db.Execute('ALTER TABLE [Servicios_Turnos] ADD CONSTRAINT [PK_Servicios_Turnos] PRIMARY KEY ([Id_Servicio])')
$db.Execute('ALTER TABLE [Turnos] ADD CONSTRAINT [PK_Turnos] PRIMARY KEY ([Id_Turno])')
$db.Execute('ALTER TABLE [Datos_Estudiantiles] ADD CONSTRAINT [PK_Datos_Estudiantiles] PRIMARY KEY ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Estudiantes_Registrados] ADD CONSTRAINT [PK_Estudiantes_Registrados] PRIMARY KEY ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Eventos_Reciclaje] ADD CONSTRAINT [FK_01] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Perfiles] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Eventos_Turnos] ADD CONSTRAINT [FK_02] FOREIGN KEY ([Id_Servicio]) REFERENCES [Servicios_Turnos] ([Id_Servicio])')
$db.Execute('ALTER TABLE [Eventos_Turnos] ADD CONSTRAINT [FK_03] FOREIGN KEY ([Id_Turno]) REFERENCES [Turnos] ([Id_Turno])')
$db.Execute('ALTER TABLE [Roles_Monitores] ADD CONSTRAINT [FK_04] FOREIGN KEY ([Id_Servicio]) REFERENCES [Servicios_Turnos] ([Id_Servicio])')
$db.Execute('ALTER TABLE [Reactivaciones_Turnos] ADD CONSTRAINT [FK_05] FOREIGN KEY ([Id_Servicio]) REFERENCES [Servicios_Turnos] ([Id_Servicio])')
$db.Execute('ALTER TABLE [Reactivaciones_Turnos] ADD CONSTRAINT [FK_06] FOREIGN KEY ([Id_Turno]) REFERENCES [Turnos] ([Id_Turno])')
$db.Execute('ALTER TABLE [Turnos] ADD CONSTRAINT [FK_07] FOREIGN KEY ([Id_Servicio]) REFERENCES [Servicios_Turnos] ([Id_Servicio])')
$db.Execute('ALTER TABLE [Recompensas_Tokens] ADD CONSTRAINT [FK_08] FOREIGN KEY ([Id_Evento_Reciclaje]) REFERENCES [Eventos_Reciclaje] ([Id_Evento_Reciclaje])')
$db.Execute('ALTER TABLE [Recompensas_Tokens] ADD CONSTRAINT [FK_09] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Perfiles] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Perfiles] ADD CONSTRAINT [FK_10] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Roles_Monitores] ADD CONSTRAINT [FK_11] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Turnos] ADD CONSTRAINT [FK_12] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Reactivaciones_Turnos] ADD CONSTRAINT [FK_13] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Eventos_Turnos] ADD CONSTRAINT [FK_14] FOREIGN KEY ([Id_Usuario_Actor]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Datos_Estudiantiles] ADD CONSTRAINT [FK_15] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$db.Execute('ALTER TABLE [Notificaciones] ADD CONSTRAINT [FK_16] FOREIGN KEY ([Id_Estudiante]) REFERENCES [Estudiantes_Registrados] ([Id_Estudiante])')
$a.CloseCurrentDatabase()
Write-Output "CREATED:$out"
}finally{if($a-ne$null){try{$a.Quit()}catch{};[Runtime.InteropServices.Marshal]::ReleaseComObject($a)|Out-Null}}
