
const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

function adminOnly(req,res,next){
  if(req.headers["x-admin"]!=="true") return res.status(403).json({message:"Admin only"});
  next();
}

function checkLocked(req,res,next){
  const s = JSON.parse(fs.readFileSync("./data/quiz-status.json"));
  if(s.started) return res.json({message:"Quiz started. Editing locked"});
  next();
}

app.get("/", (req,res)=>res.sendFile(__dirname+"/views/login.html"));

app.get("/admin/users", adminOnly, (req,res)=>{
  res.json(JSON.parse(fs.readFileSync("./data/users.json")));
});

app.post("/admin/update-nickname", adminOnly, checkLocked, (req,res)=>{
  const users = JSON.parse(fs.readFileSync("./data/users.json"));
  const logs = JSON.parse(fs.readFileSync("./data/audit-log.json"));
  const u = users.find(x=>x.username===req.body.username);
  if(!u) return res.json({message:"User not found"});
  logs.push({admin:"admin",user:u.username,old:u.nickname,new:req.body.nickname,time:new Date()});
  u.nickname=req.body.nickname;
  fs.writeFileSync("./data/users.json", JSON.stringify(users,null,2));
  fs.writeFileSync("./data/audit-log.json", JSON.stringify(logs,null,2));
  res.json({message:"Updated"});
});

app.get("/results",(req,res)=>{
  res.json(JSON.parse(fs.readFileSync("./data/results.json")));
});

app.listen(PORT,()=>console.log("Running on "+PORT));
