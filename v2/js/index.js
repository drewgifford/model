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
    "deviation": {
        "type": "number",
        "min": 0,
        "max": 100,
        "value": 45,
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

        var topMargin = 100 - (this.social + 100)/2;
        var leftMargin = (this.economic + 100)/2;

        var pin = $(`<div class='pin' id='pin-${Math.random()}' style='color: ${this.color}; margin-left: ${leftMargin}%; margin-top: ${topMargin}%'></div>`);
        var pinIcon = $(`<i class="las la-map-marker"></i>`);

        pinIcon.appendTo(pin);

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

        var topMargin = 100 -(this.social + 100)/2;
        var leftMargin = (this.economic + 100)/2;

        var pin = $(`<div class='pin' style='color: black; margin-left: ${leftMargin}%; margin-top: ${topMargin}%'></div>`);
        var pinIcon = $(`<i class="las la-star"></i>`);

        pinIcon.appendTo(pin);

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

function runModel(){

    var output = Model.run(STATE, CANDIDATES);

    var candidates = output;
    
    $("#results").children().remove();

    [].forEach.call(candidates, cand => {
        
        var resultDiv = $(`<div class='result'></div>`)

        resultDiv.attr(
            "style", `background: linear-gradient(to right, ${cand.color} 0%, ${cand.color} ${cand.percent}%, transparent ${cand.percent}%, transparent 100%)`
        );

        var candName = cand.candName == "" ? "Unnamed" : cand.candName;

        resultDiv.html(`<span>${candName} - ${cand.percent}%</span>`)

        resultDiv.appendTo($("#results"));

    });


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