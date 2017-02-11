set echo on
--
column PO_NUMBER format 99999
--
select LI.*
  from %TABLE_NAME% j,
       JSON_TABLE(
         J.PO_DOCUMENT,
         '$'
         columns(
           PO_NUMBER NUMBER(5) PATH '$.PONumber',
           NESTED PATH '$.LineItems[*]'
           columns( 
             ITEM_NUMBER NUMBER(4)                     PATH '$.ItemNumber',
             UPC_CODE    VARCHAR2(14)                  PATH '$.Part.UPCCode',
             UPDATED     VARCHAR2(38)                  PATH '$.Part.DateModified'
           )
         )
       ) LI 
 where UPC_CODE = '13131092899'
/
declare
  cursor getDocuments 
  is
  select PO_DOCUMENT
    from %TABLE_NAME% j
   where JSON_EXISTS(PO_DOCUMENT,'$?(@.LineItems.Part.UPCCode == $UPC)' passing 13131092899 as "UPC")
     for UPDATE;
   
   V_RESULT            JSON_ELEMENT_T;    
   V_DOCUMENT_OBJECT   JSON_OBJECT_T;
   V_LINEITEMS_ARRAY   JSON_ARRAY_T;
   V_LINEITEM_OBJECT   JSON_OBJECT_T;
   V_PART_OBJECT       JSON_OBJECT_T;
  
   V_NEW_DOCUMENT      VARCHAR2(4000);
begin

  for doc in getDocuments loop
    V_RESULT        := JSON_ELEMENT_T.parse(doc.PO_DOCUMENT);
    V_DOCUMENT_OBJECT := treat (V_RESULT as JSON_OBJECT_T);

    V_RESULT := V_DOCUMENT_OBJECT.get('LineItems');
    if (V_RESULT.isArray()) then
      V_LINEITEMS_ARRAY := treat ( V_RESULT as JSON_ARRAY_T);
      for i in 1..V_LINEITEMS_ARRAY.count loop
        V_RESULT := V_LINEITEMS_ARRAY.get(i-1);
        if (V_RESULT.isObject()) then
          V_LINEITEM_OBJECT := treat (V_RESULT as JSON_OBJECT_T);
          V_PART_OBJECT := treat (V_LINEITEM_OBJECT.get('Part') as JSON_OBJECT_T);
          if (V_PART_OBJECT.getString('UPCCode') = '13131092899') then
            V_PART_OBJECT.put('UPCCode','9999999999');
            V_PART_OBJECT.put('DateModified',to_char(SYSTIMESTAMP,'YYYY-MM-DD"T"HH24:MI:SSTZH:TZM'));
          end if;
        end if;
      end loop;
    end if;
    V_NEW_DOCUMENT := V_DOCUMENT_OBJECT.stringify();
    update %TABLE_NAME%
       set PO_DOCUMENT = V_NEW_DOCUMENT
     where current of getDocuments;
  end loop;
  commit;
end;
/
set long 10000
--
select count(*)
  from %TABLE_NAME% j
 where JSON_EXISTS(PO_DOCUMENT,'$?(@.LineItems.Part.UPCCode == $UPC)' passing 13131092899 as "UPC")
/
select LI.*
  from %TABLE_NAME% j,
       JSON_TABLE(
         J.PO_DOCUMENT,
         '$'
         columns(
           PO_NUMBER NUMBER(5) PATH '$.PONumber',
           NESTED PATH '$.LineItems[*]'
           columns( 
             ITEM_NUMBER NUMBER(4)                     PATH '$.ItemNumber',
             UPC_CODE    VARCHAR2(14)                  PATH '$.Part.UPCCode',
             UPDATED     VARCHAR2(38)                  PATH '$.Part.DateModified'
           )
         )
       ) LI 
 where UPC_CODE = '9999999999'
/
quit