create or replace package ora_idx_parser as 
   /* 
    * Method that returns a clob with the json indexes parsed in SQL form
    * requires the collection name and the json with indexes specs
    */
   function getSQLIndexes(collection_name varchar2, index_spec varchar2) return clob;
end ora_idx_parser; 
/
