const { writeUrl } = await import(`https://esm.sh/gh/dddominikk/airtable-script-extender/src/utils/writeUrl.ts`);

const writeUrlTests = [
  { sort: 'score', order: 'asc' },
  { sort: 'id', order: 'desc', skip: 500 }
].map(ops => writeUrl('https://api.opencritic.com/api/game', ops));

const testResult = {
  message: `Successfully imported a Typescript module from a public GitHNub repo.`,
  data: { 
    writeUrl,
    writeUrlTestResults = writeUrlTests
  }
};

export default {testResult, meta: import.meta };
