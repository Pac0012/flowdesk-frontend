import React from 'react';

const bdgMap={
  COMPLETED:{bg:'#dcfce7',c:'#166534',l:'Completed'},
  IN_PROGRESS:{bg:'#dbeafe',c:'#1e40af',l:'In Progress'},
  NOT_STARTED:{bg:'#f3f4f6',c:'#6b7280',l:'Not Started'},
  HIGH:{bg:'#fee2e2',c:'#991b1b',l:'High'},
  MEDIUM:{bg:'#fef3c7',c:'#92400e',l:'Medium'},
  LOW:{bg:'#dcfce7',c:'#166534',l:'Low'},
  PENDING:{bg:'#fef3c7',c:'#92400e',l:'Pending'},
  REVIEWED:{bg:'#dcfce7',c:'#166534',l:'Reviewed'},
  APPROVED:{bg:'#dcfce7',c:'#166534',l:'Approved'},
  REJECTED:{bg:'#fee2e2',c:'#991b1b',l:'Rejected'},
  PRESENT:{bg:'#dcfce7',c:'#166534',l:'Present'} // New tag added here
};

export function Badge({status}){const s=bdgMap[status]||{bg:'#f3f4f6',c:'#6b7280',l:status};return <span style={{background:s.bg,color:s.c,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{s.l}</span>;}
export function Avatar({name='',size=32}){const ini=name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);const cols=['#C0392B','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2'];const idx=name.charCodeAt(0)%cols.length;return <div style={{width:size,height:size,borderRadius:'50%',background:cols[idx]+'22',color:cols[idx],display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:700,flexShrink:0,border:`1.5px solid ${cols[idx]}40`}}>{ini}</div>;}
export function Stars({rating,onRate,size=18}){return <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><span key={s} onClick={()=>onRate&&onRate(s)} style={{fontSize:size,cursor:onRate?'pointer':'default',color:rating>=s?'#f59e0b':'#d1d5db',transition:'color .1s'}}>★</span>)}</div>;}
export function Card({children,style}){return <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,...style}}>{children}</div>;}
export function CardHeader({title,action}){return <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontWeight:600,fontSize:14}}>{title}</span>{action}</div>;}
export function Modal({open,onClose,title,children}){if(!open)return null;return <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}><div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:'1.5rem',width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}><h3 style={{fontSize:16,fontWeight:700}}>{title}</h3><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9ca3af'}}>×</button></div>{children}</div></div>;}
const btnV={primary:{background:'#C0392B',color:'#fff'},outline:{background:'transparent',color:'#374151',border:'1px solid #d1d5db'},ghost:{background:'transparent',color:'#6b7280'},success:{background:'#dcfce7',color:'#166534'},danger:{background:'#fee2e2',color:'#991b1b'}};
const btnS={sm:{padding:'5px 12px',fontSize:12},md:{padding:'9px 18px',fontSize:13},lg:{padding:'12px 24px',fontSize:14}};
export function Btn({children,onClick,variant='primary',size='md',style,type,disabled}){return <button type={type||'button'} disabled={disabled} onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:6,cursor:disabled?'not-allowed':'pointer',border:'none',fontFamily:'inherit',fontWeight:600,borderRadius:8,transition:'all .18s',opacity:disabled?0.5:1,...btnS[size],...btnV[variant],...style}}>{children}</button>;}
const inputSt={width:'100%',padding:'9px 13px',background:'#fff',border:'1px solid #d1d5db',borderRadius:8,color:'#1c1c2e',fontSize:13,fontFamily:'inherit',outline:'none'};
export function Field({label,children}){return <div style={{marginBottom:'1rem'}}><label style={{display:'block',fontSize:12,color:'#6b7280',marginBottom:6,fontWeight:500}}>{label}</label>{children}</div>;}
export function Input(props){return <input {...props} style={{...inputSt,...props.style}}/>;}
export function Select({children,...props}){return <select {...props} style={{...inputSt,...props.style}}>{children}</select>;}
export function Textarea(props){return <textarea {...props} style={{...inputSt,resize:'vertical',minHeight:80,...props.style}}/>;}
export function Toast({message,visible}){return <div style={{position:'fixed',bottom:24,right:24,background:'#16a34a',color:'#fff',padding:'10px 20px',borderRadius:10,fontWeight:600,fontSize:13,zIndex:9999,transition:'all .3s',opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(12px)',pointerEvents:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>{message}</div>;}
export function Spinner(){return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}><div style={{width:36,height:36,border:'3px solid #e5e7eb',borderTop:'3px solid #C0392B',borderRadius:'50%',animation:'spin .7s linear infinite'}}></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;}