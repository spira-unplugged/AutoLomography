/**
 * スクリプトプロパティから特定のキーの値を取得する関数
 * @param {string} key - プロパティ名
 * @return {string|null} - プロパティ値
 */
function getScriptProperty(key) {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty(key);
}

/**
 * スプレッドシートのA列に特定のIDが存在するかチェックし、存在する場合はプログラムを停止
 * @param {string} targetId - チェックするID
 * @return {boolean} - 存在する場合はfalseを返し、存在しない場合はtrueを返す
 */
function checkAndContinue(targetId) {
  const spreadsheetId = getScriptProperty('SPREADSHEET_ID'); // スプレッドシートIDをプロパティから取得
  const sheetName = "List"; // シート名
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

  // A列 ("id"列) を取得
  const idColumn = sheet.getRange("A:A").getValues();

  // targetIdが"id"列に存在するかチェック
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === targetId) {
      Logger.log("IDが既に存在します。プログラムを最初からやり直します。");
      return false; // プログラムを最初からやり直すために false を返す
    }
  }

  Logger.log("IDが存在しません。プログラムを続行します。");
  return true; // 続行を示すために true を返す
}

/**
 * ランダムにLomography APIから写真を取得し、Twitterで投稿し、投稿データをスプレッドシートに記録するメイン関数
 */
function autoSubmit() {
  // Lomography APIキーをプロパティから取得
  const lomographyApiKey = getScriptProperty('LOMOGRAPHY_API_KEY');

  let responseData, photoId, randomPhotoIndex; // 変数の宣言

  while (true) {
    let randomPageIndex = 1 + Math.floor(Math.random() * 19); // 1から19のページ番号をランダムに生成
    Logger.log('page no. ' + randomPageIndex);

    // APIリクエストURLを使用してLomographyから写真データを取得
    let response = UrlFetchApp.fetch(`http://api.lomography.com/v1/photos/selected?page=${randomPageIndex}&api_key=${lomographyApiKey}`);

    // 取得したJSONデータをパース
    responseData = JSON.parse(response.getContentText('UTF-8'));

    // 0から19までのランダムな整数を生成
    randomPhotoIndex = Math.floor(Math.random() * 19);
    Logger.log('photo no. ' + randomPhotoIndex);

    // 写真のIDを取得
    photoId = responseData["photos"][randomPhotoIndex]["id"];

    // IDがスプレッドシートに存在しない場合はループを抜ける
    if (checkAndContinue(photoId)) {
      break;
    }
  }

  // 写真ページのHTMLを取得し、写真のURLを抽出
  let photoHtml = UrlFetchApp.fetch(responseData["photos"][randomPhotoIndex]["url"]).getContentText('UTF-8');
  
  // `src="` で分割
  let parts = photoHtml.split('src="');
  let photoImgUrl = null;

  for (let i = 1; i < parts.length; i++) {
    let previousText = parts[i - 1]; // src=の前の部分
    if (previousText.endsWith('<img ') || previousText.endsWith('2x" ')) {
      photoImgUrl = parts[i].split('"')[0]; // 最初の `"` までを取得
      break;
    }
  }

  if (!photoImgUrl) {
    Logger.log("画像URLが見つかりませんでした。処理を中止します。");
    return;
  }

  Logger.log("画像URL: " + photoImgUrl);
  
  let photoTitle = responseData["photos"][randomPhotoIndex]["title"] || ""; // タイトルを取得
  let photoDescription = responseData["photos"][randomPhotoIndex]["description"] || ""; // 説明を取得
  let photoUrl = responseData["photos"][randomPhotoIndex]["url"]; // URLを取得

  // Twitter APIを使用して画像を投稿
  let tweetEndpoint = 'https://api.twitter.com/2/tweets'; // ツイートのエンドポイントURL
  let mediaUploadEndpoint = 'https://upload.twitter.com/1.1/media/upload.json'; // メディアアップロードのエンドポイントURL
  let metadataEndpoint = 'https://upload.twitter.com/1.1/media/metadata/create.json'; // メディアメタデータのエンドポイントURL
  let tweetText = "#film #filmphotography #lomography"; // ツイートメッセージ
  let twitterService = twitter.getService(); // メインのTwitter APIサービス
  let alternateTwitterService = getService1(); // 追加のTwitter APIサービス

  // Twitter API認証の確認
  if (!twitterService.hasAccess() || !alternateTwitterService.hasAccess()) {
    Logger.log('Twitter連携が設定されていません。設定を確認してください。');
    return;
  }

  // 画像の取得とBASE64形式への変換
  let imageBlob = UrlFetchApp.fetch(photoImgUrl).getBlob();
  let imageBase64 = Utilities.base64EncodeWebSafe(imageBlob.getBytes());

  // 画像のアップロード
  let imageUploadOptions = {
    'method': "POST",
    'payload': {
      'media_data': imageBase64
    }
  };
  let imageUploadResponse = JSON.parse(twitterService.fetch(mediaUploadEndpoint, imageUploadOptions));
  Logger.log(imageUploadResponse);
  Logger.log(imageUploadResponse["media_id_string"]);

  // 代替テキストの設定
  let altTextComponents = [];
  if (photoTitle) altTextComponents.push(`Title: ${photoTitle}`);
  if (photoDescription) altTextComponents.push(`Description: ${photoDescription}`);
  if (photoUrl) altTextComponents.push(`URL: ${photoUrl}`);
  
  let altText = {
    media_id: imageUploadResponse["media_id_string"],
    alt_text: {
      text: altTextComponents.join('\n')
    }
  };
  let metadataOptions = {
    'method': "POST",
    'contentType': "application/json",
    'payload': JSON.stringify(altText)
  };
  twitterService.fetch(metadataEndpoint, metadataOptions);

  // ツイートの送信
  let tweetOptions = {
    'text': tweetText,
    'media': {'media_ids': [imageUploadResponse["media_id_string"]]}
  };
  let tweetResponse = UrlFetchApp.fetch(tweetEndpoint, {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: 'Bearer ' + alternateTwitterService.getAccessToken()
    },
    muteHttpExceptions: true,
    payload: JSON.stringify(tweetOptions),
  });

  let tweetResult = JSON.parse(tweetResponse.getContentText());
  Logger.log(JSON.stringify(tweetResult, null, 2));

  // スプレッドシートにデータを記録
  let currentDate = new Date();
  let spreadsheetId = getScriptProperty('SPREADSHEET_ID');
  let sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("List");
  sheet.appendRow([
    photoId, photoTitle, photoDescription, photoUrl, 
    responseData["photos"][randomPhotoIndex]["asset_ratio"], 
    currentDate, tweetResult.data.id
  ]);
}