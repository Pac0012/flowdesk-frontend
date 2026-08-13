import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {authAPI} from '../services/api';
export default function Login(){
  // Add this state at the top with your other states
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

// Add this signup handler
  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register({ email, password, fullName, jobTitle, role: 'MEMBER' });
      // After register, log them in
      await login(email, password);
      nav('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const {login}=useAuth();
  const nav=useNavigate();
  const handle=async e=>{e.preventDefault();setError('');setLoading(true);try{await login(email,password);nav('/dashboard');}catch{setError('Invalid email or password');}finally{setLoading(false);}};
  const demos=[{role:'Admin',email:'admin@flowdesk.io',pass:'admin123'},{role:'Member',email:'sipho@flowdesk.io',pass:'member123'}];
  const inp={width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none'};
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:400,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'2.5rem',backdropFilter:'blur(10px)'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#fff',marginBottom:4}}>Flow<span style={{color:'#C0392B'}}>Desk</span></div>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>Team Task Management Platform</p>
        </div>
        <form onSubmit={isSignup ? handleSignup : handle}>
          {isSignup && (
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block',fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontWeight:500}}>Full Name</label>
                <input value={fullName} onChange={e=>setFullName(e.target.value)}
                       placeholder="e.g. Sipho Dlamini" required style={inp}
                       onFocus={e=>e.target.style.borderColor='#C0392B'}
                       onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
              </div>
          )}
          {isSignup && (
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block',fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontWeight:500}}>Job Title</label>
                <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}
                       placeholder="e.g. Developer" style={inp}
                       onFocus={e=>e.target.style.borderColor='#C0392B'}
                       onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
              </div>
          )}
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block',fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontWeight:500}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                   placeholder="you@flowdesk.io" required style={inp}
                   onFocus={e=>e.target.style.borderColor='#C0392B'}
                   onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{display:'block',fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:6,fontWeight:500}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                   placeholder="••••••••" required style={inp}
                   onFocus={e=>e.target.style.borderColor='#C0392B'}
                   onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}/>
          </div>
          {error&&<div style={{background:'rgba(192,57,43,0.2)',color:'#fca5a5',padding:'9px 14px',borderRadius:8,fontSize:13,marginBottom:'1rem'}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:'#C0392B',border:'none',borderRadius:9,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?0.7:1}}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign in to FlowDesk'}
          </button>
          <p onClick={()=>{setIsSignup(!isSignup);setError('');}} style={{color:'rgba(255,255,255,0.4)',fontSize:13,textAlign:'center',marginTop:'1rem',cursor:'pointer'}}>
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </p>
        </form>
        <div style={{marginTop:'1.5rem',padding:'1rem',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>Demo Accounts</p>
          {demos.map(d=>(
            <div key={d.role} onClick={()=>{setEmail(d.email);setPassword(d.pass);}} style={{cursor:'pointer',padding:'7px 10px',borderRadius:7,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'#fff'}}><span style={{color:d.role==='Admin'?'#C0392B':'#60a5fa',fontWeight:600}}>{d.role}</span> — {d.email}</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>click to fill</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
