# hvrDB

### A simple script that uses the hever database to generate a csv table of locations

## Usage

1. Download the 3 files from the hever database using the API in `src/types.ts`
2. wrap the `giftcard.json` file with `{ "corps": [...] }` - making it a valid json object
3. run `npm install`
4. run `npm start`

## Output

The output wil be overwritten in the `/src/output` directory.

## Notes

- The script assumes that the hever api is stable and the types are constant.
- The script will not work if the `giftcard.json` file is not wrapped with `{ "corps": [...] }`

## TODO

- [ ] Upload the script to a server, and use cron job to automatically update the data every day.
