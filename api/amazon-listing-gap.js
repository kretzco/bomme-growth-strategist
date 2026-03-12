mport { calculateOpportunityScore } from './_scoring.js';

export default async function handler(req,res){

 if(req.method!=='POST') return res.status(405).json({error:'POST only'});

 const {product_title,competitor_titles=[]}=req.body||{};

 const scoring=calculateOpportunityScore({
  channelKey:'bommesport_amazon',
  keyword:product_title,
  intent:'commercial',
  opportunityType:'marketplace optimization',
  pageType:'listing optimization',
  searchVolume:200
 });

 const gaps=[
  'missing keyword variations',
  'benefit-driven headline',
  'comparison bullet points',
  'lifestyle imagery'
 ];

 res.json({
  product_title,
  optimization_score:scoring.score,
  gaps
 })
}
