

import './App.css'
import { useState,useEffect } from 'react'

function App() {
const [task,setTask]=useState([])
const [newTitle,setNewTile]=useState("");
const [token,settoken] = useState(localStorage.getItem("token"))
const [name, setname]= useState("");
const [email, setemail] = useState("");
const [password,setpassword] = useState("");
const [loginEmail,setloginEmail]=useState("");
const [loginPassword,setloginPassword]= useState("");
const [newDueDate , setNewDueDate] = useState("");
const [showHistory,setShowHistory] = useState("");
const [loading,setLoading] = useState(false);


const handleSubmit = async(e) =>{
  e.preventDefault();
  try{
    const response = await fetch("http://localhost:5000/api/register",{
      method: "POST",
      headers:{
        "Content-Type":"application/json",
      },
      body:JSON.stringify({name,email,password}),
    });
    const data = await response.json();
    if(response.ok){
      alert("Registration is successful")
    console.log("User ID: ",data.userId);
    setname("");
    setemail("");
    setpassword("")
    }
    else{
      alert(data.message);
    }
  }
     catch(err){
      console.error("Error connecting to server: ",err);
    }
}





const handleLogin = async(e)=>{
  e.preventDefault();
  setLoading(true);
  try{
    const response = await fetch("http://localhost:5000/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
      },
      body: JSON.stringify({email:loginEmail,password: loginPassword}),
    })
    const data = await response.json();
    setTimeout(()=>{
      setLoading(false);
        if(response.ok){
      localStorage.setItem("token",data.token);
      settoken(data.token);
      alert("login sucesssful");
      setloginEmail("");
      setloginPassword("");
    }
    else{
      alert(data.message);
    }
    },2500)
  
  }catch(err){
    console.error("error login",err)
  }
}




const handlelogout = ()=>{
  const token = localStorage.getItem("token");
  if(!token){
  alert("you are not logged in")
return;
}
localStorage.removeItem("token");
settoken(null);
alert("logged out successfully");
};





useEffect(()=>{
 const token = localStorage.getItem("token");
 if(!token)return;
 fetch("http://localhost:5000/api/task",{
  headers:{"Authorization":`Bearer ${token}`}
 })
  .then((res)=>res.json())
  .then((data)=>setTask(data))
  .catch((error)=>console.log("something went wrong",error))
},[])





const addTask = async()=>{
  if(!newTitle.trim()) return;

  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:5000/api/task",{
    method: "POST",
      headers :{
        "Content-Type": "application/json",
        "Authorization":`Bearer ${token}`},
        body:JSON.stringify({title:newTitle,dueDate:newDueDate}),
  });
  if(response.ok){
  const savedTask= await response.json();
  setTask((previousTask)=>(Array.isArray(previousTask) ? [...previousTask,savedTask]:[savedTask]));
setNewTile("");
setNewDueDate("");
}
else{
  alert("failed to add task.please  log in again")
}
}




const deleteTask = async(id)=>{
  const token = localStorage.getItem("token");
  await fetch(`http://localhost:5000/api/task/${id}`,{
    method:"DELETE",
    headers:{"Authorization":`Bearer ${token}`}
  })

const filteredTask =  task.filter((singletask)=>
  singletask._id !== id
)
setTask(filteredTask);
}



const handleStatusChange = async(id,newStatus)=>{
  const token = localStorage.getItem("token");
  const response = await fetch(`http://localhost:5000/api/task/${id}`,{
    method:'PUT',
    headers:{"Content-Type":"application/json",
      "Authorization":`Bearer ${token}`
    },
    body:JSON.stringify({status:newStatus})
  });
  if(response.ok){
    const updatedTask = await response.json();
    setTask((previousTask)=>previousTask.map((t)=>(t._id === id ? updatedTask : t))
  );
  }else{
    alert("Failed to update status");
  }
}




const handleIdeaNoteSave = async (taskId, noteText) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`http://localhost:5000/api/task/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ ideaNote: noteText })
  });
  if (response.ok) {
    const updated = await response.json();
    setTask(task.map(t => t._id === taskId ? updated : t));
  }
};




 return (
  <div>
    {!token ? (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",
      backgroundColor:"#0f172a",color:"#fff"}}>
        {loading ? ( <div style ={{fontSize:"1.5rem",fontWeight:"600"}}>logging in,please wait...</div>
        ) : (
          <>
        <h1 style={{marginBottom:"30px",fontSize:"2rem"}}>Project Management</h1>
        <form onSubmit={handleSubmit}>
          <h2>register</h2>
          <input type="text" placeholder='name' value={name} onChange={(e)=>setname(e.target.value)}/>
          <input type="text" placeholder='email' value={email} onChange={(e)=>setemail(e.target.value)}/>
          <input type="text" placeholder="password" value={password} onChange={(e)=>setpassword(e.target.value)}/>
          <button type='submit'> Sign Up</button>
        </form>

        <form onSubmit={handleLogin}>
          <h2>login</h2>
          <input type="text" placeholder='Email' value={loginEmail} onChange={(e)=>setloginEmail(e.target.value)}/>
          <input type="text" placeholder='Password' value={loginPassword} onChange={(e)=>setloginPassword(e.target.value)}/>
          <button type='submit'> Login </button>
        </form>
        </>)}
      </div>
    ) : (
      <div style={{display:"flex",flexDirection:"row",gap:"30px",justifyContent:"center",alignItems:"flex-start",
      padding:"80px 20px 20px 20px",minHeight:"100vh"}}>
        <button onClick={handlelogout}>logout</button>
        <div style={{position:'absolute',top:'10px',right:'20px'}}><button onClick={
          ()=>setShowHistory(!showHistory)} style={{marginRight:"10px"}}>{showHistory ? "back to task":"History/Summary"}</button></div>
        
        <h1 style={{position:"absolute",top:"10px",left:'20px',margin:0}}>My Tasks</h1>
        
        {showHistory ? (
  <div style={{ flex:"1",padding:"20px",maxWidth:"600px"}}>
    <h2>Task History & Complete Summary</h2>
    <ul style={{ listStyleType: "none", padding: 0 }}>
      {Array.isArray(task) && task.map((t) => (
        <li key={t._id} style={{ background: "rgba(255,255,255,0.1)", marginBottom: "15px", padding: "15px", borderRadius: "5px" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Task: {t.title}</h3>
          <p style={{ margin: "5px 0" }}><strong>Status / Mode:</strong> {t.status}</p>
          <p style={{ margin: "5px 0" }}><strong>Due Date:</strong> {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}</p>
          {t.ideaNote && (
            <p style={{ margin: "5px 0", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px" }}>
              <strong>Idea Note:</strong> {t.ideaNote}
            </p>
          )}
        </li>
      ))}
    </ul>
  </div>
) : (
  <div style={{ flex:"1",padding:"20px",maxWidth:"550px" }}>
    <ul>
     
    </ul>


  </div>
)}
        <ul>
  {Array.isArray(task) &&
  task.map((singletask) => {
    const today = new Date();
    const dueDate = singletask.dueDate ? new Date(singletask.dueDate) : null;
    const diffTime = dueDate ? dueDate - today : null;
    const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

    return (
      <li key={singletask._id} style={{ marginBottom: "10px" }}>
        <span 
          style={{ 
            marginRight: "10px", 
            textDecoration: singletask.status === "Completed" ? "line-through" : "none" 
          }}
        >
          {singletask.title}
        </span>


        {singletask.dueDate && (
          <span style={{ marginRight: "10px", fontSize: "0.9em", color: "#ccc" }}>
            (Due: {new Date(singletask.dueDate).toLocaleDateString()})
          </span>
        )}


        {diffDays !== null && diffDays <= 2 && diffDays >= 0 && singletask.status !== "Completed" && (
          <span style={{ marginRight: "10px", color: "orange", fontWeight: "bold" }}>
            ⚠️ Due in {diffDays === 0 ? "Today" : `${diffDays} days`}!
          </span>
        )}

        <select 
          value={singletask.status} 
          onChange={(e) => handleStatusChange(singletask._id, e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="To Do">To Do</option>
          <option value="Idea">Idea</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Completed">Done</option>
        </select>
{singletask.status === "Idea" && (<div style={{marginTop:"5px"}}><textarea placeholder='type your idea note here...'
defaultValue={singletask.ideaNote || ""} onBlur={(e)=>handleIdeaNoteSave(singletask._id,e.target.value)} style={{width:"100%",padding:"5px"}}/></div>)}
        <button onClick={() => deleteTask(singletask._id)}>delete</button>
      </li>
    );
  })
}
        </ul>

        <input type="text" placeholder='enter a new task...' value={newTitle} onChange={(e)=>{setNewTile(e.target.value)}} />
        <input type='date' value ={newDueDate} onChange={(e)=>setNewDueDate(e.target.value)} />
        <button onClick={addTask}>add task</button>
      </div>
    )}
  </div>
);
}
export default App
