//Global Variables
var clock = 0

var opMode = "Offline"
var waterValveStatus = true
var waterPumpStatus = true
var simRate = 1000
var leak = false
var timeOfLastEmergency = 0

var T1 = 43200
var T2 = 129600
const baseT1 = 43200
const baseT2 = 129600
var clockInterval

//initilise Elements
var valveState = document.getElementById("valveState")
var pumpState = document.getElementById("pumpState")
var timeSinceRefilT1 = document.getElementById("timeSinceRefilT1")
var timeSinceRefilT2 = document.getElementById("timeSinceRefilT2")
var globalClockDisplay = document.getElementById("globalClockDisplay")
var taskListDisplay = document.getElementById("taskListDisplay")

///////////////////
//Tank Management//
///////////////////

function tank1Management () {
    //Check if tank 1 is not full
    if (T1 >= 0) {
        //Open the valve
        waterValveStatus = true
    
        //Queue the water pump to turn off after half the time of T1
        setTask(T1 * 0.5, "Close Valve", () => {
            //Close the valve
            waterValveStatus = false

            setTask(21600, "Open Valve", () => {
                //Restart the loop
                tank1Management()
            })
        })
    } else {
        //If the tank is actually over full it will wait half the time for half of the tank to empty
        setTask(21600, "Open Valve", () => {
            tank1Management()
        })
    }
}

function tank2Management () {
    //Check if tank 2 is not full
    if (T2 >= 0) {
        //Turn On Water Pump
        waterPumpStatus = true
    
        //Queue the water pump to turn off after half the time of T2
        setTask(T2 * 0.5, "Turn Off Pump", () => {
            //Turn Off Water Pump
            waterPumpStatus = false

            setTask(64800, "Turn On Pump", () => {
                //Restart the loop
                tank2Management()
            })
        })
    } else {
        //If the tank is actually over full it will wait half the time for half of the tank to empty
        setTask(64800, "Turn On Pump", () => {
            tank2Management()
        })
    }
}

function checkForLeaks () {
    if (T1 >= baseT1 && T2 >= baseT2 && opMode == "Normal" && timeOfLastEmergency <= clock - 100) {
        //Emergency: Water Reservoir Empty
        var currentPumpStatus = waterPumpStatus
        var currentValveStatus = waterValveStatus

        leak = false
        document.getElementById("startLeak").classList.remove("d-none")
        document.getElementById("stopLeak").classList.add("d-none")
        
        document.getElementById("operationStatusBar").textContent = "Current Operational Status: Emergency: Water Reservoir Empty"
        document.getElementById("statusColour").classList.add("bg-danger")
        document.getElementById("statusColour").classList.remove("bg-success")
        document.getElementById("statusColour").classList.remove("bg-secondary")
    
    
        opMode = "Emergency: Water Reservoir Empty"
    
        waterPumpStatus = false
        waterValveStatus = false

        document.getElementById("pause").setAttribute("disabled", "disabled")
        document.getElementById("emergency").setAttribute("disabled", "disabled")
        document.getElementById("startLeak").setAttribute("disabled", "disabled")
        document.getElementById("stopLeak").setAttribute("disabled", "disabled")
        
        taskList = []
        
        setTask(600, "Emergency: Water Reservoir Empty", () => {
            timeOfLastEmergency = clock
            opMode = "Normal"
            
            document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
            document.getElementById("statusColour").classList.add("bg-success")
            document.getElementById("statusColour").classList.remove("bg-danger")
            document.getElementById("statusColour").classList.remove("bg-secondary")
    
            document.getElementById("pause").removeAttribute("disabled")
            document.getElementById("emergency").removeAttribute("disabled")
            document.getElementById("startLeak").removeAttribute("disabled")
            document.getElementById("stopLeak").removeAttribute("disabled")

            //Reactivate System
            tank1Management()
            tank2Management()
    
            waterPumpStatus = currentPumpStatus
            waterValveStatus = currentValveStatus
        })
    }
}


////////////////////////////
//BACK END SIMULATION CODE//
////////////////////////////
//The code in this section is not part of the usual project but it is nessecary to for the simulation to work and the management code above to work

//Function to easily set the level of each of the tanks
async function setLevel (value, tankName) {
    var tank = document.getElementById(tankName)
    
    tank.setAttribute("style", "width:" + value + "%")
    tank.setAttribute("aria-valuenow", value)
    tank.textContent = Math.round(value * 10) / 10 + "%"

    tank.classList.remove("bg-success")
    tank.classList.remove("bg-secondary")
    tank.classList.remove("bg-danger")

    if (value < 100 && value >= 50) {
        tank.classList.add("bg-success")
    } else if (value < 50 && value >= 25) {
        tank.classList.add("bg-secondary")
    } else {
        tank.classList.add("bg-danger")
    }
}

setLevel(26, "tank1")
setLevel(100, "tank2")
async function updateTank1 () {
    if (opMode == "Normal") {
        var value = (1 - (T1 / 43200)) * 100

        timeSinceRefilT1.textContent = Math.round((T1 / 3600) * 100) / 100 + " Hours"

        setLevel(value, "tank1")
    }
}

async function updateTank2 () {
    if (opMode == "Normal") {
        var value = (1 - (T2 / 129600)) * 100

        timeSinceRefilT2.textContent = Math.round((T2 / 3600) * 100) / 100 + " Hours"

        setLevel(value, "tank2")
    }
}

async function fillTank1 () {
    if (waterValveStatus == true && opMode == "Normal") {
        T1 = T1 - 2
        valveState.textContent = "Operating"

        valveState.classList.remove("text-danger")
        valveState.classList.remove("text-secondary")
        valveState.classList.add("text-success")
    } else if (opMode == "Emergency: Manual Stop" || opMode == "Emergency: Water Reservoir Empty") {
        valveState.textContent = "Emergency Shut off"

        valveState.classList.add("text-danger")
        valveState.classList.remove("text-success")
        valveState.classList.remove("text-secondary")
    }  else {
        valveState.textContent = "Stand By"

        valveState.classList.remove("text-danger")
        valveState.classList.remove("text-success")
        valveState.classList.add("text-secondary")
    }
}

async function fillTank2 () {
    if (waterPumpStatus == true && opMode == "Normal") {
        T2 = T2 - 2
        pumpState.textContent = "Operating"

        pumpState.classList.remove("text-danger")
        pumpState.classList.remove("text-secondary")
        pumpState.classList.add("text-success")
    } else if (opMode == "Emergency: Manual Stop" || opMode == "Emergency: Water Reservoir Empty") {
        pumpState.textContent = "Emergency Shut off"

        pumpState.classList.add("text-danger")
        pumpState.classList.remove("text-success")
        pumpState.classList.remove("text-secondary")
    } else {
        pumpState.textContent = "Stand By"

        pumpState.classList.remove("text-danger")
        pumpState.classList.remove("text-success")
        pumpState.classList.add("text-secondary")
    }
}

async function drainTank1 () {
    if (T1 < baseT1 && waterValveStatus == false && opMode == "Normal") {
        T1++
    }
}

async function drainTank2 () {
    if (T2 < baseT2 && waterPumpStatus == false && opMode == "Normal") {
        T2++
    }
}

async function leakTanks() {
    if (leak == true) {
        if (T1 <= baseT1) {
            T1 = T1 + 6
        } else {
            T1 = baseT1
        }
        if (T2 <= baseT2) {
            T2 = T2 + 6
        } else {
            T2 = baseT2
        }
    }
}

async function updateClockDisplay (clock) {
    globalClockDisplay.textContent = convertToReadableTime(clock)
}

function convertToReadableTime (time) {
    time = time * 1000
    let days = Math.floor(time / (1000*60*60*24));
    let hours = Math.floor(time % (1000*60*60*24) / (1000*60*60));
    let minutes = Math.floor(time % (1000*60*60)/ (1000*60));
    let seconds = Math.floor(time % (1000*60) / 1000);
    
    if (days == 1) {days = days + " day, "} else if (days == 0) {days = ''} else {days = days + " days, "}
    if (hours == 1) {hours = hours + " hour, "} else if (hours == 0) {hours = ''} else {hours = hours + " hours, "}
    if (minutes == 1) {minutes = minutes + " minute and "} else if (minutes == 0) {minutes = ''} else {minutes = minutes + " minutes and "}
    if (seconds == 1) {seconds = seconds + " second"} else {seconds = seconds + " seconds"}

    return(days + " " + hours + " " + minutes + " " + seconds)
}

var taskList = []

function launch() {

    //Update Global Clock
    clockInterval = setInterval(() => {
        if (opMode != "Pause" && opMode != "Offline") {
            //Leak Debug Function
            leakTanks()

            //Manage Tank Level
            fillTank1()
            fillTank2()
            drainTank1()
            drainTank2()
            //manageTank1()
            //manageTank2()
    
            //Manage Visual Elements
            updateTank1()
            updateTank2()

            checkForLeaks()
    
            updateClockDisplay(clock)

            runTasks(clock)
            updateTasks()
    
            clock++
        }
    }, simRate)
}

async function setSimRate (value) {
    simRate = 1000 / value
    clearInterval(clockInterval)
    launch()
}

document.getElementById("setSimRateBtn").addEventListener('click', (e) => {
    var value = parseInt(document.getElementById("simRateInput").value)

    if (value <= 1000) {
        setSimRate(value)
    }
})

function setTask (delay, name, code) {
    taskList.push([clock + delay, name, code])
}

async function runTasks (clock) {
    taskList.forEach(element => {
        if (element[0] == clock){
            element[2]()

            var found = taskList.findIndex(index => index[0] == element[0])
            taskList.splice(found, 1)
        }
    })
}

async function updateTasks () {
    var HTMLInput = ""

    taskList.forEach(element => {
        HTMLInput = HTMLInput + "<tr><td>" + element[1] +"</td><td>" + convertToReadableTime(element[0]) +"</td></tr>"
    })

    taskListDisplay.innerHTML = HTMLInput
}

document.getElementById("start").addEventListener('click', (e) => {
    e.target.classList.add("d-none")
    opMode = "Normal"

    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
    document.getElementById("emergency").removeAttribute("disabled")
    document.getElementById("statusColour").classList.add("bg-success")
    document.getElementById("statusColour").classList.remove("bg-danger")
    document.getElementById("statusColour").classList.remove("bg-secondary")

    document.getElementById("pause").classList.remove("d-none")
    
    tank1Management()
    tank2Management()

    launch()
})

document.getElementById("emergency").addEventListener('click', (e) => {
    //Emergency: Manual Stop
    var currentPumpStatus = waterPumpStatus
    var currentValveStatus = waterValveStatus
    
    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Emergency: Manual stop"
    document.getElementById("statusColour").classList.add("bg-danger")
    document.getElementById("statusColour").classList.remove("bg-success")
    document.getElementById("statusColour").classList.remove("bg-secondary")

    document.getElementById("pause").setAttribute("disabled", "disabled")

    opMode = "Emergency: Manual Stop"

    waterPumpStatus = false
    waterValveStatus = false
        
    for (let i = 0; i < taskList.length; i++) {
        taskList[i][0] = taskList[i][0] + 240
    }

    
    setTask(240, "Emergency Button", () => {
        document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
        document.getElementById("statusColour").classList.add("bg-success")
        document.getElementById("statusColour").classList.remove("bg-danger")
        document.getElementById("statusColour").classList.remove("bg-secondary")

        document.getElementById("pause").removeAttribute("disabled")

        opMode = "Normal"

        waterPumpStatus = currentPumpStatus
        waterValveStatus = currentValveStatus
    })
})

document.getElementById("pause").addEventListener('click', (e) => {
    opMode = "Pause"
    document.getElementById("pause").classList.add("d-none")
    document.getElementById("play").classList.remove("d-none")

    document.getElementById("emergency").setAttribute("disabled", "disabled")

    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Paused"
    document.getElementById("statusColour").classList.add("bg-secondary")
    document.getElementById("statusColour").classList.remove("bg-success")
    document.getElementById("statusColour").classList.remove("bg-danger")
})

document.getElementById("play").addEventListener('click', (e) => {
    opMode = "Normal"
    document.getElementById("play").classList.add("d-none")
    document.getElementById("pause").classList.remove("d-none")

    document.getElementById("emergency").removeAttribute("disabled")

    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
    document.getElementById("statusColour").classList.add("bg-success")
    document.getElementById("statusColour").classList.remove("bg-danger")
    document.getElementById("statusColour").classList.remove("bg-secondary")
})

document.getElementById("startLeak").addEventListener('click', (e) => {
    leak = true

    document.getElementById("startLeak").classList.add("d-none")
    document.getElementById("stopLeak").classList.remove("d-none")
})

document.getElementById("stopLeak").addEventListener('click', (e) => {
    leak = false

    document.getElementById("startLeak").classList.remove("d-none")
    document.getElementById("stopLeak").classList.add("d-none")
})