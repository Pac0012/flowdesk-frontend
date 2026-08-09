import React,{useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {taskAPI,userAPI} from '../services/api';
import {Card,CardHeader,Badge,Avatar,Spinner} from '../components/Shared';
export default function Dashboard(){
  const {user,isAdmin}=useAuth();
  const [tasks,setTasks]=useState([]);
  const [stats,setStats]=useState({});
  const [team,setTeam]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([taskAPI.getAll(),userAPI.getStats(),isAdmin?userAPI.getTeam():Promise.resolve({data:[]})]).then(([t,s,tm])=>{setTasks(t.data);setStats(s.data);setTeam(tm.data);}).finally(()=>setLoading(false));},[isAdmin]);
  if(loading)return <Spinner/>;
  const h=new Date().getHours();
  const greet=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  const name=isAdmin?'Admin':user?.fullName?.split(' ')[0];
  const statCards=[{l:'Total Tasks',v:stats.totalTasks||0,c:'#C0392B'},{l:'Completed',v:stats.completedTasks||0,c:'#16a34a'},{l:'In Progress',v:stats.pendingTasks||0,c:'#d97706'},{l:'Team Members',v:stats.teamMembers||0,c:'#2563eb'}];
  return(
    <div style={{padding:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div><h1 style={{fontSize:22,fontWeight:600}}>{greet}, {name}!</h1><p style={{fontSize:13,color:'#6b7280',marginTop:3}}>{new Date().toLocaleDateString('en-ZA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:'1.5rem'}}>
        {statCards.map(s=><div key={s.l} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'1rem'}}><div style={{fontSize:13,color:'#6b7280',marginBottom:4}}>{s.l}</div><div style={{fontSize:26,fontWeight:600,color:s.c}}>{s.v}</div></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:isAdmin?'1fr 1fr':'1fr',gap:'1rem'}}>
        <Card>
          <CardHeader title="Recent Tasks"/>
          <div style={{padding:'0.5rem 0'}}>
            {tasks.slice(0,5).map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid #f3f4f6'}}>
                <Avatar name={t.assignedToName} size={28}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,textDecoration:t.status==='COMPLETED'?'line-through':'none',color:t.status==='COMPLETED'?'#9ca3af':'#1c1c2e'}}>{t.title}</div><div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{t.assignedToName} · {t.dueDate||'No due date'}</div></div>
                <Badge status={t.priority}/>
              </div>
            ))}
            {!tasks.length&&<div style={{padding:'1rem',textAlign:'center',color:'#9ca3af',fontSize:13}}>No tasks yet</div>}
          </div>
        </Card>
        {isAdmin&&(
          <Card>
            <CardHeader title="Team Progress"/>
            <div style={{padding:'1rem'}}>
              {team.map(m=>{const p=m.totalTasks>0?Math.round(m.completedTasks/m.totalTasks*100):0;return(
                <div key={m.id} style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><Avatar name={m.fullName} size={26}/><span style={{flex:1,fontSize:13}}>{m.fullName}</span><span style={{fontSize:12,color:'#9ca3af'}}>{m.completedTasks}/{m.totalTasks}</span><span style={{fontSize:12,fontWeight:600}}>{p}%</span></div>
                  <div style={{height:5,background:'#f3f4f6',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${p}%`,background:p>70?'#16a34a':p>40?'#d97706':'#C0392B',borderRadius:3}}></div></div>
                </div>
              );})}
              {!team.length&&<div style={{textAlign:'center',color:'#9ca3af',fontSize:13}}>No team members</div>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
