CREATE TABLE `candidatos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`cargo` varchar(200),
	`partido` varchar(100),
	`videoIdleUrl` text,
	`videoSpeakingUrl` text,
	`elevenLabsVoiceId` varchar(100),
	`conteudoRag` text,
	`status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
	`pacote` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidatos_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidatos_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `interacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoId` int NOT NULL,
	`candidatoSlug` varchar(64),
	`eleitorId` varchar(64),
	`pergunta` text NOT NULL,
	`resposta` text,
	`tempoRespostaMs` int,
	`canal` varchar(50) DEFAULT 'web',
	`ipHash` varchar(64),
	`dispositivo` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `santinhos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(32) NOT NULL,
	`candidatoId` int NOT NULL,
	`candidatoSlug` varchar(64) NOT NULL,
	`plano` enum('1min','2min') NOT NULL,
	`status` enum('unused','used','expired') NOT NULL DEFAULT 'unused',
	`usadoEm` timestamp,
	`ipHash` varchar(64),
	`perguntasFeitas` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `santinhos_id` PRIMARY KEY(`id`),
	CONSTRAINT `santinhos_token_unique` UNIQUE(`token`)
);
