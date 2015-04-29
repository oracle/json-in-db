# JaSON

### Getting Started on building a web app using Oracle Database 12c (12.1.0.2 or later) with JSON functionality

## An introduction


The JaSON application is a template web application that extends [Flask](http://flask.pocoo.org), a lightweight microframework for Python. The demo uses Twitter Bootstrap for style, Oracle Database 12c for the database, and SQL Alchemy for easy DB connectivity.
 
JaSON was built to be a simple demo that showcases how Oracle Database 12c can be used as a JSON document store, providing a flexible and scalable development environment, even for novice web developers. In this document, we’ll walk you through how to install and setup the demo application, the general file structure, some details about the tech stack, and a summary of the JSON functionality it showcases.

## Installing Dependencies

In order to run the app on your machine you’ll need to follow these quick installation steps:
 1.	Download and configure an [Oracle Database 12c](http://www.oracle.com/technetwork/database/enterprise-edition/downloads/index.html).
 2.	If you do not already have python on your machine, you will need to download it from [here](https://www.python.org/downloads/). If you do not already                have pip installed on your machine, you will need to follow [these](https://pip.pypa.io/en/latest/installing.html) instructions.
 3.	In your command window, run;         
 
           pip install Flask
           pip install Flask-SQLAlchemy
           pip install Flask-WTF

 4.	Install bootstrap by following [these](http://getbootstrap.com/getting-started/) instructions. Place the boostrap folder under the "static" folder, in-line with the CSS files.
 5.	Clone our git repo

## Running the DB Setup Script

Once you have successfully installed all the dependencies above, you’ll need to run a SQL setup script. You can run this script however you like, but we recommend installing [SQL Developer](http://www.oracle.com/technetwork/developer-tools/sql-developer/downloads/index.html) because it has a GUI interface so you can view the data easily.

## Running the Application

Now you are ready to run the application. All you need to do is open a command window and run:

    python main.py  
    
Then open your browser and go to: 

    http://127.0.0.1:5000/

## Modules

Although it is possible for a Flask app to be contained entirely within a single Python module, this project splits different functionality into different modules to facilitate maintainability. Below is a description of each module.

-   'init.py' – Constructs the Flask app object and configures it. Imports the other modules to emulate a single-model application.
-   'config.py' – Contains the app configuration and DB connection.
-   'forms.py' – Contains WTForms Form objects for use in views and templates
-   'hooks.py' – Contains Flask and Jinja helper methods.
-   'models.py' – Contains the database model classes for SQLAlchemy.
-   'views.py' – Contains the app views.
-   'startup.sql' – Contains the sql scripts to create users, define privileges and create tables required for the app.

## Tech Stack Details

Here’s a diagram depicting the stack moving from back-end to front-end: 

![](http://i57.tinypic.com/r7orhs.png)

SQLAlchemy is a database toolkit for python that uses cx_oracle to connect to Oracle Database. This connection allows you to write SQL statements directly into the Python code. Flask is a lightweight web framework for Python with a simple but extensible core. On the front-end we’re using Bootstrap, a framework designed by Twitter for faster and easier web development. 

## Scope and Purpose

The purpose of this app is to help you learn Oracle Database, SQL, and web app building skills in Python. It’s meant to be quick and simple, using popular developer tools to showcase powerful Oracle Database 12c & JSON functionality. The app is a basic social directory template, the “Hello, World!” of web applications. It’s flexible and dynamic based on its use of JSON as a document store as opposed to a rigid schema.
 
##### JSON functionality

The application showcases several handy JSON functions, both in SQL and Python. In SQL, 
we are utilizing the check constraint “ENSURE JSON”, JSON dot notation, JSON Search Index and the method "json_textcontains()".  In Python, we are using JSON dot notation and the methods json.dump() and json.loads() to encode data into JSON. 

## Screenshots

Login Page
![](https://github.com/knordin/JaSON/blob/master/Login.png)

Edit Profile Page
![](https://github.com/knordin/JaSON/blob/master/Edit%20Profile.png)

View Profile Page
![](https://github.com/knordin/JaSON/blob/master/Profile.png)

General Search Page
![](https://github.com/knordin/JaSON/blob/master/General%20Search.png)

Advanced Search Page
![](https://github.com/knordin/JaSON/blob/master/Advanced%20Search.png)   
