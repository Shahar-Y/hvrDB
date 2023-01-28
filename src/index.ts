import * as csv from "csv-writer";
import * as fs from "fs";
import {
  kevaWriterArray,
  teamimWriterArray,
  giftcardBranchesDictionary,
  giftcardCorpsArray,
  teamimStores,
  TeamimStoreInfo,
  giftcardBranchInfo,
  giftcardCorpsInfo,
  mcccardBranchInfo,
  mcccardCorpsInfo,
  mcccardBranchesDictionary,
  mcccardCorpsArray,
  mccWriterArray,
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

const csvWriterMcc1 = createCsvWriter({
  path: OUTPUD_DIR_PATH + "/mcc1.csv",
  header: mccWriterArray,
});

const csvWriterMcc2 = createCsvWriter({
  path: OUTPUD_DIR_PATH + "/mcc2.csv",
  header: mccWriterArray,
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
    .then(() =>
      console.log(
        `Teamim file was written successfully with ${fixedTeamimStores.length} records`
      )
    );

  // ****************************************************************
  // *********************** Giftcard and MCC ***********************
  // ****************************************************************

  let kevaStores: (Partial<giftcardBranchInfo> &
    Partial<giftcardCorpsInfo>)[][] = manageStoresData(
    giftcardBranchesDictionary,
    giftcardCorpsArray
  );

  let mccStores: (Partial<mcccardBranchInfo> & Partial<mcccardCorpsInfo>)[][] =
    manageStoresData(mcccardBranchesDictionary, mcccardCorpsArray);

  csvWriterKeva1
    .writeRecords(kevaStores[0])
    .then(() =>
      console.log(
        `The Keva 1 CSV file was written successfully with ${kevaStores[0].length} records`
      )
    );
  csvWriterKeva2
    .writeRecords(kevaStores[1])
    .then(() =>
      console.log(
        `The Keva 2 CSV file was written successfully with ${kevaStores[1].length} records`
      )
    );

  csvWriterMcc1
    .writeRecords(mccStores[0])
    .then(() =>
      console.log(
        `The Mcc 1 CSV file was written successfully with ${mccStores[0].length} records`
      )
    );
  csvWriterMcc2
    .writeRecords(mccStores[1])
    .then(() =>
      console.log(
        `The Mcc 2 CSV file was written successfully with ${mccStores[1].length} records`
      )
    );
}

function manageStoresData(
  dictionary:
    | {
        [index: string]: Partial<giftcardBranchInfo>[];
      }
    | {
        [index: string]: Partial<mcccardBranchInfo>[];
      },
  corpsArray: giftcardCorpsInfo[] | mcccardCorpsInfo[]
) {
  let stores: (Partial<giftcardBranchInfo> & Partial<giftcardCorpsInfo>)[] = [];

  // Enrich kevaStoresDictionary with general corp info
  for (let key in dictionary) {
    let corpStores = dictionary[key];
    // check if key matches kevaGeneralCorpsArray company name
    let generalCorpInfo: giftcardCorpsInfo | undefined = corpsArray.find(
      (corp: giftcardCorpsInfo) => corp.company === key
    );

    if (generalCorpInfo) {
      for (let i = 0; i < corpStores.length; i++) {
        let store: Partial<giftcardBranchInfo> = corpStores[i];
        store.company = key;

        // enrich store with general corp info
        let enrichedStoreObject: Partial<giftcardBranchInfo> &
          Partial<giftcardCorpsInfo> = {
          ...store,
          company_category: generalCorpInfo.company_category,
          website: generalCorpInfo.website,
          is_online: generalCorpInfo.is_online,
          is_new: generalCorpInfo.is_new,
        };
        stores.push(enrichedStoreObject);
      }
    } else {
      console.log(`No general info for ${key}`);
    }
  }

  // sort by category
  stores.sort((a, b) => {
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
  stores = correctDuplicateStores(stores as giftcardBranchInfo[]);

  // Split to 2 files to avoid more than 2000 records - google api limitaion,
  // Also, stop with changing of the category
  let itr = MAX_GOOGLE_API_LAYER_RECORDS;
  let lastCategory = stores[itr - 1].company_category;

  while (itr > 0) {
    if (stores[itr].company_category !== lastCategory) {
      break;
    }
    itr--;
  }

  let stores1 = stores.slice(0, itr + 1);
  let stores2 = stores.slice(itr + 1, stores.length);

  return [stores1, stores2];
}

// return an array of the stores after their location has been updated to not contain duplicates
function correctDuplicateStores(
  storesArray: giftcardBranchInfo[] | TeamimStoreInfo[]
) {
  let ctr = 0;
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
        ctr += 1;
        const MIL = 1000000;
        let rand1 = Math.random() * 2 - 1;
        let rand2 = Math.random() * 2 - 1;
        const sign1 = Math.random() > 0.5 ? 1 : -1;
        const sign2 = Math.random() > 0.5 ? 1 : -1;
        storesArray[j].latitude = (
          Math.round(
            (+storesArray[j].latitude + 0.0001 * rand1 * sign1) * MIL
          ) / MIL
        ).toString();
        storesArray[j].longitude = (
          Math.round(
            (+storesArray[j].longitude + 0.0001 * rand2 * sign2) * MIL
          ) / MIL
        ).toString();

        // console.log(
        //   `Duplicate store: ${storesArray[i].latitude}, ${storesArray[i].longitude} - ${storesArray[j].latitude}, ${storesArray[j].longitude}`
        // );
      }
    }
  }
  console.log(`Fixed ${ctr} duplicate stores`);
  return storesArray;
}

main();
