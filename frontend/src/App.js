// frontend/src/App.js
import React, { useEffect, useState, useRef } from "react";
import SignInScreen from "./SignInScreen";
import { motion, AnimatePresence } from "framer-motion";

// Put your Google client id here for local dev OR use process.env
const GOOGLE_CLIENT_ID = "245602562629-1clbmler1kev013m775orglc5pqof62s.apps.googleusercontent.com";

/* Minimal helper utilities */
function uid(prefix = "") { return prefix + Math.random().toString(36).slice(2,9); }
function nowISO() { return new Date().toISOString(); }
const defaultWelcome = `Welcome — I'm your Data Scientist assistant. Upload a dataset to the right and ask me to run EDA, forecasts or propose experiments.`;

/* Chat storage in localStorage */
function loadChats() {
  try {
    const raw = localStorage.getItem("ds_chats_v1");
    if (!raw) {
      const id = uid("chat_");
      const obj = { current: id, items: { [id]: { id, title: "New chat", createdAt: nowISO(), messages:[{ role:"assistant", text: defaultWelcome, ts: nowISO()}] } } };
      localStorage.setItem("ds_chats_v1", JSON.stringify(obj));
      return obj;
    }
    return JSON.parse(raw);
  } catch(e) { return null; }
}
function saveChats(chats) { localStorage.setItem("ds_chats_v1", JSON.stringify(chats)); }

export default function App(){
  // auth
  const [user, setUser] = useState(null);

  // show sign-in or app
  const [signedIn, setSignedIn] = useState(false);

  // chats
  const [chats, setChats] = useState(()=> loadChats());
  const [currentChatId, setCurrentChatId] = useState(()=> chats?.current);
  const [input, setInput] = useState("");
  const chatViewRef = useRef(null);

  // right pane state
  const [schema, setSchema] = useState(null);
  const [plots, setPlots] = useState({});
  const [loading, setLoading] = useState({ eda:false, ts:false, chat:false });

  useEffect(()=> {
    if(chats) saveChats(chats);
  }, [chats]);

  useEffect(()=> {
    // if user exists in localStorage from previous session
    const storedUser = localStorage.getItem("ds_user_v1");
    if(storedUser) {
      try { const u = JSON.parse(storedUser); setUser(u); setSignedIn(true); } catch {}
    }
  }, []);

  async function onSignedIn(userObj) {
    setUser(userObj);
    setSignedIn(true);
    localStorage.setItem("ds_user_v1", JSON.stringify(userObj));
  }

  function signOut() {
    setUser(null);
    setSignedIn(false);
    localStorage.removeItem("ds_user_v1");
  }

  function newChat(){
    const id = uid("chat_");
    const item = { id, title: "New chat", createdAt: nowISO(), messages:[{ role:"assistant", text: defaultWelcome, ts: nowISO() }]};
    const next = { ...chats, current: id, items: { ...chats.items, [id]: item } };
    setChats(next); setCurrentChatId(id);
  }

  function selectChat(id){
    const next = {...chats, current: id};
    setChats(next); setCurrentChatId(id);
  }

  function appendMessage(role, text){
    const id = currentChatId;
    const next = {...chats};
    next.items[id].messages = [...(next.items[id].messages || []), { role, text, ts: nowISO() }];
    setChats(next);
  }

  // Chat send: simple; sends to backend /chat
  async function sendMessage(useTools = ["eda"]){
    if(!input.trim()) return;
    const text = input.trim();
    appendMessage("user", text);
    setInput("");
    setLoading((s)=>({...s, chat:true}));
    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ message: text, tools: useTools }),
      });
      const j = await res.json();
      if(!res.ok) throw new Error(j.detail||"chat failed");
      appendMessage("assistant", j.answer || "No answer.");
      if(j.tools && j.tools.eda) setPlots(j.tools.eda);
    } catch(err){
      appendMessage("assistant", "Chat failed: "+ (err.message||err));
    } finally {
      setLoading((s)=>({...s, chat:false}));
    }
  }

  // Upload file
  async function uploadFile(ev){
    const f = ev.target.files?.[0];
    if(!f) return;
    const fd = new FormData(); fd.append("file", f);
    try {
      const res = await fetch("/upload", { method: "POST", body: fd });
      const j = await res.json();
      if(!res.ok) throw new Error(j.detail || "upload failed");
      setSchema({ rows: j.rows, columns: j.columns });
      appendMessage("assistant", `File ${f.name} uploaded. Columns: ${j.columns.join(", ")}`);
    } catch(err) {
      appendMessage("assistant", "Upload failed: "+(err.message||err));
    }
  }

  // Run EDA
  async function runEda(){
    setLoading((s)=>({...s, eda:true}));
    try {
      const res = await fetch("/eda", { method: "POST" });
      const j = await res.json();
      if(!res.ok) throw new Error(j.detail||"eda failed");
      setPlots(j.plots || {});
      appendMessage("assistant", "EDA completed — view plots in the right pane.");
    } catch(err) {
      appendMessage("assistant", "EDA failed: "+(err.message||err));
    } finally { setLoading((s)=>({...s, eda:false})); }
  }

  // Time series: simplified wrapper
  async function runTimeSeries(date_col, value_col){
    setLoading((s)=>({...s, ts:true}));
    try {
      const res = await fetch("/timeseries", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ date_column: date_col, value_column: value_col, forecast_periods:12 })});
      const j = await res.json();
      if(!res.ok) throw new Error(j.detail||"timeseries failed");
      setPlots((p)=>({...p, forecast_plot: j.forecast_plot, decomposition_plot: j.decomposition_plot, forecast: j.forecast}));
      appendMessage("assistant", "Time series done — forecast available in right pane.");
    } catch(err) {
      appendMessage("assistant", "TS failed: "+(err.message||err));
    } finally { setLoading((s)=>({...s, ts:false})); }
  }

  // quick UI helpers
  const currentChat = chats?.items?.[currentChatId];

  if(!signedIn) {
    return <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh"}}>
      <SignInScreen clientId={GOOGLE_CLIENT_ID} onSignedIn={onSignedIn}/>
    </div>;
  }

  // Main app layout (left chats, center chat, right tools)
  return (
    <div style={{display:"grid", gridTemplateColumns:"240px 1fr 360px", gap:18, padding:18, minHeight:"100vh", background:"#f3f6fb"}}>
      {/* Left */}
      <aside style={{background:"#fff", borderRadius:12, padding:12, boxShadow:"0 8px 30px rgba(2,6,23,0.06)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontWeight:700, color:"#0b3b8c"}}>Chats</div>
          <button onClick={newChat} style={{background:"#1e40af", color:"#fff", padding:"6px 8px", borderRadius:8}}>+ New</button>
        </div>
        <div style={{marginTop:12}}>
          {Object.values(chats.items).map(c => (
            <div key={c.id} onClick={()=>selectChat(c.id)} style={{padding:8, borderRadius:8, marginBottom:6, background: c.id===currentChatId ? "linear-gradient(90deg,#3b82f6,#1e40af)" : "transparent", color: c.id===currentChatId ? "#fff" : "#0f172a", cursor:"pointer"}}>
              <div style={{fontWeight:600}}>{c.title}</div>
              <div style={{fontSize:12, opacity:0.8}}>{new Date(c.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Profile card *)
            show name & avatar and sign out */}
        <div
  style={{
    display: "flex",
    flexDirection: "column",   // stack vertically
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTop: "1px solid #eef6ff",
  }}
>
  {/* Avatar + name + email */}
  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    {user?.picture ? (
      <img
        src={user.picture}
        alt={user.name}
        style={{ width: 36, height: 36, borderRadius: 8 }}
      />
    ) : (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "#3b82f6",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {(user.name || "U")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700 }}>{user.name}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
    </div>
  </div>

  <button
    onClick={signOut}
    style={{background: "#3b82f6",color: "#fff",borderRadius: 8,padding: "3px 4px",fontWeight: 600,textAlign: "center",}}>
    Sign Out
  </button>
</div>

      </aside>

      {/* Center chat */}
      <main style={{background:"#fff", borderRadius:12, padding:16, display:"flex", flexDirection:"column", boxShadow:"0 8px 30px rgba(2,6,23,0.06)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <strong>{currentChat?.title}</strong>
            <div style={{fontSize:12,color:"#64748b"}}>Conversations are local — uploaded files persist</div>
          </div>
          <div>
            <button style={{padding:"6px 10px",borderRadius:8,background:"#fff",border:"1px solid #eef6ff"}} onClick={()=>{ const newTitle = prompt("Rename chat", currentChat?.title||""); if(newTitle){ const next = {...chats}; next.items[currentChatId].title = newTitle; setChats(next);} }}>Rename</button>
          </div>
        </div>

        <div ref={chatViewRef} style={{flex:1, overflow:"auto", marginTop:12, padding:10, borderRadius:8, background:"#fbfdff", border:"1px solid #eef6ff"}}>
          {currentChat?.messages?.map((m,i) => (
            <div key={i} style={{marginBottom:10, alignSelf: m.role==="assistant" ? "flex-start" : "flex-end", maxWidth:"80%"}}>
              <div style={{fontSize:12,fontWeight:700,color: m.role==="assistant" ? "#0b3b8c" : "#0f172a"}}>{m.role==="assistant" ? "Assistant" : "You"}</div>
              <div style={{marginTop:6, background: m.role==="assistant" ? "linear-gradient(180deg,#fff,#f7fbff)" : "linear-gradient(180deg,#e6f0ff,#fff)", padding:10, borderRadius:10}}>{m.text}</div>
              <div style={{fontSize:11,color:"#64748b", marginTop:4}}>{new Date(m.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex", gap:8, marginTop:12, alignItems:"center"}}>
          <button title="Voice input" onClick={() => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
            if(!SpeechRecognition){ alert("Speech not supported in this browser"); return; }
            const r = new SpeechRecognition(); r.continuous=false; r.interimResults=false; r.lang="en-US";
            r.onresult = (ev) => { const t = ev.results[0][0].transcript; setInput(prev=> prev ? prev + " " + t : t); }
            r.start();
          }}>🎙️</button>
          <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask about the dataset, e.g., 'Summarize sales trends'" style={{flex:1, padding:10, borderRadius:8, border:"1px solid #eef6ff"}} />
          <button onClick={()=>sendMessage(["eda"])} style={{background:"#1e40af", color:"#fff", padding:"10px 14px", borderRadius:8}}>Send</button>
        </div>
      </main>

      {/* Right pane: tools */}
      <aside style={{background:"#fff", borderRadius:12, padding:12, boxShadow:"0 8px 30px rgba(2,6,23,0.06)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <strong>Files & Tools</strong>
          <div style={{fontSize:12,color:"#64748b"}}>Upload stays on server</div>
        </div>
        <div style={{marginTop:10}}>
          <input type="file" accept=".xlsx,.xls" onChange={uploadFile} />
          <div style={{marginTop:8, display:"flex", gap:8}}>
            <button onClick={runEda} style={{background:"#1e40af", color:"#fff", padding:"6px 8px", borderRadius:8}} disabled={loading.eda}>Run EDA</button>
            <button onClick={()=>{ setPlots({}); }} style={{padding:"6px 8px", borderRadius:8}}>Clear</button>
          </div>
          <div style={{marginTop:10, fontSize:13, color:"#64748b"}}>Columns: {schema ? schema.columns?.join(", ") : "—"}</div>
        </div>

        <hr style={{margin:"12px 0"}}/>

        <div>
          <strong>Time Series</strong>
          <div style={{marginTop:8}}>
            <select onChange={(e)=> setSchema(s=>({...s, date_col: e.target.value}))}>
              <option value="">date column</option>
              {schema?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select onChange={(e)=> setSchema(s=>({...s, value_col: e.target.value}))}>
              <option value="">value column</option>
              {schema?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{marginTop:8}}>
              <button onClick={()=>runTimeSeries(schema?.date_col, schema?.value_col)} style={{background:"#1e40af", color:"#fff", padding:"6px 8px", borderRadius:8}}>Run TS</button>
            </div>
          </div>
        </div>

        <hr style={{margin:"12px 0"}}/>

        <div>
          <strong>Plots</strong>
          <div style={{marginTop:10}}>
            {plots.histograms?.map((p,i) => <img key={i} src={p} alt={`h${i}`} style={{width:"100%", borderRadius:8, marginBottom:8}}/>)}
            {plots.boxplots?.map((p,i) => <img key={i} src={p} alt={`b${i}`} style={{width:"100%", borderRadius:8, marginBottom:8}}/>)}
            {plots.correlation && <img src={plots.correlation} alt="corr" style={{width:"100%", borderRadius:8, marginBottom:8}} />}
            {plots.forecast_plot && <img src={plots.forecast_plot} alt="forecast" style={{width:"100%", borderRadius:8}} />}
            {plots.decomposition_plot && <img src={plots.decomposition_plot} alt="decomp" style={{width:"100%", borderRadius:8}} />}
          </div>
        </div>
      </aside>
    </div>
  );
}
