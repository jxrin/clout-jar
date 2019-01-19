var express = require("express");
var app = express();
var request = require("request");
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.get("/", function(req, res){

    var date = new Date();
    date.setDate(date.getDate() + 1)
    var isoDate = date.toISOString();

    var url = "https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=" + isoDate + "&l=NBA";

    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	var data = JSON.parse(body);
            res.render("index", {data: data});
        }
    });
});

app.listen(process.env.PORT || 3000, function(){
	console.log("Server started!");
});