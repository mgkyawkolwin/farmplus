CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Categories` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Category` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Categories` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Users` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserName` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `DisplayName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Address` varchar(500) CHARACTER SET utf8mb4 NULL,
    `City` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ProfilePictureUrl` varchar(500) CHARACTER SET utf8mb4 NULL,
    `PasswordHash` varchar(256) CHARACTER SET utf8mb4 NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260724035439_Ver_1.0.0', '9.0.21');

ALTER TABLE `Categories` ADD `IsActive` tinyint(1) NOT NULL DEFAULT FALSE;

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

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260802110917_Ver_1.0.1', '9.0.21');

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

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260808092142_Ver_1.0.2', '9.0.21');

ALTER TABLE `Users` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Products` ADD `CoverImageUrl` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Products` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Customers` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Categories` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `AdminUsers` ADD `MainTenantId` char(36) COLLATE ascii_general_ci NULL;

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

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260816030924_Ver_1.0.3', '9.0.21');

CREATE TABLE `Purchases` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `SupplierId` char(36) COLLATE ascii_general_ci NOT NULL,
    `SupplierName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `PurchaseDate` datetime(6) NOT NULL,
    `TotalProducts` int NOT NULL,
    `SubTotal` decimal(18,2) NOT NULL,
    `Discount` decimal(18,2) NOT NULL,
    `Tax` decimal(18,2) NOT NULL,
    `NetTotal` decimal(18,2) NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Purchases` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Roles` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Roles` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Sales` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `CustomerId` char(36) COLLATE ascii_general_ci NULL,
    `CustomerName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `SaleDate` datetime(6) NOT NULL,
    `TotalProducts` int NOT NULL,
    `SubTotal` decimal(18,2) NOT NULL,
    `Tax` decimal(18,2) NOT NULL,
    `NetTotal` decimal(18,2) NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Sales` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `PurchaseItems` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PurchaseId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Unit` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(18,2) NOT NULL,
    `LineTotal` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_PurchaseItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PurchaseItems_Purchases_PurchaseId` FOREIGN KEY (`PurchaseId`) REFERENCES `Purchases` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SaleItems` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `SaleId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Unit` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(18,2) NOT NULL,
    `TaxRate` decimal(5,2) NOT NULL,
    `LineTotal` decimal(18,2) NOT NULL,
    `TaxTotal` decimal(18,2) NOT NULL,
    CONSTRAINT `PK_SaleItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SaleItems_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_PurchaseItems_PurchaseId` ON `PurchaseItems` (`PurchaseId`);

CREATE INDEX `IX_SaleItems_SaleId` ON `SaleItems` (`SaleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261005040943_Ver_1.0.18', '9.0.21');

ALTER TABLE `Products` DROP COLUMN `PurchasePrice`;

ALTER TABLE `Sales` ADD `Balance` decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Sales` ADD `Discount` decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Sales` ADD `PaidAmount` decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Sales` ADD `ShopId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Sales` ADD `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `Sales` ADD `TaxRate` decimal(5,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Sales` ADD `VoidReason` varchar(500) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Sales` ADD `VoidedAtUtc` datetime(6) NULL;

ALTER TABLE `Sales` ADD `VoidedById` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Purchases` ADD `ShopId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Purchases` ADD `ShopName` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Customers` ADD `ProfilePictureUrl` varchar(500) CHARACTER SET utf8mb4 NULL;

CREATE TABLE `SalePayments` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `SaleId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `BalanceBefore` decimal(18,2) NOT NULL,
    `BalanceAfter` decimal(18,2) NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SalePayments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SalePayments_Sales_SaleId` FOREIGN KEY (`SaleId`) REFERENCES `Sales` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Shops` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Address` varchar(200) CHARACTER SET utf8mb4 NULL,
    `City` varchar(100) CHARACTER SET utf8mb4 NULL,
    `StateDivision` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Country` varchar(100) CHARACTER SET utf8mb4 NULL,
    `PostalCode` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Phone` varchar(30) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Shops` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `ShopStocks` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `ShopId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Quantity` int NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_ShopStocks` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `StockMovements` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `ShopId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ProductId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Quantity` int NOT NULL,
    `Type` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `Remark` varchar(500) CHARACTER SET utf8mb4 NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_StockMovements` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_SalePayments_SaleId` ON `SalePayments` (`SaleId`);

CREATE UNIQUE INDEX `IX_ShopStocks_ShopId_ProductId` ON `ShopStocks` (`ShopId`, `ProductId`);

CREATE INDEX `IX_StockMovements_ShopId_ProductId_CreatedAtUtc` ON `StockMovements` (`ShopId`, `ProductId`, `CreatedAtUtc`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261011150618_Ver_1.0.19', '9.0.21');

ALTER TABLE `Users` ADD `RoleId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Sales` ADD `DealerId` char(36) COLLATE ascii_general_ci NULL;

CREATE TABLE `Messages` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Audience` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `MessageText` varchar(4000) CHARACTER SET utf8mb4 NOT NULL,
    `TargetUserId` char(36) COLLATE ascii_general_ci NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Messages` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `RolePermissions` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `RoleId` char(36) COLLATE ascii_general_ci NOT NULL,
    `PermissionKey` varchar(160) CHARACTER SET utf8mb4 NOT NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_RolePermissions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_RolePermissions_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `CustomerMessages` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `MessageId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `IsRead` tinyint(1) NOT NULL,
    `ReadAtUtc` datetime(6) NULL,
    `MainTenantId` char(36) COLLATE ascii_general_ci NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_CustomerMessages` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CustomerMessages_Messages_MessageId` FOREIGN KEY (`MessageId`) REFERENCES `Messages` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CustomerMessages_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Users_RoleId` ON `Users` (`RoleId`);

CREATE UNIQUE INDEX `IX_CustomerMessages_MessageId_UserId` ON `CustomerMessages` (`MessageId`, `UserId`);

CREATE INDEX `IX_CustomerMessages_UserId_IsRead_CreatedAtUtc` ON `CustomerMessages` (`UserId`, `IsRead`, `CreatedAtUtc`);

CREATE UNIQUE INDEX `IX_RolePermissions_RoleId_PermissionKey` ON `RolePermissions` (`RoleId`, `PermissionKey`);

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261018105723_Ver_1.0.20', '9.0.21');

ALTER TABLE `Users` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261019114502_Ver_1.0.21', '9.0.21');

COMMIT;

