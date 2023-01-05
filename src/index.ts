import branches from "./teamimcard_branches.json";
import * as fs from "fs";
import * as csv from "csv-writer";

type StoreInfo = typeof branches.branch[0];

const stores: StoreInfo[] = branches.branch;

const createCsvWriter = csv.createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "./file.csv",

  // all fields in StoreInfo
  header: [
    // { id: "img", title: "תמונה" },
    { id: "name", title: "שם" },
    { id: "desc", title: "תיאור" },
    { id: "area", title: "אזור" },
    { id: "city", title: "עיר" },
    { id: "address", title: "כתובת" },
    { id: "phone", title: "טלפון" },
    { id: "category", title: "קטגוריה" },
    { id: "type", title: "סוג" },
    { id: "hours", title: "שעות פתיחה" },
    { id: "kosher", title: "כשר" },
    { id: "handicap", title: "נגישות לנכים" },
    { id: "website", title: "אתר אינטרנט" },
    { id: "is_delivery", title: "משלוחים" },
    { id: "is_new", title: "חדש" },
    { id: "latitude", title: "latitude" },
    { id: "longitude", title: "longitude" },
  ],
});

// const records = [
//   { name: "Bob2", lang: "French, English" },
//   { name: "Mary", lang: "English" },
// ];

// csvWriter
//   .writeRecords(records) // returns a promise
//   .then(() => {
//     console.log("...Done");
//   });

function main() {
  console.log("Hello World!");
  //   console.log(branches);
  console.log(stores[1]);

  csvWriter
    .writeRecords(stores)
    .then(() => console.log("The CSV file was written successfully"));

  // stores.forEach((store) => {
  //   console.log(store);
  // });
}

main();
