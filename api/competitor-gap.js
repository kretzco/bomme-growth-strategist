import axios from 'axios';

export default async function handler(req,res){

 if(req.method!=='POST') return res.status(405).json({error:'POST only'});

 const {competitors=[]}=req.body||{};

 const domains=[...new Set(competitors.map(c=>c.domain))]

 res.json({
  competitor_domains:domains,
  gap_opportunities:[
   'comparison pages',
   'manufacturing guides',
   'supplier directories',
   'cost breakdown resources'
  ]
 })
}
