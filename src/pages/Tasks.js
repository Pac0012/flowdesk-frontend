import React,{useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {taskAPI,userAPI} from '../services/api';
import {Badge,Stars,Avatar,Modal,Field,Input,Select,Btn,Spinner,Toast} from '../components/Shared';
export default function Tasks(){
  const {isAdmin}=useAuth();
  const [tasks,setTasks]=useState([]);
  const [team,setTeam]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({title:'',description:'',priority:'MEDIUM',dueDate:'',assignedToId:''});
  const [toast,setToast]=useState({msg:'',show:false});
  const load=()=>taskAPI.getAll().then(r=>setTasks(r.data)).finally(()=>setLoading(false));
  useEffect(()=>{load();if(isAdmin)userAPI.getTeam().then(r=>setTeam(r.data));},[isAdmin]);
  const showToast=msg=>{setToast({msg,show:true});setTimeout(()=>setToast(t=>({...t,show:false})),2500);};
  const assign=async()=>{if(!form.title||!form.assignedToId)return showToast('Fill title and assignee');await taskAPI.assign({...form,assignedToId:Number(form.assignedToId)});setModal(false);setForm({title:'',description:'',priority:'MEDIUM',dueDate:'',assignedToId:''});load();showToast('Task assigned!');};
  const markDone=async id=>{await taskAPI.updateStatus(id,'COMPLETED');load();showToast('Task completed!');};
  const rate=async(id,r)=>{await taskAPI.rate(id,{rating:r,comment:''});load();};
  if(loading)return <Spinner/>;
  const th={textAlign:'left',padding:'10px 14px',borderBottom:'1px solid #e5e7eb',fontSize:11,color:'#6b7280',fontWeight:500};
  const td={padding:'10px 14px',borderBottom:'1px solid #f9fafb'};
  return(
    <div style={{padding:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
        <div><h1 style={{fontSize:20,fontWeight:600}}>Tasks</h1><p style={{fontSize:12,color:'#6b7280',marginTop:3}}>All assigned tasks</p></div>
        {isAdmin&&<Btn onClick={()=>setModal(true)}><i className="ti ti-plus"></i> Assign Task</Btn>}
      </div>
      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,tableLayout:'fixed'}}>
          <thead><tr><th style={{...th,width:'30%'}}>Task</th><th style={{...th,width:'18%'}}>Assigned To</th><th style={{...th,width:'11%'}}>Priority</th><th style={{...th,width:'13%'}}>Due Date</th><th style={{...th,width:'13%'}}>Status</th><th style={{...th,width:'15%'}}>Rating</th></tr></thead>
          <tbody>
            {tasks.map(t=>(
              <tr key={t.id}>
                <td style={td}><div style={{fontWeight:500}}>{t.title}</div><div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{t.description?.substring(0,45)}</div></td>
                <td style={td}><div style={{display:'flex',alignItems:'center',gap:7}}><Avatar name={t.assignedToName} size={24}/><span>{t.assignedToName?.split(' ')[0]}</span></div></td>
                <td style={td}><Badge status={t.priority}/></td>
                <td style={{...td,fontSize:12,color:'#6b7280'}}>{t.dueDate||'—'}</td>
                <td style={td}>{t.status!=='COMPLETED'?<button onClick={()=>markDone(t.id)} style={{background:'transparent',border:'1px solid #d1d5db',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Mark Done</button>:<Badge status={t.status}/>}</td>
                <td style={td}><Stars rating={t.rating} onRate={isAdmin&&t.status==='COMPLETED'?s=>rate(t.id,s):null} size={16}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tasks.length&&<div style={{padding:'2rem',textAlign:'center',color:'#9ca3af'}}>No tasks found</div>}
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Assign New Task">
        <Field label="Task Title"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Enter task title"/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Field label="Assign To"><Select value={form.assignedToId} onChange={e=>setForm({...form,assignedToId:e.target.value})}><option value="">Select member...</option>{team.map(m=><option key={m.id} value={m.id}>{m.fullName}</option>)}</Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></Select></Field>
        </div>
        <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></Field>
        <Field label="Description"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Task details..." style={{width:'100%',padding:'9px 13px',border:'1px solid #d1d5db',borderRadius:8,fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical',minHeight:70}}/></Field>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1rem'}}><Btn variant="outline" onClick={()=>setModal(false)}>Cancel</Btn><Btn onClick={assign}><i className="ti ti-check"></i> Assign</Btn></div>
      </Modal>
      <Toast message={toast.msg} visible={toast.show}/>
    </div>
  );
}
