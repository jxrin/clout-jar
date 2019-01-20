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

    var url = "https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=" + "2019-01-10" + "&l=NBA";

    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	var data = JSON.parse(body);
            res.render("index", {data});
        }
    });
});

app.get("/dashboard", function(req, res){
	database.ref("Users").once("value", function(data){
		var users = data.val(); // { Jevin: { bet: { TORvsPHX: 20} } 
		
		const usersList = [];
		Object.keys(users).forEach(user => {
			const userData = users[user];
			const valueObj = {};
			valueObj[user] = userData;
			usersList.push(valueObj);
		});

		let responseArr = []
		var gameScores = new Promise(function(resolve, reject) {

			for(let i = 0; i < usersList.length; i++) {
				let user = Object.keys(usersList[i])[0];
				var url = "https://www.thesportsdb.com/api/v1/json/1/lookupevent.php?id=" + usersList[i][user].gameid;
				setTimeout(() => {

				}, 200)
			    request(url, function(error, response, body){
			        if(!error && response.statusCode == 200){
			        	var data = JSON.parse(body);
			            responseArr.push(data);
			            if(i === usersList.length - 1) {
			            	setTimeout(() => {resolve();}, 200)
			            	
			            }

			        }

			        if(error) {
			        	console.log(error)
			        	reject();
			        }

			    });
			}
		});

		gameScores.then(function() {
			var failed = false;
			responseArr.reverse();

			for(let i = 0; i < usersList.length; i++){

				let userKey = Object.keys(usersList[i])[0];
				console.log(userKey);
				// console.log(usersList[i][userKey]);
				let team = Object.keys(usersList[i][userKey].bet)[0];
				console.log(team);

				console.log(responseArr);

				console.log(responseArr[i].events[0].intHomeScore);
				console.log(responseArr[i].events[0].intAwayScore);
				console.log(responseArr[i].events[0].strHomeTeam);
				console.log(parseInt(responseArr[i].events[0].intHomeScore) > parseInt(responseArr[i].events[0].intAwayScore));
				console.log(team == responseArr[i].events[0].strHomeTeam);
				// console.log(responseArr[i].events[0].intHomeScore);
				// console.log(responseArr[i].events[0].intAwayScore);
				// console.log(responseArr[i].events[0].strHomeTeam);
				// console.log(responseArr[i].events[0].strAwayTeam);

				//if data hasn't loaded in yet
				if(responseArr[i].events[0].intHomeScore === null ){

					console.log("fail");
					failed = true;

				//Check if home team won and user picked them
				} else if((parseInt(responseArr[i].events[0].intHomeScore) > parseInt(responseArr[i].events[0].intAwayScore)) && (team == responseArr[i].events[0].strHomeTeam)) {
					
					console.log("home");
					database.ref("/Users/" + userKey).once("value", function(data) {
						var db = data.val();
						var newCloutAmount = db.clout + Math.floor(db.bet[team] / 25);
						database.ref("/Users/" + userKey).update({
							clout: newCloutAmount
						});
					});
					failed = false;
					
				//Check if away team won and user picked them
				} else if((parseInt(responseArr[i].events[0].intHomeScore) < parseInt(responseArr[i].events[0].intAwayScore)) && (team == responseArr[i].events[0].strAwayTeam)) {

					console.log("away");
					database.ref("/Users/" + userKey).once("value", function(data) {
						var db = data.val();
						var newCloutAmount = db.clout + Math.floor(db.bet[team] / 25);
						database.ref("/Users/" + userKey).update({
							clout: newCloutAmount
						});
					});
					failed = false;

				} else {

					database.ref("/Users/" + userKey).once("value", function(data) {
						var db = data.val();
						var newCloutAmount = db.clout;
						database.ref("/Users/" + userKey).update({
							clout: newCloutAmount
						});
					});

				}
			};

			if(failed === true){
				res.redirect("/")
			} else {
				res.render("dashboard", {data: usersList, data2: responseArr});
			}
			
		});

		gameScores.catch(function(error) {
  			console.log(error);
		});

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

	database.ref("Users/" + name).update({
		bet: {[team]: newAmount},
		gameid: req.params.gameid
	});

	res.redirect("/dashboard");

});



// SERVER
app.listen(process.env.PORT || 3000, function(){
	console.log("Server started!");
});