const fs = require('fs');
const path = require('path');

const plugins = new Map();

function loadPlugins() {
    const dirPlugins = path.join(__dirname, '..', 'plugins');
    if (!fs.existsSync(dirPlugins)) fs.mkdirSync(dirPlugins);

    const archivos = fs.readdirSync(dirPlugins).filter(f => f.endsWith('.js'));
    console.log(`\n--- Cargando ${archivos.length} plugins ---`);
    
    for (const archivo of archivos) {
        try {
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

module.exports = { plugins, loadPlugins };
