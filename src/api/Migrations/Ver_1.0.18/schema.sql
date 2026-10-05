START TRANSACTION;
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
VALUES ('20261005040943_Ver_1.0.18', '9.0.20');

COMMIT;

