CREATE DATABASE IF NOT EXISTS lms_db;
USE lms_db;

CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    role        ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE courses (
    course_id        INT AUTO_INCREMENT PRIMARY KEY,
    course_name      VARCHAR(200)   NOT NULL,
    teacher_id       INT            NOT NULL,
    enrollment_key   VARCHAR(100)   NOT NULL DEFAULT 'LMS2026',
    max_seats        INT UNSIGNED   NOT NULL DEFAULT 60,
    available_seats  INT UNSIGNED   NOT NULL DEFAULT 60,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_seats_non_negative
        CHECK (available_seats >= 0),

    CONSTRAINT chk_seats_within_max
        CHECK (available_seats <= max_seats),

    INDEX idx_courses_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE enrollments (
    student_id   INT       NOT NULL,
    course_id    INT       NOT NULL,
    enrolled_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (student_id, course_id),

    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollments_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_enrollments_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE units (
    unit_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_id  INT          NOT NULL,
    unit_name  VARCHAR(200) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_units_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_units_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE notes (
    note_id      INT AUTO_INCREMENT PRIMARY KEY,
    unit_id      INT          NOT NULL,
    file_url     VARCHAR(500) NOT NULL,
    uploaded_by  INT          NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_unit
        FOREIGN KEY (unit_id) REFERENCES units(unit_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notes_uploader
        FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_notes_unit (unit_id),
    INDEX idx_notes_uploader (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


DELIMITER $$

CREATE TRIGGER trg_after_enroll
AFTER INSERT ON enrollments
FOR EACH ROW
BEGIN
    UPDATE courses
       SET available_seats = available_seats - 1
     WHERE course_id = NEW.course_id;
END$$

CREATE TRIGGER trg_after_unenroll
AFTER DELETE ON enrollments
FOR EACH ROW
BEGIN
    UPDATE courses
       SET available_seats = available_seats + 1
     WHERE course_id = OLD.course_id;
END$$

DELIMITER ;



INSERT INTO users (name, email, password, role) VALUES
('Dr. Ananya Sharma',  'ananya@lms.dev',   '$2b$10$hashedpassword1', 'teacher'),
('Prof. Ravi Kumar',   'ravi@lms.dev',     '$2b$10$hashedpassword2', 'teacher'),
('Priya Mehta',        'priya@lms.dev',    '$2b$10$hashedpassword3', 'student'),
('Arjun Reddy',        'arjun@lms.dev',    '$2b$10$hashedpassword4', 'student'),
('Sneha Joshi',        'sneha@lms.dev',    '$2b$10$hashedpassword5', 'student'),
('Karan Singh',        'karan@lms.dev',    '$2b$10$hashedpassword6', 'student');


INSERT INTO courses (course_name, teacher_id, enrollment_key, max_seats, available_seats) VALUES
('Data Structures & Algorithms', 1, 'LMS2026', 50, 50),
('Web Development Bootcamp',     1, 'WEB101', 40, 40),
('Machine Learning Fundamentals',2, 'MLFUNDS', 35, 35);


INSERT INTO enrollments (student_id, course_id) VALUES
(3, 1),   -- Priya  → DSA
(4, 1),   -- Arjun  → DSA
(5, 2),   -- Sneha  → Web Dev
(6, 2),   -- Karan  → Web Dev
(3, 3),   -- Priya  → ML
(6, 3);   -- Karan  → ML

INSERT INTO units (course_id, unit_name) VALUES
(1, 'Arrays and Linked Lists'),
(1, 'Stacks, Queues & Hashing'),
(1, 'Trees and Graphs'),
(2, 'HTML & CSS Fundamentals'),
(2, 'JavaScript Deep Dive'),
(2, 'React & State Management'),
(3, 'Linear Regression'),
(3, 'Neural Networks Basics'),
(3, 'Model Evaluation Techniques');


INSERT INTO notes (unit_id, file_url, uploaded_by) VALUES
(1, '/uploads/notes/arrays-intro.pdf',          1),
(2, '/uploads/notes/stacks-queues-cheatsheet.pdf', 1),
(3, '/uploads/notes/graph-traversals.pdf',       1),
(4, '/uploads/notes/html-css-guide.pdf',         1),
(7, '/uploads/notes/linear-regression-101.pdf',  2),
(8, '/uploads/notes/nn-backprop-explained.pdf',  2);
