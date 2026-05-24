import { useState, useEffect } from "react";

const SESSIONS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳','㉑','㉒','㉓','㉔','㉕','㉖','㉗','㉘','㉙','㉚'];
const today = () => new Date().toISOString().slice(0,10);
const initForm = () => ({
  date:today(), storeName:'', name:'', modelName:'', machineNum:'', prevDay:'',
  ownBalls:'', usedBalls:'', heldBalls:'', cashGames:'', cashYen:'',
  recovery:'', totalBalls:'', expectedValue:'',   rate:'19.23',
  sessions: Array(30).fill(null).map(()=>({start:'',atari:'',yame:''}))
});

const calcProfit = f => {
  const r=parseFloat(f.recovery)||0, rate=parseFloat(f.rate)||0, cash=parseFloat(f.cashYen)||0;
  if(!r && !cash) return null;
  return Math.round(r*rate - cash);
};

const fmtP = p => p===null ? '---' : (p>=0?'+':'')+p.toLocaleString()+'円';
const pColor = p => p===null?'var(--color-text-secondary)':p>=0?'var(--color-text-success)':'var(--color-text-danger)';

const genText = (f, cnt) => [
  `【日付】${f.date}`,`【店名】${f.storeName}`,`【名前】${f.name}`,
  `【機種名】${f.modelName}`,`【台番】${f.machineNum}`,`【前日などなど】${f.prevDay}`,
  `【自分の貯玉】${f.ownBalls}`,`【貯玉から使用玉】${f.usedBalls}`,
  `【貯玉以外の持ち玉】${f.heldBalls}`,  `【今持ってる現金】${f.cashGames}`,
  `【現金投資円】${f.cashYen}`,`【回収(枚)】${f.recovery}`,
  `【総貯玉】${f.totalBalls}`,`【期待値】${f.expectedValue}`,
  ...(calcProfit(f)!==null ? [`【収支】${fmtP(calcProfit(f))}`] : []),
  ...SESSIONS.slice(0,cnt).flatMap((n,i)=>[
    `${n}【打ち始め】${f.sessions[i].start}`,
    `【当たり ${f.sessions[i].atari} やめ ${f.sessions[i].yame}   】`
  ])
].join('\n');

function Field({label,value,onChange,wide,multiline,type}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3,flex:wide?'1 1 100%':'1 1 calc(50% - 5px)',minWidth:0}}>
      <label style={{fontSize:11,color:'var(--color-text-secondary)',fontWeight:500}}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={2}
            style={{resize:'vertical',fontSize:13,padding:'6px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',fontFamily:'inherit'}} />
        : <input type={type||'text'} value={value} onChange={e=>onChange(e.target.value)}
            style={{width:'100%',fontSize:13,padding:'6px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',boxSizing:'border-box'}} />
      }
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('input');
  const [form, setForm] = useState(initForm());
  const [cnt, setCnt] = useState(3);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [resetSessConfirm, setResetSessConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const fc = await window.storage.get('pachi-form2');
        if(fc?.value){
          const p=JSON.parse(fc.value);
          const f=p.form||initForm();
          const empty=()=>({start:'',atari:'',yame:''});
          while(f.sessions.length<30) f.sessions.push(empty());
          setForm(f); setCnt(p.cnt||3);
        }
        const hc = await window.storage.get('pachi-hist2');
        if(hc?.value) setHistory(JSON.parse(hc.value));
      } catch(e){}
      setLoaded(true);
    })();
  },[]);

  const saveF = async (f,c) => { try{ await window.storage.set('pachi-form2',JSON.stringify({form:f,cnt:c})); }catch(e){} };
  const saveH = async h => { try{ await window.storage.set('pachi-hist2',JSON.stringify(h)); }catch(e){} };

  const upd = (k,v) => {
    let nf={...form,[k]:v};
    const ob=k==='ownBalls'?v:nf.ownBalls, tb=k==='totalBalls'?v:nf.totalBalls, hb=k==='heldBalls'?v:nf.heldBalls;
    if((k==='ownBalls'||k==='totalBalls'||k==='heldBalls') && tb!=='') {
      const calc=parseFloat(tb)-((parseFloat(ob)||0)+(parseFloat(hb)||0));
      if(!isNaN(calc)) nf={...nf,recovery:String(Math.round(calc))};
    }
    setForm(nf); saveF(nf,cnt);
  };
  const updS = (i,k,v) => {
    const sessions=form.sessions.map((s,j)=>j===i?{...s,[k]:v}:s);
    const nf={...form,sessions}; setForm(nf); saveF(nf,cnt);
  };
  const setC = c => { setCnt(c); saveF(form,c); };

  const saveRec = async () => {
    const rec={id:Date.now().toString(),date:form.date,storeName:form.storeName,modelName:form.modelName,machineNum:form.machineNum,profit:calcProfit(form),form,cnt};
    const nh=[rec,...history]; setHistory(nh); await saveH(nh);
    setSavedMsg(true); setTimeout(()=>setSavedMsg(false),2000);
  };

  const loadRec = rec => { setForm(rec.form); setCnt(rec.cnt||3); setTab('input'); };
  const delRec = async id => { const nh=history.filter(r=>r.id!==id); setHistory(nh); await saveH(nh); };
  const reset = async () => {
    if(!confirm('入力内容をリセットしますか？')) return;
    setForm(initForm()); setCnt(3);
    try{ await window.storage.delete('pachi-form2'); }catch(e){}
  };
  const copy = async () => {
    try{ await navigator.clipboard.writeText(genText(form,cnt)); setCopied(true); setTimeout(()=>setCopied(false),2000); }catch(e){}
  };

  if(!loaded) return <div style={{padding:'2rem',color:'var(--color-text-secondary)',fontSize:14}}>読み込み中...</div>;

  const card = {background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-lg)',padding:'1rem 1.25rem',marginBottom:10};
  const secLbl = {fontSize:12,color:'var(--color-text-secondary)',fontWeight:500,marginBottom:10,display:'flex',alignItems:'center',gap:5};
  const profit = calcProfit(form);

  // History stats
  const validH = history.filter(r=>r.profit!=null);
  const totalP = validH.reduce((a,r)=>a+r.profit,0);
  const avgP = validH.length ? Math.round(totalP/validH.length) : 0;
  const winRate = validH.length ? Math.round(validH.filter(r=>r.profit>=0).length/validH.length*100) : 0;

  return (
    <div style={{fontFamily:'var(--font-sans)',padding:'0.75rem'}}>
      <h2 className="sr-only">パチンコ収支記録ツール</h2>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:3,gap:2}}>
          {[['input','入力'],['history',`履歴（${history.length}）`]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:'5px 16px',fontSize:13,fontWeight:tab===k?500:400,borderRadius:'var(--border-radius-md)',border:'none',background:tab===k?'var(--color-background-primary)':'transparent',color:tab===k?'var(--color-text-primary)':'var(--color-text-secondary)',cursor:'pointer',boxShadow:tab===k?'0 0 0 0.5px var(--color-border-tertiary)':'none'}}>
              {l}
            </button>
          ))}
        </div>
        {tab==='input' && <button onClick={reset} style={{fontSize:12,color:'var(--color-text-secondary)',background:'none',border:'none',cursor:'pointer'}}><i className="ti ti-refresh" aria-hidden="true" style={{marginRight:3}}></i>リセット</button>}
      </div>

      {tab==='input' && <>
        {/* Profit Banner */}
        <div style={{...card,background:'var(--color-background-secondary)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:4}}>本日の収支（回収×レート − 現金投資）</div>
              <div style={{fontSize:32,fontWeight:500,color:pColor(profit),lineHeight:1}}>{fmtP(profit)}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <label style={{fontSize:11,color:'var(--color-text-secondary)',fontWeight:500}}>交換レート（円/枚）</label>
              <input value={form.rate} onChange={e=>upd('rate',e.target.value)} placeholder="4"
                style={{width:90,fontSize:14,padding:'6px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',textAlign:'right',boxSizing:'border-box'}} />
            </div>
          </div>
          {profit!==null && (
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              {[
                ['回収金額',(parseFloat(form.recovery)||0)*(parseFloat(form.rate)||0)],
                ['現金投資',parseFloat(form.cashYen)||0],
              ].map(([l,v])=>(
                <div key={l} style={{flex:'1 1 100px',background:'var(--color-background-primary)',borderRadius:'var(--border-radius-md)',padding:'6px 10px',border:'0.5px solid var(--color-border-tertiary)'}}>
                  <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:1}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:500}}>{Math.round(v).toLocaleString()}円</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div style={card}>
          <div style={secLbl}><i className="ti ti-calendar" aria-hidden="true"></i>日付・基本情報</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            <Field label="日付" value={form.date} onChange={v=>upd('date',v)} type="date" />
            <Field label="店名" value={form.storeName} onChange={v=>upd('storeName',v)} />
            <Field label="名前" value={form.name} onChange={v=>upd('name',v)} />
            <Field label="機種名" value={form.modelName} onChange={v=>upd('modelName',v)} />
            <Field label="台番" value={form.machineNum} onChange={v=>upd('machineNum',v)} />
            <Field label="前日などなど" value={form.prevDay} onChange={v=>upd('prevDay',v)} wide multiline />
          </div>
        </div>

        {/* Balls */}
        <div style={card}>
          <div style={secLbl}><i className="ti ti-coins" aria-hidden="true"></i>玉・投資情報</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            <Field label="自分の貯玉" value={form.ownBalls} onChange={v=>upd('ownBalls',v)} />
            <Field label="貯玉から使用玉" value={form.usedBalls} onChange={v=>upd('usedBalls',v)} />
            <Field label="貯玉以外の持ち玉" value={form.heldBalls} onChange={v=>upd('heldBalls',v)} />
            <div style={{display:'flex',flexDirection:'column',gap:3,flex:'1 1 calc(50% - 5px)',minWidth:0}}>
              <label style={{fontSize:11,color:'var(--color-text-secondary)',fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
                合計持ち玉
                <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'var(--color-background-info)',color:'var(--color-text-info)',fontWeight:500}}>自動計算</span>
              </label>
              <div style={{fontSize:13,padding:'6px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',minHeight:32}}>
                {((parseFloat(form.ownBalls)||0)+(parseFloat(form.heldBalls)||0)).toLocaleString()}
              </div>
            </div>
            <Field label="今持ってる現金" value={form.cashGames} onChange={v=>upd('cashGames',v)} />
            <Field label="現金投資円" value={form.cashYen} onChange={v=>upd('cashYen',v)} />
            <div style={{display:'flex',flexDirection:'column',gap:3,flex:'1 1 calc(50% - 5px)',minWidth:0}}>
              <label style={{fontSize:11,color:'var(--color-text-secondary)',fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
                回収（枚）
                {form.ownBalls!==''&&form.totalBalls!==''&&!isNaN(parseFloat(form.ownBalls))&&!isNaN(parseFloat(form.totalBalls))&&(
                  <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'var(--color-background-info)',color:'var(--color-text-info)',fontWeight:500}}>自動計算</span>
                )}
              </label>
              <input value={form.recovery} onChange={e=>upd('recovery',e.target.value)}
                style={{width:'100%',fontSize:13,padding:'6px 8px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',boxSizing:'border-box'}} />
            </div>
            <Field label="総貯玉" value={form.totalBalls} onChange={v=>upd('totalBalls',v)} />
            <Field label="期待値" value={form.expectedValue} onChange={v=>upd('expectedValue',v)} />
          </div>
        </div>

        {/* Sessions */}
        <div style={card}>
          <div style={{...secLbl,justifyContent:'space-between',marginBottom:8}}>
            <span><i className="ti ti-list-numbers" aria-hidden="true" style={{marginRight:5}}></i>打ち始め・当たり記録</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={()=>setResetSessConfirm(true)}
                style={{fontSize:11,padding:'3px 10px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-secondary)',cursor:'pointer'}}>
                <i className="ti ti-refresh" aria-hidden="true" style={{marginRight:3}}></i>リセット
              </button>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                台数:
                <select value={cnt} onChange={e=>setC(Number(e.target.value))}
                  style={{fontSize:12,padding:'2px 4px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)'}}>
                  {[...Array(30)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
            </div>
          </div>
          {resetSessConfirm && (
            <div style={{marginBottom:10,padding:'12px',borderRadius:'var(--border-radius-md)',background:'var(--color-background-secondary)',border:'0.5px solid var(--color-text-danger)',textAlign:'center'}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>打ち始め・当たり記録をリセットしますか？</div>
              <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                <button onClick={()=>{ const nf={...form,sessions:Array(30).fill(null).map(()=>({start:'',atari:'',yame:''}))}; setForm(nf); saveF(nf,cnt); setResetSessConfirm(false); }}
                  style={{padding:'8px 24px',fontSize:13,fontWeight:500,borderRadius:'var(--border-radius-md)',border:'none',background:'#dc2626',color:'white',cursor:'pointer'}}>
                  はい・リセットする
                </button>
                <button onClick={()=>setResetSessConfirm(false)}
                  style={{padding:'8px 24px',fontSize:13,borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',cursor:'pointer'}}>
                  いいえ
                </button>
              </div>
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {SESSIONS.slice(0,cnt).map((num,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 8px',background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)'}}>
                <span style={{fontSize:15,minWidth:20,textAlign:'center'}}>{num}</span>
                {[['start','打ち始め'],['atari','当たり'],['yame','やめ']].map(([f,l])=>(
                  <div key={f} style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:2}}>{l}</div>
                    <input value={form.sessions[i][f]} onChange={e=>updS(i,f,e.target.value)}
                      style={{width:'100%',fontSize:13,padding:'4px 5px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',boxSizing:'border-box'}} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div style={card}>
          <div style={secLbl}><i className="ti ti-file-text" aria-hidden="true"></i>テキスト出力</div>
          <pre style={{fontSize:11,lineHeight:1.8,color:'var(--color-text-primary)',whiteSpace:'pre-wrap',margin:0,padding:10,background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',fontFamily:'var(--font-mono)',maxHeight:180,overflowY:'auto'}}>{genText(form,cnt)}</pre>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button onClick={saveRec} style={{flex:1,padding:'9px',fontSize:13,fontWeight:500,borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:savedMsg?'var(--color-background-success)':'var(--color-background-primary)',color:savedMsg?'var(--color-text-success)':'var(--color-text-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              <i className={`ti ${savedMsg?'ti-check':'ti-device-floppy'}`} aria-hidden="true"></i>
              {savedMsg?'保存しました！':'履歴に保存'}
            </button>
            <button onClick={copy} style={{flex:1,padding:'9px',fontSize:13,fontWeight:500,borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:copied?'var(--color-background-success)':'var(--color-background-primary)',color:copied?'var(--color-text-success)':'var(--color-text-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              <i className={`ti ${copied?'ti-check':'ti-copy'}`} aria-hidden="true"></i>
              {copied?'コピー完了！':'テキストをコピー'}
            </button>
          </div>
        </div>
      </>}

      {tab==='history' && <>
        {/* Summary Stats */}
        {validH.length > 0 && (
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            {[['合計収支',fmtP(totalP),pColor(totalP)],['平均収支',fmtP(avgP),pColor(avgP)],['勝率',`${winRate}%`,winRate>=50?'var(--color-text-success)':'var(--color-text-danger)']].map(([l,v,c])=>(
              <div key={l} style={{flex:1,background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-md)',padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:3}}>{l}</div>
                <div style={{fontSize:14,fontWeight:500,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {history.length===0
          ? <div style={{...card,textAlign:'center',padding:'2.5rem',color:'var(--color-text-secondary)',fontSize:13}}>
              <i className="ti ti-history" aria-hidden="true" style={{fontSize:36,display:'block',marginBottom:10,opacity:0.3}}></i>
              まだ記録がありません。<br/>入力タブから「履歴に保存」してください。
            </div>
          : history.map(rec=>(
            <div key={rec.id} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{rec.date}</div>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:1}}>{rec.storeName||'（店名なし）'}</div>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)'}}>{[rec.modelName,rec.machineNum?`#${rec.machineNum}`:''].filter(Boolean).join(' ')}</div>
                </div>
                <div style={{fontSize:20,fontWeight:500,color:pColor(rec.profit),marginLeft:12,flexShrink:0}}>
                  {fmtP(rec.profit)}
                </div>
              </div>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <button onClick={()=>loadRec(rec)} style={{flex:1,padding:'6px',fontSize:12,borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',cursor:'pointer'}}>
                  <i className="ti ti-pencil" aria-hidden="true" style={{marginRight:4}}></i>読み込む
                </button>
                <button onClick={()=>delRec(rec.id)} style={{padding:'6px 12px',fontSize:12,borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:'var(--color-text-danger)',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                  <i className="ti ti-trash" aria-hidden="true"></i>削除
                </button>
              </div>
            </div>
          ))
        }
      </>}
    </div>
  );
}
