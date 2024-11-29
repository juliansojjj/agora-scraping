import puppeteer, { Browser } from 'puppeteer';
import { link, writeFile } from 'fs';


const url = '';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));


const main = async () => {
  const browser: Browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  const articleLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    console.log(links)
    return links
      .filter((link) => link.href.split('/')[3] == 'article')
      .slice(5,6) 
      .map((link) => link.href);
  });
  
  const articlesData = [];
  for (const link of articleLinks) {
    await delay(1000);
    await page.goto(link);
    await delay(2000);
    
    await page.waitForSelector('main section article');

    const articleData = await page.evaluate(() => {
      //header
      const heading = document.querySelector('header').querySelector('h1').innerText
      const subheading = document.querySelector('header').querySelector('div.mt-2').innerHTML
      const category = Array.from(document.querySelector('header').querySelectorAll('div'))[1].innerText

      const authorName = document.querySelector('header').querySelector('a.underline-link').innerHTML
      const date = document.querySelector('header').querySelector('time').innerText

      const categories = document.querySelector('header')
      .querySelector('div')
      .querySelector('div')
      .querySelector('section')
      .querySelector('div').innerHTML

      // //main
      const frontImage = document.querySelector('main')
      .querySelector('section')
      .querySelector('div')
      .querySelector('div').
      querySelector('img').src

      const frontImageAlt = document.querySelector('main')
      .querySelector('section')
      .querySelector('div')
      .querySelector('div').
      querySelector('div').innerText

      const article = document.querySelector('main')
      .querySelector('section')
      .querySelector('article').innerHTML

      const parser = new DOMParser();
      const doc = parser.parseFromString(article, 'text/html');
      
      const contentArray = Array.from(doc.querySelectorAll('p, img, blockquote'))

      const articleFormat = (array:Element[])=>{
        return array.map((element:Element)=>{
          console.log(element)
          if (element.tagName === 'IMG') {
            const imgElement = element as HTMLImageElement;
            return {imageUrl:imgElement.src,
            imageAlt:imgElement.alt}
          }
          
          
          if(element.tagName === 'P')return {
            htmlParagraph:
              element.innerHTML
          }
          
          if(element.tagName === 'BLOCKQUOTE'){
            const quoteElement = element as HTMLQuoteElement;
            
            return {
            quote:quoteElement.innerText,
          }}
        })
      }

      return { 
        authorID:authorName.split(' ').join(''),
        authorName:authorName,
        category:category.split('>')[1].trim(),
        frontImage:frontImage,
        frontImageAlt:frontImageAlt,
        heading:heading,
        subheading:subheading,
        date:`Timestamp.fromDate(new Date("${date}"))`,
        content:articleFormat(contentArray)
       };
    });

    articlesData.push({source:link, ...articleData });
  }

  console.log(articlesData);
  const json = JSON.stringify(articlesData)
  writeFile(`./export/...`, json, 'utf8', (err) => {
    if (err) console.error(err)})

  await browser.close();
};

main()
