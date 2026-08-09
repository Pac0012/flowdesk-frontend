import React,{createContext,useContext,useState,useEffect} from 'react';
import {authAPI,userAPI} from '../services/api';
const Ctx=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const t=localStorage.getItem('fd_token');if(t){userAPI.getMe().then(r=>setUser(r.data)).catch(()=>localStorage.clear()).finally(()=>setLoading(false));}else setLoading(false);},[]);
  const login=async(email,password)=>{const r=await authAPI.login({email,password});localStorage.setItem('fd_token',r.data.token);setUser(r.data);return r.data;};
  const logout=()=>{localStorage.clear();setUser(null);};
  return <Ctx.Provider value={{user,login,logout,loading,isAdmin:user?.role==='ADMIN'}}>{children}</Ctx.Provider>;
}
export const useAuth=()=>useContext(Ctx);
