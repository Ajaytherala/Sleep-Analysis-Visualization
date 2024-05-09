# CSE 578 Data Visualization Project

## About
This application visualizes the Apnea events in person sleep and display all the relevant metrics related to his sleep analysis.

## Installation
1. Install Python version >= 3.3
2. Install pip
3. Install Flask using command ``` pip install Flask ```


## Usage of Application
1. To run the application use the command ``` flask run --debug ``` or ``` python app.py ```. The debug part in the command will allow us to test the application without restarting the server for every change.

### Naming Conventions for Data Files
The Dataset Folder is organized into 2 sub-folders.

Signals Info (data files that consist of the csv files storing the patient ID, Apnea Event, Start Time, Duration of the Event, SPO2, Pulse rate during the events).

Files in this folders are named as signals_info_995_1 where 995 is the patient Id and 1 indicates the session number.

Stages Info (data files that consist of the csv files storing the patient ID, Apnea Event, Start Time, End Time, User Staging/Machine Staging).

Files in this folders are named as stage_data_995_1 where 995 is the patient Id and 1 indicates the session number.

### Instruction on Coding Standards
1. Create a new branch from develop.
2. Try to make the name of the branches and commits to be meaningful.
3. Try to create seperate section for particular HTML, CSS, JS in the current file with proper comments.
4. Post anything doubtful or confusing in the Todo list and Check Todo List once in a while.
4. After your work is done in your branch, create a pull request to merge it to develop and then merge it. 
5. After everything is merged in develop, then merge it to the master/ main branch.
