import { Browser, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY  } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

import { link, writeFile } from 'fs';


const url = '';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

//https://www.npmjs.com/package/puppeteer-extra-plugin-adblocker
puppeteer.use(
  AdblockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
  })
)

const main = async () => {
  const browser: Browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  const articleLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    console.log(links)
    return links
      .filter((link) => link.href.split('/')[3] == 'article')
      .map((link) => link.href);
  });
  
  const articlesData = [];
  const articlesTopics = [];

  for (const link of articleLinks) {
    await delay(1000);
    await page.goto(link);
    await delay(2000);
    
    await page.waitForSelector('main section article');
    const articleTopics:{}[] = []
    const articleUrlTopics:string[] = []
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

      const anchorArray = Array.from(doc.querySelectorAll('a'))
      const urlTopics = ()=>{
        return anchorArray.map((element:HTMLAnchorElement)=>{
          if(element.href.split('/')[3] == 'category'){
            return element.innerText.trim().toLowerCase().split(' ').join('-')
            
          } 
          else null
        })
      }
      const topics = ()=>{
        return anchorArray.map((element:HTMLAnchorElement)=>{
          if(element.href.split('/')[3] == 'category'){
            return {name:element.innerText.trim(),url:element.innerText.trim().toLowerCase().split(' ').join('-')}
          } 
          else null
        })
      }


      const contentArray = Array.from(doc.querySelectorAll('p, img, blockquote, h2, h3, q'))
      const articleFormatContent = (array:Element[])=>{
        return array.map((element:Element)=>{
          console.log(element)
          if (element.tagName === 'H2') {
            const headingElement = element as HTMLHeadingElement
            return {title:headingElement.innerText}
          }
          if (element.tagName === 'H3') {
            const subheadingElement = element as HTMLHeadingElement
            return {subtitle:subheadingElement.innerText}
          }

          if (element.tagName === 'IMG') {
            const imgElement = element as HTMLImageElement;
            return {imageUrl:imgElement.src,
            imageAlt:imgElement.alt}
          }
          
          
          if(element.tagName === 'P'){
            const paragraphElement = element as HTMLParagraphElement;
            if(paragraphElement.querySelector('span')?.innerText =='Topics') return null

            else return {
            htmlParagraph:
              element.innerHTML
            }
        }
          
          if(element.tagName === 'Q'){
            const quoteElement = element as HTMLQuoteElement;
          
            return {
            quote:quoteElement.innerText,
          }}
          if(element.tagName === 'BLOCKQUOTE'){
            const quoteElement = element as HTMLQuoteElement;
            
            return {
            quote:quoteElement.innerText,
          }}
        })
      }

      function priority(){
        return contentArray.length <= 20 ? 'low' : 'medium'
      }

      return { 
        authorID:authorName.split(' ').join(''),
        authorName:authorName,

        frontImage:frontImage,
        frontImageAlt:frontImageAlt,
        frontImageBanner: false,

        heading:heading,
        subheading:subheading,

        category:'culture',
        urlTopics:Array.from(new Set(urlTopics())),
        topics:topics()?.filter((item,index:number)=>{
          return index == topics().findIndex(obj=>item?.url == obj?.url)
        }),

        date:`Timestamp.fromDate(new Date('${date}'))`,
        priority:priority(),
        available:true,
        subscription:false,

        content:articleFormatContent(contentArray),
        contentPreview:contentArray.length <= 10 ? [] : articleFormatContent(contentArray.slice(0,10))
       };
    });
    articlesTopics.push(articleData.topics)
    articlesData.push({source:link, ...articleData });
  }

  const json = JSON.stringify({articlesTopics,articlesData})
  writeFile(`./export/...json`, json, 'utf8', (err) => {
    if (err) console.error(err)})

  await browser.close();
};

main()