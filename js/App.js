//Global Variables
var clock = 0

var opMode = "Normal"
var waterValveStatus = true
var waterPumpStatus = true
var simRate = 1

var T1 = 43200
var T2 = 129600
const baseT1 = 43200
const baseT2 = 129600

//
var valveState = document.getElementById("valveState")
var pumpState = document.getElementById("pumpState")
var timeSinceRefilT1 = document.getElementById("timeSinceRefilT1")
var timeSinceRefilT2 = document.getElementById("timeSinceRefilT2")

//Update Global Clock
setInterval(() => {
    clock++
}, simRate)

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

///////////////
//SIM BACKEND//
///////////////
async function updateTank1 () {
    setInterval(() => {
        if (opMode == "Normal") {
            var value = (1 - (T1 / 43200)) * 100
    
            timeSinceRefilT1.textContent = Math.round((T1 / 3600) * 100) / 100 + " Hours"
    
            setLevel(value, "tank1")
        }
    }, simRate);
}

async function updateTank2 () {
    setInterval(() => {
        if (opMode == "Normal") {
            var value = (1 - (T2 / 129600)) * 100
    
            timeSinceRefilT2.textContent = Math.round((T2 / 3600) * 100) / 100 + " Hours"
    
            setLevel(value, "tank2")
        }
    }, simRate);
}

async function fillTank1 () {
    setInterval(() => {
        if (waterValveStatus == true && opMode == "Normal") {
            T1 = T1 - 2
            valveState.textContent = "Operating"

            valveState.classList.remove("text-secondary")
            valveState.classList.add("text-success")
        } else {
            valveState.textContent = "Stand By"

            valveState.classList.remove("text-success")
            valveState.classList.add("text-secondary")
        }
    }, simRate);
}

async function fillTank2 () {
    setInterval(() => {
        if (waterPumpStatus == true && opMode == "Normal") {
            T2 = T2 - 2
            pumpState.textContent = "Operating"

            pumpState.classList.remove("text-secondary")
            pumpState.classList.add("text-success")
        } else {
            pumpState.textContent = "Stand By"

            pumpState.classList.remove("text-success")
            pumpState.classList.add("text-secondary")
        }
    }, simRate);
}

async function drainTank1 () {
    setInterval(() => {
        if (T1 < baseT1 && waterValveStatus == false && opMode == "Normal") {
            T1++
        }
    }, simRate);
}

async function drainTank2 () {
    setInterval(() => {
        if (T2 < baseT2 && waterPumpStatus == false && opMode == "Normal") {
            T2++
        }
    }, simRate);
}

//Manage tanks
async function manageTank1 () {
    setInterval(() => {
        if (T1 <= 0) {
            waterValveStatus = false
        }

        if (T1 >= baseT1 / 2 && opMode == "Normal") {
            waterValveStatus = true
        }
    }, simRate);
}

async function manageTank2 () {
    setInterval(() => {
        if (T2 <= 0) {
            waterPumpStatus = false
        }

        if (T2 >= baseT2 / 2 && opMode == "Normal") {
            waterPumpStatus = true
        }
    }, simRate);
}




function launch() {
    updateTank1()
    updateTank2()
    fillTank1()
    fillTank2()
    drainTank1()
    drainTank2()
    manageTank1()
    manageTank2()

    document.getElementById("emergency").removeAttribute("disabled")

    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
    document.getElementById("statusColour").classList.add("bg-success")
    document.getElementById("statusColour").classList.remove("bg-danger")
    document.getElementById("statusColour").classList.remove("bg-secondary")
}

document.getElementById("start").addEventListener('click', (e) => {
    e.target.classList.add("d-none")

    document.getElementById("pause").classList.remove("d-none")
    launch()
})

document.getElementById("emergency").addEventListener('click', (e) => {
    //Emergency: Manual Stop
    document.getElementById("operationStatusBar").textContent = "Current Operational Status: Emergency: Manual stop"
    document.getElementById("statusColour").classList.add("bg-danger")
    document.getElementById("statusColour").classList.remove("bg-success")
    document.getElementById("statusColour").classList.remove("bg-secondary")

    document.getElementById("pause").setAttribute("disabled", "disabled")

    opMode = "Emergency: Manual stop"

    waterPumpStatus = false
    waterValveStatus = false
    setTimeout(() => {
        document.getElementById("operationStatusBar").textContent = "Current Operational Status: Normal"
        document.getElementById("statusColour").classList.add("bg-success")
        document.getElementById("statusColour").classList.remove("bg-danger")
        document.getElementById("statusColour").classList.remove("bg-secondary")

        document.getElementById("pause").removeAttribute("disabled")

        opMode = "Normal"
    }, 240);
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