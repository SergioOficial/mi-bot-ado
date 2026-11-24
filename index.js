const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@ado/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- CONFIGURACIÓN ---
const PREFIX = '!'; // Prefijo de los comandos
const plugins = new Map(); // Almacén de plugins

// --- CARGADOR DE PLUGINS ---
function cargarPlugins() {
    const dirPlugins = path.join(__dirname, 'plugins');
    if (!fs.existsSync(dirPlugins)) fs.mkdirSync(dirPlugins);

    const archivos = fs.readdirSync(dirPlugins).filter(f => f.endsWith('.js'));
    console.log(`\n--- Cargando ${archivos.length} plugins ---`);
    
    for (const archivo of archivos) {
        try {
            // Borra la caché para poder recargar sin reiniciar el bot
            delete require.cache[require.resolve(path.join(dirPlugins, archivo))]; 
            const plugin = require(path.join(dirPlugins, archivo));
            
            if (plugin.name) {
                plugins.set(plugin.name.toLowerCase(), plugin);
                console.log(`✅ Plugin cargado: ${plugin.name}`);
            }
        } catch (e) {
            console.error(`❌ Error cargando ${archivo}:`, e);
        }
    }
    console.log('--- Plugins listos ---\n');
}

// --- FUNCIÓN PRINCIPAL DEL BOT ---
async function startBot() {
    cargarPlugins(); // Cargamos los plugins al iniciar

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_ado');

    // Creamos el socket SIN printQRInTerminal
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    // --- GESTIÓN DE CONEXIÓN Y PAIRING CODE ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Si no está registrado y se dispara el evento QR, pedimos el código de vinculación
        if (qr && !sock.authState.creds.registered) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (text) => new Promise((resolve) => rl.question(text, resolve));

            const phoneNumber = await question('📱 Ingresa tu número de WhatsApp (solo dígitos, ej. 5351234567):\n');
            
            // Limpiamos el número por si acaso escriben símbolos
            const cleanNumber = phoneNumber.replace(/\D/g, '');

            try {
                const code = await sock.requestPairingCode(cleanNumber);
                console.log(`\n✅ Tu código de vinculación es: ${code}`);
                console.log('👉 Ve a WhatsApp > Dispositivos vinculados > Vincular con número de teléfono e ingrésalo.\n');
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
            } else {
                console.log('Sesión cerrada. Elimina la carpeta auth_info_ado para volver a vincular.');
            }
        }
    });

    // --- MANEJO DE MENSAJES ---
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!texto) return;

        const remitente = msg.key.remoteJid;

        // --- LÓGICA DE COMANDOS ---
        if (texto.startsWith(PREFIX)) {
            const args = texto.slice(PREFIX.length).trim().split(/ +/);
            const comando = args.shift().toLowerCase();

            // Si el comando existe en el cargador de plugins
            if (plugins.has(comando)) {
                try {
                    const plugin = plugins.get(comando);
                    // Ejecutamos el comando pasándole las herramientas necesarias
                    await plugin.run({ sock, msg, remitente, args, plugins, PREFIX });
                } catch (error) {
                    console.error(`Error en comando ${comando}:`, error);
                    await sock.sendMessage(remitente, { text: `❌ Hubo un error ejecutando ${PREFIX}${comando}` });
                }
            }
        }
    });
}

// Iniciar el bot
startBot();
