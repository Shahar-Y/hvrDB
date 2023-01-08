// https://www.hvr.co.il/bs2/datasets/teamimcard_branches.json
import branches from "./hvrDB/teamimcard_branches.json";

type StoreInfo = typeof branches.branch[0];

const teamimStores: StoreInfo[] = branches.branch;

// https://www.hvr.co.il/bs2/datasets/giftcard_branches.json
import * as kevaStoresJson from "./hvrDB/giftcard_branches.json";

type KevaStoreInfo = typeof kevaStoresJson.ACE[0] & { company: string };

const kevaStoresDictionary: { [index: string]: Partial<KevaStoreInfo>[] } =
  kevaStoresJson;

// https://www.hvr.co.il/bs2/datasets/giftcard.json
import * as kevaGeneralCorpsJson from "./hvrDB/giftcard.json";
type KevaCorpsInfo = typeof kevaGeneralCorpsJson.corps[0];

const kevaGeneralCorpsArray: KevaCorpsInfo[] = kevaGeneralCorpsJson.corps;

// enriched data from the store and the company
let kevaWriterArray = [
  { id: "company", title: "חברה" },
  { id: "name", title: "שם" },
  { id: "company_category", title: "קטגוריה" },
  { id: "website", title: "אתר אינטרנט" },
  { id: "address", title: "כתובת" },
  { id: "phone", title: "טלפון" },
  { id: "is_online", title: "קניות אונליין" },
  { id: "region", title: "אזור" },
  { id: "is_new", title: "חדש" },
  { id: "latitude", title: "latitude" },
  { id: "longitude", title: "longitude" },
];

let teamimWriterArray = [
  { id: "name", title: "שם" },
  { id: "desc", title: "תיאור" },
  { id: "type", title: "סוג" },
  { id: "hours", title: "שעות פתיחה" },
  { id: "address", title: "כתובת" },
  { id: "website", title: "אתר אינטרנט" },
  { id: "phone", title: "טלפון" },
  { id: "is_delivery", title: "משלוחים" },
  { id: "kosher", title: "כשרות" },
  { id: "handicap", title: "נגישות לנכים" },
  { id: "category", title: "קטגוריה" },
  { id: "city", title: "עיר" },
  { id: "area", title: "אזור" },
  { id: "is_new", title: "חדש" },
  { id: "latitude", title: "latitude" },
  { id: "longitude", title: "longitude" },
];

export {
  KevaStoreInfo,
  KevaCorpsInfo,
  StoreInfo,
  kevaWriterArray,
  teamimWriterArray,
  kevaStoresDictionary,
  kevaGeneralCorpsArray,
  teamimStores,
};
