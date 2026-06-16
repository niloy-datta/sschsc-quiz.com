const fs=require('fs');const p=require('path');
const BASE='public/quiz-data';
function chk(level,subjects){
  for(const s of subjects){
    const f=p.join(BASE,level,s+'.json');
    if(!fs.existsSync(f)){console.log(level+' '+s+': MISSING');continue;}
    const d=JSON.parse(fs.readFileSync(f,'utf8'));
    const ch=Object.keys(d.chapters||{});
    const mt=Object.keys(d.modelTests||{});
    const by=Object.keys(d.boardQuestions||{});
    const mtCh=mt.filter(k=>/chapter-\d{2}/.test(k));
    console.log(level+' '+s+': ch='+ch.length+' ('+ch.join(',')+') mt='+mt.length+' (ch-scoped:'+mtCh.length+') board='+by.length+' yrs='+by.join(','));
  }
}
const ssc=['physics','chemistry','biology','higher-math','general-math'];
const hsc=['physics-1st-paper','physics-2nd-paper','chemistry-1st-paper','chemistry-2nd-paper','biology-1st-paper','biology-2nd-paper','higher-math-1st-paper','higher-math-2nd-paper'];
chk('ssc',ssc);console.log('---');chk('hsc',hsc);
