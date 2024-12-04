const partyWeight = 10,
    policyWeight = 4,
    visitWeight = 4;
var initialPoints = 300;
$("#race-level").change(function() {
    type = $("#race-level").val()
});
var candidates = 1;

function getPartyStr(a, e, t) {
    return `<div class="result" style="background: linear-gradient(to right, ${t} 0%, ${t} ${e}%, transparent ${e}%, transparent 100%)"><p>${a}</p></div>`
}

function findInput(a, e) {
    return a.find(`*[name='${e}'`)
}
$("#add").click(function() {
    candidates++;
    var a = $(".template").html();
    $(".candidates").append(`<div class="candidate" id="candidate${candidates}">${a}</div>`)
}), $("#remove").click(function() {
    candidates--, $(".candidate:last-of-type").remove()
}), $("#simulation").click(function() {
    var a = {},
        e = $("#race-rating").val(),
        t = 0;
    switch (e) {
        case "verySafeR":
            t = 100;
            break;
        case "safeR":
            t = 70;
            break;
        case "veryLikelyR":
            t = 30;
            break;
        case "likelyR":
            t = 10;
            break;
        case "leanR":
            t = 5;
            break;
        case "tiltR":
            t = 2;
            break;
        case "verySafeD":
            t = -100;
            break;
        case "safeD":
            t = -70;
            break;
        case "veryLikelyD":
            t = -30;
            break;
        case "likelyD":
            t = -10;
            break;
        case "leanD":
            t = -5;
            break;
        case "tiltD":
            t = -2
    }
    var i = 0,
        n = 0,
        r = 0;
    for (var c in $(".candidates .candidate").each(function(a) {
            var e = findInput($(this), "party").val();
            e.includes("Gop") && n++, e.includes("Dem") && r++
        }), $(".candidates .candidate").each(function(e) {
            var c, s = $(this),
                d = findInput(s, "name"),
                l = findInput(s, "party"),
                o = findInput(s, "policy"),
                p = findInput(s, "ads"),
                v = findInput(s, "visit"),
                u = findInput(s, "incumbency"),
                b = findInput(s, "popularity"),
                k = 0;
            switch (l.val()) {
                case "Gop":
                    c = 100 + t;
                    break;
                case "Dem":
                    c = 100 - t;
                    break;
                case "indGop":
                    c = 80 + t;
                    break;
                case "indDem":
                    c = 80 - t;
                    break;
                case "ind":
                    c = 80 - Math.abs(t) + 1 / 3 * initialPoints;
                    break;
                default:
                    c = 100

            
            // i'm looking back at this right now and i have no clue what this is. pretty sure it's just obfuscated model code
            
            }(c *= 10) < 0 && (c = 0);
            var f = 4 * o.val(),
                h = (.75 * Math.sqrt(f / 100) + .25) * (150 * Math.sqrt(p.val())),
                m = (.75 * Math.sqrt(f / 100) + .25) * (800 * Math.sqrt(v.val()));
            (k += c + f + (500 * Math.sqrt(b.val() / 50) + v.val() * (b.val() / 50)) + m + h) <= 0 && (k = 0), l.val().includes("Gop") && (k += 1 / n * initialPoints), l.val().includes("Dem") && (k += 1 / r * initialPoints);
            var y = h + m;
            "indDem" == l.val() && (r > 1 && n >= 1 && y < 1500 && (k -= c, k += Math.sqrt(y / 1500) * c + 30));
            "indGop" == l.val() && (n > 1 && r >= 1 && y < 1500 && (k -= c, k += Math.sqrt(y / 1500) * c + 30));
            "ind" == l.val() && ((n >= 1 || r >= 1) && y < 1500 && (k -= c, k += Math.sqrt(y / 1500) * c + 30));
            u.is(":checked") && (k += 100), a[e] = {
                name: d.val(),
                party: l.val(),
                points: k,
                incumbent: u.is(":checked")
            }, i += k
        }), $(".results").html(""), a) {
        var s = a[c],
            d = s.points,
            l = "Ind",
            o = "rgb(230,183,0)";
        switch (s.party) {
            case "Dem":
                l = "D", o = "rgb(28,64,140)";
                break;
            case "indDem":
                l = "Ind-D", o = "rgb(87,124,204)";
                break;
            case "Gop":
                l = "R", o = "rgb(191,29,41)";
                break;
            case "indGop":
                l = "Ind-R", o = "rgb(255,88,101)"
        }
        var p = (d / i * 100).toFixed(2),
            v = `${s.name} (${l}`;
        s.incumbent && (v += "-inc"), v += `) - ${p}%`, "rick astley" == s.name.toLowerCase() ? $(".results").append('<div class="result"><iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>') : $(".results").append(getPartyStr(v, p, o))
    }
});