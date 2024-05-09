from flask import Flask, redirect, render_template, url_for

import pandas as pd
import numpy as np
import math
import matplotlib.pyplot as plt
from scipy.stats import poisson

app = Flask(__name__)

app.config['DEBUG'] = True
app.config['TESTING'] = True

patientsAvailable = pd.DataFrame()


@app.route("/")
def hello_world():
    return redirect(url_for('sleep_analysis'))

@app.route("/get-available-patients")
def get_available_patients_data():
    global patientsAvailable
    patientsAvailableJson = patientsAvailable.to_json(orient='records')
    if patientsAvailable.empty:
        patientsAvailable = pd.read_csv("Data/patients_available/patients_visited.csv")
        patientsAvailableJson = patientsAvailable.to_json(orient='records')
    return patientsAvailableJson

@app.route("/get-patient-data/<patient_id>/sessions/<session_id>")
def get_patient_with_session_data(patient_id, session_id):
    patientSleepStagesData = pd.read_csv("Data/Sleep_Stages/stage_data_"+patient_id+"_"+session_id+".csv")
    patientSignalData = pd.read_csv("Data/Signals_Info/signals_info_"+patient_id+"_"+session_id+".csv")
    
    selected_patient_data = {
            "patient_id": patient_id,
            "session_id": session_id,
            "user_staged" : {
                "sleep_stages" : {
                    "Wake" : [],
                    "NonREM1" : [],
                    "NonREM2" : [],
                    "NonREM3" : [],
                    "REM" : []
                }
            },
            "machine_staged" : {
                "sleep_stages" : {
                    "Wake" : [],
                    "NonREM1" : [],
                    "NonREM2" : [],
                    "NonREM3" : [],
                    "REM" : []
                }
            },
            "events" : {
                "Hypopnea" : [],
                "ObstructiveApnea" : [],
                "MixedApnea" : [],
                "CentralApnea" : []
            }
        }

    # Iterate through data[1]
    for _, d in patientSleepStagesData.iterrows(): 
        
        staging_type = 'user_staged' if d['User_Staging'] is True else 'machine_staged'
        if d['Stage'] in ['Wake', 'NonREM1', 'NonREM2', 'NonREM3', 'REM']:
            selected_patient_data[staging_type]['sleep_stages'][d['Stage']].append(
                {
                    "Start": d['Start'], 
                    "End": d['End'], 
                    "Duration": (d['End'] - d['Start']),
                    "SpO2": list(map(float, d['SpO2'][1:-1].split(","))),
                    "Body" : list(map(float, d['Body'][1:-1].split(","))),
                    "Pulse_Rate" : list(map(float, d['PulseRate'][1:-1].split(","))),
                    "Tracheal" : list(map(float, d['Tracheal'][1:-1].split(","))),
                    "EEG_A1_A2" : list(map(float, d['EEG A1-A2'][1:-1].split(","))),
                    "EEG_C3_A2" : list(map(float, d['EEG C3-A2'][1:-1].split(","))),
                    "EEG_C4_A1" : list(map(float, d['EEG C4-A1'][1:-1].split(","))),
                    "Effort_THO" : list(map(float, d['Effort THO'][1:-1].split(","))),
                    "Effort_ABD" : list(map(float, d['Effort ABD'][1:-1].split(","))),
                    "Flow_Patient" : list(map(float, d['Flow Patient'][1:-1].split(","))),

                }
            )

    # Iterate through data[0]
    for _, d in patientSignalData.iterrows():
        
        if d['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
            selected_patient_data['events'][d['Event']].append(
                {
                    "Start": d['Start'],
                    "End": d['Start'] + d['Duration'], 
                    "Duration": d['Duration']
                }
            )

    return selected_patient_data


@app.route("/get-patient-data/<patient_id>")
def get_patient_data(patient_id):
    patientAvailableSessions = pd.read_csv("Data/patients_available/patients_visited.csv")
    patientAvailableSessions = patientAvailableSessions[patientAvailableSessions['Patient_ID'] == int(patient_id)]['Sessions'].values[0]
    patientAvailableSessions = patientAvailableSessions.replace("[", "").replace("]", "").split(" ")
    patientData = {"patient_id": patient_id, "sessions_data": [],"correlation_data":[],"signals_data":[]}
    sessionData = []
    
    correlation_data = pd.read_csv("Data/Correlation Data/patient_"+patient_id+"_corr.csv")
    corrData = []
    signals_selected = ['EEG A1-A2', 'EEG C3-A2', 'EEG C4-A1', 'Effort THO','Effort ABD', 'SpO2', 'Body', 'PulseRate', 'Tracheal']
    for row in correlation_data.iterrows():
        for signal in signals_selected:
            corrData.append({"x":row[1]['Unnamed: 0'],"y":signal,"value":row[1][signal]})
    
    signalsData = {}
    signals_df = pd.read_csv("Data/All/"+patient_id+"_info.csv")
    for col in signals_df.columns:
        if col in signals_selected:
            signalsData[col] = signals_df[col].tolist()
    

    for session_id in patientAvailableSessions:
        patientSleepStagesData = pd.read_csv("Data/Sleep_Stages/stage_data_"+patient_id+"_"+session_id+".csv")
        patientSignalData = pd.read_csv("Data/Signals_Info/signals_info_"+patient_id+"_"+session_id+".csv")

        # eegSignalData = pd.read_csv("Data/EEG_Data/eeg_data_"+patient_id+"_"+session_id+".csv")

        # patientData["eeg_data"] = eegSignalData["EEG A1-A2"].tolist()
        
        selected_session_Data = {
                "session_id": session_id,
                "user_staged" : {
                    "sleep_stages" : {
                        "Wake" : [],
                        "NonREM1" : [],
                        "NonREM2" : [],
                        "NonREM3" : [],
                        "REM" : []
                    }
                },
                "machine_staged" : {
                    "sleep_stages" : {
                        "Wake" : [],
                        "NonREM1" : [],
                        "NonREM2" : [],
                        "NonREM3" : [],
                        "REM" : []
                    }
                },
                "events" : {
                    "Hypopnea" : [],
                    "ObstructiveApnea" : [],
                    "MixedApnea" : [],
                    "CentralApnea" : []
                }
            }

        # Iterate through data[1]
        indexForSignalData = 0
        for _, d in patientSleepStagesData.iterrows(): 
            
            staging_type = 'user_staged' if d['User_Staging'] is True else 'machine_staged'
            if d['Stage'] in ['Wake', 'NonREM1', 'NonREM2', 'NonREM3', 'REM']:
                events = {
                    "Hypopnea" : [],
                    "ObstructiveApnea" : [],
                    "MixedApnea" : [],
                    "CentralApnea" : []
                }

                for _, signal_data in patientSignalData.iterrows():
                    if staging_type == 'user_staged':
                        if (signal_data['Start'] >= d['Start'] and signal_data['Start'] + signal_data['Duration'] <= d['End']) :
                            if signal_data['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
                                events[signal_data['Event']].append(
                                    {
                                        "Start": signal_data['Start'],
                                        "End": signal_data['Start'] + signal_data['Duration'], 
                                        "Duration": signal_data['Duration'], 
                                        "SpO2": list(map(float, filter(None, d['SpO2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Pulse_Rate": list(map(float, filter(None, d['PulseRate'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Body" : list(map(float, filter(None, d['Body'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Tracheal" : list(map(float, filter(None, d['Tracheal'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "EEG_A1_A2" : list(map(float, filter(None, d['EEG A1-A2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "EEG_C3_A2" : list(map(float, filter(None, d['EEG C3-A2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "EEG_C4_A1" : list(map(float, filter(None, d['EEG C4-A1'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Effort_THO" : list(map(float, filter(None, d['Effort THO'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Effort_ABD" : list(map(float, filter(None, d['Effort ABD'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                        "Flow_Patient" : list(map(float, filter(None, d['Flow Patient'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):(int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1)],
                                    }
                                )
                        elif (signal_data['Start'] >= d['Start'] and signal_data['Start'] <= d['End'] and signal_data['Start'] + signal_data['Duration'] >= d['End']) :
                            if signal_data['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
                                events[signal_data['Event']].append(
                                    {
                                        "Start": signal_data['Start'],
                                        "End": d['End'], 
                                        "Duration": (d['End'] - signal_data['Start']), 
                                        "SpO2": list(map(float, filter(None, d['SpO2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Pulse_Rate": list(map(float, filter(None, d['PulseRate'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Body" : list(map(float, filter(None, d['Body'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Tracheal" : list(map(float, filter(None, d['Tracheal'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "EEG_A1_A2" : list(map(float, filter(None, d['EEG A1-A2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "EEG_C3_A2" : list(map(float, filter(None, d['EEG C3-A2'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "EEG_C4_A1" : list(map(float, filter(None, d['EEG C4-A1'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Effort_THO" : list(map(float, filter(None, d['Effort THO'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Effort_ABD" : list(map(float, filter(None, d['Effort ABD'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                        "Flow_Patient" : list(map(float, filter(None, d['Flow Patient'][1:-1].split(","))))[(int(signal_data['Start']) - int(d['Start'])):],
                                    }
                                )
                        
                        elif (signal_data['Start'] <= d['Start'] and signal_data['Start'] + signal_data['Duration'] >= d['End']) :
                            if signal_data['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
                                events[signal_data['Event']].append(
                                    {
                                        "Start": d['Start'],
                                        "End": d['End'], 
                                        "Duration": (d['End'] - d['Start']), 
                                        "SpO2": list(map(float, filter(None, d['SpO2'][1:-1].split(",")))),
                                        "Pulse_Rate": list(map(float, filter(None, d['PulseRate'][1:-1].split(",")))),
                                        "Body" : list(map(float, filter(None, d['Body'][1:-1].split(",")))),
                                        "Tracheal" : list(map(float, filter(None, d['Tracheal'][1:-1].split(",")))),
                                        "EEG_A1_A2" : list(map(float, filter(None, d['EEG A1-A2'][1:-1].split(",")))),
                                        "EEG_C3_A2" : list(map(float, filter(None, d['EEG C3-A2'][1:-1].split(",")))),
                                        "EEG_C4_A1" : list(map(float, filter(None, d['EEG C4-A1'][1:-1].split(",")))),
                                        "Effort_THO" : list(map(float, filter(None, d['Effort THO'][1:-1].split(",")))),
                                        "Effort_ABD" : list(map(float, filter(None, d['Effort ABD'][1:-1].split(",")))),
                                        "Flow_Patient" : list(map(float, filter(None, d['Flow Patient'][1:-1].split(",")))),
                                    }
                                )
                        elif (signal_data['Start'] <= d['Start'] and signal_data['Start'] + signal_data['Duration'] <= d['End'] and signal_data['Start'] + signal_data['Duration'] >= d['Start']) :
                            if signal_data['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
                                events[signal_data['Event']].append(
                                    {
                                        "Start": d['Start'],
                                        "End": signal_data['Start'] + signal_data['Duration'], 
                                        "Duration": (signal_data['Start'] + signal_data['Duration'] - d['Start']),
                                        "SpO2": list(map(float, filter(None, d['SpO2'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Pulse_Rate": list(map(float, filter(None, d['PulseRate'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Body" : list(map(float, filter(None, d['Body'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Tracheal" : list(map(float, filter(None, d['Tracheal'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "EEG_A1_A2" : list(map(float, filter(None, d['EEG A1-A2'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "EEG_C3_A2" : list(map(float, filter(None, d['EEG C3-A2'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "EEG_C4_A1" : list(map(float, filter(None, d['EEG C4-A1'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Effort_THO" : list(map(float, filter(None, d['Effort THO'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Effort_ABD" : list(map(float, filter(None, d['Effort ABD'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1],
                                        "Flow_Patient" : list(map(float, filter(None, d['Flow Patient'][1:-1].split(","))))[:int(signal_data['Start']) + int(signal_data['Duration']) - int(d['Start']) + 1]

                                    }
                                )

                        elif signal_data['Start'] > d['End']:
                            break
                        elif signal_data['Start'] + signal_data['Duration'] < d['Start']:
                            continue
                        else:
                            break
                    else:
                        break

                #print("index", d.iloc[0])

                
                selected_session_Data[staging_type]['sleep_stages'][d['Stage']].append(
                    {
                        "Start": d['Start'], 
                        "End": d['End'], 
                        "Duration": (d['End'] - d['Start']),
                        "SpO2": list(map(float, filter(None, d['SpO2'][1:-1].split(",")))),
                        "Body" : list(map(float, filter(None, d['Body'][1:-1].split(",")))),
                        "Pulse_Rate" : list(map(float, filter(None, d['PulseRate'][1:-1].split(",")))),
                        "Tracheal" : list(map(float, filter(None, d['Tracheal'][1:-1].split(",")))),
                        "EEG_A1_A2" : list(map(float, filter(None, d['EEG A1-A2'][1:-1].split(",")))),
                        "EEG_C3_A2" : list(map(float, filter(None, d['EEG C3-A2'][1:-1].split(",")))),
                        "EEG_C4_A1" : list(map(float, filter(None, d['EEG C4-A1'][1:-1].split(",")))),
                        "Effort_THO" : list(map(float, filter(None, d['Effort THO'][1:-1].split(",")))),
                        "Effort_ABD" : list(map(float, filter(None, d['Effort ABD'][1:-1].split(",")))),
                        "Flow Patient" : list(map(float, filter(None, d['Flow Patient'][1:-1].split(",")))),
                        "events": events if staging_type == 'user_staged' else None
                    }
                )

        #print(selected_session_Data['user_staged']['sleep_stages'])


                
        for stage in selected_session_Data['user_staged']['sleep_stages']:
            selected_session_Data['user_staged']['sleep_stages'][stage] = sorted(selected_session_Data['user_staged']['sleep_stages'][stage], key=lambda x: x['Start'])

        # Iterate through data[0]
        for _, d in patientSignalData.iterrows():
            
            if d['Event'] in ['Hypopnea', 'ObstructiveApnea', 'MixedApnea', 'CentralApnea']:
                selected_session_Data['events'][d['Event']].append(
                    {
                        "Start": d['Start'],
                        "End": d['Start'] + d['Duration'], 
                        "Duration": d['Duration']
                    }
                )

        for event in selected_session_Data['events']:
            selected_session_Data['events'][event] = sorted(selected_session_Data['events'][event], key=lambda x: x['Start'])

        sessionData.append(selected_session_Data)
    
    patientData["sessions_data"] = sessionData
    patientData["correlation_data"] = corrData
    patientData["signals_data"] = signalsData
    parallelPlotData = {"Start":[],"Body":[],"Tracheal":[],"EEG A1-A2":[],"EEG C3-A2":[],"EEG C4-A1":[],"Effort ABD":[],"Effort THO":[],"SpO2":[]}
    stageData = sessionData[0]["user_staged"]["sleep_stages"]
    stageStarts = []
    for stage,stage_info in stageData.items():
        for info in stage_info:
            stageStarts.append(info["Start"])
            
    stageStarts = sorted(stageStarts)
    for start in stageStarts:
        parallelPlotData["Start"].append(start)
        for key,value in signalsData.items():
            parallelPlotData[key].append(value[start])

    patientData["parallel_plot_data"] = parallelPlotData


    return patientData


@app.route("/sleep_analysis")
def sleep_analysis():
    return render_template("sleep_data_vis.html")



if __name__ == "__main__":
    app.run()
