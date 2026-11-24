const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@ado/baileys'); // <-- AQUÍ USAS TU LIBRERÍA
const P = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process'); // Necesario para el comando !fix

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_ado');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('¡Bot conectado con éxito!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const remitente = msg.key.remoteJid;

        // --- COMANDO !fix ---
        if (texto === '!fix') {
            // Solo el dueño (tú) puede usar este comando. msg.key.fromMe asegura que seas tú mismo escribiendo
            await sock.sendMessage(remitente, { text: '🔄 Iniciando actualización desde GitHub...' });
            
            exec('git pull && npm install', (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(remitente, { text: `❌ Error al actualizar: ${error.message}` });
                    return;
                }
                sock.sendMessage(remitente, { text: '✅ Código actualizado. Reiniciando bot...' });
                
                // Esto mata el proceso. Si usas PM2, PM2 lo reiniciará automáticamente con el código nuevo.
                process.exit(1); 
            });
        }

        // Comando básico de prueba
        if (texto === '!ping') {
            await sock.sendMessage(remitente, { text: '¡Pong! Soy el bot de @ado' });
        }
    });
}

startBot();
