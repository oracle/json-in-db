
# Overview
This readme is intended to provide steps  to run the YCSB benchmark against Oracle's AJD Service. This is a partial YCSB repository maintained by Oracle.

This benchmark repository is not supported by Oracle.

The files here should be mergable with the original YCSB project if ncessary.  This repository can be built and run standalone, Only Oracle Soda client and core YCSB libraries are included.


# Environment
To run the YCSB benchmark against AJD instances, an AJD instance needs to be provisioned. The steps to provision the AJD
instance is given below:

## AJD Instance:

*   AJD instance with 8 OCPUs and storage of 1TB needs to be provisioned. 
*   Follow the [instructions](https://docs.oracle.com/en/cloud/paas/autonomous-json-database/) to provision an AJD instance.


## Load Driver Instance:

*  For the purposes of driving the test load, a compute instance from Oracle Cloud infrastructure needs to be provisioned.
*  For some workloads of YCSB, two clients could be needed to drive AJD instance. Repeat the steps on the second instance.
    *  **VM.Standard2.24** - [Provision an instance](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm#Creating_an_Instance) within the same region as the AJD instance. 

## Configuring and Setting up YCSB

*  Clone the YCSB repo available at [Oracle SODA YCSB](https://github.com/oracle/json-in-db/tree/master/YCSB/ycsb-soda)
*  Follow the [instructions](https://github.com/oracle/json-in-db/tree/master/YCSB/ycsb-soda/README.md) to install and run YCSB

## Configurations For Running YCSB
To run the test, following settings needs to be configured. There are two loads one for large dataset and other for small dataset.

### Large Data Load Workload File

*   requestdistribution=zipfian
*   recordcount=81920000
*   operationcount=20000000
*   workload=com.yahoo.ycsb.workloads.CoreWorkload
*   readallfields=true
*   readproportion=0.95
*   updateproportion=0.05
*   scanproportion=0
*   insertproportion=0.0
*   requestdistribution=zipfian
*   fieldcount=25

### Small Data Load Workload File

*   requestdistribution=zipfian
*   recordcount=4096000
*   operationcount=20000000
*   workload=com.yahoo.ycsb.workloads.CoreWorkload
*   readallfields=true
*   readproportion=0.95
*   updateproportion=0.05
*   scanproportion=0
*   insertproportion=0.0
*   requestdistribution=zipfian
*   fieldcount=25


