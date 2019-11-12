
----------------------------------------------------------------------
-- 
-- These examples are intended to be run using SQLcl:
--   https://www.oracle.com/database/technologies/appdev/sqlcl.html
-- 
----------------------------------------------------------------------
-- (1) SODA commands

soda help;

soda list;

soda get wines -f {"type" : "Cabernet Sauvignon"};

-- (2) Simple SQL 
SET SQLFORMAT DEFAULT;
SET LONG 3000

INFO wines;

SELECT id, json_serialize(json_document)
FROM wines;

SELECT w.json_document.name
FROM wines w
WHERE w.json_document.price.number() < 20;

SELECT *
FROM wines NESTED json_document COLUMNS (
   "name", "type", "price" NUMBER, "notes", "region"
) jd;

SELECT count(*), avg(w.json_document.price), w.json_document.region
FROM wines w
GROUP BY w.json_document.region;


-- (3) Dataguide (automatic mapping from JSON to columns) 
SELECT json_dataguide(json_document, DBMS_JSON.FORMAT_HIERARCHICAL, DBMS_JSON.PRETTY)
FROM wines;

DECLARE 
  dataguide CLOB;
BEGIN 
  SELECT JSON_DATAGUIDE(json_document, dbms_json.FORMAT_HIERARCHICAL) INTO dataguide 
  FROM wines;

  DBMS_JSON.CREATE_VIEW('winesview', 'wines', 'json_document', dataguide);
END;
/

INFO winesview;

SELECT * FROM winesview;

-- (4) Flashback to go back in time (example assumes we first delete 'Teuer' document)
SELECT json_serialize(json_document)
FROM wines AS OF TIMESTAMP (current_timestamp - numtodsinterval(10,'minute'));

INSERT INTO wines (
  SELECT * 
  FROM wines AS OF TIMESTAMP (current_timestamp - numtodsinterval(10,'minute')) w
  WHERE w.json_document.name = 'Teuer'
);
COMMIT;






