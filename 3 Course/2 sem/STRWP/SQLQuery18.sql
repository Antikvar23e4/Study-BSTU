
CREATE TABLE FACULTY (
    FACULTY      VARCHAR(10) PRIMARY KEY, -- Код факультета (PK)
    FACULTY_NAME VARCHAR(100) NULL      -- Название факультета
);
GO

-- 2. PULPIT (Кафедра)
CREATE TABLE PULPIT (
    PULPIT      VARCHAR(10) PRIMARY KEY, -- Код кафедры (PK)
    PULPIT_NAME VARCHAR(100) NULL,     -- Название кафедры
    FACULTY     VARCHAR(10) NULL,      -- Код факультета (FK)
    FOREIGN KEY (FACULTY) REFERENCES FACULTY(FACULTY) -- Связь с FACULTY
);
GO

-- 3. TEACHER (Преподаватель)
CREATE TABLE TEACHER (
    TEACHER      VARCHAR(10) PRIMARY KEY, -- Код преподавателя (PK)
    TEACHER_NAME VARCHAR(100) NULL,     -- ФИО преподавателя
    PULPIT       VARCHAR(10) NULL,      -- Код кафедры (FK)
    FOREIGN KEY (PULPIT) REFERENCES PULPIT(PULPIT) -- Связь с PULPIT
);
GO

-- 4. SUBJECT (Дисциплина)
CREATE TABLE SUBJECT (
    SUBJECT      VARCHAR(10) PRIMARY KEY, -- Код дисциплины (PK)
    SUBJECT_NAME VARCHAR(100) NULL,     -- Название дисциплины
    PULPIT       VARCHAR(10) NULL,      -- Код кафедры (FK)
    FOREIGN KEY (PULPIT) REFERENCES PULPIT(PULPIT) -- Связь с PULPIT
);
GO

-- 5. AUDITORIUM_TYPE (Тип аудитории)
CREATE TABLE AUDITORIUM_TYPE (
    AUDITORIUM_TYPE VARCHAR(10) PRIMARY KEY, -- Код типа аудитории (PK)
    AUDITORIUM_TYPENAME VARCHAR(50) NULL     -- Название типа аудитории
);
GO

-- 6. AUDITORIUM (Аудитория)
CREATE TABLE AUDITORIUM (
    AUDITORIUM          VARCHAR(10) PRIMARY KEY, -- Код аудитории (PK)
    AUDITORIUM_NAME     VARCHAR(50) NULL,      -- Название/номер аудитории
    AUDITORIUM_CAPACITY INT NULL,              -- Вместимость
    AUDITORIUM_TYPE     VARCHAR(10) NULL,      -- Код типа аудитории (FK)
    FOREIGN KEY (AUDITORIUM_TYPE) REFERENCES AUDITORIUM_TYPE(AUDITORIUM_TYPE) -- Связь с AUDITORIUM_TYPE
);



-- FACULTY
INSERT INTO FACULTY (FACULTY, FACULTY_NAME) VALUES
('ИТФ', 'Инженерно-технологический факультет'),
('ЭФ', 'Экономический факультет'),
('ГФ', 'Гуманитарный факультет');
GO

-- PULPIT
INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) VALUES
('ИСИТ', 'Информационные системы и технологии', 'ИТФ'),
('ПОИТ', 'Программное обеспечение информационных технологий', 'ИТФ'),
('ЭТ', 'Экономическая теория', 'ЭФ'),
('ФиЛ', 'Философия и логика', 'ГФ');
GO

-- TEACHER
INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) VALUES
('СМРН', 'Смирнов Алексей Петрович', 'ИСИТ'),
('ИВНВ', 'Иванова Мария Сергеевна', 'ПОИТ'),
('ПТРВ', 'Петров Василий Иванович', 'ПОИТ'),
('КЗЛВ', 'Козлова Елена Дмитриевна', 'ЭТ'),
('БЛВ', 'Белов Юрий Андреевич', 'ФиЛ'),
('ГРЧВ', 'Грачев Игорь Николаевич', 'ИСИТ');
GO

-- SUBJECT
INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) VALUES
('БД', 'Базы данных', 'ИСИТ'),
('ОАИП', 'Основы алгоритмизации и программирования', 'ПОИТ'),
('ПСП', 'Проектирование современного ПО', 'ПОИТ'),
('МЭК', 'Микроэкономика', 'ЭТ'),
('ЛОГ', 'Логика', 'ФиЛ'),
('СУБД', 'Системы управления базами данных', 'ИСИТ');
GO

-- AUDITORIUM_TYPE
INSERT INTO AUDITORIUM_TYPE (AUDITORIUM_TYPE, AUDITORIUM_TYPENAME) VALUES
('ЛК', 'Лекционная'),
('ЛБ-К', 'Лабораторная с компьютерами'),
('ПЗ', 'Практические занятия'),
('СМ', 'Семинарская');
GO

-- AUDITORIUM
INSERT INTO AUDITORIUM (AUDITORIUM, AUDITORIUM_NAME, AUDITORIUM_CAPACITY, AUDITORIUM_TYPE) VALUES
('201-4', 'Ауд. 201 (корп. 4)', 80, 'ЛК'),
('315-4', 'Ауд. 315 (корп. 4)', 15, 'ЛБ-К'),
('316-4', 'Ауд. 316 (корп. 4)', 15, 'ЛБ-К'),
('420-4', 'Ауд. 420 (корп. 4)', 30, 'ПЗ'),
('505-1', 'Ауд. 505 (корп. 1)', 120, 'ЛК'),
('111-2', 'Ауд. 111 (корп. 2)', 25, 'СМ');
GO


SELECT * FROM FACULTY;
SELECT * FROM PULPIT;
SELECT * FROM TEACHER;
SELECT * FROM SUBJECT;
SELECT * FROM AUDITORIUM_TYPE;
SELECT * FROM AUDITORIUM;
