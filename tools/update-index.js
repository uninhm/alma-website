const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../articles');
const indexFile = path.join(articlesDir, 'index.html');

// Helper to extract translations from an article file
function extractTranslations(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const translations = ({[\s\S]+?});/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            console.error(`Error parsing translations in ${filePath}:`, e);
        }
    }
    return null;
}

function updateIndex() {
    const files = fs.readdirSync(articlesDir)
        .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'template.html');

    const articles = files.map(f => {
        const trans = extractTranslations(path.join(articlesDir, f));
        return {
            filename: f,
            translations: trans
        };
    }).filter(a => a.translations);

    // Sort by date if possible (optional)
    
    // Generate the card-grid HTML
    let gridHtml = '';
    const indexTranslations = {
        fr: {},
        es: {}
    };

    articles.forEach((art, index) => {
        const id = `art_${index}`;
        gridHtml += `
        <div class="card">
          <h3 data-i18n="${id}_title">${art.translations.fr.article_title}</h3>
          <p class="small" data-i18n="${id}_desc">${art.translations.fr.article_intro.substring(0, 100)}...</p>
          <a href="${art.filename}" class="btn btn-ghost" style="margin-top:auto" data-i18n="art_read_more">Lire plus</a>
        </div>`;
        
        indexTranslations.fr[`${id}_title`] = art.translations.fr.article_title;
        indexTranslations.fr[`${id}_desc`] = art.translations.fr.article_intro.substring(0, 100) + '...';
        indexTranslations.es[`${id}_title`] = art.translations.es.article_title;
        indexTranslations.es[`${id}_desc`] = art.translations.es.article_intro.substring(0, 100) + '...';
    });

    // Read original index.html to keep the structure
    let indexContent = fs.readFileSync(indexFile, 'utf8');

    // Update the card-grid
    const gridRegex = /<div class="card-grid" style="margin-top: 2rem;">[\s\S]+?<\/div>/;
    indexContent = indexContent.replace(gridRegex, `<div class="card-grid" style="margin-top: 2rem;">${gridHtml}\n      </div>`);

    // Update translations object in index.html
    const transMatch = indexContent.match(/const translations = ({[\s\S]+?});/);
    if (transMatch) {
        const currentTrans = eval('(' + transMatch[1] + ')');
        
        // Merge new article translations
        Object.assign(currentTrans.fr, indexTranslations.fr);
        Object.assign(currentTrans.es, indexTranslations.es);
        
        const newTransStr = JSON.stringify(currentTrans, null, 2);
        indexContent = indexContent.replace(/const translations = ({[\s\S]+?});/, `const translations = ${newTransStr};`);
    }

    fs.writeFileSync(indexFile, indexContent);
    console.log(`Successfully updated ${indexFile} with ${articles.length} articles.`);
}

updateIndex();
