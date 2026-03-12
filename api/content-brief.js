import axios from 'axios';

export default async function handler(req,res){

 if(req.method!=='POST') return res.status(405).json({error:'POST only'});

 const {keyword,competitors=[]}=req.body||{};

 const headings=[];

 competitors.slice(0,5).forEach(c=>{
  if(c.title) headings.push(c.title);
 });

 const brief={
  keyword,
  title_suggestions:[
   `Complete Guide to ${keyword}`,
   `${keyword}: Costs, Manufacturers, and Production` 
  ],
  sections:[
   `What is ${keyword}`,
   `${keyword} manufacturing process`,
   `${keyword} costs and pricing`,
   `Best ${keyword} suppliers`,
   `${keyword} production considerations`
  ],
  recommended_word_count:1800
 }

 res.json({brief})
}
