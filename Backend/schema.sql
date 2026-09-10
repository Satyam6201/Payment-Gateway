-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `payment_gateway`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `payment_gateway`;

-- Table: users

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'usd',
  `status` ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  `orderId` VARCHAR(255) NOT NULL,
  `stripeCheckoutSessionId` VARCHAR(255) NULL UNIQUE,
  `stripePaymentIntentId` VARCHAR(255) NULL,
  `paidAt` DATETIME NULL DEFAULT NULL,
  `failureMessage` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_orderId` (`orderId`),
  INDEX `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_user`
    FOREIGN KEY (`userId`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;