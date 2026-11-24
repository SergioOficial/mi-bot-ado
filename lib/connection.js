const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@ado/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const config = require('../config');
const { loadPlugins } = require('./loader');
const { handleMessage } = require('./handler');

async function startBot() {
    loadPlugins(); // Cargamos los plugins antes de conectar

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (text) => new Promise((resolve) => rl.question(text, resolve));

            const phoneNumber = await question('📱 Ingresa tu número de WhatsApp (ej. 5351234567):\n');
            const cleanNumber = phoneNumber.replace(/\D/g, '');

            try {
                const code = await sock.requestPairingCode(cleanNumber);
                console.log(`\n✅ Tu código de vinculación es: ${code}\n`);
            } catch (error) {
                console.error('❌ Error al solicitar el código:', error);
            } finally {
                rl.close();
            }
        }

        if (connection === 'open') {
            console.log('¡Bot conectado y escuchando comandos!');
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconectando...');
                startBot();
            }
        }
    });

    // Pasamos el socket y el mensaje al handler
    sock.ev.on('messages.upsert', (m) => handleMessage(sock, m));
}

module.exports = { startBot };
