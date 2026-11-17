CREATE TABLE `intakes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`volume_ml` integer NOT NULL,
	`kind` text DEFAULT 'air' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `intakes_user_time_idx` ON `intakes` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `ipss_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`taken_on` text NOT NULL,
	`q1` integer NOT NULL,
	`q2` integer NOT NULL,
	`q3` integer NOT NULL,
	`q4` integer NOT NULL,
	`q5` integer NOT NULL,
	`q6` integer NOT NULL,
	`q7` integer NOT NULL,
	`qol` integer NOT NULL,
	`total` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ipss_user_date_idx` ON `ipss_entries` (`user_id`,`taken_on`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`session_key` text NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`timezone` text DEFAULT 'Asia/Jakarta' NOT NULL,
	`birth_date` text,
	`sex` text,
	`fluid_target_ml` integer DEFAULT 2000 NOT NULL,
	`sleep_time` text DEFAULT '22:00' NOT NULL,
	`wake_time` text DEFAULT '05:00' NOT NULL,
	`medical_history` text DEFAULT '' NOT NULL,
	`medications` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `voids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`volume_ml` integer,
	`urgency` integer DEFAULT 0 NOT NULL,
	`leakage` integer DEFAULT 0 NOT NULL,
	`woke_from_sleep` integer DEFAULT false NOT NULL,
	`color` integer,
	`pain` integer DEFAULT false NOT NULL,
	`hematuria` integer DEFAULT false NOT NULL,
	`weak_stream` integer DEFAULT false NOT NULL,
	`straining` integer DEFAULT false NOT NULL,
	`intermittent` integer DEFAULT false NOT NULL,
	`incomplete` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `voids_user_time_idx` ON `voids` (`user_id`,`occurred_at`);