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

  // TODO: add mcc to output

  let kevaStores: (Partial<giftcardBranchInfo> & Partial<giftcardCorpsInfo>)[] =
    [];

  let kevaStoresCounter = 0;

  // Enrich kevaStoresDictionary with general corp info
  for (let key in giftcardBranchesDictionary) {
    kevaStoresCounter += giftcardBranchesDictionary[key].length;
    let corpStores = giftcardBranchesDictionary[key];
    // check if key matches kevaGeneralCorpsArray company name
    let generalCorpInfo: giftcardCorpsInfo | undefined =
      giftcardCorpsArray.find(
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
  kevaStores = correctDuplicateStores(kevaStores as giftcardBranchInfo[]);

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

function manageStoresData(
  dictionary:
    | {
        [index: string]: Partial<giftcardBranchInfo>[];
      }
    | {
        [index: string]: Partial<mcccardBranchInfo>[];
      }
) {}

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

        console.log(
          `Duplicate store: ${storesArray[i].latitude}, ${storesArray[i].longitude} - ${storesArray[j].latitude}, ${storesArray[j].longitude}`
        );
      }
    }
  }
  console.log(`Fixed ${ctr} duplicate stores`);
  return storesArray;
}

main();
