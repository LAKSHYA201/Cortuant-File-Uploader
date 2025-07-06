const {PrismaClient}=require("@prisma/client");
const prisma=new PrismaClient();
const https=require('https');
const fs=require('fs');
const path=require('path');
const passport=require('passport');
const{validationResult}=require('express-validator');
const bcrypt=require('bcryptjs');
const cloudinary=require('./cloudinary');

async function postSignUp(req,res){
    const error=validationResult(req);
    if(!error.isEmpty()){return res.render("signup",{error:"Username & Password Cannot be Empty, User : MinLength : 3"});}
    const {username,password}=req.body;
    const existingUser=await prisma.user.findUnique({
        where:{username}
    });
    
       if(existingUser){
        return res.render("signup",{error:"* username already exists"});
       }
        const hashedPassword=await bcrypt.hash(password,10);
        await prisma.user.create({
            data:{
                username,
                password:hashedPassword,
            },});
            res.render("login");
}

async function postLogIn(req,res,next){
    const errors=validationResult(req);
    if(!errors.isEmpty()) return res.render("login",{errors});
    passport.authenticate("local",function(err,user,info){
        if(err) return next(err);
        if(!user){
            return res.render("login",{
                errors: [{ msg: info.message }],
                oldData: req.body,
            })
        }
        req.logIn(user,function(err){
            if(err) return next(err);
            return res.redirect("/");
        });
    })(req,res,next);
}

async function getLogOut(req,res,next){
    req.logout((err)=>{
        if(err){return next(err);}
        res.redirect("/login");
    })
}

async function postCreateFolder(req,res){
    const {folderName}=req.body;
    await prisma.folder.create({
        data:{
            name:folderName,
            userId:req.user.id,
        }
    });

    res.redirect("/");
}

async function postUpdateFolder(req,res){
    const folderID=parseInt(req.params.id,10);
    const {folderName}=req.body;

    await prisma.folder.update({
        where:{
            id:folderID,
        },
        data:{
            name:folderName,
        }
    });
    res.redirect("/");
}

async function getDeleteFolder(req,res){
     const folderID=parseInt(req.params.id,10);
     await prisma.folder.delete({
          where:{
            id:folderID,
          }
     });
     res.redirect("/");
}

async function getSelectedFolder(req,res){
    const currentFolderId=parseInt(req.params.id,10);
    const folders=await prisma.folder.findMany({
        where:{
            userId:req.user.id
        },
        include:{
            files:true,
        }
    });
    const currentFolder=await prisma.folder.findUnique({
        where:{ id:currentFolderId,
            userId:req.user.id,
         },
         include:{
            files:true
         }
    });
    if(!currentFolder) return res.render("application",{folders,user:req.user,currentFolder:null});
    
    res.render("application",{folders,user:req.user,currentFolder});
}

async function postCreateFile(req,res){
    const result = await cloudinary.uploader.upload(req.file.path,{
        folder:"CortuantFiles",
        resource_type:"auto"
    });
    await prisma.file.create({
        data:{
        name:req.file.originalname,
        size:req.file.size,
        url :result.secure_url,
        folderId:parseInt(req.body.folderId),
        userId:req.user.id,
        publicId:result.public_id,
        }
    });
    fs.unlink(req.file.path, (err) => {
    if (err) console.error("Error deleting local file:", err);
  });
    res.redirect(`/select-folder/${req.body.folderId}`);
}

async function getDeleteFile(req,res){
    const file=await prisma.file.findUnique({
        where:{id:parseInt(req.params.id,10)},
    });
    if(file) await cloudinary.uploader.destroy(file.publicId);
    await prisma.file.deleteMany({
        where:{
            id:parseInt(req.params.id,10),
            folderId:parseInt(req.query.currentFolderId,10),
            userId:req.user.id,
        }
    });
    res.redirect(`/select-folder/${parseInt(req.query.currentFolderId,10)}`);

}

async function getDownloadFile(req, res) {
  const fileId = parseInt(req.params.id, 10);
  const currentFolderId = parseInt(req.query.currentFolderId, 10);

  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      folderId: currentFolderId,
      userId: req.user.id,
    },
  });

  if (!file) {
    return res.status(403).send("Unauthorized or file not found");
  }

  const fileUrl = file.url;
  const fileName = file.name;

  
  https.get(fileUrl, (streamRes) => {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', streamRes.headers['content-type']);
    streamRes.pipe(res);
  }).on('error', (err) => {
    console.error(err);
    res.status(500).send("Failed to download file");
  });
}
module.exports={
    postSignUp,
    postLogIn,
    getLogOut,
    postCreateFolder,
    postUpdateFolder,
    getDeleteFolder,
    getSelectedFolder,
    postCreateFile,
    getDeleteFile,
    getDownloadFile,
}