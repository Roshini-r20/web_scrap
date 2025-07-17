const express = require('express');
const puppeteer = require('puppeteer-core');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const data = await page.evaluate(() => {
      const getAll = (selector, attr = 'text') =>
        [...document.querySelectorAll(selector)].map(el => {
          if (attr === 'src') return el.src;
          if (attr === 'href') return el.href;
          return el.innerText || el.textContent || '';
        });

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        phone: document.querySelector('a[href^="tel:"]')?.textContent || '',
        email: document.querySelector('a[href^="mailto:"]')?.textContent || '',
        images: getAll('img', 'src'),
        pdfs: getAll('a[href$=".pdf"]', 'href'),
        mapLinks: getAll('iframe[src*="maps"]', 'src'),
      };
    });

    await browser.close();
    res.json(data);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Scraper API is running. Use POST /scrape with JSON { url } to scrape.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scraper running on port ${PORT}`);
});
