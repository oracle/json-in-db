set PATH=%PATH%;g:\apache-maven-3.3.9\bin
set JAVA_HOME=C:\progra~1\java\jdk1.8.0_92
mvn install:install-file -Dfile=deploy/MovieTicketingDemo.jar -DgroupId=com.oracle.library -DartifactId=MovieTicketingDemo -Dversion=1.0-SNAPSHOT -Dpackaging=jar