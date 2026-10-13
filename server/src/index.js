import express from"express";
import cors from "cors"
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



const app = express();
app.use(cors())
app.use(express.json())



mongoose.connect(process.env.MONGO_URI||"mongodb://127.0.0.1:27017/collab-app")
.then(()=>console.log("mongodb is connected"))
.catch((err)=>console.log("sorry error occured in connection",err))



const taskSchema = new mongoose.Schema({
    title:{type:String,required:true},
    status:{type:String, default:'To-Do'},
    dueDate:{type:Date},
    ideaNote:{type:String,default:""},
    userId:{type:String,required:true}
    
});
const task = mongoose.model("Task",taskSchema);
const userSchema = new mongoose.Schema({
    name:{type: String, required: true},
    email:{type: String, required:true, unique:true},
    password:{type: String, required:true},
    role:{
        type:String,
        enum:["Admin","Team Member"],
        default:"Team Member"
    }
})
const user = mongoose.model("User",userSchema);






app.post("/api/task",verifyToken,async(req,res)=>{
    try{
        console.log("DECODED USER FROM TOKEN:",req.user)
        const newTask = new task({
            title:req.body.title,
            status:"To Do",
            dueDate:req.body.dueDate,
            userId:req.user.userId || req.user.id ||req.user._id
        });
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    }catch(err){
        console.log("CRASH REASON:",err.message)
        res.status(500).json({message:"Error saving task",error:err.message});
    }
})





app.post("/api/register", async(req, res)=>{
    try{
        const {name, email, password} = req.body;
        const existingUser = await user.findOne({email});
        if(existingUser){
            return  res.status(400).json({message: "User already existed with this email"})
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password , salt);
        const newUser = new user({
            name,email,password : hashedPassword
        });
        await newUser.save();
        res.status(201).json({message:"User registered seccessfully!",userId:newUser._id});
    }catch(err){
        res.status(500).json({message:"server error during registration",error:err.message});
    }
})





app.post("/api/login",async(req,res)=>{
    try{
        const {email,password}=req.body;
        const existingUser = await user.findOne({email});
        if(!existingUser){
            return res.status(400).json({message:"invalid email or password"});
        }
    const isPasswordValid = await bcrypt.compare(password,existingUser.password);
    if(!isPasswordValid){
        return res.status(400).json({message:"isvalid email or password"});
    }
    const token = jwt.sign({userId: existingUser._id,email: existingUser.email},
        "supersecretkey123",
        {expiresIn: "1h"}
    );
    res.status(200).json({message:"login successful",
        token:token,
        userId : existingUser._Id
    });
    }catch(err){
        res.status(500).json({message:"server error during login",error:err.message})
    }
})





function verifyToken (req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message: "Access denied.No token provided."})
    }
    try{
        const token = authHeader.split(" ")[1];
        const verified = jwt.verify(token, "supersecretkey123");
        req.user = verified;
        next();
    }catch(err){
        res.status(403).json({message:"Invalid or expired token,"})
    }
}





app.get("/api/protected-route",verifyToken,(req,res)=>{
    res.status(200).json({
        message:"u accessed a protected route successfully",
        user:req.user
    })
})




app.get('/api/task',verifyToken,async(req,res)=>{
try{
    const currentUserId = req.user.userId || req.user.id || req.user._id;
    console.log('LOOKING UP TASK FOR USER ID',currentUserId);
    const userTasks  = await task.find({userId:currentUserId});
    console.log("FOUND TASKS:",userTasks.length);
    res.json(userTasks);
    }catch(err){
        res.status(500).json({message:"Error fetching Tasks",err});
    }
})




app.delete('/api/task/:id',verifyToken,async(req,res)=>{
    try{
    await task.findByIdAndDelete(req.params.id);
    res.json({message:"task is deleted so dont worry"})}
    catch(err){
        res.status(500).json({message:"Error deleting task"});
    }
})



app.put('/api/task/:id',verifyToken,async(req,res)=>{
    try{
        const taskItem = await task.findById(req.params.id);
        if(!taskItem){
            return res.status(404).json({message:"task not found"});
        }
        if(req.body.status){
            taskItem.status = req.body.status;
        }
        if(req.body.ideaNote !== undefined){
            taskItem.ideaNote = req.body.ideaNote;
        }
        const updatedTask = await taskItem.save();
        res.status(200).json(updatedTask)
    }catch(err){
        res.status(500).json({message:"ERROR updating task status",error:err.message});
    }
})


app.get('/',(req,res)=>{
    res.json({message: "welcome to the collab app API",status:"success"})
});
app.listen(5000);
