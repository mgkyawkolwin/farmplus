START TRANSACTION;
DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260802110917_Ver_1.0.1') THEN

    ALTER TABLE `Categories` ADD `IsActive` tinyint(1) NOT NULL DEFAULT FALSE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260802110917_Ver_1.0.1') THEN

    CREATE TABLE `Customers` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `NationalIdNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Phone` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Email` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Address` varchar(256) CHARACTER SET utf8mb4 NULL,
        `City` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Country` varchar(50) CHARACTER SET utf8mb4 NULL,
        `PostalCode` varchar(50) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Customers` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260802110917_Ver_1.0.1') THEN

    CREATE TABLE `Products` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(512) CHARACTER SET utf8mb4 NOT NULL,
        `Brand` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `SKU` varchar(50) CHARACTER SET utf8mb4 NULL,
        `UPC` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Category` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `Unit` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `PurchasePrice` decimal(18,2) NOT NULL,
        `SalePrice` decimal(18,2) NOT NULL,
        `CurrentStock` int NOT NULL,
        `MinimumStock` int NOT NULL,
        `TaxRate` decimal(5,2) NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Products` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260802110917_Ver_1.0.1') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260802110917_Ver_1.0.1', '9.0.18');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

