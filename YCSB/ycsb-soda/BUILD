###  Install Java and Maven

Go to http://www.oracle.com/technetwork/java/javase/downloads/index.html and download the JDK.

Or install via yum/apt-get

    sudo yum install java-devel

Download MVN from http://maven.apache.org/download.cgi

    wget http://ftp.heanet.ie/mirrors/www.apache.org/dist/maven/maven-3/3.1.1/binaries/apache-maven-3.1.1-bin.tar.gz
    sudo tar xzf apache-maven-*-bin.tar.gz -C /usr/local
    cd /usr/local
    sudo ln -s apache-maven-* maven
    sudo vi /etc/profile.d/maven.sh

Add the following to `maven.sh`

    export M2_HOME=/usr/local/maven
    export PATH=${M2_HOME}/bin:${PATH}

Modify settings.xml for maven

    mkdir -p ~/.m2
    cp /usr/local/maven/conf/settings.xml ~/.m2/.

    Add following to settings.xml under ~/.m2.
     <mirrors>
        <mirror>
          <id>centralhttps</id>
          <mirrorOf>central</mirrorOf>
          <name>Maven central https</name>
          <url>http://insecure.repo1.maven.org/maven2/</url>
        </mirror>
      </mirrors>

For more information on this modification, please visit this [blog](https://blog.sonatype.com/central-repository-moving-to-https).

Reload bash and test mvn is working.

    bash
    mvn -version

### Set Up YCSB

Download or clone the repo, cd into `ycsb-soda` and run

    mvn clean package
    mvn install dependency:copy-dependencies

### Run YCSB

To load data, modify load.sh under bin directory to include the db service name, db user name and 
password. Modify the TNS_ADMIN location to point to the db wallet directory downloaded from AJD 
instance in Step 2.

    ./bin/load.sh > outputLoad.txt

To run the workload, modify run.sh under bin directory to include db service name, db user name and password. 
Modify the TNS_ADMIN location to point to the db wallet directory downloaded from AJD instance. 
For more details refer to https://docs.oracle.com/en/cloud/paas/autonomous-database/adbsa/connect-jdbc-thin-wallet.html#GUID-5ED3C08C-1A84-4E5A-B07A-A5114951AA9E.

    ./bin/run.sh  > outputRun.txt

To build YCSB, run:

    mvn clean package
    mvn install dependency:copy-dependencies

# Running YCSB

Once `mvn clean package` succeeds, you can run `ycsb` command:

    ./bin/ycsb load basic workloads/workloada
    ./bin/ycsb run basic workloads/workloada

