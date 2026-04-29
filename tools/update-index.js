const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../articles');
const rootDir = path.join(__dirname, '..');
const indexFile = path.join(articlesDir, 'index.html');
const templateFile = path.join(articlesDir, 'index-template.html');
const rootIndexFile = path.join(rootDir, 'index.html');

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

    // Generate translations object parts
    const indexTranslationsFr = {};
    const indexTranslationsEs = {};

    articles.forEach((art, index) => {
        const id = `art_${index}`;
        indexTranslationsFr[`${id}_title`] = art.translations.fr.article_title;
        indexTranslationsFr[`${id}_desc`] = fullDesc(art.translations.fr.article_intro);
        indexTranslationsEs[`${id}_title`] = art.translations.es.article_title;
        indexTranslationsEs[`${id}_desc`] = fullDesc(art.translations.es.article_intro);
    });

    // --- Update articles/index.html ---
    let articlesGridHtml = '';
    articles.forEach((art, index) => {
        const id = `art_${index}`;
        articlesGridHtml += `
        <div class="card">
          <h3 data-i18n="${id}_title">${art.translations.fr.article_title}</h3>
          <div class="small" data-i18n="${id}_desc">${fullDesc(art.translations.fr.article_intro)}</div>
          <a href="${art.filename}" class="btn btn-ghost" style="margin-top:auto" data-i18n="art_read_more">Lire plus</a>
        </div>`;
    });

    let articlesIndexContent = fs.readFileSync(templateFile, 'utf8');
    articlesIndexContent = articlesIndexContent.replace('<!-- ARTICLES_PLACEHOLDER -->', articlesGridHtml);

    const artTransMatch = articlesIndexContent.match(/const translations = ({[\s\S]+?});/);
    if (artTransMatch) {
        const currentTrans = eval('(' + artTransMatch[1] + ')');
        Object.assign(currentTrans.fr, indexTranslationsFr);
        Object.assign(currentTrans.es, indexTranslationsEs);
        currentTrans.fr.more_articles_soon = "Plus d'articles prochainement...";
        currentTrans.es.more_articles_soon = "Más artículos próximamente...";
        const newTransStr = JSON.stringify(currentTrans, null, 2);
        articlesIndexContent = articlesIndexContent.replace(/const translations = ({[\s\S]+?});/, `const translations = ${newTransStr};`);
    }
    fs.writeFileSync(indexFile, articlesIndexContent);
    console.log(`Successfully updated ${indexFile}`);


    // --- Update root index.html ---
    let rootGridHtml = '';
    articles.forEach((art, index) => {
        const id = `art_${index}`;
        rootGridHtml += `
        <div class="card">
          <h3 data-i18n="${id}_title">${art.translations.fr.article_title}</h3>
          <div class="small" data-i18n="${id}_desc">${fullDesc(art.translations.fr.article_intro)}</div>
          <a href="articles/${art.filename}" class="btn btn-ghost" style="margin-top:auto" data-i18n="art_read_more">Lire plus</a>
        </div>`;
    });

    let rootIndexContent = fs.readFileSync(rootIndexFile, 'utf8');
    const rootGridRegex = /<!-- ARTICLES_START -->[\s\S]*?<!-- ARTICLES_END -->/;
    rootIndexContent = rootIndexContent.replace(rootGridRegex, `<!-- ARTICLES_START -->${rootGridHtml}\n        <!-- ARTICLES_END -->`);

    const rootTransMatch = rootIndexContent.match(/const translations = ({[\s\S]+?});/);
    if (rootTransMatch) {
        const currentTrans = eval('(' + rootTransMatch[1] + ')');
        Object.assign(currentTrans.fr, indexTranslationsFr);
        Object.assign(currentTrans.es, indexTranslationsEs);
        currentTrans.fr.more_articles_soon = "Plus d'articles prochainement...";
        currentTrans.es.more_articles_soon = "Más artículos próximamente...";
        currentTrans.fr.all_articles = "Voir tous les articles";
        currentTrans.es.all_articles = "Ver todos los artículos";
        const newTransStr = JSON.stringify(currentTrans, null, 2);
        rootIndexContent = rootIndexContent.replace(/const translations = ({[\s\S]+?});/, `const translations = ${newTransStr};`);
    }
    fs.writeFileSync(rootIndexFile, rootIndexContent);
    console.log(`Successfully updated ${rootIndexFile}`);

    console.log(`Processed ${articles.length} articles.`);
}

updateIndex();
