const PARAMETERS = {
    "color": {
        "type": "color",
        "value": "#000000"
    },
    "candName": {
        "type": "text",
        "placeholder": "Candidate"
    },
    "economic": {
        "type": "number",
        "min": -100,
        "max": 100,
        "value": 0,
    },
    "freedom": {
        "type": "number",
        "min": -100,
        "max": 100,
        "value": 0,
    },
    "social": {
        "type": "number",
        "min": -100,
        "max": 100,
        "value": 0,
    },
    "popularity": {
        "type": "number",
        "min": 0,
        "max": 100,
        "value": 50,
    },
    "nameRec": {
        "type": "number",
        "min": 0,
        "max": 100,
        "value": 50,
    },
    "effectiveness": {
        "type": "number",
        "min": 0,
        "max": 100,
        "value": 50,
    },
    "tolerance": {
        "type": "number",
        "min": 0,
        "max": 250,
        "value": 100,
        "whitelist": "state"
    }
}
var CANDIDATES = [];


class Candidate {

    constructor(rowElement, ignoreList){
        this.rowElement = rowElement;


        
        var t2 = this;

        function onUpdate(){
            var dataPm = $(this).attr("data-pm");

            if (dataPm == null) return;

            console.log(dataPm);

            if(PARAMETERS[dataPm]['type'] == "number"){
                t2[dataPm] = parseInt($(this).val());
            } else {
                t2[dataPm] = $(this).val();
            }
        
            $(document).trigger("pm-update");
        }

        $(this.rowElement).find("input").on("change", onUpdate);
        $(this.rowElement).find("input").each(onUpdate);

        if (ignoreList == null || !ignoreList) CANDIDATES.push(this);


        $(document).on("pm-update", function(){
            t2.updatePin();
        });

        this.updatePin();

    }

    delete(){

        if(this.pin != null){
            this.pin.remove();
        }

        CANDIDATES = CANDIDATES.filter(c=> {
            return !$(c.rowElement).is($(this.rowElement));
        })

        $(this.rowElement).remove();
    }

    addPoints(num){
        this.points += num;
    }
    setPoints(num){
        this.points = num;
    }
    getPoints(){
        return this.points;
    }

    static add(){

        var row = $(`<tr id="candidate-${CANDIDATES.length+1}"></tr>`);

        [].forEach.call(Object.keys(PARAMETERS), param => {


            if (Object.keys(PARAMETERS[param]).includes("whitelist")) return;


            var td = $(`<td></td>`);

            var input = $(`<input class='form-control' data-pm='${param}'/>`);

            if(PARAMETERS[param]["type"] == "color") input.removeClass("form-control");

            [].forEach.call(Object.keys(PARAMETERS[param]), p2 => {
                input.attr(p2, PARAMETERS[param][p2]);
            });

            this[param] = input.val();

            input.appendTo(td);

            td.appendTo(row);
        });

        row.appendTo($("#candidateTable"));

        return new Candidate(row);
    }

    updatePin(){

        var topMargin = 100 - (this.freedom + 100)/2;
        var leftMargin = (this.economic + 100)/2;

        var pin = $(`<div class='pin' id='pin-${Math.random()}' style='background-color: ${this.color}; margin-left: ${leftMargin}%; margin-top: ${topMargin}%'></div>`);

        if (this.pin != null){
            this.pin.remove();
        }

        this.pin = pin.appendTo($("#pinGrid"));

    }

}

class State extends Candidate {

    constructor(element, ignoreList){
        super(element, ignoreList);
    }

    updatePin(){

        var topMargin = 100 -(this.freedom + 100)/2;
        var leftMargin = (this.economic + 100)/2;

        var pin = $(`<div class='pin' style='color: black; margin-left: ${leftMargin}%; margin-top: ${topMargin}%'></div>`);

        if (this.pin != null){
            this.pin.remove();
        }

        this.pin = pin.appendTo($("#pinGrid"));

    }

}

var STATE = new State($("#stateInputs"), true);

function importCandidates(jsonFile){

    var element = document.createElement("input");
    element.setAttribute("type", "file");

    document.body.appendChild(element);

    element.click();

    $(element).change(function(){

        var fr = new FileReader();
        var files = element.files;

        if (files.length <= 0) return;

        fr.onload = function(e){

            var result = JSON.parse(e.target.result);
            
            // Load candidates

            while (CANDIDATES.length > 0){
                CANDIDATES.at(-1).delete();
            }

            var candidateId = 0;

            for (var candidate of result){

                element.remove();

                var cand = Candidate.add();
                
                var elem = $("#candidate-"+candidateId);

                for (var key of Object.keys(candidate)){
                    
                    if (key == "rowElement" || key == "pin") continue;

                    cand.rowElement.find(`input[data-pm='${key}']`).val(candidate[key]);
                    cand[key] = candidate[key];
                }

            }



        }

        fr.readAsText(files.item(0));



    })

}

function exportCandidates(){

    if (CANDIDATES.length == 0) return;

    var jsonData = JSON.stringify(CANDIDATES);

    var data = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);

    var element = document.createElement('a');
    element.setAttribute('href', data);
    element.setAttribute('download', "candidates.json");


    document.body.appendChild(element);

    element.click();

    setTimeout(function(){
        document.body.removeChild(element);
        window.URL.revokeObjectURL(data);
    });

}

const worker = new Worker("./js/model.js");

var canvas = document.querySelector("#canvas");
var context = canvas.getContext('2d');

function drawPixel(context, x, y, color, size) {


    var width = context.canvas.offsetWidth;
    var height = context.canvas.offsetHeight;
  
    var scaleX = width / 200;
    var scaleY = height / 200;
  
    x = (x + 100) * scaleX;
    y = (y + 100) * scaleY;
  
    var roundedX = Math.round(x);
    var roundedY = height - Math.round(y);
    context.fillStyle = color || '#000';

    context.fillRect(roundedX, roundedY, size * (width / 100), size * (height / 100));
}
  

worker.onmessage = function(message){

    if(message.data[0] == "drawPixel"){
        drawPixel(context, message.data[1], message.data[2], message.data[3], message.data[4]);
    }


    if(message.data[0] == "return"){

        let candidates = message.data[1];

        $("#results").children().remove();

        let totalVotes = candidates.reduce((sum, a) => sum + a.votes, 0);

        [].forEach.call(candidates, cand => {

            cand.percent = parseFloat(Math.round((cand.votes / totalVotes)*100 * 100) / 100).toFixed(2);
            
            var resultDiv = $(`<div class='result'></div>`)

            resultDiv.attr(
                "style", `background: linear-gradient(to right, ${cand.color} 0%, ${cand.color} ${cand.percent}%, transparent ${cand.percent}%, transparent 100%)`
            );

            var candName = cand.candName == "" ? "Unnamed" : cand.candName;

            resultDiv.html(`<span>${candName} - ${cand.percent}%</span>`)

            resultDiv.appendTo($("#results"));

        });

    }

}

async function runModel(){

    //context.fillStyle = "#fff";
    //context.fillRect(0, 0, context.canvas.offsetWidth, context.canvas.offsetHeight);

    let state = JSON.parse(JSON.stringify(STATE));
    let candidates = JSON.parse(JSON.stringify(CANDIDATES));
    let step = parseFloat($("input[data-pm=resolution]").val()) || 0;

    

    worker.postMessage([state, candidates, step]);

}


$("#exportCandidates").click(function(){

    exportCandidates();

});

$("#importCandidates").click(function(){

    importCandidates();


});

// Create Candidate
$("#addCandidate").click(function(){
    Candidate.add();
});

// Remove Candidate
$("#removeCandidate").click(function(){

    if (CANDIDATES.length <= 1) return;

    CANDIDATES.at(-1).delete();

});

$("#runModel").click(runModel);

$(document).ready(function(){

    Candidate.add();

});