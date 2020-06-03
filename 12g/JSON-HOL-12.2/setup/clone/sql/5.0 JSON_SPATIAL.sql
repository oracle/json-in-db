set echo on
--
set long 10000
set lines 256
set pages 50
column SOURCE_LOCATION format A41
column TARGET_LOCATION format A41
column TARGET_PROPERTIES format A41
--
desc CITY_LOT_FEATURES
--
select JSON_QUERY(FEATURE,'$' PRETTY)
  from CITY_LOT_FEATURES
 where JSON_EXISTS(
         FEATURE,
         '$?(@.properties.MAPBLKLOT == $LOT)'
         passing '0001001' as "LOT"
       )
/
select JSON_VALUE(FEATURE, '$.geometry' returning SDO_GEOMETRY  ERROR ON ERROR )
  from CITY_LOT_FEATURES
 where JSON_EXISTS(
         FEATURE,
         '$?(@.properties.MAPBLKLOT == $LOT)'
         passing '0001001' as "LOT"
       )
/
create index FEATURE_GEO_INDEX
          on CITY_LOT_FEATURES(JSON_VALUE(FEATURE, '$.geometry' returning SDO_GEOMETRY ERROR ON ERROR)) 
             indextype is mdsys.spatial_index
/
alter session set events '19170 trace name context forever, level 0x2000000'
/
select JSON_QUERY(s.FEATURE, '$.geometry')   SOURCE_LOCATION,
	     JSON_QUERY(t.FEATURE, '$.geometry')   TARGET_LOCATION,
	     JSON_QUERY(t.FEATURE, '$.properties') TARGET_PROPERTIES,
	     SDO_GEOM.SDO_DISTANCE (
	       JSON_VALUE(t.FEATURE, '$.geometry' returning SDO_GEOMETRY  ERROR ON ERROR),
	       JSON_VALUE(s.FEATURE, '$.geometry' returning SDO_GEOMETRY  ERROR ON ERROR),
	       .05
	     ) DISTANCE
  from CITY_LOT_FEATURES s, CITY_LOT_FEATURES t
 where JSON_EXISTS(
	       s.FEATURE,
	       '$?(@.properties.MAPBLKLOT == $LOT)'
	       passing '0001001' as "LOT"
	     )
   and NOT JSON_EXISTS(
         t.FEATURE,
         '$?(@.properties.MAPBLKLOT == $LOT)'
         passing '0001001' as "LOT"
       )
	 and SDO_WITHIN_DISTANCE(
	       JSON_VALUE(t.FEATURE, '$.geometry' returning SDO_GEOMETRY  ERROR ON ERROR),
	       JSON_VALUE(s.FEATURE, '$.geometry' returning SDO_GEOMETRY  ERROR ON ERROR),
	       'distance=50'
	     ) = 'TRUE'
/
quit