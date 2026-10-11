START TRANSACTION;
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
VALUES ('20261011150618_Ver_1.0.19', '9.0.20');

COMMIT;

