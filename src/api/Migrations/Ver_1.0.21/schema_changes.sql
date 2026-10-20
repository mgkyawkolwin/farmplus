START TRANSACTION;
ALTER TABLE `Users` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261019114502_Ver_1.0.21', '9.0.21');

COMMIT;

