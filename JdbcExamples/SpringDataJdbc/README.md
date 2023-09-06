This directory contains a Spring Data JDBC example that uses JSON in Oracle Database to persist a sub-object.

The following table:

```
  create table movie (
    id number default movieidsequence.NEXTVAL primary key,
    name varchar2(100),
    details JSON 
  )
```
Stores instances of the class [Movie](src/main/java/movie/springjdbc/model/Movie.java).
The nested class [MovieDetails](src/main/java/movie/springjdbc/model/MovieDetails.java)
is stored within the details column as JSON.

JSON-B (jakarta.json.bind) is used to automatically convert the MovieDetails instances directly to from OSON in [Config.java](src/main/java/movie/springjdbc/Config.java).