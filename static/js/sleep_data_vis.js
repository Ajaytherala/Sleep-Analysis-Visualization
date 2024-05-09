/* Common */
/* Intial On Load */
var selectedPatientData = null;



document.addEventListener('DOMContentLoaded', function () {


    // Common for all panels
    var svgs = d3.selectAll('svg');
    svgs.each(function() {
        var svg = d3.select(this);
        var width = svg.node().getBoundingClientRect().width;
        var height = svg.node().getBoundingClientRect().height;
        var center = [width / 2, height / 2];
        svg.append('text')
            .attr('id', 'initialText')
            .attr('x', center[0])
            .attr('y', center[1])
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('font-size', '1.5em')
            .text('Load Patient Data to Begin');
    });

    var stage_selector = document.getElementById('stage_selector');

    var stages = ["Wake","NonREM1","NonREM2","NonREM3","REM"]
    stages.forEach(function (stage) {
        var option = new Option(stage, stage);
        stage_selector.add(option);
    });

    var url = `${window.origin}/get-available-patients`;
        fetch(url, { 
                        method: 'GET', 
                        headers: new Headers({"content-type": "application/json"})
        })
        // Receive the response back
        .then(response => {
            if(response.status != 200) {
                console.log(`Looks like there was a problem. Status code: ${response.status}`)
                return;
            }
            response.json().then(data => {
                // console.log(data);
                var patientSelector = document.getElementById('Patients_selector');
                var patients = data.map(function (d) { return d.Patient_ID; });
        
                // Addition of Available Patients as Options to Patients Selector
                patients.forEach(function (patient_id) {
                    var option = new Option(patient_id, patient_id);
                    patientSelector.add(option);
                });

                //Addition of Session Selection Options
                
            })
        })
        .catch(error => {
            console.log(`Fetch error: ${error}`);
        });
});


//load selected patient data
function changePatientSelected() {
    // console.log('Patient Selected changed');
    var patientSelected = document.getElementById('Patients_selector').value;
    if (patientSelected == 'Select a Patient') {
        var svgs = d3.selectAll('svg');
        svgs.each(function() {
            var svg = d3.select(this);
            var width = svg.node().getBoundingClientRect().width;
            var height = svg.node().getBoundingClientRect().height;
            var center = [width / 2, height / 2];
            svg.append('text')
                .attr('id', 'initialText')
                .attr('x', center[0])
                .attr('y', center[1])
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr('font-size', '1.5em')
                .text('Load Patient Data to Begin');
        });
        return;
    }

    // Compute it based on the session Selector
    //var sessionSelected = 1;
    
    var url = `${window.origin}/get-patient-data/${patientSelected}`;

        document.getElementById('loading-window').style.display = 'block';
        fetch(url, { 
                        method: 'GET', 
                        headers: new Headers({"content-type": "application/json"})
        })
        // Receive the response back
        .then(response => {
            
            document.getElementById('loading-window').style.display = 'none';

            if(response.status != 200) {
                console.log(`Looks like there was a problem. Status code: ${response.status}`)
                return;
            }
            response.json().then(data => {
                console.log(data);
                selectedPatientData = data;
                drawPanel_A_Charts();
                panelB();
                drawPanelCCharts();
                drawPanelDCharts();
                drawPanelECharts();
            })
        })
        .catch(error => {
            console.log(`Fetch error: ${error}`);
        });

}



/* Panel A */

let sleepStages = ["Wake","NonREM1","NonREM2","NonREM3","REM"]
var colorScaleProvided_panelA = d3.scaleOrdinal(d3.schemeSet1)
                              .domain(sleepStages);

let selectedSession = null;
function drawPanel_A_Charts(){
    if(document.getElementById("SleepStageViewToggle").checked){
        plotHypnogram();
        plotBeltChart()
    }
    else{
        plotTimeline();
        plotBeltChart()
    }

}

function plotHypnogram(){
let hypnoData = [];
let eventData = [];
d3.select('#hypnogram_svg').selectAll("*").remove();


let selected_session = 0;
let selectedSessionSleepStagesData = selectedPatientData.sessions_data[selected_session].user_staged.sleep_stages;
console.log(selectedSessionSleepStagesData)
Object.keys(selectedSessionSleepStagesData).forEach(function(stage) {
    for (let i = 0; i < selectedSessionSleepStagesData[stage].length; i++) {
        hypnoData.push({"Start" : selectedSessionSleepStagesData[stage][i].Start, "End" : selectedSessionSleepStagesData[stage][i].End, "stage" : stage});
        Object.keys(selectedSessionSleepStagesData[stage][i].events).forEach(function(event) {
            // console.log(event);
            // console.log(selectedSessionSleepStagesData[stage][i].events[event].length);
            let eventsInStage = selectedSessionSleepStagesData[stage][i].events[event];
            
            console.log(event,eventsInStage);
            for (let i = 0; i < eventsInStage.length; i++) {
                // console.log(eventsInStage[i]);
                eventData.push({"time" : Math.floor(eventsInStage[i].Start), "stage" : stage, "event":event})

            }
        })
    }
});

hypnoData = hypnoData.sort((a, b) => a.Start - b.Start)
// console.log(hypnoData);
eventData = eventData.sort((a,b) => a.time - b.time);

console.log(eventData);




const marginHypno = { top:20, right: 20, bottom: 100, left: 40 };
const widthHypno = d3.select('#hypnogram_svg').node().getBoundingClientRect().width - marginHypno.left - marginHypno.right;
const heightHypno = d3.select('#hypnogram_svg').node().getBoundingClientRect().height - marginHypno.top - marginHypno.bottom;

const svg = d3.select('#hypnogram_svg')
.attr('width', widthHypno)
.attr('height', heightHypno);
let g = svg
.append('g')
.attr('transform','translate('+marginHypno.left+','+marginHypno.top+')')

const xScaleHypno = d3.scaleLinear()
.domain([hypnoData[0].Start, hypnoData[hypnoData.length - 1].End])
.range([0, 1 * widthHypno-marginHypno.right]);

const yScaleHypno = d3.scaleBand()
.domain(hypnoData.map(d => d.stage))
.range([heightHypno, 0])



g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(${marginHypno.left},${heightHypno})`)
    .call(d3.axisBottom(xScaleHypno))
    .style("font-weight","bold");

g.append('g')
.attr('class', 'y-axis')
.call(d3.axisLeft(yScaleHypno))
.style("font-weight","bold")
.attr('transform',`translate(${marginHypno.left})`);
// console.log(hypnoData)

let sleep_stages = new Set(hypnoData.map(d => d.stage));
// console.log(sleep_stages)
g.selectAll("rect")
        .data(sleep_stages)
        .enter().append("rect")
        .attr("x", marginHypno.left)
        .attr("y",d => yScaleHypno(d) )
        .attr("width", 1 * widthHypno-marginHypno.right)
        .attr("height", yScaleHypno.bandwidth())
        .attr("fill", d => colorScaleProvided_panelA(d))
        .attr("opacity", 0.5) 

g.selectAll('.line')
.data(hypnoData)
.enter()
.append('line')
.attr('class', 'line')
.attr('x1', d => xScaleHypno(d.Start)+marginHypno.left)
.attr('x2', d => xScaleHypno(d.End)+marginHypno.left)
.attr('y1', d => yScaleHypno(d.stage) +1)
.attr('y2', d => yScaleHypno(d.stage) +1)
.attr('stroke', 'black')
.attr('stroke-width', 2);

g.selectAll('.verticallines')
.data(hypnoData.slice(1))
.enter()
.append('line')
.attr('class', 'verticallines')
.attr('x1', (d, i) => xScaleHypno(hypnoData[i].End)+marginHypno.left)
.attr('x2', d => xScaleHypno(d.Start)+marginHypno.left)
.attr('y1', (d, i) => yScaleHypno(hypnoData[i].stage) ) 
.attr('y2', d => yScaleHypno(d.stage) )
.attr('stroke', '#474747')
.attr('stroke-width', 2);

g.selectAll("circle")
    .data(eventData)
    .enter().append("circle")
    .attr("cx", d => xScaleHypno(d.time)+marginHypno.left)
    .attr("cy", function(d) {
    return yScaleHypno(d.stage);

    } )
    .attr("r", 4) 
    .attr("fill", "#c22d2d")
    .on("mouseover", function(event, d) {
        var displayContent = "Event : "+d.event+"."
        
        d3.select("#toolTipApneaEventsA")
            .style("left", event.pageX - 35+ "px")
            .style("top", event.pageY - 180+ "px")
            .html(displayContent)
            .style("display", "block")
            .style("font-size","12px")
            .style("font-weight","bold")
    })
    .on("mouseout", function() {
        d3.select("#toolTipApneaEventsA").style("display", "none")
    });




g.append('text')
.attr('class', 'axis-label')
.attr('x', 1*widthHypno / 2)
.attr('y', heightHypno + marginHypno.top*2)
.style('text-anchor', 'middle')
.text('Time')
.style("font-weight","bold");

g.append('text')
.attr('class', 'axis-label')
.attr('transform', 'rotate(-90)')
.attr('x', -heightHypno / 2)
.attr('y', -marginHypno.left)
.attr('dy', '1em')
.style('text-anchor', 'middle')
.text('Sleep Stage')
.style("font-weight","bold");


const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(" + 0 + ",0)")
      .selectAll("g")
      .data(colorScaleProvided_panelA.domain())
      .enter().append("g")
      .attr("transform", (d, i) => `translate(${marginHypno.left*3 +(i*120)},${heightHypno + marginHypno.bottom-marginHypno.top*1.5})`);


  
  legend.append("rect")
      .attr("x", 5)
      .attr("y",10)
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", colorScaleProvided_panelA)
      .attr("opacity",0.5)
      .style("stroke","black")
      .style("stroke-width",2);
  
  legend.append("text")
      .attr("x", 30)
      .attr("y", 20)
      .attr("dy", ".15em")
      .style("text-anchor", "start")
      .text(d => d)
      .attr("font-weight","bold")

}

function plotTimeline(){
var eegDataHypno = []
var eventDataHypno = []
var stageDataHypno = []

let selected_session = 1;
let selectedSessionEventsData = selectedPatientData.sessions_data[selected_session-1].events;
let selectedSessionSleepStagesData = selectedPatientData.sessions_data[selected_session-1].user_staged.sleep_stages;

// console.log(selectedPatientData);
var displayedEvents = selectedPatientData[selectedSession-1];
// console.log(displayedEvents);

apnea_events = []

var stagesToRetrieve = Object.keys(selectedSessionSleepStagesData);

for (const stage of stagesToRetrieve) {
    for(const section of selectedSessionSleepStagesData[stage]){
        eegDataHypno.push(
            ...section["EEG_A1_A2"].map((x,idx)=>{
                
                return {"time":idx+section["Start"],"value":x} })
        );
}
}


eegDataHypno.sort((a,b) => a["time"] - b["time"]);

// for(let idx=0;idx<selectedPatientData["eeg_data"].length;idx++){
//     eeg_sub = []
//     eeg_sub["time"] = idx+1
//     eeg_sub["value"] = +selectedPatientData["eeg_data"][idx]
//     eegDataHypno.push(eeg_sub)

// }

// console.log(eegDataHypno)

// console.log(selectedSessionEventsData)

Object.keys(selectedSessionEventsData).forEach(function(event) {
    for (let idx = 0; idx < selectedSessionEventsData[event].length; idx++) {
        event_sub = {}
        if (eegDataHypno.find(x => x["time"] == Math.floor(selectedSessionEventsData[event][idx]["Start"])) != undefined) {
            event_sub["time"] = Math.floor(selectedSessionEventsData[event][idx]["Start"])
            event_sub["value"] = eegDataHypno.find(x => x["time"] == Math.floor(selectedSessionEventsData[event][idx]["Start"]))["value"]
            event_sub["event"] = event
            eventDataHypno.push(event_sub)
        }
        
        // console.log(selectedSessionEventsData[event][idx])
    }
});




Object.keys(selectedSessionSleepStagesData).forEach(function(stage) {
    for (let idx = 0; idx < selectedSessionSleepStagesData[stage].length; idx++) {
        stage_sub = []
        stage_sub["event"] = stage
        stage_sub["times"] = [selectedSessionSleepStagesData[stage][idx]["Start"],selectedSessionSleepStagesData[stage][idx]["End"]]
        stageDataHypno.push(stage_sub)
        
    }
});



d3.select('#hypnogram_svg').selectAll("*").remove();
const marginHypno = { top:20, right: 20, bottom: 100, left: 40 };

  const widthHypno = d3.select('#hypnogram_svg').node().getBoundingClientRect().width;
  const heightHypno = d3.select('#hypnogram_svg').node().getBoundingClientRect().height;
  const innerHeightHypno = heightHypno - marginHypno.top - marginHypno.bottom;
  const innerWidthHypno = widthHypno - marginHypno.left - marginHypno.right;


  const svg = d3.select("#hypnogram_svg")

  const xScaleHypno = d3.scaleLinear()
      .domain([0, eegDataHypno.length]) 
      .range([0,1*innerWidthHypno]);

  const yScaleHypno = d3.scaleLinear()
      .domain([d3.min(eegDataHypno, d => d.value)-20, d3.max(eegDataHypno, d => d.value)+60])
      .range([innerHeightHypno,0]);
  
   

  

  const line = d3.line()
      .x(d => xScaleHypno(d.time)+marginHypno.left)
      .y(d => yScaleHypno(d.value))
      .curve(d3.curveMonotoneX);

    svg.selectAll("rect")
      .data(stageDataHypno)
      .enter().append("rect")
      .attr("x", d => xScaleHypno(d["times"][0])+marginHypno.left )
      .attr("y",marginHypno.top)
      .attr("width",d => (xScaleHypno(d["times"][1]) - xScaleHypno(d["times"][0])))
      .attr("height", innerHeightHypno)
      .attr("fill", d => colorScaleProvided_panelA(d["event"]))
      .attr("opacity",0.5)

  svg.append("path")
      .datum(eegDataHypno)
      .attr("fill", "none")
      .attr('transform','translate('+0+','+marginHypno.top+')')
      .attr("stroke", "#474747")
      .attr("stroke-width", 2)
      .attr("d", line);
  
  svg.selectAll("circle")
      .data(eventDataHypno)
      .enter().append("circle")
      .attr('transform','translate('+0+','+marginHypno.top+')')
      .attr("cx", d => xScaleHypno(d.time)+marginHypno.left)
      .attr("cy", d => yScaleHypno(d.value))
      .attr("r", 4) 
      .attr("fill", "#c22d2d")
      .on("mouseover", function(event, d) {
        var displayContent = "Event : "+d.event+"."
        
        d3.select("#toolTipApneaEventsA")
            .style("left", event.pageX - 35+ "px")
            .style("top", event.pageY - 180+ "px")
            .html(displayContent)
            .style("display", "block")
            .style("font-size","12px")
            .style("font-weight","bold")
    })
    .on("mouseout", function() {
        d3.select("#toolTipApneaEventsA").style("display", "none")
    });



   
      
d3.select("#apnea_stat")
    .text("Apnea Event Statistics")
    .style("text-align","center")
    .style("font-weight","bold")
    .style('margin',0)

  const g = svg.append("g")
                .attr('transform','translate('+marginHypno.left+','+marginHypno.top+')')


  g.append("g")
      .attr("transform", `translate(0, ${innerHeightHypno})`)
      .call(d3.axisBottom(xScaleHypno))
      .style("font-weight", "bold");

  g.append("g")
      .call(d3.axisLeft(yScaleHypno))
      .style("font-weight", "bold");

      console.log("legend implementation");

const legend = svg.append("g")
      .attr("id", "stage-legend")
      .attr("transform", "translate(" + 0 + ",0)")
      .selectAll("g")
      .data(colorScaleProvided_panelA.domain())
      .enter().append("g")
      .attr("transform", (d, i) => `translate(${marginHypno.left*3 +(i*120)},${innerHeightHypno + marginHypno.bottom-marginHypno.top*1.5})`);
      
  



  
  legend.append("rect")
      .attr("x", 5)
      .attr("y",14)
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", colorScaleProvided_panelA)
      .attr("opacity",0.5)
      .style("stroke","black")
      .style("stroke-width",2);
  
  legend.append("text")
      .attr("x", 30)
      .attr("y", 20)
      .attr("dy", ".15em")
      .style("text-anchor", "start")
      .text(d => d)
      .attr("font-weight","bold")

svg.append("text")
      .attr("transform",`translate(${ 1*innerWidthHypno/2 },${innerHeightHypno+marginHypno.top*3})`)
      .text("Time(in seconds)")
      .style("font-weight", "bold")
  
svg.append("text")
      .attr('class','axis-label')
      .attr('transform','rotate(-90)')
      .attr('x',-innerHeightHypno/2)
      .attr("y",11)
      .attr('text-anchor','middle')
      .text('EEG Signals (in Hz)')
      .style("font-weight", "bold")
  
 


}
function plotBeltChart(){
    
    let stage_data = [];
    let signals_data = [];
    let selected_session = 0;
    let selectedSessionSleepStagesData = selectedPatientData.sessions_data[selected_session].user_staged.sleep_stages;
    d3.select('#belt_chart_svg').selectAll("*").remove();
    let belt_svg = d3.select('#belt_chart_svg');
    let sleepDataBelt = [];
    Object.keys(selectedSessionSleepStagesData).forEach(function(stage) {
        for (let idx = 0; idx < selectedSessionSleepStagesData[stage].length; idx++) {
            for(var event in selectedSessionSleepStagesData[stage][idx]["events"]){
                if(stage in sleepDataBelt){
                    sleepDataBelt[stage] += selectedSessionSleepStagesData[stage][idx]["events"][event].length
                }
                else{
                    sleepDataBelt[stage] = selectedSessionSleepStagesData[stage][idx]["events"][event].length
                }
                
            }
            
        }
    });

    
    
    const sleepStagesBelt = ["Wake","NonREM1","NonREM2","NonREM3","REM"]
    for(i=0;i<sleepStagesBelt.length;i++){
        if(sleepStagesBelt[i] in sleepDataBelt){
        }
        else{
            sleepDataBelt[sleepStagesBelt[i]] = 0
    
        }
    }
    const sleepDataFinalBelt = [];
    let totalDurationBelt = 0;
    for(var key in sleepDataBelt){
        sleepDataFinalBelt.push({"stage":key,"events_count":sleepDataBelt[key]})
        totalDurationBelt += sleepDataBelt[key]
    
    }
    
    
    let widthBelt = belt_svg.node().getBoundingClientRect().width;
    let heightBelt = belt_svg.node().getBoundingClientRect().height;
    const marginBelt = { left: 40, right: 40 , top:40, bottom:40};
    const innerHeightBelt = heightBelt - marginBelt.top - marginBelt.bottom;
    const innerWidthBelt = widthBelt ;
    
    const svg = d3.select("#belt_chart_svg");
    
    
    const xScaleBelt = d3.scaleLinear()
        .domain([0, totalDurationBelt])
        .range([0,innerWidthBelt]);
    
    
    svg.selectAll("rect")
        .data(sleepDataFinalBelt)
        .enter()
        .append("rect")
        .attr("x", (d, i) => xScaleBelt(d3.sum(sleepDataFinalBelt.slice(0, i), d => d.events_count)) || 0)
        .attr("width", d => xScaleBelt(d.events_count))
        .attr("height", 20)
        .attr("fill", d => colorScaleProvided_panelA(d['stage']))
        .attr('opacity',0.5)
        .style("stroke", "black")
        .style("stroke-width", "2px");
    
    const legend = svg.append("g")
        .attr("id", "belt-legend")
        .selectAll("g")
        .data(sleepDataFinalBelt)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${(innerWidthBelt/4+(i*70))}, 20)`);
    
    
    legend.append("rect")
        .attr("x", 5)
        .attr("y",10)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d=> colorScaleProvided_panelA(d['stage']))
        .attr("opacity",0.5)
        .style("stroke","black")
        .style("stroke-width",2);
    
    legend.append("text")
        .attr("x", 30)
        .attr("y", 20)
        .attr("dy", ".15em")
        .style("text-anchor", "start")
        .text(d => d["events_count"])
        .attr("font-weight","bold")

    
    
}
    
function selectSession(sessionNumber) {
    let patient_id = document.getElementById("Patients_selection").value;
    if (selectedSession !== null) {
        selectedSession.classList.remove('selected');
    }

    selectedSession = document.querySelector('.session:nth-child(' + sessionNumber + ')');
    selectedSession.classList.add('selected');



}
//Panel B starts
const selectedValuesPanelB = [];
const margin_panelB = { top: 20, right: 20, bottom: 20, left:20 };
const widthPanelB =  document.getElementById("correlogram_svg").getBoundingClientRect().width;
const heightPanelB = document.getElementById("correlogram_svg").getBoundingClientRect().height;
const innerWidth_panelB = widthPanelB - margin_panelB.left - margin_panelB.right;
const innerHeight_panelB = heightPanelB - margin_panelB.top - margin_panelB.bottom;
let patientSignal;
let correlogramData;
let patientStage;


function panelB(){

d3.selectAll(".panelBhead").remove();
d3.select('#text2')
    .append('text')
    .text("Correlation")
    .style("font-size",'90%')
    .style("font-weight",700)
    .attr('class','panelBhead');
d3.select('#text3')
    .append('text')
    .text("Values over Time")
    .style("font-size",'90%')
    .style("font-weight",700)
    .attr('class','panelBhead');
d3.select('#text4')
    .append('text')
    .text("Parallel Plot over Stage Transitions")
    .style("font-size",'90%')
    .style("font-weight",700)
    .attr('class','panelBhead');
d3.select('#text')
    .append('text')
    .text("Choose Categories ")
    .style("font-size",'90%')
    .style("font-weight",700)
    .attr('class','panelBhead');
d3.selectAll("#initialText").remove();
d3.selectAll('.cor').remove();
d3.selectAll('.legend').remove();
d3.selectAll('.left-label').remove();
d3.selectAll('.bottom-label').remove();
d3.selectAll('.linechart').remove();
d3.selectAll('.parallelchart').remove();
patientId= document.getElementById('Patients_selector').value;
console.log(patientId);



data = selectedPatientData["correlation_data"]
const attributes = Array.from(new Set(data.map(d => d.x)));
const container = d3.select('.checkbox-container');
//Checkboxes PanelB
const checkboxes = container
    .select('#scrollBox_svg')
    .style('background-color', "#E0F4F7")
    .style("padding-top","5%")
    .attr('height', (attributes.length)*35+35)
    .attr('overflow', 'scroll')
    .selectAll('foreignObject')
    .data(attributes)
    .enter()
    .append('foreignObject')
    .attr('width', "100%")  
    .attr('height', "9%")
    .attr('x', "2%")
    .attr('y', (d, i) => 35 * i)
    .html(d => ` 
        <input type="checkbox" value="${d}" id="${d}" checked>
        <label for="${d}">${d}</label>`)
    .attr('font-size','70%')
    .attr("font-weight",500)
    .on("mouseover", function(i,d) {

        console.log(typeof(d))
        let tooltip;
        if(d == "EEG A1-A2"){
            tooltip = "<b>Attribute </b>: "+d+ "<br>" +"<b>Description</b> : <br>This refers to an electroencephalogram (EEG) recording where the electrodes are placed on the left and right mastoids (A1 and A2), which are specific locations on the skull" ;
        }
        else if(d === 'EEG C3-A2'){
            tooltip = "<b>Attribute</b> : "+(d)+ "<br>" +"<b>Description</b> : <br>In this EEG setup, the electrodes are placed at the C3 and A2 positions. C3 typically refers to a location on the scalp corresponding to the left hemisphere of the brain, while A2 is a reference electrode." ;
        }
        else if(d === 'EEG C4-A1'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This setup involves electrodes placed at C4 (right hemisphere) and A1 (reference)." ;
        }else if(d=='Effort THO'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This refers to thoracic effort, which is a measurement of the effort or activity of the thoracic muscles involved in breathing." ;
        } 
        else if(d=='Effort ABD'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This refers to abdominal effort, which is a measurement of the activity of the abdominal muscles involved in breathing." ;
        }else if(d=='Tracheal'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This could refer to a tracheal tube, which is a medical device inserted into the trachea (windpipe) to maintain an open airway, assist with breathing, or administer medications." ;
        }
        else if(d==='PulseRate'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>Pulse rate, also known as heart rate, is the number of times the heart beats per minute." ;
        } 
        else if(d==='Body'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This refers to the number of body movements during the test." ;
        }
        else if (d==='SpO2'){
            tooltip = "<b>Attribute </b>: "+(d)+ "<br>" +"<b>Description </b>: <br>This stands for peripheral capillary oxygen saturation, commonly known as oxygen saturation." ;
        }
        d3.select("#tooltipB")
            .style("left", (i.pageX + 15) + "px")
            .style("top", (i.pageY - 40) + "px")
            .html(tooltip)
            .style("display","block");       
            
    })
    .on("mouseout", function(d) {
         d3.select("#tooltipB")
                .style("display","none");
    });

checkboxes
    .selectAll('input[type="checkbox"]')
    .on('input', function () {
        const selectedValuesPanelB = [];
        checkboxes.selectAll('input[type="checkbox"]:checked').each(function () {
            selectedValuesPanelB.push(this.value);
        });
        console.log(`Selected values: ${selectedValuesPanelB}`);
        d3.selectAll('.cor').remove();
        d3.selectAll('.legend').remove();
        d3.selectAll('.left-label').remove();
        d3.selectAll('.bottom-label').remove();
        updateCorrelogram(selectedValuesPanelB);
    
    })
    .on('mouseover',function(d){
        d3.select(this).style("cursor", "pointer"); 
    })
    .on('mouseout',function(d){
        d3.select(this).style("cursor", "default"); 
    });

const selectedValuesPanelB = attributes.slice();
updateCorrelogram(selectedValuesPanelB);

}

//Correlogram PanelB
function updateCorrelogram(selectedValuesPanelB) {
    d3.selectAll(".linechart").remove();
    d3.selectAll(".parallelchart").remove();

    data = selectedPatientData["correlation_data"]
    
        console.log(data)
        const attributes = Array.from(new Set(data.map(d => d.x)));
        const filteredData = data.filter(d => selectedValuesPanelB.includes(d.x) & selectedValuesPanelB.includes(d.y));
        console.log(selectedValuesPanelB)
        const domain = Array.from(new Set(filteredData.map(function(d) { return d.x })))
        console.log(domain)
    
        const color = d3.scaleDiverging()
                            .domain([-1, 0, 1])
                            .interpolator(d3.interpolateRdBu);
        const size = d3.scaleSqrt()
                        .domain([0, 1])
                        .range([0, 10]);
        const x = d3.scalePoint()   
                    .range([3*margin_panelB.left,widthPanelB-margin_panelB.right])
                    .domain(domain)
    
        const y = d3.scalePoint()
                    .range([margin_panelB.top, heightPanelB-3*margin_panelB.bottom])
                    .domain(domain)
        const co_svg = d3.select("#correlogram_svg")
                    .append("g")
                    .attr('id','correlogram');
                
    
    console.log(filteredData)
    const cor = co_svg.selectAll(".cor")
        .data(filteredData)
        .join("g")
        .attr("class", "cor")
        .attr("transform", function (d) {
        console.log(d.x)
        // console.log(`translate(${x(d.x)}, ${y(d.y)})`)
        return `translate(${x(d.x)}, ${y(d.y)})`
        });
    
    cor.filter(function (d) {
        const ypos = domain.indexOf(d.y);
        const xpos = domain.indexOf(d.x);
        return xpos < ypos;
        })
        .append("circle")
        .attr("cx", 0.5*margin_panelB.left) 
        .attr("cy", 0)
        .attr("r", function (d) {
        return size(Math.abs(d.value) *2);
        })
        .style("fill", function (d) {
        return color(d.value);
        })
        .style("stroke", "black")
        .on('mouseover',function(i,d){
            tooltip = "<b>X </b>: "+d['x']+"<br><b>Y</b> : "+d['y']+"<br><b>Value</b> : "+d['value'].toFixed(3)
            d3.select("#tooltipB")
            .style("left", (i.pageX + 15) + "px")
            .style("top", (i.pageY - 40) + "px")
            .html(tooltip)
            .style("display","block");  
            d3.select(this).style("stroke-width",2);
            d3.select(this).style("cursor", "pointer"); 
        })
        .on('mouseout',function(d){
            d3.select("#tooltipB")
                .style("display", "none");
            d3.select(this).style("stroke-width",1);
            
            d3.select(this).style("cursor", "default"); 
        })
        .on('click',function(i,d){
            const xVar = (d['x']);
            const yVar = d['y']
            line(xVar, yVar);
            parallelPlot(xVar, yVar);
        });
    const leftLabels = co_svg.selectAll(".left-label")
        .data(selectedValuesPanelB)
        .enter()
        .append("text")
        .attr("class", "left-label")
        .attr("x", "1.5%")
        .attr("y", (d, i) => i * ((heightPanelB-4*margin_panelB.bottom)/selectedValuesPanelB.length) + 2*margin_panelB.top)
        .text(d => "[" + d + "]")
        .attr('font-size', '50%')
        .style('font-weight', 'bold');
    
    const bottomLabels = co_svg.selectAll(".bottom-label")
        .data(selectedValuesPanelB)
        .enter()
        .append("text")
        .attr("class", "bottom-label")
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-90)')     
        .attr("y", (d, i) =>i*((widthPanelB-2.7*margin_panelB.left)/selectedValuesPanelB.length)+3.7*margin_panelB.left) 
        .attr("x", (d, i)=>-i-heightPanelB+2.5*margin_panelB.bottom)
        .text(d => " [" + d + "] ")
        .attr('font-size',"50%")
        .style('font-weight', 'bold');
    
    const color_svg=d3.select('#color_Scale')

const legend = co_svg.append("g").attr('class','legend');
const legendWidth = "40%";
const legendHeight = "5%";
const gradient = legend.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");
gradient.selectAll("stop")
    .data(color.range())
    .enter().append("stop")
    .attr("offset", (d, i) => i / (color.range().length - 1))
    .attr("stop-color", d => d);

legend.append("rect")
    .attr("x", "60%")
    .attr("y", "5%")
    .attr("width", legendWidth) 
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)")
    .style('stroke','black');
legend.append('g').append("text")
    .text("Color Scale: -1 to 0 to 1")
    .attr('x', "56%")
    .attr('y', "18%")
    .style("font-size",'80%')
    .style("font-weight",500);
    
}       
//Line Chart PanelB
function line(xVar, yVar){
    d3.selectAll(".linechart").remove();
    const widthLine = document.getElementById("line_chartSvg").getBoundingClientRect().width;
    const heightLine = document.getElementById("line_chartSvg").getBoundingClientRect().height;
    const lineSvg = d3.select("#line_chartSvg").attr('width',widthLine).attr('height',heightLine);
    signalsData = selectedPatientData.signals_data
    console.log(signalsData)
    signals_xVar = signalsData[xVar]
    signals_yVar = signalsData[yVar]
    const data =[];
    for(let idx = 0;idx<signals_xVar.length;idx++){
        data.push({
            "x": signals_xVar[idx],
            "y" :signals_yVar[idx],
            "Time": idx
        });
    }
    

    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d['Time'])])
        .range([2*margin_panelB.left, widthLine - margin_panelB.right])

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d['x']), d3.max(data, d => d['x'])])
        .range([heightLine/2-margin_panelB.bottom , margin_panelB.bottom/2]);
    

    const line = d3.line()
        .x(d => xScale(d['Time']))
        .y(d => yScale(d['x']));
    const yScale2 = d3.scaleLinear()
        .domain([d3.min(data, d => d['y']), d3.max(data, d => d['y'])])
        .range([heightLine -2.2*margin_panelB.bottom,heightLine/2-margin_panelB.bottom/2]);
    
    const line2 = d3.line()
        .x(d => xScale(d['Time']))
        .y(d => yScale2(d['y']));
        console.log(data);
    lineSvg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('d', line2)
        .attr('class','linechart');
    lineSvg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 1)
        .attr('d', line)
        .attr('class','linechart');

    
    lineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', margin_panelB.left/2+5)
        .attr('x', 0 - 2.1*(margin_panelB.top +  heightLine / 6))
        .attr('font-size', '60%')
        .style('text-anchor', 'middle')
        .text(yVar)
        .attr('font-weight','bold')
        .attr('class','linechart');
    lineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', margin_panelB.left/2+5)
        .attr('x', 0 - 2*(margin_panelB.top))
        .attr('font-size', '60%')
        .style('text-anchor', 'middle')
        .text(xVar)
        .attr('font-weight','bold')
        .attr('class','linechart');
    lineSvg.append('text')
        .attr('transform', `translate(${ widthLine / 2 },${heightLine - 10})`)
        .text('Time (s)')
        .attr('font-size', '60%')
        .style('text-anchor', 'middle')
        .attr('font-weight','bold')
        .attr('class','linechart');

    lineSvg.append('g')
        .attr('transform', `translate(0, ${heightLine -2.2*margin_panelB.bottom})`)
        .call(d3.axisBottom(xScale)).attr('font-size','50%').attr('class','linechart');

    lineSvg.append('g')
        .attr('transform', `translate(${2*margin_panelB.left}, 0)`)
        .call(d3.axisLeft(yScale)).attr('font-size','50%').attr('class','linechart');
    lineSvg.append('g')
        .attr('transform', `translate(${2*margin_panelB.left}, 0)`)
        .call(d3.axisLeft(yScale2)).attr('font-size','50%').attr('class','linechart');
}
// Parallel Plot PanelB
function parallelPlot(xVar, yVar){
    d3.selectAll(".parallelchart").remove();
    const widthParallel = document.getElementById("parallel_chartSvg").getBoundingClientRect().width;
    const heightParallel = document.getElementById("parallel_chartSvg").getBoundingClientRect().height;
    const parallelSvg = d3.select("#parallel_chartSvg").attr('width',widthParallel).attr('height',heightParallel);
    parallelPlotData = selectedPatientData.parallel_plot_data
    console.log(parallelPlotData)
    parallel_xVar = parallelPlotData[xVar]
    parallel_yVar = parallelPlotData[yVar]
    parallel_time =parallelPlotData['Start']
    const dataP =[];
    for(let idx = 0;idx<parallel_xVar.length;idx++){
        dataP.push({
            "x": parallel_xVar[idx],
            "y" :parallel_yVar[idx],
            "Time": parallel_time[idx]
        });
    }
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(dataP, d => d['Time'])])
        .range([2*margin_panelB.left, widthParallel - margin_panelB.right])

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataP, d => d['x'])/d3.max(dataP,d=>d['x'])])
        .range([heightParallel-2.2*margin_panelB.bottom , 1.5*margin_panelB.top]);
    const line = d3.line()
        .x(d => xScale(d['Time']))
        .y(d => yScale((d['x']-d3.min(dataP,d=>d['x']))/(d3.max(dataP,d=>d['x'])-d3.min(dataP,d=>d['x']))));
    
    const line2 = d3.line()
        .x(d => xScale(d['Time']))
        .y(d => yScale((d['y']-d3.min(dataP,d=>d['y']))/(d3.max(dataP,d=>d['y'])-d3.min(dataP,d=>d['y']))));
    parallelSvg.append('path')
        .datum(dataP)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('d', line2)
        .attr('class','parallelchart');
    parallelSvg.append('path')
        .datum(dataP)
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 1)
        .attr('d', line)
        .attr('class','parallelchart');
    parallelSvg.append('g')
        .attr('transform', `translate(0, ${heightParallel -2.2*margin_panelB.bottom})`)
        .call(d3.axisBottom(xScale)).attr('font-size','50%').attr('class','parallelchart');
    parallelSvg.append('text')
        .attr('transform', `translate(${ widthParallel / 2 },${heightParallel - 10})`)
        .text('Time (s)')
        .attr('font-size', '60%')
        .style('text-anchor', 'middle')
        .attr('font-weight','bold')
        .attr('class','parallelchart');
    parallelSvg.append('g')
        .attr('transform', `translate(${2*margin_panelB.left}, 0)`)
        .call(d3.axisLeft(yScale)).attr('font-size','50%').attr('class','parallelchart');
}


//Panel B ends


/* Panel C */

/* Panel D */

function drawPanelDCharts() {
    var patientComparisionToggle = document.getElementById('PatientComparisonToggle');
    if (patientComparisionToggle.checked) {
        console.log('checked');
        alert('Patient Comparison is not yet implemented');
        // patient Comparision implementation
    
    } else {
        console.log('session Comparision');
        let sessionsData = selectedPatientData.sessions_data;
        //console.log(sessionsData);
        let sessionsLength = sessionsData.length;
        let RadarDataForAllSessions = [];
        for (let i = 0; i < sessionsLength; i++) {
            let session = sessionsData[i];
            let userSleepStages = session.user_staged.sleep_stages;
            // console.log(userSleepStages);
            let radarData = [];
            let radarDataKeys = Object.keys(userSleepStages);

            radarDataKeys.forEach(function (stage) {
                let stageData = userSleepStages[stage];
                let radarStageData = {
                    className : stage,
                    axes : []
                };
                let SpO2_value = 0;
                let Pulse_Rate = 0;
                let EEG_A1_A2_value = 0;
                let EEG_C3_A2_value = 0;
                let EEG_C4_A1_value = 0;
                let Flow_Patient_value = 0;
                let Effort_THO_value = 0;
                let Effort_ABD_value = 0;
                let Body_value = 0;
                let Tracheal_value = 0;


                let totalEvents = 0;
                stageData.forEach(function (d) {
                    Object.keys(d['events']).forEach(function (event) {
                        if (d['events'][event].length != 0) {
                            totalEvents += d['events'][event].length;
                            for (let i = 0; i < d['events'][event].length; i++) {
                                // console.log(d['events'][event][i]);
                                //console.log(d['events'][event][i].Spo2);
                                //console.log(d['events'][event][i].pulseRate);

                                if (d['events'][event][i].Duration == 0) {
                                    continue;
                                } else {
                                    let SpO2_average = d['events'][event][i].SpO2.reduce((a, b) => a + b, 0)/d['events'][event][i].SpO2.length;
                                    let Pulse_Rate_average = d['events'][event][i].Pulse_Rate.reduce((a, b) => a + b, 0)/d['events'][event][i].Pulse_Rate.length;
                                    let EEG_A1_A2_average = d['events'][event][i].EEG_A1_A2.reduce((a, b) => a + b, 0)/d['events'][event][i].EEG_A1_A2.length;
                                    let EEG_C3_A2_average = d['events'][event][i].EEG_C3_A2.reduce((a, b) => a + b, 0)/d['events'][event][i].EEG_C3_A2.length;
                                    let EEG_C4_A1_average = d['events'][event][i].EEG_C4_A1.reduce((a, b) => a + b, 0)/d['events'][event][i].EEG_C4_A1.length;
                                    let Flow_Patient_average = d['events'][event][i].Flow_Patient.reduce((a, b) => a + b, 0)/d['events'][event][i].Flow_Patient.length;
                                    let Effort_THO_average = d['events'][event][i].Effort_THO.reduce((a, b) => a + b, 0)/d['events'][event][i].Effort_THO.length;
                                    let Effort_ABD_average = d['events'][event][i].Effort_ABD.reduce((a, b) => a + b, 0)/d['events'][event][i].Effort_ABD.length;
                                    let Body_average = d['events'][event][i].Body.reduce((a, b) => a + b, 0)/d['events'][event][i].Body.length;
                                    let Tracheal_average = d['events'][event][i].Tracheal.reduce((a, b) => a + b, 0)/d['events'][event][i].Tracheal.length;

                                    //console.log(Sp02_average);
                                    //console.log(pulse_rate_average);
                                    SpO2_value += SpO2_average;
                                    Pulse_Rate += Pulse_Rate_average;
                                    EEG_A1_A2_value += EEG_A1_A2_average;
                                    EEG_C3_A2_value += EEG_C3_A2_average;
                                    EEG_C4_A1_value += EEG_C4_A1_average;
                                    Flow_Patient_value += Flow_Patient_average;
                                    Effort_THO_value += Effort_THO_average;
                                    Effort_ABD_value += Effort_ABD_average;
                                    Body_value += Body_average;
                                    Tracheal_value += Tracheal_average;

                                }
                            }
                            //console.log(Sp02_value);
                            //console.log(pulse_rate);   
                        }            
                    });
                });
                SpO2_value = SpO2_value / totalEvents;
                Pulse_Rate = Pulse_Rate / totalEvents;
                EEG_A1_A2_value = EEG_A1_A2_value / totalEvents;
                EEG_C3_A2_value = EEG_C3_A2_value / totalEvents;
                EEG_C4_A1_value = EEG_C4_A1_value / totalEvents;
                Flow_Patient_value = Flow_Patient_value / totalEvents;
                Effort_THO_value = Effort_THO_value / totalEvents;
                Effort_ABD_value = Effort_ABD_value / totalEvents;
                Body_value = Body_value / totalEvents;
                Tracheal_value = Tracheal_value / totalEvents;

                console.log("Stage: " + stage + "SpO2: " + SpO2_value + " Pulse Rate: " + Pulse_Rate + "EEG_A1_A2: " + EEG_A1_A2_value + "EEG_C3_A2: " + EEG_C3_A2_value + "EEG_C4_A1: " + EEG_C4_A1_value + "Flow_Patient: " + Flow_Patient_value + "Effort_THO: " + Effort_THO_value + "Effort_ABD: " + Effort_ABD_value + "Body: " + Body_value + "Tracheal: " + Tracheal_value + "Total Events: " + totalEvents);

                //console.log("sessionId" + sessionID + "Stage" + stage + "Sp02: " + Sp02_value + " Pulse Rate: " + pulse_rate + " Total Events: " + totalEvents);
                radarStageData.axes.push({axis: 'SpO2', value: !isNaN(SpO2_value) ? Math.abs(SpO2_value/102.3) : 0});
                radarStageData.axes.push({axis: 'Pulse Rate', value: !isNaN(Pulse_Rate) ? Math.abs(Pulse_Rate/255) : 0});
                radarStageData.axes.push({axis: 'EEG_A1_A2', value: !isNaN(EEG_A1_A2_value) ? Math.abs(EEG_A1_A2_value/313) : 0});
                radarStageData.axes.push({axis: 'EEG_C3_A2', value: !isNaN(EEG_C3_A2_value) ? Math.abs(EEG_C3_A2_value/313) : 0});
                radarStageData.axes.push({axis: 'EEG_C4_A1', value: !isNaN(EEG_C4_A1_value) ? Math.abs(EEG_C4_A1_value/313) : 0});
                radarStageData.axes.push({axis: 'Flow_Patient', value: !isNaN(Flow_Patient_value) ? Math.abs(Flow_Patient_value/100) : 0});
                radarStageData.axes.push({axis: 'Effort_THO', value: !isNaN(Effort_THO_value) ? Math.abs(Effort_THO_value/100) : 0});
                radarStageData.axes.push({axis: 'Effort_ABD', value: !isNaN(Effort_ABD_value) ? Math.abs(Effort_ABD_value/100) : 0});
                radarStageData.axes.push({axis: 'Body', value: !isNaN(Body_value) ? Math.abs(Body_value/10) : 0});
                radarStageData.axes.push({axis: 'Tracheal', value: !isNaN(Tracheal_value) ? Math.abs(Tracheal_value/100) : 0});
                radarData.push(radarStageData);
            });
            RadarDataForAllSessions.push(radarData);
        }
        console.log(RadarDataForAllSessions);
        
        let panelDSvg = d3.select('#panel_D_svg');
        panelDSvg.selectAll('*').remove();
        if (sessionsData.length > 4) {
            panelDSvg.attr("height", 200 * Math.ceil(sessionsData.length/2));
        } else {
            panelDSvg.attr("height", 0.8 * 600);
        }

        let svgWidth = panelDSvg.node().getBoundingClientRect().width;
        let svgHeight = panelDSvg.node().getBoundingClientRect().height;
        console.log(svgHeight);

        let attributesSelected = ['EEG_A1_A2','EEG_C3_A2','EEG_C4_A1','Flow_Patient','Effort_THO','Effort_ABD','SpO2','Body','Pulse_Rate','Tracheal']
        
        let colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(attributesSelected)
        .range(d3.schemeDark2);

        
        let margin = {top: 20, right: 20, bottom: 20, left: 20};

        var radarChartOptions = {
            w: sessionsLength > 2 ? svgWidth/2 - margin.left - margin.right : svgWidth/sessionsLength - margin.left - margin.right,
            h: sessionsLength > 2 ? svgHeight/(sessionsLength/2) - (margin.top + margin.bottom) : 0.8 * svgHeight - (margin.top + margin.bottom),
            levels: 4,
            roundStrokes: true,
            maxValue: 1,
            opacityCircles: 0.1,
            labelFactor: 1.35
        };
        console.log(radarChartOptions.h + ", " + radarChartOptions.w);
        for (let i = 0; i < sessionsLength; i++) {
            

            var allAxis = (RadarDataForAllSessions[i][0].axes.map(function(i, j){return i.axis})),	//Names of each axis
            total = allAxis.length,					//The number of different axes
            radius = 0.7*Math.min(radarChartOptions.w/2, radarChartOptions.h/2), 	//Radius of the outermost circle
            angleSlice = Math.PI * 2 / total;


            var rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, radarChartOptions.maxValue]);

            var g = panelDSvg.append("g").attr("transform", `translate(${ radarChartOptions.w/2 + (i%2) * radarChartOptions.w  + (i%2 + 1) * margin.left}, ${ radarChartOptions.h/2 + (Math.floor(i/2)) * radarChartOptions.h + (Math.floor(i/2) + 1) * margin.top + margin.bottom})`).attr("class", "RadarChartWrapper");

            g.append("text")
                .attr("x", 0)
                .attr("y", (radarChartOptions.h/2 +  margin.top/2 + 5))
                .attr("text-anchor", "middle")
                .style("font-size", "0.7em")
                .text("Session " + sessionsData[i].session_id);
        
            //Draw the background circles
            g.selectAll(".levels")
            .data(d3.range(1,(radarChartOptions.levels+1)).reverse())
            .enter()
                .append("circle")
                .attr("class", "gridCircle")
                .attr("r", function(d, i){return radius/radarChartOptions.levels*d;})
                .style("fill", "#CDCDCD")
                .style("stroke", "#CDCDCD")
                .style("fill-opacity", radarChartOptions.opacityCircles)

            //Text indicating at what % each level is
            g.selectAll(".axisLabel")
                .data(d3.range(1,(radarChartOptions.levels+1)).reverse())
                .enter().append("text")
                .attr("class", "axisLabel")
                .attr("x", 4)
                .attr("y", function(d){return -d*radius/radarChartOptions.levels;})
                .attr("dy", "0.4em")
                .style("font-size", "10px")
                .attr("fill", "brown")
                .style("fill-opacity", "0.75")
                .text(function(d,i) { return radarChartOptions.maxValue * d/radarChartOptions.levels; });

            //Create the straight lines radiating outward from the center
            var axis = g.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");

            //Append the lines
            axis.append("line")
                .attr("x1", function(d, i){ return rScale(0.005) * Math.cos(angleSlice*i - Math.PI/2); })
                .attr("y1", function(d, i){ return rScale(0.005) * Math.sin(angleSlice*i - Math.PI/2); })
                .attr("x2", function(d, i){ return rScale(radarChartOptions.maxValue*1.25) * Math.cos(angleSlice*i - Math.PI/2); })
                .attr("y2", function(d, i){ return rScale(radarChartOptions.maxValue*1.25) * Math.sin(angleSlice*i - Math.PI/2); })
                .attr("class", "line")
                .style("stroke", "brown")
                .style("stroke-opacity", "0.25")
                .style("stroke-width", "2px");

            //Append the labels at each axis
            axis.append("text")
                .attr("class", "legend")
                .style("font-size", "11px")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("x", function(d, i){ 
                    return rScale(radarChartOptions.maxValue * radarChartOptions.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); 
                })
                .attr("y", function(d, i){
                    return rScale(radarChartOptions.maxValue* radarChartOptions.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); 
                })
                .text(function(d){return d})
                .style("fill", "brown")
                .call(wrap, radarChartOptions.wrapWidth);

            
            let stageSelection = document.getElementById('Sleep_Stage_Selection_Panel_D').value;
            

            let datapoints = [];
            for (let j = 0; j < RadarDataForAllSessions[i].length; j++) {

                if (stageSelection != "All_stages" && RadarDataForAllSessions[i][j].className != stageSelection) {
                    continue;
                }
                for (let k = 0; k < RadarDataForAllSessions[i][j].axes.length; k++) {
                    if (RadarDataForAllSessions[i][j].axes[k].value != 0)
                        datapoints.push({"axis": RadarDataForAllSessions[i][j].axes[k].axis, "value": RadarDataForAllSessions[i][j].axes[k].value});
                }
            }

            //console.log(datapoints);

            // Circles denoting the data points
            g.selectAll(".dataCircles")
                .data(datapoints)
                .join(enter => enter.append('circle')
                    .classed("dataCircles", true)
                    .attr("r", 2)
                    .call(enter => enter.transition().duration(1000)
                        .attr("cx", function(d, i){
                            return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2);
                        })
                        .attr("cy", function(d, i){ 
                            return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); 
                        })
                        .style("fill", function(d) { return colorScale(d.axis); })
                    ),
                    update => update.call(update => update.transition().duration(1000)
                            .attr("cx", function(d, i){
                                return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2);
                            })
                            .attr("cy", function(d, i){
                                return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2);
                            })
                            .style("fill", function(d) { return colorScale(d.axis); })
                        ),
                    exit => exit.call(exit => exit.transition().duration(1000)
                            .attr("cx", function(d, i){
                                return rScale(0) * Math.cos(angleSlice*i - Math.PI/2);
                            })
                            .attr("cy", function(d, i){
                                return rScale(0) * Math.sin(angleSlice*i - Math.PI/2);
                            })
                            .style("fill", "white")
                        .remove()
                    )
                );

        }


        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.4, // ems
                    y = text.attr("y"),
                    x = text.attr("x"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                    
                while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
                }
            });
        }//wrap	


    }
}


/* Panel E */


// Recalibaration of all panels
function recalibrateAllPanels() {
    // console.log(selectedPatientData);
    console.log('Recalibrating all panels');
    alert('Recalibrating all panels');
}

// Panel E charts
function drawPanelECharts() {
    var dotMapToggle = document.getElementById('DotMapToggle');
    if (dotMapToggle.checked) {
        console.log('checked');
        // console.log(selectedPatientData);
        sessionsData = selectedPatientData.sessions_data;
        // console.log(sessionsData);
        
        const margin = { right: 10, left: 20, top: 30, bottom: 10};

        const panelESvg = d3.select('#panel_E_svg');
        panelESvg.selectAll('*').remove();

        
        panelESvg.attr('height', 150 * sessionsData.length);

        let width = panelESvg.node().getBoundingClientRect().width;
        let height = panelESvg.node().getBoundingClientRect().height;

        if (height < 0.9 * (0.67 * 600)) {
            document.getElementById('thresholds_div').style.height += 0.67 * 600 - height + 'px';
            document.getElementById('svg_container_panel_E').style.height -= 0.67 * 600 - height + 'px';
        }


        let innerWidth = width - margin.left - margin.right;
        let innerHeight = height - margin.top - margin.bottom;


        var sessionHeight = innerHeight / sessionsData.length;

        panelESvg.append('rect')
            .classed('threshold_rect_legend', true)
            .attr('x', innerWidth / 4)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', 'lightpink')
            .attr('opacity', 0.2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        panelESvg.append('text')
            .classed('threshold_text_legend', true)
            .attr('x', innerWidth / 4 + 30)
            .attr('y', margin.top/2)
            .attr('font-size', '1em')
            .text('No Apnea')
            .attr('text-anchor', 'start');

        panelESvg.append('rect')
            .classed('threshold_rect_legend', true)
            .attr('x', 3* innerWidth / 4)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', 'lightgreen')
            .attr('opacity', 0.2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        panelESvg.append('text')
            .classed('threshold_text_legend', true)
            .attr('x', 3* innerWidth / 4 + 30)
            .attr('y', margin.top/2)
            .attr('font-size', '1em')
            .text('Apnea')
            .attr('text-anchor', 'start');



        for (let i = 0; i < sessionsData.length; i++) {

            let AHIMetrics = calculateAHI(sessionsData[i]);
            let AHI = AHIMetrics[0];
            let confidenceIntervals = AHIMetrics[1];
            let xValues = AHIMetrics[2];
            let yValues = AHIMetrics[3];
            let points = [];

            let AHIIndex = xValues.filter(function (d) {
                if (Math.round(d) == Math.round(AHI)) {
                    return true;
                }
            }).map(function (d) { return xValues.indexOf(d); })[0];

            let yValueForEachRedCircle = yValues[AHIIndex]/5;
            // console.log(yValueForEachRedCircle);
            let valuesForCirclesArray = [];
            let xValuesOffset = Math.round((confidenceIntervals[1] - confidenceIntervals[0])/5);
            let xValuesForCircles = Array.from({length : (confidenceIntervals[1] - confidenceIntervals[0])/xValuesOffset + 1}, (_, i) => Math.round(confidenceIntervals[0] + i * xValuesOffset));
            for (let i = 0; i < xValues.length; i++) {
                if (xValuesForCircles.includes(Math.round(xValues[i]))) {
                    for (let j = 0; j < Math.round(yValues[i]/yValueForEachRedCircle); j++) {
                        valuesForCirclesArray.push({ xpoint: Math.round(xValues[i]), ypoint: (j)*yValueForEachRedCircle });
                    }
                }
            }

            // valuesForCirclesArray = [...new Map(valuesForCirclesArray.map(item => {
            //     console.log(item);
            //     return [item["xpoint"], item]
            // })).values()];

            // console.log(valuesForCirclesArray);

            // points.push({xpoint : 0, ypoint : 0});
            points.push({xpoint : confidenceIntervals[0] - 1, ypoint : 0});

            for (let i = 0; i < xValues.length; i++) {
                points.push({ xpoint: xValues[i], ypoint: yValues[i] });
            }

            points.push({xpoint : confidenceIntervals[1] + 1, ypoint : 0});
            //console.log(points);


            if (d3.select('#tooltip').empty()) {
                d3.select('#svg_container_panel_E').append("div")
                    .style("opacity", 0)
                    .attr("id", "tooltip")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                    .style("position", "absolute")
                    .style("visibility", "hidden");
            }


            var xScale = d3.scaleLinear()
                .domain([0, confidenceIntervals[1] + 1])
                .range([0, innerWidth]);
            var yScale = d3.scaleLinear()
                .domain([0, d3.max(yValues)])
                .range([sessionHeight - margin.bottom - 20, 0]);
                
            
            var g = panelESvg.append('g')
                .attr('transform', `translate(${margin.left}, ${i * sessionHeight + margin.top})`)
                .attr('id', `session_${sessionsData[i].session_id}_dot_chart`);

            g.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', sessionHeight)
                .attr('font-size', '0.7 em')
                .text(`Session ${sessionsData[i].session_id}`)
                .attr('text-anchor', 'middle');
                

                

            g.append('g').call(d3.axisBottom(xScale))
                .attr('transform', `translate(0, ${sessionHeight - margin.bottom - 20} )`);


            // Create line generator
            //console.log(points);
            var Gen = d3.line() 
                .x((p) => xScale(p.xpoint))
                .y((p) => yScale(p.ypoint))
                .curve(d3.curveBasis); 

            var aboveThresholdPoints = points.filter(function (d) { return d.xpoint >= 15; });

            //console.log(aboveThresholdPoints);
            // var area = d3.area()
            //     .x((p) => xScale(p.xpoint))
            //     .y0(yScale(0))
            //     .y1((p) => yScale(p.ypoint));

            

            g.append('rect')
                .attr('x', xScale(0))
                .attr('y', 0)
                .attr('width', xScale(15))
                .attr('height', sessionHeight)
                .attr('fill', 'lightpink')
                .attr('opacity', 0.2);

            g.append('rect')
                .attr('x', xScale(15))
                .attr('y', 0)
                .attr('width', xScale(confidenceIntervals[1] + 1) - xScale(15))
                .attr('height', sessionHeight)
                .attr('fill', 'lightgreen')
                .attr('opacity', 0.2);

            // Draw the Poisson distribution curve
            g.append('path')
                .attr('d', Gen(points))
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .on('mouseover', function (event, d) {
                    d3.select('#tooltip')
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 55) + "px")
                        .style("opacity", 1)
                        .style("visibility", "visible")
                        .html("AHI: " + d.xpoint + "<br> Probability: " + (d.ypoint/0.5))
                    .style("text-align", "center");
                })
                .on("mouseleave", function(event, d) {
                    d3.select('#tooltip')
                    .style("opacity", 0)
                    .style("visibility", "hidden");

                })
                .on("mousemove", function(event, d) {
                    d3.select('#tooltip')
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY) - 55 + "px");
                });


            g.selectAll('dots_for_uncertainty')
                .data(valuesForCirclesArray)
                .enter()
                .append('circle')
                .attr('cx', (d) => xScale(d.xpoint) + 2)
                .attr('cy', (d) => yScale(d.ypoint))
                .attr('r', 5)
                .attr('fill', 'red')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('id', `session_${sessionsData[i].session_id}_AHI_dot`)
                .classed('AHI_Dots', true)
                .on('mouseover', function (event, d) {
                    d3.select(this).attr('fill', '#69b3a2');
                    d3.select(this).attr('fill-opacity', 0.5);
                    d3.select('#tooltip')
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 55) + "px")
                        .style("opacity", 1)
                        .style("visibility", "visible")
                        .html("AHI: " + d.xpoint + "<br> Probability: " + (d.ypoint/0.5))
                    .style("text-align", "center");
                })
                .on("mouseleave", function(event, d) {
                    d3.select(this).attr('fill', 'red');
                    d3.select(this).attr('fill-opacity', 1);
                    d3.select('#tooltip')
                    .style("opacity", 0)
                    .style("visibility", "hidden");

                })
                .on("mousemove", function(event, d) {
                    d3.select('#tooltip')
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY) - 55 + "px");
                });
                

        }

        //drawDotMap();
    } else {
        console.log('not checked');
        //drawDistributionChart();
        //console.log(selectedPatientData);
        sessionsData = selectedPatientData.sessions_data;
        //console.log(sessionsData);
        
        const margin = { right: 10, left: 20, top: 30, bottom: 10};

        const panelESvg = d3.select('#panel_E_svg');
        panelESvg.selectAll('*').remove();


        
        panelESvg.attr('height', 150 * sessionsData.length);
        

        let width = panelESvg.node().getBoundingClientRect().width;
        let height = panelESvg.node().getBoundingClientRect().height;

        if (height < 0.9 * (0.67 * 600)) {
            document.getElementById('thresholds_div').style.height += 0.67 * 600 - height + 'px';
            document.getElementById('svg_container_panel_E').style.height -= 0.67 * 600 - height + 'px';
        }


        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top;


        var sessionHeight = innerHeight / sessionsData.length;

        if (d3.select('#tooltip').empty()) {
            d3.select('#svg_container_panel_E').append("div")
                .style("opacity", 0)
                .attr("id", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px")
                .style("position", "absolute")
                .style("visibility", "hidden");
        }

        panelESvg.append('rect')
            .classed('threshold_rect_legend', true)
            .attr('x', innerWidth / 4)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', 'lightpink')
            .attr('opacity', 0.2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        panelESvg.append('text')
            .classed('threshold_text_legend', true)
            .attr('x', innerWidth / 4 + 30)
            .attr('y', margin.top/2)
            .attr('font-size', '1em')
            .text('No Apnea')
            .attr('text-anchor', 'start');

        panelESvg.append('rect')
            .classed('threshold_rect_legend', true)
            .attr('x', 3* innerWidth / 4)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', 'lightgreen')
            .attr('opacity', 0.2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        panelESvg.append('text')
            .classed('threshold_text_legend', true)
            .attr('x', 3* innerWidth / 4 + 30)
            .attr('y', margin.top/2)
            .attr('font-size', '1em')
            .text('Apnea')
            .attr('text-anchor', 'start');



        for (let i = 0; i < sessionsData.length; i++) {

            let AHIMetrics = calculateAHI(sessionsData[i]);
            let AHI = AHIMetrics[0];
            let confidenceIntervals = AHIMetrics[1];
            let xValues = AHIMetrics[2];
            let yValues = AHIMetrics[3];
            let points = [];

            // points.push({xpoint : 0, ypoint : 0});
            points.push({xpoint : confidenceIntervals[0] - 1, ypoint : 0});

            for (let i = 0; i < xValues.length; i++) {
                points.push({ xpoint: xValues[i], ypoint: yValues[i] });
            }

            points.push({xpoint : confidenceIntervals[1] + 1, ypoint : 0});
            //console.log(points);


            var xScale = d3.scaleLinear()
                .domain([0, confidenceIntervals[1] + 1])
                .range([0, innerWidth]);
            var yScale = d3.scaleLinear()
                .domain([0, d3.max(yValues)])
                .range([sessionHeight - margin.bottom - 20, 0]);
                
            
            var g = panelESvg.append('g')
                .attr('transform', `translate(${margin.left}, ${i * sessionHeight + margin.top})`)
                .attr('id', `session_${sessionsData[i].session_id}_distribution_chart`);

            g.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', sessionHeight)
                .attr('font-size', '0.7 em')
                .text(`Session ${sessionsData[i].session_id}`)
                .attr('text-anchor', 'middle');
                

                

            g.append('g').call(d3.axisBottom(xScale))
                .attr('transform', `translate(0, ${sessionHeight - margin.bottom - 20} )`);


            // Create line generator
            //console.log(points);
            var Gen = d3.line() 
                .x((p) => xScale(p.xpoint))
                .y((p) => yScale(p.ypoint))
                .curve(d3.curveBasis); 

            var aboveThresholdPoints = points.filter(function (d) { return d.xpoint >= 15; });


            //console.log(aboveThresholdPoints);
            var area = d3.area()
                .x((p) => xScale(p.xpoint))
                .y0(yScale(0))
                .y1((p) => yScale(p.ypoint) + 1);

            g.append('path')
                .attr('d', area(aboveThresholdPoints))
                .attr('fill', 'lightgray')

            // Draw the Poisson distribution curve
            g.append('path')
                .attr('d', Gen(points))
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .on('mouseover', function (event, d) {
                    d3.select('#tooltip')
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 55) + "px")
                        .style("opacity", 1)
                        .style("visibility", "visible")
                        .html("AHI: " + d.xpoint + "<br> Probability: " + (d.ypoint/0.5))
                    .style("text-align", "center");
                })
                .on("mouseleave", function(event, d) {
                    d3.select('#tooltip')
                    .style("opacity", 0)
                    .style("visibility", "hidden");

                })
                .on("mousemove", function(event, d) {
                    d3.select('#tooltip')
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY) - 55 + "px");
                });

            g.append('rect')
                .attr('x', xScale(0))
                .attr('y', 0)
                .attr('width', xScale(15))
                .attr('height', sessionHeight)
                .attr('fill', 'lightpink')
                .attr('opacity', 0.2);

            g.append('rect')
                .attr('x', xScale(15))
                .attr('y', 0)
                .attr('width', xScale(confidenceIntervals[1] + 1) - xScale(15))
                .attr('height', sessionHeight)
                .attr('fill', 'lightgreen')
                .attr('opacity', 0.2);


            g.selectAll('AHI_Dots')
                .data([AHI])
                .enter()
                .append('circle')
                .attr('cx', xScale(AHI))
                .attr('cy', sessionHeight - margin.bottom - 20)
                .attr('r', 5)
                .attr('fill', 'red')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('id', `session_${sessionsData[i].session_id}_AHI_dot`)
                .classed('AHI_Dots', true)
                .on('mouseover', function (event, d) {
                    d3.select(this).attr('fill', '#69b3a2');
                    d3.select(this).attr('fill-opacity', 0.5);
                    d3.select('#tooltip')
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 55) + "px")
                        .style("opacity", 1)
                        .style("visibility", "visible")
                        .html("Actual AHI: " + d)
                    .style("text-align", "center");
                })
                .on("mouseleave", function() {
                    d3.select(this).attr('fill', 'red');
                    d3.select(this).attr('fill-opacity', 1);
                    d3.select('#tooltip')
                    .style("opacity", 0)
                    .style("visibility", "hidden");

                })
                .on("mousemove", function(event, d) {
                    d3.select('#tooltip')
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY) - 55 + "px");
                });

        }

    }
}


function calculateAHI(sessionData) {
    var AHI = 0;
    var confidenceIntervals = [0, 0];
    var totalEvents = sessionData.events.Hypopnea.length + sessionData.events.ObstructiveApnea.length + sessionData.events.MixedApnea.length + sessionData.events.CentralApnea.length;
    var totalSleepTime = 0;
    Object.keys(sessionData.user_staged.sleep_stages).forEach(function (stage) {
        sessionData.user_staged.sleep_stages[stage].forEach(function (d) {
            totalSleepTime += d.Duration;
        });
    });
    var respiratoryEventTimes = [];
    Object.keys(sessionData.events).forEach(function (event) {
        sessionData.events[event].forEach(function (d) {
            respiratoryEventTimes.push(d.Start);
        });
    });
    respiratoryEventTimes.sort(function (a, b) { return a - b; });
    //console.log('Total Events: ' + totalEvents + ' Total Sleep Time: ' + totalSleepTime + ' Respiratory Event Times: ' + respiratoryEventTimes);
    totalSleepTime = totalSleepTime / (60*60);
    AHI = (totalEvents / totalSleepTime) ;

    //AHI = 14.03;
    confidenceIntervals[0] = Math.exp(Math.log(AHI) - (1.96 / Math.sqrt(totalEvents)));
    confidenceIntervals[1] = Math.exp(Math.log(AHI) + (1.96 / Math.sqrt(totalEvents)));

    //console.log('AHI: ' + AHI + ' Confidence Intervals: ' + confidenceIntervals);

    const xValues = Array.from({ length: confidenceIntervals[1] - confidenceIntervals[0] + 1 }, (_, i) => confidenceIntervals[0] + i);
    //console.log(xValues);

    function factorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // Calculate the corresponding y-values (probability densities) using Poisson distribution formula
    const yValues = xValues.map(x => Math.exp(-AHI) * Math.pow(AHI, x) / factorial(x));

    return [AHI, confidenceIntervals, xValues, yValues];

}




// Radar Chart reference


//RadarChart

var c_margin = { top: 20, right: 30, bottom: 30, left: 15 };
function drawPanelCCharts() {

    d3.select('.stage_selection_div').classed("hidden_class",false);

    var selectedStage = document.getElementById('stage_selector').value;

    if(selectedStage == "All Stages"){
        selectedStage = null;
    }

    var pulse_rate_data = null;

    all_sessions = selectedPatientData["sessions_data"];

    selectedSession = 1;

    displayedEvents = all_sessions[selectedSession-1];

    apnea_events = []

    stages = displayedEvents["user_staged"]["sleep_stages"];
    

    if(selectedStage){
        stagesToRetrieve = [selectedStage];
    }
    else{
        stagesToRetrieve = Object.keys(stages)
    }

    pulse_rate_data = [];

    for (const stage of stagesToRetrieve) {
        for(const section of stages[stage]){
            if(section["Duration"] != 0){
                pulse_rate_data.push(
                    section["Pulse_Rate"].map((x,idx)=>{ 
                        return {"time":idx+section["Start"],"value":x} })
                );

                for(const event in section["events"]){
                    for(const apnea_event of section["events"][event]){
                        apnea_events.push({
                            ...apnea_event,
                            "value":apnea_event["Pulse_Rate"]
                            [apnea_event["Start"] < section["Start"] ? section["Start"]-Math.floor(apnea_event["Start"]) : 0]
                        })
                    }
                }
            }
        }
    }


    pulse_rate_data.sort((a,b) => a["time"] - b["time"]);


    console.log(pulse_rate_data)
    
    drawC1Chart(pulse_rate_data,apnea_events);
    drawC2Chart(apnea_events);


}

function drawC1Chart(eventData,apnea_events) {

    var width = +d3.select('#sleep_stages_C_svg').style('width').replace('px', '');
    var height = +d3.select('#sleep_stages_C_svg').style('height').replace('px', '');
    c_width = width - c_margin.left - c_margin.right,
    c_height = 250 - c_margin.top - c_margin.bottom;

    d3.select("#sleep_stages_C_svg").select('text').remove();
    d3.select(".linegraph_g").remove();
    d3.select('.areachart-class').remove();

    // append the svg object to the body of the page
    var svg = d3.select("#sleep_stages_C_svg")
        .append("g")
        .attr("class","linegraph_g")
        .attr("transform",
            "translate(" + c_margin.left + "," + c_margin.top + ")");         

    
    const xScale = d3.scaleLinear()
        .domain([d3.min(eventData.map((data)=>data[0]), d => d.time), d3.max(eventData.map((data)=>data[data.length-1]), d => d.time)])
        .range([0, c_width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(eventData.map((data)=>d3.min(data,d=>d["value"])), d => d), d3.max(eventData.map((data)=>d3.max(data,d=>d["value"])), d => d)])
        .range([c_height, 0]);


    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.time) + c_margin.left)
        .y(d => yScale(d.value) + c_margin.top)
        .curve(d3.curveMonotoneX); 

    // Append the line to the SVG

    for(let event of eventData){

        svg.append("path")
        .datum(event)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line)
    }

    //set radius based on event duration
    svg.selectAll("circle")
        .data(apnea_events)
        .enter().append("circle")
        .attr("cx", d => xScale(d.Start)+c_margin.left)
        .attr("cy", d => yScale(d.value)+c_margin.top)
        .attr("r", d => (d.Duration/15)*4) // Radius of circles
        .attr("fill", "red")
        .attr("opacity", 0.5)
        .on("click",(d)=>{drawC2Chart([d.srcElement.__data__])});

    const g = svg.append("g")
        .attr('transform', 'translate(' + c_margin.left + ',' + c_margin.top + ')')

    g.append("g")
        .attr("transform", `translate(0, ${c_height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        // .attr("transform", `translate(${innerWidth}, 0)`)
        .call(d3.axisLeft(yScale));
}

function drawC2Chart(data) {
    data.sort((a,b) => a["Start"] - b["Start"]);

    d3.select('.areachart-class').remove();

    var width = +d3.select('#sleep_stages_C_svg').style('width').replace('px', '');

    c_width = width - 90 - c_margin.left - c_margin.right,
    c_height = 200 - c_margin.top - c_margin.bottom;

    areaChartData = [];

    var svg = d3.select("#sleep_stages_C_svg").append("g")
    .attr("class","areachart-class")
    .attr("transform",
        "translate(" + c_margin.left + "," + (c_margin.top+280) + ")");

    for(let j = 0; j< data.length;j++){
        for(let i=0;i<Math.floor(data[j]["Duration"]);i++){
            areaChartData.push({
                "Body": data[j]["Body"][i],
                'EEG_A1_A2': data[j]['EEG_A1_A2'][i],
                "EEG_C3_A2": data[j]["EEG_C3_A2"][i],
                "EEG_C4_A1": data[j]["EEG_C4_A1"][i],
                "Flow_Patient": data[j]["Flow_Patient"][i],
                "Effort_THO": data[j]["Effort_THO"][i],
                "Effort_ABD": data[j]["Effort_ABD"][i],
                "SpO2": data[j]["SpO2"][i],
                "Pulse_Rate": data[j]["Pulse_Rate"][i],
                "Tracheal": data[j]["Tracheal"][i],
                "time": data[j]["Start"] + i,
            })
        }
    }

    var keys = ['EEG_A1_A2','EEG_C3_A2','EEG_C4_A1','Flow_Patient','Effort_THO','Effort_ABD','SpO2','Body','Pulse_Rate','Tracheal']

    var x = d3.scaleLinear()
        .domain(d3.extent(areaChartData, function (d) { return d.time; }))
        .range([0, c_width]);
    
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([-250, 250])
        .range([c_height, 0]);

    const g = svg.append("g")
        .attr('transform', 'translate(' + c_margin.left + ',' + c_margin.top + ')')
    g.append("g")
        .attr("transform", "translate(0," + (c_height) + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-10px")
        .attr("dy", "0px")
        .attr("transform", "rotate(-45)");

    g.append("g")
        .call(d3.axisLeft(y));


    var color = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(keys)
        .range(d3.schemeDark2);

    
    var stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys)
        (areaChartData)

    let mouseOver = function (d) {
        d3.select('.attribute_info').select('text')
        .text(`This is a ${d.srcElement.className.baseVal} attribute`)
        d3.selectAll(".mylayers")
            .style("opacity", .5)
        d3.select(this)
            .style("opacity", 1)
    }

    let mouseLeave = function (d) {
        d3.select('.attribute_info').select('text').text("")
        d3.selectAll(".mylayers")
            .style("opacity", .7)
        d3.select(this)
            .style("opacity", .7)
    }
    svg
        .selectAll(".mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .style("fill", (d) => color(d.key) )
        .attr("class",(d)=>d.key)
        .attr("d", d3.area()
            .x(function (d, i) { return x(d.data.time)+c_margin.left; })
            .y0(function (d) { return y(d[0])+c_margin.top; })
            .y1(function (d) { return y(d[1])+c_margin.top; })
        )
        .attr("opacity",0.7)
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousmove", mouseOver)

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(0,0)")
        .selectAll("g")
        .data(color.domain())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${c_width+20},${c_height-150+(i*20)})`);

    legend.append("rect")
        .attr("x", 5)
        .attr("y",14)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", color)
        .style("stroke","black")
        .style("stroke-width",1);
    
    legend.append("text")
        .attr("x", 30)
        .attr("y", 20)
        .attr("dy", ".25em")
        .attr("font-size", 12)
        .style("text-anchor", "start")
        .text(d => d)


    svg.append("g")
        .attr("class", "attribute_info")
        .attr("transform",`translate(${(c_width/2)-50},220)`)
        .append("text")
        .attr("x", 30)
        .attr("y", 20)
        .attr("dy", ".25em")
        .attr("font-size", 12)
        .attr("opacity",1)
        .text("");

}







