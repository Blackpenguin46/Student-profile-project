# System Architecture for Student Profile & Goal Tracking System

## Overview
This document outlines the proposed system architecture for the Student Profile & Goal Tracking System, adhering to the principles of simplicity, maintainability, and the use of free and open-source technologies as outlined in the `CLAUDE.md` and `tech-stack.md` documents. The architecture is designed to be monolithic initially, allowing for incremental development and future scalability.

## High-Level Architecture
The system will follow a traditional three-tier architecture:

1.  **Frontend (Presentation Layer):** Responsible for the user interface and user experience. It will handle user interactions, display data, and communicate with the backend API.
2.  **Backend (Application Layer):** Serves as the core logic of the application. It will handle business logic, data processing, authentication, authorization, and communication with the database.
3.  **Database (Data Layer):** Stores all application data, including student profiles, survey responses, skills, interests, goals, and uploaded resumes.

```mermaid
graph TD
    A[User] -->|Accesses via Web Browser| B(Frontend: React Application)
    B -->|API Requests (RESTful)| C(Backend: Node.js with Express.js)
    C -->|Database Queries| D(Database: MariaDB)
    C -- Optional --> E(Background Jobs: Redis/Bull)
    C -- Optional --> F(Email Service: Nodemailer)
```

## Component Breakdown

### 1. Frontend
-   **Technology:** React with plain JavaScript.
-   **Purpose:** Provides a dynamic and interactive user interface for teachers, students, and administrators.
-   **Key Responsibilities:**
    -   Rendering student profiles, survey forms, dashboards, and search results.
    -   Handling user input and form submissions.
    -   Making API calls to the backend to fetch and send data.
    -   Ensuring mobile responsiveness and accessibility.
-   **Styling:** Plain CSS or Bootstrap for simplicity and rapid development.

### 2. Backend
-   **Technology:** Node.js with Express.js.
-   **Purpose:** Acts as the central hub for all application logic and data management.
-   **Key Responsibilities:**
    -   **Authentication and Authorization:** Manages user registration, login, session management, and role-based access control (RBAC) using `express-session`.
    -   **RESTful API:** Exposes endpoints for all CRUD operations related to student profiles, surveys, goals, skills, interests, and resume uploads.
    -   **Data Processing:** Handles business logic, data validation, and transformation.
    -   **File Processing:** Manages resume uploads, including parsing (using libraries like `pdf-parse` and `mammoth` for PDF/DOCX) and secure storage within the database.
    -   **Background Jobs (Optional but Recommended):** For long-running tasks like resume parsing or sending bulk email reminders, a job queue (e.g., using Redis with Bull) can be integrated to offload processing from the main application thread.
    -   **Email Service (Optional):** For sending email verifications, survey reminders, or password reset links (e.g., using Nodemailer).

### 3. Database
-   **Technology:** MariaDB.
-   **Purpose:** Persistent storage for all application data.
-   **Key Responsibilities:**
    -   Storing structured data: Student profiles, user accounts, survey questions, survey responses, goals, interests, skills, and their relationships.
    -   Storing unstructured data: Uploaded resumes will be stored as BLOBs/LONGBLOBs directly within the MariaDB database. This simplifies backup procedures and ensures atomic transactions for file and metadata.
    -   Ensuring data integrity, consistency, and security.
-   **Access:** Raw SQL queries will be used for database interactions to maintain simplicity and avoid the overhead of an ORM initially.

## Data Flow
1.  A user (teacher or student) interacts with the **Frontend** via a web browser.
2.  The **Frontend** sends API requests (e.g., GET, POST, PUT, DELETE) to the **Backend**.
3.  The **Backend** processes the request:
    -   Authenticates and authorizes the user.
    -   Executes business logic.
    -   Interacts with the **Database** to store or retrieve data.
    -   May enqueue background jobs or send emails as needed.
4.  The **Backend** sends a response back to the **Frontend**.
5.  The **Frontend** updates the UI based on the received data.

## Security Considerations
-   **HTTPS:** All communication between the frontend and backend will be encrypted using HTTPS.
-   **Authentication:** Secure session-based authentication will be implemented.
-   **Authorization:** Role-based access control will ensure users only access data and features permitted by their role.
-   **Data Privacy:** Adherence to FERPA compliance guidelines for student data privacy.
-   **Input Validation:** All user inputs will be validated on the backend to prevent common vulnerabilities like SQL injection and XSS.

## Scalability Path
While starting with a monolithic architecture for simplicity, the design allows for future scalability:
-   **Horizontal Scaling:** The Node.js backend can be scaled horizontally by running multiple instances behind a load balancer.
-   **Database Optimization:** Database indexing, caching (e.g., Redis for session storage and API response caching), and read replicas can improve database performance.
-   **Microservices (Future):** As the application grows, specific functionalities (e.g., resume parsing, analytics) can be extracted into separate microservices.

This architecture provides a solid foundation for building a robust, secure, and intuitive student information tracking system, leveraging free and open-source technologies to meet the competition's requirements.



## Technology Choices

Based on the `tech-stack.md` and the principle of simplicity and free/open-source prioritization, the following technologies will be used:

### Frontend Technologies
-   **Core Framework:** React (with plain JavaScript)
    -   *Justification:* Widely adopted, large community, component-based, and suitable for building interactive UIs. Plain JavaScript is chosen over TypeScript for initial simplicity as per the `tech-stack.md`.
-   **Styling:** Bootstrap (or plain CSS)
    -   *Justification:* Bootstrap provides a robust, mobile-first, and responsive CSS framework that accelerates UI development. It's free and well-documented.
-   **Data Visualization:** Recharts
    -   *Justification:* A charting library built with React components, making it easy to integrate with the frontend. It's open-source and provides various chart types needed for the dashboard.

### Backend Technologies
-   **Core Framework:** Node.js with Express.js
    -   *Justification:* JavaScript runtime environment that allows for full-stack JavaScript development, simplifying context switching. Express.js is a minimalist and flexible Node.js web application framework, ideal for building RESTful APIs.
-   **Authentication:** `express-session` for session management and `bcrypt` for password hashing.
    -   *Justification:* `express-session` provides simple session-based authentication, aligning with the simplicity principle. `bcrypt` is an industry-standard, secure hashing algorithm for passwords.
-   **File Processing:** `multer` for handling multipart form data (file uploads), `pdf-parse` for PDF text extraction, and `mammoth` for DOCX to HTML conversion.
    -   *Justification:* These are popular, open-source Node.js libraries that provide the necessary functionality for resume upload and parsing.
-   **Email Service:** Nodemailer
    -   *Justification:* A free and open-source module for Node.js applications to send emails. It supports various transport options.

### Database Technologies
-   **Primary Database:** MariaDB
    -   *Justification:* A community-developed, open-source relational database that is a drop-in replacement for MySQL. It offers good performance, ACID compliance, and supports JSON data types and BLOB storage for files.
-   **File Storage:** Database BLOB storage
    -   *Justification:* Storing files directly in the database as BLOBs simplifies the architecture, ensures atomic transactions for file and metadata, and streamlines backup procedures. This is suitable given the 10MB file size limit.

### Infrastructure & DevOps (Initial)
-   **Containerization:** Docker and Docker Compose
    -   *Justification:* Docker provides a consistent development environment and simplifies deployment. Docker Compose allows for defining and running multi-container Docker applications locally.
-   **Version Control:** Git with GitHub
    -   *Justification:* Standard for collaborative software development, providing robust version control and project management features.

This selection prioritizes free and open-source solutions, ease of development, and maintainability, while providing a clear path for future scalability and integration of more advanced features or paid services if needed.



## Data Models

This section outlines the core data models for the Student Profile & Goal Tracking System. These models will form the basis of the MariaDB database schema. The relationships between entities are designed to support the functional requirements, including student profile management, dynamic surveys, resume parsing, and data visualization.

### 1. User Model (`users` table)
This model will store information about all users of the system, including teachers, students, and administrators. It will be central to authentication and authorization.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the user.              |
| `email`         | VARCHAR(255) | UNIQUE, NOT NULL   | User's email address (used for login).       |
| `password_hash` | VARCHAR(255) | NOT NULL           | Hashed password for secure storage.          |
| `role`          | VARCHAR(50)  | NOT NULL           | User's role (e.g., 'teacher', 'student', 'admin'). |
| `first_name`    | VARCHAR(100) | NOT NULL           | User's first name.                           |
| `last_name`     | VARCHAR(100) | NOT NULL           | User's last name.                            |
| `created_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp of user creation.                  |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 2. Student Profile Model (`student_profiles` table)
This model will store the core information for each student, linked to their user account.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the student profile.   |
| `user_id`       | INT          | UNIQUE, NOT NULL, FOREIGN KEY (users.id) | Links to the `users` table.                  |
| `student_id_num`| VARCHAR(50)  | UNIQUE, NULLABLE   | Optional student ID number.                  |
| `year_grade`    | VARCHAR(50)  | NULLABLE           | Student's academic year or grade level.      |
| `major_focus`   | VARCHAR(255) | NULLABLE           | Student's major or focus area.               |
| `profile_photo_url` | VARCHAR(255) | NULLABLE           | URL or path to student's profile photo.      |
| `bio`           | TEXT         | NULLABLE           | Short biography or 'About me' section.       |
| `contact_prefs` | TEXT         | NULLABLE           | Student's preferred contact methods.         |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 3. Goal Model (`goals` table)
This model will track individual goals for students.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the goal.              |
| `student_profile_id` | INT          | NOT NULL, FOREIGN KEY (student_profiles.id) | Links to the `student_profiles` table.       |
| `type`          | VARCHAR(50)  | NOT NULL           | Type of goal (e.g., 'short-term', 'long-term', 'academic', 'personal'). |
| `description`   | TEXT         | NOT NULL           | Detailed description of the goal.            |
| `priority`      | VARCHAR(20)  | NULLABLE           | Priority level (e.g., 'high', 'medium', 'low'). |
| `target_date`   | DATE         | NULLABLE           | Target completion date for the goal.         |
| `status`        | VARCHAR(50)  | DEFAULT 'pending'  | Current status of the goal (e.g., 'pending', 'in-progress', 'completed'). |
| `created_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp of goal creation.                  |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 4. Skill Model (`skills` table)
This model will store a predefined list of skills that students can possess.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the skill.             |
| `name`          | VARCHAR(100) | UNIQUE, NOT NULL   | Name of the skill (e.g., 'Python', 'Leadership'). |
| `category`      | VARCHAR(50)  | NULLABLE           | Category of the skill (e.g., 'Technical', 'Soft Skill'). |

### 5. Student Skill Model (`student_skills` table)
This pivot table links students to skills and records their proficiency levels.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the student skill entry. |
| `student_profile_id` | INT          | NOT NULL, FOREIGN KEY (student_profiles.id) | Links to the `student_profiles` table.       |
| `skill_id`      | INT          | NOT NULL, FOREIGN KEY (skills.id) | Links to the `skills` table.                 |
| `proficiency_level` | INT          | NULLABLE           | Proficiency level (e.g., 1-5 scale).         |
| `is_verified`   | BOOLEAN      | DEFAULT FALSE      | Indicates if the skill proficiency is verified. |
| `acquired_date` | DATE         | NULLABLE           | Date when the skill was acquired or updated. |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 6. Interest Model (`interests` table)
This model will store a predefined list of interests.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the interest.          |
| `name`          | VARCHAR(100) | UNIQUE, NOT NULL   | Name of the interest (e.g., 'Robotics', 'Creative Writing'). |
| `category`      | VARCHAR(50)  | NULLABLE           | Category of the interest (e.g., 'Academic', 'Extracurricular'). |

### 7. Student Interest Model (`student_interests` table)
This pivot table links students to interests.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the student interest entry. |
| `student_profile_id` | INT          | NOT NULL, FOREIGN KEY (student_profiles.id) | Links to the `student_profiles` table.       |
| `interest_id`   | INT          | NOT NULL, FOREIGN KEY (interests.id) | Links to the `interests` table.              |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 8. Survey Template Model (`survey_templates` table)
This model defines the structure of reusable survey templates.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the survey template.   |
| `teacher_id`    | INT          | NOT NULL, FOREIGN KEY (users.id) | Links to the `users` table (teacher who created it). |
| `title`         | VARCHAR(255) | NOT NULL           | Title of the survey template.                |
| `description`   | TEXT         | NULLABLE           | Description of the survey template.          |
| `created_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp of template creation.              |
| `updated_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp.                       |

### 9. Survey Question Model (`survey_questions` table)
This model defines individual questions within a survey template.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the question.          |
| `template_id`   | INT          | NOT NULL, FOREIGN KEY (survey_templates.id) | Links to the `survey_templates` table.       |
| `question_text` | TEXT         | NOT NULL           | The actual question text.                    |
| `question_type` | VARCHAR(50)  | NOT NULL           | Type of question (e.g., 'multiple_choice', 'rating', 'text'). |
| `options`       | JSON         | NULLABLE           | JSON array for multiple choice/rating options. |
| `is_required`   | BOOLEAN      | DEFAULT FALSE      | Indicates if the question is mandatory.      |
| `order`         | INT          | NOT NULL           | Display order of the question within the survey. |

### 10. Assigned Survey Model (`assigned_surveys` table)
This model tracks which surveys are assigned to which students/classes.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the assigned survey.   |
| `template_id`   | INT          | NOT NULL, FOREIGN KEY (survey_templates.id) | Links to the `survey_templates` table.       |
| `student_profile_id` | INT          | NOT NULL, FOREIGN KEY (student_profiles.id) | Links to the `student_profiles` table.       |
| `assigned_by_teacher_id` | INT          | NOT NULL, FOREIGN KEY (users.id) | Links to the `users` table (teacher who assigned it). |
| `assigned_at`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp when the survey was assigned.      |
| `open_date`     | DATETIME     | NULLABLE           | Date/time when the survey becomes available. |
| `close_date`    | DATETIME     | NULLABLE           | Date/time when the survey closes.            |
| `completion_status` | VARCHAR(50)  | DEFAULT 'pending'  | Status (e.g., 'pending', 'in-progress', 'completed'). |
| `completed_at`  | TIMESTAMP    | NULLABLE           | Timestamp when the survey was completed.     |

### 11. Survey Response Model (`survey_responses` table)
This model stores individual student responses to survey questions.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the response.          |
| `assigned_survey_id` | INT          | NOT NULL, FOREIGN KEY (assigned_surveys.id) | Links to the `assigned_surveys` table.       |
| `question_id`   | INT          | NOT NULL, FOREIGN KEY (survey_questions.id) | Links to the `survey_questions` table.       |
| `response_text` | TEXT         | NULLABLE           | Text response for text-based questions.      |
| `response_value`| INT          | NULLABLE           | Numeric response for rating scales.          |
| `response_json` | JSON         | NULLABLE           | JSON for multiple choice (array of selected options). |
| `responded_at`  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp when the response was recorded.    |

### 12. Uploaded Resume Model (`uploaded_resumes` table)
This model stores the metadata and binary data of uploaded resumes.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the resume entry.      |
| `student_profile_id` | INT          | NOT NULL, FOREIGN KEY (student_profiles.id) | Links to the `student_profiles` table.       |
| `file_name`     | VARCHAR(255) | NOT NULL           | Original name of the uploaded file.          |
| `file_type`     | VARCHAR(50)  | NOT NULL           | MIME type of the file (e.g., 'application/pdf'). |
| `file_size`     | INT          | NOT NULL           | Size of the file in bytes.                   |
| `file_data`     | LONGBLOB     | NOT NULL           | Binary content of the resume file.           |
| `upload_date`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp of file upload.                    |
| `file_hash`     | VARCHAR(64)  | NOT NULL           | SHA256 hash of the file content for integrity. |
| `is_primary`    | BOOLEAN      | DEFAULT FALSE      | Indicates if this is the student's primary resume. |

### 13. Parsed Resume Data Model (`parsed_resume_data` table)
This model stores structured data extracted from resumes, allowing for review and integration.

| Field Name      | Data Type    | Constraints        | Description                                  |
|-----------------|--------------|--------------------|----------------------------------------------|
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for the parsed data.       |
| `uploaded_resume_id` | INT          | UNIQUE, NOT NULL, FOREIGN KEY (uploaded_resumes.id) | Links to the `uploaded_resumes` table.       |
| `extracted_skills` | JSON         | NULLABLE           | JSON array of skills extracted.              |
| `extracted_experience` | JSON         | NULLABLE           | JSON array of work experience.               |
| `extracted_education` | JSON         | NULLABLE           | JSON array of education history.             |
| `extracted_contact` | JSON         | NULLABLE           | JSON object of contact details.              |
| `parsing_confidence` | DECIMAL(5,2) | NULLABLE           | Confidence score of the parsing process.     |
| `discrepancies` | TEXT         | NULLABLE           | Notes on discrepancies flagged for review.   |
| `parsed_at`     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Timestamp of parsing.                        |

### Relationships Overview
-   One `user` can have one `student_profile` (one-to-one).
-   One `student_profile` can have many `goals` (one-to-many).
-   `student_profiles` and `skills` have a many-to-many relationship via `student_skills`.
-   `student_profiles` and `interests` have a many-to-many relationship via `student_interests`.
-   One `user` (teacher) can create many `survey_templates` (one-to-many).
-   One `survey_template` can have many `survey_questions` (one-to-many).
-   One `assigned_survey` links a `survey_template` to a `student_profile` and the `teacher` who assigned it (many-to-many through `assigned_surveys`).
-   One `assigned_survey` can have many `survey_responses` (one-to-many).
-   One `uploaded_resume` belongs to one `student_profile` (one-to-many, as a student can upload multiple versions).
-   One `uploaded_resume` has one `parsed_resume_data` (one-to-one).

This detailed data model provides a robust foundation for the application, ensuring data integrity and supporting all required functionalities.

