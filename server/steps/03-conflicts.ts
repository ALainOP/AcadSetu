import {db,save,audit,now,allow} from '../store.ts';
export function detect(){
 const findings:any[]=[];
 db.cases.forEach((c:any)=>{c.activeCandidate=false;});
 for(let i=0;i<db.records.length;i++)for(let j=i+1;j<db.records.length;j++){
 const a=db.records[i],b=db.records[j];
 if(a.archived||b.archived)continue;
 const full=a.apaar===b.apaar,overlap=a.start<=b.end&&b.start<=a.end;
 const uncertain=!full&&a.apaar.slice(-4)===b.apaar.slice(-4)&&a.dob===b.dob;
 if(!full&&!uncertain)continue;
 const mismatch=full&&(a.dob!==b.dob||a.name.toLowerCase()!==b.name.toLowerCase());
 const transfer=full&&!overlap&&(a.transferFrom===b.id||b.transferFrom===a.id);
 const concurrent=full&&overlap&&a.concurrentPermission&&b.concurrentPermission&&a.mode!==b.mode;
 const type=uncertain?'Uncertain identity match':mismatch?'Identity mismatch':transfer?'Legitimate transfer':concurrent?'Permitted concurrent study':overlap?'Duplicate entry':'Historical records';
 if(type==='Historical records')continue;
 const facts=[full?'Full synthetic identifier matches.':'Full identifiers differ; last four digits and date of birth match. This is insufficient to link identities.',overlap?'Enrolment dates overlap.':'Enrolment dates do not overlap.',mismatch?'Identity attributes conflict between the source records.':transfer?'Transfer link and preceding withdrawal date are present.':concurrent?'Both records contain the simulated concurrent-study permission and different study modes.':'Supporting source records require human assessment.'];
 let c=db.cases.find((c:any)=>c.kind!=='intake'&&c.recordIds.length===2&&c.recordIds.includes(a.id)&&c.recordIds.includes(b.id));
 if(!c){c={id:'C'+String(db.cases.length+1).padStart(3,'0'),type,recordIds:[a.id,b.id],owner:'Institution reviewer',deadline:'2026-11-10',severity:uncertain?'Medium':transfer||concurrent?'Low':'High',status:'Open',outcome:'',reason:'',history:[],evidence:[],linkedUpdated:false,ruleVersion:'ENROL-1.0',policySection:transfer?'4.2':concurrent?'4.3':uncertain?'3.2':'3.1',policyYear:'2026',uncertainty:uncertain?'No identity conclusion can be made; no penalty.':'Candidate classification only. Human evidence review is required.',snapshot:{capturedAt:now(),records:structuredClone([a,b])}};db.cases.push(c);}
 c.facts=facts;c.currentClassification=type;c.activeCandidate=c.status!=='Reconciled';if(c.activeCandidate)findings.push(c);
 if(['Duplicate entry','Identity mismatch','Uncertain identity match'].includes(type)&&c.status!=='Reconciled'){a.review='Needs review';b.review='Needs review';}
 }return findings;
}
export default function(app:any){
 if(!db.uncertainFixture){const a=db.records.find((r:any)=>r.id==='R005'),b=db.records.find((r:any)=>r.id==='R006');b.apaar='88000000'+a.apaar.slice(-4);b.dob=a.dob;b.name=a.name;db.uncertainFixture=true;}
 detect();save();
 app.post('/api/conflicts/scan',(req:any,res:any)=>{if(!allow(req,res,['Institution','AICTE Officer','Super Admin']))return;const f=detect();app.locals.reconcileIntake?.(req);audit(req,'Conflict checks run','All records',`${f.length} candidates; ENROL-1.0. No automatic penalty.`);save();res.json({count:f.length});});
}
