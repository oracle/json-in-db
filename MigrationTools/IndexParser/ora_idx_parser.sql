CREATE OR REPLACE PACKAGE ora_idx_parser AS 
   FUNCTION getSQLIndexes(collection_name varchar2, index_spec varchar2) return clob;
END ora_idx_parser; 
/