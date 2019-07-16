import Parser from "rss-parser";
import fetch from "node-fetch"; 
import { resolve } from "dns";
import { parse } from "node-html-parser";

const uri = "https://www.reddit.com/r/news.rss"


export async function readFeed() {
  const parser = new Parser();
  let feed = await parser.parseURL(uri);
  console.log(feed.title);

    feed.items!.forEach(item => {
      fetch(item.link)
        .then(body => {
          body.text().then(txt =>
            {
              console.log(parse(txt).childNodes.toString());
            });
        });
  })
}

// export async function visit(uri: string | undefined) {
//   return fetch(uri);
// }

readFeed();