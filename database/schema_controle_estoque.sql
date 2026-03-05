-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: controle_estoque
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `item_nota_compra`
--

DROP TABLE IF EXISTS `item_nota_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_nota_compra` (
  `id_item_compra` int NOT NULL AUTO_INCREMENT,
  `id_nota_compra` int NOT NULL,
  `id_lampada` int NOT NULL,
  `quantidade` int NOT NULL,
  PRIMARY KEY (`id_item_compra`),
  KEY `id_nota_compra` (`id_nota_compra`),
  KEY `id_lampada` (`id_lampada`),
  CONSTRAINT `item_nota_compra_ibfk_1` FOREIGN KEY (`id_nota_compra`) REFERENCES `nota_compra` (`id_nota_compra`),
  CONSTRAINT `item_nota_compra_ibfk_2` FOREIGN KEY (`id_lampada`) REFERENCES `lampadas` (`id_lampada`),
  CONSTRAINT `item_nota_compra_chk_1` CHECK ((`quantidade` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_nota_compra`
--

LOCK TABLES `item_nota_compra` WRITE;
/*!40000 ALTER TABLE `item_nota_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_nota_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_nota_venda`
--

DROP TABLE IF EXISTS `item_nota_venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_nota_venda` (
  `id_item_venda` int NOT NULL AUTO_INCREMENT,
  `id_nota_venda` int NOT NULL,
  `id_lampada` int NOT NULL,
  `quantidade` int NOT NULL,
  PRIMARY KEY (`id_item_venda`),
  KEY `id_nota_venda` (`id_nota_venda`),
  KEY `id_lampada` (`id_lampada`),
  CONSTRAINT `item_nota_venda_ibfk_1` FOREIGN KEY (`id_nota_venda`) REFERENCES `nota_venda` (`id_nota_venda`),
  CONSTRAINT `item_nota_venda_ibfk_2` FOREIGN KEY (`id_lampada`) REFERENCES `lampadas` (`id_lampada`),
  CONSTRAINT `item_nota_venda_chk_1` CHECK ((`quantidade` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_nota_venda`
--

LOCK TABLES `item_nota_venda` WRITE;
/*!40000 ALTER TABLE `item_nota_venda` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_nota_venda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lampadas`
--

DROP TABLE IF EXISTS `lampadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lampadas` (
  `id_lampada` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `tamanho` varchar(50) NOT NULL,
  `voltagem` varchar(20) NOT NULL,
  `estoque_atual` int NOT NULL DEFAULT '0',
  `estoque_minimo` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_lampada`),
  CONSTRAINT `lampadas_chk_1` CHECK ((`estoque_atual` >= 0)),
  CONSTRAINT `lampadas_chk_2` CHECK ((`estoque_minimo` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lampadas`
--

LOCK TABLES `lampadas` WRITE;
/*!40000 ALTER TABLE `lampadas` DISABLE KEYS */;
/*!40000 ALTER TABLE `lampadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nota_compra`
--

DROP TABLE IF EXISTS `nota_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nota_compra` (
  `id_nota_compra` int NOT NULL AUTO_INCREMENT,
  `numero_nota` varchar(50) NOT NULL,
  `data_emissao` date NOT NULL,
  PRIMARY KEY (`id_nota_compra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nota_compra`
--

LOCK TABLES `nota_compra` WRITE;
/*!40000 ALTER TABLE `nota_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `nota_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nota_venda`
--

DROP TABLE IF EXISTS `nota_venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nota_venda` (
  `id_nota_venda` int NOT NULL AUTO_INCREMENT,
  `numero_nota` varchar(50) NOT NULL,
  `data_emissao` date NOT NULL,
  PRIMARY KEY (`id_nota_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nota_venda`
--

LOCK TABLES `nota_venda` WRITE;
/*!40000 ALTER TABLE `nota_venda` DISABLE KEYS */;
/*!40000 ALTER TABLE `nota_venda` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-04 21:55:39
