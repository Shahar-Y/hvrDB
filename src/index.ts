import * as csv from "csv-writer";
import * as fs from "fs";

import {
  kevaWriterArray,
  teamimWriterArray,
  kevaStoresDictionary,
  kevaGeneralCorpsArray,
  teamimStores,
  TeamimStoreInfo,
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
  // fix duplicate stores locations
  let fixedTeamimStores = correctDuplicateStores(teamimStores);

  csvWriterTeamim
    .writeRecords(fixedTeamimStores)
    .then(() => console.log("The Teamim CSV file was written successfully"));

  // ****************************************************************
  // ***************************** Keva *****************************
  // ****************************************************************
  let kevaStores: (Partial<KevaStoreInfo> & Partial<KevaCorpsInfo>)[] = [];

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

  // fix duplicate stores locations
  kevaStores = correctDuplicateStores(kevaStores as KevaStoreInfo[]);

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

// return an array of the stores after their location has been updated to not contain duplicates
function correctDuplicateStores(
  storesArray: KevaStoreInfo[] | TeamimStoreInfo[]
) {
  for (let i = 0; i < storesArray.length - 1; i++) {
    let store = storesArray[i];
    for (let j = i + 1; j < storesArray.length; j++) {
      let store2 = storesArray[j];
      // check if store location is not 0,0 and if it is the same as the next store
      if (
        +store.latitude > 0.1 &&
        +store.longitude > 0.1 &&
        +store2.latitude > 0.1 &&
        +store2.longitude > 0.1 &&
        store2.latitude === store.latitude &&
        store2.longitude === store.longitude
      ) {
        let rand = Math.random() * 2 - 1;
        storesArray[j].latitude = (
          +storesArray[j].latitude +
          0.0001 * rand
        ).toString();
        storesArray[j].longitude = (
          +storesArray[j].longitude +
          0.0001 * rand
        ).toString();
        console.log(
          `Duplicate store: ${storesArray[i].latitude}, ${storesArray[i].longitude} - ${storesArray[j].latitude}, ${storesArray[j].longitude}`
        );
      }
    }
  }
  return storesArray;
}

main();
