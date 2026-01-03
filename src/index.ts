import * as csv from "csv-writer";
import * as fs from "fs";
import {
  kevaWriterArray,
  teamimWriterArray,
  giftcardBranchInfo,
  giftcardCorpsInfo,
  mcccardBranchInfo,
  mcccardCorpsInfo,
  mccRestStoreInfo,
  EnrichedStoreInfo,
  mccWriterArray,
  fetchAllData,
  loadAllData,
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

  const csvWriterMsscard1 = createCsvWriter({
    path: OUTPUD_DIR_PATH + "/msscard1.csv",
    header: mccWriterArray,
  });

  const csvWriterMsscard2 = createCsvWriter({
    path: OUTPUD_DIR_PATH + "/msscard2.csv",
    header: mccWriterArray,
  });

  const csvWriterMccRest1 = createCsvWriter({
    path: OUTPUD_DIR_PATH + "/mcc_rest1.csv",
    header: teamimWriterArray,
  });

  const csvWriterMccRest2 = createCsvWriter({
    path: OUTPUD_DIR_PATH + "/mcc_rest2.csv",
    header: teamimWriterArray,
  });

  return {
    csvWriterTeamim,
    csvWriterKeva1,
    csvWriterKeva2,
    csvWriterMsscard1,
    csvWriterMsscard2,
    csvWriterMccRest1,
    csvWriterMccRest2,
  };
}

async function main() {
  console.log("Start running script");

  // Fetch all data files first
  console.log("Fetching data files...");
  await fetchAllData();
  console.log("Data files fetched successfully!");

  // Load all data after fetching
  const {
    teamimBranchesInfo,
    giftcardBranchesDictionary,
    giftcardCorpsArray,
    mcccardBranchesDictionary,
    mcccardCorpsArray,
    mccRestBranchesInfo,
  } = loadAllData();

  const {
    csvWriterTeamim,
    csvWriterKeva1,
    csvWriterKeva2,
    csvWriterMsscard1,
    csvWriterMsscard2,
    csvWriterMccRest1,
    csvWriterMccRest2,
  } = await initWriters();

  // ****************************************************************
  // **************************** Teamim ****************************
  // ****************************************************************
  // fix duplicate stores locations
  let teamimStoresNoZero = teamimBranchesInfo.filter(
    (store) => store.latitude && store.longitude && +store.latitude >= 1 && +store.longitude >= 1
  );
  let fixedTeamimStores = correctDuplicateStoresCircle(teamimStoresNoZero as EnrichedStoreInfo[]);

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

  csvWriterMsscard1
    .writeRecords(mccStores[0])
    .then(() =>
      console.log(
        `The Msscard 1 CSV file was written successfully with ${mccStores[0].length} records`
      )
    );
  csvWriterMsscard2
    .writeRecords(mccStores[1])
    .then(() =>
      console.log(
        `The Msscard 2 CSV file was written successfully with ${mccStores[1].length} records`
      )
    );

  // ****************************************************************
  // **************************** MCC Rest ****************************
  // ****************************************************************
  // fix duplicate stores locations
  let mccRestStoresNoZero = mccRestBranchesInfo.filter(
    (store) => store.latitude && store.longitude && +store.latitude >= 1 && +store.longitude >= 1
  );
  let fixedMccRestStores = correctDuplicateStoresCircle(mccRestStoresNoZero as EnrichedStoreInfo[]);

  // sort by category
  fixedMccRestStores.sort((a, b) => {
    const categoryA = (a as any).category || "";
    const categoryB = (b as any).category || "";
    if (categoryA < categoryB) {
      return -1;
    }
    if (categoryA > categoryB) {
      return 1;
    }
    return 0;
  });

  // Only split if there are more than 2000 records
  if (fixedMccRestStores.length > MAX_GOOGLE_API_LAYER_RECORDS) {
    // Split to 2 files to avoid more than 2000 records - google api limitation,
    // Also, stop with changing of the category to make sure a category isn't split between the 2 files
    let [mccRestStores1, mccRestStores2] = splitStoresByCategory(fixedMccRestStores);

    csvWriterMccRest1
      .writeRecords(mccRestStores1)
      .then(() =>
        console.log(
          `The Mcc Rest 1 CSV file was written successfully with ${mccRestStores1.length} records`
        )
      );

    csvWriterMccRest2
      .writeRecords(mccRestStores2)
      .then(() =>
        console.log(
          `The Mcc Rest 2 CSV file was written successfully with ${mccRestStores2.length} records`
        )
      );
  } else {
    // If less than 2000 records, only create mcc_rest1.csv
    csvWriterMccRest1
      .writeRecords(fixedMccRestStores)
      .then(() =>
        console.log(
          `The Mcc Rest CSV file was written successfully with ${fixedMccRestStores.length} records`
        )
      );
  }
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
  let stores: any[] = [];

  // Enrich dictionary with general corp info
  for (let key in dictionary) {
    let corpStores = dictionary[key];
    // check if key matches kevaGeneralCorpsArray company name
    let generalCorpInfo: giftcardCorpsInfo | mcccardCorpsInfo | undefined = corpsArray.find(
      (corp: giftcardCorpsInfo | mcccardCorpsInfo) => corp.company === key
    );

    if (generalCorpInfo) {
      for (let i = 0; i < corpStores.length; i++) {
        let store: Partial<giftcardBranchInfo> | Partial<mcccardBranchInfo> = corpStores[i];

        // enrich store with general corp info
        let enrichedStoreObject: any = {
          ...store,
          company: key,
          company_category: generalCorpInfo.company_category,
          website: generalCorpInfo.website,
          is_online: generalCorpInfo.is_online,
          is_new: generalCorpInfo.is_new,
        };
        // Check that the enrichedStoreObject coordinates ar at least of length 1 from 0,0
        if (enrichedStoreObject && enrichedStoreObject.latitude && enrichedStoreObject.longitude &&
          +enrichedStoreObject.latitude >= 1 &&
          +enrichedStoreObject.longitude >= 1
        ) {
          stores.push(enrichedStoreObject);
        }
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

// Split stores by category field (for mcc_rest and teamim-like stores)
function splitStoresByCategory(stores: EnrichedStoreInfo[]): [EnrichedStoreInfo[], EnrichedStoreInfo[]] {
  let stores1: EnrichedStoreInfo[] = [];
  let stores2: EnrichedStoreInfo[] = [];

  if (stores.length === 0) {
    return [stores1, stores2];
  }

  let itr = 0;
  let currentCategory = (stores[0] as any).category || "";
  let categoryStartIndexInStores = 0;
  let categoryStartIndexInStores1 = 0;

  // Fill stores1 up to the limit, but never split a category
  while (itr < stores.length) {
    // Check if we're entering a new category
    const storeCategory = (stores[itr] as any).category || "";
    if (storeCategory !== currentCategory) {
      // We're at the start of a new category
      // Check if we've already reached the limit
      if (stores1.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
        // We've reached the limit, stop here and put the new category in stores2
        break;
      }

      // Check how many items are in this new category
      let newCategoryCount = 0;
      let checkIndex = itr;
      while (checkIndex < stores.length &&
        ((stores[checkIndex] as any).category || "") === storeCategory) {
        newCategoryCount++;
        checkIndex++;
      }

      // If adding this entire new category would exceed the limit, stop stores1 here
      if (stores1.length + newCategoryCount > MAX_GOOGLE_API_LAYER_RECORDS) {
        break;
      }

      // Otherwise, update the category and continue
      currentCategory = storeCategory;
      categoryStartIndexInStores = itr;
      categoryStartIndexInStores1 = stores1.length;
    }

    // Check if adding this item would exceed the limit
    if (stores1.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
      // We've reached the limit while in the middle of a category
      // Remove all items of the current category from stores1
      stores1 = stores1.slice(0, categoryStartIndexInStores1);
      // Reset itr to the start of this category so it goes to stores2
      itr = categoryStartIndexInStores;
      break;
    }

    stores1.push(stores[itr]);
    itr++;
  }

  // Fill stores2 with the remaining stores
  while (itr < stores.length) {
    if (stores2.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
      break;
    }
    stores2.push(stores[itr]);
    itr++;
  }

  return [stores1, stores2];
}

type StoresType = (Partial<giftcardBranchInfo> & Partial<giftcardCorpsInfo>) | (Partial<mcccardBranchInfo> & Partial<mcccardCorpsInfo>);
// fill the maximum amount of stores in each file without splitting a category
function splitStores(stores: StoresType[]): [StoresType[], StoresType[]] {
  let stores1: StoresType[] = [];
  let stores2: StoresType[] = [];

  if (stores.length === 0) {
    return [stores1, stores2];
  }

  let itr = 0;
  let currentCategory = stores[0].company_category;
  let categoryStartIndexInStores = 0;
  let categoryStartIndexInStores1 = 0;

  // Fill stores1 up to the limit, but never split a category
  while (itr < stores.length) {
    // Check if we're entering a new category
    if (stores[itr].company_category !== currentCategory) {
      // We're at the start of a new category
      // Check if we've already reached the limit
      if (stores1.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
        // We've reached the limit, stop here and put the new category in stores2
        break;
      }

      // Check how many items are in this new category
      let newCategoryCount = 0;
      let checkIndex = itr;
      while (checkIndex < stores.length &&
        stores[checkIndex].company_category === stores[itr].company_category) {
        newCategoryCount++;
        checkIndex++;
      }

      // If adding this entire new category would exceed the limit, stop stores1 here
      if (stores1.length + newCategoryCount > MAX_GOOGLE_API_LAYER_RECORDS) {
        break;
      }

      // Otherwise, update the category and continue
      currentCategory = stores[itr].company_category;
      categoryStartIndexInStores = itr;
      categoryStartIndexInStores1 = stores1.length;
    }

    // Check if adding this item would exceed the limit
    if (stores1.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
      // We've reached the limit while in the middle of a category
      // Remove all items of the current category from stores1
      stores1 = stores1.slice(0, categoryStartIndexInStores1);
      // Reset itr to the start of this category so it goes to stores2
      itr = categoryStartIndexInStores;
      break;
    }

    stores1.push(stores[itr]);
    itr++;
  }

  // Fill stores2 with the remaining stores
  while (itr < stores.length) {
    if (stores2.length >= MAX_GOOGLE_API_LAYER_RECORDS) {
      break;
    }
    stores2.push(stores[itr]);
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

    if (!store.latitude || !store.longitude) {
      continue;
    }

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
