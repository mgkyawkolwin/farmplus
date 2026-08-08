START TRANSACTION;
DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260808092142_Ver_1.0.2') THEN

    CREATE TABLE `AdminUsers` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserName` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Email` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `Role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `PasswordHash` varchar(256) CHARACTER SET utf8mb4 NOT NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_AdminUsers` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260808092142_Ver_1.0.2') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260808092142_Ver_1.0.2', '9.0.18');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

