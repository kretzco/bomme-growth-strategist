export default async function handler(req,res){

 if(req.method!=='GET') return res.status(405).json({error:'GET only'});

 const tasks=[
  {task:'Publish high intent manufacturer page',score:85},
  {task:'Launch digital asset for apparel costing',score:80},
  {task:'Improve BOMMESPORT Amazon listing',score:60}
 ];

 tasks.sort((a,b)=>b.score-a.score);

 res.json({
  weekly_priorities:tasks,
  strategy_focus:'generate studio production leads and digital asset revenue'
 })
}
