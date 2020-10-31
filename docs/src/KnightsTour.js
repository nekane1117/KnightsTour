"use strict";
const unStepped = -1;
// 共有テーブルにする ?
const tableStr =
  `[
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}],
  [${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}, ${unStepped}]
]`;
// ナイトの移動方向
const KnightMove = [
  [-1, -2], // 左上
  [-2, -1], // 上左
  [-2, 1],  // 上右
  [-1, 2],  // 右上
  [1, 2],   // 右下
  [2, 1],   // 下右
  [2, -1],  // 下左
  [1, -2]   // 左下
];

/**
 * JSON用ディープコピーメソッド
 * @param       {Object} json コピー元オブジェクト
 * @return コピー結果
 */
function JsonDeepCopy(json) {
  switch (Object.prototype.toString.call(json)) {
    case "[object Object]":
      return Object.keys(json).reduce((a, c) => (a[c] = JsonDeepCopy(json[c]), a), {});
    case "[object Array]":
      return json.map(x => JsonDeepCopy(x));
    default:
      // case "[object Boolean]":
      // case "[object Number]":
      // case "[object String]":
      // case "[object Null]":
      // case "[object Undefined]":
      return json;
  }
}
/**
 * 再帰的キー存在チェック
 * @param       {Object} obj  対象のオブジェクト
 * @param       {String} path 検索したいキーのパス
 * ドット表記法またはブラケット表記法どちらも可だが、ブラケットの場合はキーにダブルクォートをつけないこと
 * {"sample" : {"child" : {"Grandson" : [0,1,2]}}}
 * 上記の場合以下のようなものが使用可能
 * "sample.child[Grandson][0]"
 */
function RecursiveIn(obj, path) { // eslint-disable-line no-unused-vars
  if (!obj) {
    // objが存在していない場合false
    return false;
  }
  // ブランケットをドットに変換して区切る
  let keys = path.replace(/\[([^\]]+)\]/g, ".$1").split(".");
  let key = keys.shift();
  // キーリストの1つ目を取得してなければfalse
  if (key in obj) {
    // 最後まで存在していたらtrue
    if (keys.length === 0) {
      return true;
    } else {
      // 子キーを持っている場合は再起的に潜っていく
      return RecursiveIn(obj[key], keys.join("."));
    }
  } else {
    // 存在しない場合はfalse
    return false;
  }
}
async function KnightsTour(json, interval = 0) {
  step(json).then((json) => {
    generateDisplay(json);
    debugLog(json);
    if (json && json.location && json.table.some(row => row.some(cell => cell === unStepped))) {
      // タイムアウトで処理を切らないと、非同期が走らない
      setTimeout(KnightsTour, interval, json, interval);
    }
  });
}
async function step(json = {
  "table": JSON.parse(tableStr),
  "location": undefined,
  "unTested": [],
}) {
  // ディープコピーして保持上書き
  json = JsonDeepCopy(json);
  if (json.location === undefined) {
    // 初回
    let y = Math.floor(Math.random() * json.table.length);
    let x = Math.floor(Math.random() * json.table[y].length);
    // // テスト用にとりあえず左上
    // let y = 0;
    // let x = 0;
    json.table[y][x] = 0;
    return {
      "table": json.table,
      "location": {
        "x": x,
        "y": y,
        "step": 0
      }
    };
  } else {
    // 終了条件
    // 終わっているはずのものはそのまま返す
    if (json.location.step === json.table.map(x => x.length).reduce((a, c) => a + c, 0)) {
      return json;
    }
    // 次の手を作る
    // 未確認のマスを取得する
    json.unTested = json.unTested || KnightMove.filter(move => isUnstepped(json.table,
      json.location.y + move[0], json.location.x + move[1])).sort((m1, m2) => {
      return childMoveCount(json.table, [json.location.y + m1[0], json.location.x + m1[1]]) -
        childMoveCount(json.table, [json.location.y + m2[0], json.location.x + m2[1]]);
    });
    // 未確認のマス全てを確認する
    while (json.unTested.length !== 0) {
      let move = json.unTested.shift();
      if (isSteppedOrDisabled(json.table, json.location.y + move[0], json.location.x + move[1])) {
        // 踏んでいるまたは無効なマスは無視する
        continue;
      }
      let newTable = JsonDeepCopy(json.table);
      let newLocation = {
        "y": json.location.y + move[0],
        "x": json.location.x + move[1],
        "step": json.location.step + 1
      };
      newTable[newLocation.y][newLocation.x] = newLocation.step;
      // if (isDeadEnd(newTable)) {
      //   continue;
      // }
      return {
        "table": newTable,
        "location": newLocation,
        "unTested": KnightMove.filter(move => isUnstepped(json.table, newLocation.y +
          move[0], newLocation.x + move[1])).sort((m1, m2) => {
          return childMoveCount(json.table, [newLocation.y + m1[0], newLocation.x + m1[1]]) -
            childMoveCount(json.table, [newLocation.y + m2[0], newLocation.x + m2[1]]);
        }),
        "parent": json
      };
    }
    // ループを抜けてしまった場合は次に踏めるマスがないので親に戻る
    return json.parent;
  }
}
// 踏んでないかチェックする
function isUnstepped(table, y, x) {
  return 0 <= y && y < table.length && 0 <= x && x < table[y].length && table[y][x] === unStepped;
}
// はみ出ていない踏んでいる
function isSteppedOrDisabled(table, y, x) {
  return !isUnstepped(table, y, x);
}
async function generateDisplay(knightsTour) {
  let mainTable = document.createElement("table");
  knightsTour.table.forEach((rows) => {
    let row = document.createElement("tr");
    mainTable.appendChild(row);
    rows.forEach((item) => {
      let td = document.createElement("td");
      row.appendChild(td);
      td.classList.add("knightTour_td");
      td.innerHTML = item === -1 ? "■" : item;
      td.style.border = "1px solid black";
      if (item === knightsTour.location.step) {
        td.style.backgroundColor = "pink";
      }
    });
  });
  document.getElementById("result").innerHTML = "";
  document.getElementById("result").appendChild(mainTable);
  let lineDIv = document.createElement("div");
  lineDIv.innerHTML = toLine(knightsTour);
  document.getElementById("result").appendChild(lineDIv);
}

function toLine(knightsTour, line = "") {
  if (RecursiveIn(knightsTour, "unTested.map")) {
    return toLine(knightsTour.parent, knightsTour.location.step + "[" + knightsTour.location.y +
      "," + knightsTour.location.x + "]:" + "[" + (function(arr) {
        let arrR = JsonDeepCopy(arr);
        arrR.reverse();
        return arrR;
      })(knightsTour.unTested).map(x => "[" + x.join(",") + "]").join(",") + "]<br>" + line);
  } else {
    return line;
  }
}

function debugLog(json) {
  console.clear(); // eslint-disable-line no-console
  console.dir(json); // eslint-disable-line no-console
}
// 移動後のテーブルから行き止まりがないか調べる
function isDeadEnd(table) {
  return table.some((row, y) => {
    return row.some((cell, x) => {
      // 未到達のセルであること
      // 全てのセルが無効か到達済み
      return cell === unStepped && KnightMove.map(move => {
        return [move[0] + y, move[1] + x];
      }).every(move => {
        return isSteppedOrDisabled(table, move[0], move[1]);
      });
    });
  });
}
// 現在地からの移動できる子の数を返す
function childMoveCount(table, location) {
  table = JsonDeepCopy(table);
  // ダミーで99を入れる
  table[location[0]][location[1]] = 99;
  return KnightMove.map(x => [location[0] + x[0], location[1] + x[1]]).reduce((a, c) => {
    // 踏んでいないマスの場合1を足す
    return isUnstepped(table, c[0], c[1]) ? a + 1 : a;
  }, 0);
}
