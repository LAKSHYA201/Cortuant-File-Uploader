const express = require("express");
const path = require("node:path");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const cloudinary = require('./controllers/cloudinary');
const fs=require('fs');
const upload = require('./controllers/upload')
const controllers = require("./controllers/main");


const prisma = new PrismaClient();
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "topSecret",
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000, 
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));

passport.use(new LocalStrategy(async(username,password,done)=>{
    try{
        const user =await prisma.user.findUnique({where:{username}});
        if(!user) return done(null,false,{message:"Incorrect username"});

        const match = await bcrypt.compare(password,user.password);
        if(!match) return done(null,false,{message:"Incorrect Password"})
        
        return done(null,user);
    }catch(err){
        return done(err);
    }
}));

passport.serializeUser((user,done)=>done(null,user.id));
passport.deserializeUser(async(id,done)=>{
    try{
        const user=await prisma.user.findUnique({where:{id}});
        done(null,user);
    }catch(err){
         done(err);
    }
});

app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.isAuthenticated();
    res.locals.user=req.user;
    next();
})

app.get("/",async (req,res)=>{
    if(!req.isAuthenticated()){
        return res.render("signup",{error:null});
    }
    const folders=await prisma.folder.findMany({
        where:{
            userId:req.user.id
        },
        include:{
            files:true,
        }
    });
       res.render("application",{folders,user:req.user,currentFolder:null});
})
app.get("/signup",(req,res)=>{
    res.render("signup",{error:null});
})
app.get("/login",(req,res)=>{
    if(req.isAuthenticated()) return res.redirect("/");
    res.render("login");
})
app.post("/signup",[
    body("username").trim().escape().notEmpty().withMessage("username is required").isLength({min:3}).withMessage("username is required").isLength({min:3}).withMessage("Username must be at least 3 characters"),
    body("password").trim().escape().notEmpty().withMessage('Password must be at least 6 characters'),
],controllers.postSignUp);

app.post("/login",[
    body("username").trim().escape().notEmpty().withMessage("username is required").isLength({min:3}).withMessage("username is required").isLength({min:3}).withMessage("Username must be at least 3 characters"),
    body("password").trim().escape().notEmpty().withMessage('Password must be at least 6 characters'),
],controllers.postLogIn)

app.get("/logout",controllers.getLogOut);

app.post("/create-folder",controllers.postCreateFolder);

app.post("/update-folder/:id",controllers.postUpdateFolder);
app.get("/delete-folder/:id",controllers.getDeleteFolder);
app.get("/select-folder/:id",controllers.getSelectedFolder);
app.post("/create-file", upload.single("file"), controllers.postCreateFile);
app.get("/delete-file/:id",controllers.getDeleteFile);
app.get("/download-file/:id",controllers.getDownloadFile);
app.listen(3000,()=>{
    console.log("Listening at 3000")
})