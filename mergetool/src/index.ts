import fs from "fs";
import { MongoClient } from "mongodb";

const connstring = process.env.CONNSTRING || "";


export async function getDocuments() {
  const client = await MongoClient.connect(connstring, {useNewUrlParser: true});

  const db = client.db("articles");
  const docs = await db.collection("reddit")
                        .find()
                        .map((doc) => doc)
                        .toArray();

  const docCache = fs.createWriteStream("doccache", {flags: "a"});
  const articles = fs.createWriteStream("articles.txt", {flags: "a"});
  docs.forEach((doc) => {
      docCache.write(doc._id + "\n");
      articles.write(doc.body + "\n\n\n");
    });

  console.log("Writing done.");
  docCache.end();
  articles.end();
}

console.log("Starting");
getDocuments();
