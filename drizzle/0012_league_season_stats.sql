CREATE TABLE `leagueSeasonStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leagueId` int NOT NULL,
	`season` int NOT NULL,
	`stats` json NOT NULL,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE now(),
	CONSTRAINT `leagueSeasonStats_id` PRIMARY KEY(`id`),
	INDEX `leagueSeasonStats_league_season_idx` (`leagueId`,`season`)
);
