-- MySQL dump 10.13  Distrib 8.4.2, for Win64 (x86_64)
--
-- Host: localhost    Database: attendify5
-- ------------------------------------------------------
-- Server version	8.4.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) NOT NULL,
  `class_id` varchar(50) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','cutting','excused') NOT NULL DEFAULT 'absent',
  `time_in` time DEFAULT NULL COMMENT 'PH Time (Asia/Manila)',
  `time_out` time DEFAULT NULL,
  `recorded_by` varchar(50) DEFAULT NULL COMMENT 'Guard/Teacher username',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`username`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,'02000376724','12-MAWD-APPLIED1006-MON-0900','2025-01-27','excused',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-31 06:24:15'),(2,'02000376725','12-MAWD-APPLIED1006-MON-0900','2025-01-27','cutting',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-31 06:24:11'),(3,'02000376725','12-MAWD-APPLIED1012-MON-1030','2025-01-27','absent',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-30 19:24:02'),(4,'02000376724','12-MAWD-CORE1002-MON-1500','2025-01-27','absent',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-30 16:28:36'),(5,'02000376725','12-MAWD-CORE1002-MON-1500','2025-01-27','absent',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-30 19:24:02'),(6,'02000376725','12-MAWD-SPECIAL1083-MON-0800','2025-01-27','absent',NULL,NULL,'system','2025-01-30 16:28:36','2025-01-30 19:24:02');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_history`
--

DROP TABLE IF EXISTS `attendance_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_history` (
  `attendance_id` int NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `class_id` varchar(50) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','cutting','excused') NOT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `recorded_by` varchar(50) DEFAULT NULL,
  `archived_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`,`archived_at`),
  KEY `idx_history_student` (`student_id`),
  KEY `idx_history_class` (`class_id`),
  KEY `idx_history_date` (`attendance_date`),
  CONSTRAINT `attendance_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `attendance_history_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_history`
--

LOCK TABLES `attendance_history` WRITE;
/*!40000 ALTER TABLE `attendance_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `class_id` varchar(50) NOT NULL,
  `course_code` varchar(20) NOT NULL,
  `grade_section` varchar(20) NOT NULL,
  `teacher_username` varchar(50) NOT NULL,
  `day` enum('Mon','Tue','Wed','Thu','Fri') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`class_id`),
  KEY `course_code` (`course_code`),
  KEY `idx_class_teacher` (`teacher_username`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`course_code`) REFERENCES `courses` (`course_code`) ON DELETE CASCADE,
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`teacher_username`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES ('12-MAWD-APPLIED1006-MON-0900','APPLIED1006','12-MAWD','harvey.plazo','Mon','09:00:00','10:30:00'),('12-MAWD-APPLIED1006-TUE-0900','APPLIED1006','12-MAWD','harvey.plazo','Tue','09:00:00','10:30:00'),('12-MAWD-APPLIED1012-MON-1030','APPLIED1012','12-MAWD','raymond.iglesia','Mon','10:30:00','12:00:00'),('12-MAWD-APPLIED1012-TUE-1030','APPLIED1012','12-MAWD','raymond.iglesia','Tue','10:30:00','12:00:00'),('12-MAWD-CORE1002-MON-1500','CORE1002','12-MAWD','julie.quinano','Mon','15:00:00','16:30:00'),('12-MAWD-CORE1002-TUE-1500','CORE1002','12-MAWD','julie.quinano','Tue','15:00:00','16:30:00'),('12-MAWD-CORE1016-WED-0730','CORE1016','12-MAWD','johnmel.napili','Wed','07:30:00','09:30:00'),('12-MAWD-CORE1024-WED-1030','CORE1024','12-MAWD','julie.quinano','Wed','10:30:00','11:30:00'),('12-MAWD-CORE1028-WED-1130','CORE1028','12-MAWD','kim.chesca.quinones','Wed','11:30:00','12:30:00'),('12-MAWD-SPECIAL1083-MON-0800','SPECIAL1083','12-MAWD','julie.quinano','Mon','08:00:00','09:00:00'),('12-MAWD-SPECIAL1083-TUE-0800','SPECIAL1083','12-MAWD','julie.quinano','Tue','08:00:00','09:00:00'),('12-MAWD-SPECIAL1099-FRI-0730','SPECIAL1099','12-MAWD','harvey.plazo','Fri','07:30:00','09:00:00'),('12-MAWD-SPECIAL1099-THU-0730','SPECIAL1099','12-MAWD','harvey.plazo','Thu','07:30:00','09:00:00'),('12-MAWD-SPECIAL1100-FRI-0900','SPECIAL1100','12-MAWD','harvey.plazo','Fri','09:00:00','10:30:00'),('12-MAWD-SPECIAL1100-THU-0900','SPECIAL1100','12-MAWD','harvey.plazo','Thu','09:00:00','10:30:00');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_code` varchar(15) NOT NULL,
  `course_name` varchar(128) NOT NULL,
  PRIMARY KEY (`course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES ('APPLIED1006','Empowerment Technologies: ICT'),('APPLIED1009','Entrepreneurship'),('APPLIED1012','Inquiries, Investigation & Immersion'),('CORE1002','Contemporary Arts from Regions'),('CORE1016','Physical Education & Health 4'),('CORE1024','Homeroom G12-2nd Term'),('CORE1028','Student Org & Clubs - G12-2nd'),('SPECIAL1083','Work Immersion-Practicum Type'),('SPECIAL1099','Computer/Web Programming 6'),('SPECIAL1100','Mobile App Programming 2');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_classes`
--

DROP TABLE IF EXISTS `student_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_classes` (
  `student_id` varchar(20) NOT NULL,
  `class_id` varchar(50) NOT NULL,
  `enrollment_type` enum('preset','manual') NOT NULL DEFAULT 'preset',
  `enrollment_date` date NOT NULL,
  PRIMARY KEY (`student_id`,`class_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `student_classes_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_classes_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_classes`
--

LOCK TABLES `student_classes` WRITE;
/*!40000 ALTER TABLE `student_classes` DISABLE KEYS */;
INSERT INTO `student_classes` VALUES ('02000376724','12-MAWD-APPLIED1006-MON-0900','manual','2025-01-26'),('02000376724','12-MAWD-CORE1002-MON-1500','manual','2025-01-26'),('02000376725','12-MAWD-APPLIED1006-MON-0900','preset','2025-01-26'),('02000376725','12-MAWD-APPLIED1006-TUE-0900','preset','2025-01-26'),('02000376725','12-MAWD-APPLIED1012-MON-1030','preset','2025-01-26'),('02000376725','12-MAWD-APPLIED1012-TUE-1030','preset','2025-01-26'),('02000376725','12-MAWD-CORE1002-MON-1500','preset','2025-01-26'),('02000376725','12-MAWD-CORE1002-TUE-1500','preset','2025-01-26'),('02000376725','12-MAWD-CORE1016-WED-0730','preset','2025-01-26'),('02000376725','12-MAWD-CORE1024-WED-1030','preset','2025-01-26'),('02000376725','12-MAWD-CORE1028-WED-1130','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1083-MON-0800','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1083-TUE-0800','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1099-FRI-0730','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1099-THU-0730','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1100-FRI-0900','preset','2025-01-26'),('02000376725','12-MAWD-SPECIAL1100-THU-0900','preset','2025-01-26');
/*!40000 ALTER TABLE `student_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` varchar(20) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `rfid` varchar(20) NOT NULL COMMENT 'Editable, no duplication via physical checks',
  `is_regular` tinyint(1) NOT NULL DEFAULT '1',
  `grade_section` varchar(20) DEFAULT NULL COMMENT 'NULL for irregular students',
  `profile_image` varchar(255) DEFAULT NULL COMMENT 'Path to image file for guard UI',
  `guardian_contact` varchar(20) DEFAULT NULL COMMENT 'For SMS alerts',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `rfid` (`rfid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES ('02000376724','Nathaniel Rodriguez','RFID_0001',0,NULL,'nathanielrodriguez.jpg',NULL),('02000376725','Arron Caudilla','RFID_0000',1,'12-MAWD','arroncaudilla.jpg',NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('teacher','guard','admin') NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('harvey.plazo','Harvey Panambo Plazo','0000','teacher'),('johnmel.napili','Johnmel Napili','0000','teacher'),('julie.quinano','Julie Ann P. Quinano','0000','teacher'),('kim.chesca.quinones','Kim Chesca F. Quiñones','0000','teacher'),('raymond.iglesia','Raymond Iglesia','0000','teacher'),('system','System Manager','0000','admin'),('winnie.delossantos','Winnie Delos Santos','0000','guard');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-01 21:34:25
