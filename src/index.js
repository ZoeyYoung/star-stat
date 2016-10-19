import getStarHistory from './getStarHistory';
import draw from './draw';
import notie from 'corner-notie';

let data = [];

let repoArr = [];
// fetch data accoding to hash
if (location.hash !== '') {
  repoArr = [...new Set(location.hash.slice(1).split('&'))];
  repoArr.forEach(async repo => {
    await fetchDataAndDraw(repo);
  })
}

document.getElementById('theForm').addEventListener('submit', async event => {
  event.preventDefault();

  // get repo str (format: 'torvalds/linux')
  let rawRepoStr = document.getElementById('repo').value;
  let repo = rawRepoStr;
  if (rawRepoStr.includes('github.com')) {
    rawRepoStr += '\/'      // make sure url end with /
    repo = /github.com\/(\S*?\/\S*?)[\/#?]/.exec(rawRepoStr)[1];
  }

  if (repo && repoArr.indexOf(repo) === -1) {
    repoArr.push(repo);
    await fetchDataAndDraw(repo);
    if (location.hash === '') {
      location.hash += repo;
    } else if (location.hash.length >= 3) { // minimal sample of repo name 'a/b'
      location.hash += '&' + repo;
    }
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  data = []
  location.hash = ''
  document.querySelector('#chart').innerHTML = '<svg></svg>'
})

async function fetchDataAndDraw(repo) {
  document.getElementById('theGif').style.visibility = 'visible';

  const starHistory = await getStarHistory(repo).catch(err => {
    notie(err, {
      type: 'warning', // info | warning | success | danger
      autoHide: true,
      timeout: 3000,
      position: 'bottom-center',
      width: 270
    });
    document.getElementById('theGif').style.visibility = 'hidden';
  });
  if (starHistory) {
    // new data
    data.push({
      key: repo,
      values: starHistory.map((item) => {
        return {
          x: new Date(new Date(item.date).setDate(1)),
          y: Number(item.starNum)
        }
      }),
    });
    draw(data)
  }
  document.getElementById('theGif').style.visibility = 'hidden';
}
