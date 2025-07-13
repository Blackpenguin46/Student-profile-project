# Detailed Implementation Plan

## Overview
This document provides a detailed implementation plan for building the Student Profile & Goal Tracking System, breaking down core requirements into actionable tasks. It focuses on leveraging free and open-source resources, aligning with the project's goal of winning a competition through intuitive ideas and system design.

## Core Requirements Breakdown and Implementation Tasks

### 1. Student Profile Management
**Goal:** Enable creation, reading, updating, and deletion of student profiles with comprehensive information.

**Backend Tasks:**
-   **API Endpoints:** Develop RESTful API endpoints for CRUD operations on `student_profiles`, `goals`, `student_skills`, and `student_interests`.
    -   `POST /api/students`: Create new student profile.
    -   `GET /api/students/:id`: Retrieve a specific student profile.
    -   `PUT /api/students/:id`: Update an existing student profile.
    -   `DELETE /api/students/:id`: Delete a student profile.
    -   Similar endpoints for goals, skills, and interests associated with a student.
-   **Database Interaction:** Implement logic to interact with the MariaDB database using raw SQL queries for the `users`, `student_profiles`, `goals`, `skills`, `student_skills`, `interests`, and `student_interests` tables.
-   **Validation:** Implement server-side validation for all incoming data to ensure data integrity and security.
-   **Authentication & Authorization:** Ensure only authorized users (e.g., teachers, students for their own profiles) can perform operations.

**Frontend Tasks:**
-   **Profile Forms:** Develop responsive forms for creating and editing student profiles, including fields for basic information, goals, skills, and interests.
-   **Profile Display:** Create UI components to display individual student profiles, showing all relevant information in a clear and organized manner.
-   **Dynamic Fields:** Implement dynamic addition/removal of goal, skill, and interest entries within the forms.
-   **API Integration:** Integrate frontend forms and display components with the backend API endpoints.
-   **Error Handling:** Implement client-side validation and display user-friendly error messages.

### 2. Dynamic Survey Tool
**Goal:** Allow teachers to design, deploy, and collect responses from customizable surveys.

**Backend Tasks:**
-   **API Endpoints:**
    -   `POST /api/survey-templates`: Create new survey template.
    -   `GET /api/survey-templates/:id`: Retrieve survey template details.
    -   `PUT /api/survey-templates/:id`: Update survey template.
    -   `DELETE /api/survey-templates/:id`: Delete survey template.
    -   `POST /api/survey-templates/:id/questions`: Add questions to a template.
    -   `POST /api/assigned-surveys`: Assign surveys to students.
    -   `POST /api/survey-responses`: Submit survey responses.
-   **Database Interaction:** Interact with `survey_templates`, `survey_questions`, `assigned_surveys`, and `survey_responses` tables.
-   **Question Logic:** Implement backend logic to handle different question types and conditional questions.
-   **Completion Tracking:** Develop logic to track survey completion status and send reminders.

**Frontend Tasks:**
-   **Survey Builder UI:** Create an intuitive drag-and-drop interface for teachers to build survey templates. This will involve components for different question types (multiple choice, rating, text, etc.) and options for making questions required or optional.
-   **Template Management:** Develop UI for teachers to manage (create, edit, delete) survey templates.
-   **Survey Assignment:** Create an interface for teachers to assign surveys to specific students or classes, set open/close dates, and send email notifications.
-   **Student Survey Interface:** Design a user-friendly interface for students to complete assigned surveys, including auto-save functionality and progress tracking.
-   **Response Display:** Basic display of survey responses for teachers.

### 3. Resume Upload & Parsing
**Goal:** Accept resume uploads, extract relevant information, and integrate with student profiles.

**Backend Tasks:**
-   **API Endpoint:** `POST /api/resumes/upload`: Handle resume file uploads.
-   **File Storage:** Implement logic to store uploaded files (PDF, DOCX) as BLOBs in the `uploaded_resumes` table.
-   **Resume Parsing Service:**
    -   Integrate `multer` for handling file uploads.
    -   Use `pdf-parse` for extracting text from PDF files.
    -   Use `mammoth` for converting DOCX to HTML and then extracting text.
    -   Develop custom parsing logic to identify and extract key information (skills, experience, education, contact details) from the extracted text.
    -   Store parsed data in the `parsed_resume_data` table.
-   **Data Integration & Discrepancy Flagging:** Implement logic to map parsed data to student profile fields and flag discrepancies for review.
-   **Version Control:** Manage multiple resume versions for a student.

**Frontend Tasks:**
-   **Upload Interface:** Create a file upload component (e.g., using React Dropzone) for students to upload resumes.
-   **Resume List:** Display a list of uploaded resumes for a student, including version history.
-   **Review Interface:** Develop a UI for teachers/students to review parsed resume data, resolve discrepancies, and manually edit fields before integrating with the profile.

### 4. Data Visualization Dashboard
**Goal:** Display class-wide statistics and individual student summaries using charts and graphs.

**Backend Tasks:**
-   **API Endpoints:** Develop API endpoints to aggregate and provide data for visualizations.
    -   `GET /api/analytics/class-summary`: Summary statistics for a class.
    -   `GET /api/analytics/skill-distribution`: Data for skill distribution charts.
    -   `GET /api/analytics/goal-alignment`: Data for goal alignment visualizations.
    -   `GET /api/students/:id/summary`: Individual student summary data.
-   **Data Aggregation:** Implement efficient database queries to retrieve and aggregate data for various visualizations.

**Frontend Tasks:**
-   **Dashboard Layout:** Design a responsive dashboard layout for teachers.
-   **Chart Integration:** Use Recharts to create and display:
    -   Bar charts for skill distribution.
    -   Pie charts or similar for goal categorization.
    -   Line charts for tracking progress over time.
-   **Individual Student Summary:** Create a dedicated view for individual student summaries, incorporating relevant charts and data points.

### 5. Search and Filter Capabilities
**Goal:** Allow users to search and filter students based on various criteria.

**Backend Tasks:**
-   **API Endpoint:** `GET /api/students/search`: Implement a flexible search API endpoint.
-   **Database Queries:** Develop advanced SQL queries to search students by name, skills, interests, goals, and filter by multiple criteria (e.g., skill level ranges, year/program).
-   **Indexing:** Ensure appropriate database indexes are in place for efficient searching and filtering.

**Frontend Tasks:**
-   **Search Bar:** Implement a prominent search bar.
-   **Filter UI:** Create an intuitive filter interface with checkboxes, dropdowns, and input fields for various criteria.
-   **Dynamic Results:** Display search and filter results dynamically, with pagination.
-   **Group Formation:** Develop a UI to group students with similar profiles based on search/filter results and export group lists.

### 6. Data Export Functionality
**Goal:** Enable users to export data in various formats.

**Backend Tasks:**
-   **API Endpoints:**
    -   `GET /api/export/csv`: Export data as CSV.
    -   `GET /api/export/json`: Export data as JSON.
    -   `GET /api/export/pdf/:id`: Generate and export individual student reports as PDF.
-   **Data Formatting:** Implement logic to format data into CSV and JSON.
-   **PDF Generation:** Use a Node.js library (e.g., `pdfkit` or `html-pdf`) to generate PDF reports for individual students.

**Frontend Tasks:**
-   **Export Options:** Provide clear buttons/links for users to select export format and options (full data, filtered subsets, individual reports).

## Implementation Phases (Iterative Approach)

Following the `CLAUDE.md` guidelines, development will proceed in phases, focusing on simplicity and incremental changes:

### Phase 1: Core MVP (Minimum Viable Product)
-   **User Management:** Basic user registration (teacher/student), login, and role-based authentication.
-   **Student Profile Management:** CRUD operations for basic student information (name, email, year/grade, major).
-   **Resume Upload:** Basic file upload and storage of resumes (without parsing).

### Phase 2: Enhanced Profiles & Basic Surveys
-   **Student Profile Management:** Add goals, skills, and interests to student profiles.
-   **Survey System:** Implement basic survey creation (fixed question types), assignment, and response collection.

### Phase 3: Resume Parsing & Basic Analytics
-   **Resume Parsing:** Implement resume parsing to extract skills and experience, and integrate with student profiles.
-   **Data Visualization:** Develop the class dashboard with basic charts (skill distribution, goal categorization).
-   **Search & Filter:** Implement core search and filter functionalities.

### Phase 4: Advanced Features & Refinements
-   **Survey System:** Add dynamic question types, conditional logic, and survey templates.
-   **Data Export:** Implement CSV, JSON, and PDF export functionalities.
-   **UI/UX Improvements:** Refine user interfaces based on feedback, focusing on intuitiveness and smooth workflows.
-   **Security Hardening:** Conduct security audits and implement additional measures as needed.

This phased approach ensures a functional product at each stage, allowing for continuous testing and feedback, and aligns with the competition's evaluation criteria for functionality and code quality.



## Free Resources and Tools by Core Requirement

This section details the specific free and open-source libraries, frameworks, and tools that will be utilized for each core requirement, ensuring the project adheres to its budget-friendly and open-source principles.

### 1. Student Profile Management
-   **Frontend:**
    -   **Framework:** React (JavaScript)
    -   **UI/Styling:** Bootstrap (CSS framework) or plain CSS
    -   **Form Handling:** Native HTML forms with React state management, or a lightweight library like `react-hook-form` (if needed for complex forms, though simplicity is prioritized).
-   **Backend:**
    -   **Runtime:** Node.js
    -   **Web Framework:** Express.js
    -   **Database Interaction:** Node.js built-in modules for database connectivity (e.g., `mysql2` for MariaDB) and raw SQL queries.
-   **Database:** MariaDB

### 2. Dynamic Survey Tool
-   **Frontend:**
    -   **Framework:** React
    -   **UI/Styling:** Bootstrap for general layout and styling.
    -   **Drag-and-Drop (for Survey Builder):** `react-dnd` (React DnD) for implementing drag-and-drop functionality in the survey builder. This is a free and flexible library.
-   **Backend:**
    -   **Runtime:** Node.js
    -   **Web Framework:** Express.js
    -   **Database Interaction:** Raw SQL queries to manage survey templates, questions, assignments, and responses.
-   **Database:** MariaDB (for storing survey structure and responses).

### 3. Resume Upload & Parsing
-   **Frontend:**
    -   **File Upload Component:** `react-dropzone` for a user-friendly drag-and-drop file upload interface.
-   **Backend:**
    -   **File Upload Middleware:** `multer` for handling multipart/form-data, which is essential for file uploads in Express.js.
    -   **PDF Parsing:** `pdf-parse` (a Node.js module) for extracting text content from PDF files.
    -   **DOCX Parsing:** `mammoth` (a Node.js library) for converting `.docx` files to HTML, from which text can be extracted.
    -   **Text Processing/Extraction:** Custom Node.js logic using regular expressions or simple string manipulation to extract relevant information (skills, experience, education) from the parsed text. No paid NLP APIs will be used.
-   **Database:** MariaDB (for storing resume BLOBs and parsed data).

### 4. Data Visualization Dashboard
-   **Frontend:**
    -   **Charting Library:** `recharts` (a React charting library) for creating various charts (bar, pie, line) to visualize student data. It is open-source and highly customizable.
-   **Backend:**
    -   **Data Aggregation:** Node.js and Express.js endpoints will perform SQL queries to aggregate data from MariaDB into formats suitable for charting.
-   **Database:** MariaDB (source of all data for visualizations).

### 5. Search and Filter Capabilities
-   **Frontend:**
    -   **UI Components:** Standard React components with Bootstrap styling for search bars, filter dropdowns, and checkboxes.
-   **Backend:**
    -   **Database Queries:** MariaDB with optimized SQL queries, leveraging indexes for efficient searching and filtering across multiple tables (`student_profiles`, `student_skills`, `student_interests`, `goals`).
-   **Database:** MariaDB

### 6. Data Export Functionality
-   **Backend:**
    -   **CSV Export:** Node.js built-in modules or a lightweight CSV library (e.g., `csv-stringify`) to format data into CSV.
    -   **JSON Export:** Node.js built-in `JSON.stringify()` for JSON data export.
    -   **PDF Generation:** `pdfkit` (a Node.js PDF generation library) or `html-pdf` (converts HTML to PDF) for generating individual student reports. These are free and allow for programmatic PDF creation.
-   **Database:** MariaDB (source of data for export).

### General Infrastructure & Development Tools
-   **Version Control:** Git and GitHub (free for public and private repositories).
-   **Containerization:** Docker and Docker Compose (open-source tools for local development and deployment).
-   **Authentication:** `express-session` (middleware for Express.js) and `bcrypt` (password hashing library).
-   **Email Sending:** `nodemailer` (Node.js module for sending emails).
-   **Code Quality:** ESLint and Prettier (free and open-source tools for linting and code formatting).
-   **Testing:** Jest and React Testing Library (for unit and component testing), Cypress (for end-to-end testing) - all are open-source.

This comprehensive list ensures that all core functionalities can be implemented using readily available, free, and open-source technologies, minimizing development costs and maximizing accessibility for future contributors.



## User Authentication and Role-Based Access Control (RBAC) Plan

User authentication and role-based access control are critical for ensuring data security and proper system functionality. The plan leverages free and open-source solutions to manage user access effectively.

### 1. User Authentication
**Goal:** Securely register, log in, and manage user sessions.

**Backend Implementation:**
-   **User Registration:**
    -   When a new user (teacher or student) registers, their email and password will be collected.
    -   The password will be hashed using `bcrypt` before being stored in the `password_hash` column of the `users` table. `bcrypt` is a strong, industry-standard hashing algorithm that includes a salt to protect against rainbow table attacks.
    -   Email verification will be implemented using `nodemailer` to send a confirmation link to the user's email address. This link will contain a unique token that, when clicked, verifies the user's email and activates their account.
-   **Login System:**
    -   Users will submit their email and password to a login endpoint.
    -   The submitted password will be hashed using `bcrypt` and compared against the stored `password_hash` in the `users` table.
    -   Upon successful authentication, a session will be created using `express-session`. The session ID will be stored in a cookie on the client-side, and the session data (e.g., `user_id`, `role`) will be stored server-side (e.g., in memory or a Redis store for persistence).
    -   Session management will include mechanisms for session expiration and secure cookie settings (e.g., `HttpOnly`, `Secure`).
-   **Password Reset:**
    -   A password reset functionality will be implemented where users can request a password reset link via email.
    -   A unique, time-limited token will be generated and sent to the user's email. This token will be stored in the database (e.g., in a `password_reset_tokens` table) along with its expiration time.
    -   When the user clicks the link and provides a new password, the token will be validated, and the user's password will be updated (hashed with `bcrypt`) in the `users` table.

**Frontend Implementation:**
-   **Registration/Login Forms:** Create user-friendly forms for registration and login.
-   **Session Management:** Handle cookies for session IDs. Redirect users to login page if session expires or is invalid.
-   **Password Reset UI:** Provide an interface for requesting and completing password resets.

### 2. Role-Based Access Control (RBAC)
**Goal:** Ensure users can only access data and features permitted by their assigned role (teacher, student, administrator).

**Backend Implementation:**
-   **Role Assignment:**
    -   During user registration, the `role` field in the `users` table will be populated (e.g., teachers register with an institutional email and are assigned 'teacher' role, students receive invitation links and are assigned 'student' role).
    -   An 'admin' role can be manually assigned or through a separate admin registration process.
-   **Middleware for Authorization:**
    -   Custom Express.js middleware functions will be created to check user roles before allowing access to specific routes or resources.
    -   For example, a `requireRole('teacher')` middleware would check if `req.session.user.role` is 'teacher' before allowing access to survey creation endpoints.
    -   For student-specific data, the middleware will also verify that the `user_id` in the session matches the `student_profile_id` being accessed or modified.
-   **Database-Level Access:** While primary access control is at the application layer, database queries will also be carefully constructed to only retrieve data relevant to the authenticated user's role and permissions.

**Frontend Implementation:**
-   **Conditional Rendering:** UI components and navigation elements will be conditionally rendered based on the logged-in user's role. For example, the 

 'Survey Builder' link would only appear for teachers.
-   **Disabled Features:** Features not accessible to a specific role will be disabled or hidden.

This robust authentication and authorization plan, built on free and open-source components, will ensure the security and integrity of the student data while providing a tailored experience for each user role.



## Resume Upload and Parsing Plan

This section outlines the plan for handling resume uploads, extracting relevant information, and integrating it with student profiles. The approach prioritizes free and open-source tools.

### 1. File Upload
**Goal:** Securely accept resume files (PDF, DOCX) from students.

**Backend Implementation:**
-   **Endpoint:** A dedicated API endpoint (e.g., `POST /api/resumes/upload`) will be created to handle file uploads.
-   **Middleware:** `multer` will be used as an Express.js middleware to process `multipart/form-data` requests. It will be configured to:
    -   Store the uploaded file in memory (`multer.memoryStorage()`) temporarily, as the file content will be directly inserted into the database.
    -   Enforce a file size limit of 10MB, as specified in the requirements.
    -   Filter allowed file types (PDF, DOCX) to ensure only valid resume formats are accepted.
-   **Storage:** The binary content of the uploaded file (`req.file.buffer`) will be stored directly in the `file_data` column (LONGBLOB) of the `uploaded_resumes` table in MariaDB. Metadata such as `file_name`, `file_type`, `file_size`, `upload_date`, `student_profile_id`, and a `file_hash` (SHA256 hash of the content for integrity checking) will also be stored.
-   **Security:** Basic virus scanning (if a free, lightweight solution can be integrated without significant overhead) will be considered, though it might be a future enhancement. File storage in the database inherently benefits from database-level encryption and access controls.

**Frontend Implementation:**
-   **Upload Component:** `react-dropzone` will provide a user-friendly drag-and-drop interface for file selection. It will display upload progress and provide immediate feedback on file type/size validation.
-   **User Experience:** Clear instructions on accepted file formats and size limits will be provided to the user.

### 2. Resume Parsing
**Goal:** Extract key information (skills, experience, education, contact details) from uploaded resumes.

**Backend Implementation:**
-   **Trigger:** Parsing will be triggered automatically after a successful file upload. For long-running parsing tasks, this could be offloaded to a background job queue (e.g., using Redis and Bull) to avoid blocking the main API thread.
-   **PDF Parsing:** For PDF files (`.pdf` extension or `application/pdf` MIME type):
    -   `pdf-parse` will be used to extract raw text content from the PDF binary data.
-   **DOCX Parsing:** For DOCX files (`.docx` extension or `application/vnd.openxmlformats-officedocument.wordprocessingml.document` MIME type):
    -   `mammoth` will be used to convert the DOCX binary data into HTML. This HTML can then be parsed to extract text content.
-   **Information Extraction (Custom Logic):**
    -   Once raw text is extracted from either PDF or DOCX, custom Node.js logic will be applied to identify and extract structured information.
    -   This will involve using regular expressions and string manipulation techniques to look for common patterns associated with:
        -   **Contact Details:** Email addresses, phone numbers, LinkedIn URLs.
        -   **Education:** University names, degrees, graduation dates.
        -   **Work Experience:** Company names, job titles, dates, responsibilities (bullet points).
        -   **Skills:** Keywords matching a predefined list of skills (from the `skills` table) or common skill patterns.
    -   This custom logic will be iterative and refined over time to improve accuracy. It will not rely on paid NLP APIs.
-   **Confidence Scoring:** A simple confidence score can be assigned to extracted data based on the presence and consistency of expected patterns. This can help flag data for manual review.
-   **Storage of Parsed Data:** The extracted structured data will be stored in the `parsed_resume_data` table, linked to the `uploaded_resumes` entry. This table will store JSON objects for `extracted_skills`, `extracted_experience`, `extracted_education`, and `extracted_contact`.

### 3. Data Integration and Version Control
**Goal:** Integrate parsed data into student profiles and manage resume versions.

**Backend Implementation:**
-   **Mapping and Conflict Resolution:**
    -   After parsing, the extracted data will be mapped to the corresponding fields in the `student_profiles`, `goals`, `student_skills`, and `student_interests` tables.
    -   Logic will be implemented to identify discrepancies between newly parsed data and existing profile information. These discrepancies will be flagged (e.g., in the `discrepancies` field of `parsed_resume_data`) for manual review by a teacher or the student themselves.
    -   The system will allow for manual review and editing of parsed data before it fully updates the student profile.
-   **Version History:** The `uploaded_resumes` table will inherently support version history by allowing multiple entries for the same `student_profile_id`. The `is_primary` flag will allow students to designate their current primary resume.

**Frontend Implementation:**
-   **Review Interface:** A dedicated UI will allow teachers or students to review the parsed data side-by-side with their existing profile. They can accept, reject, or edit individual parsed fields.
-   **Version Management:** Students will be able to view a list of their uploaded resumes, set a primary resume, and potentially compare different versions.

This plan ensures a robust, free, and privacy-conscious approach to resume management, providing valuable insights from student documents without relying on external paid services.



## Data Visualization Plan

This section details the plan for creating a data visualization dashboard to display class-wide statistics and individual student summaries, using the free and open-source `recharts` library.

### 1. Dashboard Design
**Goal:** Provide teachers with an intuitive and informative dashboard to understand their class at a glance.

**Frontend Implementation:**
-   **Layout:** A responsive dashboard layout will be created using React and Bootstrap. It will feature a grid system to organize various charts and summary statistics.
-   **Components:** The dashboard will be composed of individual React components, each responsible for a specific visualization (e.g., `SkillDistributionChart`, `GoalCategorizationPie`, `ClassSummaryStats`).
-   **Interactivity:** Charts will be interactive, with tooltips providing more detailed information on hover. Filters on the dashboard will allow teachers to view data for specific time ranges or student groups.

### 2. Core Visualizations
**Goal:** Implement key charts and graphs to represent student data effectively.

**Backend Implementation:**
-   **API Endpoints:** Dedicated API endpoints will be created to provide aggregated data for each visualization. These endpoints will perform the necessary database queries to gather and format the data.
    -   `GET /api/analytics/class-summary`: Returns summary statistics (total students, profile completion rates, etc.).
    -   `GET /api/analytics/skill-distribution`: Returns data for the skill distribution chart (e.g., count of students per skill).
    -   `GET /api/analytics/goal-alignment`: Returns data for goal alignment visualizations (e.g., count of students per goal category).
    -   `GET /api/analytics/progress-over-time`: Returns time-series data for tracking progress.
-   **Data Aggregation:** Efficient SQL queries will be designed to aggregate data from various tables (`student_profiles`, `student_skills`, `goals`, etc.) to minimize the processing load on the backend and ensure fast response times.

**Frontend Implementation (using `recharts`):**
-   **Skill Distribution:** A bar chart will be used to display the distribution of skills across the class. The x-axis will represent skills, and the y-axis will represent the number of students who have each skill.
-   **Goal Categorization:** A pie chart or donut chart will visualize the breakdown of student goals by category (e.g., academic, career, personal).
-   **Interest Clouds:** A word cloud component (or a simple bar chart if a suitable free library is not found) will display the most common interests among students.
-   **Progress Over Time:** A line chart will track key metrics over time, such as the average skill proficiency level or the number of completed goals.

### 3. Individual Student Summaries
**Goal:** Provide a comprehensive visual summary for each individual student.

**Backend Implementation:**
-   **API Endpoint:** `GET /api/students/:id/summary`: This endpoint will gather all relevant data for a specific student and format it for their individual summary view.

**Frontend Implementation:**
-   **Summary View:** A dedicated page or modal will display the individual student summary. This will include:
    -   A radar chart to visualize the student's proficiency levels across different skill categories.
    -   A timeline or list view to show the student's goal progress.
    -   A summary of their interests and survey responses.

This plan ensures that the data visualization dashboard will be a powerful tool for educators, providing actionable insights into their students' profiles and progress, all built using free and open-source technologies.



## Search and Filter Capabilities Plan

This section outlines the strategy for implementing robust search and filter functionalities, allowing users to efficiently find and group students based on various criteria. The plan emphasizes leveraging MariaDB's capabilities and frontend interactivity.

### 1. Search Functionality
**Goal:** Enable quick searching of students by name, skills, interests, or goals.

**Backend Implementation:**
-   **API Endpoint:** A single, flexible API endpoint (e.g., `GET /api/students/search`) will handle search queries.
-   **Database Queries:**
    -   The backend will construct dynamic SQL queries to search across relevant fields in the `student_profiles`, `goals`, `skills`, and `interests` tables.
    -   `LIKE` operator with wildcards (`%`) will be used for partial matching on text fields (e.g., student name, skill name, goal description).
    -   `JOIN` operations will be used to link student profiles with their associated goals, skills, and interests for comprehensive searching.
    -   **Indexing:** Appropriate indexes will be created on frequently searched columns (e.g., `name` in `student_profiles`, `name` in `skills`, `description` in `goals`) to optimize query performance.

**Frontend Implementation:**
-   **Search Bar:** A prominent search bar will be integrated into the main student listing page or dashboard.
-   **Real-time Search (Optional):** Consider implementing a debounce mechanism to trigger search queries only after a short pause in user typing, reducing unnecessary API calls.
-   **Display Results:** Search results will be displayed dynamically, updating as the user types or after a search button click. Pagination will be implemented for large result sets.

### 2. Filter Functionality
**Goal:** Allow users to refine student lists based on multiple criteria.

**Backend Implementation:**
-   **API Endpoint:** The same `GET /api/students/search` endpoint can be extended to accept filter parameters.
-   **Database Queries:**
    -   Filter parameters (e.g., `skill_id`, `interest_id`, `year_grade`, `proficiency_level_min`, `proficiency_level_max`, `goal_type`) will be translated into `WHERE` clauses in SQL queries.
    -   Complex filters involving multiple skills or interests will use `JOIN` and `GROUP BY` clauses with `HAVING` conditions.
    -   **Performance:** Ensure that filter combinations are optimized with proper indexing to prevent full table scans.

**Frontend Implementation:**
-   **Filter UI:** A dedicated filter section (e.g., a sidebar or a collapsible panel) will provide various filter controls:
    -   **Dropdowns:** For single-selection filters like `year/grade level`, `major/focus area`.
    -   **Checkboxes:** For multi-selection filters like `skill categories`, `interest categories`.
    -   **Sliders/Range Inputs:** For numerical filters like `skill proficiency levels`.
    -   **Date Pickers:** For filtering by `target_date` of goals.
-   **Apply Filters:** A clear 


 button will apply selected filters, triggering an API call to the backend.
-   **Saved Filter Presets:** Users (especially teachers) will be able to save frequently used filter combinations for quick access.

### 3. Group Formation
**Goal:** Facilitate the creation of student groups based on search and filter results.

**Backend Implementation:**
-   **API Endpoint:** A new endpoint (e.g., `POST /api/groups`) will be created to save formed groups.
-   **Logic:** The backend will receive a list of `student_profile_id`s from the frontend and store them in a new `student_groups` table (or similar structure).
-   **Auto-suggestion (Future Enhancement):** While not a core MVP feature, the backend could eventually implement logic to auto-suggest groups based on complementary skills, similar interests, or matching goals, leveraging the existing data models.

**Frontend Implementation:**
-   **Selection:** Users will be able to select students from the filtered results list.
-   **Group Creation UI:** A simple interface to name the group and confirm the selected students.
-   **Export Group Lists:** Functionality to export the list of students in a formed group (e.g., to CSV).

This plan ensures that users can effectively navigate and analyze student data, making it easier to identify specific students or form targeted groups, all through efficient and free solutions.



## Data Export Functionality Plan

This section outlines the plan for enabling users to export student data in various formats (CSV, JSON, and PDF for individual reports), utilizing free and open-source tools.

### 1. CSV Export
**Goal:** Allow users to export tabular data (e.g., student lists, survey responses) in CSV format for spreadsheet analysis.

**Backend Implementation:**
-   **API Endpoint:** A dedicated API endpoint (e.g., `GET /api/export/students.csv` or `GET /api/export/survey-responses.csv`) will be created.
-   **Data Retrieval:** The backend will query the MariaDB database to retrieve the requested data (e.g., all student profiles, or filtered student profiles).
-   **CSV Formatting:** Node.js built-in modules or a lightweight, free library like `csv-stringify` will be used to convert the retrieved data into a CSV string. This involves mapping database column names to desired CSV headers and handling data types appropriately.
-   **Response Header:** The API response will set the `Content-Type` header to `text/csv` and `Content-Disposition` to `attachment; filename="data.csv"` to prompt the browser to download the file.

**Frontend Implementation:**
-   **Export Button:** A clear 


 button (e.g., "Export to CSV") will be available on relevant pages (e.g., student list, survey response view). Clicking this button will trigger a GET request to the backend export endpoint.

### 2. JSON Export
**Goal:** Provide data in JSON format for portability and integration with other systems.

**Backend Implementation:**
-   **API Endpoint:** Similar to CSV, dedicated endpoints (e.g., `GET /api/export/students.json`) will be created.
-   **Data Retrieval:** Data will be retrieved from MariaDB.
-   **JSON Formatting:** Node.js built-in `JSON.stringify()` will be used to convert the retrieved data (which will likely be an array of objects) into a JSON string.
-   **Response Header:** The API response will set the `Content-Type` header to `application/json` and `Content-Disposition` to `attachment; filename="data.json"`.

**Frontend Implementation:**
-   **Export Button:** A button (e.g., "Export to JSON") will trigger a GET request to the backend JSON export endpoint.

### 3. PDF Export (Individual Student Reports)
**Goal:** Generate and export comprehensive individual student reports in PDF format.

**Backend Implementation:**
-   **API Endpoint:** An endpoint like `GET /api/export/pdf/:studentId` will be used.
-   **Data Aggregation:** The backend will gather all relevant data for the specified student from various tables (`student_profiles`, `goals`, `student_skills`, `survey_responses`, `uploaded_resumes`, `parsed_resume_data`).
-   **PDF Generation:**
    -   A free Node.js PDF generation library such as `pdfkit` or `html-pdf` will be used.
    -   `pdfkit` allows for programmatic creation of PDFs, offering fine-grained control over layout, text, images, and charts. This would involve writing code to draw each element onto the PDF canvas.
    -   `html-pdf` allows converting HTML content directly into a PDF. This approach might be simpler if the report can be easily rendered as an HTML page first, then converted.
    -   The generated PDF will include sections for basic profile information, goals, skills inventory, interests, a summary of survey responses, and parsed resume highlights.
-   **Response Header:** The API response will set the `Content-Type` header to `application/pdf` and `Content-Disposition` to `attachment; filename="student_report_[student_name].pdf"`.

**Frontend Implementation:**
-   **Export Button:** A button (e.g., "Generate PDF Report") will be available on the individual student profile view. Clicking it will trigger a GET request to the PDF export endpoint.

### 4. Anonymized Data Option
**Goal:** Provide an option to export data with personally identifiable information (PII) removed or anonymized.

**Backend Implementation:**
-   **Logic:** For all export types (CSV, JSON, PDF), an optional parameter (e.g., `?anonymize=true`) will be supported.
-   **Data Transformation:** If `anonymize=true`, the backend will transform PII fields (e.g., `name`, `email`, `student_id_num`) into generic identifiers or remove them entirely before formatting the data for export.

This comprehensive export plan ensures that users have flexible options for accessing and utilizing their data, all built with free and open-source tools.



## Alternatives for Paid APIs and Future Upgrade Paths

This section addresses potential areas where paid APIs might be considered for advanced functionalities and provides free, open-source alternatives. It also outlines instructions on how to integrate paid APIs for future use, ensuring a clear upgrade path.

### 1. Resume Parsing (Advanced NLP/AI)

**Potential Paid API Use Case:** While the current plan uses free libraries (`pdf-parse`, `mammoth`) and custom logic for resume parsing, a paid API might offer more sophisticated Natural Language Processing (NLP) capabilities for higher accuracy, entity recognition, and semantic understanding of resume content. Examples include:
-   **HireAbility:** Offers robust resume parsing and HR data extraction.
-   **Sovren:** Provides advanced resume and job parsing with AI capabilities.
-   **Textkernel:** Specializes in HR technology, including resume parsing and matching.

**Free/Open-Source Alternatives (Current Approach):**
-   **`pdf-parse` (Node.js):** Extracts raw text from PDF documents.
-   **`mammoth` (Node.js):** Converts DOCX documents to HTML, allowing for text extraction.
-   **Custom Node.js Logic:** Regular expressions and string manipulation for extracting structured data (skills, experience, education, contact details) from the raw text. This requires careful development and ongoing refinement but is entirely free.
-   **SpaCy (Python):** While the current stack is Node.js, if a Python component were introduced for more advanced NLP, SpaCy is a free, open-source library for advanced NLP in Python. It can be used for named entity recognition (NER) to identify skills, organizations, and dates more accurately. This would require setting up a separate microservice or a Python execution environment.

**Future Integration of Paid APIs:**
1.  **API Key Management:** Store API keys securely as environment variables (e.g., in `.env` files for development, and in secure secrets management services like AWS Secrets Manager or HashiCorp Vault for production).
2.  **Dedicated Service/Module:** Create a dedicated Node.js module or service (e.g., `resumeParserService.js`) that encapsulates the logic for interacting with the external API. This promotes modularity and makes it easy to swap implementations.
3.  **API Client Library:** Use the API provider's official Node.js client library if available, or a generic HTTP client like `axios` to make requests to the API endpoints.
4.  **Error Handling and Fallback:** Implement robust error handling, including retries and graceful degradation. If the paid API fails, consider falling back to the basic text extraction and custom parsing logic.
5.  **Data Mapping:** Carefully map the output from the paid API to the `parsed_resume_data` schema, handling any discrepancies or additional fields.

```javascript
// Example of how a paid API might be integrated (conceptual)
const axios = require("axios");

async function parseResumeWithPaidAPI(fileBuffer, fileType) {
  try {
    const response = await axios.post(
      "https://api.paidresumeparser.com/v1/parse",
      fileBuffer,
      {
        headers: {
          "Content-Type": fileType,
          "Authorization": `Bearer ${process.env.PAID_API_KEY}`,
        },
      }
    );
    // Map API response to internal data model
    const parsedData = {
      extracted_skills: response.data.skills,
      extracted_experience: response.data.experience,
      // ... other fields
    };
    return parsedData;
  } catch (error) {
    console.error("Error parsing resume with paid API:", error.message);
    // Fallback to free parsing or throw error
    throw new Error("Paid API parsing failed");
  }
}
```

### 2. Email Service (Transactional Emails)

**Potential Paid API Use Case:** While Nodemailer is free, paid email services offer higher deliverability rates, analytics, template management, and better scalability for sending large volumes of transactional emails (e.g., survey reminders, email verifications). Examples include:
-   **SendGrid:** Popular for transactional and marketing emails, good deliverability.
-   **Mailgun:** Developer-friendly email API.
-   **Amazon SES (Simple Email Service):** Cost-effective and scalable email sending service from AWS.

**Free/Open-Source Alternatives (Current Approach):**
-   **Nodemailer (Node.js):** A module for Node.js applications to send emails. It can be configured with various transport options, including SMTP servers (e.g., a free Gmail SMTP for low volume, or a self-hosted Postfix server).

**Future Integration of Paid APIs:**
1.  **API Key/Credentials:** Obtain API keys or SMTP credentials from the chosen service.
2.  **Nodemailer Configuration:** Nodemailer can be easily configured to use external SMTP services or API-based transports provided by services like SendGrid or Mailgun.
3.  **Template Management:** If the paid service offers template management, design email templates within their platform and reference them by ID in your API calls.

```javascript
// Example Nodemailer configuration for SendGrid (conceptual)
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: "apikey", // SendGrid API key username
    pass: process.env.SENDGRID_API_KEY,
  },
});

async function sendEmailWithPaidService(to, subject, htmlContent) {
  try {
    await transporter.sendMail({
      from: ""noreply@yourdomain.com"",
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Email sending failed");
  }
}
```

### 3. Advanced Analytics & Reporting

**Potential Paid API Use Case:** For deeper insights, advanced user behavior analytics, A/B testing, and complex funnel analysis, paid analytics platforms offer more sophisticated tools and dashboards. Examples include:
-   **Mixpanel:** Event-based analytics, funnel analysis, user segmentation.
-   **Amplitude:** Product analytics platform.
-   **Google Analytics 360:** Enterprise-level analytics with advanced features.

**Free/Open-Source Alternatives (Current Approach):**
-   **Google Analytics 4 (GA4):** Free version of Google Analytics, provides comprehensive web analytics, event tracking, and basic reporting. Requires embedding a JavaScript snippet in the frontend.
-   **Custom Backend Aggregation:** The current plan involves aggregating data directly from MariaDB using SQL queries and displaying it with `recharts` on a custom dashboard. This is entirely free and provides control over data.

**Future Integration of Paid APIs:**
1.  **SDK Integration:** Most paid analytics platforms provide client-side (JavaScript) SDKs for easy integration into the React frontend. Server-side SDKs are also available for tracking backend events.
2.  **Event Tracking:** Define and track custom events (e.g., `survey_completed`, `resume_uploaded`, `profile_updated`) to gain granular insights into user behavior.
3.  **Data Export/API:** Many paid analytics platforms offer APIs to export raw or aggregated data, which can be pulled into custom dashboards or data warehouses if needed.

### 4. Cloud Storage (for Files)

**Potential Paid API Use Case:** While storing files in MariaDB BLOBs is chosen for simplicity and atomic transactions, for very large files or extreme scalability, dedicated cloud storage solutions are often preferred. Examples include:
-   **Amazon S3 (Simple Storage Service):** Highly scalable, durable, and cost-effective object storage.
-   **Google Cloud Storage:** Similar to S3, integrated with Google Cloud ecosystem.
-   **Azure Blob Storage:** Microsoft's object storage solution.

**Free/Open-Source Alternatives (Current Approach):**
-   **MariaDB BLOB Storage:** Stores files directly in the database. Free as part of the MariaDB installation.
-   **MinIO:** An open-source, self-hostable object storage server compatible with Amazon S3 APIs. Can be run on your own servers or in Docker containers.

**Future Integration of Paid APIs:**
1.  **SDK/Client Library:** Use the cloud provider's SDK (e.g., AWS SDK for JavaScript) to interact with the storage service.
2.  **File Upload/Download Logic:** Modify the backend file handling logic to upload files to the cloud storage and store only the file URL/path in the MariaDB database, instead of the binary data.
3.  **Pre-signed URLs:** For secure, temporary access to private files, generate pre-signed URLs from the cloud storage service.

```javascript
// Example S3 upload (conceptual)
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadFileToS3(fileBuffer, fileName, fileType) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `resumes/${fileName}`,
    Body: fileBuffer,
    ContentType: fileType,
  };
  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Returns the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to S3:", error.message);
    throw new Error("S3 upload failed");
  }
}
```

### General Principles for Future API Integration
-   **Modularity:** Always encapsulate API interactions within dedicated services or modules. This makes it easy to switch providers or implement fallback mechanisms.
-   **Configuration:** Use environment variables for API keys, endpoints, and other sensitive configurations. Avoid hardcoding.
-   **Error Handling:** Implement robust error handling, including logging, retries, and circuit breakers, to ensure the application remains stable even if an external API is unavailable.
-   **Cost Monitoring:** For paid APIs, set up cost monitoring and alerts to manage expenses effectively.
-   **Documentation:** Maintain clear documentation for all API integrations, including setup instructions, usage examples, and troubleshooting tips.

By following these guidelines, the project can start with entirely free resources and seamlessly upgrade to paid, more powerful services as needs evolve or budget allows, without requiring a complete architectural overhaul.

