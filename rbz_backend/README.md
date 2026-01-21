# RBZ Microfinance Licensing System

A Spring Boot application for managing microfinance licensing processes.

## Project Specifications

- **Spring Boot Version**: 3.3.0
- **Java Version**: 21
- **Build Tool**: Maven
- **Database**: PostgreSQL

## Key Dependencies

- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- PostgreSQL Driver
- Lombok
- POI-TL (for Word document generation)

## Getting Started

### Prerequisites

- Java 21 JDK
- Maven
- PostgreSQL database

### Database Setup

Create a PostgreSQL database named `rbz_db` with the following credentials:
- Username: postgres
- Password: password

### Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Run the application using Maven:
   ```
   mvn spring-boot:run
   ```

The application will start on port 8080.

### Health Check

To verify the application is running, access the health endpoint:
```
GET http://localhost:8080/health
```

Expected response: `RBZ Backend is Online`
