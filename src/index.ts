import * as csv from "csv-writer";
import * as fs from "fs";

import {
  kevaWriterArray,
  teamimWriterArray,
  kevaStoresDictionary,
  kevaGeneralCorpsArray,
  teamimStores,
  KevaStoreInfo,
  KevaCorpsInfo,
} from "./types";

const OUTPUD_DIR_PATH = "./output";
const MAX_GOOGLE_API_LAYER_RECORDS = 2000;

// create output directory if not exists
if (!fs.existsSync(OUTPUD_DIR_PATH)) {
  fs.mkdirSync(OUTPUD_DIR_PATH, { recursive: true });
}

// create csv-writer for all output files
const createCsvWriter = csv.createObjectCsvWriter;
const csvWriterTeamim = createCsvWriter({
  path: OUTPUD_DIR_PATH + "/teamim.csv",
  header: teamimWriterArray,
});

const csvWriterKeva1 = createCsvWriter({
  path: OUTPUD_DIR_PATH + "/keva1.csv",
  header: kevaWriterArray,
});

const csvWriterKeva2 = createCsvWriter({
  path: OUTPUD_DIR_PATH + "/keva2.csv",
  header: kevaWriterArray,
});

function main() {
  console.log("Start running script");

  // ****************************************************************
  // **************************** Teamim ****************************
  // ****************************************************************
  csvWriterTeamim
    .writeRecords(teamimStores)
    .then(() => console.log("The Teamim CSV file was written successfully"));

  // ****************************************************************
  // ***************************** Keva *****************************
  // ****************************************************************
  const kevaStores: (Partial<KevaStoreInfo> & Partial<KevaCorpsInfo>)[] = [];

  let kevaStoresCounter = 0;

  // enrich kevaStoresDictionary with general corp info
  for (let key in kevaStoresDictionary) {
    kevaStoresCounter += kevaStoresDictionary[key].length;
    let corpStores = kevaStoresDictionary[key];
    // check if key matches kevaGeneralCorpsArray company name
    let generalCorpInfo: KevaCorpsInfo | undefined = kevaGeneralCorpsArray.find(
      (corp: KevaCorpsInfo) => corp.company === key
    );

    if (generalCorpInfo) {
      for (let i = 0; i < corpStores.length; i++) {
        let store: Partial<KevaStoreInfo> = corpStores[i];
        store.company = key;

        // enrich store with general corp info
        let enrichedStoreObject: Partial<KevaStoreInfo> &
          Partial<KevaCorpsInfo> = {
          ...store,
          company_category: generalCorpInfo.company_category,
          website: generalCorpInfo.website,
          is_online: generalCorpInfo.is_online,
          is_new: generalCorpInfo.is_new,
        };
        kevaStores.push(enrichedStoreObject);
      }
    } else {
      console.log(`No general info for ${key}`);
    }
  }

  // sort by category
  kevaStores.sort((a, b) => {
    if (!a.company_category || !b.company_category) {
      return 0;
    }
    if (a.company_category < b.company_category) {
      return -1;
    }
    if (a.company_category > b.company_category) {
      return 1;
    }
    return 0;
  });

  // Split to 2 files to avoid more than 2000 records - google api limitaion,
  // Also, stop with changing of the category
  let itr = MAX_GOOGLE_API_LAYER_RECORDS;
  let lastCategory = kevaStores[itr - 1].company_category;

  while (itr > 0) {
    if (kevaStores[itr].company_category !== lastCategory) {
      break;
    }
    itr--;
  }

  let kevaStores1 = kevaStores.slice(0, itr + 1);
  let kevaStores2 = kevaStores.slice(itr + 1, kevaStores.length);

  csvWriterKeva1
    .writeRecords(kevaStores1)
    .then(() => console.log("The Keva 1 CSV file was written successfully"));
  csvWriterKeva2
    .writeRecords(kevaStores2)
    .then(() => console.log("The Keva 2 CSV file was written successfully"));
}

main();
