-- Kas Konsumen Table Creation
-- Run this SQL to create the kas_konsumen table in your pdam_app database

CREATE TABLE IF NOT EXISTS `kas_konsumen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `jenis` enum('masuk','keluar') NOT NULL DEFAULT 'masuk',
  `kategori` varchar(100) NOT NULL,
  `deskripsi` text,
  `jumlah` decimal(15,2) NOT NULL,
  `created_by` int(11),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_jenis` (`jenis`),
  KEY `idx_kategori` (`kategori`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_kas_konsumen_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
