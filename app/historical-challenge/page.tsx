'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import Link from 'next/link';
import { AlertTriangle, LockKeyhole, Play, RotateCcw } from 'lucide-react';
import rawScenarios from '@/data/historical-challenge/generated-scenarios.json';
import TrendChart from '@/components/historical-challenge/TrendChart';
import { applyTradeAction, buildSessionCheckpoints, simulateRoundComparison } from '@/lib/historical-challenge/simulation';
import type { Allocation, ChallengeSession, DrawdownLimit, GeneratedScenario, Horizon, MarketId, OrderSize, RiskProfile, RoundComparisonResult, RoundInputs, SessionStage, TradeAction } from '@/lib/historical-challenge/types';

const scenarios=rawScenarios as GeneratedScenario[];
const MARKETS:{id:MarketId;label:string}[]=[{id:'sp500',label:'S&P 500'},{id:'nasdaq',label:'Nasdaq'},{id:'dow',label:'Dow Jones'}];
const PROFILE_LABEL:Record<RiskProfile,string>={defensive:'Phòng thủ',balanced:'Cân bằng',aggressive:'Mạo hiểm'};
const ACTION_LABEL:Record<TradeAction,string>={buy:'Mua thêm',hold:'Giữ vị thế',sell:'Bán bớt'};
const DEFAULT_INPUTS:RoundInputs={riskProfile:'balanced',action:'hold',orderSize:30,maxDrawdown:10,horizon:20};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const pct=(n:number)=>`${n>=0?'+':''}${(n*100).toFixed(2)}%`;
const date=(s:string)=>new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(`${s}T00:00:00Z`));
const allocationText=(a:Allocation)=>`Chỉ số ${(a.index*100).toFixed(0)}% · Phòng thủ ${(a.defensive*100).toFixed(0)}% · Tiền mặt ${(a.cash*100).toFixed(0)}%`;
const marketName=(id:MarketId)=>MARKETS.find(m=>m.id===id)!.label;
const shuffle=<T,>(items:T[])=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
const setKey=(items:GeneratedScenario[])=>items.map(s=>s.id).sort().join('|');

export default function HistoricalChallengePage(){
  const [stage,setStage]=useState<SessionStage>('start');
  const [market,setMarket]=useState<MarketId|null>(null);
  const [session,setSession]=useState<ChallengeSession|null>(null);
  const [inputs,setInputs]=useState<RoundInputs>(DEFAULT_INPUTS);
  const [startingCapital,setStartingCapital]=useState(10000);
  const [rounds,setRounds]=useState<RoundComparisonResult[]>([]);
  const [previousSet,setPreviousSet]=useState('');
  const currentScenario=useMemo(()=>session?scenarios.find(s=>s.id===session.scenarioIds[session.currentRound])??null:null,[session]);
  const allocation=applyTradeAction(inputs.action,inputs.orderSize);

  const pickChallenges=()=>{
    let picked:GeneratedScenario[]=[];
    for(let attempt=0;attempt<12;attempt++){
      picked=market?shuffle(scenarios.filter(s=>s.market===market)).slice(0,3):shuffle(MARKETS.map(m=>shuffle(scenarios.filter(s=>s.market===m.id))[0]));
      if(setKey(picked)!==previousSet)break;
    }
    return picked as [GeneratedScenario,GeneratedScenario,GeneratedScenario];
  };
  const startSession=()=>{
    const picked=pickChallenges(), capital=10000;
    setPreviousSet(setKey(picked));setStartingCapital(capital);setInputs(DEFAULT_INPUTS);setRounds([]);
    setSession({id:crypto.randomUUID(),scenarioIds:[picked[0].id,picked[1].id,picked[2].id],currentRound:0,startingCapital:capital,playerCapital:capital,guardrailCapital:capital,finPilotCapital:capital});
    setStage('challenge');window.scrollTo({top:0,behavior:'smooth'});
  };
  const runRound=()=>{
    if(!session||!currentScenario)return;
    const capital=session.currentRound===0?Math.min(1_000_000,Math.max(1000,startingCapital)):session.startingCapital;
    const result=simulateRoundComparison({sessionId:session.id,scenario:currentScenario,roundIndex:session.currentRound,playerStartingCapital:session.currentRound===0?capital:session.playerCapital,guardrailStartingCapital:session.currentRound===0?capital:session.guardrailCapital,finPilotStartingCapital:session.currentRound===0?capital:session.finPilotCapital,inputs});
    setRounds(current=>[...current,result]);
    setSession({...session,startingCapital:capital,playerCapital:result.player.metrics.selectedValue,guardrailCapital:result.guardrails.metrics.selectedValue,finPilotCapital:result.finpilot.metrics.selectedValue});
    setStage('round-result');window.scrollTo({top:0,behavior:'smooth'});
  };
  const advance=()=>{
    if(!session)return;
    if(session.currentRound===2){setStage('final');return}
    setSession({...session,currentRound:(session.currentRound+1) as 1|2});
    setInputs(current=>({...current,action:'hold',orderSize:30}));setStage('challenge');window.scrollTo({top:0,behavior:'smooth'});
  };
  return <main className="min-h-screen overflow-x-hidden bg-background pb-24 text-foreground sm:pb-10"><div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
    {stage==='start'&&<StartScreen market={market} setMarket={setMarket} onPlay={startSession}/>} 
    {stage==='challenge'&&session&&currentScenario&&<ChallengeScreen session={session} scenario={currentScenario} inputs={inputs} setInputs={setInputs} startingCapital={startingCapital} setStartingCapital={setStartingCapital} allocation={allocation} onRun={runRound}/>} 
    {stage==='round-result'&&session&&currentScenario&&rounds.at(-1)&&<RoundResultScreen round={rounds.at(-1)!} scenario={currentScenario} onAdvance={advance}/>} 
    {stage==='final'&&session&&rounds.length===3&&<FinalScreen session={session} rounds={rounds} onReplay={startSession} onChangeMarket={()=>{setStage('start');setMarket(null);setSession(null);setRounds([]);window.scrollTo({top:0,behavior:'smooth'});}}/>} 
  </div></main>;
}

function StartScreen({market,setMarket,onPlay}:{market:MarketId|null;setMarket:Dispatch<SetStateAction<MarketId|null>>;onPlay:()=>void}){
  return <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center"><div className="rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/10 sm:p-8"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">Mô phỏng demo</span><Link href="/" className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">← Trang chủ</Link></div><h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Historical Challenge</h1><p className="mt-2 text-lg text-muted-foreground">Ra quyết định qua 3 cú sốc thị trường</p><p className="mt-4 font-medium">30 thử thách · 3 chỉ số · 1 phiên chơi</p><div className="mt-7 grid grid-cols-3 gap-2" aria-label="Lọc thị trường">{MARKETS.map(m=><button key={m.id} type="button" aria-pressed={market===m.id} onClick={()=>setMarket(current=>current===m.id?null:m.id)} className={`min-h-14 rounded-xl border px-2 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 ${market===m.id?'border-slate-900 bg-slate-900 text-white shadow-none ring-0 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100':'border-border bg-muted/20 hover:border-primary/50'}`}>{m.label}</button>)}</div><button type="button" onClick={onPlay} className="btn btn-primary mt-6 min-h-14 w-full text-base focus-visible:ring-2 focus-visible:ring-primary"><Play className="h-5 w-5" fill="currentColor"/>Chơi ngay — 3 thử thách</button></div></section>;
}

function Progress({round}:{round:number}){return <header className="mb-4"><div className="flex items-center justify-between"><p className="text-lg font-bold">Thử thách {round+1} / 3</p><span className="font-mono text-sm text-muted-foreground">0{round+1}/03</span></div><div className="mt-3 grid grid-cols-3 gap-2">{[0,1,2].map(i=><span key={i} className={`h-1.5 rounded-full ${i<=round?'bg-primary':'bg-muted'}`}/>)}</div></header>}

function ChallengeScreen({session,scenario,inputs,setInputs,startingCapital,setStartingCapital,allocation,onRun}:{session:ChallengeSession;scenario:GeneratedScenario;inputs:RoundInputs;setInputs:Dispatch<SetStateAction<RoundInputs>>;startingCapital:number;setStartingCapital:(n:number)=>void;allocation:Allocation;onRun:()=>void}){
  const set=<K extends keyof RoundInputs>(key:K,value:RoundInputs[K])=>setInputs(current=>({...current,[key]:value}));
  const capitalValid=startingCapital>=1000&&startingCapital<=1_000_000;
  return <section><Progress round={session.currentRound}/><article className="rounded-xl border border-border bg-card p-4 sm:p-5"><p className="text-sm font-semibold text-primary">{marketName(scenario.market)} · {date(scenario.decisionDate)}</p><h1 className="mt-2 text-2xl font-bold leading-tight">{scenario.headline}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{scenario.preEventContext}</p><ul className="mt-4 space-y-2">{scenario.warningSignals.map(signal=><li key={signal} className="flex gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/>{signal}</li>)}</ul></article>
    <article className="mt-4 space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">{session.currentRound===0&&<Field label="Vốn khởi điểm"><input className="input min-h-12 font-mono text-base" aria-label="Vốn khởi điểm" type="number" min={1000} max={1000000} value={startingCapital} onChange={e=>setStartingCapital(Number(e.target.value))}/>{!capitalValid&&<p className="mt-1 text-sm text-red-400">Nhập từ $1,000 đến $1,000,000.</p>}</Field>}
      <Field label="Hồ sơ rủi ro"><Options values={(['defensive','balanced','aggressive'] as RiskProfile[])} active={inputs.riskProfile} label={v=>PROFILE_LABEL[v]} onChange={v=>set('riskProfile',v)}/></Field>
      <Field label="Bạn sẽ làm gì?"><div className="grid grid-cols-3 gap-2">{(['buy','hold','sell'] as TradeAction[]).map(action=><button type="button" key={action} onClick={()=>set('action',action)} className={`min-h-16 rounded-xl border px-2 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 ${inputs.action===action?'border-slate-900 bg-slate-900 text-white shadow-none ring-0 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100':'border-border bg-muted/20 hover:border-primary/50'}`}>{ACTION_LABEL[action]}</button>)}</div></Field>
      <Field label="Quy mô giao dịch: 10%–50% danh mục"><Options values={([10,20,30,40,50] as OrderSize[])} active={inputs.orderSize} label={v=>`${v}%`} onChange={v=>set('orderSize',v)}/></Field>
      <Field label="Drawdown tối đa chấp nhận"><Options values={([5,10,20,30] as DrawdownLimit[])} active={inputs.maxDrawdown} label={v=>`${v}%`} onChange={v=>set('maxDrawdown',v)}/></Field>
      <Field label="Thời gian nắm giữ"><Options values={([5,20,60] as Horizon[])} active={inputs.horizon} label={v=>`T+${v}`} onChange={v=>set('horizon',v)}/></Field>
    </article><div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border"><p className="mb-2 text-center text-sm font-semibold">{allocationText(allocation)}</p><button type="button" disabled={!capitalValid} onClick={onRun} className="btn btn-primary min-h-12 w-full text-base disabled:cursor-not-allowed disabled:opacity-40"><LockKeyhole className="h-4 w-4"/>Khóa quyết định &amp; chạy</button></div>
  </section>;
}

function RoundResultScreen({round,scenario,onAdvance}:{round:RoundComparisonResult;scenario:GeneratedScenario;onAdvance:()=>void}){
  const p=round.player.metrics,g=round.guardrails.metrics,f=round.finpilot.metrics,diff=f.selectedValue-p.selectedValue;
  return <section className="space-y-4"><p className="text-sm font-semibold text-primary">{marketName(scenario.market)} · T+{round.selectedHorizon}</p><h1 className="text-3xl font-bold">Thử thách {round.roundIndex+1} hoàn thành</h1><p className="mt-3 rounded-xl border border-slate-200 bg-slate-100 p-4 text-center text-slate-900 shadow-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">FinPilot hơn bạn {money(diff)} trong thử thách này.</p><div className="grid gap-3 md:grid-cols-3"><ResultCard label="Bạn" value={p.selectedValue} detail={`${p.selectedProfitLoss>=0?'Lãi':'Lỗ'} ${money(Math.abs(p.selectedProfitLoss))} · ${pct(p.selectedReturn)}`} tone="player"/><ResultCard label="Guardrails" value={g.selectedValue} detail={`Lãi ${money(g.selectedProfitLoss)}`} tone="guardrails"/><ResultCard label="FinPilot" value={f.selectedValue} detail={`Lãi ${money(f.selectedProfitLoss)}`} tone="finpilot"/></div><TrendChart mode="round" result={round} scenario={scenario}/><div className="grid gap-3 sm:grid-cols-3"><Explanation title="Bạn đã làm gì">{round.explanations.player}</Explanation><Explanation title="FinPilot đã làm gì">{round.explanations.finpilot}</Explanation><Explanation title="Kết quả">{round.explanations.result}</Explanation></div><button type="button" onClick={onAdvance} className="btn btn-primary min-h-12 w-full text-base">{round.roundIndex<2?'Tiếp tục thử thách tiếp theo':'Xem tổng kết'}</button></section>;
}

function FinalScreen({session,rounds,onReplay,onChangeMarket}:{session:ChallengeSession;rounds:RoundComparisonResult[];onReplay:()=>void;onChangeMarket:()=>void}){
  const playerProfit=session.playerCapital-session.startingCapital,guardProfit=session.guardrailCapital-session.startingCapital,fpProfit=session.finPilotCapital-session.startingCapital,fpDiff=session.finPilotCapital-session.playerCapital,guardDiff=session.finPilotCapital-session.guardrailCapital;
  const fpReturn=session.finPilotCapital/session.startingCapital-1,playerReturn=session.playerCapital/session.startingCapital-1;
  const checkpoints=buildSessionCheckpoints(session.startingCapital,rounds);
  return <section className="space-y-5"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Hoàn thành 3 / 3 thử thách</p><h1 className="text-3xl font-bold sm:text-4xl">Kết quả phiên chơi</h1><div className="grid grid-cols-2 gap-3"><BigValue label="Bạn bắt đầu với" value={money(session.startingCapital)}/><BigValue label="Bạn kết thúc với" value={money(session.playerCapital)}/><BigValue label={playerProfit>=0?'Bạn lời':'Bạn lỗ'} value={money(Math.abs(playerProfit))} tone={playerProfit>=0?'good':'bad'}/><BigValue label="FinPilot hơn bạn" value={money(fpDiff)} tone="best"/></div><div className="grid gap-3 md:grid-cols-3"><FinalCard label="Bạn" value={session.playerCapital} profit={playerProfit} detail={`${pct(session.playerCapital/session.startingCapital-1)} toàn phiên`} tone="player"/><FinalCard label="Guardrails" value={session.guardrailCapital} profit={guardProfit} detail={`Hơn bạn ${money(session.guardrailCapital-session.playerCapital)}`} tone="guardrails"/><FinalCard label="FinPilot" value={session.finPilotCapital} profit={fpProfit} detail={`Hơn bạn ${money(fpDiff)}`} tone="finpilot"/></div><TrendChart mode="session" checkpoints={checkpoints}/><div className="space-y-2">{rounds.map((round,i)=>{const scenario=scenarios.find(s=>s.id===round.scenarioId)!;return <details key={round.scenarioId} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Thử thách {i+1} · {marketName(scenario.market)}</p><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{scenario.headline}</p></div><div className="shrink-0 text-right text-sm"><p className={round.player.metrics.selectedProfitLoss>=0?'text-emerald-400':'text-red-400'}>{pct(round.player.metrics.selectedReturn)}</p><p className="text-amber-300">FP {pct(round.finpilot.metrics.selectedReturn)}</p></div></div></summary><div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm text-muted-foreground"><p><strong className="text-foreground">Quyết định:</strong> {ACTION_LABEL[round.inputs.action]} · {round.inputs.orderSize}% · {PROFILE_LABEL[round.inputs.riskProfile]}</p><p><strong className="text-foreground">Phân bổ:</strong> {allocationText(round.player.allocation)}</p><p><strong className="text-foreground">Drawdown:</strong> Bạn {(round.player.metrics.maxDrawdownSelected*100).toFixed(2)}% · FinPilot {(round.finpilot.metrics.maxDrawdownSelected*100).toFixed(2)}%</p></div></details>})}</div><section className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-card to-primary/10 p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-400">Kết luận phiên chơi</p><h2 className="mt-2 text-2xl font-bold">Sức mạnh vượt trội của FinPilot</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><BigValue label="FinPilot kết thúc với" value={money(session.finPilotCapital)} tone="best"/><BigValue label="Tổng lợi nhuận FinPilot" value={money(fpProfit)} tone="good"/><BigValue label="FinPilot hơn bạn" value={money(fpDiff)} tone="best"/><BigValue label="FinPilot hơn Guardrails" value={money(guardDiff)} tone="good"/><BigValue label="Lợi nhuận FinPilot" value={pct(fpReturn)} tone="best"/><BigValue label="Lợi nhuận của bạn" value={pct(playerReturn)} tone={playerReturn>=0?'good':'bad'}/></div><p className="mt-5 text-base font-semibold leading-7">Qua 3 thử thách, FinPilot kết thúc với {money(session.finPilotCapital)}, cao hơn bạn {money(fpDiff)} và cao hơn Guardrails {money(guardDiff)}.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">FinPilot kết hợp kiểm soát rủi ro, phân bổ phòng thủ và khả năng phục hồi sau cú sốc để tạo ra kết quả vượt trội xuyên suốt phiên chơi.</p><p className="mt-3 text-sm font-semibold text-emerald-300">Không chỉ phản ứng với thị trường — FinPilot biến kỷ luật đầu tư thành lợi thế rõ ràng về hiệu suất.</p></section><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={onReplay} className="btn btn-primary min-h-12"><RotateCcw className="h-4 w-4"/>Chơi lại 3 thử thách mới</button><button type="button" onClick={onChangeMarket} className="btn btn-secondary min-h-12">Chọn thị trường khác</button></div></section>;
}

function Field({label,children}:{label:string;children:ReactNode}){return <div><p className="mb-2 text-sm font-semibold">{label}</p>{children}</div>}
function Options<T extends string|number>({values,active,label,onChange}:{values:T[];active:T;label:(v:T)=>string;onChange:(v:T)=>void}){return <div className="grid auto-cols-fr grid-flow-col gap-2">{values.map(value=><button type="button" key={value} onClick={()=>onChange(value)} className={`min-h-12 rounded-lg border px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 ${active===value?'border-slate-900 bg-slate-900 text-white shadow-none ring-0 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100':'border-border bg-muted/20 hover:border-primary/50'}`}>{label(value)}</button>)}</div>}
function ResultCard({label,value,detail,tone}:{label:string;value:number;detail:string;tone:'player'|'guardrails'|'finpilot'}){return <article className={`rounded-xl border bg-card p-4 ${tone==='player'?'border-purple-500/35':tone==='guardrails'?'border-cyan-500/35':'border-amber-500/50 bg-amber-500/5'}`}><p className="font-semibold">{label}</p><p className="mt-2 font-mono text-2xl font-bold">{money(value)}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></article>}
function Explanation({title,children}:{title:string;children:ReactNode}){return <article className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p></article>}
function BigValue({label,value,tone}:{label:string;value:string;tone?:'good'|'bad'|'best'}){return <div className={`rounded-xl border p-4 ${tone==='best'?'border-amber-500/50 bg-amber-500/10':tone==='good'?'border-emerald-500/30 bg-emerald-500/5':tone==='bad'?'border-red-500/30 bg-red-500/5':'border-border bg-card'}`}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 break-words font-mono text-xl font-bold sm:text-2xl">{value}</p></div>}
function FinalCard({label,value,profit,detail,tone}:{label:string;value:number;profit:number;detail:string;tone:'player'|'guardrails'|'finpilot'}){return <article className={`rounded-xl border p-4 ${tone==='finpilot'?'border-amber-400 bg-gradient-to-br from-amber-500/15 to-card shadow-lg shadow-amber-950/20':tone==='guardrails'?'border-cyan-500/35 bg-card':'border-purple-500/35 bg-card'}`}><p className="font-bold">{label}</p><p className="mt-3 font-mono text-2xl font-bold">{money(value)}</p><p className={profit>=0?'mt-1 text-sm text-emerald-400':'mt-1 text-sm text-red-400'}>{profit>=0?'Lãi':'Lỗ'} {money(Math.abs(profit))}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></article>}
