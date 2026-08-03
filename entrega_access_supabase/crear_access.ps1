$ErrorActionPreference='Stop'
$root='C:\Users\INICIO\lazos-dapp\NUDOS\entrega_access_supabase'
$out=Join-Path $root 'LazosTech_Supabase_Academico.accdb'
if(Test-Path -LiteralPath $out){throw "Ya existe: $out"}
$access=$null
try{
$access=New-Object -ComObject Access.Application
$access.Visible=$false
$access.NewCurrentDatabase($out)
$db=$access.CurrentDb()
$access.DoCmd.TransferText(0,'','profiles',(Join-Path $root 'csv\profiles.csv'),$true,'',65001)
$access.DoCmd.TransferText(0,'','ticket_turn_monitor_roles',(Join-Path $root 'csv\ticket_turn_monitor_roles.csv'),$true,'',65001)
$access.DoCmd.TransferText(0,'','ticket_turn_reactivations',(Join-Path $root 'csv\ticket_turn_reactivations.csv'),$true,'',65001)
$access.DoCmd.TransferText(0,'','ticket_turn_services',(Join-Path $root 'csv\ticket_turn_services.csv'),$true,'',65001)
$access.DoCmd.TransferText(0,'','ticket_turns',(Join-Path $root 'csv\ticket_turns.csv'),$true,'',65001)
$access.DoCmd.TransferText(0,'','user_profiles',(Join-Path $root 'csv\user_profiles.csv'),$true,'',65001)
$db.Execute('CREATE TABLE [recycling_events] ([id] TEXT(36), [user_id] TEXT(36), [material_type] TEXT(255), [quantity] DOUBLE, [validated] YESNO, [created_at] DATETIME, CONSTRAINT [pk_recycling_events] PRIMARY KEY ([id]))')
$db.Execute('CREATE TABLE [ticket_turn_events] ([id] TEXT(36), [turn_id] TEXT(36), [service_id] TEXT(36), [actor_user_id] TEXT(36), [event_type] TEXT(255), [payload] LONGTEXT, [created_at] DATETIME, CONSTRAINT [pk_ticket_turn_events] PRIMARY KEY ([id]))')
$db.Execute('CREATE TABLE [token_rewards] ([id] TEXT(36), [user_id] TEXT(36), [recycling_event_id] TEXT(36), [amount] DOUBLE, [tx_hash] TEXT(255), [created_at] DATETIME, CONSTRAINT [pk_token_rewards] PRIMARY KEY ([id]))')
$db.Execute('CREATE TABLE [user_notifications] ([id] TEXT(36), [user_id] TEXT(36), [type] TEXT(255), [title] TEXT(255), [body] TEXT(255), [href] TEXT(255), [is_read] YESNO, [created_at] DATETIME, CONSTRAINT [pk_user_notifications] PRIMARY KEY ([id]))')
$db.Execute('ALTER TABLE [profiles] ADD CONSTRAINT [pk_profiles] PRIMARY KEY ([id])')
$db.Execute('ALTER TABLE [ticket_turn_monitor_roles] ADD CONSTRAINT [pk_ticket_turn_monitor_roles] PRIMARY KEY ([id])')
$db.Execute('ALTER TABLE [ticket_turn_reactivations] ADD CONSTRAINT [pk_ticket_turn_reactivations] PRIMARY KEY ([id])')
$db.Execute('ALTER TABLE [ticket_turn_services] ADD CONSTRAINT [pk_ticket_turn_services] PRIMARY KEY ([id])')
$db.Execute('ALTER TABLE [ticket_turns] ADD CONSTRAINT [pk_ticket_turns] PRIMARY KEY ([id])')
$db.Execute('ALTER TABLE [user_profiles] ADD CONSTRAINT [pk_user_profiles] PRIMARY KEY ([user_id])')
$db.Execute('ALTER TABLE [recycling_events] ADD CONSTRAINT [recycling_events_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [profiles] ([id])')
$db.Execute('ALTER TABLE [ticket_turn_events] ADD CONSTRAINT [ticket_turn_events_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id])')
$db.Execute('ALTER TABLE [ticket_turn_events] ADD CONSTRAINT [ticket_turn_events_turn_id_fkey] FOREIGN KEY ([turn_id]) REFERENCES [ticket_turns] ([id])')
$db.Execute('ALTER TABLE [ticket_turn_monitor_roles] ADD CONSTRAINT [ticket_turn_monitor_roles_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id])')
$db.Execute('ALTER TABLE [ticket_turn_reactivations] ADD CONSTRAINT [ticket_turn_reactivations_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id])')
$db.Execute('ALTER TABLE [ticket_turn_reactivations] ADD CONSTRAINT [ticket_turn_reactivations_turn_id_fkey] FOREIGN KEY ([turn_id]) REFERENCES [ticket_turns] ([id])')
$db.Execute('ALTER TABLE [ticket_turns] ADD CONSTRAINT [ticket_turns_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id])')
$db.Execute('ALTER TABLE [token_rewards] ADD CONSTRAINT [token_rewards_recycling_event_id_fkey] FOREIGN KEY ([recycling_event_id]) REFERENCES [recycling_events] ([id])')
$db.Execute('ALTER TABLE [token_rewards] ADD CONSTRAINT [token_rewards_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [profiles] ([id])')
$access.CloseCurrentDatabase()
Write-Output "CREATED:$out"
}finally{if($access-ne$null){try{$access.Quit()}catch{};[Runtime.InteropServices.Marshal]::ReleaseComObject($access)|Out-Null}}
