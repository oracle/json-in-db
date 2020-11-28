# Introduction
MuSprint-client module hosts the frontend server components using React.js. The response from these modules can be consumed by a web client.

# Deployment Instructions
You can deploy the frontend server independently using docker container.

## 1 Docker Deployment

**Note:** Make sure you have [docker](https://docs.docker.com/get-docker/) installed. 
~~~~
$ docker -v
Docker version 19.03.13, build 4484c46d9d
~~~~

### 1.1 Build Client docker image  
  Change directory to `client` and build image:
  ~~~~
  $ cd <>/json-in-db/MuSprint/client
  $ docker build -t musprint-client:1.0.0 .
  ~~~~

### 1.2 Run Client app  
  ~~~~
  $ docker run -it \
               -p 3000:3000 \
               musprint-client:1.0.0
  ~~~~
  This will start a listener on port 3000.  
  Note:  
  * If you wish to deploy the backend server (Step 3.1) on a machinie that you would like to access using its IP address, set the environment variable **`REACT_APP_MUSTORIES_SERVICE_URL`** while running the client app. For example:
  ~~~~
  $ docker run -it \
               -p 3000:3000 \
               --env REACT_APP_MUSTORIES_SERVICE_URL=http://<your_ip_address>:5000/stories/ \
               musprint-client:1.0.0
  ~~~~


The application is ready to view on a browser:  http://localhost:3000/