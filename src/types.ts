// import fs
import fetch from "node-fetch";
import fs from "fs";

// Helper function to strip BOM and parse JSON safely
const parseJSONFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  let content = fs.readFileSync(filePath, "utf-8");
  if (!content || content.length === 0) {
    throw new Error(`File is empty: ${filePath}`);
  }
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Fetch the data and save to the given path
const fetchData = async (url: string, filePath: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const data = await response.text();
    if (!data || data.length === 0) {
      throw new Error(`Empty response from ${url}`);
    }
    // Strip BOM if present before saving
    const cleanData = data.charCodeAt(0) === 0xfeff ? data.slice(1) : data;
    // Ensure directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, cleanData, "utf-8");
  } catch (error) {
    throw new Error(`Error fetching ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Fetch all data files first
export const fetchAllData = async () => {
  await Promise.all([
    fetchData(
      "https://www.hvr.co.il/bs2/datasets/teamimcard_branches.json",
      "./src/hvrDB/teamimcard_branches.json"
    ),
    fetchData(
      "https://www.hvr.co.il/bs2/datasets/giftcard_branches.json",
      "./src/hvrDB/giftcard_branches.json"
    ),
    fetchData(
      "https://www.hvr.co.il/bs2/datasets/giftcard.json",
      "./src/hvrDB/giftcard.json"
    ),
    fetchData(
      "https://www.mcc.co.il/bs2/datasets/mcccard.json",
      "./src/hvrDB/mcccard.json"
    ),
    fetchData(
      "https://www.mcc.co.il/bs2/datasets/mcccard_branches.json",
      "./src/hvrDB/mcccard_branches.json"
    ),
    fetchData(
      "https://www.mcc.co.il/bs2/datasets/mcc_rest_branches.json",
      "./src/hvrDB/mcc_rest_branches.json"
    ),
  ]);
  // Small delay to ensure all files are fully written
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Type definitions based on expected structure
export type TeamimStoreInfo = {
  branch: Array<{
    name?: string;
    desc?: string;
    type?: string;
    hours?: string;
    address?: string;
    website?: string;
    phone?: string;
    delivery?: string;
    kosher?: string;
    handicap?: string;
    category?: string;
    city?: string;
    area?: string;
    is_new?: string;
    latitude?: string;
    longitude?: string;
  }>;
};

export type giftcardBranchInfo = {
  name?: string;
  region?: string;
  address?: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
  company?: string;
};

export type giftcardCorpsInfo = {
  company: string;
  company_category?: string;
  website?: string;
  is_online?: string;
  is_new?: string;
};

export type mcccardBranchInfo = {
  name?: string;
  region?: string;
  address?: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
};

export type mcccardCorpsInfo = {
  company: string;
  company_category?: string;
  website?: string;
  is_online?: string;
  is_new?: string;
};

export type mccRestStoreInfo = {
  name?: string;
  desc?: string;
  type?: string;
  hours?: string;
  address?: string;
  website?: string;
  phone?: string;
  delivery?: string;
  kosher?: string;
  handicap?: string;
  category?: string;
  city?: string;
  area?: string;
  is_new?: string;
  latitude?: string;
  longitude?: string;
};

// Load JSON files after they've been fetched
export const loadAllData = () => {
  const teamimBranches = parseJSONFile("./src/hvrDB/teamimcard_branches.json");
  const teamimBranchesInfo: TeamimStoreInfo["branch"] = teamimBranches.branch;

  const giftcardBranches = parseJSONFile("./src/hvrDB/giftcard_branches.json");
  const giftcardBranchesDictionary: {
    [index: string]: Partial<giftcardBranchInfo>[];
  } = giftcardBranches;

  const giftcardCorps = parseJSONFile("./src/hvrDB/giftcard.json");
  const giftcardCorpsArray: giftcardCorpsInfo[] = giftcardCorps;

  const mcccardBranches = parseJSONFile("./src/hvrDB/mcccard_branches.json");
  const mcccardBranchesDictionary: {
    [index: string]: Partial<mcccardBranchInfo>[];
  } = mcccardBranches;

  const mcccardCorps = parseJSONFile("./src/hvrDB/mcccard.json");
  const mcccardCorpsArray: mcccardCorpsInfo[] = mcccardCorps;

  const mccRestBranches = parseJSONFile("./src/hvrDB/mcc_rest_branches.json");
  const mccRestBranchesInfo: mccRestStoreInfo[] = mccRestBranches.branch;

  return {
    teamimBranchesInfo,
    giftcardBranchesDictionary,
    giftcardCorpsArray,
    mcccardBranchesDictionary,
    mcccardCorpsArray,
    mccRestBranchesInfo,
  };
};

export type EnrichedStoreInfo = TeamimStoreInfo["branch"][0];

// enriched data from the store and the company
const kevaWriterArray = [
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

const mccWriterArray = kevaWriterArray;

const teamimWriterArray = [
  { id: "name", title: "שם" },
  { id: "desc", title: "תיאור" },
  { id: "type", title: "סוג" },
  { id: "hours", title: "שעות פתיחה" },
  { id: "address", title: "כתובת" },
  { id: "website", title: "אתר אינטרנט" },
  { id: "phone", title: "טלפון" },
  { id: "delivery", title: "משלוחים" },
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
  kevaWriterArray,
  mccWriterArray,
  teamimWriterArray,
};
