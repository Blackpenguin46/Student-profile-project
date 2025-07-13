export default function handler(req, res) {
    res.status(200).json({ 
        message: 'Test endpoint working!',
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
    });
}