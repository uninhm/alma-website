const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../articles');
const indexFile = path.join(articlesDir, 'index.html');
const templateFile = path.join(articlesDir, 'index-template.html');

// Helper to extract translations from an article file
function extractTranslations(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/const translations = ({[\s\S]+?});/);
    if (match) {
        try {
            // Use eval instead of JSON.parse because the object in HTML might not be strict JSON
            return eval('(' + match[1] + ')');
        } catch (e) {
            console.error(`Error parsing translations in ${filePath}:`, e);
        }
    }
    return null;
}

// Helper to keep full HTML for descriptions
function fullDesc(html) {
    return html || '';
}

function updateIndex() {
    const files = fs.readdirSync(articlesDir)
        .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'template.html' && f !== 'index-template.html');

    const articles = files.map(f => {
        const trans = extractTranslations(path.join(articlesDir, f));
        return {
            filename: f,
            translations: trans
        };
    }).filter(a => a.translations);

    // Generate the card-grid HTML
    let gridHtml = '';
    const indexTranslationsFr = {};
    const indexTranslationsEs = {};

    articles.forEach((art, index) => {
        const id = `art_${index}`;
        gridHtml += `
        <div class="card">
          <h3 data-i18n="${id}_title">${art.translations.fr.article_title}</h3>
          <div class="small" data-i18n="${id}_desc">${fullDesc(art.translations.fr.article_intro)}</div>
          <a href="${art.filename}" class="btn btn-ghost" style="margin-top:auto" data-i18n="art_read_more">Lire plus</a>
        </div>`;
        
        indexTranslationsFr[`${id}_title`] = art.translations.fr.article_title;
        indexTranslationsFr[`${id}_desc`] = fullDesc(art.translations.fr.article_intro);
        indexTranslationsEs[`${id}_title`] = art.translations.es.article_title;
        indexTranslationsEs[`${id}_desc`] = fullDesc(art.translations.es.article_intro);
    });

    // Read from template
    let indexContent = fs.readFileSync(templateFile, 'utf8');

    // Update the card-grid
    indexContent = indexContent.replace('<!-- ARTICLES_PLACEHOLDER -->', gridHtml);

    // Update translations object
    const transMatch = indexContent.match(/const translations = ({[\s\S]+?});/);
    if (transMatch) {
        const currentTrans = eval('(' + transMatch[1] + ')');
        
        // Merge new article translations
        Object.assign(currentTrans.fr, indexTranslationsFr);
        Object.assign(currentTrans.es, indexTranslationsEs);
        
        // Add "more articles soon" translations
        currentTrans.fr.more_articles_soon = "Plus d'articles prochainement...";
        currentTrans.es.more_articles_soon = "Más artículos próximamente...";
        
        const newTransStr = JSON.stringify(currentTrans, null, 2);
        indexContent = indexContent.replace(/const translations = ({[\s\S]+?});/, `const translations = ${newTransStr};`);
    }

    fs.writeFileSync(indexFile, indexContent);
    console.log(`Successfully updated ${indexFile} from template with ${articles.length} articles.`);
}

updateIndex();
