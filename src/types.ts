// import fs
import fetch from "node-fetch";
import fs from "fs";

// Fetch the data and save to the given path
const fetchData = async (url: string, filePath: string) => {
  const response = await fetch(url);
  const data = await response.text();
  fs.writeFileSync(filePath, data);
};

// https://www.hvr.co.il/bs2/datasets/giftcard_branches.json
// https://www.hvr.co.il/bs2/datasets/teamimcard_branches.json
// https://www.hvr.co.il/bs2/datasets/giftcard.json
// https://www.mcc.co.il/bs2/datasets/mcccard.json
// https://www.mcc.co.il/bs2/datasets/mcccard_branches.json
fetchData(
  "https://www.hvr.co.il/bs2/datasets/teamimcard_branches.json",
  "./src/hvrDB/teamimcard_branches.json"
);
fetchData(
  "https://www.hvr.co.il/bs2/datasets/giftcard_branches.json",
  "./src/hvrDB/giftcard_branches.json"
);
fetchData(
  "https://www.hvr.co.il/bs2/datasets/giftcard.json",
  "./src/hvrDB/giftcard.json"
);
fetchData(
  "https://www.mcc.co.il/bs2/datasets/mcccard.json",
  "./src/hvrDB/mcccard.json"
);
fetchData(
  "https://www.mcc.co.il/bs2/datasets/mcccard_branches.json",
  "./src/hvrDB/mcccard_branches.json"
);

import teamimBranches from "./hvrDB/teamimcard_branches.json";

type TeamimStoreInfo = typeof teamimBranches.branch[0];

let teamimBranchesInfo: TeamimStoreInfo[] = teamimBranches.branch;

import * as giftcardBranches from "./hvrDB/giftcard_branches.json";
type giftcardBranchInfo = typeof giftcardBranches.ACE[0] & { company: string };
const giftcardBranchesDictionary: {
  [index: string]: Partial<giftcardBranchInfo>[];
} = giftcardBranches;

import giftcardCorps from "./hvrDB/giftcard.json";
type giftcardCorpsInfo = typeof giftcardCorps[0];
const giftcardCorpsArray: giftcardCorpsInfo[] = giftcardCorps;

import * as mcccardBranches from "./hvrDB/mcccard_branches.json";
type mcccardBranchInfo = typeof mcccardBranches.ACE[0];
const mcccardBranchesDictionary: {
  [index: string]: Partial<mcccardBranchInfo>[];
} = mcccardBranches;

import mcccardCorps from "./hvrDB/mcccard.json";
type mcccardCorpsInfo = typeof mcccardCorps[0];
const mcccardCorpsArray: mcccardCorpsInfo[] = mcccardCorps;

type EnrichedStoreInfo = TeamimStoreInfo;

// enriched data from the store and the company
const kevaWriterArray = [
  { id: "company", title: "????????" },
  { id: "name", title: "????" },
  { id: "company_category", title: "??????????????" },
  { id: "website", title: "?????? ??????????????" },
  { id: "address", title: "??????????" },
  { id: "phone", title: "??????????" },
  { id: "is_online", title: "?????????? ??????????????" },
  { id: "region", title: "????????" },
  { id: "is_new", title: "??????" },
  { id: "latitude", title: "latitude" },
  { id: "longitude", title: "longitude" },
];

const mccWriterArray = kevaWriterArray;

const teamimWriterArray = [
  { id: "name", title: "????" },
  { id: "desc", title: "??????????" },
  { id: "type", title: "??????" },
  { id: "hours", title: "???????? ??????????" },
  { id: "address", title: "??????????" },
  { id: "website", title: "?????? ??????????????" },
  { id: "phone", title: "??????????" },
  { id: "is_delivery", title: "??????????????" },
  { id: "kosher", title: "??????????" },
  { id: "handicap", title: "???????????? ??????????" },
  { id: "category", title: "??????????????" },
  { id: "city", title: "??????" },
  { id: "area", title: "????????" },
  { id: "is_new", title: "??????" },
  { id: "latitude", title: "latitude" },
  { id: "longitude", title: "longitude" },
];

export {
  giftcardBranchInfo,
  giftcardCorpsInfo,
  TeamimStoreInfo,
  mcccardBranchInfo,
  mcccardCorpsInfo,
  EnrichedStoreInfo,
  kevaWriterArray,
  mccWriterArray,
  teamimWriterArray,
  giftcardBranchesDictionary,
  giftcardCorpsArray,
  mcccardBranchesDictionary,
  mcccardCorpsArray,
  teamimBranchesInfo as teamimStores,
};
