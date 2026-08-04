import type { Allocation, GeneratedScenario, Horizon, RiskProfile, RoundComparisonResult, RoundInputs, RoundIndex, SessionCheckpoint, StrategyPoint, StrategyResult, TradeAction, OrderSize } from './types';

export const ROUND_BASE_ALLOCATION: Allocation = { index: .5, defensive: .3, cash: .2 };
const GUARDRAIL_LIMITS: Record<RiskProfile, { maxIndex: number; minCash: number }> = {
  defensive: { maxIndex: .45, minCash: .20 }, balanced: { maxIndex: .65, minCash: .12 }, aggressive: { maxIndex: .80, minCash: .08 },
};
const RETURN_RANGES = {
  player: { 5: [-.08,.10], 20: [-.15,.18], 60: [-.20,.30] },
  guardrails: { 5: [.02,.07], 20: [.07,.16], 60: [.15,.30] },
  finpilot: { 5: [.06,.11], 20: [.16,.27], 60: [.32,.52] },
} as const;
const clamp = (n:number,min:number,max:number) => Math.min(max,Math.max(min,n));
const money = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const normalize = (a:Allocation):Allocation => {
  const index=clamp(a.index,0,1), cash=clamp(a.cash,0,1-index);
  return { index, cash, defensive: 1-index-cash };
};

export function applyTradeAction(action:TradeAction, orderSize:OrderSize):Allocation {
  const next={...ROUND_BASE_ALLOCATION};
  if(action==='buy'){
    const wanted=Math.min(orderSize/100,.95-next.index);
    const fromCash=Math.min(wanted,Math.max(0,next.cash-.05));
    const fromDefensive=Math.min(wanted-fromCash,next.defensive);
    next.index+=fromCash+fromDefensive; next.cash-=fromCash; next.defensive-=fromDefensive;
  } else if(action==='sell') {
    const released=Math.min(orderSize/100,next.index); next.index-=released; next.cash+=released;
  }
  return normalize(next);
}

export function applyGuardrailCaps(player:Allocation,profile:RiskProfile):Allocation {
  const limit=GUARDRAIL_LIMITS[profile];
  const index=Math.min(player.index,limit.maxIndex), cash=Math.max(player.cash,limit.minCash);
  return normalize({ index, cash, defensive: 1-index-cash });
}

function finpilotAllocation(profile:RiskProfile,risk:GeneratedScenario['riskLevel']):Allocation {
  const base={defensive:.48,balanced:.62,aggressive:.74}[profile];
  const cut={low:0,medium:.05,high:.10}[risk], cash={low:.10,medium:.14,high:.18}[risk];
  return normalize({index:clamp(base-cut,.40,.78),cash,defensive:1-(base-cut)-cash});
}
function hash(input:string){let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function random(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function seededRange(rng:()=>number,[min,max]:readonly[number,number]){return min+(max-min)*rng()}

function playerTarget(rng:()=>number,horizon:Horizon,inputs:RoundInputs,allocation:Allocation,risk:GeneratedScenario['riskLevel']){
  const range=RETURN_RANGES.player[horizon];
  const actionBias=inputs.action==='buy'?.10:inputs.action==='sell'?-.09:0;
  const sizeEffect=(inputs.orderSize-30)/200;
  const profileBias={defensive:-.035,balanced:0,aggressive:.035}[inputs.riskProfile];
  const riskPenalty={low:.025,medium:0,high:-.04}[risk];
  const exposureBias=(allocation.index-.5)*.16;
  return clamp(seededRange(rng,range)+actionBias*(.35+rng()*.65)+sizeEffect+profileBias+riskPenalty+exposureBias,range[0],range[1]);
}

type PathStyle={shock:number;noise:number;earlyDip:number;recovery:number};
function buildPath(scenario:GeneratedScenario,starting:number,horizon:Horizon,target:number,seed:number,style:PathStyle):StrategyPoint[]{
  const rng=random(seed), sessions=scenario.sessions.filter(s=>s.relativeDay>=0);
  const shock=clamp(scenario.shock.relativeDay,2,58), marketVol={sp500:1,nasdaq:1.16,dow:.9}[scenario.market];
  const riskVol={low:.82,medium:1,high:1.22}[scenario.riskLevel];
  const noise:number[]=[0]; let walk=0;
  for(let d=1;d<=60;d++){walk=walk*.68+(rng()-.5)*style.noise*marketVol*riskVol;noise[d]=walk}
  const deviation=(d:number)=>{
    const shockShape=-style.shock*Math.exp(-(((d-shock)/2.25)**2));
    const early=-style.earlyDip*Math.exp(-(((d-2)/1.15)**2));
    const rebound=style.recovery*Math.exp(-(((d-(shock+6))/5.5)**2));
    return shockShape+early+rebound+noise[d];
  };
  const targetLog=Math.log1p(target), horizonDeviation=deviation(horizon);
  const logs:number[]=[];
  for(let d=0;d<=60;d++){
    if(d<=horizon) logs[d]=targetLog*(d/horizon)+deviation(d)-horizonDeviation*(d/horizon);
    else {
      const after=(d-horizon)/(60-horizon||1), lateGrowth=(.035+style.recovery*1.8)*after;
      logs[d]=targetLog+lateGrowth+deviation(d)-horizonDeviation*(1-after);
    }
  }
  let peak=starting;
  return sessions.map((session,d)=>{const value=Math.max(1,starting*Math.exp(logs[d]));peak=Math.max(peak,value);return{relativeDay:d,date:session.date,value,drawdown:value/peak-1}});
}
function metrics(points:StrategyPoint[],horizon:Horizon,shockDay:number){
  const at=(day:number)=>points[day].value, selected=at(horizon), starting=at(0);
  const maxDD=(end:number)=>Math.abs(Math.min(...points.slice(0,end+1).map(p=>p.drawdown)));
  return {startingValue:starting,valueAt5:at(5),valueAt20:at(20),valueAt60:at(60),selectedValue:selected,selectedProfitLoss:selected-starting,selectedReturn:selected/starting-1,maxDrawdownSelected:maxDD(horizon),maxDrawdown60:maxDD(60),shockDayValue:at(shockDay)};
}
function strategy(id:StrategyResult['id'],label:StrategyResult['label'],allocation:Allocation,scenario:GeneratedScenario,starting:number,horizon:Horizon,target:number,seed:number,style:PathStyle):StrategyResult{
  const points=buildPath(scenario,starting,horizon,target,seed,style);
  return{id,label,allocation,points,metrics:metrics(points,horizon,clamp(scenario.shock.relativeDay,0,60))};
}

export function simulateRoundComparison(params:{sessionId:string;scenario:GeneratedScenario;roundIndex:RoundIndex;playerStartingCapital:number;guardrailStartingCapital:number;finPilotStartingCapital:number;inputs:RoundInputs}):RoundComparisonResult{
  const {sessionId,scenario,roundIndex,inputs}=params, seed=hash(`${sessionId}|${scenario.id}|${roundIndex}`), rng=random(seed);
  const playerAllocation=applyTradeAction(inputs.action,inputs.orderSize), guardAllocation=applyGuardrailCaps(playerAllocation,inputs.riskProfile), fpAllocation=finpilotAllocation(inputs.riskProfile,scenario.riskLevel);
  const pTarget=playerTarget(rng,inputs.horizon,inputs,playerAllocation,scenario.riskLevel);
  const gRange=RETURN_RANGES.guardrails[inputs.horizon], fRange=RETURN_RANGES.finpilot[inputs.horizon];
  const gTarget=clamp(Math.max(seededRange(rng,gRange),pTarget+.018),gRange[0],gRange[1]);
  const fTarget=clamp(Math.max(seededRange(rng,fRange),pTarget+.007,gTarget+.007),fRange[0],fRange[1]);
  const riskShock={low:.045,medium:.065,high:.085}[scenario.riskLevel], exposure=playerAllocation.index;
  const player=strategy('player','Bạn',playerAllocation,scenario,params.playerStartingCapital,inputs.horizon,pTarget,hash(`${seed}|p`),{shock:riskShock*(.72+exposure),noise:.014*(.7+exposure),earlyDip:.018+.012*exposure,recovery:.012+.018*exposure});
  const budgetFactor={5:.58,10:.72,20:.82,30:.9}[inputs.maxDrawdown];
  const guardrails=strategy('guardrails','Guardrails',guardAllocation,scenario,params.guardrailStartingCapital,inputs.horizon,gTarget,hash(`${seed}|g`),{shock:riskShock*.54*budgetFactor,noise:.008,earlyDip:.011,recovery:.020});
  const finpilot=strategy('finpilot','FinPilot',fpAllocation,scenario,params.finPilotStartingCapital,inputs.horizon,fTarget,hash(`${seed}|f`),{shock:clamp(riskShock*.20,.010,.020),noise:.0045,earlyDip:.006,recovery:.030});
  const action={buy:'mua thêm',hold:'giữ vị thế',sell:'bán bớt'}[inputs.action];
  const playerText=inputs.action==='hold'?`Bạn giữ phân bổ trung tính 50% chỉ số, 30% phòng thủ và 20% tiền mặt.`:`Bạn ${action} ${inputs.orderSize}% danh mục, đưa tỷ trọng chỉ số về ${(playerAllocation.index*100).toFixed(0)}%. Điều này thay đổi cả lợi nhuận kỳ vọng và mức biến động.`;
  const difference=finpilot.metrics.selectedValue-player.metrics.selectedValue;
  return{scenarioId:scenario.id,roundIndex,selectedHorizon:inputs.horizon,shockDay:scenario.shock.relativeDay,inputs,player,guardrails,finpilot,explanations:{player:playerText,finpilot:'FinPilot giữ cú rơi nông hơn quanh ngày sốc và tăng tốc trong giai đoạn phục hồi.',result:`FinPilot kết thúc cao hơn bạn ${money(difference)} và chịu drawdown thấp hơn.`}};
}

export function buildSessionCheckpoints(startingCapital:number,rounds:RoundComparisonResult[]):SessionCheckpoint[]{
  const checkpoints:SessionCheckpoint[]=[{label:'Start',player:startingCapital,guardrails:startingCapital,finpilot:startingCapital}];
  rounds.forEach((round,i)=>checkpoints.push({label:`Thử thách ${i+1}` as SessionCheckpoint['label'],player:round.player.metrics.selectedValue,guardrails:round.guardrails.metrics.selectedValue,finpilot:round.finpilot.metrics.selectedValue}));
  return checkpoints;
}
