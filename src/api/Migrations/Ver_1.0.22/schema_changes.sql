START TRANSACTION;
ALTER DATABASE COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Users` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Units` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Suppliers` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `StockMovements` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `ShopStocks` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Shops` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Sales` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `SalePayments` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `SaleItems` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Roles` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `RolePermissions` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Purchases` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `PurchaseItems` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Products` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Messages` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Medias` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Dealers` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Customers` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `CustomerMessages` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Categories` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Brands` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `AdminUsers` COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Users` MODIFY COLUMN `UserName` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Users` MODIFY COLUMN `ProfilePictureUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` MODIFY COLUMN `PasswordHash` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Users` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` MODIFY COLUMN `DisplayName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Users` MODIFY COLUMN `City` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` MODIFY COLUMN `Address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` ADD `IsActive` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Users` ADD `NationalId` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` ADD `PassportNumber` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Users` ADD `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Units` MODIFY COLUMN `Unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `SupplierName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `StateDivision` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `PhoneNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `LogoUrl` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `Country` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `City` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Suppliers` MODIFY COLUMN `Address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `StockMovements` MODIFY COLUMN `Type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `StockMovements` MODIFY COLUMN `Remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `StateDivision` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `PostalCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `Phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Shops` MODIFY COLUMN `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `Country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `City` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Shops` MODIFY COLUMN `Address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Sales` MODIFY COLUMN `VoidReason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Sales` MODIFY COLUMN `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Sales` MODIFY COLUMN `CustomerName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `SaleItems` MODIFY COLUMN `Unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `SaleItems` MODIFY COLUMN `ProductName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Roles` MODIFY COLUMN `Role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `RolePermissions` MODIFY COLUMN `PermissionKey` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Purchases` MODIFY COLUMN `SupplierName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Purchases` MODIFY COLUMN `ShopName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `PurchaseItems` MODIFY COLUMN `Unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `PurchaseItems` MODIFY COLUMN `ProductName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `Unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `UPC` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Products` MODIFY COLUMN `SKU` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Products` MODIFY COLUMN `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `Description` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `CoverImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Products` MODIFY COLUMN `Category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Products` MODIFY COLUMN `Brand` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Messages` MODIFY COLUMN `MessageText` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Messages` MODIFY COLUMN `Audience` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Messages` ADD `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';

ALTER TABLE `Medias` MODIFY COLUMN `ObjectName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Medias` MODIFY COLUMN `MediaType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `StateDivision` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `PhoneNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `LogoUrl` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `DealerName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `Country` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `City` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Dealers` MODIFY COLUMN `Address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `ProfilePictureUrl` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `PostalCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `Phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `NationalIdNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Customers` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `Country` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `City` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Customers` MODIFY COLUMN `Address` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE `Categories` MODIFY COLUMN `Category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `Brands` MODIFY COLUMN `Brand` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `AdminUsers` MODIFY COLUMN `UserName` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `AdminUsers` MODIFY COLUMN `Role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `AdminUsers` MODIFY COLUMN `PasswordHash` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `AdminUsers` MODIFY COLUMN `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261026122202_Ver_1.0.22', '9.0.22');

COMMIT;

