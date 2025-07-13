# Comprehensive Project Plan: Student Profile & Goal Tracking System

## 1. Project Overview

This document outlines a comprehensive plan for building a web application designed to help educators track and understand their students' goals, interests, and skill levels. The system aims to be a centralized platform for collecting, organizing, and visualizing student information to enable more personalized learning experiences. The project prioritizes intuitive design, robust system architecture, and the strategic use of free and open-source resources to ensure competitiveness.

## 2. Core Requirements

The application will fulfill the following core functionalities:

-   **Student Profile Management:** Create, read, update, and delete student profiles, including basic information, academic/career goals, skills inventory, and interests.
-   **Dynamic Survey Tool:** Design and deploy customizable surveys with various question types, allowing teachers to create templates and automatically populate student profiles with responses.
-   **Resume Upload & Parsing:** Accept resume uploads (PDF, DOCX), extract relevant information using parsing techniques, auto-populate student profiles, and flag discrepancies for review.
-   **Data Visualization Dashboard:** Display class-wide statistics and individual student summaries through interactive charts and graphs.
-   **Search and Filter Capabilities:** Enable searching and filtering of students by skills, interests, or goals, with options to group students for project teams.
-   **Data Export Functionality:** Allow export of data in CSV, JSON, and PDF formats.

## 3. System Architecture

The system will adopt a three-tier monolithic architecture, built with free and open-source technologies:

-   **Frontend (Presentation Layer):** Developed with **React (JavaScript)** and styled using **Bootstrap**. It will provide a responsive and interactive user interface.
-   **Backend (Application Layer):** Powered by **Node.js with Express.js**. It will handle business logic, API routing, authentication, authorization, and data processing. Key libraries include `multer` for file uploads, `pdf-parse` and `mammoth` for resume text extraction, and `nodemailer` for email services.
-   **Database (Data Layer):** **MariaDB** will serve as the primary relational database, storing all structured data (student profiles, surveys, etc.) and unstructured data (resume binary content as BLOBs).

```mermaid
graph TD
    A[User] -->|Accesses via Web Browser| B(Frontend: React Application)
    B -->|API Requests (RESTful)| C(Backend: Node.js with Express.js)
    C -->|Database Queries| D(Database: MariaDB)
    C -- Optional --> E(Background Jobs: Redis/Bull)
    C -- Optional --> F(Email Service: Nodemailer)
```

## 4. Data Models

The database schema will include the following key entities and their relationships:

-   **`users`**: Stores user authentication details and roles (teacher, student, admin).
-   **`student_profiles`**: Core student information, linked to `users`.
-   **`goals`**: Tracks academic and career goals for each student.
-   **`skills`**: Predefined list of skills.
-   **`student_skills`**: Links students to skills with proficiency levels.
-   **`interests`**: Predefined list of interests.
-   **`student_interests`**: Links students to interests.
-   **`survey_templates`**: Defines reusable survey structures.
-   **`survey_questions`**: Individual questions within a survey template.
-   **`assigned_surveys`**: Tracks surveys assigned to students.
-   **`survey_responses`**: Stores individual student responses.
-   **`uploaded_resumes`**: Stores metadata and binary content of uploaded resumes.
-   **`parsed_resume_data`**: Stores structured data extracted from resumes.

## 5. Detailed Implementation Plan

Development will follow a phased approach, focusing on incremental delivery:

### Phase 1: Core MVP
-   **User Management:** Basic user registration, login, and role-based authentication (`express-session`, `bcrypt`).
-   **Student Profile Management:** CRUD for basic student info.
-   **Resume Upload:** Basic file upload and storage (without parsing).

### Phase 2: Enhanced Profiles & Basic Surveys
-   **Student Profile Management:** Add goals, skills, and interests.
-   **Survey System:** Basic survey creation, assignment, and response collection.

### Phase 3: Resume Parsing & Basic Analytics
-   **Resume Parsing:** Implement resume parsing (`pdf-parse`, `mammoth`, custom logic) and integration.
-   **Data Visualization:** Develop class dashboard with basic charts (`recharts`).
-   **Search & Filter:** Implement core search and filter functionalities.

### Phase 4: Advanced Features & Refinements
-   **Survey System:** Dynamic question types, conditional logic, templates.
-   **Data Export:** CSV, JSON, and PDF export (`csv-stringify`, `pdfkit`/`html-pdf`).
-   **UI/UX Improvements:** Refine interfaces.
-   **Security Hardening:** Conduct audits and implement additional measures.

## 6. Alternatives for Paid APIs and Future Upgrade Paths

The project is designed to be fully functional with free and open-source tools. However, for future enhancements or increased scale, paid API alternatives and their integration strategies are considered:

-   **Resume Parsing (Advanced NLP/AI):**
    -   **Free Alternatives:** Custom Node.js logic, potentially integrating with Python-based NLP libraries like SpaCy for more advanced entity recognition.
    -   **Paid Alternatives:** HireAbility, Sovren, Textkernel.
    -   **Integration:** Use environment variables for API keys, encapsulate API calls in dedicated services, implement robust error handling and fallbacks to free alternatives.
-   **Email Service (Transactional Emails):**
    -   **Free Alternatives:** Nodemailer with SMTP (e.g., self-hosted).
    -   **Paid Alternatives:** SendGrid, Mailgun, Amazon SES.
    -   **Integration:** Configure Nodemailer to use the paid service's SMTP or API transport.
-   **Advanced Analytics & Reporting:**
    -   **Free Alternatives:** Google Analytics 4, custom backend aggregation with `recharts`.
    -   **Paid Alternatives:** Mixpanel, Amplitude, Google Analytics 360.
    -   **Integration:** Integrate client-side SDKs for tracking, or use server-side APIs for data export.
-   **Cloud Storage (for Files):**
    -   **Free Alternatives:** MariaDB BLOB storage (current approach), MinIO (self-hostable S3-compatible).
    -   **Paid Alternatives:** Amazon S3, Google Cloud Storage, Azure Blob Storage.
    -   **Integration:** Modify backend logic to upload files to cloud storage and store URLs in the database; use cloud provider SDKs.

## 7. Documentation and Workflow

All project activities and decisions will be meticulously documented. Key documents include:

-   **`CLAUDE.md`**: Guidelines for AI assistant interaction.
-   **`requirements.md`**: Detailed functional and non-functional requirements.
-   **`tech-stack.md`**: Overview of simplified and full technology stacks.
-   **`architecture.md`**: System architecture and data models.
-   **`implementation_plan.md`**: Detailed breakdown of tasks and technology choices.
-   **`tasks/todo.md`**: Iterative task list for development.
-   **`docs/activity.md`**: Log of all project actions and decisions.

**Recommended Development Workflow:**
-   **Local Development:** Docker Compose for consistent environments.
-   **Version Control:** Git with feature branches and pull requests on GitHub.
-   **Testing:** Unit, integration, and end-to-end testing (Jest, React Testing Library, Cypress).
-   **Deployment:** Incremental deployments to staging and production environments.

This comprehensive plan provides a clear roadmap for developing a high-quality, competitive student information tracking system, emphasizing intuitive design, robust engineering, and cost-effective solutions.

