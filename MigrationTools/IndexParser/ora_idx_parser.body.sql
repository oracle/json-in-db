create or replace package body ora_idx_parser as 
  mv_rewrite_number     number := 0;           
  type ktypes           is table of varchar2(1000) index by varchar2(1000);
  type matview_fields   is table of number index by varchar2(1000);
  type type_count       is table of number index by varchar2(1000);
  type pref_elem        is table of varchar2(1000);

  /*
   *  Method used to get a map with all the fields of the data
   *  and its type
   *  PATH  |  TYPE
   *  a     |  object
   */
  function create_keytypes_map(dguide_arr json_array_t)
  return ktypes
  is
    dg_stmt    clob;
    dataguide  clob;
    path       clob;
    jtype      clob;
    arr_elem   json_object_t;
    key_types  ktypes;
    count_t    type_count;
  begin
    for idx in 0 .. dguide_arr.get_size - 1
    loop
      arr_elem := treat(dguide_arr.get(idx) as json_object_t);
      path := arr_elem.get_String('o:path');
      if (path = '$' or path = '$._id') then
        continue;
      end if;
      path  := substr(path, 3);
      jtype := arr_elem.get_String('type');
      if (key_types.exists(path)) then

        if (count_t.exists(path)) then
          count_t(path) := count_t(path) + 1;
        else 
          count_t(path) := 2;
        end if;

        key_types(path) := 'multitype';
      else
        key_types(path) := jtype;
      end if;
    end loop;

    for idx in 0 .. dguide_arr.get_size - 1
    loop
      arr_elem := treat(dguide_arr.get(idx) as json_object_t);
      path := arr_elem.get_String('o:path');
      if (path = '$' or path = '$._id') then
        continue;
      end if;
      path  := substr(path, 3);
      jtype := arr_elem.get_String('type');
      if (count_t.exists(path)) then
        if (count_t(path) = 2 and jtype <> 'array' and key_types.exists(path || '[*]')) then
          if (jtype = key_types(path || '[*]')) then
            key_types(path) := 'array';
          end if;
        end if;
      end if;
    end loop;

    return key_types;
  end;

  /*
   *  Method that returns a map with all the fields that have an array
   *  and the regular fields that are parts of the compuond index
   *  1 is a field that has an array, 2 regular field part of the
   *  compund index    
   *  E.g. being  {a:1,c:1} where a is an array
   *  PATH   |  TYPE
   *  $.a    |  1
   *  $.c    |  2
   */
  function create_matview_paths_map(idx_spec json_array_t, types ktypes)
  return matview_fields
  is
    path_cursor   sys_refcursor;
    ismatview     matview_fields;
    arr_elem      json_object_t;
    v_key_obj     json_object_t;
    v_keys        json_key_list;
    v_key         clob;
    v_path        clob;
    stmt          clob;
    path          clob;
    includeInMatV boolean := false;
  begin
    for idx in 0..idx_spec.get_size - 1
    loop
      includeInMatV := false;
      arr_elem := treat(idx_spec.get(idx) as json_object_t);
      v_key_obj := arr_elem.get_Object('key');

      v_keys :=  v_key_obj.get_keys;
      for idxk in v_keys.first..v_keys.last 
      loop
        v_key := v_keys(idxk);
        stmt := 'select regexp_substr(path, ''[^.]+'', 1, level) from (select ';
        stmt := stmt || q'[q'[]' || v_key;
        stmt := stmt || ']''';
        stmt := stmt || ' path from dual) connect by level <= length(path)-length(replace(path, ''.''))+1'; 
        path := '';
        open path_cursor for stmt;
        << path_loop >>
        loop
          fetch path_cursor into v_path;
          exit when path_cursor%NOTFOUND;
          path := path || v_path;
          if (types.exists(path) and types(path) = 'array') then
            includeInMatV := true;
            ismatview('$.'||v_key) := 1;
            if (path_cursor%isopen) then
              close path_cursor;
            end if;
            exit path_loop;
          end if;
          path := path || '.';
        end loop;
      end loop;
   
      if (includeInMatV) then
        for idxk in v_keys.first..v_keys.last 
        loop
          v_key := v_keys(idxk);
          if not(ismatview.exists('$.'||v_key)) then
            ismatview('$.'||v_key) := 2;
          end if;
        end loop;
      end if;
    end loop;
    return ismatview;
  end;

  /*
   *  Method that returns a map with all the paths that are used to build 
   *  a materialized view
   *  E.g. being  {a:1,c.b.v:1} 
   *  PATH    |  IS_USED_IN_MV
   *  $.a     |  1
   *  $.c     |  1
   *  $.c.b   |  1
   *  $.c.b.v |  1
   */
  function create_matview_idx_paths_map(idx_obj json_object_t, types ktypes)
  return matview_fields
  is
    path_cursor   sys_refcursor;
    arr_elem      json_object_t;
    v_key_obj     json_object_t;
    v_keys        json_key_list;
    v_key         clob;
    v_path        clob;
    stmt          clob;
    path          clob;
    ismatview     matview_fields;
  begin

    v_keys :=  idx_obj.get_keys;
    for idx in v_keys.first..v_keys.last 
    loop
      v_key := v_keys(idx);
      stmt := 'select regexp_substr(path, ''[^.]+'', 1, level) from (select ';
      stmt := stmt || q'[q'[]' || v_key;
      stmt := stmt || ']''';
      stmt := stmt || ' path from dual) connect by level <= length(path)-length(replace(path, ''.''))+1'; 

      path := '$';
      ismatview(path) := 1;
      path := '$.';

      open path_cursor for stmt;
      loop
        fetch path_cursor into v_path;
        exit when path_cursor%NOTFOUND;
        path := path || v_path;
        ismatview(path) := 1;
        path := path || '.';
      end loop;
    end loop;
   
    return ismatview;
  end;

  /*
   *  Method that transforms dataguide results from
   *  hierarchical form to standard form
   *  {"properties" : a : {...}}. -> [{"$.a": ... }]
   */
  procedure translateHierarchicalToStandard(dg_hierarchical json_object_t, path clob, dg in out json_array_t, count_t in out type_count, is_array_type boolean default false)
  is
    prop        json_object_t;
    obj_type    json_object_t;
    arr_elem    json_object_t;
    j_tmp_obj   json_object_t;
    j_item_obj  json_object_t;
    j_keys      json_key_list;
    j_arr_type  json_array_t;
    curr_path   clob;
    curr_type   clob;
  begin
      
    obj_type := new json_object_t();
    if (dg_hierarchical.has('type')) and not(is_array_type) then 
      
      curr_type := dg_hierarchical.get_String('type');

      if not(count_t.exists(path || '#' || curr_type)) then
        obj_type.put('o:path', path);
        obj_type.put('type', curr_type);
        dg.append(obj_type);
        count_t(path || '#' || curr_type) := 1;
      end if;
    end if;

    if (dg_hierarchical.has('properties')) then
      prop := dg_hierarchical.get_Object('properties');
      j_keys := prop.get_keys;
      for kk in j_keys.first..j_keys.last loop
        if (j_keys(kk) is null) then
          continue;
        end if;
        j_tmp_obj := prop.get_Object(j_keys(kk));
        curr_path := path || '.' || j_keys(kk);
        translateHierarchicalToStandard(j_tmp_obj, curr_path, dg, count_t);
      end loop;

    end if;

    if (dg_hierarchical.has('oneOf')) then
      j_arr_type := dg_hierarchical.get_Array('oneOf');
      for idx in 0 .. j_arr_type.get_size - 1
      loop
        arr_elem := treat(j_arr_type.get(idx) as json_object_t);
        translateHierarchicalToStandard(arr_elem, path, dg, count_t);
      end loop;
    end if;  

    if (dg_hierarchical.has('items')) then
      j_item_obj := dg_hierarchical.get_Object('items');

      if (j_item_obj.has('type')) then
          curr_type := j_item_obj.get_String('type');

          if not(count_t.exists(path || '[*]' || '#' || curr_type)) then
            obj_type.put('o:path', path || '[*]' );
            obj_type.put('type', curr_type);
            dg.append(obj_type);
            count_t(path || '[*]' || '#' || curr_type) := 1;
          end if;
      end if;

      if (j_item_obj.has('properties')) then
        translateHierarchicalToStandard(j_item_obj, path, dg, count_t, true);
      end if;
    end if;
  end;

  /*
   *  Method that returns dataguide in hierarchical form
   *  this form is used to build materialized build in a
   *  recursive and simple way
   */
  function get_dataguide_hierarchical(collection_name varchar, json_data_column varchar)
  return json_object_t
  is
    dataguide_obj  json_object_t;
    dataguide_clob clob;
    stmt           clob;
  begin
    stmt := 'select json_dataguide(' || json_data_column || ', dbms_json.format_hierarchical)' ||
             ' from ' || collection_name;
    execute immediate stmt
        into dataguide_clob;
    dataguide_obj := json_object_t.parse(dataguide_clob);
    return dataguide_obj;
  end;

  /*
   *  Method that returns a string with all the double quotes
   *  inside it with a escape char \
   *  This avoids problems with paths like 'quot"es'
   */
  function escapeKeyChars(p_key clob) return clob
  is
    escaped_key clob;
    stmt        clob;
  begin
    stmt := 'select replace('|| 'q''[' || p_key || ']'',  ''"'', ''\"'') from dual';
    execute immediate stmt into escaped_key;

    return escaped_key;
  end;

  /*
   *  Method that returns a clob with all the paths used in a materialized view
   *  recursion calls over dataguide are performed, only the paths within mat_paths_idx
   *  are used. Errors are returned through error_msg
   */
  function generate_matview_paths(prop in out json_object_t, p_path varchar, mat_paths_idx matview_fields, fullpath varchar, 
                                  tabs varchar, error_msg in out clob, col_count in out number, col_map_mv in out ktypes)
  return clob
  is
    j_obj     json_object_t;
    j_tmp_obj json_object_t;
    j_obj_tp1 json_object_t;
    j_obj_tp2 json_object_t;
    j_keys    json_key_list;
    j_one_of  json_array_t;
    j_type    clob;
    n_stmt    clob;
    tmp_stmt  clob;
    col_name  clob;
    type_objs clob;
    type_1    clob;
    type_2    clob;
    arr_size  number;
    is_first  boolean;
    type_err  boolean := true;
  begin 
    
    if (error_msg is not null or prop is null) or not(mat_paths_idx.exists(fullpath)) then
      return n_stmt;
    end if;

    if (prop.has('oneOf')) then
      j_one_of := prop.get_Array('oneOf');
      arr_size := j_one_of.get_Size();
      if (arr_size = 2) then
        j_obj_tp1 := treat(j_one_of.get(0) as json_object_t);
        j_obj_tp2 := treat(j_one_of.get(1) as json_object_t);

        if (j_obj_tp1.has('type') and j_obj_tp2.has('type')) then
          type_1 := j_obj_tp1.get_String('type');
          type_2 := j_obj_tp2.get_String('type');
          if (type_1 = 'array' and type_2 <> 'array' and type_2 <> 'object') then
            j_obj_tp1 := treat(j_obj_tp1.get('items') as json_object_t);
            if (j_obj_tp1.has('type')) then
              type_1 := j_obj_tp1.get_String('type');
              if (type_1 = type_2) then
                type_err := false;
                prop := treat(j_one_of.get(0) as json_object_t);
              end if;
            end if;
          elsif (type_2 = 'array' and type_1 <> 'array' and type_1 <> 'object') then
            j_obj_tp2 := treat(j_obj_tp2.get('items') as json_object_t);
            if (j_obj_tp2.has('type')) then
              type_2 := j_obj_tp2.get_String('type');
              if (type_1 = type_2) then
                type_err := false;
                prop := treat(j_one_of.get(1) as json_object_t);
              end if;
            end if;
          end if;

          
        end if;
      end if;

      if (type_err) then
        error_msg := '/* Path ' || fullpath || ' cannot have multiple types, found in ';
        return null;
      end if;
      
    end if;

    j_type := prop.get_String('type');

    if (j_type = 'object' or (j_type is null and prop.has('properties'))) then 
      j_obj  := prop.get_Object('properties');
      j_keys := j_obj.get_keys;

      is_first := true;
      for kk in j_keys.first..j_keys.last loop
        j_tmp_obj := j_obj.get_Object(j_keys(kk));
        tmp_stmt := generate_matview_paths(j_tmp_obj, p_path || '."' || escapeKeyChars(j_keys(kk)) || '"', mat_paths_idx, fullpath || '.' || j_keys(kk), tabs, error_msg, col_count, col_map_mv);
        if (tmp_stmt is not null) then
          if not(is_first) then
            n_stmt := n_stmt || ', ';
          end if;
          is_first := false;
        end if;
        n_stmt := n_stmt || tmp_stmt;
      end loop;
    end if;
 
    if (j_type = 'array') then
      j_obj  := prop.get_Object('items');

      if (j_obj.has('type') and j_obj.has('properties')) then
        error_msg := '/* Array in path ' || fullpath || ' with mixed types cannot be indexed, found in '; 
        return null;
      end if; 
        n_stmt := n_stmt || chr(10) || tabs || 'nested path ' || q'[q'[]' || p_path; 
        n_stmt := n_stmt || '[*]]'' ' || chr(10) || tabs || chr(9) || 'columns( ';
        n_stmt := n_stmt || generate_matview_paths(j_obj, '$', mat_paths_idx,fullpath, tabs || chr(9) || chr(9), error_msg, col_count, col_map_mv);
        n_stmt := n_stmt || chr(10) || tabs || chr(9) || ')'; 
    end if;
    
    col_name := 'col' || col_count;
    col_name := '"' || col_name || '"';
    if (j_type = 'string') then
      n_stmt := n_stmt || chr(10) || tabs || col_name || ' varchar2 path ' || q'[q'[]' || p_path ;
      n_stmt := n_stmt || ']'' ';
      col_map_mv(col_name) := fullpath;
      col_count := col_count + 1;
    elsif (j_type = 'timestamp') then
      n_stmt := n_stmt || chr(10) || tabs || col_name || ' timestamp path ' || q'[q'[]' || p_path ;
      n_stmt := n_stmt || ']'' ';
      col_map_mv(col_name) := fullpath;
      col_count := col_count + 1;
    elsif (j_type = 'number' or j_type = 'double') then
      n_stmt := n_stmt || chr(10) || tabs || col_name || ' number path ' || q'[q'[]' || p_path ;
      n_stmt := n_stmt || ']'' ';
      col_map_mv(col_name) := fullpath;
      col_count := col_count + 1;
    elsif not(j_type = 'object' or j_type = 'array') then
      error_msg := '/* Type ''' || j_type || ''' in field ''' ||  fullpath || ''' not supported for materialized views, found in '; 
      return null;
    end if;
    return n_stmt;
  end;

  /*
   *  Method that returns the materialized view SQL
   *  here's the definition and the paths
   */
  function build_materialized_view(collection_name varchar, mat_paths_idx matview_fields, dataguide_obj json_object_t, 
                                   error_msg in out clob, err_count in out number, json_data_column varchar2, col_map_mv in out ktypes)
  return clob
  is
    result_output  clob;
    tabs           varchar2(1000) := chr(9) || chr(9);
    dg             json_object_t;
    col_count      number := 0;
  begin
      dg := dataguide_obj;
      result_output := 'create materialized view mv_for_query_rewrite' || mv_rewrite_number || chr(10) || 
             tabs || 'build immediate' || chr(10) ||
             tabs || 'refresh fast on statement with primary key' || chr(10) ||
             tabs || 'as select col.id, jt.*' || chr(10);
      tabs := tabs || chr(9);
      result_output := result_output || tabs || 'from ' || collection_name || ' col,' || chr(10);
      tabs := tabs || chr(9);
      result_output := result_output || tabs || 'json_table(col.' || json_data_column || ', ''$'' error on error null on empty columns(';
      result_output := result_output || ora_idx_parser.generate_matview_paths(dg, '$', mat_paths_idx, '$', tabs || chr(9), error_msg, col_count, col_map_mv);
      result_output := result_output || chr(10) || tabs || ')) jt;';

      if (error_msg is not null) then
        err_count := err_count + 1;
        result_output := error_msg;
      end if;

      return result_output;
  end;

  /*
   *  Method used to validate whether a index spec contains a parrallel arrays or not
   *  If the method finds an array that is not in the previously visited paths,
   *  then it throws an error
   *  Being {a.b.c.d:1, a.b.c:1, a.z:1} where b and z are arrays
   *  a.z is not part of the same path as a.b, hence a parallel array was detected
   */
  function is_valid_index(key_types ktypes, idx_elem json_object_t) 
  return boolean
  is
    path_cursor     sys_refcursor;
    v_idx_keys_obj  json_object_t;
    v_idx_keys_list json_key_list;
    v_key           clob;
    stmt            clob;
    path_elem       clob;
    key_path        clob;
    prefix          pref_elem;
    tmp_pref        pref_elem;
    idx_cursor      number;
    is_other_branch boolean;
  begin
    prefix := pref_elem();
    v_idx_keys_obj  := idx_elem.get_Object('key');
    v_idx_keys_list := v_idx_keys_obj.get_keys;
    for idx in v_idx_keys_list.first..v_idx_keys_list.last 
    loop
      tmp_pref := pref_elem();
      is_other_branch := false;
      v_key := v_idx_keys_list(idx);

      stmt := 'select regexp_substr(path, ''[^.]+'', 1, level) from (select ';
      stmt := stmt || q'[q'[]' || v_key;
      stmt := stmt || ']''';
      stmt := stmt || ' path from dual) connect by level <= length(path)-length(replace(path, ''.''))+1'; 
      
      key_path := '';
      idx_cursor := 1;

      open path_cursor for stmt;
      loop
        fetch path_cursor into path_elem;
        exit when path_cursor%notfound;

        if (key_path is not null) then 
          key_path := key_path || '.';
        end if;
        key_path := key_path || path_elem;
        tmp_pref.extend;
        tmp_pref(idx_cursor) := path_elem;
        
        if not(prefix.exists(idx_cursor)) then
          if (key_types.exists(key_path)) then
            if (key_types(key_path) = 'array') then
              if (is_other_branch) then
                return false;
              end if;
              prefix := tmp_pref;
            end if;
          end if;
        else
          if (prefix(idx_cursor) <> path_elem) then
            is_other_branch := true;
          end if;
          if (is_other_branch and key_types(key_path) = 'array') then
            return false;
          end if;
        end if;
        idx_cursor := idx_cursor + 1;
      end loop;
    end loop;
    return true;
  end;

  /*
   *  Method that returns the SQL form of a simple index
   *  i.e. not a TTL or multivalue one
   */
  function create_regular_idx(collection_name varchar, isunique varchar, idx_name varchar, key_types ktypes, 
                              j_keys json_object_t, idx_spec clob, err_count in out number, json_data_column varchar2,
                              parallel_idx boolean) 
  return varchar
  is
    v_keys    json_key_list;
    v_key     clob;
    jtype     clob;
    order_str     clob;
    out_stmt  clob;
  begin
    out_stmt := 'create ';
    
    if (isunique is not null and isunique = 'true') then
     out_stmt := out_stmt || 'unique ';
    end if;
  
    out_stmt := out_stmt || 'index "$ora:' || collection_name || '.' ||idx_name
                || '" on ' || collection_name || '(';
    
    v_keys :=  j_keys.get_keys;
    for k in v_keys.first..v_keys.last 
    loop
      v_key := v_keys(k);

      order_str := j_keys.get_String(v_key);
     
      jtype := key_types(v_key);

      v_key := escapeKeyChars(v_key);
      out_stmt := out_stmt || chr(10) || chr(9) || 'json_value(' || json_data_column || ', ' || q'[q'[$."]' || v_key;
      out_stmt := out_stmt || q'["]';
      case jtype
        when 'string' then
          out_stmt := out_stmt || '.stringOnly()';
        when 'number' then
          out_stmt := out_stmt || '.numberOnly()';
        when 'double' then
          out_stmt := out_stmt || '.numberOnly()';
        when 'timestamp' then
          out_stmt := out_stmt || '.dateTimeOnly()';
        when 'boolean' then
          out_stmt := out_stmt || '.booleanOnly()';
        when 'binary' then
          out_stmt := out_stmt || '.binaryOnly()';
        else
          err_count := err_count + 1;
          return '/* Unsupported type ''' || jtype || ''', found in ''' || idx_spec || ''' index spec */';
      end case;
      out_stmt := out_stmt || ']'' error on error null on empty)';
      if (order_str = '-1') then
        out_stmt := out_stmt || ' desc';
      else
        out_stmt := out_stmt || ' asc';
      end if;
      if (k <> v_keys.last) then
        out_stmt := out_stmt || ', ';
      end if;
    end loop;

    if (parallel_idx) then
      out_stmt := out_stmt || chr(10) || ', 1) parallel;';
    else
      out_stmt := out_stmt || chr(10) || ', 1);';
    end if;
    
    return out_stmt;
  end;

  /*
   *  Method that returns a PL/SQL procedure to create a TTL index using
   *  SODA
   */
  function create_ttl_idx(collection_name varchar, idx_name varchar, ttl varchar, key_types ktypes, j_keys json_object_t, idx_spec clob, err_count in out number) 
  return varchar
  is
    v_keys    json_key_list;
    v_key     clob;
    jtype     clob;
    out_stmt  clob;
    num_keys  number := 0; 
  begin
    out_stmt := 'declare' || chr(10) || chr(9) || 'col SODA_COLLECTION_T;' || chr(10) || chr(9) || 
                'status number;' || chr(10) || 'begin' || chr(10) || chr(9) || 'col := dbms_soda.open_collection('''|| 
                collection_name || ''');' || chr(10) || chr(9) || 'status := col.create_index(q''[{"name" : "$ora:' || collection_name || 
                '.' || idx_name || '", "ttl" : ' || ttl || ', "fields" : [' ;
    
    v_keys :=  j_keys.get_keys;
    for k in v_keys.first..v_keys.last 
    loop
      num_keys := num_keys + 1;
      v_key := v_keys(k);
     
      jtype := key_types(v_key);

      if (jtype <> 'timestamp') then
        err_count := err_count + 1;
        return '/* TTL indexes only supports datetime type, found in ''' || idx_spec || ''' index spec */';
      end if;

      out_stmt := out_stmt || '{"path" : "' || escapeKeyChars(v_key) || '", "datatype": "' || jtype || '"}';

      if (k <> v_keys.last) then
        out_stmt := out_stmt || ', ';
      end if;
      
    end loop;

    if (num_keys > 1) then
        err_count := err_count + 1;
        return '/* TTL indexes apply to only one single "timestamp" field , found in ''' || idx_spec || ''' index spec */';
    end if;
    out_stmt := out_stmt || ']}]'');' || chr(10) || 'end;' || chr(10) || '/';
    return out_stmt;
  end;

  /*
   *  Method that returns the SQL statement to create an index in a
   *  materialized view. This only happens if we have a multivalue one
   */
  function create_matview_idx(collection_name varchar, idx_name varchar,  j_keys json_object_t, col_map_mv ktypes, parallel_idx boolean) 
  return varchar
  is
    v_keys    json_key_list;
    v_key     clob;
    jtype     clob;
    out_stmt  clob;
    order_str clob;
    key_str   clob;
    col_count number := 0;
  begin
    out_stmt := 'create index "$ora:' || collection_name || '.' || idx_name || '" on mv_for_query_rewrite' || mv_rewrite_number || '(';
    
    v_keys :=  j_keys.get_keys;
    for k in v_keys.first..v_keys.last 
    loop
      v_key := '"' || 'col' || col_count || '"';
      key_str := col_map_mv(v_key);
      key_str := substr(key_str, 3);

      order_str := j_keys.get_String(key_str);

      col_count := col_count + 1;
      out_stmt := out_stmt || v_key;

      if (order_str = '-1') then
        out_stmt := out_stmt || ' desc';
      else
        out_stmt := out_stmt || ' asc';
      end if;

      if (k <> v_keys.last) then
        out_stmt := out_stmt || ', ';
      end if;
    end loop;
    
    if (parallel_idx) then
      out_stmt := out_stmt || ') parallel;';
    else
      out_stmt := out_stmt || ');';
    end if;

    return out_stmt;
  end;

  /*
   *  Summary of the execution, the number of index that could be parsed and
   *  the number of errors (and its cause) are displayed to the user
   */
  function generateSummary(collection_name varchar, err_count number,  total_idxs number) 
  return clob
  is
    successful_idx number;
  begin
    successful_idx := total_idxs - err_count;
    return  chr(10) || chr(10) || '/* Execution finished: ' || successful_idx || ' indexes parsed, ' || err_count || ' failures in collection ''' ||  collection_name || ''' */';
  end; 

  /*
   *  Method that gets the json data column name from collection metadata
   *  data column name could not be the same for some collections
   */
  function getDataColumnName(collection_name varchar2) return clob
  is
    col_name  clob;
    stmt      clob;
  begin
    stmt := 'select json_value(json_descriptor, ''$.contentColumn.name'') from user_soda_collections 
             where uri_name = ''' || collection_name || ''' fetch first 1 rows only';
    execute immediate stmt
        into col_name;
    return col_name;
  end;

  /*
   *  Method that gets the DB object name from collection metadata
   *  Collection name could not be the same as table/view name
   */
  function getObjectName(collection_name varchar2) return clob
  is
    obj_name  clob;
    stmt      clob;
  begin
    stmt := 'select object_name from user_soda_collections 
             where uri_name = ''' || collection_name || ''' fetch first 1 rows only';
    execute immediate stmt
        into obj_name;
    return obj_name;
  end;

  /* 
   * Method that returns a clob with the json indexes parsed in SQL form
   * requires the collection name and the json with indexes specs
   */
  function getSQLIndexes(collection_name varchar2, index_spec varchar2, parallel_idx boolean default true) return clob
  is
    key_types        ktypes;
    col_map_mv       ktypes;
    all_mat_paths    matview_fields;
    mat_paths_idx    matview_fields;
    idx_spec_elem    json_element_t;
    idx_spec         json_array_t;
    dguide_arr       json_array_t;
    arr_elem         json_object_t;
    dg_hierarchical  json_object_t;
    v_idx_keys_obj   json_object_t;
    v_idx_keys_list  json_key_list;
    v_key            clob;
    v_name           clob;
    v_unique         clob;
    v_exp            clob;
    obj_name         clob;
    final_output     clob;
    error_msg        clob;
    json_data_column clob;
    err_count        number := 0;
    is_mat_idx       boolean;
    is_valid_idx     boolean := true;
    count_t          type_count;
  begin
    -- Set Correct Format
    idx_spec_elem := json_element_t.parse(index_spec);
    if (idx_spec_elem.is_object) then
      idx_spec := json_array_t.parse('[' || index_spec || ']');
    else 
      idx_spec := Treat(idx_spec_elem as json_array_t); 
    end if;

    -- Get object name
    obj_name := getObjectName(collection_name);

    -- Get Json Data Column name
    json_data_column := getDataColumnName(collection_name);

    -- Get Dataguide in hierarchical form
    dg_hierarchical := get_dataguide_hierarchical(obj_name, json_data_column);
    
    -- Transform dataguide hierarchical into a standar
    dguide_arr := new json_array_t();
    translateHierarchicalToStandard(dg_hierarchical, '$', dguide_arr, count_t);

    -- Get a map(path, type)
    key_types := create_keytypes_map(dguide_arr);
    -- Get a map(path, number)
    all_mat_paths := create_matview_paths_map(idx_spec, key_types);

    -- Add syntax to allow index parallel creation
    if (parallel_idx) then
      final_output := 'alter session enable parallel ddl;';
    end if;

    -- Build Indexes
    << indexes_spec >>
    for idx in 0 .. idx_spec.get_size - 1
    loop
      is_mat_idx := false;
      arr_elem := treat(idx_spec.get(idx) as json_object_t);

      v_name := arr_elem.get_String('name');
      if (v_name = '_id_') then
        continue;
      end if; 

      -- Verify if there is a parallel index or not
      if (all_mat_paths.count() > 0) then
        is_valid_idx := is_valid_index(key_types, arr_elem);
      end if;
      if not (is_valid_idx) then
        final_output := final_output || chr(10) || chr(10) || '/* Parallel array detected in ''' || arr_elem.stringify() || ''' index spec */'; 
        err_count := err_count + 1;
        continue indexes_spec;
      end if;

      v_idx_keys_obj  := arr_elem.get_Object('key');
      v_idx_keys_list := v_idx_keys_obj.get_keys;

      << index_keys >>
      for idx in v_idx_keys_list.first..v_idx_keys_list.last 
      loop
        v_key := v_idx_keys_list(idx);
        if not(key_types.exists(v_key)) then
          final_output := final_output || chr(10) || chr(10) || '/* Path ''$.' || v_key || ''' does not exist, found in ''' || arr_elem.stringify() || ''' index spec */'; 
          err_count := err_count + 1;
          continue indexes_spec;
        end if;
        if (key_types(v_key) = 'multitype') then
          final_output := final_output || chr(10) || chr(10) || '/* Path ''$.' || v_key || ''' cannot have multiple types, found in ''' || arr_elem.stringify() || ''' index spec */'; 
          err_count := err_count + 1;
          continue indexes_spec;
        end if;
        if (key_types(v_key) = 'object') then
          final_output := final_output || chr(10) || chr(10) || '/* Objects cannot be indexed, found in ''' || arr_elem.stringify() || ''' index spec */'; 
          err_count := err_count + 1;
          continue indexes_spec;
        end if;
        if (key_types(v_key) = 'array') and not(key_types.exists(v_key || '[*]')) then
          final_output := final_output || chr(10) || chr(10) || '/* Arrays cannot be indexed, found in ''' || arr_elem.stringify() || ''' index spec */'; 
          err_count := err_count + 1;
          continue indexes_spec;
        end if;
        if (all_mat_paths.exists('$.'||v_key)) then
          if (all_mat_paths('$.'||v_key) = 1) then
            is_mat_idx := true;
            exit;
          end if;
        end if;
      end loop;

      if (is_mat_idx) then
        mat_paths_idx := create_matview_idx_paths_map(v_idx_keys_obj, key_types);
      end if;  
    
      if (arr_elem.has('unique')) then
        v_unique := arr_elem.get_String('unique');
      else
        v_unique := null;
      end if;

      if (arr_elem.has('expireAfterSeconds')) then
        v_exp := arr_elem.get_String('expireAfterSeconds');
      else 
        v_exp := null;
      end if;

      if (idx <> 0) then
          final_output := final_output||  chr(10) || chr(10);
      end if;
      
      if (v_exp is not null) then
        final_output := final_output || create_ttl_idx(collection_name, v_name, v_exp, key_types, v_idx_keys_obj, arr_elem.stringify, err_count);
      elsif (is_mat_idx) then
        final_output := final_output || build_materialized_view(obj_name, mat_paths_idx, dg_hierarchical, error_msg, err_count, json_data_column, col_map_mv);
        if (error_msg is not null) then
          error_msg := null;
          final_output := final_output || '''' || arr_elem.stringify() || ''' index spec */' ;
        else
          final_output := final_output || chr(10) || chr(10) || create_matview_idx(obj_name,v_name, v_idx_keys_obj, col_map_mv, parallel_idx);
          mv_rewrite_number := mv_rewrite_number + 1;
        end if;
      else
        final_output := final_output || create_regular_idx(obj_name, v_unique, v_name, key_types, v_idx_keys_obj, arr_elem.stringify, err_count, json_data_column, parallel_idx);
      end if;
    end loop;

    -- Add syntax to allow index parallel creation
    if (parallel_idx) then
      final_output := final_output || chr(10) || chr(10) || 'alter session disable parallel ddl;';
    end if;

    final_output := final_output || generateSummary(collection_name, err_count,  idx_spec.get_size);
    
    return final_output;
  end;

  
end ora_idx_parser; 
/
