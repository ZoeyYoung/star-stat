import axios from 'axios';

// https://github.com/blog/1509-personal-api-tokens
// 怎么生成？
const ACCESS_TOKEN = [
  'ee3a172df9aaa8c858b5585ca53391cec47b20c0', 'da9f64e669b91d89f5abe19b313ab07a54b7c974', '31eee536d05b169b3e184e152d18775f7166123b', '9da45c0ed04c77c47278bb260d7c6b6c2c9b9fa8', 'd96ed1e68bec80e725db8f23327a96839def67a6', '569e1881d1b810c39e35c650f056ea6fac05a400'
];

// https://developer.github.com/v3/activity/starring/#list-stargazers
const axiosGit = axios.create({
  headers: {
    Accept: 'application/vnd.github.v3.star+json',
  },
  params: {
    access_token: ACCESS_TOKEN[Math.floor(Math.random() * ACCESS_TOKEN.length)],
    per_page: 100
  },
});

/**
 * generate Urls and pageNums
 * @param {sting} repo - eg: 'timqian/jsCodeStructure'
 * @return {object} {sampleUrls, pageIndexes} - urls to be fatched(length <=10) and page indexes
 */
async function generateUrls(repo) {
  let sampleUrls = [];  // store sampleUrls to be rquested

  const initUrl = `https://api.github.com/repos/${repo}/stargazers`;   // used to get star infors
  const initRes = await axiosGit.get(initUrl).catch(res => {
    throw 'No such repo or network error!';
  });

  /**
   * link Sample (no link when star < 30):
   * <https://api.github.com/repositories/40237624/stargazers?access_token=2e71ec1017dda2220ccba0f6922ecefd9ea44ac7&page=2>;
   * rel="next", <https://api.github.com/repositories/40237624/stargazers?access_token=2e71ec1017dda2220ccba0f6922ecefd9ea44ac7&page=4>;
   * rel="last"
   */
  const link = initRes.headers.link;

  if (!link) {
    throw 'Too few stars (less than 30)!';
  }

  const pageNum = /next.*?[^_]page=(\d*).*?last/.exec(link)[1]; // total page number

  // generate { sampleUrls, pageIndexes } accordingly
  for (let i = 2; i <= pageNum; i++) {
    sampleUrls.push(initUrl + '?page=' + i);
  }
  return sampleUrls;
}

/**
 * get star history
 * @param {sting} repo - eg: 'timqian/jsCodeStructure'
 * @return {array} history - eg: [{date: 2015-03-01,starNum: 12}, ...]
 */
async function getStarHistory(repo) {
  const sampleUrls = await generateUrls(repo).catch(e => {
    throw e;
  });

  // promisese to request sampleUrls
  const getArray = sampleUrls.map(url => axiosGit.get(url));

  const resArray = await Promise.all(getArray)
    .catch(res => {
      throw 'Github api limit exceeded, Try in the new hour!'
    });

  const starHistoryMap = {};
  resArray.forEach((res, i) => {
    res.data.forEach((item, i) => {
      const key = item.starred_at.slice(0, 7);
      if ({}.hasOwnProperty.call(starHistoryMap, key)) {
        starHistoryMap[item.starred_at.slice(0, 7)] += 1;
      } else {
        starHistoryMap[item.starred_at.slice(0, 7)] = 1;
      }
    });
  });

  const starHistory = [];
  for (const key of Object.keys(starHistoryMap)) {
    starHistory.push({
      date: key,
      starNum: starHistoryMap[key]
    });
  }

  return starHistory;
}

export default getStarHistory;
