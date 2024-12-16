var express = require("express")
var bodyParser = require("body-parser")
var app = express()
var mongoose = require("mongoose")
var session = require("express-session")
var xss = require("xss")
app.use(express.json())
app.use(session({
	secret:"batman",
	resave:false,
	saveUninitialized: false,
	cookie: { secure: false }
}))

app.use(express.static("./views/"))
app.use(bodyParser.urlencoded({extended:true}))

mongoose.connect("mongodb://localhost:27017/race_condition_database").then(function(){
	console.log("[+] Connection successful")
})

//console.log(1)


const users = [
	{username:"admin",password:"bepracticalbatman",isAdmin:true},
	{username:"local",password:"bepractical",isAdmin:false}
]



const newDashboardSchema = mongoose.Schema({
	dashboard_name : String,
	username : String
})


const userLimit = mongoose.model('Userlimits',mongoose.Schema({limit: Number}))

const User = mongoose.model('Users', newDashboardSchema);

//User.create({dashboard_name: "test_dashboard"}).then(()=>{
//	console.log("User Added")
//})



app.get("/",function(req,res){
	return res.render("login.ejs")
})

app.get("/home",function(req,res){
	if (req.session.username){
		return res.render("home.ejs")
	}
//	console.log(req.session)
	return res.redirect("/")
})


app.get("/get_dashboards",function(req,res){
	if (req.session.username){
		User.find({username:req.session.username}).then(function(data){
			return res.send(data)
		})
	}
})

app.post("/create_dashboard",function(req,res){
//	var limit
	console.log(req.body)
	userLimit.find({username:req.session.username}).then(function(data){
		const lim = data[0].limit
		console.log(lim)
		if (lim > 0){
			User.create({dashboard_name:xss(req.body.name),username:xss(req.session.username)}).then(()=>{
//				console.log(1)
				userLimit.findOneAndUpdate({username:xss(req.session.username)},{$set:{limit: lim - 1}}).then(()=>{console.log("[+] Updated Limit")})
				return res.send({success:true})
			})
		}
		//return res.send({success:false})
	})
	//console.log(limit)
})

app.delete("/delete_dashboard/:id",function(req,res){
//	console.log(req.params.id)
	if (req.session.username){
		userLimit.find({username:req.session.username}).then(function(data){
		var lim = data[0].limit
		console.log(lim)
		User.findByIdAndDelete(req.params.id).then(function(){
			userLimit.findOneAndUpdate({username:req.session.username},{$set:{limit: lim + 1}}).then(function(data){
				return res.send({success:true})
			})
		})
		})
	}
})

app.post("/login",function(req,res){
	const username = req.body.username
	const password = req.body.password
//	console.log(req.body)
//	console.log(password)
//	console.log(req.body)
	for (var i = 0; i < users.length; i++){
		if (users[i].username == "local" && users[i].password == "bepractical"){
			req.session.username = username
			return res.redirect("/home")
		}
		else if (users[i].username == "admin" && users[i].password == "bepracticalbatman"){
			req.session.username = username
			return res.redirect("/home")
		}
	}
})

app.listen(80,function(){
	console.log("[+] Web App is Up & Running")
})
