START TRANSACTION;
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

COMMIT;

