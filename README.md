# RBZ System

The RBZ System is a comprehensive licensing and document verification platform with an integrated AI-powered scanning bot.

## Project Structure

- `rbz_backend/`: Spring Boot (Java) REST API.
- `rbz-frontend/`: React (JavaScript) Dashboard.
- `rbz_ai/`: Python-based AI scanning and processing service.

## Database Setup

This project uses PostgreSQL. To set up the database:

1.  **Install PostgreSQL**: Ensure you have PostgreSQL installed and running.
2.  **Create Database**: Create a database named `rbz_db`.
3.  **Run Schema Scripts**: Execute the following SQL scripts in order:
    - `database_verification_stage1.sql`
    - `database_verification_stage2.sql`
4.  **Configure Backend**: 
    - Go to `rbz_backend/src/main/resources/`.
    - Copy `application.properties.example` to `application.properties`.
    - Update the `spring.datasource.username` and `spring.datasource.password` with your local credentials.

## Installation & Running

### Backend
```bash
cd rbz_backend
mvn clean install
mvn spring-boot:run
```

### Frontend
```bash
cd rbz-frontend
npm install
npm start
```

### AI Service
```bash
cd rbz_ai
pip install -r requirements.txt
python main_bot.py
```

## AI & Learning
The system includes a `LearningService` that captures user lifecycle events and document verification patterns to improve the AI's accuracy over time.
