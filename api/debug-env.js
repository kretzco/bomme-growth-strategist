export default async function handler(req, res) {
  res.status(200).json({
    hasLogin: !!process.env.DATAFORSEO_LOGIN,
    hasPassword: !!process.env.DATAFORSEO_PASSWORD,
    loginLength: process.env.DATAFORSEO_LOGIN ? process.env.DATAFORSEO_LOGIN.length : 0,
    passwordLength: process.env.DATAFORSEO_PASSWORD ? process.env.DATAFORSEO_PASSWORD.length : 0,
    nodeEnv: process.env.NODE_ENV || null
  });
}
