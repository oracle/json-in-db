set echo on
--
select JSON_ARRAY( 
         DEPARTMENT_ID, DEPARTMENT_NAME, MANAGER_ID, LOCATION_ID
       ) DEPARTMENT
  from HR.DEPARTMENTS
 where DEPARTMENT_ID < 110
/
SELECT JSON_OBJECT( 
          'departmentId' IS d.DEPARTMENT_ID,
          'name' IS d.DEPARTMENT_NAME,
          'manager' is d.MANAGER_ID,
          'location' is d.LOCATION_ID
       ) DEPARTMENT
  from HR.DEPARTMENTS d
 where DEPARTMENT_ID < 110
 order by DEPARTMENT_ID
/
select JSON_OBJECT(OBJECT_TYPE is OBJECT_NAME, 'Status' is STATUS) 
  from USER_OBJECTS
 where ROWNUM < 10
/
SELECT JSON_OBJECT( 
          'departmentId' IS d.DEPARTMENT_ID,
          'name'         IS d.DEPARTMENT_NAME,
          'manager'      is JSON_OBJECT(
                              'employeeId'   is EMPLOYEE_ID,
                              'firstName'    is FIRST_NAME,
                              'lastName'     is LAST_NAME,
                              'emailAddress' is EMAIL
                            ),
          'location' is d.LOCATION_ID
       ) DEPT_WITH_MGR
  from HR.DEPARTMENTS d, HR.EMPLOYEES e
 where d.MANAGER_ID is not null
   and d.MANAGER_ID = e.EMPLOYEE_ID
   and d.DEPARTMENT_ID = 10
/
select JSON_OBJECT(
         'departmentId' is d.DEPARTMENT_ID,
         'name' is d. DEPARTMENT_NAME,
         'employees' is(
            select JSON_ARRAYAGG(
							       JSON_OBJECT(
                       'employeeId'   is EMPLOYEE_ID,
                       'firstName'    is FIRST_NAME,
                       'lastName'     is LAST_NAME,
                       'emailAddress' is EMAIL
                     )
                   )
              from HR.EMPLOYEES e
             where e.DEPARTMENT_ID = d.DEPARTMENT_ID 
           )
       ) DEPT_WITH_EMPLOYEES
  from HR.DEPARTMENTS d
 where DEPARTMENT_NAME = 'Executive'
/
select ID, NAME, VALUE 
  from EMPLOYEE_NAME_VALUE
 where ID < 105
 order by ID, NAME
/
select JSON_OBJECTAGG(NAME,VALUE)
  from EMPLOYEE_NAME_VALUE
 where ID < 105
 group by ID
/
quit           