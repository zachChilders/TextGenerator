
import cheerio from "cheerio";
import fetch from "node-fetch";

const uri = "https://www.reddit.com/r/news+worldnews+politics/.json";

// Handle each link in the reddit feed
export function handleUrl(url: string) {
  fetch(url)
  .then( (x) => new Promise( (resolve) => setTimeout(() => resolve(x), 2000)))
  .then( (page) => {
    return page.text();
  })
  .then ( (html) => {
    const $ = cheerio.load(html);
    console.log($("p").text()); // We should probably be smarter than <p>
  });
}

// Read a reddit feed
export function readFeed() {
  fetch(uri)
  .then( (body) => {
    return body.json();
  })
  .then( (src) => {
    return src.data.children;
  })
  .then( (children) => {
    children.forEach( (post: { data: { url: string; }; }) => {
      handleUrl(post.data.url);
    });
  });

}

readFeed();
