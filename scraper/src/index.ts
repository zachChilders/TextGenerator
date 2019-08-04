
import cheerio from "cheerio";
import fs from "fs";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";
import readline from "readline";

// tslint:disable-next-line:max-line-length
const connstring = process.env.APPSETTING_SCRAPER_CONNSTRING || "mongodb://mics207:yawQXcYvDTqEMe3SMnI4m2VHiac59zPsIQp7GK4TVlO86haoY5H6jjrS1dHUcCqHLJnMGuxjxgHuDqy7tOcaMQ==@mics207.documents.azure.com:10255/?ssl=true&replicaSet=globaldb";
const port = 80;

// MongoDB Schema
interface IArticle {
  url: string;
  body: string;
}

// Parse a news article
export async function parseArticle(article: string): Promise<string> {
  const $ = await cheerio.load(article);
  return $("p").text();
}

// Handle each link in the reddit feed
export async function handleUrl(url: string): Promise<IArticle> {
  const response = await fetch(url);
  const html = await response.text();
  const article = await parseArticle(html);
  return {url, body: article} ; // We should probably be smarter than <p>
}

// Read a reddit feed
export async function readFeed() {
  // Refresh App settings
  const uri = process.env.APPSETTING_SCRAPER_SUBREDDIT || "https://www.reddit.com/r/news+worldnews+politics/.json";
  const minimumArticleLength = Number(process.env.APPSETTING_SCRAPER_MIN_ARTICLE_LENGTH) || 250;

  // Setup MongoDB connection
  const client = await MongoClient.connect(connstring, {useNewUrlParser: true});
  const db = client.db("articles");

  // Scrape Reddit
  await fetch(uri)
    .then( (body) => { // Deserialize
      return body.json();
    })
    .then( (src) => { // Grab links
      return src.data.children;
    })
    .then( (children) => { // Process links
      children.forEach( async (post: { data: { url: string; }; }) => {

        // See if we've scrapped this URL before
        const cache = await db.collection("reddit").findOne({url: post.data.url});
        if (!cache) {

          // New article, scrape it.
          console.log(`Found Article: ${post.data.url}`);
          const article = await handleUrl(post.data.url);
          console.log(article.body.length);
          // Filter out shorter text.
          if (article.body.length > minimumArticleLength) {
            console.log("Adding to DB");
            await db.collection("reddit").insertOne(article);
          }
        }
      });
    })
    .catch((err) => console.log(err));
}

export async function readTsv() {
  // Setup MongoDB connection
  const client = await MongoClient.connect(connstring, {useNewUrlParser: true});
  const db = client.db("articles");

  const minimumArticleLength = Number(process.env.APPSETTING_SCRAPER_MIN_ARTICLE_LENGTH) || 250;
  const lineReader = readline.createInterface({
    input: fs.createReadStream("/home/zach/Documents/urls.csv"),
  });

  lineReader.on("line", async (line: string) => {
      // See if we've scrapped this URL before
      // New article, scrape it.
      const article = await handleUrl(line).catch((err) => console.log(`${line} down: ${err}`));
      // Filter out shorter text.
      if (article) {
        if (article.body.length > minimumArticleLength) {
          console.log(`Adding ${line} to DB`);
          await db.collection("reddit").insertOne(article);
        }
       }
  });
  console.log("Read");
}

console.log(`connstring: ${connstring}`);
readTsv();
