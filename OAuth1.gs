// スクリプトプロパティから公開鍵と秘密鍵を取得
var properties = PropertiesService.getScriptProperties();
var API_KEY = properties.getProperty('API_KEY');
var API_SECRET_KEY = properties.getProperty('API_SECRET_KEY');

// Twitter API用のOAuth認証インスタンスを生成
var twitter = TwitterWebService.getInstance(
  API_KEY,       // API Key
  API_SECRET_KEY // API Secret Key
);

/**
 * アプリケーションを連携認証するための関数
 */
function authorize() {
  twitter.authorize();
}

/**
 * 認証を解除するための関数
 */
function reset() {
  twitter.reset();
}

/**
 * 認証後のコールバック関数
 *
 * @param {Object} request - 認証リクエストオブジェクト
 * @return {HtmlOutput} 認証コールバックの結果
 */
function authCallback(request) {
  return twitter.authCallback(request);
}

