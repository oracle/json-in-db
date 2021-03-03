## Guide to run YCSB on AJD instance

This section describes how to run YCSB on AJD instance in Oracle Cloud.

### 1. Provision AJD Instance.

Provision an AJD instance in Oracle Cloud using the [instructions](https://docs.oracle.com/en/cloud/paas/autonomous-json-database/) given [here](https://docs.oracle.com/en/cloud/paas/autonomous-json-database/).
Configure the instance with 8 OCPUs and 1TB of storage. Download the wallet to access the AJD instance from a client node (in this case OCI compute node). 


### 2. Provision a compute node(s) in Oracle Cloud Infrastructure.   

Provision a compute node for driving the load in Oracle Cloud infrastructure using the [instructions](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm#Creating_an_Instance) mentioned [here](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm#Creating_an_Instance).
The compute node needs to be provisioned in the same region as the AJD instance. Configure the instance to connect to the AJD instance via JDBC by following the [instructions](https://docs.oracle.com/en/cloud/paas/autonomous-database/adbsa/connect-jdbc-thin-wallet.html#GUID-5ED3C08C-1A84-4E5A-B07A-A5114951AA9E).

### 3. Install Java and Maven

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

### 4. Set Up YCSB

Download or clone the repo, cd into `ycsb-soda` and run

    mvn clean package
    mvn install dependency:copy-dependencies

### 5. Run YCSB

To load data, modify load.sh under bin directory to include the db service name, db user name and 
password. Modify the TNS_ADMIN location to point to the db wallet directory downloaded from AJD 
instance in Step 2. Number of client threads needs to be specified.

    ./bin/load.sh > outputLoad.txt

To run the workload, modify run.sh under bin directory to include db service name, db user name and
password. Modify the TNS_ADMIN location to point to the db wallet directory downloaded from AJD 
instance in Step 2. Number of client threads needs to be specified. To achieve optimal performance, the throughput needs to be measured for varying number of threads.

    ./bin/run.sh  > outputRun.txt

The workload files can be changed to reflect the following two datasets. Modify the parameters in the workload file to reflect the appropriate dataset by setting the following parameters correpsonding to the dataset.

Large Data Load Workload File

    requestdistribution=zipfian
    recordcount=81920000
    operationcount=20000000
    workload=com.yahoo.ycsb.workloads.CoreWorkload
    readallfields=true
    readproportion=0.95
    updateproportion=0.05
    scanproportion=0
    insertproportion=0.0
    requestdistribution=zipfian
    fieldcount=25

Small Data Load Workload File

    requestdistribution=zipfian
    recordcount=4096000
    operationcount=20000000
    workload=com.yahoo.ycsb.workloads.CoreWorkload
    readallfields=true
    readproportion=0.95
    updateproportion=0.05
    scanproportion=0
    insertproportion=0.0
    requestdistribution=zipfian
    fieldcount=25

