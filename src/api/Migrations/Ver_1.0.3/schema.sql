START TRANSACTION;
DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `Users` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `Products` ADD `CoverImageUrl` longtext CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `Products` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `Customers` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `Categories` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    ALTER TABLE `AdminUsers` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    CREATE TABLE `Brands` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Brand` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Brands` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    CREATE TABLE `Dealers` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `DealerName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `Email` varchar(50) CHARACTER SET utf8mb4 NULL,
        `PhoneNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
        `Address` varchar(100) CHARACTER SET utf8mb4 NULL,
        `StateDivision` varchar(100) CHARACTER SET utf8mb4 NULL,
        `City` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Country` varchar(50) CHARACTER SET utf8mb4 NULL,
        `LogoUrl` varchar(100) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Dealers` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    CREATE TABLE `Medias` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ObjectName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `MediaType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `OwnerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Size` bigint NOT NULL,
        `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Medias` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    CREATE TABLE `Suppliers` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `SupplierName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `Email` varchar(50) CHARACTER SET utf8mb4 NULL,
        `PhoneNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
        `Address` varchar(100) CHARACTER SET utf8mb4 NULL,
        `StateDivision` varchar(100) CHARACTER SET utf8mb4 NULL,
        `City` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Country` varchar(50) CHARACTER SET utf8mb4 NULL,
        `LogoUrl` varchar(100) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Suppliers` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    CREATE TABLE `Units` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Unit` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Units` PRIMARY KEY (`Id`)
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
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260816030924_Ver_1.0.3') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260816030924_Ver_1.0.3', '9.0.19');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

