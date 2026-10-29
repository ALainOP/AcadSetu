import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import {seed,dataPath} from './seed.ts';
export const db:any=fs.existsSync(dataPath)?JSON.parse(fs.readFileSync(dataPath,'utf8')):seed();
// Backfill only missing fields on older synthetic demo records; preserve existing values.
for(const r of db.records){const defaults:any={institutionStudentId:r.id==='R013'?'RV-2026-001':/^R00[1-9]$|^R01[0-6]$/.test(r.id)?`${r.institution}-${r.id==='R015'?'2025':'2026'}-${r.id.slice(1)}`:`${r.institution}-${r.id}`,session:'2026-27',admissionDate:/^R00[1-9]$|^R01[0-6]$/.test(r.id)?r.start.slice(0,4)+'-06-20':r.start,nriStatus:'No',ociStatus:'No',fnStatus:'No',nationality:'India',seatType:'regular',enrolmentStatus:'active'};let migrated=false;for(const [key,value]of Object.entries(defaults))if(r[key]===undefined){r[key]=value;migrated=true;}if(migrated)r.demographicNote='Legacy synthetic record: missing fields received demo defaults; review before use.';}
db.intakeConfigurations??=[{id:'INTAKE-RV-BTECH-2026',institution:'RV',programme:'B.Tech',session:'2026-27',approvedRegularIntake:3,supernumeraryAllowance:1},{id:'INTAKE-PES-MBA-2026',institution:'PES',programme:'MBA',session:'2026-27',approvedRegularIntake:10,supernumeraryAllowance:2},{id:'INTAKE-BMS-BCA-2026',institution:'BMS',programme:'BCA',session:'2026-27',approvedRegularIntake:8,supernumeraryAllowance:1},{id:'INTAKE-MSR-MBA-2027',institution:'MSR',programme:'MBA',session:'2027-28',approvedRegularIntake:5,supernumeraryAllowance:1}];
if(!db.intakeConfigurations.some((c:any)=>c.id==='INTAKE-MSR-MBA-2027'))db.intakeConfigurations.push({id:'INTAKE-MSR-MBA-2027',institution:'MSR',programme:'MBA',session:'2027-28',approvedRegularIntake:5,supernumeraryAllowance:1});
export const now=()=>new Date().toISOString();
export function save(){fs.writeFileSync(dataPath+'.tmp',JSON.stringify(db,null,2));fs.renameSync(dataPath+'.tmp',dataPath);}
export function audit(req:any,action:string,record:string,reason:string){db.audit.unshift({id:randomUUID(),actor:req.headers['x-demo-role']||'Institution',action,record,reason,at:now()});}
export function touch(req:any,r:any,reason:string){r.version++;r.updatedAt=now();r.history.unshift({at:r.updatedAt,version:r.version,reason,actor:req.headers['x-demo-role']||'Institution'});db.shares.filter((s:any)=>s.recordId===r.id&&!s.revoked).forEach((s:any)=>s.superseded=true);audit(req,'Record updated',r.id,reason);}
export function allow(req:any,res:any,roles:string[]){if(!roles.includes(req.headers['x-demo-role']||'Institution')){res.status(403).json({error:'This demo role cannot perform this action.'});return false;}return true;}
export const institution=(id:string)=>db.colleges.find((c:any)=>c.id===id)?.name||id;
