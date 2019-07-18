
import cheerio from "cheerio";
import express from "express";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const minimumArticleLength = process.env.SCRAPER_MIN_ARTICLE_LENGTH || 500;
const uri = process.env.SCRAPER_SUBREDDIT || "https://www.reddit.com/r/news+worldnews+politics/.json";
const connstring = process.env.SCRAPER_CONNSTRING || "";
const port = 80;

// MongoDB Schema
interface IArticle {
  url: string;
  body: string;
}

// Handle each link in the reddit feed
export async function handleUrl(url: string): Promise<IArticle> {
  return fetch(url)
    .then( (page) => { // Get html of the page
      return page.text();
    })
    .then ( (html) => { // Grab all text in the article
      const $ = cheerio.load(html);
      return {url, body: $("p").text()} ; // We should probably be smarter than <p>
    });

}

// Read a reddit feed
export async function readFeed() {
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

console.log(`connstring: ${process.env.SCRAPER_CONNSTRING}`);
// Run
setInterval(() => { readFeed(); }, 2000);

express()
  .get("/keepalive", (req, res) => res.send(`Alive\n${new Date()}`))
  .listen(port, () => console.log(`Listening on port ${port}!`));
