export default function handler(req,res){
  res.status(200).json({
    ok:true,
    service:'auto-youtube-shorts',
    agnesConfigured:Boolean(process.env.AGNES_API_KEY),
    message:process.env.AGNES_API_KEY?'Ready to generate videos':'Set AGNES_API_KEY in Vercel before generating'
  });
}
