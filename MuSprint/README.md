# Introduction
MuSprint is a web application designed to track sprint user stories on a story
board. Stories are organized into 'To Do', 'In Progress' or 'Completed'
category. Each story is assigned 'story points' to indicate the extennt of
effort required to complete it. Using the web user interface, it is possible
to switch a story from one category to another. A story can be deleted or edited
too.

# References

* SODA API  
  [https://docs.oracle.com/en/database/oracle/simple-oracle-document-access/nodejs/index.html]()

* SQL/JSON  
  [https://docs.oracle.com/en/database/oracle/oracle-database/19/adjsn/index.html]()

* Autonomous JSON Database (AJD)  
  [https://www.oracle.com/autonomous-database/autonomous-json-database/]()

# Technology Stack
Currently MuSprint application uses SERN stack. SERN stands for SODA-Express-
React-Node.js. Simple Oracle Document Access (aka SODA) is a set of NoSQL style
APIs to create and manage JSON document collections in Oracle Database. The
application runs against Autonomous JSON Database (AJD) instance.

# Prerequisites
* Install Docker  
  [https://www.docker.com/]()

* Create Oracle Cloud account  
  [https://www.oracle.com/cloud/]()

* Create Autonmous JSON Database instance  
  [https://www.oracle.com/autonomous-database/autonomous-json-database/get-started/]()

* Download Wallet  
  [https://docs.oracle.com/en/cloud/paas/autonomous-data-warehouse-cloud/user/connect-download-wallet.html]()  
  [https://blogs.oracle.com/opal/how-connect-to-oracle-autonomous-cloud-databases]()

# Deployment using Docker

