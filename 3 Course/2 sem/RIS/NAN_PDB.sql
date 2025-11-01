CREATE TABLE CITY (
    a INT PRIMARY KEY,
    city NVARCHAR2(100)
);


CREATE TABLE CARS (
    b INT PRIMARY KEY,
    mark NVARCHAR2(100)
);

INSERT INTO CITY (a, city) VALUES (1, N'Москва');
INSERT INTO CITY (a, city) VALUES (2, N'Нью-Йорк');
INSERT INTO CITY (a, city) VALUES (3, N'Токио');

INSERT INTO CARS (b, mark) VALUES (1, N'Toyota');
INSERT INTO CARS (b, mark) VALUES (2, N'Ford');
INSERT INTO CARS (b, mark) VALUES (3, N'BMW');

COMMIT;

delete  from CITY;
delete  from CARS;

CREATE DATABASE LINK VAV_db 
   CONNECT TO VAV
   IDENTIFIED BY "Password123"
   USING '26.69.212.139:1521/PDBORCL';


SELECT * FROM CITY;
SELECT * FROM employees@VAV_db;



--INSERT/INSERT,

BEGIN
    INSERT INTO city (a, city) VALUES (5, 'Ferrari');
    INSERT INTO employees@VAV_db (id, name, salary) VALUES (5, 'New Salary', 5000);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Ошибка: ' || SQLERRM);
END;


SELECT * FROM city;
SELECT * FROM employees@VAV_db;
--INSERT/UPDATE, 

rollback
BEGIN
    INSERT INTO city (a, city) VALUES (7, 'Минск');
    UPDATE employees@VAV_db SET name = 'Updated Name' WHERE id = 2;


    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Ошибка: ' || SQLERRM);
END;

SELECT * FROM city;
SELECT * FROM employees@VAV_db;

--UPDATE/INSERT.

BEGIN
    UPDATE city SET city = 'Updated City' WHERE a = 5;
    INSERT INTO employees@VAV_db (id, name, salary) VALUES (6, 'One more new salary', 5000);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Ошибка: ' || SQLERRM);
END;

SELECT * FROM city;
SELECT * FROM employees@VAV_db;

INSERT INTO CITY (a, city) VALUES (100, N'Токио');

-- Смоделируйте распределенную транзакцию, у которой нарушается ограничение целостности на стороне уделенного сервера. Продемонстрируйте выполнение и объясните результат.
SELECT * FROM employees@VAV_db;
BEGIN
    INSERT INTO employees@VAV_db (id, name, salary) VALUES (6, 'One more new salary', 5000);

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Ошибка: ' || SQLERRM);
END;

-- Смоделируйте распределенную транзакцию, которая заблокируется и будет ожидать, освобождение ресурса на удаленном сервере.
LOCK TABLE employees@VAV_db IN SHARE MODE;

BEGIN
    LOCK TABLE employees@VAV_db IN SHARE MODE;
    INSERT INTO city (a, city) VALUES (100, 'Минск');
    UPDATE employees@VAV_db SET name = 'Updated Name' WHERE id = 2;
END;

ROLLBACK;

SELECT * FROM city;
SELECT * FROM employees@VAV_db;

INSERT INTO CITY (a, city) VALUES (7, N'Москва');
INSERT INTO CITY (a, city) VALUES (8, N'Нью-Йорк');
INSERT INTO CITY (a, city) VALUES (9, N'Токио');

DELETE FROM employees@VAV_db WHERE id = 5;

DELETE FROM employees WHERE id = 5;
Commit;


INSERT INTO employees@VAV_db (id, name, salary) VALUES (5, 'OSEFSFS', 5000);
  
UPDATE employees@VAV_db SET name = 'Coll Bob' WHERE id = 5;

DELETE FROM employees@VAV_db  WHERE id = 5;

COMMIT;
