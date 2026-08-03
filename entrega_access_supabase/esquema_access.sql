-- Esquema compatible con Microsoft Access
-- Copia academica anonimizada de Supabase LazosTech, 2026-07-14

CREATE TABLE [profiles] (
  [id] TEXT(36) NOT NULL,
  [username] TEXT(255),
  [full_name] TEXT(255),
  [university] TEXT(255),
  [wallet_address] TEXT(255),
  [role] TEXT(255),
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_profiles] PRIMARY KEY ([id])
);

CREATE TABLE [recycling_events] (
  [id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [material_type] TEXT(255) NOT NULL,
  [quantity] DOUBLE NOT NULL,
  [validated] YESNO,
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_recycling_events] PRIMARY KEY ([id])
);

CREATE TABLE [ticket_turn_events] (
  [id] TEXT(36) NOT NULL,
  [turn_id] TEXT(36),
  [service_id] TEXT(36),
  [actor_user_id] TEXT(36),
  [event_type] TEXT(255) NOT NULL,
  [payload] LONGTEXT NOT NULL,
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_ticket_turn_events] PRIMARY KEY ([id])
);

CREATE TABLE [ticket_turn_monitor_roles] (
  [id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [service_id] TEXT(36),
  [role] TEXT(255) NOT NULL,
  [is_active] YESNO NOT NULL,
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_ticket_turn_monitor_roles] PRIMARY KEY ([id])
);

CREATE TABLE [ticket_turn_reactivations] (
  [id] TEXT(36) NOT NULL,
  [turn_id] TEXT(36) NOT NULL,
  [service_id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [reactivated_at] DATETIME NOT NULL,
  [expires_at] DATETIME,
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_ticket_turn_reactivations] PRIMARY KEY ([id])
);

CREATE TABLE [ticket_turn_services] (
  [id] TEXT(36) NOT NULL,
  [code] TEXT(255) NOT NULL,
  [name] TEXT(255) NOT NULL,
  [qr_code_token] TEXT(255) NOT NULL,
  [operation_start_time] DATETIME NOT NULL,
  [monthly_reactivation_limit] LONG NOT NULL,
  [is_active] YESNO NOT NULL,
  [created_at] DATETIME NOT NULL,
  [updated_at] DATETIME NOT NULL,
  [queue_paused] YESNO NOT NULL,
  [queue_paused_at] DATETIME,
  CONSTRAINT [pk_ticket_turn_services] PRIMARY KEY ([id])
);

CREATE TABLE [ticket_turns] (
  [id] TEXT(36) NOT NULL,
  [service_id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [student_code] TEXT(255) NOT NULL,
  [student_email] TEXT(255) NOT NULL,
  [student_name] TEXT(255) NOT NULL,
  [turn_date] DATETIME NOT NULL,
  [sequence_number] LONG NOT NULL,
  [turn_code] TEXT(255) NOT NULL,
  [status] TEXT(255) NOT NULL,
  [assigned_at] DATETIME NOT NULL,
  [expires_at] DATETIME,
  [attended_at] DATETIME,
  [created_at] DATETIME NOT NULL,
  [updated_at] DATETIME NOT NULL,
  [is_special] YESNO NOT NULL,
  [is_paused] YESNO NOT NULL,
  [paused_at] DATETIME,
  CONSTRAINT [pk_ticket_turns] PRIMARY KEY ([id])
);

CREATE TABLE [token_rewards] (
  [id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [recycling_event_id] TEXT(36),
  [amount] DOUBLE NOT NULL,
  [tx_hash] TEXT(255),
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_token_rewards] PRIMARY KEY ([id])
);

CREATE TABLE [user_notifications] (
  [id] TEXT(36) NOT NULL,
  [user_id] TEXT(36) NOT NULL,
  [type] TEXT(255) NOT NULL,
  [title] TEXT(255) NOT NULL,
  [body] TEXT(255) NOT NULL,
  [href] TEXT(255),
  [is_read] YESNO NOT NULL,
  [created_at] DATETIME NOT NULL,
  CONSTRAINT [pk_user_notifications] PRIMARY KEY ([id])
);

CREATE TABLE [user_profiles] (
  [user_id] TEXT(36) NOT NULL,
  [email] TEXT(255) NOT NULL,
  [first_name] TEXT(255) NOT NULL,
  [last_name] TEXT(255) NOT NULL,
  [phone] TEXT(255) NOT NULL,
  [national_id] TEXT(255) NOT NULL,
  [student_code] TEXT(255) NOT NULL,
  [university_id] LONG NOT NULL,
  [campus_id] LONG NOT NULL,
  [program_id] LONG NOT NULL,
  [student_type] TEXT(255) NOT NULL,
  [benefit_label] TEXT(255) NOT NULL,
  [university_validated] YESNO NOT NULL,
  [created_at] DATETIME NOT NULL,
  [updated_at] DATETIME NOT NULL,
  [linked_wallet] TEXT(255),
  [wallet_linked_at] DATETIME,
  [onchain_profile_registered] YESNO NOT NULL,
  [onchain_affiliation_synced] YESNO NOT NULL,
  CONSTRAINT [pk_user_profiles] PRIMARY KEY ([user_id])
);

ALTER TABLE [recycling_events] ADD CONSTRAINT [recycling_events_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [profiles] ([id]);
ALTER TABLE [ticket_turn_events] ADD CONSTRAINT [ticket_turn_events_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id]);
ALTER TABLE [ticket_turn_events] ADD CONSTRAINT [ticket_turn_events_turn_id_fkey] FOREIGN KEY ([turn_id]) REFERENCES [ticket_turns] ([id]);
ALTER TABLE [ticket_turn_monitor_roles] ADD CONSTRAINT [ticket_turn_monitor_roles_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id]);
ALTER TABLE [ticket_turn_reactivations] ADD CONSTRAINT [ticket_turn_reactivations_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id]);
ALTER TABLE [ticket_turn_reactivations] ADD CONSTRAINT [ticket_turn_reactivations_turn_id_fkey] FOREIGN KEY ([turn_id]) REFERENCES [ticket_turns] ([id]);
ALTER TABLE [ticket_turns] ADD CONSTRAINT [ticket_turns_service_id_fkey] FOREIGN KEY ([service_id]) REFERENCES [ticket_turn_services] ([id]);
ALTER TABLE [token_rewards] ADD CONSTRAINT [token_rewards_recycling_event_id_fkey] FOREIGN KEY ([recycling_event_id]) REFERENCES [recycling_events] ([id]);
ALTER TABLE [token_rewards] ADD CONSTRAINT [token_rewards_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [profiles] ([id]);
