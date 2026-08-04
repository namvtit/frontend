'use client';

import type { GeneratedScenario, RoundComparisonResult, SessionCheckpoint, StrategyPoint } from '@/lib/historical-challenge/types';

type Props =
  | { mode: 'round'; result: RoundComparisonResult; scenario: GeneratedScenario }
  | { mode: 'session'; checkpoints: SessionCheckpoint[] };
const COLORS={player:'#a78bfa',guardrails:'#22d3ee',finpilot:'#f59e0b'};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);

export default function TrendChart(props:Props){
  if(props.mode==='session') return <SessionChart checkpoints={props.checkpoints}/>;
  return <RoundChart result={props.result} scenario={props.scenario}/>;
}

function RoundChart({result,scenario}:{result:RoundComparisonResult;scenario:GeneratedScenario}){
  const width=620,height=250,pad={l:18,r:14,t:22,b:30};
  const series=[result.player,result.guardrails,result.finpilot];
  const values=series.flatMap(s=>s.points.map(p=>p.value)),min=Math.min(...values)*.985,max=Math.max(...values)*1.015;
  const x=(d:number)=>pad.l+d/60*(width-pad.l-pad.r),y=(v:number)=>pad.t+(1-(v-min)/Math.max(1,max-min))*(height-pad.t-pad.b);
  const path=(points:StrategyPoint[])=>points.map((p,i)=>`${i?'L':'M'}${x(p.relativeDay).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const markers=[{day:scenario.shock.relativeDay,label:'Cú sốc',color:'#ef4444'},{day:result.selectedHorizon,label:`T+${result.selectedHorizon}`,color:'#f8fafc'}];
  return <ChartShell title="Diễn biến thử thách"><svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Ba đường giá trị danh mục trong thử thách">
    {[.25,.5,.75].map(r=><line key={r} x1={pad.l} x2={width-pad.r} y1={pad.t+r*(height-pad.t-pad.b)} y2={pad.t+r*(height-pad.t-pad.b)} stroke="currentColor" opacity=".08"/>)}
    {markers.map(m=><g key={m.label}><line x1={x(m.day)} x2={x(m.day)} y1={pad.t} y2={height-pad.b} stroke={m.color} strokeDasharray="4 5" opacity=".8"/><text x={Math.min(x(m.day)+4,width-58)} y={pad.t+11} fill={m.color} fontSize="11">{m.label}</text></g>)}
    {series.map(s=><path key={s.id} d={path(s.points)} fill="none" stroke={COLORS[s.id]} strokeWidth="3" strokeLinejoin="round"/>)}
    <text x={pad.l} y={height-8} fill="currentColor" opacity=".55" fontSize="11">T0</text><text x={width-pad.r} y={height-8} textAnchor="end" fill="currentColor" opacity=".55" fontSize="11">T+60</text>
  </svg></ChartShell>;
}

function SessionChart({checkpoints}:{checkpoints:SessionCheckpoint[]}){
  const width=620,height=250,pad={l:18,r:14,t:22,b:40};
  const keys=['player','guardrails','finpilot'] as const;
  const values=checkpoints.flatMap(c=>keys.map(k=>c[k])),min=Math.min(...values)*.985,max=Math.max(...values)*1.015;
  const x=(i:number)=>pad.l+i/3*(width-pad.l-pad.r),y=(v:number)=>pad.t+(1-(v-min)/Math.max(1,max-min))*(height-pad.t-pad.b);
  const path=(key:typeof keys[number])=>checkpoints.map((c,i)=>`${i?'L':'M'}${x(i)},${y(c[key]).toFixed(1)}`).join(' ');
  return <ChartShell title="Vốn cộng dồn qua 3 thử thách"><svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Ba đường vốn cộng dồn qua bốn mốc phiên chơi">
    {keys.map(key=><g key={key}><path d={path(key)} fill="none" stroke={COLORS[key]} strokeWidth="3" strokeLinejoin="round"/>{checkpoints.map((c,i)=><circle key={i} cx={x(i)} cy={y(c[key])} r="4" fill={COLORS[key]}/>)}</g>)}
    {checkpoints.map((c,i)=><text key={c.label} x={x(i)} y={height-12} textAnchor={i===0?'start':i===3?'end':'middle'} fill="currentColor" opacity=".62" fontSize="11">{i===0?'Start':`Sau ${i}`}</text>)}
  </svg><div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm"><span className="text-purple-300">Bạn<br/><strong>{money(checkpoints.at(-1)!.player)}</strong></span><span className="text-cyan-300">Guardrails<br/><strong>{money(checkpoints.at(-1)!.guardrails)}</strong></span><span className="text-amber-300">FinPilot<br/><strong>{money(checkpoints.at(-1)!.finpilot)}</strong></span></div></ChartShell>;
}
function ChartShell({title,children}:{title:string;children:React.ReactNode}){return <section className="w-full overflow-hidden rounded-xl border border-border bg-card p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{title}</h3><div className="flex gap-3 text-sm"><span className="text-purple-300">● Bạn</span><span className="text-cyan-300">● Guardrails</span><span className="text-amber-300">● FinPilot</span></div></div>{children}</section>}
