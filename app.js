var express = require("express");
var app = express();
var request = require("request");
var bodyParser = require("body-parser");
var firebase = require("firebase");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "pug");

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDGiyxfhk_xlNfC2wLuxcYK5vvMNUSk9bA",
  authDomain: "clout-jar.firebaseapp.com",
  databaseURL: "https://clout-jar.firebaseio.com",
  storageBucket: "<BUCKET>.appspot.com",
};
firebase.initializeApp(config);
var database = firebase.database();

app.get("/", function(req, res){

    var date = new Date();
    var isoDate = date.toISOString();

    var url = "https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=" + isoDate + "&l=NBA";

    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	var data = JSON.parse(body);
            res.render("index", {data});
        }
    });
});

app.get("/:gameid", function(req, res){

	var gameId = req.params.gameid;

	var url = "https://www.thesportsdb.com/api/v1/json/1/lookupevent.php?id=" + gameId;

    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	var data = JSON.parse(body);
            res.render("game", {data});
        }
    });
});

app.get("/:gameid/bet", function(req, res){
	
	var gameId = req.params.gameid;

	var url = "https://www.thesportsdb.com/api/v1/json/1/lookupevent.php?id=" + gameId;

    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	var data = JSON.parse(body);
            res.render("bet", {data});
        }
    });
});

app.post("/:gameid", function(req, res){

	var gameId = req.params.gameid;
	var name = req.body.name;
	var team = req.body.team;
	var newAmount = parseInt(req.body.amount);

	database.ref("/Pot").once("value", function(data) {
		var db = data.val();
		var newPotAmount = db.amount + newAmount;
		database.ref("/Pot").update({
			amount: newPotAmount
		});
	});

	database.ref("Users" +"/" + name).set({
		bet: {[team]: newAmount}
	});

	res.redirect("/" + gameId);

});



// SERVER
app.listen(process.env.PORT || 3000, function(){
	console.log("Server started!");
});