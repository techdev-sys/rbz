const fs = require('fs');
const path = require('path');

const historyDir = '/home/takilaa/.antigravity-server/data/User/History';
const targetBase = '/home/takilaa/rbz';

const dirs = fs.readdirSync(historyDir);
for (const dir of dirs) {
    const entriesPath = path.join(historyDir, dir, 'entries.json');
    if (fs.existsSync(entriesPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
            const resource = data.resource || '';
            if (resource.includes('takilaa/rbz')) {
                const relativePath = decodeURIComponent(resource.split('takilaa/rbz/')[1]);
                const targetPath = path.join(targetBase, relativePath);

                if (fs.existsSync(targetPath)) {
                    if (targetPath.endsWith('.js') || targetPath.endsWith('.py') || targetPath.endsWith('.css')) {
                        const entries = data.entries || [];
                        if (entries.length > 0) {
                            const latestEntry = entries[entries.length - 1].id;
                            const historyFilePath = path.join(historyDir, dir, latestEntry);

                            const targetContent = fs.readFileSync(targetPath, 'utf8');
                            const historyContent = fs.readFileSync(historyFilePath, 'utf8');

                            if (targetContent !== historyContent) {
                                fs.writeFileSync(targetPath, historyContent);
                                console.log(`RESTORED: ${relativePath}`);
                            }
                        }
                    }
                } else {
                    console.log(`Original not found skip: ${targetPath}`);
                }
            }
        } catch (e) {
            console.error(`Error processing ${dir}:`, e);
        }
    }
}
