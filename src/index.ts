import * as csv from "csv-writer";
import * as fs from "fs";
import {
  kevaWriterArray,
  teamimWriterArray,
  giftcardBranchesDictionary,
  giftcardCorpsArray,
  teamimStores,
  giftcardBranchInfo,
  giftcardCorpsInfo,
  mcccardBranchInfo,
  mcccardCorpsInfo,
  EnrichedStoreInfo,
  mcccardBranchesDictionary,
  mcccardCorpsArray,
  mccWriterArray,
} from "./types";

const OUTPUD_DIR_PATH = "./output";
const MAX_GOOGLE_API_LAYER_RECORDS = 2000;

async function initWriters() {
  // delete directory recursively
  try {
    fs.rmdirSync(OUTPUD_DIR_PATH, { recursive: true });

    console.log(`${OUTPUD_DIR_PATH} is deleted!`);
  } catch (err) {
    console.error(`Error while deleting ${OUTPUD_DIR_PATH}.`);
  }

  // create output directory if not exists
  if (fs.existsSync(OUTPUD_DIR_PATH)) {
    fs.unlinkSync(OUTPUD_DIR_PATH);
  }
  await delay(1500);
  fs.mkdirSync(OUTPUD_DIR_PATH, { recursive: true });

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

  return {
    csvWriterTeamim,
    csvWriterKeva1,
    csvWriterKeva2,
    csvWriterMcc1,
    csvWriterMcc2,
  };
}

async function main() {
  console.log("Start running script");

  const {
    csvWriterTeamim,
    csvWriterKeva1,
    csvWriterKeva2,
    csvWriterMcc1,
    csvWriterMcc2,
  } = await initWriters();

  // ****************************************************************
  // **************************** Teamim ****************************
  // ****************************************************************
  // fix duplicate stores locations
  let fixedTeamimStores = correctDuplicateStoresCircle(teamimStores);

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

  // Enrich dictionary with general corp info
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

  // fix duplicate stores locations
  stores = correctDuplicateStoresCircle(stores as EnrichedStoreInfo[]);

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

  // Split to 2 files to avoid more than 2000 records - google api limitaion,
  // Also, stop with changing of the category to make sure a category isn't split between the 2 files
  let [stores1, stores2] = splitStores(stores);

  return [stores1, stores2];
}

type StoresType = Partial<giftcardBranchInfo> & Partial<giftcardCorpsInfo>;
// fill the maximum amount of stores in each file without splitting a category
function splitStores(stores: StoresType[]): [StoresType[], StoresType[]] {
  let stores1: StoresType[] = [];
  let stores2: StoresType[] = [];

  let itr = 0;
  let lastCategory = stores[itr].company_category;

  while (itr < stores.length) {
    if (stores[itr].company_category !== lastCategory) {
      lastCategory = stores[itr].company_category;
    }

    if (stores1.length < MAX_GOOGLE_API_LAYER_RECORDS) {
      stores1.push(stores[itr]);
    } else if (stores2.length < MAX_GOOGLE_API_LAYER_RECORDS) {
      stores2.push(stores[itr]);
    } else {
      break;
    }

    itr++;
  }

  return [stores1, stores2];
}

// create a dictionary of the stores that have the same coordinates
// Key: latitude-longitude string
// Value: array of stores with the same coordinates
function createduplicateCoordinatesDictionary(
  storesArray: EnrichedStoreInfo[]
): {
  [index: string]: EnrichedStoreInfo[];
} {
  let duplicateCoordinatesDictionary: {
    [index: string]: EnrichedStoreInfo[];
  } = {};

  for (let i = 0; i < storesArray.length; i++) {
    let store: EnrichedStoreInfo = storesArray[i];

    let key = `${store.latitude}-${store.longitude}`;
    if (duplicateCoordinatesDictionary[key]) {
      duplicateCoordinatesDictionary[key].push(store);
    } else {
      duplicateCoordinatesDictionary[key] = [store];
    }
  }

  return duplicateCoordinatesDictionary;
}

// return an array of the stores after their location has been updated so that
// stored that had the same coordinates will now be located in a circle around the original location
function correctDuplicateStoresCircle(
  storesArray: EnrichedStoreInfo[]
): EnrichedStoreInfo[] {
  let duplicateCoordinatesDictionary =
    createduplicateCoordinatesDictionary(storesArray);

  // if there are no duplicates, return the original array
  if (
    Object.keys(duplicateCoordinatesDictionary).length === storesArray.length
  ) {
    return storesArray;
  }

  // if there are duplicates, update the coordinates of the stores
  let updatedStoresArray: EnrichedStoreInfo[] = [];

  for (let key in duplicateCoordinatesDictionary) {
    let storesWithSameCoordinates = duplicateCoordinatesDictionary[key];

    // if there is only one store with the same coordinates, add it to the updated array
    if (storesWithSameCoordinates.length === 1) {
      updatedStoresArray.push(storesWithSameCoordinates[0]);
    } else {
      // if there are more than one store with the same coordinates, update their coordinates
      let updatedStoresWithSameCoordinates = updateStoresCoordinates(
        storesWithSameCoordinates
      );
      updatedStoresArray = updatedStoresArray.concat(
        updatedStoresWithSameCoordinates
      );
    }
  }

  return updatedStoresArray;
}

// Update the coordinates of the stores so that they will be located
// in a circle around the original location
function updateStoresCoordinates(
  storesWithSameCoordinates: EnrichedStoreInfo[]
): EnrichedStoreInfo[] {
  let updatedStoresWithSameCoordinates: EnrichedStoreInfo[] = [];

  // distance between 0.0001 to 0.0002 depending on the number of stores - the more stores, the bigger the distance
  let distanceBetweenStores =
    0.0001 + (storesWithSameCoordinates.length - 1) * 0.000003;

  // calculate the angle between the stores
  let angleBetweenStores = (2 * Math.PI) / storesWithSameCoordinates.length;

  // update the coordinates of the stores
  for (let i = 0; i < storesWithSameCoordinates.length; i++) {
    let store = storesWithSameCoordinates[i];

    let updatedStore: EnrichedStoreInfo = {
      ...store,
      latitude:
        +store.latitude +
        distanceBetweenStores * Math.sin(angleBetweenStores * i) +
        "",
      longitude:
        +store.longitude +
        distanceBetweenStores * Math.cos(angleBetweenStores * i) +
        "",
    };

    updatedStoresWithSameCoordinates.push(updatedStore);
  }

  return updatedStoresWithSameCoordinates;
}

// delay function
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
