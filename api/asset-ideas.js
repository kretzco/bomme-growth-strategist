import { calculateOpportunityScore } from './_scoring.js';

export default async function handler(req,res){

 if(req.method!=='POST') return res.status(405).json({error:'POST only'});

 const assets=[
  'Apparel Production Cost Calculator',
  'MOQ Planning Spreadsheet',
  'Fabric Sourcing Guide',
  'Streetwear Launch Checklist',
  'Garment Tech Pack Template'
 ];

 const scored=assets.map(title=>{

  const scoring=calculateOpportunityScore({
   channelKey:'digital_assets',
   keyword:title,
   intent:'commercial',
   opportunityType:'digital asset',
   pageType:'downloadable asset',
   searchVolume:200
  });

  return{
   title,
   score:scoring.score,
   priority:scoring.priority,
   time_horizon:scoring.timeHorizon
  }

 });

 scored.sort((a,b)=>b.score-a.score)

 res.json({asset_ideas:scored})
}
