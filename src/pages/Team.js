import React,{useEffect,useState} from 'react';
import {userAPI} from '../services/api';
import {Avatar,Spinner} from '../components/Shared';
export default function Team(){
  const [team,setTeam]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{userAPI.getTeam().then(r=>setTeam(r.data)).finally(()=>setLoading(false));},[]);
  if(loading)return <Spinner/>;
  const th={textAlign:'left',padding:'10px 14px',borderBottom:'1px solid #e5e7eb',fontSize:11,color:'#6b7280',fontWeight:500};
  const td={padding:'10px 14px',borderBottom:'1px solid #f9fafb'};
  return(
    <div style={{padding:'1.5rem'}}>
      <div style={{marginBottom:'1.25rem'}}><h1 style={{fontSize:20,fontWeight:600}}>Team Members</h1><p style={{fontSize:12,color:'#6b7280',marginTop:3}}>{team.length} members</p></div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr><th style={th}>Member</th><th style={th}>Role</th><th style={th}>Tasks</th><th style={th}>Completed</th><th style={th}>Avg Rating</th></tr></thead>
          <tbody>{team.map(m=>(
            <tr key={m.id}>
              <td style={td}><div style={{display:'flex',alignItems:'center',gap:9}}><Avatar name={m.fullName} size={32}/><div><div style={{fontWeight:500}}>{m.fullName}</div><div style={{fontSize:11,color:'#9ca3af'}}>{m.email}</div></div></div></td>
              <td style={{...td,color:'#6b7280'}}>{m.jobTitle||'—'}</td>
              <td style={td}>{m.totalTasks}</td>
              <td style={{...td,color:'#16a34a',fontWeight:500}}>{m.completedTasks}</td>
              <td style={{...td,color:'#f59e0b'}}>{m.avgRating>0?`${'★'.repeat(Math.round(m.avgRating))} ${m.avgRating}`:'—'}</td>
            </tr>
          ))}</tbody>
        </table>
        {!team.length&&<div style={{padding:'2rem',textAlign:'center',color:'#9ca3af'}}>No team members yet</div>}
      </div>
    </div>
  );
}
